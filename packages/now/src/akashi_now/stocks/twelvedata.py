"""Twelve Data /quote: the latest regular-session price, one batch call for the symbols not in cache.

Each symbol costs one credit of the free plan's 8 a minute, so the rate limiter is charged per symbol.
The key goes in a header, never the URL (URLs reach SourceRef and logs).
"""

import asyncio
from datetime import timedelta
from functools import cache
from typing import Any

from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache as store
from akashi_core.contract.enums import SourceStatus
from akashi_core.errors import UpstreamFailure
from akashi_core.http.client import UpstreamClient
from akashi_core.settings import get_settings
from akashi_now import clients
from akashi_now.constants import TWELVEDATA

client = cache(lambda: UpstreamClient(TWELVEDATA))
clients.register(client)

US_LISTINGS = "United States"  # pin dual listings (SHOP, RY) to the US line whatever the default becomes
ERROR = "error"  # Twelve Data reports per-symbol (and some whole-call) errors inside a 200 body
RATE_LIMITED_CODE = 429


def _key(symbol: str) -> str:
    return cache_key("now", "twelvedata", "quote", symbol)


async def cached(symbols: list[str]) -> dict[str, dict[str, Any]]:
    hits = await asyncio.gather(*(store.get(_key(s)) for s in symbols))
    return {s: row for s, row in zip(symbols, hits, strict=True) if row is not None}


async def fetch(symbols: list[str], ttl: timedelta) -> tuple[dict[str, dict[str, Any]], int | None]:
    """Rows keyed by symbol (a symbol Twelve Data cannot price is absent) and the call's latency in ms.

    Raises UpstreamFailure when the call itself fails.
    """
    key = get_settings().twelvedata_api_key
    if key is None:
        raise UpstreamFailure(TWELVEDATA.name, SourceStatus.unavailable, "no key")
    body, ref = await client().get_json(
        "/quote",
        params={"symbol": ",".join(symbols), "country": US_LISTINGS},
        headers={"authorization": f"apikey {key.get_secret_value()}"},
        cost=len(symbols),
    )
    if not isinstance(body, dict):
        raise UpstreamFailure(TWELVEDATA.name, "decode")
    if body.get("status") == ERROR:
        kind = SourceStatus.rate_limited if body.get("code") == RATE_LIMITED_CODE else SourceStatus.unavailable
        raise UpstreamFailure(TWELVEDATA.name, kind, str(body.get("code")))
    by_symbol = {symbols[0]: body} if "symbol" in body else body  # one symbol → a flat object; several → keyed
    rows = {
        s: row
        for s, row in by_symbol.items()
        if s in symbols and isinstance(row, dict) and row.get("status") != ERROR and row.get("close") is not None
    }
    await asyncio.gather(*(store.set(_key(s), row, ttl) for s, row in rows.items()))
    return rows, ref.latency_ms
