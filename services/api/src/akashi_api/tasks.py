"""`akashi-task <name>`: periodic jobs, run by Coolify scheduled tasks inside the api container (D-018)."""

import asyncio
import sys
from collections.abc import Awaitable, Callable
from typing import Any

import orjson

from akashi_core.cache.store import cache
from akashi_core.obs.logging import configure_logging
from akashi_core.settings import get_settings
from akashi_now.news import ingest as gdelt

TASKS: dict[str, Callable[[], Awaitable[dict[str, Any]]]] = {"gdelt": gdelt.run}


async def _run(name: str) -> dict[str, Any]:
    cache.setup(get_settings().redis_url)
    try:
        return await TASKS[name]()
    finally:
        await gdelt.client().aclose()
        await cache.close()


def main() -> None:
    configure_logging(get_settings().log_level)
    if len(sys.argv) != 2 or sys.argv[1] not in TASKS:  # noqa: PLR2004 (program name + task)
        sys.exit(f"usage: akashi-task {{{'|'.join(TASKS)}}}")
    print(orjson.dumps(asyncio.run(_run(sys.argv[1]))).decode())
