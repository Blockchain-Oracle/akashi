"""Process-wide upstream clients (created lazily)."""

from functools import cache

from akashi_cite.constants import CAP, CROSSREF, DATACITE, DOI_HANDLE, OPENALEX, PUBMED, WAYBACK, WEB
from akashi_core.http.client import UpstreamClient

doi = cache(lambda: UpstreamClient(DOI_HANDLE))
crossref = cache(lambda: UpstreamClient(CROSSREF))
datacite = cache(lambda: UpstreamClient(DATACITE))
openalex = cache(lambda: UpstreamClient(OPENALEX))
pubmed = cache(lambda: UpstreamClient(PUBMED))
cap = cache(lambda: UpstreamClient(CAP))
wayback = cache(lambda: UpstreamClient(WAYBACK))
web = cache(lambda: UpstreamClient(WEB))

_ALL = (doi, crossref, datacite, openalex, pubmed, cap, wayback, web)


async def close_all() -> None:
    for factory in _ALL:
        if factory.cache_info().currsize:
            await factory().aclose()
