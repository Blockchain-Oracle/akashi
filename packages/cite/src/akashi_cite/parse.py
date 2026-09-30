"""Classify a citation (DOI › arXiv › PMID › legal › URL › free text) and pull out its identifiers."""

import re
from dataclasses import dataclass, field, replace
from datetime import UTC, datetime

from eyecite import clean_text, get_citations
from eyecite.models import FullCaseCitation, FullLawCitation

from akashi_cite.models import InputKind, StructuredCitation

DOI_RE = re.compile(r"\b(10\.\d{4,9}/[^\s\"<>]+)", re.I)
ARXIV_RE = re.compile(r"\barxiv[:\s]*(\d{4}\.\d{4,5})(v\d+)?", re.I)
ARXIV_DOI_PREFIX = "10.48550/arXiv."
PMID_RE = re.compile(r"\bPMID[:\s]*(\d{4,9})\b", re.I)
URL_RE = re.compile(r"https?://[^\s<>\"]+", re.I)
YEAR_RE = re.compile(r"(?<![\d\-–])(1[5-9]\d{2}|20\d{2})(?![\d\-–])")  # not part of a page range
APA_YEAR_RE = re.compile(r"\((1[5-9]\d{2}|20\d{2})[a-z]?[,)]")  # "(1997)." / "(2015a)" / "(2019, May"
VANCOUVER_YEAR_RE = re.compile(r"\b(1[5-9]\d{2}|20\d{2})\s*(?:[A-Z][a-z]{2}\s*)?;")  # "1968;162" / "2021 Jun;"
TRAILING_PUNCT = ".,;:)]}'\""
DOI_URL_HOSTS = ("doi.org/", "dx.doi.org/")


@dataclass(slots=True)
class LegalCite:
    volume: str
    reporter: str
    page: str
    year: int | None = None
    court: str | None = None
    parties: str | None = None


@dataclass(slots=True)
class Parsed:
    kind: InputKind
    raw: str = ""
    doi: str | None = None
    pmid: str | None = None
    url: str | None = None
    url_unstripped: str | None = None  # set when trailing punctuation was trimmed from the URL
    legal: LegalCite | None = None
    title: str | None = None
    authors: list[str] = field(default_factory=list)
    year: int | None = None
    venue: str | None = None
    volume: str | None = None
    pages: str | None = None
    notes: list[str] = field(default_factory=list)


def clean_doi(doi: str) -> str:
    doi = doi.strip()
    for host in DOI_URL_HOSTS:
        if host in doi:
            doi = doi.split(host, 1)[1]
    return doi.rstrip(TRAILING_PUNCT).lower()


def _legal(text: str) -> tuple[LegalCite | None, bool]:
    """(first full case citation, saw a statute). Split on ';' first: eyecite leaks years across joined cites."""
    statute = False
    for part in text.split(";"):
        for cite in get_citations(clean_text(part, ["inline_whitespace", "html"])):
            if isinstance(cite, FullCaseCitation):
                g, m = cite.groups, cite.metadata
                parties = " v. ".join(p for p in (m.plaintiff, m.defendant) if p) or None
                year = int(m.year) if m.year and str(m.year).isdigit() else None
                return LegalCite(g["volume"], cite.corrected_reporter(), g["page"], year, m.court, parties), statute
            if isinstance(cite, FullLawCitation):
                statute = True
    return None, statute


def parse(item: str | StructuredCitation) -> Parsed:
    if isinstance(item, StructuredCitation):
        return _structured(item)
    raw = item.strip()
    if m := DOI_RE.search(raw):
        return Parsed(InputKind.scholarly, raw, doi=clean_doi(m.group(1)), year=_year(raw))
    if m := ARXIV_RE.search(raw):
        return Parsed(InputKind.scholarly, raw, doi=(ARXIV_DOI_PREFIX + m.group(1)).lower())
    if m := PMID_RE.search(raw):
        return Parsed(InputKind.scholarly, raw, pmid=m.group(1))
    legal, statute = _legal(raw)
    if legal:
        return Parsed(InputKind.legal, raw, legal=legal)
    if statute:
        return Parsed(InputKind.statute, raw)
    if m := URL_RE.search(raw):
        url = m.group(0).rstrip(TRAILING_PUNCT)
        return Parsed(InputKind.web, raw, url=url, url_unstripped=m.group(0) if url != m.group(0) else None)
    return Parsed(InputKind.scholarly, raw, year=_year(raw))


def _year(text: str) -> int | None:
    """Publication year by citation-style position; bare numbers are a last resort (never page ranges)."""
    latest = datetime.now(UTC).year + 1
    for pattern in (APA_YEAR_RE, VANCOUVER_YEAR_RE, YEAR_RE):
        years = [int(y) for y in pattern.findall(text) if int(y) <= latest]
        if years:
            return years[0] if pattern is not YEAR_RE else years[-1]
    return None


def _structured(c: StructuredCitation) -> Parsed:
    raw = c.raw or " ".join(str(v) for v in (c.title, ", ".join(c.authors), c.venue, c.year) if v)
    base = Parsed(
        InputKind.scholarly,
        raw,
        title=c.title,
        authors=list(c.authors),
        year=c.year,
        venue=c.venue,
        volume=c.volume,
        pages=c.pages,
    )
    if c.doi:
        return replace(base, doi=clean_doi(c.doi))
    if c.arxiv:
        arxiv_id = c.arxiv.lower().removeprefix("arxiv:").split("v")[0]
        return replace(base, doi=(ARXIV_DOI_PREFIX + arxiv_id).lower())
    if c.pmid:
        return replace(base, pmid=c.pmid)
    if c.legal_cite:
        legal, statute = _legal(c.legal_cite)
        if legal:
            return Parsed(InputKind.legal, c.legal_cite, legal=legal)
        if statute:
            return Parsed(InputKind.statute, c.legal_cite)
    if c.url and not c.title:
        return replace(base, kind=InputKind.web, url=c.url)
    return replace(base, url=c.url)
