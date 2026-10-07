# S13 — UI v3 "Said with confidence" (HTTPie direction) + chat, wallet and paid calls

**Plan:** approved 2026-10-06 (`~/.claude/plans/reflective-mixing-lerdorf.md`, transcribed here) · **Open first:** `specs/ui-v3-httpie.md` · D-033…D-038
Cross-cutting: finishes S7/S8/S10 visually, builds S11 (agent chat) and S9's "Pay via Pocket" with a browser wallet.

## Steps (each leaves `pnpm lint && pnpm typecheck && pnpm build` green and deployable)
- [ ] 1. Tokens v4 + fonts (Anton in, Gabarito out), shell (nav, footer, Blob / Bubble / Window), hero = centred Anton + pink tag + the desk as a dark window with exhibit chips, readout / evidence / sources on the new tokens
- [ ] 2. Story ×8 (bubbles · three service windows · relay blob band · blue band + receipt · stat cards · source circles) + docs (landing, Anton titles + breadcrumb, sidebar search field + ⌘K, footer). Deploy web + docs; 375 / 768 / 1280, light + dark
- [ ] 3. Chat, Free mode: constants, Redis chat store (+ memory fallback), guest session cookie, conversations API, tools / agent / instructions, `/api/chat`, `/agent` + `/agent/c/[id]`, Sidebar, ToolRow / ToolEvidence, Composer, Suggestions, ChatHome, NoKeyState. Deploy; 503 hint without a key; with the key the 7 suggestions stream rows, the cap trips, injected instructions are ignored
- [ ] 4. Marks + wallet + SIWE: brand marks + `Mark`, wagmi / RainbowKit behind `WalletGate`, SIWE routes, wallet pill, guest → address migration
- [ ] 5. Paid calls: portal / listing / x402 server, `/api/pocket` (listed → portal; unlisted → Akashi as x402 seller), `/api/demo`, browser pay flow, PayCard, ReceiptCard, TxInset, Pay-mode tools + continuation merge. One real paid call → Basescan Sepolia tx → acceptance row; 413 / unknown path / bad body rejected before any 402
- [ ] 6. Polish + ship: auto-title, pin, dictation mic (stretch), `.21st/design.json` v4 + `DESIGN.md`, 21st review, Lighthouse, Coolify envs + `akashi-chat-redis` recorded, STATUS / decisions / acceptance

## Inputs from the user
- a model key on akashi-web and in `apps/web/.env.local` (`AI_GATEWAY_API_KEY`, or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (Reown) as a GitHub variable; without it Pay mode offers extension wallets only
- `AKASHI_PAY_TO`: a fresh Base Sepolia EOA generated here (key in `~/.akashi-secrets`) unless the user names an address
- the domain (Q-001) still gates the relay claim tx for the submission form

## Gate
Every surface in `specs/ui-v3-httpie.md` §5 renders on the new tokens in both themes; the desk runs an exhibit end to end from inside the hero window; the docs search opens from the sidebar field and ⌘K; `/agent` shows the no-key state without a model key and streams collapsible tool rows with one; sign in with a wallet re-keys guest history; one paid call shows a Basescan tx and the Pocket registration tx on the receipt.

## Findings

## Handoff
