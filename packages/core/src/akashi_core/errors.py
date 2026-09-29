"""Exceptions raised inside Akashi; handlers turn them into JSON bodies."""

from akashi_core.constants.http import HTTP_UNPROCESSABLE
from akashi_core.contract.enums import ErrorCode


class AkashiError(Exception):
    status_code: int = HTTP_UNPROCESSABLE
    code: ErrorCode = ErrorCode.invalid_input
    retryable: bool = False

    def __init__(self, message: str, *, details: list[str] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or []


class InvalidInput(AkashiError):
    """The request was well-formed JSON but semantically invalid (422)."""


class UnsupportedInput(AkashiError):
    code = ErrorCode.unsupported


class UpstreamFailure(Exception):
    """An upstream call failed. Never surfaces as a 5xx: it becomes a SourceRef status."""

    def __init__(self, name: str, kind: str, detail: str = "") -> None:
        super().__init__(f"{name}:{kind}")
        self.name = name
        self.kind = kind
        self.detail = detail
