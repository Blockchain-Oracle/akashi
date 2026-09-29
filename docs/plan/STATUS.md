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
> - **No CLAUDE.md or AGENTS.md.** **Autonomy (D-010):** deploys, Coolify/server config and Beta testnet txs are pre-approved — just do them and report. Confirm only destructive or real-money actions (deleting volumes/data, making the repo public, paid services, MainNet).
>
> **Gate commands:**
> - Python: `uv run ruff check . && uv run pyright`
> - JS: `pnpm lint && pnpm typecheck && pnpm build`
>
> **Tick each checkbox in the same commit as its artifact.** Record every tx and deploy in `acceptance.md` / `ids-and-txs.md`.

Current stage: **S3 code-reality-check** (starting; S2 waits for the domain)
Last commit: b728271 "S0: bootstrap Akashi repo — plan, specs, UI shortlist, workspaces"
In-flight step: S3.1 models + npm/PyPI adapters → /v1/package
Done: S0 ✅ (repo github.com/Blockchain-Oracle/akashi, private · Coolify project akashi) · S1 ✅ (api live at temp http://qbjpovbitgqrjgafdcrigqmd.84.46.247.92.sslip.io)
Blockers:
- Q-001: the domain has not been bought yet (blocks S2 from step 5)
Env readiness: pocketd ☐ · pocket-ap ☐ · OPENAI_API_KEY (from the user) ☐ · domain ☐
Next action: S3 per specs/backend.md §3.2 — read the npm/PyPI registry docs, then build akashi_code registries + /v1/package.
