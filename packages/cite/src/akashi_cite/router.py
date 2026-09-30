"""HTTP routes for citation-verify (mounted under /cite; paths here are prefix-free)."""

from fastapi import APIRouter

from akashi_cite.claim import check_claim
from akashi_cite.constants import MAX_CITATIONS_PER_REQUEST, MAX_CLAIM_CHARS, MAX_EVIDENCE_CHARS
from akashi_cite.models import CitationResult, ClaimRequest, ClaimResult, VerifyRequest
from akashi_cite.service import verify as verify_citations
from akashi_cite.trail import Trail
from akashi_core.constants.app import SERVICE_CITE
from akashi_core.constants.deadlines import CITE_DEADLINE_S
from akashi_core.contract.build import build_envelope
from akashi_core.contract.envelope import Envelope
from akashi_core.deadline import current_deadline

router = APIRouter(prefix="/v1")

VERIFY_DESCRIPTION = (
    f"Checks up to {MAX_CITATIONS_PER_REQUEST} citations, given as strings or structured fields. DOIs, arXiv, "
    "PubMed and bibliographic references are matched against Crossref, DataCite, OpenAlex and PubMed; US case "
    "citations against the Caselaw Access Project; URLs are fetched, with the Wayback Machine alongside. Each result "
    "carries one verdict (verified, mismatch, not_found, retracted, ambiguous, unverifiable), the matched record, "
    f"field-level differences and retraction notices. Hard stop {CITE_DEADLINE_S} s."
)
CLAIM_DESCRIPTION = (
    f"Checks whether a source supports a claim of up to {MAX_CLAIM_CHARS} characters. The source is a citation "
    f"(its abstract is fetched) or evidence text you provide (up to {MAX_EVIDENCE_CHARS} characters), or both. "
    "A natural-language-inference model reads the most relevant sentences and answers supported, contradicted, "
    f"insufficient_evidence or unverifiable, quoting the deciding sentence. Hard stop {CITE_DEADLINE_S} s."
)


@router.post("/verify", operation_id="verify", summary="Verify citations", description=VERIFY_DESCRIPTION)
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


@router.post("/claim", operation_id="claim", summary="Check a claim against its source", description=CLAIM_DESCRIPTION)
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
