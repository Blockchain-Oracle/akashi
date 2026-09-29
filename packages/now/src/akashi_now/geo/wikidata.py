"""Place name → coordinates and ISO country via Wikidata (search, then the first item that has P625)."""

from dataclasses import asdict, dataclass
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
    WIKIDATA_ISO_ALPHA2,
)


@dataclass(frozen=True, slots=True)
class Place:
    qid: str
    label: str
    description: str | None
    lat: float
    lon: float
    country: str | None  # ISO 3166-1 alpha-2


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
        for h in hits:  # search order: the most prominent item first
            claims = entities.get(h["id"], {}).get("claims", {})
            if (coord := _value(claims, WIKIDATA_COORDINATES)) is None:
                continue
            country = None
            if (country_ref := _value(claims, WIKIDATA_COUNTRY)) is not None:
                country_claims = (await _entities([country_ref["id"]])).get(country_ref["id"], {}).get("claims", {})
                country = _value(country_claims, WIKIDATA_ISO_ALPHA2)
            result = Place(
                h["id"], h.get("label", place), h.get("description"), coord["latitude"], coord["longitude"], country
            )
            break
    await cache.set(key, asdict(result) if result else {}, TTL_GEOCODE)
    return result
