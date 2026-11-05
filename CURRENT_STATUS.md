# Current status

**November 6, 2026 (IST)** · `E:\ethglobalmumbai` · branch `feat/framefuzz-mvp`. Inspect Git status/log before edits. Latest task: finish the deterministic semantic mutation engine, not rebuild the proven integration.

## Completed engine
- Pure seeded unsigned-model generation from one base definition: gas-boundary sweeps and Uniswap storage/stake setup states. Versioned rule model, definition digest and deterministic semantic reproduction descriptors.
- Oracle calculates total verification gas, sufficient-execution prerequisites, per-path storage policy and VERIFIED/INFERRED/UNKNOWN confidence. Missing/tampered evidence, changed fixture hashes or live client-version differences cannot produce false verified findings.
- Generated paths compile through the existing real signer/adapter with fresh isolated senders, nonce checks and sponsor setup/funding/stake validation. No signed-byte mutation.
- Offline previews perform no RPC, setup, key generation or signing. Live batch limit: seven selected variants per invocation.
- CLI `mutate`, semantic replay/variant selection, JSON/Markdown/replay exports, rule coverage and self-contained descriptors. Bounded opt-in monotonic shrinking is tested offline; it never probes automatically.
- Existing dashboard now has minimal suite/seed/count/preview/authorized-run controls, parameter rows and coverage/drill-down. No redesign.

## New automatic LIVE execution
Seed 42/count7 generated payer values **67198, 67202, 67200, 67210, 67201, 67190, 67199**. Fourteen independently signed submissions through public/alternative paths: **14 matches, zero discrepancies/precondition/transport failures**. Eight accepted transactions have successful receipts; six above-cap rejections are expected. Each path covers three below, one at and three above. Actual sidecar admission reports and complete hashes/receipts are preserved.

Second family: three generated basic/unstaked-read/staked-read states previewed in browser and tested with adapter/signing/setup and mock transport. No new storage-family live campaign was sent; the original real storage proof remains intact.

## Verification and evidence
- `npm test`: **58 passed / 0 failed**, including original 37; Node22.13.0, loopback enabled.
- `npm run demo:mock`: 6/6 mock matches. No external broadcasts from automated tests.
- New evidence: `evidence/mutations/2026-11-06/manifest.json`; original capture, receipt-refreshed LIVE JSON/Markdown/replay and storage PREVIEW exports.
- `evidence/live/2026-11-06/` remains byte-for-byte unchanged in Git. Do not modify or relabel it.
- Browser verified offline storage preview, source labels, actual generated rows, and LIVE seven-variant/14-decision rule coverage. Dashboard at `http://127.0.0.1:4177` remains read-only and running. Keep it running unless the user requests otherwise.

## Preserved live integration
Chain1337 gateway `https://altmempool.forshtat.com/rpc`, execution root `https://altmempool.forshtat.com`. Existing basic sponsor, fresh unstaked reserve and existing staked reserve/code hashes/StateView/pool remain configured in `examples/live/devnet.json`. The original A/B/C and three gas variants previously matched with seven successful receipts. No signer, contract or staking fixture was rewritten for this engine.

## Limits and resume
No unexpected result or protocol bug was found. Sidecar v4.1.1 exposes no deployed commit; VERIFIED confidence refers to observed fixture-bound rules, not an attested sidecar build. Unknown minimum-gas thresholds remain unknown/inferred. Shrinking is a bounded library utility with an explicit predicate, not automatic live delta debugging. Node20.12+ has not been executed. No Arkiv, swap settlement, Chainlink or new sponsors.

See `UP_NEXT.md`, `docs/MUTATIONS.md` and `BUILD_STATUS.md` for commands and exact evidence. Coherent feature/evidence/documentation commits are local; no push in this task. Do not rerun live campaigns merely to show saved evidence.
