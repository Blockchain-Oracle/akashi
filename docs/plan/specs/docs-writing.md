# Docs: structure and writing guide (apps/docs)

> **Purpose (user, 2026-09-30, binding):** the docs explain Akashi *as Pocket Network services* — how it connects to
> Pocket (registration, relays, sessions/claims, the portal's payment, calling from an agent) and the request/response
> types — for Pocket hackathon judges and Pocket agents. Diagrams (animated, themed) over prose; minimal words; no
> SDK/x402/wallet tutorials (payment is the portal's job); the playground lives in the web app (/play/*), not the docs.
>
> Written 2026-09-30 after the user rejected a thin, custom-styled docs site. Research: Fumadocs' own guidance via
> Context7 (`/fuma-nama/fumadocs`: meta.json separators and root folders, Cards, Steps, Tabs with `groupId`/`persist`,
> code-block `tab=` groups and `title=`, Callout types, TypeTable, Accordions, llms.txt) and the Diátaxis framework
> (diataxis.fr: tutorials, how-to guides, reference, explanation). This file is binding for every docs page.

## 1. Use the framework, not custom UI
- Stock Fumadocs layout (`DocsLayout`), sidebar, search, TOC, page actions. Brand = theme variables only.
- Only stock components: `Cards`/`Card` (with `href`, `icon`), `Steps`/`Step`, `Tabs`/`Tab` (`groupId="lang" persist`),
  `Callout` (`type`: default info, `warn`, `error`, `idea`), `TypeTable`, `Accordions`/`Accordion`, `Files`.
- Code blocks: always a `title="..."`; language tabs as adjacent blocks with `tab="curl"`, `tab="TypeScript"`,
  `tab="Python"` (first block also `tab-group="lang"` so the choice persists); highlight with `// [!code highlight]`.
- No custom components or CSS in pages. If something seems to need one, it is the wrong page type.

## 2. Every page is one kind of page (Diátaxis)
| Kind | Reader | Shape |
|---|---|---|
| **Tutorial** (quickstart) | new, learning by doing | one path, `<Steps>`, a visible result after every step, no alternatives, no theory |
| **How-to guide** (calling/*, service topic pages) | competent, has a goal | goal in the title ("Verify a citation"), steps, the exact request, the real answer, what to check |
| **Reference** (API reference, contract/*, verdict tables) | looking something up | complete, accurate, structured: `TypeTable`, tables, no narrative |
| **Explanation** (how Akashi works, service index pages) | wants to understand | why and how, trade-offs, diagrams in words, links to the other kinds |

## 3. Page anatomy
1. Frontmatter `title` (a goal or a noun, never "Overview of…") and a one-sentence `description` of what the reader gets.
2. Opening: 1–2 sentences — what you will do or learn, and what you need first (prerequisites as a list).
3. Body in the page's kind (above). For how-to pages: **When to use it → Request (TypeTable) → Send it (Tabs) →
   The answer (real, captured response) → Reading the answer (walk through the fields that matter) → Edge cases
   (Accordions) → Next steps (Cards)**.
4. Close with **Next steps** `Cards` (2–4) to the natural following pages.

## 4. Truth rules
- Every fact from the code (`packages/*`), the specs, decisions.md or a live call. Never invent limits or sources.
- Every example response is real: captured from the live API and pasted verbatim (`(trimmed)` in the title if cut).
- Say what is not live yet. Until Akashi is listed on the portal, calling pages say so in a `Callout type="warn"`
  and show the flow against the test portal.
- Plain English, second person, present tense, short sentences. No marketing words.

## 5. Site structure (as the user's Logos Kit docs: logo-tech/logos-kit-revamp/apps/docs)
- `/` is a landing page in Fumadocs' `HomeLayout`: live status pill, one-line promise, two CTAs, a copyable command,
  a product panel of real answers (ContainerScroll), the request flow (Animated Beam), a bento of real outputs, a
  code showcase, the sources, a closing CTA and a footer. Components in `components/landing/` (21st picks, re-tokenized).
- `/docs` is the documentation (`DocsLayout`), with Copy Markdown / Open page actions and `llms.txt`, `llms-full.txt`.
- Internal links are absolute `/docs/...`.

## 6. Information architecture (plan §8, organised by kind)
```
index                         Introduction (explanation + Cards into everything)
---Get started---
start/quickstart              Tutorial: your first paid call on the test portal, step by step
start/how-it-works            Explanation: request path (agent → portal → Pocket relay → Akashi), verdicts, provenance
start/judges                  How-to for judges: what to try, what each answer proves
---Call Akashi---
calling/index                 Choosing a route (table: x402 code, CLI, MCP, skill)
calling/x402-typescript       How-to
calling/x402-python           How-to
calling/curl-and-mppx         How-to (quote with curl, pay with the mppx CLI)
calling/mcp                   How-to: Claude Code / Desktop / Cursor through the portal MCP
calling/skill                 How-to: install the Akashi skill
---Services---
services/cite/{index,verdicts,legal,claims}
services/code/{index,snippet-check,packages-and-typosquats,symbols}
services/now/{index,time-and-holidays,fx,weather,news,stocks,jobs,facts}
---Contract---
contract/response · contract/errors · contract/limits
---Data---
data/sources-and-licences · changelog
reference/ (root folder, its own sidebar tab)  API reference generated from cards/<id>/openapi.json
```
Service pages show the request body and the real response, and one call line with the mppx CLI; full client setup
lives in calling/* (link to it, do not repeat it).
