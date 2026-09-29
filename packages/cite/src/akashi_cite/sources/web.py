"""Cited web pages: SSRF-safe liveness + title/DOI meta, with a Wayback snapshot looked up in parallel."""

import html
import re
from dataclasses import dataclass
from typing import Literal
from urllib.parse import quote

import httpx2

from akashi_cite.constants import (
    BLOCKED_STATUSES,
    DEAD_STATUSES,
    HTTP_OK_MAX,
    HTTP_OK_MIN,
    PAGE_TITLE_MAX_CHARS,
    TTL_WAYBACK,
    WEB,
)
from akashi_cite.models import WebCheck
from akashi_cite.sources import clients
from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache
from akashi_core.constants.deadlines import CITE_DEADLINE_S
from akashi_core.deadline import current_deadline
from akashi_core.http.ssrf import UnresolvableHost, safe_get

_META_RE = re.compile(
    r"<meta\s+[^>]*?(?:name|property)\s*=\s*[\"']([^\"']+)[\"'][^>]*?content\s*=\s*[\"']([^\"']*)[\"']", re.I
)
_META_REV_RE = re.compile(
    r"<meta\s+[^>]*?content\s*=\s*[\"']([^\"']*)[\"'][^>]*?(?:name|property)\s*=\s*[\"']([^\"']+)[\"']", re.I
)
_TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
TITLE_META_KEYS = ("citation_title", "og:title", "dc.title")
DOI_META_KEYS = ("citation_doi", "dc.identifier", "prism.doi")
DOI_PREFIX = "10."

Liveness = Literal["live", "dead", "blocked", "unreachable"]
WAYBACK_TS_LEN = 14


@dataclass(slots=True)
class PageFacts:
    check: WebCheck
    citation_doi: str | None = None


def _metas(body: str) -> dict[str, str]:
    found = {k.lower(): v for k, v in _META_RE.findall(body)}
    found.update({k.lower(): v for v, k in _META_REV_RE.findall(body) if k.lower() not in found})
    return found


def _title(body: str, metas: dict[str, str]) -> str | None:
    title = next((metas[k] for k in TITLE_META_KEYS if metas.get(k)), None)
    if title is None and (m := _TITLE_RE.search(body)):
        title = m.group(1)
    return " ".join(html.unescape(title).split())[:PAGE_TITLE_MAX_CHARS] if title else None


def _doi(metas: dict[str, str]) -> str | None:
    value = next((metas[k] for k in DOI_META_KEYS if metas.get(k)), "")
    doi = value.removeprefix("doi:").strip()
    return doi if DOI_PREFIX in doi else None


def _liveness(status: int) -> Liveness:
    if HTTP_OK_MIN <= status <= HTTP_OK_MAX:
        return "live"
    if status in DEAD_STATUSES:
        return "dead"
    if status in BLOCKED_STATUSES:
        return "blocked"
    return "unreachable"


async def fetch(url: str) -> PageFacts:
    budget = current_deadline(CITE_DEADLINE_S).for_call(WEB.total_s)
    try:
        page = await safe_get(clients.web().http, url, budget)
    except UnresolvableHost:  # no DNS answer: the domain is gone (or never existed)
        return PageFacts(WebCheck(liveness="dead", final_url=url))
    except httpx2.HTTPError:
        return PageFacts(WebCheck(liveness="unreachable", final_url=url))
    liveness = _liveness(page.status)
    check = WebCheck(http_status=page.status, liveness=liveness, final_url=page.final_url)
    if liveness != "live" or "html" not in page.content_type:
        return PageFacts(check)
    body = page.body.decode("utf-8", "replace")
    metas = _metas(body)
    check.page_title = _title(body, metas)
    return PageFacts(check, _doi(metas))


async def snapshot(url: str) -> tuple[str | None, str | None]:
    """(archived_url, archived_at ISO) of the closest Wayback snapshot, if any."""
    key = cache_key("cite", "wayback", "closest", url)
    if (hit := await cache.get(key)) is None:
        data, _ = await clients.wayback().get_json(f"/wayback/available?url={quote(url, safe='')}")
        closest = ((data or {}).get("archived_snapshots") or {}).get("closest") or {}
        hit = {"url": closest.get("url"), "ts": closest.get("timestamp")} if closest.get("available") else {}
        await cache.set(key, hit, TTL_WAYBACK)
    ts = hit.get("ts") or ""
    at = f"{ts[:4]}-{ts[4:6]}-{ts[6:8]}T{ts[8:10]}:{ts[10:12]}:{ts[12:14]}Z" if len(ts) == WAYBACK_TS_LEN else None
    return hit.get("url"), at
