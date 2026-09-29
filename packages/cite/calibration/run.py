"""Calibrate citation-verify: run the labelled real/fabricated references and report verdict counts + errors.

    uv run python packages/cite/calibration/run.py

Real references must come back verified/mismatch (never not_found); fabricated ones must come back not_found.
"""

import asyncio
from collections import Counter
from pathlib import Path

from akashi_cite.constants import MAX_CITATIONS_PER_REQUEST
from akashi_cite.models import VerifyRequest
from akashi_cite.service import verify
from akashi_core.cache.store import cache
from akashi_core.deadline import Deadline, set_deadline

HERE = Path(__file__).parent
CALIBRATION_BUDGET_S = 60.0  # offline run: generous budget so latency never masquerades as a verdict


async def run(label: str) -> None:
    refs = [line for line in (HERE / f"{label}.txt").read_text().splitlines() if line.strip()]
    counts: Counter[str] = Counter()
    for start in range(0, len(refs), MAX_CITATIONS_PER_REQUEST):
        batch = refs[start : start + MAX_CITATIONS_PER_REQUEST]
        set_deadline(Deadline(CALIBRATION_BUDGET_S))
        results, _, _ = await verify(VerifyRequest(citations=list(batch)))
        for ref, r in zip(batch, results, strict=True):
            counts[r.verdict] += 1
            title = r.matched.title if r.matched else ""
            print(f"{label:4} {r.verdict:12} {r.confidence:.3f}  {ref[:70]:70}  -> {(title or '')[:50]}")
    print(f"== {label}: {dict(counts)}\n")


async def main() -> None:
    cache.setup(None)
    await run("real")
    await run("fake")


if __name__ == "__main__":
    asyncio.run(main())
