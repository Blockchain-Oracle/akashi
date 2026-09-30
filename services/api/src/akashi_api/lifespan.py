"""Startup/shutdown: logging, cache, reference data, upstream clients."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from akashi_cite.sources.clients import close_all as close_cite_clients
from akashi_code.registries.clients import close_all as close_code_clients
from akashi_code.risk import toplists
from akashi_core.cache.store import cache
from akashi_core.obs.logging import configure_logging
from akashi_core.settings import get_settings
from akashi_now.clients import close_all as close_now_clients
from akashi_now.stocks.service import warm_up as warm_stocks


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    cache.setup(settings.redis_url)
    await toplists.load_all()
    warm_stocks()
    yield
    await close_code_clients()
    await close_cite_clients()
    await close_now_clients()
    await cache.close()
