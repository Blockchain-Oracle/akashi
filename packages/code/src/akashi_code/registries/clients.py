"""Process-wide upstream clients for code-reality-check (created lazily, closed at shutdown)."""

from functools import cache

from akashi_code.constants import DEPS_DEV, NPM_DOWNLOADS, NPM_REGISTRY, PYPI
from akashi_core.http.client import UpstreamClient


@cache
def npm() -> UpstreamClient:
    return UpstreamClient(NPM_REGISTRY)


@cache
def npm_downloads() -> UpstreamClient:
    return UpstreamClient(NPM_DOWNLOADS)


@cache
def pypi() -> UpstreamClient:
    return UpstreamClient(PYPI)


@cache
def deps_dev() -> UpstreamClient:
    return UpstreamClient(DEPS_DEV)


async def close_all() -> None:
    for factory in (npm, npm_downloads, pypi, deps_dev):
        if factory.cache_info().currsize:
            await factory().aclose()
