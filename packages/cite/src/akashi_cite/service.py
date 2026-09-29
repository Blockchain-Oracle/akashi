"""citation-verify: classify each citation and route it to its verification path, all under one deadline."""

import asyncio

from akashi_cite.constants import CITATION_CONCURRENCY
from akashi_cite.models import CitationInput, CitationResult, InputKind, VerifyOptions, VerifyRequest
from akashi_cite.parse import parse
from akashi_cite.paths import legal, scholarly, web
from akashi_cite.paths.common import unverifiable
from akashi_cite.trail import Trail
from akashi_core.contract.sources import SourceRef
from akashi_core.errors import InvalidInput
from akashi_core.fanout import gather_limited

STATUTE_NOTE = "statutes are not verified here; Pocket's us-code-cfr service covers the U.S. Code and CFR"


async def verify_one(index: int, item: CitationInput, options: VerifyOptions, trail: Trail) -> CitationResult:
    p = await asyncio.to_thread(parse, item)  # eyecite is CPU-bound
    if p.kind is InputKind.legal:
        return await legal.verify(index, p, trail)
    if p.kind is InputKind.statute:
        return unverifiable(index, InputKind.statute, STATUTE_NOTE, retryable=False)
    if p.kind is InputKind.web:
        return await web.verify(index, p, options, trail)
    return await scholarly.verify(index, p, options, trail)


async def verify(req: VerifyRequest) -> tuple[list[CitationResult], list[SourceRef], list[str]]:
    trails = [Trail() for _ in req.citations]
    outcomes = await gather_limited(
        (verify_one(i, item, req.options, trails[i]) for i, item in enumerate(req.citations)),
        CITATION_CONCURRENCY,
    )
    results: list[CitationResult] = []
    for i, outcome in enumerate(outcomes):
        if isinstance(outcome, InvalidInput):
            raise outcome  # e.g. a URL pointing at a private address: the whole request is rejected (422)
        if isinstance(outcome, BaseException):
            trails[i].unavailable.append("internal")
            outcome = unverifiable(i, InputKind.scholarly, "verification failed; retry", retryable=True)
        results.append(outcome)
    sources = [ref for t in trails for ref in t.sources]
    unavailable = [name for t in trails for name in t.unavailable]
    return results, sources, unavailable
