"""HTTP routes for code-reality-check (mounted under /code; paths here are prefix-free)."""

from fastapi import APIRouter

from akashi_code.constants import (
    MAX_CHECK_CODE_BYTES,
    MAX_CHECK_TARGETS,
    MAX_PACKAGES_PER_REQUEST,
    MAX_SYMBOLS_PER_REQUEST,
    PACKAGES_CONCURRENCY,
)
from akashi_code.models import (
    CheckLanguage,
    CheckRequest,
    Diagnostic,
    Ecosystem,
    PackageQuery,
    PackageResult,
    PackagesRequest,
    SymbolQuery,
    SymbolResult,
    SymbolsQuery,
    VersionsQuery,
    VersionsResult,
)
from akashi_code.service import check_package
from akashi_code.snippet.check import check_snippet
from akashi_code.symbols.service import check_symbol
from akashi_code.versions.service import list_versions
from akashi_core.constants.app import SERVICE_CODE
from akashi_core.constants.deadlines import CODE_DEADLINE_S
from akashi_core.contract.build import build_envelope
from akashi_core.contract.envelope import Envelope
from akashi_core.contract.sources import SourceRef
from akashi_core.deadline import current_deadline
from akashi_core.fanout import gather_limited

router = APIRouter(prefix="/v1")

ECOSYSTEMS = ", ".join(e.value for e in Ecosystem)
SYMBOL_ECOSYSTEMS = "npm, pypi, cargo and go"  # where a language index answers symbol questions
LANGUAGES = ", ".join(language.value for language in CheckLanguage)
HARD_STOP = f"Hard stop {CODE_DEADLINE_S:g} s."

PACKAGE_DESCRIPTION = (
    f"Checks one package in one registry ({ECOSYSTEMS}) and, optionally, one version. The verdict is the first that "
    "applies of does_not_exist, placeholder, likely_typo, suspicious_new, yanked or deprecated, else ok; unknown when "
    f"the registry did not answer in time. Evidence strings say why. {HARD_STOP}"
)
PACKAGES_DESCRIPTION = (
    f"The same check as /v1/package for up to {MAX_PACKAGES_PER_REQUEST} packages, in any mix of registries, with "
    f"one result each in request order. {HARD_STOP}"
)
VERSIONS_DESCRIPTION = (
    "Lists a package's published versions, newest first, and resolves a version range with the registry's own "
    f"rules (npm semver, cargo, PEP 440; exact elsewhere). {HARD_STOP}"
)
SYMBOL_DESCRIPTION = (
    f"Checks that a function, class, method or attribute exists in a package version ({SYMBOL_ECOSYSTEMS}), read "
    "from the package's own type definitions or source. When it exists, the signature is returned; when it does "
    f"not, similar real names where the index offers them. {HARD_STOP}"
)
SYMBOLS_DESCRIPTION = (
    f"The same check as /v1/symbol for up to {MAX_SYMBOLS_PER_REQUEST} symbols of one package version. {HARD_STOP}"
)
CHECK_DESCRIPTION = (
    f"Parses a snippet ({LANGUAGES}, up to {MAX_CHECK_CODE_BYTES:,} bytes) and checks every import and "
    f"call it makes: that each package exists and each symbol exists in it, up to {MAX_CHECK_TARGETS} distinct "
    "references. Returns one diagnostic per reference with its line and column, and optional version pins via "
    f"`versions`. {HARD_STOP}"
)


@router.post("/package", operation_id="package", summary="Check a package", description=PACKAGE_DESCRIPTION)
async def package(query: PackageQuery) -> Envelope[PackageResult]:
    deadline = current_deadline(CODE_DEADLINE_S)
    result, sources, unavailable = await check_package(query)
    return build_envelope(
        service=SERVICE_CODE,
        operation="package",
        deadline=deadline,
        results=[result],
        sources=sources,
        unavailable=unavailable,
        summary_field="verdict",
    )


@router.post("/packages", operation_id="packages", summary="Check several packages", description=PACKAGES_DESCRIPTION)
async def packages(body: PackagesRequest) -> Envelope[PackageResult]:
    deadline = current_deadline(CODE_DEADLINE_S)
    outcomes = await gather_limited((check_package(q) for q in body.items), PACKAGES_CONCURRENCY)
    results: list[PackageResult] = []
    sources: list[SourceRef] = []
    unavailable: list[str] = []
    for outcome in outcomes:
        if isinstance(outcome, BaseException):
            raise outcome
        result, refs, missing = outcome
        results.append(result)
        sources.extend(refs)
        unavailable.extend(missing)
    return build_envelope(
        service=SERVICE_CODE,
        operation="packages",
        deadline=deadline,
        results=results,
        sources=sources,
        unavailable=unavailable,
        summary_field="verdict",
    )


@router.post(
    "/versions", operation_id="versions", summary="List and resolve versions", description=VERSIONS_DESCRIPTION
)
async def versions(query: VersionsQuery) -> Envelope[VersionsResult]:
    deadline = current_deadline(CODE_DEADLINE_S)
    result, sources, unavailable = await list_versions(query)
    return build_envelope(
        service=SERVICE_CODE,
        operation="versions",
        deadline=deadline,
        results=[result],
        sources=sources,
        unavailable=unavailable,
        summary_field="exists",
    )


@router.post("/symbol", operation_id="symbol", summary="Check a symbol", description=SYMBOL_DESCRIPTION)
async def symbol(query: SymbolQuery) -> Envelope[SymbolResult]:
    deadline = current_deadline(CODE_DEADLINE_S)
    result, sources, unavailable = await check_symbol(query)
    return build_envelope(
        service=SERVICE_CODE,
        operation="symbol",
        deadline=deadline,
        results=[result],
        sources=sources,
        unavailable=unavailable,
        summary_field="exists",
    )


@router.post("/symbols", operation_id="symbols", summary="Check several symbols", description=SYMBOLS_DESCRIPTION)
async def symbols(body: SymbolsQuery) -> Envelope[SymbolResult]:
    deadline = current_deadline(CODE_DEADLINE_S)
    queries = [
        SymbolQuery(ecosystem=body.ecosystem, package=body.package, version=body.version, symbol=s)
        for s in body.symbols
    ]
    outcomes = await gather_limited((check_symbol(q) for q in queries), PACKAGES_CONCURRENCY)
    results: list[SymbolResult] = []
    sources: list[SourceRef] = []
    unavailable: list[str] = []
    for outcome in outcomes:
        if isinstance(outcome, BaseException):
            raise outcome
        result, refs, missing = outcome
        results.append(result)
        sources.extend(refs)
        unavailable.extend(missing)
    return build_envelope(
        service=SERVICE_CODE,
        operation="symbols",
        deadline=deadline,
        results=results,
        sources=sources,
        unavailable=unavailable,
        summary_field="exists",
    )


@router.post("/check", operation_id="check", summary="Check a code snippet", description=CHECK_DESCRIPTION)
async def check(body: CheckRequest) -> Envelope[Diagnostic]:
    deadline = current_deadline(CODE_DEADLINE_S)
    diagnostics, sources, unavailable = await check_snippet(body)
    return build_envelope(
        service=SERVICE_CODE,
        operation="check",
        deadline=deadline,
        results=diagnostics,
        sources=sources,
        unavailable=unavailable,
        summary_field="verdict",
    )
