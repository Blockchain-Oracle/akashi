"""Massive grouped daily: every US-listed ticker's official close for one session, in one call per trading day.

It serves twice. It is the list of symbols that really trade (Twelve Data answers the typo APPLX with an unrelated
fund last priced months earlier, and the SEC list has no ETFs), and it is the second, independent close for the
cross-check. The free plan publishes a session's file some time after the bell, so the newest file on hand keeps
answering while the next one is fetched in the background: a ticker that traded yesterday is still a ticker.
"""

from dataclasses import dataclass
from datetime import date
from functools import cache
from typing import Any

import structlog

from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache as store
from akashi_core.contract.enums import SourceStatus
from akashi_core.deadline import Deadline, set_deadline
from akashi_core.errors import UpstreamFailure
from akashi_core.http.client import UpstreamClient
from akashi_core.settings import get_settings
from akashi_core.singleflight import SingleFlight, spawn_background
from akashi_now import clients
from akashi_now.constants import MASSIVE, TTL_UNIVERSE_EMPTY, UNIVERSE_REFRESH_BUDGET_S
from akashi_now.stocks.market_hours import previous_session

client = cache(lambda: UpstreamClient(MASSIVE))
clients.register(client)
log = structlog.get_logger(__name__)

LATEST_KEY = cache_key("now", "massive", "grouped", "latest")  # no TTL: replaced by each newer session


@dataclass(frozen=True, slots=True)
class Universe:
    session: date
    closes: dict[str, float]
    dollar_volume: dict[str, float]  # ranks suggestions: AAPL before APLE for "APPL"


@dataclass(slots=True)
class _Memo:
    universe: Universe | None = None


_memo = _Memo()
_flight: SingleFlight[Universe | None] = SingleFlight()


def _empty_key(day: date) -> str:
    return cache_key("now", "massive", "grouped-empty", day.isoformat())


def _decode(blob: dict[str, Any]) -> Universe:
    rows: dict[str, list[float]] = blob["rows"]
    return Universe(
        session=date.fromisoformat(blob["session"]),
        closes={t: row[0] for t, row in rows.items()},
        dollar_volume={t: row[1] for t, row in rows.items()},
    )


async def _fetch(day: date) -> Universe | None:
    """One session's file, or None when it is not published (yet, or ever: a closure)."""
    key = get_settings().massive_api_key
    if key is None:
        raise UpstreamFailure(MASSIVE.name, SourceStatus.unavailable, "no key")
    body, _ = await client().get_json(
        f"/v2/aggs/grouped/locale/us/market/stocks/{day.isoformat()}",
        params={"adjusted": "true"},
        headers={"authorization": f"Bearer {key.get_secret_value()}"},
    )
    bars = body.get("results") if isinstance(body, dict) else None
    if not bars:
        return None
    rows = {
        bar["T"]: [bar["c"], round(bar.get("v", 0) * bar.get("vw", bar["c"]))]
        for bar in bars
        if isinstance(bar.get("T"), str) and isinstance(bar.get("c"), int | float)
    }
    await store.set(LATEST_KEY, {"session": day.isoformat(), "rows": rows})
    return _decode({"session": day.isoformat(), "rows": rows})


async def _refresh(target: date, newer_than: date | None) -> Universe | None:
    """The target session's file, else the one before it; each missing file is remembered for a while."""
    for day in (target, previous_session(target).day):
        if (newer_than and day <= newer_than) or await store.get(_empty_key(day)) is not None:
            continue
        if (universe := await _fetch(day)) is not None:
            _memo.universe = universe
            return universe
        await store.set(_empty_key(day), True, TTL_UNIVERSE_EMPTY)
    return None


async def _background_refresh(target: date, newer_than: date) -> Universe | None:
    set_deadline(Deadline(UNIVERSE_REFRESH_BUDGET_S))  # this task's own budget, not the request's
    try:
        return await _refresh(target, newer_than)
    except UpstreamFailure as failure:
        log.warning("universe_refresh_failed", kind=failure.kind)
        return None


async def current(target: date) -> Universe | None:
    """The newest universe on hand; refreshes toward `target` (the last completed session) in the background.

    Blocks (under the request deadline) only when nothing has ever been fetched. Raises UpstreamFailure then.
    """
    have = _memo.universe
    if have is None and (blob := await store.get(LATEST_KEY)) is not None:  # after a restart
        _memo.universe = have = _decode(blob)
    if have is None:
        return await _flight.do(target.isoformat(), lambda: _refresh(target, None))
    if have.session >= target:
        return have
    held = have.session
    if not _flight.is_running(target.isoformat()) and await store.get(_empty_key(target)) is None:
        spawn_background("massive-grouped", _flight.do(target.isoformat(), lambda: _background_refresh(target, held)))
    return have


async def warm(target: date) -> None:
    """At startup, so the first /stocks request does not pay for the all-market file."""
    set_deadline(Deadline(UNIVERSE_REFRESH_BUDGET_S))
    try:
        await current(target)
    except UpstreamFailure as failure:
        log.warning("universe_warm_failed", kind=failure.kind)
