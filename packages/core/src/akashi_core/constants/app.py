"""Service identity and app-level constants."""

from typing import Final

APP_VERSION: Final = "1.0.0"

SERVICE_CITE: Final = "citation-verify"
SERVICE_CODE: Final = "code-reality-check"
SERVICE_NOW: Final = "live-facts"

PREFIX_CITE: Final = "/cite"
PREFIX_CODE: Final = "/code"
PREFIX_NOW: Final = "/now"

HEALTH_OK: Final = "ok"
METRICS_PORT: Final = 9102
REQUEST_ID_HEADER: Final = "x-request-id"
DEMO_SECRET_HEADER: Final = "x-akashi-demo"
