# S4 — citation-verify

**Plan:** `00-plan.md` §7 · **Open first:** specs/backend.md §3.1, §9 cite

## Steps
- [x] Input router (regex DOI/arXiv/PMID/URL, eyecite with ';' split, style-aware year) — `parse.py`
- [x] DOI handle + Crossref/DataCite (+ DataCite fallback on a Crossref 404) + field diff — `paths/scholarly.py`
- [x] Retraction overlay (Crossref `updated-by` incl. Retraction Watch + OpenAlex `is_retracted`); no local RW DB (D-012)
- [x] Crossref biblio scoring + fallbacks: Crossref title+author, DataCite arXiv, OpenAlex (D-013) — `match.py`
- [x] eyecite + CAP static volumes (page-inside-other-case, name/year diffs); legal.db deferred (D-011)
- [x] Web: SSRF fetch pinned to the vetted IP + Wayback + citation_doi → DOI path; trailing-'.' retry
- [x] NLI /claim: 51-pair check → 8-bit variants fail the gate → fp32 in the akashi-nli sidecar (D-016); evidence chain (D-017); live gate correct
- [x] Deadlines/partials, calibration (40/40: `calibration/README.md`), schema (`cards/citation-verify/*`)
- [x] Deploy + live gate + probe (Brown v. Board, D-011) + calibration re-run from production (40/40 · 40/40)

## Gate
Varghese→not_found; Wakefield→retracted 2010-02-06; nature14539→verified (wrong year→mismatch); arXiv 1706.03762→verified; 3 NLI pairs; SSRF 169.254.169.254→422.

## Findings
- CAP ends 2014 for U.S. Reports, so Obergefell can't be the probe (D-011).
- Crossref `score` is unnormalized (it scales with query length), so no fixed floor works; the composite decides.
- `token_set_ratio(title, raw)` is a subset match: a journal-titled front-matter record "verified" a fake. Titles are now compared per segment.
- Crossref's polite pool is 3/s (headers). OpenAlex's keyless budget is per IP, $0.10/day (D-015, Q-005).
- DBLP sits behind an Anubis bot wall (dblp.org and both mirrors).
- Worst case latency: 10 fabricated citations take 6.2–7.1 s (every fallback runs; Crossref 3/s). It fits in 8.5 s; late items degrade to partial. Watch this.
- NLI: the Xenova int8 export is broken (always neutral); padding to 256 tokens made whole-abstract premises time out, so mini-batches are now length-sorted.
- Wikipedia URLs end in '.' ("Mata_v._Avianca,_Inc."), so a URL whose trimmed form is dead is retried untrimmed.

## Handoff
Built, committed (d8806d7) and gate-checked locally, all gate cases correct: Varghese → not_found/page_inside_other_case; Wakefield → retracted 2010-02-06; nature14539 → verified; wrong year → mismatch; arXiv → verified; SSRF → 422.
**S4 complete.** verify + claim are live. Claim gate (production): LeCun→supported; NEJM 'ineffective'→contradicted and '95% effective'→supported; Transformer 'recurrent'→contradicted; Wakefield→insufficient_evidence + retracted; fake Varghese→insufficient (unverified citation). Cold claim ≤5.6 s, warm 0.8–2.4 s.
Open:
1. set `AKASHI_OPENALEX_API_KEY` once the user provides it (Q-005).
