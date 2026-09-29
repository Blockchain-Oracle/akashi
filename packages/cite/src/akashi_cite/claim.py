"""/claim: does the cited source (or the given text) support the claim? Evidence first, then NLI.

Premise chain (first that answers): provided text → Europe PMC abstract → OpenAlex abstract → DataCite/Crossref
abstract. Abstract sentences are preselected lexically so the model scores ≤ ~9 pairs, and the sidecar is asked
to warm up before any of that starts so a cold load overlaps the evidence fetching.
"""

import re
from http import HTTPStatus
from typing import Literal

from rapidfuzz import fuzz

from akashi_cite.constants import (
    DATACITE,
    EUROPEPMC,
    MIN_SENTENCE_CHARS,
    NLI,
    NLI_CONTRA_MIN,
    NLI_ENTAIL_MIN,
    NLI_MAX_PREMISE_SENTENCES,
    NLI_OPPOSING_MAX,
    NLI_PREMISE_MAX_CHARS,
    NLI_TOP_SENTENCES,
    NLI_WINDOW_FROM_TOP,
    OPENALEX,
)
from akashi_cite.match import norm
from akashi_cite.models import (
    CitationResult,
    CitationVerdict,
    ClaimRequest,
    ClaimResult,
    ClaimScores,
    ClaimVerdict,
    VerifyOptions,
)
from akashi_cite.service import verify_one
from akashi_cite.sources import clients, datacite, europepmc, openalex
from akashi_cite.trail import Trail
from akashi_core.errors import UpstreamFailure
from akashi_core.singleflight import spawn_background

EvidenceScope = Literal["abstract", "provided_text"]
USABLE_CITATIONS = frozenset({CitationVerdict.verified, CitationVerdict.mismatch, CitationVerdict.retracted})
ARXIV_DOI_PREFIX = "10.48550/"
_ABBREVIATIONS = ("et al.", "e.g.", "i.e.", "vs.", "Fig.", "fig.", "approx.", "Dr.", "Prof.", "No.", "ca.", "cf.")
_PROTECT = "․"  # one-dot leader stands in for an abbreviation's period while splitting
_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"(\[])")


def sentences(text: str) -> list[str]:
    guarded = text
    for abbr in _ABBREVIATIONS:
        guarded = guarded.replace(abbr, abbr.replace(".", _PROTECT))
    parts = [p.replace(_PROTECT, ".").strip() for p in _SENTENCE_RE.split(guarded)]
    return [p for p in parts if len(p) >= MIN_SENTENCE_CHARS][:NLI_MAX_PREMISE_SENTENCES]


def premises(text: str, claim: str) -> list[str]:
    """Top lexical matches plus adjacent-sentence windows around the best ones.

    Never the whole abstract: it truncates to MAX_TOKENS and, batched, pads every pair to that length (a 9-pair
    request on long abstracts took >5 s on the server; sentences and windows carry the same evidence).
    """
    sents = sentences(text) or [text[:NLI_PREMISE_MAX_CHARS]]  # provided text may be one long sentence
    ranked = sorted(range(len(sents)), key=lambda i: fuzz.token_set_ratio(norm(sents[i]), norm(claim)), reverse=True)
    chosen = [sents[i] for i in ranked[:NLI_TOP_SENTENCES]]
    for i in ranked[:NLI_WINDOW_FROM_TOP]:
        if i + 1 < len(sents):
            chosen.append(f"{sents[i]} {sents[i + 1]}")
    unique = list(dict.fromkeys(p[:NLI_PREMISE_MAX_CHARS] for p in chosen if p))
    return unique


async def _warm() -> None:
    try:
        await clients.nli().request("POST", "/warm")
    except UpstreamFailure:
        pass  # /score will report the sidecar as unavailable


async def _score(premise_list: list[str], claim: str) -> tuple[str, list[ClaimScores]]:
    resp = await clients.nli().request(
        "POST", "/score", json={"pairs": [{"premise": p, "hypothesis": claim} for p in premise_list]}
    )
    if resp.status_code != HTTPStatus.OK:
        raise UpstreamFailure(NLI.name, "unavailable", str(resp.status_code))
    body = resp.json()
    return body["model"], [ClaimScores(**s) for s in body["scores"]]


async def _abstract(doi: str, trail: Trail) -> tuple[str | None, str | None]:
    """(abstract text, source name) from the first source that has one."""
    try:
        if text := await europepmc.abstract(doi):
            trail.ok(EUROPEPMC)
            return text, EUROPEPMC.name
        trail.ok(EUROPEPMC)
    except UpstreamFailure as failure:
        trail.failure(EUROPEPMC, failure)
    try:
        work = await openalex.work(doi)
        trail.ok(OPENALEX)
        if work and (text := openalex.abstract(work)):
            return text, OPENALEX.name
    except UpstreamFailure as failure:
        trail.failure(OPENALEX, failure)
    if doi.startswith(ARXIV_DOI_PREFIX):
        try:
            rec = await datacite.work(doi)
            trail.ok(DATACITE)
            if rec and rec.abstract:
                return rec.abstract, DATACITE.name
        except UpstreamFailure as failure:
            trail.failure(DATACITE, failure)
    return None, None


def _decide(premise_list: list[str], scores: list[ClaimScores]) -> tuple[ClaimVerdict, int]:
    """(verdict, index of the deciding premise). Supported needs strong entailment without contradiction."""
    best_e = max(range(len(scores)), key=lambda i: scores[i].entailment)
    best_c = max(range(len(scores)), key=lambda i: scores[i].contradiction)
    if scores[best_e].entailment >= NLI_ENTAIL_MIN and scores[best_e].contradiction < NLI_OPPOSING_MAX:
        return ClaimVerdict.supported, best_e
    if scores[best_c].contradiction >= NLI_CONTRA_MIN:
        return ClaimVerdict.contradicted, best_c
    strongest = max(best_e, best_c, key=lambda i: max(scores[i].entailment, scores[i].contradiction))
    return ClaimVerdict.insufficient_evidence, strongest


async def _evidence(
    req: ClaimRequest, cited: CitationResult | None, trail: Trail
) -> tuple[str, str, EvidenceScope] | str:
    """(text, source, scope) to test the claim against, or the reason there is none."""
    if req.evidence_text:
        return req.evidence_text, "provided_text", "provided_text"
    if cited is None or cited.verdict not in USABLE_CITATIONS:
        return "the citation could not be verified"
    if not (cited.matched and cited.matched.doi):
        return "the cited work has no DOI to fetch an abstract"
    text, source = await _abstract(cited.matched.doi, trail)
    if text is None or source is None:
        return "no abstract is available for the cited work"
    return text, source, "abstract"


async def check_claim(req: ClaimRequest, trail: Trail) -> ClaimResult:
    spawn_background("nli-warm", _warm())  # a cold model loads while the citation and abstract are fetched
    cited = await verify_one(0, req.citation, VerifyOptions(), trail) if req.citation is not None else None
    evidence = await _evidence(req, cited, trail)
    if isinstance(evidence, str):
        return ClaimResult(verdict=ClaimVerdict.insufficient_evidence, citation=cited, reasons=[evidence])
    text, source, scope = evidence
    reasons = ["the cited work is retracted"] if cited and cited.verdict is CitationVerdict.retracted else []
    premise_list = premises(text, req.claim)
    try:
        model, scores = await _score(premise_list, req.claim)
        trail.ok(NLI)
    except UpstreamFailure as failure:
        trail.failure(NLI, failure)
        return ClaimResult(
            verdict=ClaimVerdict.unverifiable, citation=cited, reasons=["the NLI model is unavailable"], retryable=True
        )
    verdict, at = _decide(premise_list, scores)
    return ClaimResult(
        verdict=verdict,
        scores=scores[at],
        evidence_sentence=premise_list[at],
        evidence_scope=scope,
        premise_source=source,
        model=model,
        citation=cited,
        reasons=reasons,
    )
