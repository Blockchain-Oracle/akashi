"""Typo-squat / hallucinated-name detection against a popularity reference list.

Two independent checks: generator hits (delimiter, affix, homoglyph variants of popular names, after typogard /
typomania) and Damerau-Levenshtein distance via rapidfuzz.
"""

import re

from rapidfuzz import process
from rapidfuzz.distance import DamerauLevenshtein

from akashi_code.constants import (
    DID_YOU_MEAN_LIMIT,
    TYPO_MAX_DISTANCE,
    TYPO_SHORT_MAX_DISTANCE,
    TYPO_SHORT_NAME_LEN,
)
from akashi_code.models import TypoTarget
from akashi_code.risk.toplists import TopList

_DELIMS = re.compile(r"[-_.]")
_AFFIXES = ("-js", ".js", "js-", "node-", "-node", "py-", "python-", "-py", "-cli", "-lib", "lib")
_HOMOGLYPHS = (("rn", "m"), ("1", "l"), ("0", "o"), ("vv", "w"))


def _max_distance(name: str) -> int:
    return TYPO_SHORT_MAX_DISTANCE if len(name) <= TYPO_SHORT_NAME_LEN else TYPO_MAX_DISTANCE


def _generator_hits(name: str, top: TopList) -> list[TypoTarget]:
    hits: list[TypoTarget] = []
    squashed = _DELIMS.sub("", name)
    variants: list[tuple[str, str]] = [(squashed, "generator:delimiter")]
    for affix in _AFFIXES:
        if name.startswith(affix) and len(name) > len(affix):
            variants.append((name[len(affix) :], "generator:affix"))
        if name.endswith(affix) and len(name) > len(affix):
            variants.append((name[: -len(affix)], "generator:affix"))
    for fake, real in _HOMOGLYPHS:
        if fake in name:
            variants.append((name.replace(fake, real), "generator:homoglyph"))
    squashed_index = {_DELIMS.sub("", n): n for n in top.names}
    for variant, method in variants:
        target = variant if variant in top.rank else squashed_index.get(_DELIMS.sub("", variant))
        if target and target != name:
            hits.append(
                TypoTarget(
                    name=target,
                    distance=DamerauLevenshtein.distance(name, target),
                    method=method,
                    target_rank=top.rank.get(target),
                )
            )
    return hits


def find_targets(name: str, top: TopList) -> list[TypoTarget]:
    """Popular names this one is probably a typo of, best first. Empty when `name` itself is popular."""
    if not top.names or name in top:
        return []
    limit = _max_distance(name)
    near = process.extract(
        name, top.names, scorer=DamerauLevenshtein.distance, score_cutoff=limit, limit=DID_YOU_MEAN_LIMIT
    )
    found = {t.name: t for t in _generator_hits(name, top)}
    for candidate, distance, _ in near:
        found.setdefault(
            candidate,
            TypoTarget(
                name=candidate,
                distance=int(distance),
                method="damerau_levenshtein",
                target_rank=top.rank.get(candidate),
            ),
        )
    return sorted(found.values(), key=lambda t: (t.distance, t.target_rank or len(top.names)))[:DID_YOU_MEAN_LIMIT]
