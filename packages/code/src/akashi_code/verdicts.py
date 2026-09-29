"""Turn registry facts + risk signals into one package verdict (precedence per specs/backend.md §3.2)."""

from datetime import UTC, datetime, timedelta

from akashi_code.constants import (
    SUSPICIOUS_MAX_VERSIONS,
    SUSPICIOUS_MAX_WEEKLY_DOWNLOADS,
    SUSPICIOUS_NEW_DAYS,
)
from akashi_code.models import Ecosystem, PackageResult, PackageVerdict, TypoTarget
from akashi_code.registries.base import PackageFacts
from akashi_code.risk.placeholder import placeholder_evidence
from akashi_code.risk.toplists import TopList
from akashi_core.contract.enums import Tristate

SEE_ALSO_VULNS = "For known vulnerabilities use the Pocket services package-advisories or taint-check."


def _age_days(iso: str | None) -> float | None:
    if not iso:
        return None
    published = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    return (datetime.now(UTC) - published) / timedelta(days=1)


def _low_traffic(facts: PackageFacts) -> bool:
    downloads = facts.downloads_last_week
    return downloads is None or downloads < SUSPICIOUS_MAX_WEEKLY_DOWNLOADS


def _suspicious_new(facts: PackageFacts) -> list[str]:
    age = _age_days(facts.first_published)
    if age is None or age >= SUSPICIOUS_NEW_DAYS:
        return []
    evidence = [f"first published {round(age)} days ago"]
    few_versions = facts.versions_count is not None and facts.versions_count <= SUSPICIOUS_MAX_VERSIONS
    if _low_traffic(facts):
        evidence.append(
            f"downloads last week: {facts.downloads_last_week if facts.downloads_last_week is not None else 'unknown'}"
        )
    elif not few_versions:
        return []
    if few_versions:
        evidence.append(f"{facts.versions_count} version(s) published")
    return evidence


def decide(
    ecosystem: Ecosystem,
    name: str,
    version: str | None,
    facts: PackageFacts,
    targets: list[TypoTarget],
    top: TopList,
) -> PackageResult:
    result = PackageResult(
        ecosystem=ecosystem,
        name=name,
        version=version,
        verdict=PackageVerdict.ok,
        exists=facts.exists,
        latest=facts.latest,
        version_exists=facts.version_exists,
        deprecated=bool(facts.deprecated_reason),
        deprecated_reason=facts.deprecated_reason,
        yanked=facts.yanked,
        yanked_reason=facts.yanked_reason,
        description=facts.description,
        first_published=facts.first_published,
        latest_published=facts.latest_published,
        versions_count=facts.versions_count,
        downloads_last_week=facts.downloads_last_week,
        popularity_rank=top.rank.get(name),
        versions_tail=facts.versions_tail,
        did_you_mean=[t.name for t in targets],
        see_also=[SEE_ALSO_VULNS],
    )
    best = targets[0] if targets else None

    if facts.exists is Tristate.unknown:
        result.verdict, result.retryable = PackageVerdict.unknown, True
        result.evidence.append("registry did not answer in time")
        return result
    if facts.exists is Tristate.no:
        result.verdict, result.typo_of = PackageVerdict.does_not_exist, best
        result.risk_signals.append("not_on_registry")
        result.evidence.append(f"'{name}' is not published on {ecosystem}")
        if best:
            result.evidence.append(f"closest popular name: '{best.name}' (distance {best.distance})")
        return result
    if placeholder := placeholder_evidence(facts):
        result.verdict = PackageVerdict.placeholder
        result.risk_signals.append("placeholder")
        result.evidence.extend(placeholder)
        return result
    suspicious = _suspicious_new(facts)
    if best and (_low_traffic(facts) if ecosystem is Ecosystem.npm else bool(suspicious)):
        result.verdict, result.typo_of = PackageVerdict.likely_typo, best
        result.risk_signals.append("typo_of_popular")
        result.evidence.append(f"{best.method}: '{name}' vs popular '{best.name}' (rank {best.target_rank})")
        result.evidence.extend(suspicious)
        return result
    if suspicious:
        result.verdict = PackageVerdict.suspicious_new
        result.risk_signals.append("new_low_signal")
        result.evidence.extend(suspicious)
        return result
    if facts.version_exists is Tristate.no:
        result.risk_signals.append("version_not_found")
        result.evidence.append(f"version {version} is not published; latest is {facts.latest}")
    if facts.yanked:
        result.verdict = PackageVerdict.yanked
        result.evidence.append(
            f"version {version} is yanked" + (f": {facts.yanked_reason}" if facts.yanked_reason else "")
        )
    elif facts.deprecated_reason:
        result.verdict = PackageVerdict.deprecated
        result.evidence.append(f"deprecated by its maintainer: {facts.deprecated_reason}")
    return result
