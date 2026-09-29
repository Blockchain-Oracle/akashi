"""Request/response models for citation-verify."""

from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field

from akashi_cite.constants import MAX_AUTHORS, MAX_CITATION_CHARS, MAX_CITATIONS_PER_REQUEST, MAX_YEAR, MIN_YEAR
from akashi_core.contract.fields import UntrustedStr


class CitationVerdict(StrEnum):
    verified = "verified"
    mismatch = "mismatch"
    not_found = "not_found"
    retracted = "retracted"
    ambiguous = "ambiguous"
    unverifiable = "unverifiable"


class InputKind(StrEnum):
    scholarly = "scholarly"
    legal = "legal"
    web = "web"
    statute = "statute"


class StructuredCitation(BaseModel):
    raw: str | None = Field(default=None, max_length=MAX_CITATION_CHARS)
    doi: str | None = None
    arxiv: str | None = None
    pmid: str | None = None
    title: str | None = Field(default=None, max_length=MAX_CITATION_CHARS)
    authors: list[str] = Field(default_factory=list, max_length=MAX_AUTHORS)
    year: int | None = Field(default=None, ge=MIN_YEAR, le=MAX_YEAR)
    venue: str | None = None
    volume: str | None = None
    pages: str | None = None
    url: str | None = None
    legal_cite: str | None = None


CitationInput = str | StructuredCitation


class VerifyOptions(BaseModel):
    check_urls: bool = True
    retraction: bool = True


class VerifyRequest(BaseModel):
    citations: list[CitationInput] = Field(min_length=1, max_length=MAX_CITATIONS_PER_REQUEST)
    options: VerifyOptions = Field(default_factory=VerifyOptions)


class MatchedRecord(BaseModel):
    doi: str | None = None
    title: UntrustedStr | None = None
    authors: list[UntrustedStr] = Field(default_factory=list)
    year: int | None = None
    venue: UntrustedStr | None = None
    volume: str | None = None
    pages: str | None = None
    type: str | None = None
    url: str | None = None
    record_source: str | None = None


class FieldDiff(BaseModel):
    field: str
    given: UntrustedStr
    found: UntrustedStr
    severity: Literal["major", "minor"]


class Retraction(BaseModel):
    status: Literal["retracted", "corrected", "expression_of_concern", "none"]
    date: str | None = None
    notice_doi: str | None = None
    source: str | None = None


class LegalMatch(BaseModel):
    reporter: str
    volume: str
    page: str
    case_name: UntrustedStr | None = None
    date_filed: str | None = None
    court: str | None = None
    link: str | None = None
    covered_through: int | None = None


class WebCheck(BaseModel):
    http_status: int | None = None
    liveness: Literal["live", "dead", "blocked", "unreachable"]
    final_url: str | None = None
    page_title: UntrustedStr | None = None
    archived_url: str | None = None
    archived_at: str | None = None


class CitationResult(BaseModel):
    kind: Literal["citation"] = "citation"
    index: int
    input_kind: InputKind
    verdict: CitationVerdict
    confidence: float
    matched: MatchedRecord | None = None
    field_diffs: list[FieldDiff] = Field(default_factory=list)
    retraction: Retraction | None = None
    candidates: list[MatchedRecord] = Field(default_factory=list)
    legal: LegalMatch | None = None
    web: WebCheck | None = None
    reasons: list[UntrustedStr] = Field(default_factory=list)
    retryable: bool = False
