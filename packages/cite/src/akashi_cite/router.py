"""HTTP routes for citation-verify (mounted under /cite; paths here are prefix-free)."""

from fastapi import APIRouter

from akashi_cite.claim import check_claim
from akashi_cite.models import CitationResult, ClaimRequest, ClaimResult, VerifyRequest
from akashi_cite.service import verify as verify_citations
from akashi_cite.trail import Trail
from akashi_core.constants.app import SERVICE_CITE
from akashi_core.constants.deadlines import CITE_DEADLINE_S
from akashi_core.contract.build import build_envelope
from akashi_core.contract.envelope import Envelope
from akashi_core.deadline import current_deadline

router = APIRouter(prefix="/v1")


@router.post("/verify")
async def verify(body: VerifyRequest) -> Envelope[CitationResult]:
    deadline = current_deadline(CITE_DEADLINE_S)
    results, sources, unavailable = await verify_citations(body)
    return build_envelope(
        service=SERVICE_CITE,
        operation="verify",
        deadline=deadline,
        results=results,
        sources=sources,
        unavailable=unavailable,
        summary_field="verdict",
    )


@router.post("/claim")
async def claim(body: ClaimRequest) -> Envelope[ClaimResult]:
    deadline = current_deadline(CITE_DEADLINE_S)
    trail = Trail()
    result = await check_claim(body, trail)
    return build_envelope(
        service=SERVICE_CITE,
        operation="claim",
        deadline=deadline,
        results=[result],
        sources=trail.sources,
        unavailable=trail.unavailable,
        summary_field="verdict",
    )
