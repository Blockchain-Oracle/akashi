# S3 — code-reality-check

**Plan:** `00-plan.md` §7 · **Open first:** specs/backend.md §3.2, §9 code

## Steps
- [ ] Models; npm + PyPI → /v1/package
- [ ] Top lists (worker) + placeholder/typosquat/suspicious_new
- [ ] Other registries + deps.dev + /packages + /versions
- [ ] Python wheel range reads + AST index + typeshed
- [ ] Go (pkgsite → zip fallback)
- [ ] Rust (docs.rs rustdoc JSON)
- [ ] ts-introspect (TypeScript 6.0.3)
- [ ] /symbol(s) with pending + background completion
- [ ] /check via tree-sitter
- [ ] Pre-warm job, schema, probe

## Gate
axios fetchJson→no / getUri→yes+sig; zod z.string→yes; react-codeshift & huggingface-cli→placeholder; left-padx→likely_typo; requests Session.mount→yes; gin AbortWithError sig; anyhow→unknown; next@15 pending→warm.

## Findings

## Handoff
