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
WIKIDATA_COORDINATES: Final = "P625"
WIKIDATA_COUNTRY: Final = "P17"
WIKIDATA_ISO_ALPHA2: Final = "P297"
