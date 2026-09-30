# S2 — Pocket plumbing

**Plan:** `00-plan.md` §7 · **Open first:** specs/deploy-runbook.md §0–7

## Steps
- [x] Install pocketd (pinned) + pocket-ap; keys owner/operator/3 apps (test keyring)
- [x] [OK?] Faucet + bank sends + operator pubkey tx
- [x] Cards v1 validated (validate_card.py + pocketd validate-card)
- [x] [OK?] 3× add-service (positional; CUPR 40k/20k/10k)
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
- The faucet is a plain GET: `https://faucet.beta.pocket.network/send/beta-pokt/<addr>` (100,000 POKT, 2 per address
  per 24 h; `config.json` lists the limits). No browser needed.
- The official install script needs sudo for /usr/local/bin; the same checksummed release tarball installs fine into
  `~/.local/bin`.
- zsh does not word-split `$TXF`: pass the tx flags inline (or `${=TXF}`), otherwise pocketd reads them all as the
  `--network` value.
- Consecutive txs from one account need the previous one committed first (account sequence mismatch otherwise).
- The service fee is charged once at creation; card updates cost gas only, so the v1 cards point at the temporary
  sslip host (the spec URL resolves, A8) and get re-published when the domain exists.

## Handoff
Steps 1–4 done 2026-09-30 (addresses, txs and card sha256 in ids-and-txs.md). Everything from step 5 waits for the
domain (Q-001). Mnemonics are in `~/.akashi-secrets/*.json` (0600) on the user's Mac: move them to the password
manager, then delete the files.
