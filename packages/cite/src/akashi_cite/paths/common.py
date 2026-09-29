"""Helpers shared by the verification paths."""

from akashi_cite.constants import CONFIDENCE_NONE
from akashi_cite.models import CitationResult, CitationVerdict, InputKind, MatchedRecord, Retraction
from akashi_cite.sources.records import Record


def matched(rec: Record) -> MatchedRecord:
    return MatchedRecord(
        doi=rec.doi,
        title=rec.title,
        authors=rec.authors,
        year=rec.year,
        venue=rec.venue,
        volume=rec.volume,
        pages=rec.pages,
        type=rec.type,
        url=rec.url or (f"https://doi.org/{rec.doi}" if rec.doi else None),
        record_source=rec.source,
    )


def retraction(rec: Record, openalex_retracted: bool = False) -> Retraction:
    if rec.retracted:
        return Retraction(
            status="retracted", date=rec.retraction_date, notice_doi=rec.retraction_notice, source=rec.retraction_source
        )
    if openalex_retracted:
        return Retraction(status="retracted", source="openalex")
    return Retraction(status="corrected" if rec.corrected else "none")


def unverifiable(index: int, kind: InputKind, reason: str, *, retryable: bool) -> CitationResult:
    return CitationResult(
        index=index,
        input_kind=kind,
        verdict=CitationVerdict.unverifiable,
        confidence=CONFIDENCE_NONE,
        reasons=[reason],
        retryable=retryable,
    )
