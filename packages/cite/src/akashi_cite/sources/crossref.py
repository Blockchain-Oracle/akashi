"""Crossref: work by DOI, bibliographic search, and Retraction Watch-sourced update notices."""

from typing import Any
from urllib.parse import quote

from akashi_cite.constants import CROSSREF_ROWS, TTL_BIBLIO, TTL_WORK
from akashi_cite.sources import clients
from akashi_cite.sources.records import Record, clean_text
from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache
from akashi_core.settings import get_settings

SELECT = "DOI,title,author,issued,container-title,short-container-title,volume,page,type,score,updated-by,URL"
RETRACTION_TYPES = {"retraction", "withdrawal", "removal"}
CORRECTION_TYPES = {"correction", "erratum", "corrigendum"}


def _date(parts: dict[str, Any] | None) -> str | None:
    dp = (parts or {}).get("date-parts") or [[]]
    return "-".join(f"{p:02d}" if i else str(p) for i, p in enumerate(dp[0])) or None


def to_record(item: dict[str, Any]) -> Record:
    issued = ((item.get("issued") or {}).get("date-parts") or [[None]])[0]
    rec = Record(
        source="crossref",
        doi=(item.get("DOI") or "").lower() or None,
        title=clean_text((item.get("title") or [None])[0]),
        authors=[a["family"] for a in item.get("author", []) if a.get("family")],
        year=issued[0] if issued and isinstance(issued[0], int) else None,
        venue=(item.get("container-title") or [None])[0],
        short_venue=(item.get("short-container-title") or [None])[0],
        volume=item.get("volume"),
        pages=item.get("page"),
        type=item.get("type"),
        url=item.get("URL"),
        score=item.get("score"),
    )
    for update in item.get("updated-by", []) or []:
        kind = (update.get("type") or "").lower()
        if kind in RETRACTION_TYPES:
            rec.retracted, rec.retraction_date = True, _date(update.get("updated"))
            rec.retraction_notice, rec.retraction_source = update.get("DOI"), update.get("source")
        elif kind in CORRECTION_TYPES:
            rec.corrected = True
    return rec


def _mailto() -> str:
    return quote(get_settings().contact_email, safe="@")


async def work(doi: str) -> Record | None:
    key = cache_key("cite", "crossref", "work", doi)
    if (hit := await cache.get(key)) is not None:
        return to_record(hit) if hit else None
    data, _ = await clients.crossref().get_json(f"/works/{quote(doi, safe='/')}?mailto={_mailto()}")
    item = data.get("message") or {}
    await cache.set(key, item, TTL_WORK)
    return to_record(item)


async def bibliographic(query: str) -> list[Record]:
    key = cache_key("cite", "crossref", "biblio", query)
    if (hit := await cache.get(key)) is None:
        path = f"/works?query.bibliographic={quote(query)}&rows={CROSSREF_ROWS}&select={SELECT}&mailto={_mailto()}"
        data, _ = await clients.crossref().get_json(path)
        hit = (data.get("message") or {}).get("items", [])
        await cache.set(key, hit, TTL_BIBLIO)
    return [to_record(i) for i in hit]


async def title_author(title: str, author: str | None) -> list[Record]:
    """Field-targeted search: recovers works that query.bibliographic ranks below their own notices."""
    key = cache_key("cite", "crossref", "title-author", f"{title}|{author or ''}")
    if (hit := await cache.get(key)) is None:
        author_part = f"&query.author={quote(author)}" if author else ""
        path = f"/works?query.title={quote(title)}{author_part}&rows={CROSSREF_ROWS}&select={SELECT}&mailto={_mailto()}"
        data, _ = await clients.crossref().get_json(path)
        hit = (data.get("message") or {}).get("items", [])
        await cache.set(key, hit, TTL_BIBLIO)
    return [to_record(i) for i in hit]
