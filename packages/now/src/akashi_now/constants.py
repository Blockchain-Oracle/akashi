"""live-facts constants (specs/backend.md §3.3; upstream facts verified live 2026-09-29)."""

from datetime import timedelta
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
GEOCODE_CANDIDATES: Final = 5
TTL_GEOCODE: Final = timedelta(days=30)
GEOCODE_CACHE_KIND: Final = "geocode-r2"  # bump when the choice logic changes: old answers live 30 days
WIKIDATA_COORDINATES: Final = "P625"
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
