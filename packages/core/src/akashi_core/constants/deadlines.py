"""Request deadlines and upstream timeouts."""

from typing import Final

NOW_DEADLINE_S: Final = 4.0  # Akashi's own computations (akashi/* tools): hard stop 4 s

# Reserved for serialization + the relayer hop.
DEADLINE_SAFETY_MARGIN_S: Final = 0.25

DEFAULT_CONNECT_S: Final = 1.0
DEFAULT_TOTAL_S: Final = 2.5
DEFAULT_POOL_S: Final = 0.5
KEEPALIVE_S: Final = 90.0
