"""PyPI adapter: one project JSON call gives latest, releases (with upload times), yanked state."""

import re
from typing import Any
from urllib.parse import quote

from akashi_code.constants import VERSIONS_TAIL
from akashi_code.registries import clients
from akashi_code.registries.base import PackageFacts
from akashi_core.contract.enums import SourceStatus, Tristate
from akashi_core.errors import UpstreamFailure

_PEP503 = re.compile(r"[-_.]+")


def normalize(name: str) -> str:
    """PEP 503 normalized project name."""
    return _PEP503.sub("-", name).lower()


def _first_upload(files: list[dict[str, Any]]) -> str | None:
    times = [f["upload_time_iso_8601"] for f in files if f.get("upload_time_iso_8601")]
    return min(times) if times else None


async def fetch(name: str, version: str | None) -> PackageFacts:
    facts = PackageFacts(exists=Tristate.unknown)
    try:
        data, ref = await clients.pypi().get_json(f"/pypi/{quote(normalize(name), safe='')}/json")
    except UpstreamFailure as failure:
        if failure.kind == SourceStatus.not_found:
            facts.exists = Tristate.no
            facts.sources.append(clients.pypi().source_ref(SourceStatus.not_found))
        else:
            facts.unavailable.append("pypi")
            facts.sources.append(clients.pypi().source_ref(SourceStatus.unavailable))
        return facts

    info = data.get("info") or {}
    releases: dict[str, list[dict[str, Any]]] = data.get("releases") or {}
    facts.exists = Tristate.yes
    facts.latest = info.get("version")
    facts.description = info.get("summary")
    dated = sorted(((ver, t) for ver, files in releases.items() if (t := _first_upload(files))), key=lambda p: p[1])
    facts.versions_count = len(releases)
    if dated:
        facts.first_published = dated[0][1]
        facts.latest_published = dated[-1][1]
        facts.versions_tail = [ver for ver, _ in dated[-VERSIONS_TAIL:]][::-1]
    if version:
        files = releases.get(version)
        facts.version_exists = Tristate.yes if files is not None else Tristate.no
        if files and all(f.get("yanked") for f in files):
            facts.yanked = True
            facts.yanked_reason = next((f.get("yanked_reason") for f in files if f.get("yanked_reason")), None)
    facts.sources.append(ref)
    return facts
