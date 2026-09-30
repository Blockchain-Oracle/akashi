"""SEC company_tickers.json: company names, so a not-found ticker can say "did you mean AAPL (Apple Inc.)".

Fetched only on the not-found path and cached for a day. The list covers SEC registrants (no ETFs), which is why
it names suggestions but never decides whether a ticker exists.
"""

from functools import cache

from akashi_core.cache.keys import cache_key
from akashi_core.cache.store import cache as store
from akashi_core.http.client import UpstreamClient
from akashi_core.settings import get_settings
from akashi_now import clients
from akashi_now.constants import SEC_TICKERS, TTL_SEC_TICKERS
from akashi_now.stocks.models import normalize_ticker

client = cache(lambda: UpstreamClient(SEC_TICKERS))
clients.register(client)

NAMES_KEY = cache_key("now", "sec", "company-tickers", "names")


async def names() -> dict[str, str]:
    """Ticker (BRK.B form) → company name. Raises UpstreamFailure when the list cannot be fetched."""
    if (hit := await store.get(NAMES_KEY)) is not None:
        return hit
    # The SEC wants a contact in the User-Agent and answers 403 to one that contains a URL (the default's repo link).
    agent = f"akashi/1.0 (mailto:{get_settings().contact_email})"
    body, _ = await client().get_json("/files/company_tickers.json", headers={"user-agent": agent})
    rows = body.values() if isinstance(body, dict) else []
    table = {
        normalize_ticker(row["ticker"]): row["title"]
        for row in rows
        if isinstance(row, dict) and isinstance(row.get("ticker"), str) and isinstance(row.get("title"), str)
    }
    await store.set(NAMES_KEY, table, TTL_SEC_TICKERS)
    return table
