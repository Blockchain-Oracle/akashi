"""Detect defensive/placeholder packages: they 'exist' but are not the real thing."""

import re

from akashi_code.constants import (
    NPM_SECURITY_HOLDING_VERSION_RE,
    NPM_TINY_FILE_COUNT,
    NPM_TINY_UNPACKED_BYTES,
    PLACEHOLDER_PATTERNS,
)
from akashi_code.registries.base import PackageFacts

_SECURITY_VERSION = re.compile(NPM_SECURITY_HOLDING_VERSION_RE)


def placeholder_evidence(facts: PackageFacts) -> list[str]:
    evidence: list[str] = []
    if facts.latest and _SECURITY_VERSION.match(facts.latest):
        evidence.append(f"version {facts.latest} is npm's security holding version")
    desc = (facts.description or "").lower()
    if hit := next((p for p in PLACEHOLDER_PATTERNS if p in desc), None):
        evidence.append(f"description says '{hit}'")
    tiny = (
        facts.unpacked_size is not None
        and facts.unpacked_size < NPM_TINY_UNPACKED_BYTES
        and (facts.file_count or 0) <= NPM_TINY_FILE_COUNT
    )
    if tiny and facts.has_entrypoint is False:
        evidence.append(f"package is {facts.unpacked_size} bytes with no entry point")
    return evidence
