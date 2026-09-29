"""Registry adapters for cargo, go, maven, rubygems, packagist and nuget (existence, versions, yanked)."""

import re
import xml.etree.ElementTree as ET
from typing import Any
from urllib.parse import quote

import orjson

from akashi_code.constants import VERSIONS_TAIL
from akashi_code.registries import clients
from akashi_code.registries.base import PackageFacts
from akashi_code.registries.history import fill_history
from akashi_core.constants.http import HTTP_CLIENT_ERROR_MIN, HTTP_NOT_FOUND
from akashi_core.contract.enums import SourceStatus, Tristate
from akashi_core.errors import InvalidInput, UpstreamFailure
from akashi_core.http.client import UpstreamClient

_GONE = 410  # the Go proxy answers 410 for modules it refuses to serve
_UPPER = re.compile(r"[A-Z]")
_CRATE_SHORT = 3  # crates index layout: 1-, 2- and 3-character names have their own directories


def _missing(facts: PackageFacts, client: UpstreamClient) -> PackageFacts:
    facts.exists = Tristate.no
    facts.sources.append(client.source_ref(SourceStatus.not_found))
    return facts


def _down(facts: PackageFacts, client: UpstreamClient) -> PackageFacts:
    facts.unavailable.append(client.spec.name)
    facts.sources.append(client.source_ref(SourceStatus.unavailable))
    return facts


def _set_versions(facts: PackageFacts, versions: list[str], version: str | None) -> None:
    facts.versions_count = len(versions)
    facts.versions_tail = versions[-VERSIONS_TAIL:][::-1]
    if version:
        facts.version_exists = Tristate.yes if version in versions else Tristate.no


def _latest_stable(versions: list[str]) -> str | None:
    """Newest version without a pre-release suffix (e.g. '-beta2'); falls back to the newest overall."""
    stable = [v for v in versions if "-" not in v]
    return (stable or versions or [None])[-1]


def _crate_path(name: str) -> str:
    n = name.lower()
    if len(n) < _CRATE_SHORT:
        return f"/{len(n)}/{n}"
    if len(n) == _CRATE_SHORT:
        return f"/3/{n[0]}/{n}"
    return f"/{n[:2]}/{n[2:4]}/{n}"


async def cargo(name: str, version: str | None) -> PackageFacts:
    facts, client = PackageFacts(exists=Tristate.unknown), clients.crates()
    try:
        resp = await client.request("GET", _crate_path(name))
    except UpstreamFailure:
        return _down(facts, client)
    if resp.status_code == HTTP_NOT_FOUND:
        return _missing(facts, client)
    if resp.status_code >= HTTP_CLIENT_ERROR_MIN:
        return _down(facts, client)
    rows = [orjson.loads(line) for line in resp.content.splitlines() if line.strip()]
    facts.exists = Tristate.yes
    live = [r["vers"] for r in rows if not r.get("yanked")]
    facts.latest = _latest_stable(live) or rows[-1]["vers"]
    _set_versions(facts, [r["vers"] for r in rows], version)
    if version and (row := next((r for r in rows if r["vers"] == version), None)) and row.get("yanked"):
        facts.yanked = True
    facts.sources.append(client.source_ref(SourceStatus.ok))
    await fill_history(facts, "cargo", name)
    return facts


def _go_escape(module: str) -> str:
    return _UPPER.sub(lambda m: "!" + m.group(0).lower(), module)


async def go(name: str, version: str | None) -> PackageFacts:
    facts, client = PackageFacts(exists=Tristate.unknown), clients.go_proxy()
    path = _go_escape(name)
    try:
        resp = await client.request("GET", f"/{path}/@latest")
        listing = await client.request("GET", f"/{path}/@v/list")
    except UpstreamFailure:
        return _down(facts, client)
    if resp.status_code in {HTTP_NOT_FOUND, _GONE}:
        return _missing(facts, client)
    if resp.status_code >= HTTP_CLIENT_ERROR_MIN:
        return _down(facts, client)
    latest: dict[str, Any] = orjson.loads(resp.content)
    facts.exists, facts.latest, facts.latest_published = Tristate.yes, latest.get("Version"), latest.get("Time")
    versions = [v for v in listing.text.split() if v] if listing.status_code < HTTP_CLIENT_ERROR_MIN else []
    _set_versions(facts, versions, version)
    facts.sources.append(client.source_ref(SourceStatus.ok))
    await fill_history(facts, "go", name)
    return facts


async def maven(name: str, version: str | None) -> PackageFacts:
    facts, client = PackageFacts(exists=Tristate.unknown), clients.maven()
    group, sep, artifact = name.partition(":")
    if not sep or not group or not artifact:
        raise InvalidInput("Maven names are 'groupId:artifactId'.")
    try:
        resp = await client.request("GET", f"/maven2/{group.replace('.', '/')}/{artifact}/maven-metadata.xml")
    except UpstreamFailure:
        return _down(facts, client)
    if resp.status_code == HTTP_NOT_FOUND:
        return _missing(facts, client)
    if resp.status_code >= HTTP_CLIENT_ERROR_MIN:
        return _down(facts, client)
    root = ET.fromstring(resp.content)
    facts.exists = Tristate.yes
    facts.latest = root.findtext("versioning/release") or root.findtext("versioning/latest")
    _set_versions(facts, [v.text or "" for v in root.findall("versioning/versions/version")], version)
    facts.sources.append(client.source_ref(SourceStatus.ok))
    await fill_history(facts, "maven", name)
    return facts


async def rubygems(name: str, version: str | None) -> PackageFacts:
    facts, client = PackageFacts(exists=Tristate.unknown), clients.rubygems()
    try:
        gem, _ = await client.get_json(f"/api/v1/gems/{quote(name, safe='')}.json")
        history, _ = await client.get_json(f"/api/v1/versions/{quote(name, safe='')}.json")
    except UpstreamFailure as failure:
        return _missing(facts, client) if failure.kind == SourceStatus.not_found else _down(facts, client)
    facts.exists, facts.latest, facts.description = Tristate.yes, gem.get("version"), gem.get("info")
    ordered = sorted(history, key=lambda v: v.get("created_at", ""))
    _set_versions(facts, [v["number"] for v in ordered], version)
    if ordered:
        facts.first_published, facts.latest_published = ordered[0].get("created_at"), ordered[-1].get("created_at")
    facts.sources.append(client.source_ref(SourceStatus.ok))
    return facts


async def packagist(name: str, version: str | None) -> PackageFacts:
    facts, client = PackageFacts(exists=Tristate.unknown), clients.packagist()
    if "/" not in name:
        raise InvalidInput("Packagist names are 'vendor/package'.")
    try:
        data, _ = await client.get_json(f"/p2/{name.lower()}.json")
    except UpstreamFailure as failure:
        return _missing(facts, client) if failure.kind == SourceStatus.not_found else _down(facts, client)
    entries: list[dict[str, Any]] = data.get("packages", {}).get(name.lower(), [])
    if not entries:
        return _missing(facts, client)
    # Composer "minified" format: entries are newest first; later ones only carry changed keys.
    facts.exists, facts.latest = Tristate.yes, entries[0].get("version")
    facts.description = entries[0].get("description")
    times = [e["time"] for e in entries if e.get("time")]
    if times:
        facts.first_published, facts.latest_published = min(times), max(times)
    _set_versions(facts, [e["version"] for e in reversed(entries) if e.get("version")], version)
    facts.sources.append(client.source_ref(SourceStatus.ok))
    return facts


async def nuget(name: str, version: str | None) -> PackageFacts:
    facts, client = PackageFacts(exists=Tristate.unknown), clients.nuget()
    try:
        data, _ = await client.get_json(f"/v3-flatcontainer/{quote(name.lower(), safe='')}/index.json")
    except UpstreamFailure as failure:
        return _missing(facts, client) if failure.kind == SourceStatus.not_found else _down(facts, client)
    versions: list[str] = data.get("versions", [])
    facts.exists = Tristate.yes
    facts.latest = _latest_stable(versions)
    _set_versions(facts, versions, version.lower() if version else None)
    facts.sources.append(client.source_ref(SourceStatus.ok))
    await fill_history(facts, "nuget", name)
    return facts
