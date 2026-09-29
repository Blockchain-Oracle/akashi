"""Europe PMC: abstracts by DOI (biomedicine plus much of CS/physics via preprint servers). Free, no key."""

import re
from urllib.parse import quote

from akashi_cite.constants import TTL_WORK
from akashi_cite.sources import clients
from akashi_cite.sources.records import clean_text
from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache

_HEADING_RE = re.compile(r"<h\d[^>]*>.*?</h\d>", re.I | re.S)  # "<h4>Background</h4>" section labels


async def abstract(doi: str) -> str | None:
    key = cache_key("cite", "europepmc", "abstract", doi)
    if (hit := await cache.get(key)) is None:
        query = quote(f'DOI:"{doi}"')
        data, _ = await clients.europepmc().get_json(
            f"/europepmc/webservices/rest/search?query={query}&resultType=core&format=json&pageSize=1"
        )
        results = (data.get("resultList") or {}).get("result") or []
        text = results[0].get("abstractText") if results else None
        hit = {"text": clean_text(_HEADING_RE.sub(" ", text)) if text else None}
        await cache.set(key, hit, TTL_WORK)
    return hit["text"]
