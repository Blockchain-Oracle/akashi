"""DataCite: DOIs not registered with Crossref (arXiv 10.48550, Zenodo, datasets)."""

import re
from typing import Any
from urllib.parse import quote

from akashi_cite.constants import TTL_BIBLIO, TTL_DATACITE
from akashi_cite.sources import clients
from akashi_cite.sources.records import Record, clean_text
from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache

ARXIV_DOI_PREFIX = "10.48550/"
PREPRINT = "preprint"


def _type(attrs: dict[str, Any]) -> str | None:
    """arXiv DOIs are preprints whatever the record says (older ones are typed "Text")."""
    if (attrs.get("doi") or "").lower().startswith(ARXIV_DOI_PREFIX):
        return PREPRINT
    return (attrs.get("types") or {}).get("resourceTypeGeneral")


def _record(attrs: dict[str, Any]) -> Record:
    titles = attrs.get("titles") or [{}]
    return Record(
        source="datacite",
        doi=(attrs.get("doi") or "").lower() or None,
        title=clean_text(titles[0].get("title")),
        authors=[c.get("familyName") or c.get("name", "") for c in attrs.get("creators", [])],
        year=attrs.get("publicationYear"),
        venue=attrs.get("publisher")
        if isinstance(attrs.get("publisher"), str)
        else (attrs.get("publisher") or {}).get("name"),
        type=_type(attrs),
        url=attrs.get("url"),
    )


async def work(doi: str) -> Record | None:
    key = cache_key("cite", "datacite", "work", doi)
    if (hit := await cache.get(key)) is None:
        data, _ = await clients.datacite().get_json(f"/dois/{quote(doi, safe='')}")
        hit = (data.get("data") or {}).get("attributes") or {}
        await cache.set(key, hit, TTL_DATACITE)
    return _record(hit) if hit else None


ARXIV_CLIENT_ID = "arxiv.content"  # DataCite repository that registers every arXiv DOI (10.48550)
SEARCH_ROWS = 5
_LUCENE_SPECIAL_RE = re.compile(r"[^\w\s]")  # + - : ( ) " etc. would be parsed as query syntax


async def search_arxiv(title: str) -> list[Record]:
    """Exact-phrase title search over arXiv's DataCite records: precise where relevance ranking is not."""
    phrase = " ".join(_LUCENE_SPECIAL_RE.sub(" ", title).split())
    if not phrase:
        return []
    key = cache_key("cite", "datacite", "arxiv-title", phrase.lower())
    if (hit := await cache.get(key)) is None:
        query = quote(f'titles.title:"{phrase}"')
        data, _ = await clients.datacite().get_json(
            f"/dois?query={query}&client-id={ARXIV_CLIENT_ID}&page%5Bsize%5D={SEARCH_ROWS}"
        )
        hit = [item.get("attributes") or {} for item in data.get("data", [])]
        await cache.set(key, hit, TTL_BIBLIO)
    return [_record(attrs) for attrs in hit]
