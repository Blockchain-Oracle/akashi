"""Exception handlers: every error is a JSON object {error:{code,message,retryable,details}}."""

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from akashi_core.app.responses import AkashiJSONResponse
from akashi_core.constants.http import (
    HTTP_BAD_REQUEST,
    HTTP_INTERNAL,
    HTTP_METHOD_NOT_ALLOWED,
    HTTP_NOT_FOUND,
    HTTP_PAYLOAD_TOO_LARGE,
    HTTP_UNPROCESSABLE,
)
from akashi_core.contract.enums import ErrorCode
from akashi_core.contract.envelope import ErrorBody, ErrorEnvelope
from akashi_core.errors import AkashiError

log = structlog.get_logger(__name__)

MAX_ERROR_DETAILS = 10
MAX_DETAIL_CHARS = 200
_JSON_DECODE_ERROR_TYPE = "json_invalid"
_STATUS_TO_CODE = {
    HTTP_NOT_FOUND: ErrorCode.not_found,
    HTTP_METHOD_NOT_ALLOWED: ErrorCode.method_not_allowed,
    HTTP_PAYLOAD_TOO_LARGE: ErrorCode.payload_too_large,
    HTTP_BAD_REQUEST: ErrorCode.invalid_json,
    HTTP_UNPROCESSABLE: ErrorCode.invalid_input,
}


def error_response(
    status: int, code: ErrorCode, message: str, *, retryable: bool = False, details: list[str] | None = None
) -> AkashiJSONResponse:
    body = ErrorEnvelope(error=ErrorBody(code=code, message=message, retryable=retryable, details=details or []))
    return AkashiJSONResponse(body.model_dump(mode="json"), status_code=status)


def _format_validation(exc: RequestValidationError) -> list[str]:
    # Field-by-field, never the raw repr (which leaks internal file/line info — FastAPI docs).
    out: list[str] = []
    for err in exc.errors()[:MAX_ERROR_DETAILS]:
        loc = ".".join(str(p) for p in err.get("loc", ())[1:]) or "body"
        out.append(f"{loc}: {err.get('msg', 'invalid')}"[:MAX_DETAIL_CHARS])
    return out


async def _on_validation(_: Request, exc: RequestValidationError) -> AkashiJSONResponse:
    if any(e.get("type") == _JSON_DECODE_ERROR_TYPE for e in exc.errors()):
        return error_response(HTTP_BAD_REQUEST, ErrorCode.invalid_json, "Request body is not valid JSON.")
    return error_response(
        HTTP_UNPROCESSABLE,
        ErrorCode.invalid_input,
        "Request body failed validation.",
        details=_format_validation(exc),
    )


async def _on_http(_: Request, exc: StarletteHTTPException) -> AkashiJSONResponse:
    code = _STATUS_TO_CODE.get(exc.status_code, ErrorCode.invalid_input)
    return error_response(exc.status_code, code, str(exc.detail))


async def _on_akashi(_: Request, exc: AkashiError) -> AkashiJSONResponse:
    return error_response(exc.status_code, exc.code, exc.message, retryable=exc.retryable, details=exc.details)


async def _on_unhandled(request: Request, exc: Exception) -> AkashiJSONResponse:
    log.exception("unhandled_error", path=request.url.path, error=type(exc).__name__)
    return error_response(HTTP_INTERNAL, ErrorCode.internal, "Internal error.", retryable=True)


def install_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, _on_validation)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, _on_http)  # type: ignore[arg-type]
    app.add_exception_handler(AkashiError, _on_akashi)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, _on_unhandled)
