"""Case citations: does a case start on that page of that reporter volume, and is it the case named?

A fabricated cite usually points at a real volume, so the strongest signal is structural: the page either starts a
different case, falls in the middle of one ("page inside another case"), or starts nothing at all.
"""

from rapidfuzz import fuzz

from akashi_cite.constants import CAP, CONFIDENCE_LEGAL_EXACT, COURTLISTENER_CITE_URL, LEGAL_NAME_MATCH_MIN
from akashi_cite.match import norm
from akashi_cite.models import CitationResult, CitationVerdict, FieldDiff, InputKind, LegalMatch
from akashi_cite.parse import LegalCite, Parsed
from akashi_cite.paths.common import unverifiable
from akashi_cite.sources import cap
from akashi_cite.sources.cap import CapCase
from akashi_cite.trail import Trail
from akashi_core.errors import UpstreamFailure

YEAR_CHARS = 4


def _link(lc: LegalCite) -> str:
    return COURTLISTENER_CITE_URL.format(reporter=lc.reporter.replace(" ", ""), volume=lc.volume, page=lc.page)


def _name_score(parties: str | None, case: CapCase) -> float | None:
    return fuzz.token_set_ratio(norm(parties), norm(case.name)) if parties else None


def _legal(lc: LegalCite, case: CapCase | None, covered: int | None) -> LegalMatch:
    return LegalMatch(
        reporter=lc.reporter,
        volume=lc.volume,
        page=lc.page,
        case_name=case.name if case else None,
        date_filed=case.decision_date if case else None,
        court=case.court if case else None,
        link=_link(lc),
        covered_through=covered,
    )


def _exact(index: int, lc: LegalCite, starts: list[CapCase], covered: int | None) -> CitationResult:
    case = max(starts, key=lambda c: _name_score(lc.parties, c) or 0)
    diffs: list[FieldDiff] = []
    name = _name_score(lc.parties, case)
    if name is not None and name < LEGAL_NAME_MATCH_MIN:
        diffs.append(FieldDiff(field="case_name", given=lc.parties or "", found=case.name, severity="major"))
    year = case.decision_date[:YEAR_CHARS]
    if lc.year and year.isdigit() and int(year) != lc.year:
        diffs.append(FieldDiff(field="year", given=str(lc.year), found=year, severity="major"))
    return CitationResult(
        index=index,
        input_kind=InputKind.legal,
        verdict=CitationVerdict.mismatch if diffs else CitationVerdict.verified,
        confidence=CONFIDENCE_LEGAL_EXACT,
        field_diffs=diffs,
        legal=_legal(lc, case, covered),
    )


async def verify(index: int, p: Parsed, trail: Trail) -> CitationResult:
    lc = p.legal
    assert lc
    slug = cap.slug_for(lc.reporter)
    covered = cap.covered_through(slug) if slug else None
    if slug is None or covered is None:
        result = unverifiable(index, InputKind.legal, f"reporter {lc.reporter} is outside coverage", retryable=False)
        result.legal = _legal(lc, None, None)
        return result
    if lc.year and lc.year > covered:
        result = unverifiable(index, InputKind.legal, f"{lc.reporter} coverage ends {covered}", retryable=False)
        result.legal = _legal(lc, None, covered)
        return result
    try:
        cases = await cap.volume(slug, lc.volume)
        trail.ok(CAP)
    except UpstreamFailure as failure:
        trail.failure(CAP, failure)
        return unverifiable(index, InputKind.legal, "case law index unavailable", retryable=True)
    if cases is None or not lc.page.isdigit():
        result = unverifiable(index, InputKind.legal, f"{lc.volume} {lc.reporter} is not indexed", retryable=False)
        result.legal = _legal(lc, None, covered)
        return result
    page = int(lc.page)
    if starts := [c for c in cases if c.first_page == page]:
        return _exact(index, lc, starts, covered)
    enclosing = next((c for c in cases if c.first_page < page <= c.last_page), None)
    if enclosing and (_name_score(lc.parties, enclosing) or 0) >= LEGAL_NAME_MATCH_MIN:
        # Right case, but the page given is a pin cite inside it rather than its first page.
        return CitationResult(
            index=index,
            input_kind=InputKind.legal,
            verdict=CitationVerdict.mismatch,
            confidence=CONFIDENCE_LEGAL_EXACT,
            field_diffs=[
                FieldDiff(field="page", given=lc.page, found=str(enclosing.first_page), severity="minor"),
            ],
            legal=_legal(lc, enclosing, covered),
        )
    reason = (
        f"page {page} falls inside {enclosing.name} ({lc.volume} {lc.reporter} "
        f"{enclosing.first_page}-{enclosing.last_page}); no case starts there"
        if enclosing
        else f"no case starts at {lc.volume} {lc.reporter} {page}"
    )
    return CitationResult(
        index=index,
        input_kind=InputKind.legal,
        verdict=CitationVerdict.not_found,
        confidence=CONFIDENCE_LEGAL_EXACT,
        legal=_legal(lc, None, covered),
        reasons=["page_inside_other_case" if enclosing else "no_case_at_page", reason],
    )
