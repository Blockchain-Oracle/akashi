"""Symbol service: dispatch per ecosystem, cache answers forever per exact (package, version, symbol)."""

import asyncio
import dataclasses
from dataclasses import dataclass, field

from akashi_code.constants import TTL_SYMBOLS
from akashi_code.models import Ecosystem, SymbolQuery, SymbolResult, SymbolSuggestion
from akashi_code.symbols import go as go_symbols
from akashi_code.symbols import npm as npm_symbols
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
    Ecosystem.npm: npm_symbols.lookup,
}
_SOURCE_NAME = {
    Ecosystem.pypi: "pypi-files",
    Ecosystem.go: "pkgsite",
    Ecosystem.cargo: "docs.rs",
    Ecosystem.npm: "ts-introspect",
}


def _last_token(symbol: str) -> str:
    return symbol.replace(":", ".").split(".")[-1]


def _result(query: SymbolQuery, answer: SymbolAnswer, package_exists: Tristate, version: str | None) -> SymbolResult:
    last = answer.suggest_for or _last_token(query.symbol)
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
        pending=answer.pending,
        retry_after_ms=answer.retry_after_ms,
    )


@dataclass(slots=True)
class _Outcome:
    answer: SymbolAnswer
    version: str | None
    package_exists: Tristate
    sources: list[SourceRef] = field(default_factory=list)
    unavailable: list[str] = field(default_factory=list)


async def _resolve(query: SymbolQuery) -> _Outcome:
    """One symbol's answer: from the cache when the version is exact, else from the ecosystem's resolver."""
    lookup = _LOOKUPS.get(query.ecosystem)
    if lookup is None:
        return _Outcome(
            SymbolAnswer(Tristate.unknown, reason="symbols_not_supported_for_ecosystem"),
            query.version,
            Tristate.unknown,
        )
    key = cache_key("code", str(query.ecosystem), "sym", f"{query.package}@{query.version}#{query.symbol}")
    if query.version and (hit := await cache.get(key)) is not None:
        return _Outcome(SymbolAnswer(**hit["answer"]), hit["version"], Tristate.yes)
    try:
        answer, version = await lookup(query.package, query.version, query.symbol)
    except UpstreamFailure as failure:
        if failure.kind == SourceStatus.not_found:
            answer = SymbolAnswer(Tristate.no, reason="package_or_version_not_found")
            return _Outcome(
                answer, query.version, Tristate.no, [SourceRef(name=failure.name, status=SourceStatus.not_found)]
            )
        answer = SymbolAnswer(Tristate.unknown, reason="registry_unavailable")
        return _Outcome(
            answer,
            query.version,
            Tristate.unknown,
            [SourceRef(name=failure.name, status=SourceStatus.unavailable)],
            [failure.name],
        )
    if query.version and answer.exists is not Tristate.unknown:
        await cache.set(key, {"answer": dataclasses.asdict(answer), "version": version}, TTL_SYMBOLS)
    return _Outcome(
        answer, version, Tristate.yes, [SourceRef(name=_SOURCE_NAME[query.ecosystem], status=SourceStatus.ok)]
    )


async def _signed(query: SymbolQuery, failed: str, names: list[str], version: str | None) -> list[SymbolSuggestion]:
    """Each suggested name looked up in its place (axios.fetchJson → axios.get) for its signature, in parallel."""
    at = query.symbol.rfind(failed)

    async def one(name: str) -> SymbolSuggestion:
        if at < 0:
            return SymbolSuggestion(name=name)
        out = await _resolve(query.model_copy(update={"symbol": query.symbol[:at] + name, "version": version}))
        return SymbolSuggestion(
            name=name, signature=out.answer.signature if out.answer.exists is Tristate.yes else None
        )

    return list(await asyncio.gather(*(one(n) for n in names)))


async def check_symbol(query: SymbolQuery) -> tuple[SymbolResult, list[SourceRef], list[str]]:
    out = await _resolve(query)
    result = _result(query, out.answer, out.package_exists, out.version)
    if result.did_you_mean:
        failed = out.answer.suggest_for or _last_token(query.symbol)
        result.suggestions = await _signed(query, failed, result.did_you_mean, out.version or query.version)
    return result, out.sources, out.unavailable
