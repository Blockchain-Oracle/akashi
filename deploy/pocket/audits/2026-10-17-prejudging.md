# Pocket pre-judging check — 17 October 2026

Service: `tool-router` on Pocket Beta. This check ran from outside the supplier host, then used the deployed `pocket-ap` application key to send signed relays to the staked supplier. No private key was copied into this report.

## Results

- `https://relay.useakashi.xyz` accepted TLS connections from outside the host. An unsigned HTTP request returned HTTP 400 with `invalid relay request: body must be a valid RelayRequest protobuf`, as expected for the RelayMiner.
- The live service audit returned PASS on A1–A9 with no findings at 2026-10-17 14:15 UTC. It reported 24 settled claims and the latest settlement at 2026-10-17 08:21 UTC. These claims predate the 80-endpoint sweep below; the sweep's settlement was not yet checked.
- `pocketd` on Beta showed the supplier staked at 60,000 POKT for `tool-router`, with its REST endpoint at `https://relay.useakashi.xyz`. The staked application used for signing was active with 1,149.922377 POKT remaining.
- All 80 catalog example inputs were sent as signed REST relays to the named supplier ([per-endpoint results](2026-10-17-endpoint-sweep.jsonl)). All 80 returned complete, parseable JSON. 78 returned `status: ok` on the first attempt. `firecrawl/map` and `wayback/snapshot` returned retryable `deadline_exceeded` errors on the first attempt; both answered on retry. `wayback/snapshot` then returned `found: false`, matching the empty response from the Wayback availability API at the time. That is an upstream no-result, not proof that the requested page was never archived.
- The published npm `akashi@0.1.1` judge command ran `github/latest-release` for `astral-sh/uv` successfully: HTTP 200, `receipt.paid: true`, `receipt.via: pocket`, and Base Sepolia settlement [0x0b9aa5…593f3](https://sepolia.basescan.org/tx/0x0b9aa5b18920c60f973f05371d80f2fb84b7928c945047e5ceab6723e0f593f3). The result was tag `0.13.1` at test time; that live tag can change.
- The documented Wikipedia no-result returned HTTP 404, `found: false` and `paid: false`. The invalid-input example returned HTTP 422, `invalid_input` and `paid: false`.

## Interpretation

The signed relay path, real operation, and x402 settlement worked on 17 October. Two third-party calls were intermittently slow. A fresh successful relay does not establish that its claim and proof have settled yet; check the [live audit](https://mcp.pocketmcp.network/audit?network=beta&ids=tool-router&operator=pokt1qnrjr3susgpyh4a4rx8f0x0wd6pqdtptr50ayg) for current chain state.
