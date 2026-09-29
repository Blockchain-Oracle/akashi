"""Keep gateway trigger phrases out of the first bytes of successful responses."""

import re

from akashi_core.constants.http import TIER3_PATTERNS, TIER3_REPLACEMENT_HYPHEN, TIER3_WINDOW_BYTES

_PATTERN = re.compile("|".join(re.escape(p) for p in sorted(TIER3_PATTERNS, key=len, reverse=True)), re.I)


def _defuse(match: re.Match[str]) -> str:
    text = match.group(0)
    # Break every phrase after its first character with a non-breaking hyphen; stays human-readable.
    return text[0] + TIER3_REPLACEMENT_HYPHEN + text[1:]


def scrub_tier3(text: str) -> str:
    """Rewrite gateway trigger phrases inside untrusted upstream text."""
    return _PATTERN.sub(_defuse, text)


def window_is_clean(body: bytes) -> bool:
    """True when the first TIER3_WINDOW_BYTES contain no trigger phrase."""
    head = body[:TIER3_WINDOW_BYTES].decode("utf-8", errors="ignore")
    return _PATTERN.search(head) is None
