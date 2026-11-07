# Current status — premium React UI + live admission product

## Final Uniswap admission preflight — 2026-11-07

- Read-only chain refresh resolved the predicted-address collision: `0x6d5bED568904290fCA0b8d4e99Bed2a7F9D44145` is the already-deployed `Foreign` fixture from operator nonce 2, not a reusable ReserveReadingPaymaster.
- Operator `0x366E6203603C39Eec1e75b3be6f078911447f235` is at pending nonce 4 with `0.962660082` test ETH. No funding transfer is needed.
- Fresh predicted paymaster: `0x3df63DFD230156C3656Bd4448326482030c31f96` (confirmed empty at preflight).
- Offline-signed identities: deployment `0xddd9925994b02afe443f9804fb2f361aa595e2509b1d98b5339d57b040694032`; stake `0x1c9495f21d67ee1ee83fc69b19ea7564d6b0fe8b66f5766fba5e2e33b41ba2b8`; policy candidate `0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067`.
- Fixed maximum exposure is `0.025337377` test ETH, below the operator's unchanged `0.026087377` ceiling. Writes/broadcasts: zero.
- Exact source digest, compiler settings, creation data, runtime simulation, StateView binding and signed requests are saved under `runs/final-uniswap-preflight.json` and `evidence/prepared/2026-11-07/final-uniswap-*.json`.
- The current React Playground live button remains wired only to the already-demonstrated `ViolatingWallet` scenario. The Uniswap packet is valid preparation evidence, but the requested compile/setup/compare sequence is not yet exposed as a single Playground UI flow; do not claim demo readiness until that small wiring is completed.

FrameFuzz now ships a React + TypeScript + MUI + Lucide product UI while preserving all backend admission APIs.

## UI
- App: `web-ui/` → build output `web/dist/`
- Shell: sidebar nav (Overview, Playground, Comparisons, Campaigns, Evidence, Agents, Arkiv, Readiness, Briefing)
- Flagship: Contract Playground with source → analyze → agents → public/alt comparison → save regression
- Context line: “Live analysis enabled · chain writes require authorization” (not a global READ ONLY blocker)
- Browser verified on `:4190`: Overview metrics from real runs; Playground load+analyze against backend; readiness cards independent

## Live product claims (unchanged)
ADMISSION_DIVERGENCE=TRUE · INCLUSION=FALSE · EXECUTION_SUCCESS=NOT_OBSERVED for reference capture `0xf69e0f4b…e31d`.

## Launch
```bash
npm run ui:build
node --env-file=.env bin/framefuzz.mjs serve --mode LIVE_READ_ONLY --results runs --port 4190
```
For live writes: `--mode LIVE_AUTHORIZED` with operator key. Dev proxy: `npm run ui:dev` (proxies `/api` to :4190).

## Tests
dashboard + saved-demo + storage-access-product pass after React shell updates. No broadcast / OpenRouter spend / push in this pass.
