"""HTTP-level limits and gateway rules (sources cited per constant)."""

from typing import Final

# Portal/relay request cap ≈ 64 KiB (measured against the portal: 65,009 B → 402, 70,009 B → 413).
MAX_REQUEST_BYTES: Final = 65_536

# Gateways scan the first 2 KiB of a *successful* body for these phrases and treat a hit as a failed relay
# (Pocket's SAGE heuristic, indicators.go; the service design rules). Case-insensitive.
TIER3_PATTERNS: Final = (
    "502 bad gateway",
    "503 service unavailable",
    "504 gateway timeout",
    "bad gateway",
    "connection refused",
    "connection reset",
    "gateway timeout",
    "service unavailable",
    "timeout",
)
TIER3_WINDOW_BYTES: Final = 2_048
# Non-breaking hyphen: "timeout" → "time‑out" stays readable but no longer matches the gateway scan.
TIER3_REPLACEMENT_HYPHEN: Final = "‑"

HTTP_BAD_REQUEST: Final = 400
HTTP_NOT_FOUND: Final = 404
HTTP_METHOD_NOT_ALLOWED: Final = 405
HTTP_PAYLOAD_TOO_LARGE: Final = 413
HTTP_UNPROCESSABLE: Final = 422
HTTP_FAILED_DEPENDENCY: Final = 424
HTTP_INTERNAL: Final = 500
HTTP_CLIENT_ERROR_MIN: Final = 400
HTTP_SERVER_ERROR_MIN: Final = 500

JSON_MEDIA_TYPE: Final = "application/json"

# The RelayMiner never relays a backend 5xx (pocket-relay-miner relayer/proxy.go: no signed RelayResponse, and it
# counts toward its circuit breaker), so a tool failure leaves the api as 424 with its real status in this header;
# the gateway restores the status for clients.
UPSTREAM_STATUS_HEADER: Final = "x-akashi-status"
