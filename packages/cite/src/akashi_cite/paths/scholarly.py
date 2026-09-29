"""Scholarly citations: resolve by identifier when there is one, otherwise search and score candidates."""

import re
from dataclasses import replace

from akashi_cite.constants import (
    CONFIDENCE_IDENTIFIER,
    CONFIDENCE_SEARCH_MISS_MAX,
    CONFIDENCE_SEARCH_MISS_PARTIAL,
    CROSSREF,
    DATACITE,
    DOI_HANDLE,
    MAX_CANDIDATES,
    MISMATCH_MIN,
    NON_WORK_TYPES,
    NOTICE_TITLE_PATTERN,
    OPENALEX,
    PUBMED,
)
from akashi_cite.match import Scored, decide, first_surname, norm, score, title_guess
from akashi_cite.models import CitationResult, CitationVerdict, InputKind, VerifyOptions
from akashi_cite.parse import Parsed
from akashi_cite.paths.common import matched, retraction, unverifiable
from akashi_cite.sources import crossref, datacite, doi, openalex, pubmed
from akashi_cite.sources.records import Record
from akashi_cite.trail import Trail
from akashi_core.constants.deadlines import CITE_DEADLINE_S
from akashi_core.deadline import current_deadline
from akashi_core.errors import UpstreamFailure
from akashi_core.fanout import FanOutResult, fan_out

ARXIV_DOI_PREFIX = "10.48550/"  # arXiv DOIs are registered with DataCite; arXiv itself is never called live
PARTIAL_COVERAGE_NOTE = "OpenAlex did not answer: venues without DOIs (e.g. JMLR, older NeurIPS) were not searched"
_SPECS = {
    "doi.org": DOI_HANDLE,
    "crossref": CROSSREF,
    "datacite": DATACITE,
    "openalex": OPENALEX,
    "pubmed": PUBMED,
}


def _overlay(result: CitationResult, rec: Record, openalex_retracted: bool, options: VerifyOptions) -> CitationResult:
    """Retraction beats every other verdict; a correction is only flagged."""
    if not options.retraction:
        return result
    result.retraction = retraction(rec, openalex_retracted)
    if result.retraction.status == "retracted" and result.verdict is not CitationVerdict.not_found:
        result.verdict = CitationVerdict.retracted
        result.reasons.append(f"retracted {result.retraction.date or ''}".strip())
    return result


async def by_doi(index: int, p: Parsed, options: VerifyOptions, trail: Trail) -> CitationResult:
    assert p.doi  # caller guarantees
    record_source = "datacite" if p.doi.startswith(ARXIV_DOI_PREFIX) else "crossref"
    fetch_record = datacite.work if record_source == "datacite" else crossref.work
    calls = {"doi.org": doi.exists(p.doi), record_source: fetch_record(p.doi)}
    if options.retraction:
        calls["openalex"] = openalex.work(p.doi)
    got = await fan_out(calls, current_deadline(CITE_DEADLINE_S))
    trail.record(_SPECS, got)
    exists = got.ok.get("doi.org")
    rec: Record | None = got.ok.get(record_source)  # type: ignore[assignment]
    if exists is False:
        return CitationResult(
            index=index,
            input_kind=InputKind.scholarly,
            verdict=CitationVerdict.not_found,
            confidence=CONFIDENCE_IDENTIFIER,
            reasons=[f"DOI {p.doi} is not registered at doi.org"],
        )
    if rec is None and record_source == "crossref" and got.failed.get("crossref") == "not_found":
        try:  # registered, but not with Crossref: most often DataCite
            rec = await datacite.work(p.doi)
            trail.ok(DATACITE)
        except UpstreamFailure as failure:
            trail.failure(DATACITE, failure)
    if rec is None:
        if exists:
            return CitationResult(
                index=index,
                input_kind=InputKind.scholarly,
                verdict=CitationVerdict.verified,
                confidence=CONFIDENCE_IDENTIFIER,
                reasons=["DOI is registered, with an agency whose metadata is not checked here"],
            )
        return unverifiable(index, InputKind.scholarly, "registries unavailable", retryable=True)
    scored = score(p, rec, compare_title=bool(p.title))
    verdict = CitationVerdict.mismatch if scored.blocking else CitationVerdict.verified
    result = CitationResult(
        index=index,
        input_kind=InputKind.scholarly,
        verdict=verdict,
        confidence=CONFIDENCE_IDENTIFIER if not scored.diffs else scored.score,
        matched=matched(rec),
        field_diffs=scored.diffs,
    )
    oa = got.ok.get("openalex") or {}
    return _overlay(result, rec, bool(oa.get("is_retracted")), options)


async def by_pmid(index: int, p: Parsed, options: VerifyOptions, trail: Trail) -> CitationResult:
    assert p.pmid
    try:
        rec = await pubmed.summary(p.pmid)
        trail.ok(PUBMED)
    except UpstreamFailure as failure:
        trail.failure(PUBMED, failure)
        return unverifiable(index, InputKind.scholarly, "PubMed unavailable", retryable=True)
    if rec is None:
        return CitationResult(
            index=index,
            input_kind=InputKind.scholarly,
            verdict=CitationVerdict.not_found,
            confidence=CONFIDENCE_IDENTIFIER,
            reasons=[f"PMID {p.pmid} does not exist in PubMed"],
        )
    if rec.doi:  # the DOI path adds retraction status and the publisher record
        return await by_doi(index, replace(p, doi=rec.doi), options, trail)
    return CitationResult(
        index=index,
        input_kind=InputKind.scholarly,
        verdict=CitationVerdict.verified,
        confidence=CONFIDENCE_IDENTIFIER,
        matched=matched(rec),
    )


def _query(p: Parsed) -> str:
    return p.raw or " ".join(str(v) for v in (p.title, " ".join(p.authors), p.venue, p.year) if v)


_NOTICE_RE = re.compile(NOTICE_TITLE_PATTERN, re.I)


def _is_work(rec: Record) -> bool:
    """Only titled, work-level records can verify a citation (no journals, issues, notices or front matter)."""
    if not rec.title or rec.type in NON_WORK_TYPES or _NOTICE_RE.search(rec.title):
        return False
    return not any(norm(rec.title) == norm(v) for v in (rec.venue, rec.short_venue) if v)


def _rank(p: Parsed, records: list[Record]) -> list[Scored]:
    return sorted((score(p, r) for r in records if _is_work(r)), key=lambda s: s.score, reverse=True)


async def _ranked(p: Parsed, trail: Trail) -> tuple[list[Scored] | None, bool, bool]:
    """(candidates best-first or None when no index answered, whether the search was complete).

    Crossref first. When nothing it returns is plausible, the title alone goes to DataCite's arXiv records
    (exact phrase; where most ML papers live) and OpenAlex search, in parallel. "Complete" means Crossref and at
    least one fallback answered: only then is "no match" evidence of fabrication rather than a coverage gap.
    Our composite decides, never an upstream relevance score: Crossref's grows with query length (the right
    paper scores 26.8 for a short structured query, 65.9 for a full reference string).
    """
    query = _query(p)
    ranked: list[Scored] | None = None
    try:
        ranked = _rank(p, await crossref.bibliographic(query))
        trail.ok(CROSSREF)
        if ranked and ranked[0].score >= MISMATCH_MIN:
            return ranked, True, True
    except UpstreamFailure as failure:
        trail.failure(CROSSREF, failure)
    title = p.title or title_guess(query)
    got: FanOutResult[list[Record]] = await fan_out(
        {
            "crossref": crossref.title_author(title, first_surname(p.raw, p.authors)),
            "datacite": datacite.search_arxiv(title),
            "openalex": openalex.search(title),
        },
        current_deadline(CITE_DEADLINE_S),
    )
    trail.record(_SPECS, got)
    fallback: list[Scored] = [s for records in got.ok.values() for s in _rank(p, records)]
    if ranked is None and not got.ok:
        return None, False, False
    merged: list[Scored] = [*(ranked or []), *fallback]
    merged.sort(key=lambda s: s.score, reverse=True)
    return merged, ranked is not None and bool(got.ok), "openalex" in got.ok


async def by_search(index: int, p: Parsed, options: VerifyOptions, trail: Trail) -> CitationResult:
    ranked, complete, broad = await _ranked(p, trail)
    if ranked is None:
        return unverifiable(index, InputKind.scholarly, "bibliographic search unavailable", retryable=True)
    verdict = decide(ranked)
    if verdict is CitationVerdict.not_found and not complete:  # absence is evidence only if the search was complete
        return unverifiable(index, InputKind.scholarly, "an index did not answer; retry", retryable=True)
    if verdict is CitationVerdict.not_found:
        cap = CONFIDENCE_SEARCH_MISS_MAX if broad else CONFIDENCE_SEARCH_MISS_PARTIAL
        return CitationResult(
            index=index,
            input_kind=InputKind.scholarly,
            verdict=verdict,
            confidence=round(min(cap, 1 - (ranked[0].score if ranked else 0.0)), 4),
            reasons=["no published work matches this citation", *([] if broad else [PARTIAL_COVERAGE_NOTE])],
        )
    best = ranked[0]
    result = CitationResult(
        index=index,
        input_kind=InputKind.scholarly,
        verdict=verdict,
        confidence=best.score,
        matched=matched(best.record),
        field_diffs=best.diffs,
        candidates=[matched(s.record) for s in ranked[:MAX_CANDIDATES]] if verdict is CitationVerdict.ambiguous else [],
    )
    return _overlay(result, best.record, False, options)


async def verify(index: int, p: Parsed, options: VerifyOptions, trail: Trail) -> CitationResult:
    if p.doi:
        return await by_doi(index, p, options, trail)
    if p.pmid:
        return await by_pmid(index, p, options, trail)
    return await by_search(index, p, options, trail)
