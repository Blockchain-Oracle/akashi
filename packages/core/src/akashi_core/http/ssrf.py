"""Guard for fetching user-supplied URLs (citation web checks): public addresses only, bounded reads."""

import asyncio
import ipaddress
import socket
from dataclasses import dataclass
from urllib.parse import urljoin, urlsplit

import httpx2

from akashi_core.errors import InvalidInput

ALLOWED_SCHEMES = frozenset({"http", "https"})
MAX_REDIRECTS = 5
URL_FETCH_MAX_BYTES = 65_536
MAX_URL_CHARS = 2_048
REDIRECT_STATUSES = frozenset({301, 302, 303, 307, 308})
# Docker/Compose service names and internal suffixes must never be reachable from user input.
BLOCKED_HOST_SUFFIXES = (".internal", ".local", ".localhost", ".svc", ".cluster.local")


def _is_public(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    return not (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
        or not ip.is_global
    )


async def _resolve_public(host: str) -> None:
    if "." not in host or host.endswith(BLOCKED_HOST_SUFFIXES):
        raise InvalidInput("URL host is not a public internet host.")
    try:
        infos = await asyncio.get_running_loop().getaddrinfo(host, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise InvalidInput("URL host does not resolve.") from exc
    for info in infos:
        if not _is_public(ipaddress.ip_address(info[4][0])):
            raise InvalidInput("URL resolves to a non-public address.")


def validate_url(url: str) -> str:
    if len(url) > MAX_URL_CHARS:
        raise InvalidInput("URL is too long.")
    parts = urlsplit(url)
    if parts.scheme not in ALLOWED_SCHEMES or not parts.hostname:
        raise InvalidInput("URL must be http(s) with a host.")
    try:  # literal IPs are checked directly
        if not _is_public(ipaddress.ip_address(parts.hostname)):
            raise InvalidInput("URL points at a non-public address.")
    except ValueError:
        pass
    return url


@dataclass(slots=True)
class FetchedPage:
    status: int
    final_url: str
    body: bytes
    content_type: str


async def safe_get(client: httpx2.AsyncClient, url: str, budget_s: float) -> FetchedPage:
    """GET with manual redirects; every hop is re-validated and re-resolved; body capped."""
    current = validate_url(url)
    for _ in range(MAX_REDIRECTS + 1):
        host = urlsplit(current).hostname or ""
        await _resolve_public(host)
        async with client.stream(
            "GET",
            current,
            timeout=budget_s,
            follow_redirects=False,
            headers={"range": f"bytes=0-{URL_FETCH_MAX_BYTES - 1}"},
        ) as resp:
            if resp.status_code in REDIRECT_STATUSES and (loc := resp.headers.get("location")):
                current = validate_url(urljoin(current, loc))
                continue
            chunks: list[bytes] = []
            size = 0
            async for chunk in resp.aiter_bytes():
                chunks.append(chunk)
                size += len(chunk)
                if size >= URL_FETCH_MAX_BYTES:
                    break
            return FetchedPage(
                resp.status_code,
                current,
                b"".join(chunks)[:URL_FETCH_MAX_BYTES],
                resp.headers.get("content-type", ""),
            )
    raise InvalidInput("Too many redirects.")
