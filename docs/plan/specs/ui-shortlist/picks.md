# 21st.dev shortlist: visually reviewed picks (2026-09-29)

**Method:**
- `21st search` across every UI surface; about 190 candidates.
- Previews downloaded into labelled contact sheets (`sheets/*.jpg`) and reviewed visually.
- The key picks' code was read with `21st get`.

**Account:** paid tier, unlimited search and code retrieval. **AI generation is not enabled**, so never call `generate` or `iterate`.

**Install:** `21st add <author>/<slug>`, or the `installCommand` from `21st search --json`.

**Adaptation rules (every pick):**
- Re-tokenize to `packages/brand` tokens: no hex, no Tailwind colour utilities.
- `framer-motion` → `motion/react`.
- Files ≤ 400 lines.
- Real Akashi copy only.

`hc` = hard-coded colours counted in the code (must be removed).

| Surface | Pick (id · author/slug) | Why | Deps (from code) | hc |
|---|---|---|---|---|
| Desk hero layout | 19080 · felipemenezes098 (Real Estate Search Hero) | serif headline over a centred search: the desk hero layout | — | ? |
| Desk input | 1097 · kokonutd (useAutoResizeTextarea) | auto-grow paste box | — | ? |
| Desk chips + counter | 20132 · pacekit (AI Suggestions) | chips above the input + char counter (→ byte counter) | — | ? |
| Mode / type toggle | 26923 · micka_design (Segmented Tabs) | clean segmented control | — | ? |
| Live trace | **23569 · ddoemonn (Task Steps)** | mono per-step timings: the "evidence gathering" trace | — | ? |
| Ambiguity picker | 12421 · serafimcloud (Question Tool) | "Is this a citation or code?" | — | ? |
| Verdict summary | 29478 · eugeneshilow (Verdict Stack) | stacked verdict bars + legend | react | **23** |
| Verdict chip | 1600 · haydenbleasel (Pill) / 521 · serafimcloud (Status Badge) | icon + word chips | lucide-react | 0 |
| Matched record | 19314 · tool-ui (Citation) | citation card | — | ? |
| Field diff | 23584 · kvnkld (File Diff) | `year 2016 → 2015` rows | — | ? |
| Details | 23530 · ddoemonn (Accordion) | rows with right-aligned meta | — | ? |
| Code result | **28281 · educalvolpz (Code Block)** | line highlight + red gutter marker | motion/react, lucide-react | 0 |
| Sources | **29355 · rmahammad (Source Citation Rail)** | numbered sources, Verified badge, excerpt, copy/open | motion/react | 0 |
| Now answer + sources | 23818 / 23817 · educalvolpz (AI Response / AI Sources) | inline source markers + collapsible list | — | ? |
| Agreement meter | 19521 · hero_ui (Meter), restyled as a 3-segment bar | | — | ? |
| Loading | 19999 · animbits (Skeleton Loader) | shimmer rows | — | ? |
| Error | 11331 · coss.com (Alert) | subtle, mono code | — | ? |
| Empty | 1435 · serafimcloud (Empty State) | | — | ? |
| Rate limit | 29280 · elements- (Upstash Ratelimit) | mono "6 / 10 · Resets in 43s" | react | 1 |
| Receipt (paid call) | 31601 · aadarshm (Receipt Printer) | printed receipt for a paid call | — | ? |
| Envelope | 28477 · hirael (JSON Viewer) | expand/collapse | — | ? |
| Schema | 29970 · elements- (Schema Viewer) | outputSchema display (desk story + docs) | — | ? |
| Pricing | **29978 · arihantcodes_1f7b8c4d (Receipt Tiers, "Straight")** | torn thermal receipt + rubber stamp → 証 | (utils/reveal) | **18** |
| How it connects | 919 · dillionverma (Animated Beam) | hub-and-spoke flow | framer-motion | **41** |
| Steps | 26902 · ln-dev7 (Vertical How It Works) | numbered vertical steps | lucide-react | 0 |
| Alt ambient | 18024 · cult-ui (Grid Beam) | light along table hairlines ("ledger") | next-themes | 0 |
| Services | 9594 · avanishverma4 (bento grid 01), adapted to light | hairline, typographic | framer-motion, lucide | 0 |
| Numbers | 19063 · danielpetho (Number Ticker, mono) | evidence tiles | — | ? |
| Text reveal | 23571 · ddoemonn (Text Reveal) | restrained | — | ? |
| Logos | 21470 · olewandowski1 (Logo Cloud Marquee, monochrome) | `21st logo <name>` for SVGs | — | ? |
| CTA | 19355 · shadcnstore (CTA Section) | CTA + docs/resources cards | — | ? |
| Nav | 606 · shadcnblockscom (Navbar with Dropdowns) | Services dropdown | — | ? |
| Footer | 7264 · efferd (Minimal Footer) | mono tagline | — | ? |
| Chat layout | 23601 · theshanelevine (Chat Panel) | tool steps inline with timings | react | 0 |
| Tool calls | 23789 · educalvolpz (AI Tool Call) → 20078 · elements- (expanded) | status rows → input/output | framer-motion / @radix-ui/react-collapsible | 0 / 4 |
| Prompt | 1740 · ibelick (Prompt Input) + 1747 · ibelick (Prompt Suggestion) | | — | ? |
| ⌘K | 28888 · arihantcodes_1f7b8c4d (Command Search) | site / docs search | — | ? |
| Wallet | RainbowKit's own modal | better than every 21st candidate | — | — |

**Rejected directions (reasons recorded):**
- generic SaaS gradient heroes: 3110, 7218, 4673, 8772, 7035;
- photo-led heroes: 5260, 4582, 24747;
- dark neon meters: 24473;
- glassy purple chat: 20129.

**Next step (S7/S8):** `21st get <id>` each pick again before adapting it, so the code is current; fill in the unknown `hc` counts; record the final choices in `.21st/design.json` decisions.
