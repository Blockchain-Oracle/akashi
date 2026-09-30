"""live-facts constants (specs/backend.md §3.3; upstream facts verified live 2026-09-29)."""

from datetime import time, timedelta
from typing import Final

from akashi_core.http.registry import UpstreamSpec

# --- upstreams ---
IANA = UpstreamSpec("iana", "https://data.iana.org", max_concurrency=2, total_s=2.0, attribution="IANA tz database")
WIKIDATA_API = UpstreamSpec(
    "wikidata", "https://www.wikidata.org", max_concurrency=4, total_s=2.5, licence="CC0", attribution="Wikidata"
)

# --- /time ---
MAX_PLACE_CHARS: Final = 100
MAX_CONVERT_TO: Final = 10
TRANSITION_SCAN_DAYS: Final = 730  # look two years ahead for the next offset change
TRANSITION_PRECISION_S: Final = 1
PLACE_MATCH_MIN: Final = 90  # rapidfuzz WRatio for a zone-city or country-name match
TTL_TZDB_LATEST: Final = timedelta(hours=24)
SECONDS_PER_MINUTE: Final = 60
MINUTES_PER_HOUR: Final = 60

# --- geocoding (Wikidata: CC0; place → coordinates + country) ---
GEOCODE_CANDIDATES: Final = 8  # "Washington, D.C." is the 5th hit for "Washington"
TTL_GEOCODE: Final = timedelta(days=30)
GEOCODE_CACHE_KIND: Final = "geocode-r3"  # bump when the choice logic changes: old answers live 30 days
PLACE_NAME_SEPARATORS: Final = (" ", ",", "-", "(")  # "New York City", "Washington, D.C." name the query + more
WIKIDATA_COUNTRY: Final = "P17"

# --- /holidays, /business-days ---
NAGER = UpstreamSpec(
    "nager.date", "https://date.nager.at", max_concurrency=4, total_s=1.5, licence="MIT", attribution="Nager.Date"
)
OPENHOLIDAYS = UpstreamSpec(
    "openholidays",
    "https://openholidaysapi.org",
    max_concurrency=4,
    total_s=1.5,
    licence="ODbL",
    attribution="OpenHolidays API",
)
HOLIDAYS_LIB = "python-holidays"
HOLIDAYS_LIB_LICENCE = "MIT"
MIN_HOLIDAY_YEAR: Final = 1900
MAX_HOLIDAY_YEAR: Final = 2100
TTL_HOLIDAYS: Final = timedelta(hours=24)
MINOR_DIFF_MAX_DATES: Final = 3  # calendars differing on ≤ this many dates (observed shifts, regional scope) are minor
MINOR_DIFF_MAX_SHARE: Final = 0.2
MAX_BUSINESS_DAY_SPAN: Final = 3_650
PUBLIC_CALENDAR: Final = "public"
CALENDAR_DAYS_PER_BUSINESS_DAY_MAX: Final = 2  # generous: weekends + holiday clusters never exceed 2x

# --- /fx (Frankfurter v2: per-provider calls; providers + cadence from /v2/providers) ---
FRANKFURTER = UpstreamSpec(
    "frankfurter",
    "https://api.frankfurter.dev",
    max_concurrency=10,
    total_s=1.5,
    licence="central-bank reference data",
    attribution="Frankfurter (central-bank rates)",
)
ECB_XML = UpstreamSpec(
    "ecb", "https://www.ecb.europa.eu", max_concurrency=2, total_s=2.0, attribution="European Central Bank"
)
FX_MAX_QUOTES: Final = 10
FX_MAX_PROVIDERS: Final = 4
FX_PROVIDER_PRIORITY: Final = ("ECB", "FRED", "BOC", "BOE", "RBA", "BOJ")
FX_AGREE_PCT: Final = 0.5
FX_MINOR_PCT: Final = 1.5
FX_CONSENSUS_WINDOW_BUSINESS_DAYS: Final = 1  # fixings this close to the newest are compared as current
FX_STALE_BUSINESS_DAYS: Final = 1  # beyond the provider's own cadence allowance
FX_CADENCE_ALLOWANCE_DAYS: Final = {"daily": 1, "weekly": 5}  # business days a provider may legitimately trail
TTL_FX_PROVIDERS: Final = timedelta(hours=24)
TTL_FX_RATES: Final = timedelta(minutes=10)
CURRENCY_CODE_LEN: Final = 3
WEEKEND_DAYS: Final = frozenset({5, 6})

# --- /weather (MET Norway everywhere, honouring Expires per its ToS; NWS inside the US) ---
METNO = UpstreamSpec(
    "met.no",
    "https://api.met.no",
    max_concurrency=10,
    total_s=2.5,
    licence="CC BY 4.0 (MET Norway)",
    attribution="Data from MET Norway",
)
NWS = UpstreamSpec(
    "nws", "https://api.weather.gov", max_concurrency=4, total_s=2.5, licence="public domain", attribution="NOAA/NWS"
)
METNO_COORD_DECIMALS: Final = 4  # met.no ToS: at most 4 decimals (cache-friendly)
TEMP_AGREE_C: Final = 1.5
TEMP_MINOR_C: Final = 3.0
TTL_NWS_POINTS: Final = timedelta(days=30)
TTL_WEATHER_FALLBACK: Final = timedelta(minutes=10)
MIN_LATITUDE: Final = -90.0
MAX_LATITUDE: Final = 90.0
MIN_LONGITUDE: Final = -180.0
MAX_LONGITUDE: Final = 180.0
FAHRENHEIT_OFFSET: Final = 32.0
FAHRENHEIT_SCALE: Final = 5.0 / 9.0
MPH_TO_MS: Final = 0.44704

# --- /fact (Wikidata statements, read from entity JSON: no SPARQL label-service dependency) ---
MAX_SUBJECT_CHARS: Final = 200
MAX_FACT_VALUES: Final = 10
TTL_FACT_ENTITY: Final = timedelta(hours=1)
TTL_LABELS: Final = timedelta(days=7)
WIKIDATA_END_TIME: Final = "P582"
WIKIDATA_START_TIME: Final = "P580"
WIKIDATA_POINT_IN_TIME: Final = "P585"
LABEL_LANGUAGES: Final = ("en", "mul")  # "mul": Wikidata's default label for all languages (2025+)
WIKIDATA_OFFICEHOLDER: Final = "P1308"
# The "head" alias: whichever of these the subject has a current statement for, in this order (company → CEO,
# organisation → director or chair, country → head of state), then the office it names (below).
HEAD_ALIAS: Final = "head"
HEAD_PROPERTIES: Final = ("P169", "P1037", "P488", "P35")
# Some subjects name an office instead of a person: the United Nations has no chairperson statement, only
# P2388 (office held by head of the organization) → Q81066, whose P1308 lists the Secretaries-General. The office's
# current officeholder answers. Direct property → the office property to follow when it has no current value.
HEAD_OFFICES: Final = ("P2388", "P1906", "P1313")
OFFICE_FOR: Final = {"P35": "P1906", "P6": "P1313", "P488": "P2388", "P1037": "P2388", "P169": "P2388"}

# --- /news (local GDELT GKG index, filled every 15 min by a scheduled task; live HN Algolia) ---
GDELT = UpstreamSpec(
    "gdelt",
    "https://data.gdeltproject.org",
    max_concurrency=1,
    total_s=60.0,
    licence="GDELT: free, unlimited use with citation",
    attribution="The GDELT Project",
)
HN = UpstreamSpec("hn", "https://hn.algolia.com", max_concurrency=4, total_s=1.5, attribution="Hacker News via Algolia")
NEWS_DB: Final = "news.db"
NEWS_RETENTION_HOURS: Final = 72
NEWS_MAX_QUERY_CHARS: Final = 200
NEWS_MAX_SINCE_HOURS: Final = 72
NEWS_DEFAULT_SINCE_HOURS: Final = 24
NEWS_MAX_LIMIT: Final = 25
NEWS_DEFAULT_LIMIT: Final = 10
NEWS_RECENCY_WEIGHT_PER_HOUR: Final = 0.15  # bm25 is ~-5..-15 for good hits: one day old ≈ -3.6
NEWS_DEDUPE_TITLE_MIN: Final = 88
NEWS_INGEST_BUDGET_S: Final = 240.0
NEWS_TITLE_MAX_CHARS: Final = 300
NEWS_INSERT_BATCH: Final = 1_000
SECONDS_PER_HOUR: Final = 3_600
GKG_COLUMNS: Final = 27
GKG_DATE, GKG_DOMAIN, GKG_URL, GKG_LOCATIONS, GKG_EXTRAS = 1, 3, 4, 9, 26

# --- /stocks (flagged demo: every free market-data licence forbids redistribution; D-023) ---
STOCKS_LICENCE: Final = "demo-only; not for redistribution"
TWELVEDATA = UpstreamSpec(
    "twelvedata",
    "https://api.twelvedata.com",
    max_concurrency=2,
    total_s=3.0,  # measured 0.4-1.2 s for a batch /quote, one 2 s+ outlier
    rate="8/minute",  # free Basic plan: 8 credits a minute (one per symbol), 800 a day
    retry_attempts=1,  # a retry is billed again; the official close from Massive is the fallback instead
    licence=STOCKS_LICENCE,
    attribution="Twelve Data",
)
MASSIVE = UpstreamSpec(
    "massive",
    "https://api.massive.com",  # formerly api.polygon.io (renamed 2025-10-30; both hosts answer)
    max_concurrency=1,
    total_s=3.0,  # the all-market grouped daily file: 430 KB, measured 1.65 s
    rate="5/minute",  # free Basic plan
    licence=STOCKS_LICENCE,
    attribution="Massive (formerly Polygon.io)",
)
SEC_TICKERS = UpstreamSpec(
    "sec", "https://www.sec.gov", max_concurrency=2, total_s=2.5, licence="public domain", attribution="SEC EDGAR"
)
STOCKS_MAX_SYMBOLS: Final = 5  # one batch fits the 8-credit minute with room for a second caller
TICKER_PATTERN: Final = r"^[A-Za-z]{1,5}(?:[.\-/ ][A-Za-z]{1,2})?$"  # AAPL, BRK.B, BRK-B, GME.WS
TICKER_MAX_CHARS: Final = 8
TICKER_CLASS_SEPARATORS: Final = "-/ "  # written BRK-B (SEC), BRK/B, "BRK B"; Twelve Data and Massive use BRK.B
NYSE_ZONE: Final = "America/New_York"
NYSE_CALENDAR: Final = "NYSE"
NYSE_REGULAR_OPEN: Final = time(9, 30)
NYSE_REGULAR_CLOSE: Final = time(16, 0)
NYSE_EARLY_CLOSE: Final = time(13, 0)  # every early close since 1993 (python-holidays' NYSE half_day category)
NYSE_PRE_MARKET_OPEN: Final = time(4, 0)
NYSE_AFTER_HOURS_SPAN: Final = timedelta(hours=4)  # 16:00-20:00, and 13:00-17:00 on early-close days
NYSE_SESSION_SEARCH_DAYS: Final = 14  # far longer than any closure run (9/11: four trading days)
TTL_QUOTE_LIVE: Final = timedelta(seconds=60)  # during the session, and while the close settles
QUOTE_CLOSE_SETTLE: Final = timedelta(minutes=30)  # the closing auction prints and corrections land after the bell
TTL_UNIVERSE_EMPTY: Final = timedelta(minutes=15)  # the day's grouped file is not published yet: ask again later
UNIVERSE_REFRESH_BUDGET_S: Final = 10.0  # background refresh, off the request path
TTL_SEC_TICKERS: Final = timedelta(hours=24)
STOCK_CLOSE_AGREE_PCT: Final = 0.1  # the two feeds print the same official close (measured: identical to the cent)
STOCK_CLOSE_MINOR_PCT: Final = 1.0
SUGGEST_MAX: Final = 3
SUGGEST_MAX_EDITS: Final = 1  # APPL → AAPL, MSTF → MSFT
SUGGEST_NAME_MIN: Final = 90  # rapidfuzz WRatio of the input against company names ("APPLE" → Apple Inc.)
SUGGEST_NAME_MIN_CHARS: Final = 4  # shorter inputs partially match thousands of names
PRICE_DECIMALS: Final = 4

# --- /jobs (local index of public ATS boards, refreshed every 6 h by a scheduled task; never fetched live) ---
GREENHOUSE = UpstreamSpec("greenhouse", "https://boards-api.greenhouse.io", max_concurrency=4, total_s=20.0)
LEVER = UpstreamSpec("lever", "https://api.lever.co", max_concurrency=4, total_s=20.0)
ASHBY = UpstreamSpec("ashby", "https://api.ashbyhq.com", max_concurrency=4, total_s=20.0)
JOBS_DB: Final = "jobs.db"
JOBS_INGEST_BUDGET_S: Final = 600.0
JOBS_BOARD_CONCURRENCY: Final = 4
JOBS_MAX_QUERY_CHARS: Final = 200
JOBS_MAX_COMPANIES: Final = 20
JOBS_MAX_LIMIT: Final = 50
JOBS_DEFAULT_LIMIT: Final = 10
JOBS_MAX_POSTED_WITHIN_DAYS: Final = 90
JOBS_STALE_INDEX_HOURS: Final = 12  # two missed refreshes
SECONDS_PER_DAY: Final = 86_400
MS_PER_S: Final = 1_000
THOUSAND: Final = 1_000
