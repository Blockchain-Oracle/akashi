"""Request/response models for citation-verify."""

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

from akashi_cite.constants import (
    MAX_AUTHORS,
    MAX_CITATION_CHARS,
    MAX_CITATIONS_PER_REQUEST,
    MAX_CLAIM_CHARS,
    MAX_EVIDENCE_CHARS,
    MAX_YEAR,
    MIN_YEAR,
)
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


# Fields a lookup can start from; authors, year, venue, volume and pages only narrow a match.
LOOKUP_FIELDS = ("raw", "doi", "arxiv", "pmid", "title", "url", "legal_cite")


class StructuredCitation(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "anyOf": [{"required": [f], "properties": {f: {"type": "string", "minLength": 1}}} for f in LOOKUP_FIELDS]
        }
    )

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

    @model_validator(mode="after")
    def _has_lookup_field(self) -> "StructuredCitation":
        if not any(getattr(self, f) for f in LOOKUP_FIELDS):
            raise ValueError(f"a structured citation needs one of {', '.join(LOOKUP_FIELDS)}")
        return self


# A bare string must carry text: an empty one reached the parsers (lxml: "Document is empty").
CitationText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=MAX_CITATION_CHARS)]
CitationInput = CitationText | StructuredCitation


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


class ClaimVerdict(StrEnum):
    supported = "supported"
    contradicted = "contradicted"
    insufficient_evidence = "insufficient_evidence"
    unverifiable = "unverifiable"  # the evidence or the model could not be reached: retry


class ClaimRequest(BaseModel):
    # The cross-field rule below, stated in the schema so generated clients never send a request we reject.
    model_config = ConfigDict(
        json_schema_extra={
            "anyOf": [
                {"required": ["citation"], "properties": {"citation": {"type": "object"}}},
                {"required": ["evidence_text"], "properties": {"evidence_text": {"type": "string", "minLength": 1}}},
            ]
        }
    )

    claim: str = Field(min_length=1, max_length=MAX_CLAIM_CHARS)
    citation: CitationInput | None = None
    evidence_text: str | None = Field(default=None, max_length=MAX_EVIDENCE_CHARS)

    @model_validator(mode="after")
    def _needs_evidence(self) -> "ClaimRequest":
        if self.citation is None and not self.evidence_text:
            raise ValueError("give a citation, evidence_text, or both")
        return self


class ClaimScores(BaseModel):
    entailment: float
    neutral: float
    contradiction: float


class ClaimResult(BaseModel):
    kind: Literal["claim"] = "claim"
    verdict: ClaimVerdict
    scores: ClaimScores | None = None
    evidence_sentence: UntrustedStr | None = None
    evidence_scope: Literal["abstract", "provided_text"] | None = None
    premise_source: str | None = None
    model: str | None = None
    citation: CitationResult | None = None
    reasons: list[UntrustedStr] = Field(default_factory=list)
    retryable: bool = False
