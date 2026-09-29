"""JSON response that renders with orjson and guarantees a gateway-clean first window on success."""

from typing import Any

import orjson
import structlog
from starlette.responses import JSONResponse

from akashi_core.constants.http import HTTP_CLIENT_ERROR_MIN, TIER3_WINDOW_BYTES
from akashi_core.safety import scrub_tier3, window_is_clean

log = structlog.get_logger(__name__)


class AkashiJSONResponse(JSONResponse):
    media_type = "application/json"

    def render(self, content: Any) -> bytes:
        body = orjson.dumps(content, option=orjson.OPT_NON_STR_KEYS)
        if self.status_code < HTTP_CLIENT_ERROR_MIN and not window_is_clean(body):
            # Untrusted text should already be scrubbed via UntrustedStr; this is the last line of defence.
            log.warning("tier3_phrase_in_success_window")
            text = body.decode("utf-8")
            head, tail = text[:TIER3_WINDOW_BYTES], text[TIER3_WINDOW_BYTES:]
            body = (scrub_tier3(head) + tail).encode("utf-8")
        return body
