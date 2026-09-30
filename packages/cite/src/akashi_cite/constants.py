"""citation-verify constants (specs/backend.md §3.1; sources-citation-verify.md for measurements)."""

from datetime import timedelta
from typing import Final

from akashi_core.http.registry import UpstreamSpec

# --- upstreams ---
DOI_HANDLE = UpstreamSpec(
    "doi.org", "https://doi.org", max_concurrency=8, total_s=1.5, attribution="doi.org handle API"
)
CROSSREF = UpstreamSpec(
    "crossref",
    "https://api.crossref.org",
    max_concurrency=3,
    total_s=2.5,
    rate="3/second",  # polite pool: x-rate-limit-limit 3 / 1s, x-concurrency-limit 3 (headers, 2026-09-29)
    attribution="Crossref REST API (metadata incl. Retraction Watch)",
)
DATACITE = UpstreamSpec(
    "datacite",
    "https://api.datacite.org",
    max_concurrency=3,
    total_s=2.5,
    rate="3/second",
    attribution="DataCite REST API",
)
OPENALEX = UpstreamSpec(
    "openalex", "https://api.openalex.org", max_concurrency=5, total_s=2.5, licence="CC0", attribution="OpenAlex (CC0)"
)
PUBMED = UpstreamSpec(
    "pubmed",
    "https://eutils.ncbi.nlm.nih.gov",
    max_concurrency=3,
    total_s=2.5,
    rate="3/second",
    attribution="NCBI E-utilities",
)
CAP = UpstreamSpec(
    "case.law",
    "https://static.case.law",
    max_concurrency=4,
    total_s=2.5,
    licence="CC0",
    attribution="Caselaw Access Project (Harvard Law School Library)",
)
WAYBACK = UpstreamSpec(
    "wayback", "https://archive.org", max_concurrency=2, total_s=3.0, attribution="Internet Archive Wayback Machine"
)
EUROPEPMC = UpstreamSpec(
    "europepmc",
    "https://www.ebi.ac.uk",
    max_concurrency=3,
    total_s=3.0,
    licence="abstracts: publisher terms (quoted as evidence, not redistributed)",
    attribution="Europe PMC",
)
NLI = UpstreamSpec(
    "nli", "http://nli.internal:8100", max_concurrency=4, total_s=5.0, retry_attempts=1
)  # the sidecar queues; warm scoring is ~0.35 s
WEB = UpstreamSpec("web", "https://example.invalid", max_concurrency=4, total_s=3.0, retry_attempts=1)

# --- request limits ---
MAX_CITATIONS_PER_REQUEST: Final = 10
MAX_CITATION_CHARS: Final = 2_000
MAX_AUTHORS: Final = 30
MIN_YEAR: Final = 1500
MAX_YEAR: Final = 2100
CITATION_CONCURRENCY: Final = MAX_CITATIONS_PER_REQUEST  # items are I/O-bound; per-upstream semaphores bound load
CROSSREF_ROWS: Final = 5

# --- matching (weights/thresholds: specs/backend.md §3.1; provisional, calibrate on labelled refs) ---
WEIGHT_TITLE: Final = 0.50
WEIGHT_AUTHORS: Final = 0.25
WEIGHT_YEAR: Final = 0.15
WEIGHT_VENUE: Final = 0.10
FIRST_AUTHOR_SHARE: Final = 0.6
AUTHOR_SET_SHARE: Final = 0.4
AUTHOR_FUZZY_MIN: Final = 90  # rapidfuzz ratio for a near-match family name
AUTHOR_FUZZY_CREDIT: Final = 0.8
YEAR_OFF_BY_ONE_CREDIT: Final = 0.7  # online-first vs print year
PREPRINT_TYPES: Final = frozenset({"preprint", "posted-content"})  # DataCite / OpenAlex / Crossref spellings
PREPRINT_YEAR_SLACK: Final = 2  # an arXiv 2014 paper cited as ICLR 2015 is the same work
PREPRINT_YEAR_SLACK_BEFORE: Final = 1  # JMLR 2011 paper whose arXiv copy was posted in 2012
VERIFIED_MIN: Final = 0.85
TITLE_MATCH_MIN: Final = 0.90
MISMATCH_MIN: Final = 0.65
AMBIGUOUS_DELTA: Final = 0.05
LEGAL_NAME_MATCH_MIN: Final = 80
PERCENT: Final = 100

# --- legal coverage (CAP ReportersMetadata: us ≤ 2014, f3d ≤ 2019) ---
CAP_REPORTER_SLUGS: Final = {
    "U.S.": "us",
    "F.3d": "f3d",
    "F.2d": "f2d",
    "F.": "f",
    "S. Ct.": "s-ct",
    "F. Supp.": "f-supp",
    "F. Supp. 2d": "f-supp-2d",
    "F. Supp. 3d": "f-supp-3d",
}
# Last year each CAP reporter covers (static.case.law/ReportersMetadata.json, read 2026-09-29).
CAP_COVERAGE_END: Final = {
    "us": 2014,
    "f3d": 2019,
    "f2d": 1993,
    "f": 1932,
    "s-ct": 2020,
    "f-supp": 1998,
    "f-supp-2d": 2014,
    "f-supp-3d": 2019,
}
COURTLISTENER_CITE_URL: Final = "https://www.courtlistener.com/c/{reporter}/{volume}/{page}/"

# --- web checks ---
HTTP_OK_MIN: Final = 200
HTTP_OK_MAX: Final = 299
DEAD_STATUSES: Final = frozenset({404, 410})
BLOCKED_STATUSES: Final = frozenset({401, 403, 429})  # bot walls: never "dead" (specs/backend.md §3.1 step 7)
PAGE_TITLE_MAX_CHARS: Final = 300

# --- verdict confidence ---
CONFIDENCE_IDENTIFIER: Final = 0.99  # a DOI/PMID that resolves and agrees with every given field
CONFIDENCE_LEGAL_EXACT: Final = 0.95
CONFIDENCE_WEB_LIVE: Final = 0.9
CONFIDENCE_ARCHIVED_ONLY: Final = 0.7
CONFIDENCE_NONE: Final = 0.0
CONFIDENCE_SEARCH_MISS_MAX: Final = 0.9  # "no match found" is absence of evidence, never certainty
VENUE_DIFF_MIN: Final = 0.6  # venue similarity below this is reported as a (minor) diff
MAX_CANDIDATES: Final = 3
MAX_RECORD_AUTHORS: Final = 10
MIN_SEGMENT_WORDS: Final = 1
MIN_TITLE_GUESS_WORDS: Final = 2
MIN_SURNAME_CHARS: Final = 2
TITLE_DIFF_MAJOR_BELOW: Final = 0.75  # title similarity under this is a different work; above, notation noise
VENUE_SEGMENT_MIN: Final = 0.9  # a reference segment this close to the record's venue is the venue, not a title
# Correction/retraction notices and indexes point at a work; they are never the work itself.
NOTICE_TITLE_PATTERN: Final = (
    r"^(?:(?:author|publisher)\s+)?correction\b|^erratum\b|^corrigendum\b|^retraction(?:\s+note)?\s*:"
    r"|^expression of concern\b|^(?:\d{4}\s*)?(?:annual\s+)?index|^review (?:of|for)\b"
    r"|publication information$|^editorial board\b|^table of contents\b|^front (?:matter|cover)\b"
    r"|^masthead\b|^(?:information|instructions) for authors\b|^cover image\b"
)
# Container-level records (a journal, an issue, its front matter) are never the cited work.
NON_WORK_TYPES: Final = frozenset(
    {
        "journal",
        "journal-issue",
        "journal-volume",
        "component",
        "proceedings",
        "book-series",
        "book-set",
        "peer-review",
        "report-series",
    }
)

# --- cache TTLs (specs/backend.md §2.6) ---
TTL_DOI_RA: Final = timedelta(days=30)
TTL_WORK: Final = timedelta(hours=24)  # retraction status can change
TTL_BIBLIO: Final = timedelta(hours=24)
TTL_DATACITE: Final = timedelta(days=7)
TTL_CAP_VOLUME: Final = timedelta(days=30)
TTL_WEB: Final = timedelta(hours=1)
TTL_WAYBACK: Final = timedelta(hours=24)

# --- /claim (specs/backend.md §3.1 claim algorithm; thresholds validated on calibration/nli_pairs.jsonl) ---
MAX_CLAIM_CHARS: Final = 1_000
MAX_EVIDENCE_CHARS: Final = 20_000
NLI_MAX_PREMISE_SENTENCES: Final = 16
NLI_TOP_SENTENCES: Final = 6  # lexical preselection keeps inference ~0.35 s (8 pairs, measured on the server)
NLI_WINDOW_FROM_TOP: Final = 2  # adjacent-sentence windows around the best lexical hits
NLI_PREMISE_MAX_CHARS: Final = 2_000  # sidecar's per-text cap
NLI_ENTAIL_MIN: Final = 0.80
NLI_CONTRA_MIN: Final = 0.80
NLI_OPPOSING_MAX: Final = 0.20  # a "supported" sentence must not also look contradicting
MIN_SENTENCE_CHARS: Final = 20
MIN_CONTENT_WORD_CHARS: Final = 3  # shorter tokens ("of", "in") never count as topical overlap
