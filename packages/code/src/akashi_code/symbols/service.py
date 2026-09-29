"""Symbol service: dispatch per ecosystem, cache answers forever per exact (package, version, symbol)."""

import dataclasses

from akashi_code.constants import TTL_SYMBOLS
from akashi_code.models import Ecosystem, SymbolQuery, SymbolResult
from akashi_code.symbols import go as go_symbols
from akashi_code.symbols import rust as rust_symbols
from akashi_code.symbols.base import SymbolAnswer
from akashi_code.symbols.python import service as python_symbols
from akashi_code.symbols.suggest import suggest
from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache
from akashi_core.contract.enums import SourceStatus, Tristate
from akashi_core.contract.sources import SourceRef
from akashi_core.errors import UpstreamFailure

_LOOKUPS = {
    Ecosystem.pypi: python_symbols.lookup,
    Ecosystem.go: go_symbols.lookup,
    Ecosystem.cargo: rust_symbols.lookup,
}
_SOURCE_NAME = {Ecosystem.pypi: "pypi-files", Ecosystem.go: "pkgsite", Ecosystem.cargo: "docs.rs"}


def _result(query: SymbolQuery, answer: SymbolAnswer, package_exists: Tristate, version: str | None) -> SymbolResult:
    last = answer.suggest_for or query.symbol.replace(":", ".").split(".")[-1]
    return SymbolResult(
        ecosystem=query.ecosystem,
        package=query.package,
        symbol=query.symbol,
        package_exists=package_exists,
        resolved_version=version,
        exists=answer.exists,
        symbol_kind=answer.symbol_kind,
        signature=answer.signature,
        overloads=answer.overloads,
        defined_in=answer.defined_in,
        evidence_source=answer.evidence_source,
        reason=answer.reason,
        did_you_mean=suggest(last, answer.siblings) if answer.exists is Tristate.no else [],
    )


async def check_symbol(query: SymbolQuery) -> tuple[SymbolResult, list[SourceRef], list[str]]:
    lookup = _LOOKUPS.get(query.ecosystem)
    if lookup is None:
        answer = SymbolAnswer(Tristate.unknown, reason="symbols_not_supported_for_ecosystem")
        return _result(query, answer, Tristate.unknown, query.version), [], []
    key = cache_key("code", str(query.ecosystem), "sym", f"{query.package}@{query.version}#{query.symbol}")
    if query.version and (hit := await cache.get(key)) is not None:
        answer = SymbolAnswer(**hit["answer"])
        return _result(query, answer, Tristate.yes, hit["version"]), [], []
    source = _SOURCE_NAME[query.ecosystem]
    try:
        answer, version = await lookup(query.package, query.version, query.symbol)
    except UpstreamFailure as failure:
        if failure.kind == SourceStatus.not_found:
            answer = SymbolAnswer(Tristate.no, reason="package_or_version_not_found")
            return (
                _result(query, answer, Tristate.no, query.version),
                [SourceRef(name=failure.name, status=SourceStatus.not_found)],
                [],
            )
        answer = SymbolAnswer(Tristate.unknown, reason="registry_unavailable")
        return (
            _result(query, answer, Tristate.unknown, query.version),
            [SourceRef(name=failure.name, status=SourceStatus.unavailable)],
            [failure.name],
        )
    if query.version and answer.exists is not Tristate.unknown:
        await cache.set(key, {"answer": dataclasses.asdict(answer), "version": version}, TTL_SYMBOLS)
    return _result(query, answer, Tristate.yes, version), [SourceRef(name=source, status=SourceStatus.ok)], []
