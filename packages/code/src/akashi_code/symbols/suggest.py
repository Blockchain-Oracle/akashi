"""'Did you mean' suggestions from the names visible at the point a lookup failed."""

from rapidfuzz import process
from rapidfuzz.distance import Levenshtein

SUGGEST_LIMIT = 5
SUGGEST_MIN_SIMILARITY = 0.5


def suggest(name: str, candidates: list[str]) -> list[str]:
    public = list(dict.fromkeys(c for c in candidates if not c.startswith("_")))  # dedupe, keep order
    hits = process.extract(
        name, public, scorer=Levenshtein.normalized_similarity, score_cutoff=SUGGEST_MIN_SIMILARITY, limit=SUGGEST_LIMIT
    )
    return [h[0] for h in hits]
