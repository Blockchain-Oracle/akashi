"""OpenAPI summaries and descriptions for the live-facts routes (the API reference and the card's spec read these)."""

from typing import TypedDict

from akashi_core.constants.deadlines import NOW_DEADLINE_S
from akashi_now.constants import (
    FX_MAX_QUOTES,
    JOBS_MAX_COMPANIES,
    JOBS_MAX_LIMIT,
    JOBS_MAX_POSTED_WITHIN_DAYS,
    MAX_BUSINESS_DAY_SPAN,
    MAX_CONVERT_TO,
    MAX_HOLIDAY_YEAR,
    MIN_HOLIDAY_YEAR,
    NEWS_MAX_LIMIT,
    NEWS_MAX_SINCE_HOURS,
    STOCKS_LICENCE,
    STOCKS_MAX_SYMBOLS,
)

HARD_STOP = f"Hard stop {NOW_DEADLINE_S:g} s."

ROUTES: dict[str, tuple[str, str]] = {
    "time": (
        "Current time in a zone",
        "The time in an IANA zone, city or country (now, or at a given instant), its UTC offset and abbreviation, "
        f"the next daylight-saving change, and conversions to up to {MAX_CONVERT_TO} other zones. Computed from the "
        f"pinned tz database, which the answer names alongside the latest published release. {HARD_STOP}",
    ),
    "holidays": (
        "Public and market holidays",
        f"Holidays for a country (optionally a subdivision) or a market calendar such as NYSE, for a year from "
        f"{MIN_HOLIDAY_YEAR} to {MAX_HOLIDAY_YEAR}. python-holidays, Nager.Date and OpenHolidays are merged by date; "
        f"each holiday lists the sources that carry it, and the answer says whether they agree. {HARD_STOP}",
    ),
    "business-days": (
        "Count or add business days",
        "Business days between two dates, or the date a number of business days away (up to "
        f"{MAX_BUSINESS_DAY_SPAN} either way), on a country's public calendar or a market calendar. The answer "
        f"lists the holidays it skipped and the weekend it assumed. {HARD_STOP}",
    ),
    "fx": (
        "Exchange rates from central banks",
        f"Rates from one currency to up to {FX_MAX_QUOTES} others, taken from the issuing central banks and other "
        "independent publishers (via Frankfurter, with the ECB file as a fallback). Each fixing carries its date "
        "and age by its publisher's own schedule; the answer gives the spread between them and whether they agree. "
        f"{HARD_STOP}",
    ),
    "weather": (
        "Current weather",
        "The forecast for the current hour at coordinates or a named place, from MET Norway, cross-checked "
        "against the US National Weather Service (and its alerts) inside the US. Temperatures from both are "
        f"compared in °C. {HARD_STOP}",
    ),
    "fact": (
        "A current Wikidata statement",
        "The current value of a property of an entity (QIDs and PIDs, or names and aliases), taken from Wikidata: "
        "the preferred, still-valid statement with its start date, plus the Wikipedia summary link. "
        f"{HARD_STOP}",
    ),
    "news": (
        "Recent headlines",
        f"Headlines from the last {NEWS_MAX_SINCE_HOURS} hours at most, matching a query: a local index of GDELT's "
        f"15-minute updates merged with Hacker News, duplicates removed, up to {NEWS_MAX_LIMIT} stories. "
        f"Headline, link and domain only. {HARD_STOP}",
    ),
    "stocks": (
        "US stock quotes (demo-grade)",
        f"Quotes for up to {STOCKS_MAX_SYMBOLS} US tickers. Each ticker is first checked against the symbols that "
        "traded in the last session (a typo gets suggestions, not another instrument's price); the price comes "
        "from Twelve Data and the last official close is compared with Massive's. Labelled "
        f"'{STOCKS_LICENCE}'; may be switched off on a deployment. {HARD_STOP}",
    ),
    "jobs": (
        "Job postings",
        "Postings from the public job boards of listed companies (Greenhouse, Lever, Ashby), refreshed every few "
        f"hours: filter by words, up to {JOBS_MAX_COMPANIES} companies, location, remote, salary and age (up to "
        f"{JOBS_MAX_POSTED_WITHIN_DAYS} days); up to {JOBS_MAX_LIMIT} results. {HARD_STOP}",
    ),
}


class RouteDocs(TypedDict):
    operation_id: str
    summary: str
    description: str


def route_docs(name: str) -> RouteDocs:
    """operation_id, summary and description for a route, as keyword arguments to the router decorator."""
    summary, description = ROUTES[name]
    return RouteDocs(operation_id=name, summary=summary, description=description)
