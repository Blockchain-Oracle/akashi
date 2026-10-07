"""Startup/shutdown: env, logging, cache, connectors, upstream clients."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from dotenv import load_dotenv
from fastapi import FastAPI

from akashi_core.cache.store import cache
from akashi_core.obs.logging import configure_logging
from akashi_core.settings import get_settings
from akashi_now.clients import close_all as close_now_clients
from akashi_tools.connectors import load
from akashi_tools.framework import catalog
from akashi_tools.framework.context import close_clients
from akashi_tools.framework.health import health

log = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    load_dotenv(override=False)  # local dev reads akashi/.env; in production Coolify injects the same names
    settings = get_settings()
    configure_logging(settings.log_level)
    cache.setup(settings.redis_url)
    registered = load()
    body = catalog.compiled()
    available = sum(1 for e in body["endpoints"] if e["available"])
    log.info("catalog_ready", endpoints=registered, available=available, hash=body["hash"])
    yield
    await close_clients()
    await close_now_clients()
    await health.close()
    await cache.close()
