# citation-verify calibration

`real.txt` holds 40 real references across CS/ML, biology, medicine, economics, psychology and statistics, in APA and
Vancouver styles, some with "et al.". `fake.txt` holds 40 fabricated references written the way LLMs invent them: a
plausible journal, plausible authors, and some real famous authors with an invented title. Run:

    uv run python packages/cite/calibration/run.py

Pass criteria:
- a real reference is never `not_found` (that would call a real citation fake);
- a fabricated one is never `verified` or `mismatch`.

## Results

| Date (UTC) | Real (40) | Fake (40) | Notes |
|---|---|---|---|
| 2026-09-29 (dev Mac) | 39 verified, 1 unverifiable | 40 not_found | OpenAlex keyless budget exhausted. The one unverifiable (Srivastava 2014, JMLR, no DOI) is only indexed by OpenAlex. |
| 2026-09-29 (production, via API) | **40 verified** | **40 not_found** | Batches of 10: real 3.3–4.6 s; fabricated 6.2–7.1 s (each fake runs every fallback, and Crossref allows 3/s). |

## What calibration changed (each item was a failure in an earlier run)

- **No fixed floor on Crossref's `score`.** It scales with query length: the right paper scored 26.8 on a short
  structured query and 65.9 on a full reference string. Our 0–1 composite decides instead.
- **Raw-mode titles are compared per segment, never against the whole string.** `token_set_ratio(title, raw)` is
  100 whenever the record title is a subset of the reference. A record titled "JAMA Pediatrics" "verified" a fake.
- **Only work-level records are candidates.** No journals, issues, peer reviews, correction or retraction notices,
  annual indexes ("2016 IndexIEEE Transactions…", glued as in the source), or "publication information" pages.
- **The year comes from its position in the citation style:** APA `(1997)`, Vancouver `1968;`. Before this, the
  pages `1735-1780` were read as the year 1780.
- **Authors are the ones the reference lists.** "Kaplan J, et al." checks that Kaplan is an author; it does not
  demand coverage of all 31.
- **Preprints get year and venue slack.** arXiv 2014 cited as ICLR 2015, or arXiv 2012 cited as JMLR 2011; the
  venue "arXiv" differs from "NeurIPS". arXiv DOIs (10.48550) are preprints even when DataCite types them "Text".
- **A title that disagrees is a different work.** A real author with an invented title is `not_found`, not
  `mismatch`. `mismatch` always carries a blocking diff (year, first author, …).
- **`not_found` only after a complete search:** Crossref plus at least one fallback (Crossref title+author, DataCite
  arXiv exact-phrase, OpenAlex). If the fallbacks cannot answer, the result is `unverifiable` and retryable.
- **Crossref's polite pool is 3 req/s** (`x-rate-limit-limit: 3`, read from its headers). Our limiter waits for a slot
  instead of failing. After a 429 we back off for as long as `Retry-After` says (OpenAlex's daily budget), capped at
  15 minutes.
