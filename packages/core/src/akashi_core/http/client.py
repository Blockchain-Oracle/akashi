"""Upstream client: bounded concurrency, rate limits, deadline-derived timeouts, safe failures."""

import asyncio
import time
from http import HTTPStatus
from typing import Any

import httpx2
import orjson
import stamina
from limits import parse
from limits.aio.storage import MemoryStorage, RedisStorage, Storage
from limits.aio.strategies import MovingWindowRateLimiter

from akashi_core.constants.deadlines import DEFAULT_POOL_S, KEEPALIVE_S, NOW_DEADLINE_S
from akashi_core.constants.http import HTTP_CLIENT_ERROR_MIN, HTTP_NOT_FOUND
from akashi_core.contract.enums import SourceStatus
from akashi_core.contract.sources import SourceRef
from akashi_core.deadline import current_deadline
from akashi_core.errors import UpstreamFailure
from akashi_core.http.registry import UpstreamSpec
from akashi_core.settings import get_settings

_RETRYABLE_STATUS = frozenset(
    {HTTPStatus.BAD_GATEWAY, HTTPStatus.SERVICE_UNAVAILABLE, HTTPStatus.GATEWAY_TIMEOUT}
)
_RATE_LIMITED = HTTPStatus.TOO_MANY_REQUESTS
_MS_PER_S = 1000


class RetryableStatus(Exception):
    """Raised for transient upstream statuses so stamina can retry them."""


class UpstreamClient:
    """One instance per upstream. Never raises raw httpx2 errors: only UpstreamFailure."""

    def __init__(self, spec: UpstreamSpec, storage: Storage | None = None) -> None:
        settings = get_settings()
        self.spec = spec
        self._gate = asyncio.Semaphore(spec.max_concurrency)
        self._limiter = MovingWindowRateLimiter(storage or MemoryStorage()) if spec.rate else None
        self._rate = parse(spec.rate) if spec.rate else None
        self._client = httpx2.AsyncClient(
            base_url=spec.base_url,
            http2=spec.http2,
            follow_redirects=True,
            limits=httpx2.Limits(max_connections=spec.max_concurrency, keepalive_expiry=KEEPALIVE_S),
            headers={"user-agent": f"akashi/1.0 (+{settings.repo_url}; mailto:{settings.contact_email})"},
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def _admit(self) -> None:
        if self._limiter and self._rate and not await self._limiter.hit(self._rate, self.spec.name):
            raise UpstreamFailure(self.spec.name, SourceStatus.rate_limited)

    async def request(self, method: str, url: str, **kwargs: Any) -> httpx2.Response:
        """One request under the current deadline; retries transient failures on idempotent verbs only."""
        deadline = current_deadline(NOW_DEADLINE_S)
        attempts = self.spec.retry_attempts if method in {"GET", "HEAD"} else 1
        await self._admit()
        try:
            async for attempt in stamina.retry_context(
                on=(httpx2.TransportError, RetryableStatus), attempts=attempts, timeout=deadline.remaining()
            ):
                with attempt:
                    budget = deadline.for_call(self.spec.total_s)
                    if budget <= 0:
                        raise UpstreamFailure(self.spec.name, "deadline_exceeded")
                    timeout = httpx2.Timeout(
                        budget, connect=min(self.spec.connect_s, budget), pool=DEFAULT_POOL_S
                    )
                    async with self._gate:
                        resp = await self._client.request(method, url, timeout=timeout, **kwargs)
                    if resp.status_code in _RETRYABLE_STATUS:
                        raise RetryableStatus(str(resp.status_code))
                    return resp
        except httpx2.TimeoutException as exc:
            raise UpstreamFailure(self.spec.name, "deadline_exceeded") from exc
        except (httpx2.TransportError, RetryableStatus) as exc:
            raise UpstreamFailure(self.spec.name, SourceStatus.unavailable) from exc
        raise UpstreamFailure(self.spec.name, SourceStatus.unavailable)

    async def get_json(self, url: str, **kwargs: Any) -> tuple[Any, SourceRef]:
        """GET a JSON document. 404 → UpstreamFailure(not_found); other non-2xx or non-JSON → unavailable."""
        started = time.monotonic()
        resp = await self.request("GET", url, **kwargs)
        latency = round((time.monotonic() - started) * _MS_PER_S)
        if resp.status_code == HTTP_NOT_FOUND:
            raise UpstreamFailure(self.spec.name, SourceStatus.not_found)
        if resp.status_code == _RATE_LIMITED:
            raise UpstreamFailure(self.spec.name, SourceStatus.rate_limited)
        if resp.status_code >= HTTP_CLIENT_ERROR_MIN:
            raise UpstreamFailure(self.spec.name, SourceStatus.unavailable, str(resp.status_code))
        try:
            data = orjson.loads(resp.content)
        except orjson.JSONDecodeError as exc:
            raise UpstreamFailure(self.spec.name, "decode") from exc
        return data, self.source_ref(SourceStatus.ok, url=str(resp.url), latency_ms=latency)

    def source_ref(self, status: SourceStatus, **kwargs: Any) -> SourceRef:
        return SourceRef(
            name=self.spec.name,
            status=status,
            licence=self.spec.licence,
            attribution=self.spec.attribution,
            **kwargs,
        )


def storage_for(spec: UpstreamSpec) -> Storage:
    """Shared quotas live in Redis (api + worker); everything else is per-process."""
    redis_url = get_settings().redis_url
    if spec.shared_quota and redis_url:
        return RedisStorage(redis_url, implementation="redispy")
    return MemoryStorage()
