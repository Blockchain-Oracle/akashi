"""Process-wide upstream clients for code-reality-check (created lazily, closed at shutdown)."""

from functools import cache

from akashi_code.constants import (
    CRATES_INDEX,
    DEPS_DEV,
    GO_PROXY,
    MAVEN_CENTRAL,
    NPM_DOWNLOADS,
    NPM_REGISTRY,
    NUGET,
    PACKAGIST,
    PYPI,
    RUBYGEMS,
)
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


@cache
def crates() -> UpstreamClient:
    return UpstreamClient(CRATES_INDEX)


@cache
def go_proxy() -> UpstreamClient:
    return UpstreamClient(GO_PROXY)


@cache
def maven() -> UpstreamClient:
    return UpstreamClient(MAVEN_CENTRAL)


@cache
def rubygems() -> UpstreamClient:
    return UpstreamClient(RUBYGEMS)


@cache
def packagist() -> UpstreamClient:
    return UpstreamClient(PACKAGIST)


@cache
def nuget() -> UpstreamClient:
    return UpstreamClient(NUGET)


_ALL = (npm, npm_downloads, pypi, deps_dev, crates, go_proxy, maven, rubygems, packagist, nuget)


async def close_all() -> None:
    for factory in _ALL:
        if factory.cache_info().currsize:
            await factory().aclose()
