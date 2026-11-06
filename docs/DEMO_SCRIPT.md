# FrameFuzz — four-minute judge presentation

Primary path: `node bin/framefuzz.mjs saved-demo --results runs/saved-demo --port 4177`. No wallet, funding or external service is required. Say **saved historical LIVE evidence** at the beginning. Do not run `--submit` while the experimental sidecar has a full disk.

## 0:00–0:35 — Problem and product

“FrameFuzz is a deterministic admission-rule testing and regression platform for EIP-8141 frame transactions. Valid signed configurations can have different public and alternative admission outcomes. A developer needs to know which rule rejects a configuration and whether a validation change breaks compatibility. We generate semantic variations, compare real decisions and share reproducible fixtures.”

Point to Generate → Compare → Inspect → Publish/Discover → Import → Replay Preview. These are semantic model/setup mutations, not corrupted signed bytes.

## 0:35–1:25 — Generated rules and real evidence

The default saved run is the seed42 gas campaign. Show payer gas67198,67202,67200 and additional offsets around67200. Explain the total cap: sender30000 + signature2800 + payer67200 =100000. Fourteen independently signed historical submissions matched expectations; eight included successfully, six were rejected above the cap. Inspect an accepted row and an above-cap row. Returned admission hashes and computed-only rejected hashes are labeled separately. Open rule metadata and actual receipts.

Optional click: Preview mutations with the same seed/count. It regenerates unsigned semantics locally; new preview rows are INCONCLUSIVE/not_checked, never newly executed successes. Return to the saved LIVE run to show observed results.

## 1:25–2:15 — Why Uniswap-aware sponsorship needs compatibility tests

Select the historical report ending `3a838bca.json`. Inspect `staked-baseline-50000`: public rejects StorageReadNonSender; alternative admits and has an included-success receipt. This intended difference is a PASS, not a vulnerability. Contrast the unstaked pool-read case, rejected by both paths, and basic sponsorship, accepted by both.

Show `vendor/paymaster/ReserveReadingPaymaster.sol:33`, where VERIFY calldata0x01 invokes StateView.getSlot0. The call reaches external PoolManager storage. Addresses/hashes are pinned and checked. Current devnet slot0 is zero/uninitialized, so the read is genuine but does not establish active-pool pricing. No swap or USDC reimbursement was performed.

State the current limitation: “The new generated storage campaign reached six real submissions, but two expected-accept alternatives hit a remote full-disk error after validation. We preserve that as infrastructure failure and use clearly labeled successful historical evidence for this demonstration.”

## 2:15–3:05 — Shared Arkiv regressions

Offline route: choose `saved-arkiv-import-preview.json`. Show its `communityOrigin` in exported JSON/Markdown/replay: original creator/current owner, entity key, expiry and original outcomes remain separate from the new preview. Explain that this is a previously verified query/import, not a fresh network request. Community discovery is intentionally disabled offline.

Online route, only if Rabdi is reachable: use the normal `serve` command, open Community Cases, query `uniswap-storage`, select the actual row, inspect wallet owner/expiry/contracts/digest, and import. This read/import needs no signing wallet. Entity: `0x6779cf38a4398eb90da94b11885e691b84a6bb09dda59974cf5b8f1a21db773e`. The original successful gas fixture is also discoverable under verification-gas. If the service is unavailable or the entity expired, return to saved proof and say so.

## 3:05–4:00 — Reproduction and value

Show a PREVIEW with zero broadcasts and UNKNOWN local rule confidence. Original LIVE outcomes are publisher claims. Reproduction regenerates the semantic test, with fresh accounts/signatures needed for a separately authorized future live run. It never reuses old nonces/signatures or auto-broadcasts community data.

“Developers can discover a fixture by rule or implementation, inspect why it matters and reproduce its inputs locally. Arkiv supplies shared searchable wallet-owned fixtures with explicit expiry; Git keeps the permanent source and full historical evidence. FrameFuzz turns real admission observations into reusable compatibility regressions.”

Close on the generated evidence guide and71 passing tests. Human Uniswap feedback submission and repository push remain pending; do not claim either was completed. See SUBMISSION_CHECKLIST.md.
