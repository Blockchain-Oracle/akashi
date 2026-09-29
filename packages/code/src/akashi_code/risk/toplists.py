"""Popular-package reference lists (npm-high-impact MIT; top-pypi-packages), cached on disk, weekly refresh."""

import re
import time
from dataclasses import dataclass, field
from pathlib import Path

import httpx2
import orjson
import structlog

from akashi_code.constants import NPM_TOPLIST_URL, PYPI_TOPLIST_URL, TOPLIST_REFRESH
from akashi_code.models import Ecosystem
from akashi_code.registries.pypi import normalize as pep503
from akashi_core.settings import get_settings

log = structlog.get_logger(__name__)
_NPM_ENTRY = re.compile(r"^\s*'([^']+)',?\s*$", re.M)
_FETCH_TIMEOUT_S = 30.0


@dataclass(slots=True)
class TopList:
    names: list[str] = field(default_factory=list)  # most popular first
    rank: dict[str, int] = field(default_factory=dict)  # name → 1-based rank
    downloads: dict[str, int] = field(default_factory=dict)  # when the source provides counts
    loaded_at: str | None = None

    def __contains__(self, name: str) -> bool:
        return name in self.rank


_lists: dict[Ecosystem, TopList] = {}


def get(ecosystem: Ecosystem) -> TopList:
    return _lists.get(ecosystem, TopList())


def _cache_path(ecosystem: Ecosystem) -> Path:
    return Path(get_settings().data_dir) / "toplists" / f"{ecosystem}.json"


def _parse(ecosystem: Ecosystem, raw: bytes) -> tuple[list[str], dict[str, int]]:
    if ecosystem is Ecosystem.npm:
        return _NPM_ENTRY.findall(raw.decode()), {}
    rows = orjson.loads(raw)["rows"]
    names = [pep503(r["project"]) for r in rows]
    return names, {pep503(r["project"]): r["download_count"] for r in rows}


async def load(ecosystem: Ecosystem, url: str) -> None:
    path = _cache_path(ecosystem)
    fresh = path.exists() and time.time() - path.stat().st_mtime < TOPLIST_REFRESH.total_seconds()
    raw: bytes | None = path.read_bytes() if fresh else None
    if raw is None:
        try:
            async with httpx2.AsyncClient(follow_redirects=True, timeout=_FETCH_TIMEOUT_S) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                raw = resp.content
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(raw)
        except httpx2.HTTPError:
            log.warning("toplist_fetch_failed", ecosystem=str(ecosystem))
            raw = path.read_bytes() if path.exists() else None
    if raw is None:
        return
    names, downloads = _parse(ecosystem, raw)
    _lists[ecosystem] = TopList(
        names,
        {n: i + 1 for i, n in enumerate(names)},
        downloads,
        time.strftime("%Y-%m-%d", time.gmtime(path.stat().st_mtime)),
    )
    log.info("toplist_loaded", ecosystem=str(ecosystem), count=len(names))


async def load_all() -> None:
    await load(Ecosystem.npm, NPM_TOPLIST_URL)
    await load(Ecosystem.pypi, PYPI_TOPLIST_URL)
