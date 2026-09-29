"""Normalized scholarly record shared by all sources."""

import html
import re
from dataclasses import dataclass, field

_TAG_RE = re.compile(r"<[^>]+>")
INITIALS_MAX_CHARS = 2  # "Y", "JD": a trailing token this short is initials, not a family name


def family_name(name: str) -> str:
    """Family name from "Family, Given", "Given Family" or PubMed-style "Family GI"."""
    if "," in name:
        return name.split(",")[0].strip()
    tokens = name.split()
    if not tokens:
        return ""
    return tokens[0] if len(tokens) > 1 and len(tokens[-1].strip(".")) <= INITIALS_MAX_CHARS else tokens[-1]


def clean_text(value: str | None) -> str | None:
    """Registry titles carry JATS/HTML markup ("<i>In vivo</i>", "&amp;"): plain text only."""
    if not value:
        return None
    return " ".join(html.unescape(_TAG_RE.sub(" ", value)).split()) or None


@dataclass(slots=True)
class Record:
    source: str
    doi: str | None = None
    title: str | None = None
    authors: list[str] = field(default_factory=list)  # family names
    year: int | None = None
    venue: str | None = None
    short_venue: str | None = None
    volume: str | None = None
    pages: str | None = None
    type: str | None = None
    url: str | None = None
    score: float | None = None  # source-native relevance score (Crossref)
    retracted: bool = False
    retraction_date: str | None = None
    retraction_notice: str | None = None
    retraction_source: str | None = None
    corrected: bool = False
