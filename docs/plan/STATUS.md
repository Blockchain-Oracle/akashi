# STATUS — updated 2026-10-07 16:15 UTC by Claude

> **Read order for a fresh session** (never trust memory over this file):
> 1. this file
> 2. `stage-14-tool-router.md` (the approved direction: Akashi = OpenRouter for agent tools on Pocket; first unchecked box)
> 3. the last `D-` entries in `decisions.md`
> 4. `packages/tools/CONNECTORS.md` before touching connectors; `ids-and-txs.md` for every on-chain id
>
> Then run `git status && git log --oneline -8`.
>
> **Conventions:** constants, never magic numbers (ruff PLR2004 / eslint no-magic-numbers); files ≤ 400 lines; tests are not
> deliverables (live probes instead: `uv run akashi-tools probe --provider <id>`); UI copies Monid's paint exactly for now
> (`packages/brand/tokens/paint.css`), our own name + 証 seal; no CLAUDE.md / AGENTS.md. Deploys, Coolify config and Beta
> testnet txs are pre-approved; confirm only destructive or real-money actions.
>
> **Gates:** Python `uv sync --all-packages && uv run ruff check . && uv run pyright` · JS `pnpm lint && pnpm typecheck && pnpm build`
> (per app: apps/web, apps/docs, apps/cli, services/gateway).
> **Local:** `.claude/launch.json` (repo parent) starts akashi-api :8000, akashi-gateway :8080, akashi-web :3100, akashi-docs :3200.
> Provider keys live in `akashi/.env` (gitignored, 0600): FIRECRAWL, GROQ, SERPER, JINA, OPENWEATHER, IPINFO.

## Where things are (2026-10-07 16:15 UTC)
- **Pivot (user, 2026-10-07):** the three verification services are retired (still registered on chain, never served).
  Akashi is now one Pocket service, `tool-router`, in front of 80 tool endpoints from 33 providers (Open-Meteo, OpenStreetMap, CoinGecko and
  Google News added 2026-10-07 under D-039).
- **Live end to end on temporary sslip.io hosts** (the domain is not a blocker, user 2026-10-07): agent → gateway (x402)
  → pocket-ap → RelayMiner → api. First relayed paid run 15:57 UTC; every id and tx is in `ids-and-txs.md`.
- **On chain (Beta):** `tool-router` registered (A96AAAB2…, h711952) · app stake (113EFC51…, h712014; re-staked 1,150 POKT 9986F963…, h712567) · supplier stake
  (E8997D51…, h712494, active 712501, endpoint https://relay.84.46.247.92.sslip.io) · **first claim AC215AB4… (h712535)
  + proof 6729C253… (h712544)**, settlement due at the end of the proof window — **settled 16:14:50 UTC; Service Audit A1–A9 PASS 16:15** (`audits/2026-10-07-tool-router.json`).
- **Hosts:** gateway https://mwivqpuwa5rpwtrxpwjc1j0w.84.46.247.92.sslip.io · web https://uaydz8sozk7g4fgbqr49rj2a.84.46.247.92.sslip.io
  · docs https://k7ds7ucqsnaxw5lorj8a9buu.84.46.247.92.sslip.io · relay https://relay.84.46.247.92.sslip.io.
- **Backend:** `packages/tools` (framework + connectors), `services/api` (tool-router FastAPI), `services/gateway`
  (Hono + @x402/hono seller; per-endpoint exact prices; settles only on < 400; settlements queued one at a time with a
  retry on the facilitator's nonce race, `serial-facilitator.ts`; pocket-ap relay with labelled direct fallback).
- **Web:** Monid paint landing, /tools, /tools/[provider] + endpoint dialog, /SKILL.md, /llms.txt, /agent chat
  (AI SDK 7; find_tools / inspect_tool / run_tool; demo-credit payer on the server; wallet mode = inline x402 pay card
  with RainbowKit on Base Sepolia; receipts; Redis history). Demo payer is funded (Circle faucet, user).
- **CLI / local MCP:** `apps/cli` → one bundle `akashi.mjs` (served from the web at /akashi.mjs).
- **Chat model:** Groq free tier (8k tokens/min per model) as fallback; a stronger key is optional.
- **Lessons today:** on Coolify's shared network a compose service named `redis` also resolves to `coolify-redis` →
  the RelayMiner Redis is `pocket-relay-redis`. The public x402 facilitator races its own nonce on parallel settlements. Settled claims are paid from the **app
  stake**: an app at exactly min_stake is unstaked by its first settled relay (re-staked at 1,150 POKT, h712567).

## Blockers (user)
1. Namecheap top-up ($2) → register useakashi.xyz → DNS @, api, docs, relay → 84.46.247.92 (then re-stake + re-publish
   the card on the domain, gas only).
2. Before submitting: OK to make the repo public.

## Next actions
Health probe scheduled task → README + submission text + demo script →
domain cut-over when the user tops up.
