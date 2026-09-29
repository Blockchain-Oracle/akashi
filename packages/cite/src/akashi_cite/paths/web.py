"""Cited URLs: is the page there, is it the page claimed, and is there an archived copy?"""

import asyncio
from dataclasses import replace

from rapidfuzz import fuzz

from akashi_cite.constants import (
    CONFIDENCE_ARCHIVED_ONLY,
    CONFIDENCE_NONE,
    CONFIDENCE_WEB_LIVE,
    MISMATCH_MIN,
    PERCENT,
    WAYBACK,
    WEB,
)
from akashi_cite.match import norm
from akashi_cite.models import CitationResult, CitationVerdict, FieldDiff, InputKind, VerifyOptions
from akashi_cite.parse import Parsed, clean_doi
from akashi_cite.paths import scholarly
from akashi_cite.paths.common import unverifiable
from akashi_cite.sources import web
from akashi_cite.sources.web import PageFacts
from akashi_cite.trail import Trail
from akashi_core.constants.deadlines import CITE_DEADLINE_S
from akashi_core.deadline import current_deadline
from akashi_core.errors import InvalidInput, UpstreamFailure
from akashi_core.fanout import DEADLINE_EXCEEDED
from akashi_core.http.ssrf import validate_url

MIN_TITLE_WORDS = 3  # text around a URL shorter than this is not a title claim


def _claimed_title(p: Parsed) -> str | None:
    if p.title:
        return p.title
    rest = p.raw.replace(p.url or "", " ").strip(" .,;:-")
    return rest if len(rest.split()) >= MIN_TITLE_WORDS else None


def _verdict(p: Parsed, facts: PageFacts) -> tuple[CitationVerdict, float, list[FieldDiff], list[str]]:
    check = facts.check
    archived = check.archived_url is not None
    if check.liveness == "live":
        claimed = _claimed_title(p)
        if claimed and check.page_title:
            similarity = fuzz.token_set_ratio(norm(claimed), norm(check.page_title)) / PERCENT
            if similarity < MISMATCH_MIN:
                diff = FieldDiff(field="title", given=claimed, found=check.page_title, severity="major")
                return CitationVerdict.mismatch, similarity, [diff], ["page title differs from the citation"]
        return CitationVerdict.verified, CONFIDENCE_WEB_LIVE, [], []
    if archived:
        return (
            CitationVerdict.verified,
            CONFIDENCE_ARCHIVED_ONLY,
            [],
            [f"link is {check.liveness}; archived copy exists"],
        )
    if check.liveness == "dead":
        return CitationVerdict.not_found, CONFIDENCE_WEB_LIVE, [], ["page does not exist and was never archived"]
    reason = "site blocks automated access" if check.liveness == "blocked" else "site unreachable"
    return CitationVerdict.unverifiable, CONFIDENCE_NONE, [], [reason]


async def verify(index: int, p: Parsed, options: VerifyOptions, trail: Trail) -> CitationResult:
    assert p.url
    if not options.check_urls:
        return unverifiable(index, InputKind.web, "URL checks disabled by request", retryable=False)
    validate_url(p.url)  # scheme / literal-IP problems are a 422 before any network call
    deadline = current_deadline(CITE_DEADLINE_S)
    archive = asyncio.ensure_future(web.snapshot(p.url))
    try:  # not in fan_out: an SSRF rejection (InvalidInput) must reach the handler as a 422
        facts = await asyncio.wait_for(web.fetch(p.url), deadline.remaining())
        if facts.check.liveness == "dead" and p.url_unstripped:  # the trimmed "." may belong to the URL
            retry = await asyncio.wait_for(web.fetch(p.url_unstripped), deadline.remaining())
            facts = retry if retry.check.liveness != "dead" else facts
        trail.ok(WEB)
    except InvalidInput:
        archive.cancel()
        raise
    except TimeoutError:
        archive.cancel()
        trail.failed(WEB, DEADLINE_EXCEEDED)
        return unverifiable(index, InputKind.web, "page check did not finish", retryable=True)
    try:
        facts.check.archived_url, facts.check.archived_at = await asyncio.wait_for(archive, deadline.remaining())
        trail.ok(WAYBACK)
    except (UpstreamFailure, TimeoutError) as exc:
        trail.failed(WAYBACK, getattr(exc, "kind", DEADLINE_EXCEEDED))
    if facts.citation_doi:  # a scholarly landing page: verify the work itself, keep the page facts
        result = await scholarly.by_doi(index, replace(p, doi=clean_doi(facts.citation_doi)), options, trail)
        result.web = facts.check
        return result
    verdict, confidence, diffs, reasons = _verdict(p, facts)
    return CitationResult(
        index=index,
        input_kind=InputKind.web,
        verdict=verdict,
        confidence=round(confidence, 4),
        field_diffs=diffs,
        web=facts.check,
        reasons=reasons,
        retryable=verdict is CitationVerdict.unverifiable and facts.check.liveness == "unreachable",
    )
