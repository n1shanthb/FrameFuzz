# Current status

**November 6, 2026 (IST)** · `E:\ethglobalmumbai` · branch `feat/framefuzz-mvp`. This replaces earlier missing-PoC checkpoints. Inspect Git status/log before editing.

## Actual completed result
- LIVE adapter uses actual `@forshtat/hegota-support@0.0.1` / `viem@2.57.7` encoding/signing, adapted from supplied PoC and pinned workshop source.
- Basic sponsored transaction: canonical and alternative **PASS**, both included with status 1 and paymaster payer.
- Fresh unstaked Uniswap pool reader: canonical and alternative **PASS**, both rejected for foreign storage access.
- Existing staked pool reader: canonical expected rejection and alternative acceptance **PASS**; alternative included with status 1.
- Verification gas: three independently signed below/at/above cases through both paths, **six live submissions**, all matched.
- Total **six cases / twelve admission submissions**, plus one separate reserve deployment. Seven accepted frame transactions have successful receipts; five were rejected as expected.
- Full JSON/Markdown/replay evidence, raw receipts and actual sidecar rule-by-rule admission checks are committed under `evidence/live/2026-11-06/`.
- **37 tests passed** on Node 22.13.0 after integration, including real signature recovery and mocked setup/transport/refresh tests. Tests never send externally.

## Contracts and network
Chain 1337, gateway `https://altmempool.forshtat.com/rpc`; execution root `https://altmempool.forshtat.com`. The gateway provides distinct public raw and alternative structured methods. Plain sponsor `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; existing staked reader `0x552e75d45ee70f09ff69f465ddc4264e6ee31396`; newly deployed unstaked reader `0x3d66c53105be7930fd89571157a41137c12b003f`. Code hashes and Uniswap StateView/pool configuration are in `examples/live/devnet.json`.

The fresh fixture was deployed from the supplied original artifact with 0.15 throwaway devnet ETH creation value. The supplied test-only deployer key was passed through the process environment and removed afterward; it was never logged or committed. Fresh sender keys are ephemeral memory-only. No genesis fallback was used. Raw key-bearing PoC extraction and all ZIPs are ignored.

## Dashboard
Running read-only at `http://127.0.0.1:4177` with real gateway configuration. Browser verified the aggregate LIVE run, all six matches, genuine hashes/receipts, actual unstaked storage rejection, download links, and both gateways ready on chain1337. No frontend files were changed during live integration. Keep this user-facing server running unless the user requests otherwise.

## Provenance and limitations
Execution client commit `9aa3645d795945c64400f41a70aace0edfa7f383` verified live. Sidecar reports v4.1.1 but an empty commit; exact build/source equivalence cannot be asserted. Reviewed sidecar source and runtime checks are preserved separately. No security vulnerability, USDC reimbursement, swap, Arkiv or additional sponsor work is claimed. No new staking transaction was needed: the C fixture already had a verified active stake.

## Resume
Core live definition of done is met for this devnet snapshot. Next: confirm the sidecar build commit with its operator and prepare the saved-evidence demo; see `UP_NEXT.md`. Devnet resets/funding depletion can invalidate fixtures. Do not repeat broadcasts just to demonstrate saved results. Full commands, hashes and receipt blocks are in `BUILD_STATUS.md`. Commits are local; no push in this session.

## Mutation-engine checkpoint
Added deterministic unsigned-model generation, versioned observed-rule oracle, evidence digest binding, per-path setup compilation through the existing LIVE adapter, offline preview, coverage, reproduction descriptors and bounded opt-in shrinking. Fifteen new engine tests pass; historical evidence is untouched. CLI/export/dashboard wiring is in progress; the new automatic sweep has not yet been broadcast. Next: complete integration tests, then execute at most seven gas variants on both paths.

## Automatic campaign result
The new mutate command generated seven seed-42 gas variants and submitted fourteen independently signed path tests. All seven cases / fourteen decisions matched; eight admitted transactions have successful receipts after read-only refresh; six cap rejections are expected. No discrepancy occurred. CLI replay, dashboard preview/export, storage setup and historical evidence compatibility are tested. Next: browser-check the updated console, preserve new campaign evidence separately, run final suite/mock demo and finish documentation.
