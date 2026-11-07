# Current status — premium React UI + live admission product

## Final shipping UI — 2026-11-07

- React Playground and Comparisons now load the verified Uniswap record through `/api/playground/uniswap-captured` and label it `CAPTURED_LIVE_EVIDENCE`; no verdict is hardcoded into components and viewing it performs no transaction.
- Operator-only `/api/playground/uniswap-prepare` verifies the exact editor source SHA-256, deployed paymaster runtime, stake, balance/nonce, StateView/PoolManager hashes and binding, then creates a new run ID and independently signed candidate with zero broadcasts. Existing confirmation/run orchestration remains the only write gate.
- Production UI build passes. Focused shipping/admission suite: 13/13. Full default-concurrency suite registered 241 tests but the constrained host produced widespread localhost fetch/startup failures; do not claim a clean full suite from that run.
- Main submission, EF, Uniswap, Arkiv, feedback, proof/address, and demo docs now lead with the final Uniswap divergence. Swarm Bee remains explicitly not implemented.

## Submission & sponsor audit — 2026-11-07

- Judge package written under `docs/submission/*` and `docs/sponsors/*`; `arkiv/swarm.md` declares Swarm storage **NOT IMPLEMENTED**.
- README rewritten for ETHGlobal judges; FEEDBACK.md remains **form NOT SUBMITTED**.
- Verified evidence in-tree: storage-access `0xf69e0f4b…` (admit 1647 → DROPPED); Uniswap `0x72a82645…` LIVE; Arkiv entity `0xf1089c05…` / tx `0x007bd10f…`.
- GitHub origin anonymous HEAD → **404** (public access not verified). `npm test` → **236/239** pass.
- No broadcast, deploy, fund, push, OpenRouter spend, or external form submit in this pass.
- Next: human portal P0 actions in `UP_NEXT.md`.

## Final Uniswap admission — 2026-11-07

### Live completion

- LIVE policy divergence achieved for candidate `0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067`: canonical ethrex rejected `StorageReadNonSender`; Skandha admission 2065 accepted and included it; receipt status and all three frame statuses are `0x1`.
- Paymaster `0x3df63DFD230156C3656Bd4448326482030c31f96` deployment `0xddd9925994b02afe443f9804fb2f361aa595e2509b1d98b5339d57b040694032` matches the exact compiled runtime. Corrected nonce-8 stake `0x88f2a4ec59df362a47ee65e20f4430495763e8be567de3ab014d0657ccbed251` is included with 0.01 test ETH and 86400 delay.
- Skandha initially rejected the candidate for payer funding while retaining the included stake liability. A direct transfer and a 100k-gas force-send reverted; both are preserved as setup failures. Successful force top-up: `0xb9193318f8f17e8d06a8a47c207e6d5b0b0fcd1457d5a020bf01b50675ee310e`.
- Consolidated immutable evidence: `evidence/live/2026-11-07/uniswap-policy-divergence-final.json`. This proves validation-time `StateView.getSlot0`, not a Uniswap swap or reimbursement.

- Read-only chain refresh resolved the predicted-address collision: `0x6d5bED568904290fCA0b8d4e99Bed2a7F9D44145` is the already-deployed `Foreign` fixture from operator nonce 2, not a reusable ReserveReadingPaymaster.
- Operator `0x366E6203603C39Eec1e75b3be6f078911447f235` is at pending nonce 4 with `0.962660082` test ETH. No funding transfer is needed.
- Fresh predicted paymaster: `0x3df63DFD230156C3656Bd4448326482030c31f96` (confirmed empty at preflight).
- Offline-signed identities: deployment `0xddd9925994b02afe443f9804fb2f361aa595e2509b1d98b5339d57b040694032`; stake `0x1c9495f21d67ee1ee83fc69b19ea7564d6b0fe8b66f5766fba5e2e33b41ba2b8`; policy candidate `0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067`.
- Fixed maximum exposure is `0.025337377` test ETH, below the operator's unchanged `0.026087377` ceiling. Writes/broadcasts: zero.
- Exact source digest, compiler settings, creation data, runtime simulation, StateView binding and signed requests are saved under `runs/final-uniswap-preflight.json` and `evidence/prepared/2026-11-07/final-uniswap-*.json`.
- React Playground live button remains wired to the demonstrated `ViolatingWallet` scenario. Uniswap StateView divergence is **LIVE in evidence/scripts**; a single Playground one-click Uniswap flow is still optional P2 wiring, not a blocker for sponsor evidence maps.

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
