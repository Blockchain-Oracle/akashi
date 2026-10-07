# STATUS — updated 2026-10-07 (afternoon) by Claude

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

## Where things are (2026-10-07)
- **Pivot (user, 2026-10-07):** the three verification services are retired (still registered on chain, never served).
  Akashi is now one Pocket service, `tool-router`, in front of ~70 tool endpoints from ~30 providers.
- **On chain (Beta):** `tool-router` registered (A96AAAB2…, h711952, CUPR 20000, card byte-identical); app stake for
  tool-router (113EFC51…, h712014). **Supplier stake + RelayMiner + relays + claim: blocked on the domain.**
- **Domain:** user chose `useakashi.xyz` ($2). Namecheap balance was $0.00, so registration is pending the user's top-up.
  Namecheap API only works through the VPS: see memory `namecheap-via-vps` (SOCKS tunnel to agari-box).
- **Backend:** `packages/tools` (framework + connectors), `services/api` (tool-router FastAPI), `services/gateway`
  (Hono + @x402/hono seller; per-endpoint exact prices; settles only on < 400; pocket-ap relay with labelled direct
  fallback; reloads the catalog every minute).
- **Web:** Monid paint landing, /tools, /tools/[provider] + endpoint dialog, /SKILL.md, /llms.txt, /agent chat
  (AI SDK 7; find_tools / inspect_tool / run_tool; demo-credit payer on the server; wallet mode = inline x402 pay card
  with RainbowKit on Base Sepolia; receipts; Redis history).
- **CLI / local MCP:** `apps/cli` → one bundle `akashi.mjs` (served from the web at /akashi.mjs).
- **Wallets (Base Sepolia):** payTo 0x8164dabAfc824322221654ED421715FdaA66948D · demo payer
  0xF2A2eD6Fc57e32A6DC5A6F371ED8996AC30f9ebA (keys in `~/.akashi-secrets/*-base-sepolia.json`). **Demo payer needs Circle
  faucet USDC (user, CAPTCHA).**
- **Chat model:** Groq free tier (8k tokens/min per model) as fallback; ask the user for AI Gateway / Anthropic / OpenAI.

## Blockers (user)
1. Namecheap top-up ($2) → register useakashi.xyz → DNS @, api, docs, relay → 84.46.247.92.
2. Circle faucet USDC to the demo payer (and the user's own browser wallet for wallet mode).
3. A chat model key (optional but strongly recommended).
4. Exa / Firecrawl consent emails (drafts to write).

## Next actions
Domain → `deploy/pocket` RelayMiner on Coolify (relay.useakashi.xyz) → supplier stake (`deploy/pocket/supplier-stake.yaml`)
→ gateway + pocket-ap on Coolify (api.useakashi.xyz) → web/docs on the domain → first paid run → relays → claim tx →
audit → README + submission text + demo script.
