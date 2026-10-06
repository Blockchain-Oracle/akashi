# Spec — UI revamp v2 (2026-10-06): "The Highlighter"

> Supersedes the visual parts of `web.md` §2–§4 and §8, and the v1 ("ledger") revamp of earlier today, which the user
> rejected as grey and boring. Routes, data and payments in `web.md` still hold. Research method: `refero-design`
> skill (styles → screens), the user's reference (cdrkit.xyz) read for its energy, 21st.dev components read before use.

## 1. What went wrong in v1, in one line
Restraint was mistaken for taste: a cool-grey canvas, ink and one dull blue, serif headings, 2 px corners. The user's
reference (cdr-kit) showed what was wanted: heavy display type, colour used with conviction, tinted pills, 14 px cards
with layered shadows, a dark showcase block, playful details. v2 takes that energy with Akashi's own identity.

## 2. Research
**Styles (full):** Superthread `f873e560` · Val Town `3bbbcca5` · Aaply `ee5afc50` · PostHog `13bc10c0`; previews:
Convex `d500b995`, Gumroad, Fingerprint, Clutch Security, Trigger.dev, Vapi, Turso. ~45 previews across five queries
(bold dev tool · yellow + deep blue · AI agent platform with colour · trust/verification energetic · Val Town/Linear/
Raycast/Resend family). cdrkit.xyz read: Bricolage Grotesque / Hanken Grotesk / JetBrains Mono, paper `#fdfcf9`, ink
`#221d18`, primary `#3959da`, radii 5/9/14, three warm shadows, tinted pills, gradient CTA, black terminal block.
**21st.dev read:** Text Highlighter 18772 (marker sweep), Hero Pill 983, Feature Grid Spotlight 26797, Code Block
28695 (filename tab + spring copy), Stats 29870, Vertical Stepper 29866, Log Viewer 31646 (row grammar, kept).

## 3. Reference lock
```
Primary: Superthread — whiteboard with a vivid highlighter. Cool near-white canvas, substantial dark type at big
  scale (semibold display), ONE vivid accent as the marker: the stroke under the hero keyword and the primary CTA
  fill; dark pills/tabs for active states; elevated white cards with a three-layer soft shadow; alternating
  canvas / cloud-grey bands; 10 / 16 px radii, 50 px pills.
Preserve: (1) the marker stroke under the hero word; (2) marker = CTA + active emphasis, nowhere else large;
  (3) dark ink type, 600–800 weight, tight tracking; (4) dark active tabs; (5) elevated white cards, soft shadow.
Borrow only:
  Val Town → the code-card treatment (filename header bar + action button) for the desk; the Deep-Midnight dark
    card for the readout and the Pocket showcase; mono values coloured on dark.
  Aaply → the lemon CTA + black secondary pair; big 999 px pills; a tooltip-like filled badge for one status moment.
  Convex → a thick tinted frame around the dark showcase (we frame the readout's top edge in marker).
  cdr-kit → tinted status pills with a dot; the ✦ facts row under the hero; data rows with coloured mono values.
Akashi's own: the 証 seal; a LEMON marker (hue ~102) instead of Superthread's amber, so it never reads as the
  mismatch verdict; midnight blue-black ink; the six verdict tones as semantics; Gabarito / Instrument Sans /
  Geist Mono instead of the references' faces.
Role rules: marker lemon = CTA fill, hero stroke, active tab/underline, console values. Cobalt = text links and
  the docs' active nav only (never a fill). Verdict tones = verdicts. Signal green = live/ok status pills only.
  Console (midnight) = machine output and the one showcase band.
Media: code-native (seal, SVG marker stroke, diagrams). No photography, no illustration.
Reject: grey canvases, serif display, 2 px corners, underline-as-emphasis, dull blue, italic word swaps, cream +
  earth tones, purple gradients, scroll-reveal on sections.
```

## 4. Tokens (`packages/brand/tokens/theme.css` v3)
| Token | Light | Dark | Role / source |
|---|---|---|---|
| `--background` | `oklch(0.985 0.002 250)` | `oklch(0.15 0.015 260)` | canvas (Superthread Canvas White / Val Town midnight) |
| `--band` | `oklch(0.962 0.003 250)` | `oklch(0.175 0.015 260)` | alternating section band (Cloud Gray) |
| `--card` | `#fff` | `oklch(0.195 0.015 260)` | elevated cards |
| `--foreground` | `oklch(0.21 0.02 265)` midnight ink | `oklch(0.96 0.004 250)` | type (Midnight Ink) |
| `--muted-foreground` | `oklch(0.47 0.02 260)` | `oklch(0.72 0.012 255)` | secondary text (Cool Stone / Cadet Gray) |
| `--border` / `--border-2` | `0.92 / 0.87` | `0.30 / 0.36` | lines (Ash Mist) |
| `--marker` | `oklch(0.92 0.19 102)` lemon | `oklch(0.88 0.17 100)` | CTA fill, hero stroke, active tab, console values |
| `--marker-foreground` | ink | ink | text on lemon |
| `--link` | `oklch(0.45 0.17 258)` cobalt | `oklch(0.78 0.11 235)` | text links, docs active nav |
| `--primary` | = `--foreground` (ink) | = `--foreground` | shadcn primary = the black button (Aaply pair) |
| `--signal` / `--warn` | `0.56 0.15 150` / `0.62 0.15 70` | lighter | status pills |
| `--console` / `-2` / `-fg` / `-muted` / `-border` | `0.26 0.03 260` Deep Midnight … | deeper | machine output + showcase |
| verdict tones | unchanged (D-024) | `*-dark` set | verdicts |
| `--radius-sm/-/lg/xl` | 6 / 10 / 16 / 20 px, chips 999 | | Superthread 4/10/16/50 |
| `--shadow-1/2/3` | Superthread three-layer card; Val Town code-card; product-mockup | | elevation |

Type: **Gabarito** 700/800 display (hero 56–80 px, tracking −0.03em, line-height 1.0; section 40–48 px) ·
**Instrument Sans** 400–600 body (16–18 px) · **Geist Mono** 400/500 data (labels 11–12 px tracked uppercase) ·
Shippori Mincho B1 for 証 and the kanji index only.

## 5. Decision ledger
| Decision | Source | Role | Why |
|---|---|---|---|
| Hero: left-aligned, Gabarito 800 at 64–80 px, "Is this real, and is it **current**?" with a hand-drawn lemon marker stroke under *current* (SVG path, draws in once) | Superthread hero; 21st Text Highlighter idea | marker = emphasis | the memorable move; verification *is* highlighting |
| Pills above the hero: `● Pocket Network · Agentic Services` (tinted ink) · `● 3/3 live on Beta` (signal) | cdr-kit, Val Town banner | status | sets context in 1 s |
| CTA pair: lemon "Try an exhibit ↓" + black "Read the docs" | Aaply / Superthread | CTA | the pairing is the brand |
| ✦ facts row: 3 services on Beta · 40/40 · 40/40 calibration · $0.005 a check · 8 package registries · every answer with its sources | cdr-kit | proof | credibility in mono |
| The desk = a code card: header bar (traffic-dot-free; "desk · paste a citation, code or a question" + byte counter) · textarea · footer strip with the mode tabs (dark active tab), detected kind, ⌘↵, lemon "Check" button; focus = lemon ring | Val Town code card (header + Run), Superthread dark tabs | | product-first, no grey |
| Exhibits = six white chips (icon kanji + label) in a wrap row under the desk; hover lifts; active runs | Superthread tab strip; cdr-kit package chips | | taps, not reading |
| Readout = Deep Midnight card with a 3 px lemon top edge: route, per-item rows (Log Viewer grammar), verdict bar; values in lemon mono | Val Town dark card; Convex frame; Log Viewer 31646 | console | the instrument reading |
| Evidence = white cards (16 px, shadow-1), verdict as a bold tinted pill (tone/12 fill, tone text, 1.5 px tone border, glyph), title in Gabarito 600, field diffs as data rows with coloured mono values | cdr-kit pills; Parallel result; Val Town | verdict tones | big, legible verdicts |
| Sources = card with rows, numbered, status glyph, latency | Parallel citations | | |
| Story bands alternate canvas / band; eyebrow = a 6 × 56 px lemon bar above the title (Val Town) | Val Town, Superthread | marker (small) | rhythm without rules |
| Failures = 4 stat cards (Gabarito 56 px number, label, mono source) | Val Town / cdr-kit stats; 21st Stats 29870 | | |
| How = 4 numbered steps with lemon square badges (01–04) in a 4-col grid, no cards | cdr-kit steps; 21st Stepper 29866 | | |
| Pocket = the one dark band (Deep Midnight, radius 20, inset in the canvas) with the relay diagram; title white, lemon marker word | Val Town dark testimonial band; Convex | console | contrast moment |
| Services = 3 white cards with the kanji in a lemon-tinted square, name, promise, id · CU, "Docs →" | cdr-kit pillar cards; Feature Grid 26797 | | |
| Envelope = nested cards; Price = receipt kept (shadow-3); Registration kept | | | |
| Nav = sticky white bar, bottom line; seal + wordmark; Why · How · Services · Price · Docs ↗; lemon "Open docs" CTA; theme toggle | Superthread nav | | |
| Docs = same tokens; `fd-primary` = cobalt (links), landing CTAs lemon/black; titles Gabarito | | | one system |
| Motion: marker stroke draws on load (600 ms), stamps press (seal press kept), console rows pop, cards lift 1 px on hover, sweep while running; reduced motion = fades | user brand motion rules | | |

## 6. Surfaces (nothing left out)
web `/` (nav, hero, desk, exhibits, facts, readout, evidence, sources, story ×7, footer), `not-found`, `error`;
docs landing, docs layout + pages, MDX, API reference, footer, status pill; `packages/ui` diagrams; brand tokens;
`.21st/design.json` + `DESIGN.md`.
