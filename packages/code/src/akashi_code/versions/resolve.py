"""Resolve a version range with each ecosystem's own rules (npm/cargo semver, PEP 440, exact otherwise)."""

import re

import semantic_version as sv
from packaging.specifiers import InvalidSpecifier, SpecifierSet
from packaging.version import InvalidVersion, Version

from akashi_code.models import Ecosystem
from akashi_core.errors import InvalidInput

# Go pseudo-versions (vX.Y.Z-yyyymmddhhmmss-abcdefabcdef) are commit snapshots, not releases.
GO_PSEUDO_VERSION = re.compile(r"-(0\.)?\d{14}-[0-9a-f]{12}$")


def _semver(raw: str) -> sv.Version | None:
    try:
        return sv.Version(raw.removeprefix("v"))
    except ValueError:
        return None


def resolve(ecosystem: Ecosystem, versions: list[str], spec: str) -> tuple[str | None, str]:
    """(highest matching version, syntax used). `versions` may be in any order."""
    if ecosystem is Ecosystem.pypi:
        try:
            spec_set = SpecifierSet(spec)
        except InvalidSpecifier as exc:
            raise InvalidInput(f"'{spec}' is not a valid PEP 440 specifier.") from exc
        parsed = []
        for raw in versions:
            try:
                parsed.append((Version(raw), raw))
            except InvalidVersion:
                continue
        matches = [raw for ver, raw in sorted(parsed) if spec_set.contains(ver, prereleases=False)]
        return (matches[-1] if matches else None), "pep440"
    if ecosystem in {Ecosystem.npm, Ecosystem.cargo, Ecosystem.go}:
        spec_cls = sv.NpmSpec if ecosystem in {Ecosystem.npm, Ecosystem.go} else sv.SimpleSpec
        try:
            matcher = spec_cls(spec.removeprefix("v"))
        except ValueError as exc:
            raise InvalidInput(f"'{spec}' is not a valid {ecosystem} range.") from exc
        by_parsed = {p: raw for raw in versions if (p := _semver(raw)) is not None}
        best = matcher.select(by_parsed)
        return (by_parsed[best] if best is not None else None), ("npm" if spec_cls is sv.NpmSpec else "cargo")
    # maven / rubygems / packagist / nuget: exact match only (their range grammars are not implemented)
    return (spec if spec in versions else None), "exact"


def _pep440_key(raw: str) -> Version | None:
    try:
        return Version(raw)
    except InvalidVersion:
        return None


_SEMVER_FIRST = frozenset({Ecosystem.npm, Ecosystem.cargo, Ecosystem.go})


def order(ecosystem: Ecosystem, versions: list[str]) -> list[str]:
    """Oldest → newest by version precedence, using whichever grammar (semver or PEP 440) parses more versions.

    Unparseable versions keep their publish order and sort as oldest.
    """
    if ecosystem is Ecosystem.go:
        versions = [v for v in versions if not GO_PSEUDO_VERSION.search(v)]
    sem = {raw: k for raw in versions if (k := _semver(raw)) is not None}
    pep = {raw: k for raw in versions if (k := _pep440_key(raw)) is not None}
    prefer_semver = len(sem) > len(pep) or (len(sem) == len(pep) and ecosystem in _SEMVER_FIRST)
    keys = sem if prefer_semver else pep
    if not keys:
        return versions
    unparsed = [raw for raw in versions if raw not in keys]
    return unparsed + sorted(keys, key=keys.__getitem__)
