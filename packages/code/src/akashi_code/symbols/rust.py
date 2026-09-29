"""Rust symbols from docs.rs rustdoc JSON, projected to {path: (kind, signature)} and cached per crate version."""

from typing import Any
from urllib.parse import quote

import orjson
import zstandard

from akashi_code.constants import (
    RUSTDOC_FORMAT_MAX,
    RUSTDOC_FORMAT_MIN,
    RUSTDOC_MAX_DECOMPRESSED_BYTES,
    RUSTDOC_MAX_MODULE_DEPTH,
    TTL_SYMBOLS,
)
from akashi_code.registries import clients, others
from akashi_code.symbols.base import SymbolAnswer
from akashi_code.symbols.rustdoc_types import generic_params, render, render_fn
from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache
from akashi_core.constants.http import HTTP_CLIENT_ERROR_MIN, HTTP_NOT_FOUND
from akashi_core.contract.enums import SourceStatus, Tristate
from akashi_core.errors import UpstreamFailure

ITEM_KINDS = ("function", "struct", "enum", "trait", "type_alias", "constant", "static", "macro", "module", "union")
MEMBER_CONTAINERS = ("struct", "enum", "union")


def _kind(item: dict[str, Any]) -> str | None:
    inner = item.get("inner", {})
    return next((k for k in ITEM_KINDS if k in inner), None)


def _sig(name: str, item: dict[str, Any], kind: str) -> str:
    inner = item["inner"][kind]
    if kind == "function":
        return render_fn(name, inner)
    if kind in {"constant", "static"}:
        return f"{'const' if kind == 'constant' else 'static'} {name}: {render(inner.get('type'))}"
    if kind == "type_alias":
        return f"type {name}{generic_params(inner.get('generics'))} = {render(inner.get('type'))}"
    return f"{'pub ' if item.get('visibility') == 'public' else ''}{kind.replace('_', ' ')} {name}"


def project(doc: dict[str, Any]) -> dict[str, list[str]]:
    """Every public item reachable from the crate root → [kind, signature]; methods as Type::method."""
    idx: dict[str, Any] = doc["index"]
    table: dict[str, list[str]] = {}

    def add_members(owner: str, item: dict[str, Any], kind: str) -> None:
        impl_ids = item["inner"][kind].get("impls", []) if kind in MEMBER_CONTAINERS else []
        member_ids = [*item["inner"]["trait"].get("items", [])] if kind == "trait" else []
        for impl_id in impl_ids:
            impl = idx.get(str(impl_id), {}).get("inner", {}).get("impl")
            if impl and not impl.get("is_synthetic") and not impl.get("blanket_impl"):
                member_ids += impl.get("items", [])
        for mid in member_ids:
            member = idx.get(str(mid))
            if member and member.get("name") and (mk := _kind(member)):
                table.setdefault(
                    f"{owner}::{member['name']}",
                    ["method" if mk == "function" else mk, _sig(member["name"], member, mk)],
                )

    def walk(module_id: Any, prefix: str, depth: int) -> None:
        if depth > RUSTDOC_MAX_MODULE_DEPTH:
            return
        for child_id in idx.get(str(module_id), {}).get("inner", {}).get("module", {}).get("items", []):
            child = idx.get(str(child_id))
            if not child:
                continue
            if "use" in child.get("inner", {}):  # re-export: follow to the target item under the re-exported name
                use = child["inner"]["use"]
                target = idx.get(str(use.get("id")))
                if target and (tk := _kind(target)) and not use.get("is_glob"):
                    name = use.get("name") or target.get("name")
                    table.setdefault(f"{prefix}{name}", [tk, _sig(name, target, tk)])
                    add_members(f"{prefix}{name}", target, tk)
                continue
            name, kind = child.get("name"), _kind(child)
            if not name or not kind or child.get("visibility") != "public":
                continue
            table.setdefault(f"{prefix}{name}", [kind, _sig(name, child, kind)])
            if kind == "module":
                walk(child_id, f"{prefix}{name}::", depth + 1)
            else:
                add_members(f"{prefix}{name}", child, kind)

    walk(doc["root"], "", 0)
    return table


async def _table(crate: str, version: str) -> tuple[dict[str, list[str]], str] | None:
    """(projected table, resolved version) or None when docs.rs has no JSON for this version."""
    key = cache_key("code", "cargo", "rustdoc", f"{crate}@{version}")
    if version != "latest" and (hit := await cache.get(key)) is not None:
        return hit["table"], hit["version"]
    resp = await clients.docs_rs().request("GET", f"/crate/{quote(crate, safe='')}/{quote(version, safe='')}/json")
    if resp.status_code == HTTP_NOT_FOUND:
        return None
    if resp.status_code >= HTTP_CLIENT_ERROR_MIN:
        raise UpstreamFailure("docs.rs", SourceStatus.unavailable, str(resp.status_code))
    raw = zstandard.ZstdDecompressor().decompress(resp.content, max_output_size=RUSTDOC_MAX_DECOMPRESSED_BYTES)
    doc = orjson.loads(raw)
    if not RUSTDOC_FORMAT_MIN <= doc.get("format_version", 0) <= RUSTDOC_FORMAT_MAX:
        raise UpstreamFailure("docs.rs", "decode", f"format_version {doc.get('format_version')}")
    table, resolved = project(doc), doc.get("crate_version") or version
    await cache.set(
        cache_key("code", "cargo", "rustdoc", f"{crate}@{resolved}"), {"table": table, "version": resolved}, TTL_SYMBOLS
    )
    return table, resolved


async def lookup(package: str, version: str | None, symbol: str) -> tuple[SymbolAnswer, str | None]:
    crate = package.strip().replace("-", "_") if package.strip() else package
    wanted = symbol.strip().replace(".", "::")
    for prefix in (f"{crate}::", f"{package}::"):
        wanted = wanted.removeprefix(prefix)
    found = await _table(package.strip(), version or "latest")
    if found is None:
        facts = await others.cargo(package, version)  # distinguish "no JSON on docs.rs" from "no such crate"
        if facts.exists is Tristate.no or facts.version_exists is Tristate.no:
            raise UpstreamFailure("docs.rs", SourceStatus.not_found)
        return SymbolAnswer(Tristate.unknown, reason="rustdoc_json_unavailable", evidence_source="rustdoc"), version
    table, resolved = found
    if (hit := table.get(wanted)) is not None:
        return SymbolAnswer(
            Tristate.yes, hit[0], hit[1], defined_in=f"{crate}::{wanted}", evidence_source="rustdoc"
        ), resolved
    owner, _, last = wanted.rpartition("::")
    siblings = [p.rsplit("::", 1)[-1] for p in table if p.rpartition("::")[0] == owner]
    suggest_for = None
    if owner and owner not in table:  # the owning type/module itself is missing: suggest the owner instead
        siblings, suggest_for = [p for p in table if "::" not in p], owner.rsplit("::", 1)[-1]
    return SymbolAnswer(
        Tristate.no,
        defined_in=f"{crate}::{owner}" if owner else crate,
        siblings=siblings,
        evidence_source="rustdoc",
        suggest_for=suggest_for or last,
    ), resolved
