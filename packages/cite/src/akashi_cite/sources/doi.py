"""doi.org: fastest existence check (handle API) and registration agency per prefix."""

from urllib.parse import quote

from akashi_cite.constants import TTL_DOI_RA
from akashi_cite.sources import clients
from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache
from akashi_core.errors import UpstreamFailure

HANDLE_FOUND = 1  # doi.org handle API responseCode for an existing handle


async def exists(doi: str) -> bool:
    try:
        data, _ = await clients.doi().get_json(f"/api/handles/{quote(doi, safe='/')}")
    except UpstreamFailure as failure:
        if failure.kind == "not_found":
            return False
        raise
    return data.get("responseCode") == HANDLE_FOUND


async def registration_agency(doi: str) -> str | None:
    prefix = doi.split("/", 1)[0]
    key = cache_key("cite", "doi", "ra", prefix)
    if (hit := await cache.get(key)) is not None:
        return hit
    data, _ = await clients.doi().get_json(f"/ra/{quote(prefix, safe='')}")
    ra = data[0].get("RA") if isinstance(data, list) and data else None
    if ra:
        await cache.set(key, ra, TTL_DOI_RA)
    return ra
