"""DefiLlama open API provider (api-docs.defillama.com; free endpoints on api.llama.fi, no key)."""

from akashi_tools.categories import Category
from akashi_tools.framework import NoAuth, Provider, Terms

DEFILLAMA = Provider(
    id="defillama",
    display_name="DefiLlama",
    summary="Total value locked (TVL) for DeFi protocols and blockchains, with 1-day and 7-day changes.",
    homepage="https://defillama.com",
    docs_url="https://api-docs.defillama.com",
    base_url="https://api.llama.fi",
    categories=(Category.crypto, Category.finance),
    terms=Terms.open,
    auth=NoAuth(),
    max_concurrency=2,
    attribution="DefiLlama",
)
