"""`akashi-task <name>`: periodic jobs, run by Coolify scheduled tasks inside the api container (D-018).

  gdelt   refresh the local GDELT news index (akashi/news)
  jobs    refresh the 89 ATS job boards (akashi/jobs)
  probe   run every keyless endpoint's example, past the cache, so health has fresh samples (keyed ones get
          theirs from traffic); scheduled every 10 min, inside HEALTH_RECENT_S (15 min)
"""

import asyncio
import sys
from collections.abc import Awaitable, Callable
from typing import Any

import orjson
from dotenv import load_dotenv

from akashi_core.cache.store import cache
from akashi_core.obs.logging import configure_logging
from akashi_core.settings import get_settings
from akashi_now.jobs import ingest as jobs
from akashi_now.news import ingest as gdelt
from akashi_tools.connectors import load
from akashi_tools.framework import catalog
from akashi_tools.framework.context import close_clients
from akashi_tools.framework.engine import run
from akashi_tools.framework.errors import ToolError
from akashi_tools.framework.health import health

_ARGC = 2  # program name + task name


async def probe() -> dict[str, Any]:
    load()
    keyless = [e for e in catalog.endpoints() if e.available and not e.provider.auth.envs]
    failed: list[str] = []
    for endpoint in keyless:
        try:
            await run(endpoint.id, endpoint.example, fresh=True)
        except ToolError as exc:
            failed.append(f"{endpoint.id}: {exc.code}")
    await close_clients()
    await health.close()
    return {"probed": len(keyless), "failed": failed}


TASKS: dict[str, Callable[[], Awaitable[dict[str, Any]]]] = {"gdelt": gdelt.run, "jobs": jobs.run, "probe": probe}


async def _run(name: str) -> dict[str, Any]:
    cache.setup(get_settings().redis_url)
    try:
        return await TASKS[name]()
    finally:
        await gdelt.client().aclose()
        await cache.close()


def main() -> None:
    load_dotenv(override=False)
    configure_logging(get_settings().log_level)
    if len(sys.argv) != _ARGC or sys.argv[1] not in TASKS:
        sys.exit(f"usage: akashi-task {{{'|'.join(TASKS)}}}")
    print(orjson.dumps(asyncio.run(_run(sys.argv[1]))).decode())
