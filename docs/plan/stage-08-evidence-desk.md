# S8 — Evidence desk + story

**Plan:** `00-plan.md` §7 · **Open first:** 00-plan §2b, specs/web.md §3–4, ui-shortlist/picks.md

## Steps
- [ ] 21st add shortlist picks in batches → re-tokenize → components/evidence kit
- [x] Desk input + detector + override tabs + example chips
- [ ] route.ts ✅ (deterministic + plain-question intents, no model needed) · Now LLM router (needs a model key) · ambiguity picker
- [x] /api/desk NDJSON fan-out (per-IP demo limit 20/h in memory)
- [ ] Task-Steps trace, evidence cards, source rail, verdict stack, all states
- [ ] Story sections below the fold
- [ ] Breakpoint decisions recorded in design.json

## Gate
Every chip routes and lands its verdict; 21st review clean; Lighthouse mobile ≥90/100/95/100; keyboard + reduced motion; screenshots at 375/768/1280 light+dark reviewed with the user.

## Findings
- First slice live: hero + desk (auto-growing input, live detection, Auto/Cite/Code/Now, byte counter, ⌘↵ / ⌘K / Esc),
  6 real example chips, NDJSON fan-out, trace, verdict summary, evidence cards (citation, snippet with gutter
  markers, package, fx/time/weather/stock/fact, lists), source rail. All six chips land their verdicts.
- Routing bugs found by the chips: a DOI's parentheses tripped the code heuristic (identifiers now win first); the
  list-marker stripper ate "10." from a DOI (markers now need a following space).
- Still to do: story sections below the fold, the kind picker for unmatched questions, mobile/dark passes,
  Lighthouse, design.json decisions.

## Handoff
