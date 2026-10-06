<!-- Mirrors .21st/design.json (hand-maintained: `21st init --design-context --refresh` would reset it). -->
# Akashi web: design context

- Product: agent-facing verification APIs (citations, code, live facts) on Pocket Network
- Concept: **The Highlighter** (Refero research 2026-10-06 → `docs/plan/specs/ui-revamp.md`): a cool near-white canvas, midnight ink type at heavy weight, one vivid lemon marker, elevated white cards, a Deep-Midnight console
- Stack: nextjs-16, react-19, shadcn (radix-nova), tailwind-v4, motion
- Colour mode: light by default; dark (midnight) via `.dark`; `.console` is a scoped dark theme for machine output and the one showcase band

## Tokens

### Colors
- **background** `oklch(0.985 0.002 250)` · dark `oklch(0.15 0.015 260)`; `--band` for alternating sections
- **card** white · dark `oklch(0.195 0.015 260)`, with `--shadow-1`
- **foreground** midnight ink `oklch(0.21 0.02 265)` · dark `oklch(0.96 0.004 250)`
- **marker** lemon `oklch(0.92 0.19 102)` · dark `oklch(0.88 0.17 100)`: CTA fill, the hero stroke, the active tab, console values; never body text, never a verdict
- **primary** = the ink: the black button and dark active pills
- **link** cobalt `oklch(0.45 0.17 258)`: text links and the docs' active nav only
- **signal / warn** status pills only
- **console** Deep Midnight `oklch(0.26 0.03 260)` · dark `oklch(0.12 0.02 260)`: the readout, code, the Pocket band
- **verdicts** 青磁 verified · 琥珀 mismatch · 朱 not-found · 紅 retracted · 藤 ambiguous · grey unknown; the `*-dark` set on the console and in dark mode; all ≥ 4.5:1 (D-024)

### Typography
- **display** Gabarito 700/800; tracking −0.03em (hero), −0.025em (sections), −0.02em (card titles)
- **ui** Instrument Sans 400–700; 15–18 px
- **data** Geist Mono 400–600: `.label` (11.5 px uppercase, tracking 0.12em), pills (12.5 px), codes, timings, JSON
- **mark** Shippori Mincho B1 800: 証 and the kanji index (典 符 今) only

### Shape, elevation, motion
- radii 6 / 10 / 16 (cards) / 20 (the console band); pills and buttons 999
- `--shadow-1` cards · `--shadow-2` hover, the readout · `--shadow-3` the desk card, the receipt · `--shadow-marker` under the lemon button
- `--ease-seal`; fast 120 · state 180 · slow 320 ms; the marker stroke draws once; `VerdictStamp` presses with an ink bloom; cards lift 2 px on hover; the desk strip sweeps while running; reduced motion = fades

## Patterns
- `.card` (+ `.card-hover`) for records and interactive cells · `.well` for a data strip inside a card · `.console` for machine output
- `.btn .btn-marker` (lemon) / `.btn-ink` (black) / `.btn-white` · `.pill` variants · `.eyebrow-bar` + `.label` above a section title · `.key` + `MarkerStroke` for the hero keyword
- A verdict is always glyph + word + colour (`VerdictStamp`: a tinted pill, `TONE_PILL`)

## Must
- Tokens only: no hex, rgb or px literals in TSX
- Lemon is the marker: CTA fill, hero stroke, active tab, console values; never body text, never a verdict
- Verdicts are glyph + word + colour, never colour alone
- Dark and light from the same rules
- Constants, not magic numbers; files ≤ 400 lines
- Real Akashi examples and copy
- `framer-motion` → `motion/react`

## Avoid
- grey canvases, serif display, 2 px corners, underline-as-emphasis, italic word swaps
- glassmorphism beyond the nav's blur; gradients beyond the lemon button; purple
- Tailwind palette colour utilities; pasted HTML
- a second vivid accent in marketing surfaces; scroll-reveal on sections

## Decisions
- **D-024** verdict tokens pass AA in both themes; the `*-dark` set is reused on the console
- **D-025** one primitive family per app (web: radix-nova; docs: Fumadocs Base UI)
- **D-028** UI revamp v2 "The Highlighter" (lock + ledger in `docs/plan/specs/ui-revamp.md`)
- **D-029** hero pills, Gabarito 800 + lemon stroke, lemon + black CTA pair, ✦ facts; the desk as a code card; exhibits as chips
- **D-030** readout on Deep Midnight with a lemon edge; evidence as white cards with pill verdicts and wells; sources as a card
- **D-031** story bands, eyebrow bar, stat cards, lemon-badged steps, the Pocket band, service cards, nested envelope, the receipt
- **D-032** docs on the same tokens; `fd-primary` = cobalt; lemon/black/white CTAs; Gabarito titles
- **D-breakpoints** ≥ 1100 px evidence | sources (18 rem, sticky); stat cards 1 / 2 / 4; service cards 1 / 3; steps 1 / 2 / 4; nav anchors from md
