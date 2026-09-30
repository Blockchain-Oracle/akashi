"""/stocks request and result."""

import re
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator

from akashi_core.contract.enums import Agreement
from akashi_core.contract.fields import UntrustedStr
from akashi_now.constants import STOCKS_MAX_SYMBOLS, TICKER_CLASS_SEPARATORS, TICKER_MAX_CHARS, TICKER_PATTERN
from akashi_now.provenance import Provenance
from akashi_now.stocks.market_hours import MarketState

Ticker = Annotated[
    str,
    Field(
        min_length=1,
        max_length=TICKER_MAX_CHARS,
        pattern=TICKER_PATTERN,
        description="US-listed ticker, e.g. AAPL, SPY or BRK.B (BRK-B and BRK/B are read as BRK.B)",
    ),
]
_CLASS_SEPARATOR = re.compile(f"[{re.escape(TICKER_CLASS_SEPARATORS)}]")


def normalize_ticker(raw: str) -> str:
    return _CLASS_SEPARATOR.sub(".", raw.upper())


class StocksRequest(BaseModel):
    symbols: list[Ticker] = Field(min_length=1, max_length=STOCKS_MAX_SYMBOLS)

    @field_validator("symbols")
    @classmethod
    def _normalize(cls, v: list[str]) -> list[str]:
        return list(dict.fromkeys(normalize_ticker(s) for s in v))


class QuoteStatus(StrEnum):
    ok = "ok"
    not_found = "not_found"  # did not trade on a US exchange in the last session (typo, delisted, not US-listed)
    unavailable = "unavailable"  # a real ticker, but no price source answered in time


class Suggestion(BaseModel):
    symbol: str
    name: UntrustedStr | None = None


class CloseCheck(BaseModel):
    """The one number both feeds publish independently: the official close of the same session."""

    session_date: str
    twelvedata: float
    massive: float
    agreement: Agreement
    spread_pct: float | None


class MarketClock(BaseModel):
    calendar: Literal["NYSE"] = "NYSE"
    state: MarketState
    session_date: str | None  # today's trading session, if today is a trading day
    closes_at: str | None  # today's closing bell (13:00 New York time on early-close days)
    early_close: bool = False
    last_close_at: str  # the most recent closing bell
    next_open_at: str


class StockQuote(BaseModel):
    kind: Literal["quote"] = "quote"
    symbol: str
    status: QuoteStatus
    name: UntrustedStr | None = None
    exchange: UntrustedStr | None = None
    mic_code: UntrustedStr | None = None
    currency: UntrustedStr | None = None
    price: float | None = None
    price_is_close: bool = False  # the official close of session_date, not an intraday print
    price_as_of: str | None = None
    session_date: str | None = None  # the trading day `price` belongs to
    previous_close: float | None = None
    change: float | None = None
    change_pct: float | None = None
    open: float | None = None
    high: float | None = None
    low: float | None = None
    volume: int | None = None
    close_check: CloseCheck | None = None
    suggestions: list[Suggestion] = Field(default_factory=list)
    market: MarketClock
    provenance: Provenance
    notes: list[str] = Field(default_factory=list)
