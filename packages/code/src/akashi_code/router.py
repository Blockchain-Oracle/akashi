"""HTTP routes for code-reality-check (mounted under /code; paths here are prefix-free)."""

from fastapi import APIRouter

from akashi_code.constants import PACKAGES_CONCURRENCY
from akashi_code.models import (
    CheckRequest,
    Diagnostic,
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


@router.post("/package")
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


@router.post("/packages")
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


@router.post("/versions")
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


@router.post("/symbol")
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


@router.post("/symbols")
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


@router.post("/check")
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
