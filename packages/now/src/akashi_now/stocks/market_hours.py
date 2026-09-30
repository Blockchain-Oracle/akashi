"""The NYSE clock: trading days and early closes from python-holidays, session hours in New York time."""

import re
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from enum import StrEnum
from functools import cache
from zoneinfo import ZoneInfo

import holidays as holidays_lib
from holidays.constants import HALF_DAY

from akashi_now.constants import (
    NYSE_AFTER_HOURS_SPAN,
    NYSE_CALENDAR,
    NYSE_EARLY_CLOSE,
    NYSE_PRE_MARKET_OPEN,
    NYSE_REGULAR_CLOSE,
    NYSE_REGULAR_OPEN,
    NYSE_SESSION_SEARCH_DAYS,
    NYSE_ZONE,
    WEEKEND_DAYS,
)

NEW_YORK = ZoneInfo(NYSE_ZONE)
NOON_HOUR = 12
_CLOSE_AT = re.compile(r"close at (\d{1,2}):(\d{2})\s*pm", re.IGNORECASE)  # "(markets close at 1:00pm)"


class MarketState(StrEnum):
    open = "open"
    pre_market = "pre_market"
    after_hours = "after_hours"
    closed = "closed"


@dataclass(frozen=True, slots=True)
class Session:
    day: date
    opens: datetime  # aware, New York time
    closes: datetime
    early_close: bool


@dataclass(frozen=True, slots=True)
class Clock:
    state: MarketState
    today: Session | None  # today's session when today is a trading day (whatever the hour)
    last_close: Session  # the most recent session whose closing bell has rung
    next_open: datetime


def _close_time(name: str) -> time:
    if match := _CLOSE_AT.search(name):
        return time(int(match[1]) % NOON_HOUR + NOON_HOUR, int(match[2]))
    return NYSE_EARLY_CLOSE


@cache
def _closures(year: int) -> frozenset[date]:
    return frozenset(holidays_lib.financial_holidays(NYSE_CALENDAR, years=year))


@cache
def _early_closes(year: int) -> dict[date, time]:
    half_days = holidays_lib.financial_holidays(NYSE_CALENDAR, years=year, categories=(HALF_DAY,))
    return {day: _close_time(name) for day, name in half_days.items()}


def session_on(day: date) -> Session | None:
    if day.weekday() in WEEKEND_DAYS or day in _closures(day.year):
        return None
    close = _early_closes(day.year).get(day, NYSE_REGULAR_CLOSE)
    return Session(
        day=day,
        opens=datetime.combine(day, NYSE_REGULAR_OPEN, NEW_YORK),
        closes=datetime.combine(day, close, NEW_YORK),
        early_close=close != NYSE_REGULAR_CLOSE,
    )


def _step(start: date, direction: int) -> Session:
    """The nearest session strictly before (direction −1) or after (+1) `start`."""
    for offset in range(1, NYSE_SESSION_SEARCH_DAYS + 1):
        if (session := session_on(start + timedelta(days=offset * direction))) is not None:
            return session
    raise LookupError(f"no NYSE session within {NYSE_SESSION_SEARCH_DAYS} days of {start}")


def previous_session(day: date) -> Session:
    return _step(day, -1)


def close_at(day: date) -> datetime:
    """The closing bell of a trading day (early closes included)."""
    session = session_on(day)
    return session.closes if session else datetime.combine(day, NYSE_REGULAR_CLOSE, NEW_YORK)


def _state(local: datetime, today: Session | None) -> MarketState:
    if today is None:
        return MarketState.closed
    if today.opens <= local < today.closes:
        return MarketState.open
    if datetime.combine(today.day, NYSE_PRE_MARKET_OPEN, NEW_YORK) <= local < today.opens:
        return MarketState.pre_market
    if today.closes <= local < today.closes + NYSE_AFTER_HOURS_SPAN:
        return MarketState.after_hours
    return MarketState.closed


def clock(now: datetime) -> Clock:
    local = now.astimezone(NEW_YORK)
    today = session_on(local.date())
    last_close = today if today and local >= today.closes else previous_session(local.date())
    next_open = today.opens if today and local < today.opens else _step(local.date(), 1).opens
    return Clock(state=_state(local, today), today=today, last_close=last_close, next_open=next_open)
