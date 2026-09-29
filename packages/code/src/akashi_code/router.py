"""HTTP routes for code-reality-check (mounted under /code; paths here are prefix-free)."""

from fastapi import APIRouter

from akashi_code.constants import PACKAGES_CONCURRENCY
from akashi_code.models import PackageQuery, PackageResult, PackagesRequest, VersionsQuery, VersionsResult
from akashi_code.service import check_package
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
