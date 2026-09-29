"""Assemble a success envelope from results + sources, with status and summary derived consistently."""

from collections import Counter
from collections.abc import Sequence
from datetime import UTC, datetime

from pydantic import BaseModel

from akashi_core.constants.app import APP_VERSION
from akashi_core.contract.enums import ResponseStatus
from akashi_core.contract.envelope import Envelope
from akashi_core.contract.sources import SourceRef
from akashi_core.deadline import Deadline


def _dedupe_sources(sources: Sequence[SourceRef]) -> list[SourceRef]:
    seen: dict[tuple[str, str], SourceRef] = {}
    for ref in sources:
        seen.setdefault((ref.name, ref.status), ref)
    return list(seen.values())


def build_envelope[T: BaseModel](
    *,
    service: str,
    operation: str,
    deadline: Deadline,
    results: Sequence[T],
    sources: Sequence[SourceRef],
    unavailable: Sequence[str],
    summary_field: str,
    notes: Sequence[str] = (),
) -> Envelope[T]:
    counts = Counter(str(getattr(r, summary_field)) for r in results)
    missing = sorted(set(unavailable))
    return Envelope[T](
        service=service,
        operation=operation,
        version=APP_VERSION,
        status=ResponseStatus.partial if missing else ResponseStatus.complete,
        as_of=datetime.now(UTC).isoformat(timespec="seconds"),
        deadline_ms=deadline.budget_ms,
        elapsed_ms=deadline.elapsed_ms(),
        unavailable=missing,
        summary=dict(counts),
        results=list(results),
        sources=_dedupe_sources(sources),
        notes=list(notes),
    )
