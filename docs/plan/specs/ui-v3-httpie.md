# Spec — UI v3 (2026-10-06): "Said with confidence" (the HTTPie direction)

> Supersedes the visual parts of `ui-revamp.md` (v2 "The Highlighter") and `web.md` §2–§4, §8. Routes, data and
> payments in `web.md` still hold. The user's brief: "the design I want is HTTPie's" (httpie.io, light mode), use its
> other screens (docs, privacy, about, AI) from Refero, be creative with the hero, make the docs search obvious, and
> build the agent chat so tool calls drop down while the model thinks. Research method: `refero-design` skill.

## 1. Research (Refero, 2026-10-06)
**Site 540 httpie.io**, 11 screens read in full: home (user's attachment) · `/cli` a57b5684 · `/docs/cli/main-features`
7ad568be · `/docs/desktop/*` 73171f5c, 02fe4596 · `/about` ea4f5a0a · `/privacy` 4bccac41 · `/terms` 126e4443 · `/ai`
a526aedd (pink "chat" tag) · `/ai` dark 8a695e2d · `/app` AI modal cc58581b.
**HTTPie's own stylesheet** (fetched): fonts `Pie Headline` = FK Screamer Bold (fallback Impact), `Pie Body` = PolyPie
(PolySans) 300/400/600, `Pie Monospace` = PolyPie SlimMono; colours `#73dc8c` green, `#fa9bfa` pink, `#426bd1` blue,
`#262222` ink; canvas sampled `#f6f6f2`; footer band blue ≈ `#4a78e6`; footer grey ≈ `#d9d9d4`.
**Chat references:** Factory.ai session 25a3e885 (collapsible "Thinking… / View Folder / git status" rows with a
chevron), Parallel Chat API 460a871f (user bubble dark pill, answer + numbered sources), Washington Post assistant flow
11195 (greeting + suggestion chips → "checking our sources…" → answer with a Sources control).
**Docs search references:** Appwrite 886a3259 (search as a wide centred field in the nav, ⌘K), Parallel docs
70112ca9 (centred dialog with highlighted results), 1Password 51ef8034 (grouped results, shortcut footer).
**Open fonts matched:** Anton (OFL; the Impact-genre face closest to FK Screamer; HTTPie falls back to Impact itself)
for the H1 only. Body stays Instrument Sans (a neutral grotesque like PolySans), data stays Geist Mono.

## 2. Reference lock
```
Primary: httpie.io light — a warm cream canvas (#f6f6f2), warm near-black ink (#262222), three playful accents
  (green / pink / blue) used with conviction, a heavy condensed UPPERCASE display face for the H1 only, soft
  blobs behind dark product windows, speech-bubble cards with a tail, pill buttons (green primary, black
  secondary, plain link tertiary), a full-bleed blue community band, a grey footer with a theme switch.
Preserve: (1) cream + warm ink; (2) Anton uppercase H1 at 72–112 px, body headings in the grotesque;
  (3) the hero = dark windows over a green blob LEFT, headline RIGHT; (4) speech bubbles with tails in the
  three accents; (5) green / black / link button trio; (6) the blue band + grey footer; (7) flat surfaces,
  one soft window shadow, radii 12 / 20 / 28 and 999 pills.
Borrow only: Factory.ai → collapsible tool-call rows with a chevron (the "dropping down" the user asked for);
  Parallel → the dark user pill and numbered sources; Appwrite → the search field in the docs nav.
Akashi's own: the 証 seal and the kanji index; the six verdict tones (D-024, AA) — never replaced by the accents;
  the accents are assigned: GREEN = go (primary CTA, live status) and 今 live-facts; PINK = 典 citations and the
  agent's voice (user bubble, the "chat" tag); BLUE = 符 code and Pocket Network (links, the band).
Media: code-native only — blobs are CSS shapes, windows are real (the desk) or static JSON from acceptance.md,
  source "logos" are monograms in circles. No photography, no illustration.
Reject: lemon, cool white, cobalt-as-brand, Gabarito display, 2 px corners, grey-only canvases, purple gradients,
  italic/serif word swaps, scroll-reveal on sections.
```

## 3. Tokens (`packages/brand/tokens/theme.css` v4)
| Token | Light | Dark | Role |
|---|---|---|---|
| `--background` | `#f6f6f2` | `#1d1a1a` | canvas (HTTPie cream / HTTPie dark) |
| `--band` | `#ebebe6` | `#262222` | grey blob, alternating section, docs sidebar hover |
| `--band-2` | `#dcdcd6` | `#302b2b` | footer grey |
| `--card` | `#ffffff` | `#2a2626` | white cards |
| `--foreground` | `#262222` | `#f6f6f2` | ink |
| `--muted-foreground` | `oklch(0.5 0.01 40)` | `oklch(0.74 0.008 60)` | secondary text |
| `--go` | `#73dc8c` | `#73dc8c` | GREEN: primary CTA fill, live pill fill, 今, blob |
| `--agent` | `#fa9bfa` | `#fa9bfa` | PINK: 典, the user/agent bubble, the "chat" tag, blob |
| `--net` | `#426bd1` | `#8fb0ff` | BLUE text: links, docs active nav, 符 text |
| `--net-band` | `#4a78e6` | `#3a5fc0` | BLUE fill: the Pocket band, 符 tile |
| `--primary` | ink | cream | the black button, the user pill |
| `--console*` | `#262222` / `#2f2a2a` / cream text | `#141212` | terminal windows, the readout |
| verdict tones | unchanged (D-024) | `*-dark` set | verdicts only |
| `--radius` / `-lg` / `-xl` / `-2xl` | 12 / 20 / 28 / 40 px; chips 999 | | HTTPie's soft geometry |
| `--shadow-window` | `0 24px 48px -24px oklch(0 0 0 / .35)` | deeper | the one shadow: dark windows |
| `--shadow-card` | `0 1px 2px oklch(0 0 0 / .06)` | | white cards (flat) |

Type: **Anton** 400 for the H1 and page titles, UPPERCASE, line-height 0.92, tracking 0 (hero 72–112 px; docs titles
48–64 px) · **Instrument Sans** 400–700 for everything else (H2 32–44 px at 700, tracking −0.02em; body 16–18 px) ·
**Geist Mono** for data, pills, code · Shippori Mincho B1 for the kanji only. Gabarito is removed.

## 4. Decision ledger
| Decision | Source | Role | Why |
|---|---|---|---|
| Hero centred (the user's second reference, MWM, puts an AI prompt box under a centred headline): Anton `IS THIS REAL?` with a pink speech-bubble tag `…and is it current?`, then the live **desk as a dark terminal window** (title bar · mono input · mode pills · green Check) with the exhibit chips as its action chips; green and pink blobs behind | MWM hero prompt box; HTTPie windows + blobs; `/ai` pink chat tag | go blob, agent tag | HTTPie shows screenshots; ours is the real product and it types |
| CTA trio under the sub: green `Try an exhibit ↓` · black `Read the docs` · link `Talk to the agent →` | HTTPie `/cli` Install / Read docs / Try online | go / ink / net | the brand's button grammar |
| Exhibit chips with a coloured kanji tile per service (典 pink · 符 blue · 今 green) | HTTPie `Star 33,406` pill pair; service accents | service accents | taps, not reading |
| Readout stays a dark window; evidence = white cards; sources = white card | HTTPie windows + white cards on cream | console | two windows stack like HTTPie's |
| Story 1 **"Said with confidence."**: 6 speech bubbles (tails) with real AI claims, coloured by the service that checked them, each with its verdict stamp | HTTPie "Loved by the community" masonry | service accents + verdict tones | the problem, shown as the AI talking |
| Story 2–4 one section per service, alternating columns: a dark window with the real request → response (from acceptance.md), a blob in the service colour, bullets, black `Docs →` + link `Try it` | HTTPie "Web & Desktop" / "Terminal" sections | service accents | HTTPie's product sections |
| Story 5 **"Every check is a relay."** inside a grey rounded blob band, the RequestPath card | HTTPie "Installation" grey blob | band | the one grey moment |
| Story 6 **Blue band**: zigzag bubbles `Check first.` `Then answer.` `Half a cent.` + GitHub / MCP / Docs pills; the receipt on the right | HTTPie community band ("Open source. Open hearted. Open minded.") | net-band | the brand's loudest moment |
| Story 7 **"Measured, not promised."**: 4 stat cards + ✦ facts | HTTPie "Trusted by the best" | | proof |
| Story 8 **"Read from the record."**: 12 source monograms in white circles | HTTPie logo circles | | sources as the trust row |
| Footer: grey band, seal + wordmark, 4 columns, theme switch with a label, legal line with the on-chain ids | HTTPie footer | band-2 | |
| Nav: logo · Desk · Agent · Docs · Judges · GitHub icon · green `Talk to the agent →` (web) / `Open the desk →` (docs) | HTTPie nav | go | identical on both apps |
| Docs: Anton uppercase titles + mono breadcrumb, `Edit on GitHub` white pill, blue active nav, flat sidebar, a search field at the sidebar top and a ⌘K trigger in the nav; the dialog on the tokens | HTTPie docs 7ad568be; Appwrite search | net | "the way it has a search bar" |
| Agent `/agent`: Anton `TALK TO AKASHI` + pink `chat` tag; dark user pills; assistant prose; **tool calls as collapsible rows** (kanji tile · tool · input preview · timing · price · verdict pill · chevron) expanding to the evidence card + receipt chip; shimmer row while running; suggestion chips; a dark composer window with a green send | Factory.ai rows, Parallel pills + sources, WaPo flow, HTTPie `/ai` | agent, go | the "dropping down" the user asked for |
| Motion: tool rows expand with height spring; stamps press (kept); windows rise 8 px on load; blobs static; reduced motion = fades | user motion rules | | |

## 4b. Wallet, payment and chat (approved plan 2026-10-06, see D-037 / D-038)
- **Sign in with the wallet**: RainbowKit's authentication adapter (SIWE) — connect, then sign a message; an httpOnly session bound to the address; guests get an anonymous session whose chats move to the address on sign-in.
- **Pay via Pocket**: a quote → sign → sent → paid card (KeeperHub's receipt frame on the Akashi tokens): amount with the USDC mark, network **Base Sepolia with the Base mark**, payTo, payer with the connector mark, then *Settlement on Base Sepolia* (Basescan) and *Registered on Pocket Beta* (the add-service tx) rows, and a greyed *Relay claim* row until relays settle. "unconfirmed" when PAYMENT-RESPONSE is missing.
- **Chat**: sidebar (Pinned / Today / Yesterday / Earlier, new, rename, delete), dark user pills, Streamdown prose, collapsible tool rows → evidence cards + receipt chip, prompt-kit composer with Free | Pay via Pocket, suggestion chips, the wallet pill in the sidebar footer, a no-key state.

## 5. Surfaces (nothing left out)
web `/` (nav, hero + desk window, exhibits, readout, evidence, sources, story ×8, footer), `/agent` + `/agent/c/[id]` (sidebar, chat, pay card, receipt, wallet pill), `/api/{chat,conversations,auth/siwe,pocket,demo}`,
`not-found`, `error` · docs landing, docs layout (sidebar, search, breadcrumb, titles), MDX, API reference, footer ·
`packages/ui` diagrams on `.card` · tokens v4 · fonts (Anton in, Gabarito out) · `.21st/design.json` v4 + `DESIGN.md`.
