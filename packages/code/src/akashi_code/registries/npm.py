"""npm registry adapter: /<pkg>/latest, /<pkg>/<ver>, downloads, deps.dev for history when needed."""

from typing import Any
from urllib.parse import quote

from akashi_code.constants import SUSPICIOUS_MAX_WEEKLY_DOWNLOADS, VERSIONS_TAIL
from akashi_code.registries import clients
from akashi_code.registries.base import PackageFacts
from akashi_core.constants.deadlines import CODE_DEADLINE_S
from akashi_core.contract.enums import SourceStatus, Tristate
from akashi_core.deadline import current_deadline
from akashi_core.errors import UpstreamFailure
from akashi_core.fanout import fan_out


def _path(name: str) -> str:
    # Scoped names: "@scope/pkg" → "@scope%2Fpkg" (npm registry convention).
    return "/" + quote(name, safe="@")


async def _doc(name: str, ref: str) -> Any:
    data, _ = await clients.npm().get_json(f"{_path(name)}/{quote(ref, safe='')}")
    return data


async def _downloads(name: str) -> int | None:
    data, _ = await clients.npm_downloads().get_json(f"/downloads/point/last-week/{quote(name, safe='@/')}")
    return data.get("downloads")


async def _history(name: str) -> list[dict[str, Any]]:
    data, _ = await clients.deps_dev().get_json(f"/v3/systems/npm/packages/{quote(name, safe='')}")
    return data.get("versions", [])


async def fetch(name: str, version: str | None) -> PackageFacts:
    deadline = current_deadline(CODE_DEADLINE_S)
    calls = {"latest": _doc(name, "latest"), "downloads": _downloads(name)}
    if version:
        calls["version"] = _doc(name, version)
    res = await fan_out(calls, deadline)
    facts = PackageFacts(exists=Tristate.unknown)

    latest_fail = res.failed.get("latest")
    if latest_fail == SourceStatus.not_found:
        facts.exists = Tristate.no
        facts.sources.append(clients.npm().source_ref(SourceStatus.not_found))
        return facts
    if latest_fail:
        facts.unavailable.append("npm")
        facts.sources.append(clients.npm().source_ref(SourceStatus.unavailable))
        return facts

    doc = res.ok["latest"]
    facts.exists = Tristate.yes
    facts.latest = doc.get("version")
    facts.description = doc.get("description")
    facts.deprecated_reason = doc.get("deprecated") or None
    dist = doc.get("dist") or {}
    facts.unpacked_size = dist.get("unpackedSize")
    facts.file_count = dist.get("fileCount")
    facts.has_entrypoint = bool(doc.get("main") or doc.get("exports") or doc.get("bin"))
    facts.downloads_last_week = res.ok.get("downloads")
    facts.sources.append(clients.npm().source_ref(SourceStatus.ok))

    if version:
        if "version" in res.ok:
            facts.version_exists = Tristate.yes
            facts.deprecated_reason = res.ok["version"].get("deprecated") or facts.deprecated_reason
        elif res.failed.get("version") == SourceStatus.not_found:
            facts.version_exists = Tristate.no

    # Publish history only matters for low-traffic names (the "suspicious new" signal); skip it for popular ones.
    downloads = facts.downloads_last_week
    if downloads is None or downloads < SUSPICIOUS_MAX_WEEKLY_DOWNLOADS:
        try:
            history = await _history(name)
        except UpstreamFailure:
            facts.unavailable.append("deps.dev")
        else:
            dated = sorted((v for v in history if v.get("publishedAt")), key=lambda v: v["publishedAt"])
            facts.versions_count = len(history)
            if dated:
                facts.first_published = dated[0]["publishedAt"]
                facts.latest_published = dated[-1]["publishedAt"]
                facts.versions_tail = [v["versionKey"]["version"] for v in dated[-VERSIONS_TAIL:]][::-1]
            facts.sources.append(clients.deps_dev().source_ref(SourceStatus.ok))
    return facts
