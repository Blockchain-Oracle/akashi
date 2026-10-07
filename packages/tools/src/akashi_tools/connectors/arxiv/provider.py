"""arXiv provider (legacy query API, Atom feed; info.arxiv.org/help/api/user-manual.html)."""

from akashi_tools.categories import Category
from akashi_tools.framework import NoAuth, Provider, Terms

ARXIV = Provider(
    id="arxiv",
    display_name="arXiv",
    summary="Search 2.5M+ preprints in physics, mathematics, computer science, biology, finance and statistics.",
    homepage="https://arxiv.org",
    docs_url="https://info.arxiv.org/help/api/user-manual.html",
    base_url="https://export.arxiv.org",
    categories=(Category.research,),
    terms=Terms.open,
    auth=NoAuth(),
    # Terms of use: "no more than one request every three seconds" on "a single connection at a time".
    rate="1/3second",
    max_concurrency=1,
    # Metadata only: e-prints (PDFs, source) are the authors' and may not be redistributed, so we only link to them.
    licence="Metadata CC0 1.0",
    attribution="Thank you to arXiv for use of its open access interoperability.",
)
