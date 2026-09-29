"""PubMed E-utilities: PMID → record (esummary), journal/year/vol/page → PMID (ecitmatch)."""

from akashi_cite.sources import clients
from akashi_cite.sources.records import Record

TOOL = "akashi"


async def summary(pmid: str) -> Record | None:
    data, _ = await clients.pubmed().get_json(
        f"/entrez/eutils/esummary.fcgi?db=pubmed&id={pmid}&retmode=json&tool={TOOL}"
    )
    doc = (data.get("result") or {}).get(pmid)
    if not doc or doc.get("error"):
        return None
    doi = next((i["value"].lower() for i in doc.get("articleids", []) if i.get("idtype") == "doi"), None)
    year = doc.get("pubdate", "")[:4]
    return Record(
        source="pubmed",
        doi=doi,
        title=doc.get("title"),
        authors=[a["name"].split(" ")[0] for a in doc.get("authors", []) if a.get("name")],
        year=int(year) if year.isdigit() else None,
        venue=doc.get("fulljournalname") or doc.get("source"),
        volume=doc.get("volume"),
        pages=doc.get("pages"),
        url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
    )
