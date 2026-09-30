# S5 — live-facts + worker

**Plan:** `00-plan.md` §7 · **Open first:** specs/backend.md §3.3, §5

## Steps
- [x] Time: pinned tzdata 2026d, zone/city/country/Wikidata-geocode resolution, next transition, live IANA version check (no worker job needed)
- [x] Holidays (python-holidays × Nager.Date × OpenHolidays, per-date listed_by + agreement) + business days (market calendars, country weekends)
- [x] FX: issuers first, independence rules, cadence-aware freshness, 1-business-day consensus window, issuer headline, ECB XML fallback
- [x] Weather: met.no (Expires-honouring cache) × NWS in the US + alerts; °C agreement
- [x] Wikidata facts: entity JSON (no SPARQL), preferred rank / end time / latest point-in-time, label fallback en→mul→enwiki
- [x] News: GDELT GKG → news.db via the `akashi-task gdelt` scheduled task + live HN, interleaved/de-duplicated (D-018, D-019)
- [x] Stocks (flag `AKASHI_STOCKS_ENABLED`, demo label): tickers checked against Massive's all-market grouped daily, live quote from Twelve Data (batch, per-symbol credits), last official close cross-checked, NYSE clock with early closes, did-you-mean from the listings + SEC names; Massive close as the fallback when Twelve Data is out of credits (D-023)
- [x] Jobs index: 89 verified ATS boards → jobs.db (`akashi-task jobs`, 6 h); query/company/location/remote/salary/currency/recency filters
- [x] Probe (Casablanca +00:00) + schema: 8/8 live bodies validate against cards/live-facts/output-schema.json; memory gate with 20 concurrent: api 137 MiB/768, nli 1.23 GiB/1.76, ts 93 MiB/512

## Gate
Casablanca +00:00 (tzdb 2026d); Edmonton 2026-11-15 −06; USD→EUR ECB/FRED/BOC with FRED stale; NYSE≠federal; memory under 20 concurrent within limits.

## Findings
- **Inuvik:** tzdb 2026d says −07 on 2026-11-15 (−06 from 2027-03-14). The gate's "−06" assumed NWT followed Alberta; Akashi follows tzdb. Edmonton −06 CST, Vancouver −07 MST, Casablanca +00 (no transition in the next 2 years) all ✓.
- **FX:** FRED H.10 is a *weekly* publisher, so its 09-25 fixing is `lagging`, not stale; it is listed, not averaged in. Eurozone national banks republish the ECB fixing to the digit, and IMF/BIS have no country (aggregators): both are excluded as independent sources. Issuer detection is `currency[:2] == country_code` (ECB = "EU"); pivot currency is not issuer (BOJ pivots on USD). USD→NGN honestly shows `conflict` (Gambia's central bank publishes about 9% off). USD→EUR gate: ECB/BOE/BOC agree within 0.13%, FRED lagging ✓.
- **Holidays:** US 07-03 observed is agreed by both sources; NYSE adds Good Friday, while federal adds 07-04, Columbus and Veterans ✓; DE-BY shows Augsburg's Peace Festival as local_only and Assumption as openholidays-only → minor_diff ✓. OpenHolidays covers 36 countries (no US).
- **Wikidata:** Q22686 currently has **no English label** (so the SPARQL label service returns the QID); labels fall back en → mul → enwiki title. Search ranks "University of Chicago" above Chicago, so exact-label hits go first. Country ISO codes come from a bundled QID→P297 table (2 calls instead of 3). The geocode cache key is versioned (`geocode-r2`) because wrong answers otherwise live 30 days.
- **News/jobs:** the GDELT DOC API is unusable live (D-019). Jobs salary parsing: "CA$215K" is CAD (it was once read as USD). A load test found unbounded slot waits (D-020).
- **Weather:** NYC met.no 21.4 °C vs NWS 21.1 °C → agree; Berlin → single_source (NWS not_applicable) ✓.
- **Stocks:** Twelve Data answers the typo `APPLX` with *Appleseed Fund Investor Share*, last priced 2026-01-27, and no
  error, so a ticker must be checked before it is quoted. The SEC list has no ETFs (QQQ, VOO missing) and writes BRK-B;
  Massive's grouped daily (one call, 430 KB, 12,605 US tickers incl. ETFs, BRK.B) is the checklist and the second close.
  AAPL/BRK.B/SPY/NVDA/TSLA/AMZN/GOOGL/META closes for 2026-09-29: Twelve Data = Massive to the cent. The SEC answers 403
  to a User-Agent containing a URL (ours has the repo link), so its client sends `akashi/1.0 (mailto:…)`. A Twelve Data
  batch of 5 costs 5 of the 8 credits a minute; a retry is billed again, so Twelve Data gets one attempt (3 s).

## Handoff
Everything in S5 is live at http://qbjpovbitgqrjgafdcrigqmd.84.46.247.92.sslip.io/now/v1/{time,holidays,business-days,fx,weather,fact,news,stocks,jobs}. The scheduled tasks gdelt-ingest and jobs-ingest are active (see ids-and-txs). Stocks is built and flagged on (D-023). Next stage: S6 hardening + portal package (S2 still blocked on the domain).
