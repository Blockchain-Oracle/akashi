"""/stocks: a demo-grade quote per ticker. The ticker is checked against the last session's US listings, the live
price comes from Twelve Data, and the last official close is cross-checked against Massive's independent feed."""

from datetime import UTC, date, datetime, timedelta
from typing import Any

from anyio import to_thread

from akashi_core.contract.enums import Agreement, CacheState, SourceStatus
from akashi_core.contract.sources import SourceRef
from akashi_core.errors import UnsupportedInput, UpstreamFailure
from akashi_core.settings import get_settings
from akashi_core.singleflight import spawn_background
from akashi_now.consensus import numeric
from akashi_now.constants import (
    MASSIVE,
    PRICE_DECIMALS,
    QUOTE_CLOSE_SETTLE,
    SEC_TICKERS,
    STOCK_CLOSE_AGREE_PCT,
    STOCK_CLOSE_MINOR_PCT,
    STOCKS_LICENCE,
    TTL_QUOTE_LIVE,
    TWELVEDATA,
)
from akashi_now.provenance import Freshness, Provenance, age_seconds, now_utc
from akashi_now.stocks import massive, sec_tickers, suggest, twelvedata
from akashi_now.stocks.market_hours import Clock, MarketState, clock, close_at, previous_session
from akashi_now.stocks.massive import Universe
from akashi_now.stocks.models import CloseCheck, MarketClock, QuoteStatus, StockQuote, StocksRequest, Suggestion

DEMO_NOTE = "demo-grade quotes from free data plans: not for redistribution or trading decisions"
LIVE_NOTE = "the live price has one source (Twelve Data); the feeds are cross-checked on the last official close"
BOTH_FEEDS = f"{TWELVEDATA.attribution}; close cross-checked with {MASSIVE.attribution}"


def quote_ttl(clk: Clock, now: datetime) -> timedelta:
    """A minute while prices move (and while the close settles); after that, nothing changes until the next open."""
    if clk.state is MarketState.open or now - clk.last_close.closes < QUOTE_CLOSE_SETTLE:
        return TTL_QUOTE_LIVE
    return max(clk.next_open - now, TTL_QUOTE_LIVE)


def _market(clk: Clock) -> MarketClock:
    return MarketClock(
        state=clk.state,
        session_date=clk.today.day.isoformat() if clk.today else None,
        closes_at=clk.today.closes.isoformat() if clk.today else None,
        early_close=bool(clk.today and clk.today.early_close),
        last_close_at=clk.last_close.closes.isoformat(),
        next_open_at=clk.next_open.isoformat(),
    )


def _num(row: dict[str, Any], field: str) -> float | None:
    try:
        return round(float(row[field]), PRICE_DECIMALS)
    except (KeyError, TypeError, ValueError):
        return None


def _session_of(row: dict[str, Any]) -> date | None:
    try:
        return date.fromisoformat(str(row.get("datetime"))[:10])
    except ValueError:
        return None


def _close_check(symbol: str, row: dict[str, Any], session: date, universe: Universe | None) -> CloseCheck | None:
    """Compare the close of the session Massive published: Twelve Data's close for that day, or its previous_close
    when Twelve Data has already moved on to the next session."""
    if universe is None or (theirs := universe.closes.get(symbol)) is None:
        return None
    if session == universe.session:
        ours = _num(row, "close")
    elif session > universe.session and previous_session(session).day == universe.session:
        ours = _num(row, "previous_close")
    else:
        return None
    if ours is None:
        return None
    c = numeric([ours, theirs], STOCK_CLOSE_AGREE_PCT, STOCK_CLOSE_MINOR_PCT)
    return CloseCheck(
        session_date=universe.session.isoformat(),
        twelvedata=ours,
        massive=theirs,
        agreement=c.agreement,
        spread_pct=c.spread_pct,
    )


def _freshness(session: date | None, clk: Clock, now: datetime) -> tuple[Freshness, str | None]:
    live = clk.today.day if clk.today and now >= clk.today.opens else None
    if session is not None and session == (live or clk.last_close.day):
        return Freshness.fresh, None
    if session is not None and live and session == clk.last_close.day:
        return Freshness.lagging, "no trade yet in today's session: the price is the last close"
    return Freshness.stale, f"last traded {session or 'on an unknown date'}: halted, delisted or a different instrument"


def _from_twelvedata(
    symbol: str, row: dict[str, Any], universe: Universe | None, clk: Clock, now: datetime, market: MarketClock
) -> StockQuote:
    session = _session_of(row)
    stamp = row.get("last_quote_at") or row.get("timestamp")
    as_of = datetime.fromtimestamp(stamp, UTC) if isinstance(stamp, int) else None
    is_close = session is not None and session <= clk.last_close.day
    freshness, stale_note = _freshness(session, clk, now)
    check = _close_check(symbol, row, session, universe) if session else None
    volume = _num(row, "volume")
    return StockQuote(
        symbol=symbol,
        status=QuoteStatus.ok,
        name=row.get("name"),
        exchange=row.get("exchange"),
        mic_code=row.get("mic_code"),
        currency=row.get("currency"),
        price=_num(row, "close"),
        price_is_close=is_close,
        price_as_of=as_of.isoformat() if as_of else None,
        session_date=session.isoformat() if session else None,
        previous_close=_num(row, "previous_close"),
        change=_num(row, "change"),
        change_pct=_num(row, "percent_change"),
        open=_num(row, "open"),
        high=_num(row, "high"),
        low=_num(row, "low"),
        volume=int(volume) if volume is not None else None,
        close_check=check,
        market=market,
        provenance=Provenance(
            sources=[TWELVEDATA.name, *([MASSIVE.name] if check else [])],
            as_of=as_of.isoformat() if as_of else None,
            age_seconds=age_seconds(as_of) if as_of else None,
            freshness=freshness,
            agreement=check.agreement if check else Agreement.single_source,
            spread_pct=check.spread_pct if check else None,
            licence=STOCKS_LICENCE,
            attribution=BOTH_FEEDS if check else TWELVEDATA.attribution,
        ),
        notes=[n for n in (stale_note, None if is_close else LIVE_NOTE) if n],
    )


def _from_massive(symbol: str, universe: Universe, clk: Clock, market: MarketClock, reason: str) -> StockQuote:
    """Twelve Data could not price it: the official close from the all-market file, labelled as such."""
    bell = close_at(universe.session)
    current = universe.session == clk.last_close.day and clk.state is not MarketState.open
    return StockQuote(
        symbol=symbol,
        status=QuoteStatus.ok,
        price=universe.closes[symbol],
        price_is_close=True,
        price_as_of=bell.isoformat(),
        session_date=universe.session.isoformat(),
        market=market,
        provenance=Provenance(
            sources=[MASSIVE.name],
            as_of=bell.isoformat(),
            age_seconds=age_seconds(bell),
            freshness=Freshness.fresh if current else Freshness.lagging,
            licence=STOCKS_LICENCE,
            attribution=MASSIVE.attribution,
        ),
        notes=[f"no live quote ({reason}): this is the official close of {universe.session}"],
    )


def _not_found(
    symbol: str, universe: Universe | None, market: MarketClock, suggestions: list[Suggestion]
) -> StockQuote:
    where = f"on a US exchange on {universe.session}" if universe else "in Twelve Data's US listings"
    return StockQuote(
        symbol=symbol,
        status=QuoteStatus.not_found,
        suggestions=suggestions,
        market=market,
        provenance=Provenance(
            sources=[MASSIVE.name if universe else TWELVEDATA.name],
            as_of=universe.session.isoformat() if universe else None,
            freshness=Freshness.fresh,
            licence=STOCKS_LICENCE,
        ),
        notes=[f"{symbol} did not trade {where}: a typo, a delisted company or not a US listing"],
    )


def _failed(failure: UpstreamFailure) -> SourceStatus:
    return SourceStatus.rate_limited if failure.kind == SourceStatus.rate_limited else SourceStatus.unavailable


async def _universe(clk: Clock, refs: list[SourceRef]) -> Universe | None:
    if get_settings().massive_api_key is None:
        return None  # tickers are then judged by Twelve Data alone (and the stale-session check)
    try:
        universe = await massive.current(clk.last_close.day)
    except UpstreamFailure as failure:
        refs.append(SourceRef(name=MASSIVE.name, status=_failed(failure)))
        return None
    status = SourceStatus.ok if universe else SourceStatus.unavailable
    refs.append(
        SourceRef(
            name=MASSIVE.name,
            status=status,
            as_of=universe.session.isoformat() if universe else None,
            licence=MASSIVE.licence,
            attribution=MASSIVE.attribution,
        )
    )
    return universe


async def _suggestions(unknown: list[str], universe: Universe, refs: list[SourceRef]) -> dict[str, list[Suggestion]]:
    try:
        names = await sec_tickers.names()
        refs.append(SourceRef(name=SEC_TICKERS.name, status=SourceStatus.ok, attribution=SEC_TICKERS.attribution))
    except UpstreamFailure as failure:
        names = {}
        refs.append(SourceRef(name=SEC_TICKERS.name, status=_failed(failure)))
    return {s: await to_thread.run_sync(suggest.rank, s, universe, names) for s in unknown}


def warm_up() -> None:
    """Called from the api lifespan: fetch the ticker universe in the background when stocks are on."""
    settings = get_settings()
    if settings.stocks_enabled and settings.massive_api_key:
        spawn_background("stocks-universe", massive.warm(clock(now_utc()).last_close.day))


async def get_stocks(req: StocksRequest) -> tuple[list[StockQuote], list[SourceRef], list[str], list[str]]:
    settings = get_settings()
    if not (settings.stocks_enabled and settings.twelvedata_api_key):
        raise UnsupportedInput("Stock quotes are switched off on this deployment.")
    now = now_utc()
    clk = clock(now)
    market = _market(clk)
    refs: list[SourceRef] = []
    universe = await _universe(clk, refs)
    listed = [s for s in req.symbols if universe is None or s in universe.closes]
    rows = await twelvedata.cached(listed)
    td_status: SourceStatus | None = SourceStatus.ok if listed else None
    latency_ms = None
    if misses := [s for s in listed if s not in rows]:
        try:
            fetched, latency_ms = await twelvedata.fetch(misses, quote_ttl(clk, now))
            rows |= fetched
        except UpstreamFailure as failure:
            td_status = _failed(failure)
    if td_status is not None:
        refs.append(
            SourceRef(
                name=TWELVEDATA.name,
                status=td_status,
                cache=CacheState.miss if misses else CacheState.hit,
                latency_ms=latency_ms,
                licence=TWELVEDATA.licence,
                attribution=TWELVEDATA.attribution,
            )
        )
    unknown = [s for s in req.symbols if s not in listed]
    hints = await _suggestions(unknown, universe, refs) if unknown and universe else {}
    results = []
    for symbol in req.symbols:
        if (row := rows.get(symbol)) is not None:
            results.append(_from_twelvedata(symbol, row, universe, clk, now, market))
        elif universe is not None and symbol in universe.closes:
            reason = f"{TWELVEDATA.name} {td_status}" if td_status is not SourceStatus.ok else "not in Twelve Data"
            results.append(_from_massive(symbol, universe, clk, market, reason))
        elif universe is not None or td_status is SourceStatus.ok:
            results.append(_not_found(symbol, universe, market, hints.get(symbol, [])))
        else:
            results.append(
                StockQuote(symbol=symbol, status=QuoteStatus.unavailable, market=market, provenance=Provenance())
            )
    unavailable = [r.name for r in refs if r.status is not SourceStatus.ok]
    return results, refs, unavailable, [DEMO_NOTE]
