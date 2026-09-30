"""Did-you-mean for a ticker that did not trade: one edit away (APPL → AAPL) or a company name (APPLE → AAPL),
ranked by how much each candidate traded so the famous name comes first."""

from rapidfuzz import fuzz, process, utils
from rapidfuzz.distance import DamerauLevenshtein

from akashi_now.constants import SUGGEST_MAX, SUGGEST_MAX_EDITS, SUGGEST_NAME_MIN, SUGGEST_NAME_MIN_CHARS
from akashi_now.stocks.massive import Universe
from akashi_now.stocks.models import Suggestion


def rank(symbol: str, universe: Universe, names: dict[str, str]) -> list[Suggestion]:
    """CPU work over ~12k tickers: call it from a thread."""
    near = process.extract(
        symbol, list(universe.closes), scorer=DamerauLevenshtein.distance, score_cutoff=SUGGEST_MAX_EDITS, limit=None
    )
    candidates = {ticker for ticker, _, _ in near}
    if len(symbol) >= SUGGEST_NAME_MIN_CHARS and names:
        by_name = process.extract(
            symbol,
            names,
            scorer=fuzz.WRatio,
            processor=utils.default_process,
            score_cutoff=SUGGEST_NAME_MIN,
            limit=None,
        )
        candidates |= {ticker for _, _, ticker in by_name if ticker in universe.closes}
    best = sorted(candidates, key=lambda t: universe.dollar_volume.get(t, 0), reverse=True)[:SUGGEST_MAX]
    return [Suggestion(symbol=t, name=names.get(t)) for t in best]
