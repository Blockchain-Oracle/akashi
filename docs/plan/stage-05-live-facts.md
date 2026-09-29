# S5 — live-facts + worker

**Plan:** `00-plan.md` §7 · **Open first:** specs/backend.md §3.3, §5

## Steps
- [x] Time: pinned tzdata 2026d, zone/city/country/Wikidata-geocode resolution, next transition, live IANA version check (no worker job needed)
- [x] Holidays (python-holidays × Nager.Date × OpenHolidays, per-date listed_by + agreement) + business days (market calendars, country weekends)
- [x] FX: issuers first, independence rules, cadence-aware freshness, 1-business-day consensus window, issuer headline, ECB XML fallback
- [x] Weather: met.no (Expires-honouring cache) × NWS in the US + alerts; °C agreement
- [x] Wikidata facts: entity JSON (no SPARQL), preferred rank / end time / latest point-in-time, label fallback en→mul→enwiki
- [ ] News (GDELT ingest + HN)
- [ ] Stocks (flag, demo label)
- [ ] Jobs index
- [ ] Probe + schema

## Gate
Casablanca +00:00 (tzdb 2026d); Edmonton 2026-11-15 −06; USD→EUR ECB/FRED/BOC with FRED stale; NYSE≠federal; memory under 20 concurrent within limits.

## Findings
- **Inuvik:** tzdb 2026d says −07 on 2026-11-15 (−06 from 2027-03-14). The gate's "−06" assumed NWT followed Alberta; Akashi follows tzdb. Edmonton −06 CST, Vancouver −07 MST, Casablanca +00 (no transition in the next 2 years) all ✓.
- **FX:** FRED H.10 is a *weekly* publisher, so its 09-25 fixing is `lagging`, not stale; it is listed, not averaged in. Eurozone national banks republish the ECB fixing to the digit, and IMF/BIS have no country (aggregators): both are excluded as independent sources. Issuer detection is `currency[:2] == country_code` (ECB = "EU"); pivot currency is not issuer (BOJ pivots on USD). USD→NGN honestly shows `conflict` (Gambia's central bank publishes about 9% off). USD→EUR gate: ECB/BOE/BOC agree within 0.13%, FRED lagging ✓.
- **Holidays:** US 07-03 observed is agreed by both sources; NYSE adds Good Friday, while federal adds 07-04, Columbus and Veterans ✓; DE-BY shows Augsburg's Peace Festival as local_only and Assumption as openholidays-only → minor_diff ✓. OpenHolidays covers 36 countries (no US).
- **Wikidata:** Q22686 currently has **no English label** (so the SPARQL label service returns the QID); labels fall back en → mul → enwiki title. Search ranks "University of Chicago" above Chicago, so exact-label hits go first. Country ISO codes come from a bundled QID→P297 table (2 calls instead of 3). The geocode cache key is versioned (`geocode-r2`) because wrong answers otherwise live 30 days.
- **Weather:** NYC met.no 21.4 °C vs NWS 21.1 °C → agree; Berlin → single_source (NWS not_applicable) ✓.

## Handoff
