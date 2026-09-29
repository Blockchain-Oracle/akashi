"""Common answer shape produced by every ecosystem's symbol resolver."""

from dataclasses import dataclass, field

from akashi_core.contract.enums import Tristate


@dataclass(slots=True)
class SymbolAnswer:
    exists: Tristate
    symbol_kind: str | None = None
    signature: str | None = None
    overloads: list[str] = field(default_factory=list)
    defined_in: str | None = None
    siblings: list[str] = field(default_factory=list)  # names visible where the lookup failed (for did-you-mean)
    evidence_source: str | None = None
    reason: str | None = None
    suggest_for: str | None = None  # the token that failed (defaults to the last one)
    pending: bool = False  # a cold build is still running; retry after retry_after_ms
    retry_after_ms: int | None = None
