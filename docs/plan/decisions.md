# Decisions (D-###) and open questions (Q-###)

Format: date · decision · evidence · consequence · approved by

- **D-001** 2026-09-29 · Brand **Akashi 証**. Capability service IDs `citation-verify`, `code-reality-check`, `live-facts` (Pocket naming guidance), all free on Beta and Main via `check_service_id` · user.
- **D-002** 2026-09-29 · One brand, three services, one supplier, one repo; three separate form submissions · user.
- **D-003** 2026-09-29 · Priority is winning, not earning. Free data sources only (no paid plans); stocks demo-grade behind a flag · user.
- **D-004** 2026-09-29 · Hosting on the user's Coolify (4.3.23, Contabo). The web image is built in GitHub Actions, not on the box · user + research.
- **D-005** 2026-09-29 · Stack: Python 3.13 FastAPI backend + ts-introspect Node sidecar (TS 6.0.3) + Next.js 16 web + fumadocs docs app · plan.
- **D-006** 2026-09-29 · UI direction **"Evidence desk"** (product-first, light default). 21st components from the visual shortlist (`specs/ui-shortlist/picks.md`) · user.
- **D-007** 2026-09-29 · LLM via stocklana's `resolveModel` (OpenAI key; AI Gateway fallback) · user.
- **D-008** 2026-09-29 · CUPR: citation-verify 40,000 · code-reality-check 20,000 · live-facts 10,000 (under the Beta p95 of 50k) · runbook.
- **D-009** 2026-09-29 · No CLAUDE.md or AGENTS.md; `agentRules: false` · user.

## Open questions
- **Q-001** Domain name: the user is buying one. Blocks S2 step 5 onward (DNS, relayer URL, supplier stake).
- ~~Q-002~~ resolved: repo Blockchain-Oracle/akashi (private); Coolify project `akashi` created.
- **Q-003** (for organizers, asked in S2) staging app = test.agent.pocket.network? · how Beta services get listed · gateway delegation · test tx = claim tx? · one endpoint for 3 submissions OK?
- **Q-004** Licences to confirm: CourtListener bulk, Retraction Watch data.
