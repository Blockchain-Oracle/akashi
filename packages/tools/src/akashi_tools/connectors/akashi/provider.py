"""Akashi as a provider: computation and indexes we run ourselves (no third-party terms apply)."""

from akashi_tools.categories import Category
from akashi_tools.framework import NoAuth, Provider, Terms

AKASHI = Provider(
    id="akashi",
    display_name="Akashi",
    summary="Akashi's own tools: cited answers from live sources, time zones and holidays, cross-checked FX and "
    "weather, a 72-hour news index and 89 company job boards.",
    homepage="https://useakashi.xyz",
    base_url="https://useakashi.xyz",
    categories=(Category.ai_answers, Category.time, Category.finance, Category.weather, Category.news, Category.jobs),
    terms=Terms.ours,
    auth=NoAuth(),
)
