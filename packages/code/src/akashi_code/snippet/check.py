"""Verify every import and member reference in a snippet against the real registries."""

import json
import sys
from dataclasses import dataclass
from importlib import resources

from akashi_code.constants import CHECK_CONCURRENCY, MAX_CHECK_TARGETS
from akashi_code.models import (
    CheckLanguage,
    CheckRequest,
    Diagnostic,
    DiagnosticVerdict,
    Ecosystem,
    PackageQuery,
    PackageResult,
    PackageVerdict,
    SymbolQuery,
    SymbolResult,
)
from akashi_code.service import check_package
from akashi_code.snippet import extract_go, extract_js, extract_python, extract_rust
from akashi_code.snippet.extract_rust import LOCAL_ROOTS as RUST_LOCAL_ROOTS
from akashi_code.snippet.languages import Language
from akashi_code.snippet.model import Binding, Extracted, Ref
from akashi_code.symbols.service import check_symbol
from akashi_core.contract.enums import Tristate
from akashi_core.contract.sources import SourceRef
from akashi_core.fanout import gather_limited

_ECOSYSTEM = {
    CheckLanguage.python: Ecosystem.pypi,
    CheckLanguage.typescript: Ecosystem.npm,
    CheckLanguage.javascript: Ecosystem.npm,
    CheckLanguage.go: Ecosystem.go,
    CheckLanguage.rust: Ecosystem.cargo,
}
NODE_BUILTINS = frozenset(
    {
        "assert",
        "async_hooks",
        "buffer",
        "child_process",
        "cluster",
        "crypto",
        "dgram",
        "dns",
        "events",
        "fs",
        "fs/promises",
        "http",
        "http2",
        "https",
        "module",
        "net",
        "os",
        "path",
        "perf_hooks",
        "process",
        "querystring",
        "readline",
        "stream",
        "string_decoder",
        "timers",
        "tls",
        "tty",
        "url",
        "util",
        "v8",
        "vm",
        "worker_threads",
        "zlib",
    }
)
_PACKAGE_TO_DIAG = {
    PackageVerdict.ok: DiagnosticVerdict.ok,
    PackageVerdict.does_not_exist: DiagnosticVerdict.nonexistent_package,
    PackageVerdict.placeholder: DiagnosticVerdict.placeholder,
    PackageVerdict.likely_typo: DiagnosticVerdict.likely_typo,
    PackageVerdict.suspicious_new: DiagnosticVerdict.suspicious_new,
    PackageVerdict.deprecated: DiagnosticVerdict.deprecated,
    PackageVerdict.yanked: DiagnosticVerdict.deprecated,
    PackageVerdict.unknown: DiagnosticVerdict.unknown,
}
_PY_IMPORT_MAP: dict[str, str] = json.loads(
    resources.files("akashi_code.data").joinpath("py_import_map.json").read_text()
)


@dataclass(frozen=True, slots=True)
class Target:
    package: str  # registry name used for the package verdict ("" = stdlib/builtin: no package check)
    lookup_package: str  # name the symbol resolver expects (e.g. "next/server", "os")
    symbol: str | None


def _package_of(lang: CheckLanguage, spec: str) -> tuple[str, str]:
    """(registry package, symbol-lookup package) for an import spec; registry "" means stdlib/builtin."""
    if lang is CheckLanguage.python:
        root = spec.split(".")[0]
        if root in sys.stdlib_module_names:
            return "", root
        name = _PY_IMPORT_MAP.get(spec) or _PY_IMPORT_MAP.get(root) or root
        return name, name
    if lang in {CheckLanguage.typescript, CheckLanguage.javascript}:
        bare = spec.removeprefix("node:")
        if spec.startswith("node:") or bare in NODE_BUILTINS or bare.split("/")[0] in NODE_BUILTINS:
            return "", ""
        parts = spec.split("/")
        return ("/".join(parts[:2]) if spec.startswith("@") else parts[0]), spec
    if lang is CheckLanguage.go:
        return ("" if "." not in spec.split("/")[0] else spec), spec  # no dot in the first element → stdlib
    return spec, spec  # rust crate


def _symbol_for(lang: CheckLanguage, b: Binding, path: list[str]) -> str | None:
    if lang is CheckLanguage.python:
        return ".".join([b.spec, *([b.attr] if b.attr else []), *path])
    if lang in {CheckLanguage.typescript, CheckLanguage.javascript}:
        base = b.spec.split("/")[-1]
        head = [base] if b.attr == "default" else ([b.attr] if b.attr else [])
        return ".".join([*head, *path]) or None
    if lang is CheckLanguage.go:
        return ".".join(path) or None
    return "::".join([*(b.attr.split("::") if b.attr else []), *path]) or None


def _extract(lang: CheckLanguage, code: bytes) -> Extracted:
    if lang is CheckLanguage.python:
        return extract_python.extract(code)
    if lang is CheckLanguage.go:
        return extract_go.extract(code)
    if lang is CheckLanguage.rust:
        return extract_rust.extract(code)
    return extract_js.extract(code, Language(lang.value))


def _resolve_ref(
    ref: Ref, bindings: dict[str, Binding], instances: dict[str, tuple[str, list[str]]]
) -> tuple[Binding, list[str]] | None:
    if ref.root in bindings:
        return bindings[ref.root], ref.path
    if ref.root in instances and instances[ref.root][0] in bindings:
        root, ctor_path = instances[ref.root]
        return bindings[root], [*ctor_path, *ref.path]
    return None


async def check_snippet(req: CheckRequest) -> tuple[list[Diagnostic], list[SourceRef], list[str]]:
    eco = _ECOSYSTEM[req.language]
    ext = _extract(req.language, req.code.encode())
    bindings = {b.alias: b for b in ext.bindings}
    if req.language is CheckLanguage.rust:
        # A fully-qualified path (serde_json::from_str) names its crate without a `use`: bind the crate implicitly.
        for ref in ext.refs:
            if ref.root not in bindings and ref.root not in RUST_LOCAL_ROOTS and ref.root[:1].islower():
                bindings[ref.root] = Binding(ref.root, ref.root, None, ref.span)
    planned: list[tuple[str, Binding | Ref, Target]] = []
    for b in ext.bindings:
        pkg, lookup_pkg = _package_of(req.language, b.spec)
        wants_symbol = b.attr not in (None, "default")
        planned.append(
            ("import", b, Target(pkg, lookup_pkg, _symbol_for(req.language, b, []) if wants_symbol else None))
        )
    for ref in ext.refs:
        if (resolved := _resolve_ref(ref, bindings, ext.instances)) is None:
            continue
        binding, path = resolved
        pkg, lookup_pkg = _package_of(req.language, binding.spec)
        if lookup_pkg:
            planned.append(
                (
                    "call" if ref.is_call else "attribute",
                    ref,
                    Target(pkg, lookup_pkg, _symbol_for(req.language, binding, path)),
                )
            )
    planned = planned[:MAX_CHECK_TARGETS]

    packages = sorted({t.package for _, _, t in planned if t.package})
    pkg_results = await gather_limited(
        (check_package(PackageQuery(ecosystem=eco, name=p, version=req.versions.get(p))) for p in packages),
        CHECK_CONCURRENCY,
    )
    by_pkg: dict[str, PackageResult] = {}
    sources: list[SourceRef] = []
    unavailable: list[str] = []
    for name, outcome in zip(packages, pkg_results, strict=True):
        if isinstance(outcome, BaseException):
            continue
        by_pkg[name], refs, missing = outcome
        sources.extend(refs)
        unavailable.extend(missing)

    def usable(t: Target) -> bool:
        res = by_pkg.get(t.package)
        if not t.symbol or not t.lookup_package:  # builtins (node:fs) have nothing to look up
            return False
        return not t.package or (res is not None and res.exists is Tristate.yes)

    symbol_targets: list[tuple[str, str, str | None]] = sorted(
        {(t.lookup_package, t.symbol, req.versions.get(t.package)) for _, _, t in planned if usable(t) and t.symbol},
        key=str,
    )
    sym_results = await gather_limited(
        (check_symbol(SymbolQuery(ecosystem=eco, package=p, version=v, symbol=s)) for p, s, v in symbol_targets),
        CHECK_CONCURRENCY,
    )
    by_sym: dict[tuple[str, str], SymbolResult] = {}
    for (p, s, _), outcome in zip(symbol_targets, sym_results, strict=True):
        if not isinstance(outcome, BaseException):
            by_sym[(p, s)], refs, missing = outcome  # type: ignore[index]
            sources.extend(refs)
            unavailable.extend(missing)
    return [_diagnostic(kind, node, t, by_pkg, by_sym) for kind, node, t in planned], sources, unavailable


def _diagnostic(
    kind: str,
    node: Binding | Ref,
    t: Target,
    by_pkg: dict[str, PackageResult],
    by_sym: dict[tuple[str, str], SymbolResult],
) -> Diagnostic:
    span = node.span
    text = node.text if isinstance(node, Ref) else f"{node.spec}{'.' + node.attr if node.attr else ''}"
    base = {
        "line": span.line,
        "column": span.column,
        "end_line": span.end_line,
        "end_column": span.end_column,
        "text": text,
        "ref_kind": kind,
        "package": t.package or t.lookup_package or None,
        "target": t.symbol,
    }
    pkg = by_pkg.get(t.package)
    # 1) Package problems win: a missing/placeholder/typo package is the root cause for every line that uses it.
    package_problem = pkg is not None and (
        pkg.exists is not Tristate.yes or (kind == "import" and pkg.verdict is not PackageVerdict.ok)
    )
    if pkg is not None and package_problem:
        hint = f"did you mean '{pkg.typo_of.name}'?" if pkg.typo_of else None
        return Diagnostic(
            **base,
            version=pkg.version or pkg.latest,
            verdict=_PACKAGE_TO_DIAG[pkg.verdict],
            fix_hint=hint,
            did_you_mean=pkg.did_you_mean,
            reason="; ".join(pkg.evidence)[:300] or None,
        )
    # 2) Symbol verdicts.
    sym = by_sym.get((t.lookup_package, t.symbol or ""))
    if sym is None:
        verdict = DiagnosticVerdict.ok if kind == "import" else DiagnosticVerdict.unknown
        return Diagnostic(**base, version=pkg.latest if pkg else None, verdict=verdict)
    if sym.exists is Tristate.no:
        hint = f"did you mean '{sym.did_you_mean[0]}'?" if sym.did_you_mean else None
        return Diagnostic(
            **base,
            version=sym.resolved_version,
            verdict=DiagnosticVerdict.nonexistent_symbol,
            fix_hint=hint,
            did_you_mean=sym.did_you_mean,
            reason=sym.reason,
        )
    verdict = DiagnosticVerdict.ok if sym.exists is Tristate.yes else DiagnosticVerdict.unknown
    return Diagnostic(**base, version=sym.resolved_version, verdict=verdict, signature=sym.signature, reason=sym.reason)
