# S2 — Pocket plumbing

**Plan:** `00-plan.md` §7 · **Open first:** specs/deploy-runbook.md §0–7

## Steps
- [ ] Install pocketd (pinned) + pocket-ap; keys owner/operator/3 apps (test keyring)
- [ ] [OK?] Faucet + bank sends + operator pubkey tx
- [ ] Cards v1 validated (validate_card.py + pocketd validate-card)
- [ ] [OK?] 3× add-service (positional; CUPR 40k/20k/10k)
- [ ] [OK?] Domain + DNS (relay-beta, api, web, docs)
- [ ] [OK?] /opt/pocket/secrets/supplier-keys.yaml over SSH
- [ ] [OK?] Deploy the pocket compose; verify /ready/<id>, noeviction, LE cert, no gzip
- [ ] [OK?] stake-supplier (operator, 60,500 POKT, all 3 services)
- [ ] [OK?] 3× stake-application (1,100 POKT)
- [ ] pocket-ap relays per service (separate sessions) → claim txs via indexer → ids-and-txs.md
- [ ] Audit API for all 3 → A1–A7 PASS
- [ ] Contact organizers (Q-003) with the registry packages

## Gate
A settled claim per service; audit A1–A7 PASS.

## Findings

## Handoff
