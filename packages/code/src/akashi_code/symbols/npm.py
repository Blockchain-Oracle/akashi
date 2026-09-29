"""npm symbols via the ts-introspect sidecar (TypeScript Compiler API over the package's .d.ts files)."""

from functools import cache

from akashi_code.constants import RETRY_AFTER_MS, TS_INTROSPECT_BACKGROUND_S, TS_INTROSPECT_TOTAL_S
from akashi_code.symbols.base import SymbolAnswer
from akashi_core.constants.http import HTTP_CLIENT_ERROR_MIN, HTTP_NOT_FOUND
from akashi_core.contract.enums import SourceStatus, Tristate
from akashi_core.errors import UpstreamFailure
from akashi_core.http.client import UpstreamClient
from akashi_core.http.registry import UpstreamSpec
from akashi_core.settings import get_settings
from akashi_core.singleflight import spawn_background

REASON_PENDING = "types_building"


@cache
def _client() -> UpstreamClient:
    return UpstreamClient(
        UpstreamSpec(
            "ts-introspect",
            get_settings().ts_introspect_url,
            max_concurrency=4,
            total_s=TS_INTROSPECT_TOTAL_S,
            retry_attempts=1,
        )
    )


@cache
def _background_client() -> UpstreamClient:
    return UpstreamClient(
        UpstreamSpec(
            "ts-introspect",
            get_settings().ts_introspect_url,
            max_concurrency=2,
            total_s=TS_INTROSPECT_BACKGROUND_S,
            retry_attempts=1,
        )
    )


def _payload(package: str, version: str | None, symbol: str) -> dict[str, object]:
    return {"pkg": package, "version": version or "latest", "symbols": [symbol]}


async def _warm(package: str, version: str | None, symbol: str) -> None:
    await _background_client().request("POST", "/symbols", json=_payload(package, version, symbol))


async def lookup(package: str, version: str | None, symbol: str) -> tuple[SymbolAnswer, str | None]:
    try:
        resp = await _client().request("POST", "/symbols", json=_payload(package, version, symbol))
    except UpstreamFailure as failure:
        if failure.kind == "deadline_exceeded":
            spawn_background(f"ts-introspect:{package}@{version}", _warm(package, version, symbol))
            answer = SymbolAnswer(Tristate.unknown, reason=REASON_PENDING, evidence_source="d.ts")
            answer.pending, answer.retry_after_ms = True, RETRY_AFTER_MS
            return answer, version
        raise
    if resp.status_code == HTTP_NOT_FOUND:
        raise UpstreamFailure("npm", SourceStatus.not_found)
    if resp.status_code >= HTTP_CLIENT_ERROR_MIN:
        raise UpstreamFailure("ts-introspect", SourceStatus.unavailable, str(resp.status_code))
    data = resp.json()
    item = data["results"][0]
    answer = SymbolAnswer(
        Tristate(item["exists"]),
        item.get("kind"),
        item.get("signature"),
        item.get("overloads", []),
        defined_in=item.get("defined_in"),
        siblings=item.get("siblings", []),
        evidence_source="d.ts",
        reason=item.get("reason"),
        suggest_for=item.get("suggest_for"),
    )
    return answer, data.get("version")
