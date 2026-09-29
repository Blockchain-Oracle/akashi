"""Package verdict service: registry facts (cached) → risk signals → verdict."""

import dataclasses
from datetime import timedelta

from akashi_code.constants import TTL_LATEST, TTL_MISSING, TTL_VERSION
from akashi_code.models import Ecosystem, PackageQuery, PackageResult, PackageVerdict
from akashi_code.registries import npm, pypi
from akashi_code.registries.base import PackageFacts
from akashi_code.risk import toplists
from akashi_code.risk.typosquat import find_targets
from akashi_code.verdicts import decide
from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache
from akashi_core.contract.enums import SourceStatus, Tristate
from akashi_core.contract.sources import SourceRef

_FETCHERS = {Ecosystem.npm: npm.fetch, Ecosystem.pypi: pypi.fetch}
_SVC = "code"


def lookup_name(ecosystem: Ecosystem, name: str) -> str:
    name = name.strip()
    return pypi.normalize(name) if ecosystem is Ecosystem.pypi else name.lower()


def _ttl(facts: PackageFacts, version: str | None) -> timedelta:
    if facts.exists is Tristate.no:
        return TTL_MISSING
    return TTL_VERSION if version else TTL_LATEST


async def _facts(ecosystem: Ecosystem, name: str, version: str | None) -> PackageFacts:
    key = cache_key(_SVC, str(ecosystem), "facts", f"{name}@{version or 'latest'}")
    if (hit := await cache.get(key)) is not None:
        facts = PackageFacts(**{**hit, "sources": [SourceRef(**s) for s in hit["sources"]]})
        return facts
    facts = await _FETCHERS[ecosystem](name, version)
    if facts.exists is not Tristate.unknown:  # never cache an outage
        payload = {**dataclasses.asdict(facts), "sources": [ref.model_dump(mode="json") for ref in facts.sources]}
        await cache.set(key, payload, _ttl(facts, version))
    return facts


async def check_package(query: PackageQuery) -> tuple[PackageResult, list[SourceRef], list[str]]:
    name = lookup_name(query.ecosystem, query.name)
    if query.ecosystem not in _FETCHERS:
        result = PackageResult(
            ecosystem=query.ecosystem,
            name=name,
            version=query.version,
            verdict=PackageVerdict.unknown,
            exists=Tristate.unknown,
            evidence=["ecosystem not yet supported by this deployment"],
        )
        return result, [SourceRef(name=str(query.ecosystem), status=SourceStatus.not_applicable)], []
    facts = await _facts(query.ecosystem, name, query.version)
    top = toplists.get(query.ecosystem)
    result = decide(query.ecosystem, name, query.version, facts, find_targets(name, top), top)
    return result, facts.sources, facts.unavailable
