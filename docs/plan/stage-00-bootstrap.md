# S0 — Bootstrap

**Plan:** `00-plan.md` §7 · **Open first:** specs/*, 00-plan §4

## Steps
- [x] Delete portnetwork/CLAUDE.md; save the no-CLAUDE.md preference to memory
- [x] Transcribe specs/backend.md, specs/deploy-runbook.md, specs/web.md and 00-plan.md
- [x] Copy the 21st research into specs/ui-shortlist/ (catalog.json, sheets, picks.md)
- [x] git init; .gitignore; uv workspace (core/cite/code/now/api/worker skeletons); pnpm + turbo root
- [x] STATUS.md (read order), decisions.md, acceptance.md, ids-and-txs.md, stage files
- [x] Install Pocket's Service Builder skill into Claude Code (~/.claude/skills)
- [x] [OK?] Create the private GitHub repo + push (Blockchain-Oracle/akashi, user OK 2026-09-29)
- [x] [OK?] Create the Coolify project `akashi` + deploy key (user OK 2026-09-29)

## Gate
`uv sync` and `pnpm install` succeed; plan files committed.

## Findings
- `coolify project create` returned 422 on a description containing 証 (non-ASCII). Use an ASCII description.
- The deploy key was generated in the session scratchpad and deleted after upload; the private half lives only in Coolify.

## Handoff
- S0 complete. Next: S1 core backend (`specs/backend.md` §1–2, §9 Core).
