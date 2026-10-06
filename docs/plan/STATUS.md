# STATUS — updated 2026-10-06 by Claude

> **Read order for a fresh session** (never trust memory over this file):
> 1. this file
> 2. the current `stage-NN-*.md` (first unchecked box + `## Handoff`)
> 3. the last 10 `D-` entries and every open `Q-` in `decisions.md`
> 4. only the `specs/*` sections the stage names (`00-plan.md` is the approved plan, verbatim; **`specs/ui-revamp.md` is the visual spec and supersedes `web.md` §2–§4, §8**)
>
> Then run `git status && git log --oneline -5`.
>
> **Conventions:**
> - Constants, never magic numbers (ruff `PLR2004`); files ≤ 400 lines; reusable modules.
> - **Tests are not deliverables**: integration checks only.
> - UI: "The Highlighter" system in `specs/ui-revamp.md` + `apps/web/.21st/design.json` (v3). Refero research before any new surface; 21st.dev components read and re-tokenized. Read the official docs (Context7) before using a library.
> - **No CLAUDE.md or AGENTS.md.** **Autonomy (D-010):** deploys, Coolify/server config and Beta testnet txs are pre-approved — just do them and report. Confirm only destructive or real-money actions (deleting volumes/data, making the repo public, paid services, MainNet).
>
> **Gate commands:**
> - Python: `uv sync --all-packages` (a plain `uv sync` prunes the workspace members!) then `uv run ruff check . && uv run pyright`
> - JS: `pnpm lint && pnpm typecheck && pnpm build`
> - Local web/docs against the live API: `apps/{web,docs}/.env.local` (gitignored) point `AKASHI_API_URL` / `NEXT_PUBLIC_API_URL` at the api host; `.claude/launch.json` (repo parent) starts `akashi-web` :3100 and `akashi-docs` :3200.
>
> **Deploys:** a deploy is done only when the container is **healthy** and a real request passes (`deploy-verify` pattern: build finished → `docker inspect` health → smoke request). Coolify "finished" is not enough (see acceptance.md 2026-09-29 15:05). Web + docs images are built by `.github/workflows/images.yml` on push to main (tags `sha-<short>` and `main`), then `coolify deploy uuid <uuid>` (web `uaydz8sozk7g4fgbqr49rj2a`, docs `k7ds7ucqsnaxw5lorj8a9buu`; the dashboard needs `ssh -f -N -L 8001:localhost:8000 agari-box`).
>
> **Tick each checkbox in the same commit as its artifact.** Record every tx and deploy in `acceptance.md` / `ids-and-txs.md`.

Current stage: **UI revamp v2 "The Highlighter" (cross-cutting S7/S8/S10) — built, deploying**. See D-028…D-031 and `specs/ui-revamp.md`.
Last commit: see `git log -1`
In-flight step: push → GHCR images → `coolify deploy` web + docs → verify on the sslip hosts → acceptance row.
Done today (2026-10-06): a first pass ("the ledger": grey, serif, 2 px) was built and rejected by the user; the user's reference (cdrkit.xyz) set the energy → Refero research (Superthread, Val Town, Aaply, PostHog, Convex) → v2: tokens v3 (`packages/brand/tokens/theme.css`: cool white canvas, midnight ink, lemon marker, cobalt links, Deep-Midnight `.console`, radii 10/16/20, three shadows; `.card .well .pill .btn .eyebrow-bar .label .key`), fonts Gabarito / Instrument Sans / Geist Mono · web: hero (pills, marker stroke, lemon + black CTAs, ✦ facts), the desk as a code card, exhibits as chips, Deep-Midnight readout, evidence cards with pill verdicts, sources card, story bands (stat cards, lemon-badged steps, the Pocket band, service cards, envelope, receipt, registration), header with lemon Docs CTA, footer, not-found/error · docs: landing rewritten, Fumadocs re-tokened, Gabarito titles · packages/ui diagrams on `.card` · `.21st/design.json` v3 + `DESIGN.md` · lint/typecheck/build green (web + docs), 21st review 0 findings · checked in the browser at 375 / ~600 px, light + dark: desk, exhibits, readout, evidence, story, docs landing and pages.
Before today: S6 (partial) schemathesis PASS ×3, calibration 40/40·40/40, cards v1 on-chain (h 691097–9), registry packages + sage-service.yaml built · S2 steps 1–4 ✅ · S5 ✅ (stocks live, flagged demo, D-023) · S0 ✅ · S4 ✅ citation-verify live · S3 ✅ code-reality-check live · S1 ✅ api live · S7 ✅ web + docs live on HTTPS (temp sslip hosts) · S8 desk live.
Blockers:
- Q-001: the domain has not been bought yet (blocks S2 from step 5: DNS, relayer, supplier stake → no claim tx yet → the submission form's "test transaction ID" is still missing). Fallback if the domain slips: run the relayer on a temporary host now, re-stake on the domain later.
Known issues (backend, measured 2026-10-06 while checking the UI):
- **The API is slow on first calls today:** citation-verify Varghese cold 8.7 s then 0.76 s warm; `/code/v1/check` for the axios snippet **10.7 s**, past its 7 s hard stop (the web shows "Akashi did not answer in time" after 8.5 s); live-facts cold 11.6 s then 1.1 s. The 09-30 latency gate measured cite cold p95 1.25 s, so this is new: investigate host load (CPU steal / memory on the Contabo box), and why the snippet path overruns its deadline (sequential package → symbol phases; ts-introspect cold build cap 5 s). A judge's first click may hit it.
Env readiness: pocketd 0.1.35 ✅ · pocket-ap 0.1.2 ✅ · keys ✅ (mnemonics in ~/.akashi-secrets → user's password manager ☐) · OPENAI_API_KEY (from the user) ☐ · domain ☐
Next action: finish the revamp deploy (above) → fix the API's cold-start/deadline overrun (S6 latency item) → then, without the domain: S9 playgrounds + Pay via Pocket on the new system (`/play/*` follow `specs/ui-revamp.md`: cards, console, pills); with the domain: S2 step 5 onward (DNS → relayer → stake → relays → claim txs) → audit → registry → organizers (Q-003). Optional polish not yet done: `opengraph-image.tsx`, Lighthouse.
