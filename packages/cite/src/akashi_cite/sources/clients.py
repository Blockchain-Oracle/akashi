"""Process-wide upstream clients (created lazily)."""

from dataclasses import replace
from functools import cache

from akashi_cite.constants import CAP, CROSSREF, DATACITE, DOI_HANDLE, EUROPEPMC, NLI, OPENALEX, PUBMED, WAYBACK, WEB
from akashi_core.http.client import UpstreamClient
from akashi_core.settings import get_settings

doi = cache(lambda: UpstreamClient(DOI_HANDLE))
crossref = cache(lambda: UpstreamClient(CROSSREF))
datacite = cache(lambda: UpstreamClient(DATACITE))
openalex = cache(lambda: UpstreamClient(OPENALEX))
pubmed = cache(lambda: UpstreamClient(PUBMED))
cap = cache(lambda: UpstreamClient(CAP))
wayback = cache(lambda: UpstreamClient(WAYBACK))
web = cache(lambda: UpstreamClient(WEB))
europepmc = cache(lambda: UpstreamClient(EUROPEPMC))
nli = cache(lambda: UpstreamClient(replace(NLI, base_url=get_settings().nli_url)))

_ALL = (doi, crossref, datacite, openalex, pubmed, cap, wayback, web, europepmc, nli)


async def close_all() -> None:
    for factory in _ALL:
        if factory.cache_info().currsize:
            await factory().aclose()
