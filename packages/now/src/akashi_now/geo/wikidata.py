"""Place name → coordinates and ISO country via Wikidata (search, then the first item that has P625)."""

import json
from dataclasses import asdict, dataclass
from functools import lru_cache
from importlib import resources
from typing import Any
from urllib.parse import quote

from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache
from akashi_now import clients
from akashi_now.constants import (
    GEOCODE_CANDIDATES,
    TTL_GEOCODE,
    WIKIDATA_COORDINATES,
    WIKIDATA_COUNTRY,
)


@dataclass(frozen=True, slots=True)
class Place:
    qid: str
    label: str
    description: str | None
    lat: float
    lon: float
    country: str | None  # ISO 3166-1 alpha-2


@lru_cache(maxsize=1)
def _country_iso() -> dict[str, str]:
    """Wikidata country QID → ISO 3166-1 alpha-2 (P297), bundled so geocoding needs two calls, not three.

    Generated 2026-09-29 with SPARQL `SELECT DISTINCT ?c ?iso WHERE { ?c wdt:P297 ?iso . }` (261 entries, CC0).
    """
    return json.loads(resources.files("akashi_now.data").joinpath("wikidata_country_iso.json").read_text())


def _value(claims: dict[str, Any], prop: str) -> Any:
    for claim in claims.get(prop, []):
        if claim.get("rank") != "deprecated" and (snak := claim.get("mainsnak", {})).get("datavalue"):
            return snak["datavalue"]["value"]
    return None


async def _entities(ids: list[str]) -> dict[str, Any]:
    data, _ = await clients.wikidata().get_json(
        f"/w/api.php?action=wbgetentities&ids={'|'.join(ids)}&props=claims&format=json"
    )
    return data.get("entities", {})


async def geocode(place: str) -> Place | None:
    key = cache_key("now", "wikidata", "geocode", place.lower())
    if (hit := await cache.get(key)) is not None:
        return Place(**hit) if hit else None
    found, _ = await clients.wikidata().get_json(
        f"/w/api.php?action=wbsearchentities&search={quote(place)}&language=en&type=item"
        f"&limit={GEOCODE_CANDIDATES}&format=json"
    )
    hits = found.get("search", [])
    result: Place | None = None
    if hits:
        entities = await _entities([h["id"] for h in hits])
        wanted = place.strip().casefold()
        # Exact label matches first (search ranks "University of Chicago" above Chicago), then search order.
        hits.sort(key=lambda h: (h.get("label") or "").casefold() != wanted)
        for h in hits:
            claims = entities.get(h["id"], {}).get("claims", {})
            if (coord := _value(claims, WIKIDATA_COORDINATES)) is None:
                continue
            country_ref = _value(claims, WIKIDATA_COUNTRY)
            country = _country_iso().get(country_ref["id"]) if country_ref else None
            result = Place(
                h["id"], h.get("label", place), h.get("description"), coord["latitude"], coord["longitude"], country
            )
            break
    await cache.set(key, asdict(result) if result else {}, TTL_GEOCODE)
    return result
