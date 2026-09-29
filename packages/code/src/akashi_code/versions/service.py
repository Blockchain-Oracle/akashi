"""List every published version (newest first) and resolve ranges."""

from urllib.parse import quote

from akashi_code.constants import DEPS_DEV_SYSTEMS, TTL_LATEST, VERSIONS_LIST_MAX
from akashi_code.models import Ecosystem, VersionsQuery, VersionsResult
from akashi_code.registries import clients
from akashi_code.registries.pypi import normalize
from akashi_code.versions.resolve import order, resolve
from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache
from akashi_core.contract.enums import SourceStatus, Tristate
from akashi_core.contract.sources import SourceRef
from akashi_core.errors import UpstreamFailure


async def _all_versions(ecosystem: Ecosystem, name: str) -> tuple[list[str], SourceRef]:
    """Oldest → newest."""
    if (system := DEPS_DEV_SYSTEMS.get(str(ecosystem))) is not None:
        data, ref = await clients.deps_dev().get_json(f"/v3/systems/{system}/packages/{quote(name, safe='')}")
        rows = sorted(data.get("versions", []), key=lambda v: v.get("publishedAt") or "")
        return [v["versionKey"]["version"] for v in rows], ref
    if ecosystem is Ecosystem.rubygems:
        data, ref = await clients.rubygems().get_json(f"/api/v1/versions/{quote(name, safe='')}.json")
        return [v["number"] for v in sorted(data, key=lambda v: v.get("created_at", ""))], ref
    data, ref = await clients.packagist().get_json(f"/p2/{name.lower()}.json")
    entries = data.get("packages", {}).get(name.lower(), [])
    return [e["version"] for e in reversed(entries) if e.get("version")], ref


async def _dist_tags(name: str) -> dict[str, str]:
    try:
        data, _ = await clients.npm().get_json(f"/-/package/{quote(name, safe='@')}/dist-tags")
    except UpstreamFailure:
        return {}
    return {k: v for k, v in data.items() if isinstance(v, str)}


async def list_versions(query: VersionsQuery) -> tuple[VersionsResult, list[SourceRef], list[str]]:
    name = normalize(query.name) if query.ecosystem is Ecosystem.pypi else query.name.strip()
    result = VersionsResult(ecosystem=query.ecosystem, name=name, exists=Tristate.unknown, range=query.range)
    key = cache_key("code", str(query.ecosystem), "versions", name)
    cached = await cache.get(key)
    sources: list[SourceRef] = []
    try:
        if cached is None:
            versions, ref = await _all_versions(query.ecosystem, name)
            await cache.set(key, versions, TTL_LATEST)
            sources.append(ref)
        else:
            versions = cached
    except UpstreamFailure as failure:
        if failure.kind == SourceStatus.not_found:
            result.exists = Tristate.no
            result.evidence.append(f"'{name}' is not published on {query.ecosystem}")
            return result, [SourceRef(name=failure.name, status=SourceStatus.not_found)], []
        result.retryable = True
        return result, [SourceRef(name=failure.name, status=SourceStatus.unavailable)], [failure.name]
    result.exists = Tristate.yes
    versions = order(query.ecosystem, versions)
    newest_first = versions[::-1]
    result.versions, result.truncated = newest_first[:VERSIONS_LIST_MAX], len(newest_first) > VERSIONS_LIST_MAX
    if query.ecosystem is Ecosystem.npm:
        result.dist_tags = await _dist_tags(name)
    if query.range:
        result.resolved, result.range_syntax = resolve(query.ecosystem, versions, query.range)
        if result.resolved is None:
            result.evidence.append(f"no published version satisfies '{query.range}'")
    return result, sources, []
