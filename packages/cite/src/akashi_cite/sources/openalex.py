"""OpenAlex (CC0): a second opinion on retraction status, and abstracts for claim checks."""

from typing import Any
from urllib.parse import quote

from akashi_cite.constants import TTL_BIBLIO, TTL_WORK
from akashi_cite.sources import clients
from akashi_cite.sources.records import Record, clean_text, family_name
from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache
from akashi_core.settings import get_settings

SELECT = "id,doi,title,publication_year,is_retracted,abstract_inverted_index"


async def work(doi: str) -> dict[str, Any] | None:
    key = cache_key("cite", "openalex", "work", doi)
    if (hit := await cache.get(key)) is None:
        mailto = quote(get_settings().contact_email, safe="@")
        hit, _ = await clients.openalex().get_json(
            f"/works/doi:{quote(doi, safe='/')}?select={SELECT}&mailto={mailto}", headers=_auth()
        )
        await cache.set(key, hit, TTL_WORK)
    return hit or None


def _auth() -> dict[str, str]:
    key = get_settings().openalex_api_key
    return {"authorization": f"Bearer {key.get_secret_value()}"} if key else {}


def abstract(item: dict[str, Any]) -> str | None:
    """Rebuild the abstract text from OpenAlex's inverted index."""
    inverted: dict[str, list[int]] | None = item.get("abstract_inverted_index")
    if not inverted:
        return None
    positions = sorted((pos, word) for word, poss in inverted.items() for pos in poss)
    return " ".join(word for _, word in positions)


SEARCH_SELECT = "doi,title,authorships,publication_year,primary_location,is_retracted,biblio,type"
SEARCH_ROWS = 5
DOI_URL_PREFIX = "https://doi.org/"


def _search_record(item: dict[str, Any]) -> Record:
    biblio = item.get("biblio") or {}
    pages = "-".join(p for p in (biblio.get("first_page"), biblio.get("last_page")) if p) or None
    source = (item.get("primary_location") or {}).get("source") or {}
    names = [(a.get("author") or {}).get("display_name") or "" for a in item.get("authorships", [])]
    return Record(
        source="openalex",
        doi=(item.get("doi") or "").removeprefix(DOI_URL_PREFIX).lower() or None,
        title=clean_text(item.get("title")),
        authors=[family_name(n) for n in names if n],
        year=item.get("publication_year"),
        venue=source.get("display_name"),
        volume=biblio.get("volume"),
        pages=pages,
        type=item.get("type"),
        retracted=bool(item.get("is_retracted")),
        retraction_source="openalex" if item.get("is_retracted") else None,
    )


async def search(query: str) -> list[Record]:
    """Fallback only: OpenAlex relevance ranking is weak for citation strings, so our scorer decides."""
    key = cache_key("cite", "openalex", "search", query)
    if (hit := await cache.get(key)) is None:
        mailto = quote(get_settings().contact_email, safe="@")
        data, _ = await clients.openalex().get_json(
            f"/works?search={quote(query)}&per-page={SEARCH_ROWS}&select={SEARCH_SELECT}&mailto={mailto}",
            headers=_auth(),
        )
        hit = data.get("results", [])
        await cache.set(key, hit, TTL_BIBLIO)
    return [_search_record(i) for i in hit]
