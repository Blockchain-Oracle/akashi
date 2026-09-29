"""Score a candidate record against what the citation claims (specs/backend.md §3.1 step 4).

Weights are renormalized over the fields the caller actually gave. Free-text input ("raw mode") is scored by
looking for the record's fields inside the string rather than by aligning parsed fields.
"""

import re
import unicodedata
from dataclasses import dataclass, field

from rapidfuzz import fuzz
from rapidfuzz.utils import default_process

from akashi_cite.constants import (
    AMBIGUOUS_DELTA,
    AUTHOR_FUZZY_CREDIT,
    AUTHOR_FUZZY_MIN,
    AUTHOR_SET_SHARE,
    FIRST_AUTHOR_SHARE,
    MAX_RECORD_AUTHORS,
    MIN_SEGMENT_WORDS,
    MIN_SURNAME_CHARS,
    MIN_TITLE_GUESS_WORDS,
    MISMATCH_MIN,
    PERCENT,
    PREPRINT_TYPES,
    PREPRINT_YEAR_SLACK,
    PREPRINT_YEAR_SLACK_BEFORE,
    TITLE_DIFF_MAJOR_BELOW,
    TITLE_MATCH_MIN,
    VENUE_DIFF_MIN,
    VENUE_SEGMENT_MIN,
    VERIFIED_MIN,
    WEIGHT_AUTHORS,
    WEIGHT_TITLE,
    WEIGHT_VENUE,
    WEIGHT_YEAR,
    YEAR_OFF_BY_ONE_CREDIT,
)
from akashi_cite.models import CitationVerdict, FieldDiff
from akashi_cite.parse import Parsed
from akashi_cite.sources.records import Record, family_name


def norm(text: str | None) -> str:
    if not text:
        return ""
    stripped = "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))
    return default_process(stripped)


_SEGMENT_RE = re.compile(r"[.?!]\s+|\s+[-–—]\s+")


def segments(raw: str) -> list[str]:
    """Candidate title spans of a free-text reference: sentence-ish pieces with at least two words."""
    return [seg.strip() for seg in _SEGMENT_RE.split(raw) if len(seg.split()) >= MIN_SEGMENT_WORDS]


_INITIALS_RE = re.compile(r"^[A-Z]{1,3}\.?,?$|^(?:[A-Z]\.){1,3},?$")
_NAME_PARTICLES = frozenset({"and", "et", "al", "van", "von", "de", "der", "den", "la", "le", "da", "di", "del", "dos"})
_ALPHA_RE = re.compile(r"[^\W\d_]{2,}")


def _author_like(seg: str) -> bool:
    """ "Watson JD, Crick FHC" / "Hochreiter, S., & Schmidhuber, J" / "Vaswani A, et al": initials, no prose."""
    tokens = seg.replace("&", " ").split()
    if "et al" in seg.lower():
        return True
    has_initials = any(_INITIALS_RE.match(t) for t in tokens)
    prose = any(t[:1].islower() and t.strip(".,") not in _NAME_PARTICLES for t in tokens)
    return has_initials and not prose


def title_guess(raw: str) -> str:
    """The likeliest title span of a free-text reference: the first segment that is neither authors nor numbers."""
    for seg in segments(raw):
        if len(_ALPHA_RE.findall(seg)) >= MIN_TITLE_GUESS_WORDS and not _author_like(seg):
            return seg.strip(" .")
    return raw


def _raw_title(raw: str, rec_title: str, rec_venues: list[str]) -> tuple[float, str]:
    """Best title similarity against one segment of the reference (never the whole string: a subset match
    would let a short record title such as a journal name "match" any reference that mentions it)."""
    best, best_seg = 0.0, ""
    for seg in segments(raw) or [raw]:
        words = " ".join(t for t in seg.split() if not any(c.isdigit() for c in t))  # drop "27(8)," "1650-1662"
        if any(_ratio(fuzz.token_sort_ratio, words, v) >= VENUE_SEGMENT_MIN for v in rec_venues):
            continue  # this span is the venue, not the title
        score_ = _ratio(fuzz.token_sort_ratio, seg, rec_title)
        if score_ > best:
            best, best_seg = score_, seg
    return best, best_seg


def _ratio(scorer, a: str, b: str) -> float:
    return scorer(norm(a), norm(b)) / PERCENT if a and b else 0.0


@dataclass(slots=True)
class Scored:
    record: Record
    score: float
    title: float | None
    diffs: list[FieldDiff] = field(default_factory=list)

    @property
    def blocking(self) -> list[FieldDiff]:
        """Diffs that stop a `verified`: anything major, and any year disagreement."""
        return [d for d in self.diffs if d.severity == "major" or d.field == "year"]


def _year(given: int | None, found: int | None, preprint: bool) -> tuple[float | None, FieldDiff | None]:
    if given is None or found is None:
        return None, None
    if given == found or (preprint and found - PREPRINT_YEAR_SLACK_BEFORE <= given <= found + PREPRINT_YEAR_SLACK):
        return 1.0, None  # a preprint is cited by its venue year: usually later, sometimes a year earlier
    off_by_one = abs(given - found) == 1
    diff = FieldDiff(field="year", given=str(given), found=str(found), severity="minor" if off_by_one else "major")
    return (YEAR_OFF_BY_ONE_CREDIT if off_by_one else 0.0), diff


def _family(name: str) -> str:
    return norm(family_name(name))


def _authors_structured(given: list[str], found: list[str]) -> tuple[float | None, FieldDiff | None]:
    if not given:
        return None, None
    if not found:  # the citation names authors; a record with none (front matter, notices) cannot confirm them
        return 0.0, None
    g_first, f_first = norm(given[0].split(",")[0].split()[-1]), norm(found[0])
    first = (
        1.0 if g_first == f_first else AUTHOR_FUZZY_CREDIT if fuzz.ratio(g_first, f_first) >= AUTHOR_FUZZY_MIN else 0.0
    )
    g_set = {norm(a.split(",")[0].split()[-1]) for a in given}
    f_set = {norm(a) for a in found[:MAX_RECORD_AUTHORS]}
    jaccard = len(g_set & f_set) / len(g_set | f_set)
    diff = None if first else FieldDiff(field="first_author", given=given[0], found=found[0], severity="major")
    return FIRST_AUTHOR_SHARE * first + AUTHOR_SET_SHARE * jaccard, diff


def first_surname(p_raw: str, authors: list[str]) -> str | None:
    """The first author's surname, from structured authors or the reference's author segment."""
    if authors:
        return family_name(authors[0]) or None
    listed = _listed_surnames(p_raw)
    return listed[0] if listed else None


def _listed_surnames(raw: str) -> list[str]:
    """Surnames named in the reference's author segment(s), in order ("Kaplan J, et al" → ["kaplan"])."""
    names: list[str] = []
    for seg in segments(raw):
        if not _author_like(seg):
            continue
        for token in seg.replace("&", " ").replace(",", " ").split():
            word = token.strip(".")
            if _INITIALS_RE.match(token) or word.lower() in _NAME_PARTICLES or len(word) < MIN_SURNAME_CHARS:
                continue
            names.append(norm(word))
        break  # the first author segment is the author list
    return names


def _named(listed: str, record_names: list[str]) -> bool:
    return any(listed == n or listed in n.split() for n in record_names)  # "maaten" in "van der maaten"


def _authors_raw(raw: str, found: list[str]) -> tuple[float | None, FieldDiff | None]:
    """Are the authors the reference lists among the record's? ("et al." hides the rest: only listed ones count.)"""
    listed = _listed_surnames(raw)
    record_names = [norm(a) for a in found[:MAX_RECORD_AUTHORS] if a]
    if not listed:
        if not record_names:
            return None, None
        raw_words = set(norm(raw).split())  # no recognizable author segment: look for the record's names anywhere
        present = [n in raw_words for n in record_names]
        return FIRST_AUTHOR_SHARE * present[0] + AUTHOR_SET_SHARE * (sum(present) / len(present)), None
    if not record_names:  # the citation names authors; a record with none cannot confirm them
        return 0.0, None
    first = 1.0 if _named(listed[0], record_names[:1]) else 0.0
    share = sum(_named(n, record_names) for n in listed) / len(listed)
    diff = None if first else FieldDiff(field="first_author", given=listed[0], found=found[0], severity="major")
    return FIRST_AUTHOR_SHARE * first + AUTHOR_SET_SHARE * share, diff


def score(parsed: Parsed, rec: Record, *, compare_title: bool = True) -> Scored:
    """Composite similarity plus field diffs. `compare_title=False` for DOI lookups given as a bare identifier."""
    raw_mode = not parsed.title and bool(parsed.raw)
    parts: list[tuple[float, float]] = []
    diffs: list[FieldDiff] = []
    title_score: float | None = None
    if compare_title and rec.title and (parsed.title or raw_mode):
        if raw_mode:
            venues = [v for v in (rec.venue, rec.short_venue) if v]
            title_score, given_title = _raw_title(parsed.raw, rec.title, venues)
        else:
            given_title = parsed.title or ""
            title_score = _ratio(fuzz.token_sort_ratio, given_title, rec.title)
        parts.append((WEIGHT_TITLE, title_score))
        if given_title and title_score < TITLE_MATCH_MIN:
            severity = "major" if title_score < TITLE_DIFF_MAJOR_BELOW else "minor"
            diffs.append(FieldDiff(field="title", given=given_title, found=rec.title, severity=severity))
    if raw_mode:
        authors, author_diff = _authors_raw(parsed.raw, rec.authors) if compare_title else (None, None)
    else:
        authors, author_diff = _authors_structured(parsed.authors, rec.authors)
    diffs.extend([author_diff] if author_diff else [])
    if authors is not None:
        parts.append((WEIGHT_AUTHORS, authors))
    preprint = (rec.type or "").lower() in PREPRINT_TYPES
    year, year_diff = _year(parsed.year, rec.year, preprint)
    if year is not None:
        parts.append((WEIGHT_YEAR, year))
        diffs.extend([year_diff] if year_diff else [])
    # A preprint's venue ("arXiv") legitimately differs from the conference it is cited by.
    given_venue = None if preprint else parsed.venue or (parsed.raw if raw_mode and compare_title else None)
    if given_venue and (rec.venue or rec.short_venue):
        venue = max(_ratio(fuzz.token_set_ratio, given_venue, v) for v in (rec.venue, rec.short_venue) if v)
        parts.append((WEIGHT_VENUE, venue))
        if parsed.venue and venue < VENUE_DIFF_MIN:
            diffs.append(FieldDiff(field="venue", given=parsed.venue, found=rec.venue or "", severity="minor"))
    total = sum(w for w, _ in parts)
    composite = sum(w * s for w, s in parts) / total if total else 0.0
    return Scored(rec, round(composite, 4), title_score, diffs)


def decide(ranked: list[Scored]) -> CitationVerdict:
    """Verdict from candidates sorted best-first (specs/backend.md §3.1 step 4).

    `mismatch` always carries a blocking diff and means the same work with wrong details; a title that disagrees
    (major title diff) is a different work, so `not_found` (a real author with an invented title is the classic
    LLM fabrication). A strong title match with nothing contradicting it is `verified` even when sparse input
    leaves the composite short of VERIFIED_MIN.
    """
    if not ranked:
        return CitationVerdict.not_found
    best = ranked[0]
    title_ok = (best.title or 0.0) >= TITLE_MATCH_MIN
    if not best.blocking and (best.score >= VERIFIED_MIN or (title_ok and best.score >= MISMATCH_MIN)):
        return CitationVerdict.verified
    if len(ranked) > 1 and ranked[1].score >= MISMATCH_MIN and best.score - ranked[1].score <= AMBIGUOUS_DELTA:
        return CitationVerdict.ambiguous
    different_work = any(d.field == "title" and d.severity == "major" for d in best.diffs)
    if best.blocking and not different_work and (title_ok or best.score >= MISMATCH_MIN):
        return CitationVerdict.mismatch  # same work, wrong details (year, first author, ...)
    return CitationVerdict.not_found
