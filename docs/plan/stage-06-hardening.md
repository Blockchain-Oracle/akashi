# S6 — Hardening + portal package

**Plan:** `00-plan.md` §7 · **Open first:** specs/deploy-runbook.md §7–8

## Steps
- [x] Regenerate schemas (`uv run akashi-schemas`; also served live at `/specs/<id>.openapi.json`, byte-identical)
- [ ] [OK?] Card v2 via add-service (live CUPR + name) — **needs S2** (services not on-chain yet). Cards are ready:
      `cards/<id>/card.template.json` → `python3 scripts/render_cards.py --api-base https://api.<d> --repo-url …`
      (all three validate against the bundled schema, 3.3 KB each; IDs still free on Beta)
- [x] schemathesis over each OpenAPI; lint_backend ×3 (see Findings for the gate command)
- [ ] Latency measurement (`scripts/latency.py`); audit green (audit **needs S2**)
- [ ] cards/<id>/registry.json → PNF; publish sage-service.yaml — packages built (`scripts/build_registry.py`),
      `deploy/gateway/sage-service.yaml` written; **sending waits on the domain** (the spec URL and example host
      must be the final ones)

## Gate
Audit with no FAIL; p95 within targets.

## Findings
- **Schemathesis gate command** (per service, 5 req/s, hard stop + margin as max response time):
  `uvx schemathesis run cards/<id>/openapi.json --url <base>/<prefix> --phases examples,coverage,fuzzing -n 50
  --rate-limit 5/s --request-timeout 15 --max-response-time <9.5|8|5> --exclude-checks
  positive_data_acceptance,negative_data_rejection --warnings off`.
  The two excluded checks are data-dependent by nature: a well-formed but unknown input (country `AA`, a place
  called `0`, currency `AAA`, an invalid npm range) is a correct 422; Pydantic's lax mode accepting `false` as `0`
  is harmless. Everything else (no 5xx, documented statuses, content type, response schema) is enforced.
- **Bugs schemathesis and the registry example found, all fixed:**
  - `/code/v1/check` said `ok` for a nonexistent package on every *cached* lookup: `PackageFacts`/`SymbolAnswer`
    came back from the JSON cache with `exists="no"` (a str), and `decide()` compares `is Tristate.no`. The S3 gate
    only ever saw cold calls. Fixed by coercing in `__post_init__`.
  - 500s on blank inputs: `/symbols` `[""]`, `/claim` with `citation:""` (lxml "Document is empty"), `/weather`
    `place:""` (assert), a control character in `pmid` (InvalidURL into PubMed), blank author names (IndexError).
    Fixed at the model boundary: non-blank text, identifier patterns (DOI, arXiv, PMID, http URL).
  - `/verify` with Vaswani 2017 came back `ambiguous`: Crossref now holds 2025 reposts under junk DOIs
    (`10.65215/…`) and the Crossref short-circuit fired on a candidate with a blocking year diff, so the real
    record (DataCite arXiv / OpenAlex) was never looked up. Now: short-circuit only on a clean match, DataCite
    search narrowed by first-author surname.
  - `not_found` required only "Crossref + any fallback"; with OpenAlex down a real JMLR paper (Srivastava,
    Dropout) came back `not_found` in local calibration. Now `not_found` needs OpenAlex (the only DOI-less-venue
    index), else `unverifiable` + retryable.
  - 405 lacked `Allow`; OpenAPI documented FastAPI's `HTTPValidationError` instead of our error envelope; the
    either/or rules (zone|place, end xor add_days, lat+lon|place, citation|evidence_text) were invisible in the
    schema. All fixed; the schema now states them.
- **lint_backend** (card healthchecks + bad-input probes) 21/21 PASS on all three before the fixes.

## Handoff
Next: deploy a731410+, re-run the schemathesis gate on cite, production calibration (40/40 · 40/40 expected),
`scripts/latency.py`, then record in acceptance.md. The rest of S6 (card v2, audit, sending the registry
packages) waits for S2, which waits for the domain (Q-001).
