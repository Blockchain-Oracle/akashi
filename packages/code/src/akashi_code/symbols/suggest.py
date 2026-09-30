"""'Did you mean' suggestions from the names visible at the point a lookup failed.

A name qualifies as a typo of a real one (character similarity: `gett` → `get`) or as a name with the same words or
the same action under a common API verb (an invented `fetchJson` → `get`, `request`). Both are ranked on one score,
so a look-alike (`fetch` → `patch`) never outranks the name that means the same thing (`get`).
"""

import re

from rapidfuzz.distance import Levenshtein

SUGGEST_LIMIT = 5
SUGGEST_MIN_SIMILARITY = 0.5  # a typo: character-level similarity alone
SUGGEST_MIN_WORD_SCORE = 0.3  # a shared word or same-meaning verb, blended with character similarity
WORD_WEIGHT = 0.7
CHAR_WEIGHT = 1 - WORD_WEIGHT

# Verbs that name the same action across libraries. A group is a set of interchangeable words; a word may sit in
# more than one group (put: create and update).
VERB_GROUPS: tuple[frozenset[str], ...] = (
    frozenset({"get", "fetch", "load", "read", "retrieve", "request", "download", "query", "lookup"}),
    frozenset({"post", "send", "submit", "create", "add", "insert", "put", "upload", "push"}),
    frozenset({"update", "set", "put", "patch", "modify", "edit", "write", "save", "replace"}),
    frozenset({"delete", "remove", "del", "destroy", "drop", "erase", "clear", "unset"}),
    frozenset({"list", "all", "find", "search", "query", "filter", "select"}),
    frozenset({"parse", "decode", "deserialize", "loads", "from"}),
    frozenset({"stringify", "encode", "serialize", "dumps", "dump", "to", "format"}),
    frozenset({"init", "make", "new", "build", "setup", "create", "construct"}),
    frozenset({"open", "start", "begin", "connect", "launch", "run"}),
    frozenset({"close", "end", "stop", "shutdown", "dispose", "disconnect", "quit"}),
)
_WORD = re.compile(r"[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|\d+")


def _words(name: str) -> list[str]:
    """camelCase, PascalCase, snake_case and kebab-case split into lowercase words (formToJSON → form, to, json)."""
    return [w.lower() for w in _WORD.findall(name)]


def _same_meaning(a: str, b: str) -> bool:
    return a == b or any(a in group and b in group for group in VERB_GROUPS)


def _word_score(query: list[str], candidate: list[str]) -> float:
    """F1 of the two names' words, a same-meaning verb counting as a match (fetchJson vs get: 0.67, vs getUri: 0.5)."""
    if not query or not candidate:
        return 0.0
    hits_q = sum(1 for q in query if any(_same_meaning(q, c) for c in candidate))
    hits_c = sum(1 for c in candidate if any(_same_meaning(c, q) for q in query))
    if not hits_q or not hits_c:
        return 0.0
    recall, precision = hits_q / len(query), hits_c / len(candidate)
    return 2 * recall * precision / (recall + precision)


def _score(name: str, candidate: str) -> float | None:
    """The better of 'a typo of it' and 'means the same'; None when it is neither."""
    chars = Levenshtein.normalized_similarity(name.lower(), candidate.lower())
    words = _word_score(_words(name), _words(candidate))
    blended = WORD_WEIGHT * words + CHAR_WEIGHT * chars
    typo = chars if chars >= SUGGEST_MIN_SIMILARITY else None
    meaning = blended if words > 0 and blended >= SUGGEST_MIN_WORD_SCORE else None
    kept = [s for s in (typo, meaning) if s is not None]
    return max(kept) if kept else None


def suggest(name: str, candidates: list[str]) -> list[str]:
    public = list(dict.fromkeys(c for c in candidates if not c.startswith("_")))  # dedupe, keep order
    scored = [(score, -index, c) for index, c in enumerate(public) if (score := _score(name, c)) is not None]
    return [c for _, _, c in sorted(scored, reverse=True)[:SUGGEST_LIMIT]]  # best first; ties keep source order
