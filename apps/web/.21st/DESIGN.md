<!-- Mirrors .21st/design.json (hand-maintained: `21st init --design-context --refresh` would reset it). -->
# Akashi web: design context

- Product: agent-facing verification APIs (citations, code, live facts) on Pocket Network
- Stack: nextjs-16, react-19, shadcn (radix-nova), tailwind-v4, motion
- Colour mode: light (washi) by default; dark (sumi) via the .dark class from next-themes; both from the same token rules
- Density: certificate ledger: hairlines and whitespace do the layout, mono data, no card chrome except the receipt

## Tokens

### Colors
- **background**: var(--background) oklch(0.975 0.006 85) washi · dark oklch(0.16 0.008 260) sumi
- **foreground**: var(--foreground) oklch(0.20 0.010 260) · dark oklch(0.95 0.005 85)
- **accent**: var(--primary) 藍 indigo oklch(0.45 0.14 265) · dark oklch(0.72 0.12 265): the only accent, interaction and brand only
- **hairline**: var(--border) oklch(0.88 0.008 85) · dark oklch(0.30 0.010 260)
- **muted**: var(--muted) / var(--muted-foreground)
- **verdicts**: --verdict-verified 青磁 · --verdict-mismatch 琥珀 · --verdict-not-found 朱 · --verdict-retracted 紅 · --verdict-ambiguous 藤 · --verdict-unknown grey; all ≥ 4.5:1 on background and card (D-024)

### Typography
- **display**: var(--font-display) Newsreader; one italic word per headline at most
- **ui**: var(--font-sans) IBM Plex Sans 400/500/600
- **data**: var(--font-mono) IBM Plex Mono: verdict codes, receipts, as_of, IDs, JSON; eyebrows uppercase with widest tracking
- **mark**: var(--font-mark) Shippori Mincho B1 800: the 証 mark and the kanji index (典 符 今) only

### Radius
- **card**: var(--radius) 6px
- **chip**: var(--radius-chip) 999px

### Shadows
- **receipt**: var(--shadow-receipt): the only drop shadow in the app

### Motion
- **ease**: var(--ease-seal) cubic-bezier(.2,.8,.2,1); state changes only, 150–240 ms (--duration-state 180ms)
- **signature**: seal press: scale 1.06 → 1 plus a 120 ms ink bloom when a verdict lands
- **reduced**: prefers-reduced-motion gives cross-fades only; ambient loops pause off-screen

## Must

- Tokens only: no hex, rgb or px literals in TSX; colours through theme utilities or var(--token)
- 藍 indigo (--primary) is the only accent and never a verdict colour
- Verdicts are glyph + word + colour, never colour alone
- Dark and light from the same rules (.dark overrides in packages/brand/tokens/theme.css)
- Constants, not magic numbers (ESLint @typescript-eslint/no-magic-numbers); files ≤ 400 lines
- Real Akashi examples and copy, never lorem ipsum
- framer-motion imports become motion/react

## Avoid

- round hanko, brush fonts, kanji watermarks
- glassmorphism, purple gradients, generic SaaS gradient heroes
- Tailwind palette colour utilities (text-blue-500 …) and pasted HTML
- a second accent colour
- drop shadows other than the receipt's

## Decisions

- **D-024**: Brand tokens: light mismatch/ambiguous/unknown darkened (L 0.55/0.55/0.545) so every verdict colour passes AA on washi
- **D-025**: One primitive family per app: web uses shadcn radix-nova (21st picks and AI Elements are Radix); docs uses Fumadocs' Base UI build
- **D-foundation-2026-09-30**: S7 foundation page: seal + letters-only wordmark in the nav (never 証 twice), Newsreader headline, ledger of the three services with endpoints generated from the OpenAPI
