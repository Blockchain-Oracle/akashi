"""Caselaw Access Project static volumes (CC0): which cases start, and span, which pages of a reporter volume."""

from dataclasses import dataclass

from akashi_cite.constants import CAP_COVERAGE_END, CAP_REPORTER_SLUGS, TTL_CAP_VOLUME
from akashi_cite.sources import clients
from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache
from akashi_core.errors import UpstreamFailure


@dataclass(frozen=True, slots=True)
class CapCase:
    first_page: int
    last_page: int
    name: str
    decision_date: str
    court: str | None


def slug_for(reporter: str) -> str | None:
    return CAP_REPORTER_SLUGS.get(reporter)


def covered_through(slug: str) -> int | None:
    return CAP_COVERAGE_END.get(slug)


def _project(raw: list[dict]) -> list[dict]:
    """Keep only what matching needs: a volume file is ~MBs (cites_to), the projection a few KB."""
    out = []
    for case in raw:
        first, last = str(case.get("first_page", "")), str(case.get("last_page", ""))
        if not (first.isdigit() and last.isdigit()):
            continue  # roman-numeral front matter
        out.append(
            {
                "first": int(first),
                "last": int(last),
                "name": case.get("name_abbreviation") or case.get("name") or "",
                "date": case.get("decision_date") or "",
                "court": (case.get("court") or {}).get("name_abbreviation"),
            }
        )
    return out


async def volume(slug: str, volume_no: str) -> list[CapCase] | None:
    """Cases in a volume, or None when CAP has no such volume."""
    key = cache_key("cite", "cap", "volume", f"{slug}/{volume_no}")
    if (hit := await cache.get(key)) is None:
        try:
            raw, _ = await clients.cap().get_json(f"/{slug}/{volume_no}/CasesMetadata.json")
        except UpstreamFailure as failure:
            if failure.kind != "not_found":
                raise
            raw = None
        hit = {"cases": _project(raw) if isinstance(raw, list) else None}
        await cache.set(key, hit, TTL_CAP_VOLUME)
    cases = hit["cases"]
    if cases is None:
        return None
    return [CapCase(c["first"], c["last"], c["name"], c["date"], c["court"]) for c in cases]
