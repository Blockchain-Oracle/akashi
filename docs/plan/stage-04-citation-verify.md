# S4 — citation-verify

**Plan:** `00-plan.md` §7 · **Open first:** specs/backend.md §3.1, §9 cite

## Steps
- [ ] Input router (idutils, eyecite, ';' split)
- [ ] DOI handle + RA + Crossref/DataCite + field diff
- [ ] Retraction overlay + Retraction Watch DB job
- [ ] Crossref biblio scoring + OpenAlex fallback + PubMed ecitmatch
- [ ] eyecite + legal.db (Mac build; [OK?] upload after df -h) + CAP
- [ ] Web: SSRF fetch + Wayback + citation_doi
- [ ] NLI /claim (int8 ONNX) + int8 vs fp32 check on ~50 pairs
- [ ] Deadlines/partials, calibration (~40 real/~40 fake), schema, probe

## Gate
Varghese→not_found; Wakefield→retracted 2010-02-06; nature14539→verified (wrong year→mismatch); arXiv 1706.03762→verified; 3 NLI pairs; SSRF 169.254.169.254→422.

## Findings

## Handoff
