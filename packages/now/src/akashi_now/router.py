"""HTTP routes for live-facts (mounted under /now; paths here are prefix-free)."""

from fastapi import APIRouter

from akashi_core.constants.app import SERVICE_NOW
from akashi_core.constants.deadlines import NOW_DEADLINE_S
from akashi_core.contract.build import build_envelope
from akashi_core.contract.envelope import Envelope
from akashi_core.deadline import current_deadline
from akashi_now.time.models import TimeRequest, TimeResult
from akashi_now.time.service import get_time

router = APIRouter(prefix="/v1")


@router.post("/time")
async def time(body: TimeRequest) -> Envelope[TimeResult]:
    deadline = current_deadline(NOW_DEADLINE_S)
    result, sources = await get_time(body)
    return build_envelope(
        service=SERVICE_NOW,
        operation="time",
        deadline=deadline,
        results=[result],
        sources=sources,
        unavailable=[s.name for s in sources if s.status == "unavailable"],
        summary_field="kind",
    )
