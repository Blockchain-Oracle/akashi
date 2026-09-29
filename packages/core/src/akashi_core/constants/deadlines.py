"""Per-service request deadlines (specs/backend.md §2.10; sources-*.md latency budgets)."""

from typing import Final

CITE_DEADLINE_S: Final = 8.5  # citation §7: p95 6 s target, hard stop 8.5 s
CITE_TARGET_P95_S: Final = 6.0
CODE_DEADLINE_S: Final = 7.0  # code §8
NOW_DEADLINE_S: Final = 4.0  # live-facts: p95 < 3 s, hard stop 4 s
NOW_TARGET_P95_S: Final = 3.0

# Reserved for serialization + the relayer hop (inference).
DEADLINE_SAFETY_MARGIN_S: Final = 0.25

DEFAULT_CONNECT_S: Final = 1.0
DEFAULT_TOTAL_S: Final = 2.5
DEFAULT_POOL_S: Final = 0.5
KEEPALIVE_S: Final = 90.0
