# S7 — Web foundation + brand

**Plan:** `00-plan.md` §7 · **Open first:** specs/web.md §2, §9–10

## Steps
- [x] Scaffold apps/web, apps/docs, packages/{api-client,brand,model}
- [x] Brand: 証 square seal SVGs, fonts, oklch tokens, verdict tokens
- [x] 21st init --design-context + .21st/design.json must/avoid
- [x] env.ts (zod, server/public), constants
- [ ] Dockerfiles; GHCR workflow; [OK?] Coolify image resources — **in progress**: shared `deploy/next-app/Dockerfile` + `.github/workflows/images.yml` written; local image builds were running at the handoff (verify: `docker build -f deploy/next-app/Dockerfile --build-arg APP=web .`); GHCR: the server's existing ghcr.io login can already pull both private images (Q-007 closed, no new token); Coolify apps created (akashi-web uaydz8sozk7g4fgbqr49rj2a, akashi-docs k7ds7ucqsnaxw5lorj8a9buu); deploy + health check pending

## Gate
Images in GHCR; health green; `21st review` clean.

## Findings
- **Docs redesign (user: "why is this mediocre"):** the first docs build was stock Fumadocs with the colours swapped. Now: a
  full-width custom header (seal, AKASHI, mono DOCS tag, ledger search ⌘K, theme toggle, indigo "Open Akashi"), a ledger
  sidebar (mono section labels, an indigo rule on the current page, no pills), Newsreader titles with mono eyebrows,
  hairline tables, Shippori kanji, the shared service ledger, and a real captured response (Varghese → not_found,
  441 ms) as the home page's exhibit. Pages: home, the response contract, and one page per service with every verdict
  from the published schemas. The grid bug on the way: `--docs-grid` must be declared on `#nd-docs-layout`, where
  Fumadocs sets the variables it reads (a custom property resolves `var()` where it is declared).
- **Supply chain (D-026):** `mdast-util-to-markdown` 2.1.3 (published 2026-09-27, transitive) crashed every docs page containing *emphasis* (fumadocs stringifier recursion). pnpm now enforces `minimumReleaseAge: 10080` (7 days) for all packages, and `overrides` pins 2.1.2. The lockfile was rebuilt fresh under the policy (turbo 2.11.3, sharp 0.35.4).
- The seal is generated from the real fonts (`packages/brand/scripts/build_marks.py`: 証 from Shippori Mincho B1 ExtraBold, AKASHI from Plex Sans Medium) into SVG assets + `src/marks.generated.ts`; Seal/Wordmark React components live in `@akashi/brand/react` (shared by web and docs).
- `21st init --design-context --refresh` wipes hand edits: `.21st/design.json` is hand-maintained and DESIGN.md is rendered from it. `21st review`: web 16 / docs 7 / brand 3 files, 0 findings.
- `turbo prune` omits the root tsconfig.base.json: the Dockerfile copies it explicitly.

## Handoff
