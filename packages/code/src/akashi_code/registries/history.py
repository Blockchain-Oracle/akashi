"""Publish history from deps.dev (CC-BY 4.0) for ecosystems whose registry has no dates in the cheap call."""

from urllib.parse import quote

from akashi_code.constants import DEPS_DEV_SYSTEMS, VERSIONS_TAIL
from akashi_code.registries import clients
from akashi_code.registries.base import PackageFacts
from akashi_core.contract.enums import SourceStatus
from akashi_core.errors import UpstreamFailure


async def fill_history(facts: PackageFacts, ecosystem: str, name: str) -> None:
    system = DEPS_DEV_SYSTEMS.get(ecosystem)
    if system is None:
        return
    try:
        data, _ = await clients.deps_dev().get_json(f"/v3/systems/{system}/packages/{quote(name, safe='')}")
    except UpstreamFailure:
        facts.unavailable.append("deps.dev")
        return
    versions = data.get("versions", [])
    dated = sorted((v for v in versions if v.get("publishedAt")), key=lambda v: v["publishedAt"])
    facts.versions_count = facts.versions_count or len(versions)
    if dated:
        facts.first_published = dated[0]["publishedAt"]
        facts.latest_published = dated[-1]["publishedAt"]
        if not facts.versions_tail:
            facts.versions_tail = [v["versionKey"]["version"] for v in dated[-VERSIONS_TAIL:]][::-1]
    if not facts.deprecated_reason:
        latest = next((v for v in versions if v.get("isDefault")), None)
        if latest and latest.get("isDeprecated"):
            facts.deprecated_reason = latest.get("deprecatedReason") or "deprecated"
    facts.sources.append(clients.deps_dev().source_ref(SourceStatus.ok))
