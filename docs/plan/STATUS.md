# STATUS — updated 2026-09-29 by Claude (planning session)

> **Read order for a fresh session** (never trust memory over this file):
> 1. this file
> 2. the current `stage-NN-*.md` (first unchecked box + `## Handoff`)
> 3. the last 10 `D-` entries and every open `Q-` in `decisions.md`
> 4. only the `specs/*` sections the stage names (`00-plan.md` is the approved plan, verbatim)
>
> Then run `git status && git log --oneline -5`.
>
> **Conventions:**
> - Constants, never magic numbers (ruff `PLR2004`); files ≤ 400 lines; reusable modules.
> - **Tests are not deliverables**: integration checks only.
> - UI comes from 21st.dev components, re-tokenized. Read the official docs (Context7) before using a library.
> - **No CLAUDE.md or AGENTS.md.** Every step that spends POKT or changes the server needs the user's explicit OK.
>
> **Gate commands:**
> - Python: `uv run ruff check . && uv run pyright`
> - JS: `pnpm lint && pnpm typecheck && pnpm build`
>
> **Tick each checkbox in the same commit as its artifact.** Record every tx and deploy in `acceptance.md` / `ids-and-txs.md`.

Current stage: **S1 Core backend** (starting)
Last commit: b728271 "S0: bootstrap Akashi repo — plan, specs, UI shortlist, workspaces"
In-flight step: S1.1 constants + settings
Done: S0 ✅ (repo github.com/Blockchain-Oracle/akashi, private · Coolify project akashi)
Blockers:
- Q-001: the domain has not been bought yet (blocks S2 from step 5)
Env readiness: pocketd ☐ · pocket-ap ☐ · OPENAI_API_KEY (from the user) ☐ · domain ☐
Next action: S1 — read FastAPI/httpx2/cashews/pydantic-settings docs (Context7), then build packages/core per specs/backend.md §2.
