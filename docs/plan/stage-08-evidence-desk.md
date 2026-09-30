# S8 — Evidence desk + story

**Plan:** `00-plan.md` §7 · **Open first:** 00-plan §2b, specs/web.md §3–4, ui-shortlist/picks.md

## Steps
- [ ] 21st add shortlist picks in batches → re-tokenize → components/evidence kit
- [x] Desk input + detector + override tabs + example chips
- [ ] route.ts ✅ (deterministic + plain-question intents, no model needed) · Now LLM router (needs a model key) · ambiguity picker
- [x] /api/desk NDJSON fan-out (per-IP demo limit 20/h in memory)
- [ ] Task-Steps trace, evidence cards, source rail, verdict stack, all states
- [x] Story sections below the fold
- [ ] Breakpoint decisions recorded in design.json

## Gate
Every chip routes and lands its verdict; 21st review clean; Lighthouse mobile ≥90/100/95/100; keyboard + reduced motion; screenshots at 375/768/1280 light+dark reviewed with the user.

## Findings
- First slice live: hero + desk (auto-growing input, live detection, Auto/Cite/Code/Now, byte counter, ⌘↵ / ⌘K / Esc),
  6 real example chips, NDJSON fan-out, trace, verdict summary, evidence cards (citation, snippet with gutter
  markers, package, fx/time/weather/stock/fact, lists), source rail. All six chips land their verdicts.
- Routing bugs found by the chips: a DOI's parentheses tripped the code heuristic (identifiers now win first); the
  list-marker stripper ate "10." from a DOI (markers now need a following space).
- Story below the desk (2026-09-30): sourced failure numbers (21st Number Ticker 19063, counts once in view), the
  plain four steps, the Pocket request path, the services ledger, the envelope, the price receipt (21st Receipt Tiers
  29978 "Straight", one slip, masked torn edge, the only drop shadow via `--receipt-drop`) and the on-chain registration.
  The diagrams now live in `packages/ui` (`@akashi/ui/diagrams/*`), shared by web and docs, with their keyframes in
  `@akashi/ui/diagrams.css`; brand utilities (`bg-card`, `text-primary`…) instead of Fumadocs' `fd-*` ones.
- Not in the story yet: the logo cloud (§3 row 6) and the MCP-config CTA (§3 row 7). The CTA waits for the portal
  listing (needs the domain, Q-001); it links to the docs instead.
- `/docs/*` on the web host now redirects to `<docs>/docs/*` (it dropped the `/docs` segment before).
- Still to do: the kind picker for unmatched questions, Lighthouse, design.json decisions, 375/768/1280 screenshots
  with the user.

## Handoff
