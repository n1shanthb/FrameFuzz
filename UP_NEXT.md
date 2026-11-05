# Up next

Read `AGENTS.md`, `AUTHORITY.md`, `CURRENT_STATUS.md`, `BUILD_STATUS.md`, `docs/ADAPTER.md`, and `vendor/README.md`. Remain on `feat/framefuzz-mvp`; inspect Git and preserve user edits.

## Completed
The missing ZIPs have been supplied and integrated. Real basic sponsorship, fresh unstaked pool rejection, existing staked pool acceptance, and all six live gas-boundary submissions passed. Seven frame transactions were included successfully. LIVE evidence is committed, the existing dashboard displays it, and 37 tests pass. Do not restart the old missing-artifact search.

## Immediate next step
Obtain the deployed sidecar's exact build commit from the operator. The node exposes v4.1.1 but an empty commit field. Keep the reviewed source pin separate from the live execution-client pin and runtime admission checks; do not relabel partial provenance as an attested deployment match.

## Prepare the demonstration without new broadcasts
```powershell
npm ci
npm test
Copy-Item evidence/live/2026-11-06/*LIVE_RPC_SUBMISSION-3a838bca.json runs/
node bin/framefuzz.mjs serve --cases examples/live/basic.mjs --rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --port 4177
```
Port 4177 is already serving the user-facing read-only dashboard in this session; do not start a duplicate listener. The six-case aggregate shows A/B/C and the boundary trio together. Explain that intended public rejection/alternative acceptance is a PASS. Export JSON, Markdown and replay; inspect raw payer/frame receipts and rule provenance.

## If another live run is requested
- Use the individual `examples/live/*.mjs` case files and README commands. Every path gets a fresh independently signed sender. Never rebroadcast saved raw bytes blindly.
- Verify authorized chain1337, sponsor code hashes/funding, Uniswap code, and current stake. A devnet reset may require redeployment/config updates.
- Deployment helper uses the original artifact and a devnet-only funding key from `FRAMEFUZZ_DEPLOYER_KEY`; it never fetches a genesis key. Keep all credentials out of commits.
- B must remain unstaked. C uses the existing staked fixture; no restaking is necessary. Do not stake B and silently invalidate later unstaked runs.
- Use `refresh` for read-only receipt updates. Preserve original responses and derived reports separately.

## Handoff and scope
Update checkpoint documents and commit coherent changes with one-line conventional messages. Keep ZIPs/raw key-bearing files ignored. No UI redesign, Arkiv, new sponsors or USDC/swap claims. Push only when authorized to the verified remote. Node20.12+ compatibility is declared; only Node22.13.0 has been executed here.
