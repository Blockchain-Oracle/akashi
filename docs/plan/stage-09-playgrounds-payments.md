# S9 — Playgrounds + Pay via Pocket

**Plan:** `00-plan.md` §7 · **Open first:** specs/web.md §5–6

## Steps
- [ ] api-client from per-service OpenAPI
- [ ] /api/demo (rate limit + JSON 429)
- [ ] /play/cite
- [ ] /play/code (CodeMirror diagnostics + findings)
- [ ] /play/now
- [ ] /api/pocket proxy (allowlisted ids + sub-paths, zod before paying, 64 KiB)
- [ ] RainbowKit + x402 browser signer + receipt
- [ ] Listing flag + literature-search fallback

## Gate
Every preset OK; 429 UI; one real paid browser call → Sepolia Basescan tx; 413/unknown path rejected before 402.

## Findings

## Handoff
