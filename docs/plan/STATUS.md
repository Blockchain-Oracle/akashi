# STATUS — updated 2026-09-30 by Claude

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
> - Python: `uv sync --all-packages` (a plain `uv sync` prunes the workspace members!) then `uv run ruff check . && uv run pyright`
> - JS: `pnpm lint && pnpm typecheck && pnpm build`
>
> **Deploys:** a deploy is done only when the container is **healthy** and a real request passes (`deploy-verify` pattern: build finished → `docker inspect` health → smoke request). Coolify "finished" is not enough (see acceptance.md 2026-09-29 15:05).
>
> **Tick each checkbox in the same commit as its artifact.** Record every tx and deploy in `acceptance.md` / `ids-and-txs.md`.

Current stage: **S7 web foundation** — scaffold, brand, 21st context, env done; Dockerfile + GHCR workflow written, image builds unverified at handoff, Coolify resources pending Q-007
Last commit: see `git log -1` (S6 + S2 steps 1–4, 2026-09-30)
In-flight step: S7 step 5 (verify the two image builds locally, push, watch the images workflow, then Q-007 → Coolify Docker Image resources). Blocked on the domain (Q-001) for S2 step 5+ and the rest of S6.
Done: S6 (partial) schemathesis PASS ×3, calibration 40/40·40/40, cards v1 on-chain (h 691097–9), registry packages + sage-service.yaml built · S2 steps 1–4 ✅ · S5 ✅ (stocks live 2026-09-30, flagged demo, D-023) · S0 ✅ · S4 ✅ citation-verify live (verify + claim; calibration 40/40 · 40/40; NLI sidecar) · S3 ✅ code-reality-check live (package/packages/versions/symbol/symbols/check) · (repo github.com/Blockchain-Oracle/akashi, private · Coolify project akashi) · S1 ✅ (api live at temp http://qbjpovbitgqrjgafdcrigqmd.84.46.247.92.sslip.io)
Blockers:
- Q-001: the domain has not been bought yet (blocks S2 from step 5)
Env readiness: pocketd 0.1.35 ✅ · pocket-ap 0.1.2 ✅ · keys ✅ (mnemonics in ~/.akashi-secrets → user's password manager ☐) · OPENAI_API_KEY (from the user) ☐ · domain ☐
Next action: when the domain exists: DNS (relay-beta, api, web, docs) → api domain in Coolify → `render_cards.py` + add-service (gas only) → S2 step 6 onward (supplier keys file, pocket compose, stake) → audit → build_registry.py → send packages (Q-003). Without the domain: S7 web foundation can start.
