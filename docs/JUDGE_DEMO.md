# Four-minute EF + Uniswap + Arkiv demo

For the final saved-evidence presentation, use [DEMO_SCRIPT.md](DEMO_SCRIPT.md). This document retains the integrated campaign's detailed limitations and operator-recovery command; it does not authorize retrying a failing gateway.

Current qualification: the product workflow is implemented, and the new Uniswap fixture is really published/retrieved/imported. **The full requested live acceptance demonstration is blocked by the remote sidecar's full disk.** The current generated campaign has six real submissions, four expected matching decisions, two infrastructure failures, no confirmed inclusion and zero genuine policy discrepancies. Do not narrate six matches or a new successful staked inclusion.

## Prepare without another broadcast

```powershell
node bin/framefuzz.mjs arkiv query --suite uniswap-storage --rule STORAGE_ACCESS
node bin/framefuzz.mjs arkiv import --key 0x6779cf38a4398eb90da94b11885e691b84a6bb09dda59974cf5b8f1a21db773e --results runs
node bin/framefuzz.mjs serve --results runs --port 4177
```

Open http://127.0.0.1:4177. Preserve the saved combined generated LIVE report and the original historical proof. The current seed42 definition orders variants as unstaked, staked, basic; UI ordering does not alter the three semantic configurations. Never confuse the published original LIVE claim with the newly imported PREVIEW.

## 0:00–0:35 — The developer problem

“A wallet sponsor can correctly call Uniswap's StateView yet fail admission because validation touches PoolManager storage. We test no-read, unstaked-read and staked-read conditions against public and alternative policies. The intended policy difference is a passing compatibility expectation, not a discovered bug.”

## 0:35–1:45 — Generated admission decisions

Select `2026-11-05T23-47-40-077Z-LIVE_RPC_SUBMISSION-b476d1a1.json`. Explain one semantic seed/definition generated all three setups and six independently signed paths. Show the public StorageReadNonSender rejections, unstaked alternative storage rejection and basic public acceptance. Show both alternative expected-accept attempts as INFRASTRUCTURE_FAILURE. Their sidecar reports reached the mempool persistence check and failed with No space left on device. Do not hide those rows.

After the operator repairs storage, the separately authorized command below can regenerate and sign another controlled six-path batch. It must produce its own new evidence and receipts; do not edit the failed run:

```powershell
node bin/framefuzz.mjs mutate --suite uniswap-storage --seed 42 --count 3 --submit --allow-chain 1337 --receipt-wait-ms 5000 --results evidence/integrated/2026-11-06
```

## 1:45–2:25 — Genuine Uniswap dependency

Show Solidity line33, pinned StateView/PoolManager hashes, current zero slot0 and the observed PoolManager storage slot `0xf6a862ad9e4b3f79dd2626ae081b3a49de5d55002e5339e1bdff7d8f5e202404`. The staked reserve's registry check records amount, delay and withdrawal state; the unstaked reserve is a different code-pinned deployment. The new campaign has no inclusion receipt. If demonstrating historical receipts, explicitly select and label the older evidence instead of presenting it as this campaign's execution.

## 2:25–3:15 — Arkiv discovery across processes

Show the successful creation receipt for entity `0x6779cf38a4398eb90da94b11885e691b84a6bb09dda59974cf5b8f1a21db773e` and transaction `0x44f0084455b54724624fffd3e2c186986146d316c5d6bf27207409872acc9ec2`. Query `uniswap-storage` from a fresh terminal or the restarted dashboard. Community Cases reads the official Rabdi SDK directly. Select the row to show wallet owner, expiry570761, actual outcome claims, verified code references and digest. No reader wallet authentication is implied by public reads.

## 3:15–4:00 — Safe reproducible regression

Click Open selected case as replay PREVIEW. Show staked/poolRead semantic setup and zero broadcasts. Imported confidence is UNKNOWN, new receipts are not_checked and original LIVE outcomes stay separately labeled. Export JSON/Markdown/replay; the descriptor regenerates semantics, not stale signatures. Expired records cannot be imported. The onchain descriptor is self-contained; raw reports remain offchain under a digest.

## What FrameFuzz adds beyond the official workshop

The [official workshop](https://docs.altmempool.wtf/guides/quickstart/) teaches hand-run staged transactions, staking and debug commands. FrameFuzz reuses its genuine signing/encoding, then adds seeded semantic mutation generation, stake/setup checks, isolated accounts, confidence-aware rule oracles, expected-versus-observed classification, independent inclusion status, saved rule reports, coverage and exportable regression descriptors. Arkiv makes those fixtures discoverable across developers and opens untrusted cases only as previews. This is a regression product built on the workshop, not a claim to have invented EIP-8141 signing or alternative admission.

Policy provenance: deployed execution version reports commit9aa3645d795945c64400f41a70aace0edfa7f383. Sidecar reports v4.1.1 but an empty commit; reviewed source is2e22ff0a2898e69ea4bf5275bce1be8581a8582a. Live storage rule reports support observed policy behavior; they do not attest that the deployed binary exactly matches the reviewed sidecar source. The devnet follows a draft; do not generalize to all future EIP-8141/ERC rules.

Human follow-up: review FEEDBACK.md and submit the official Uniswap feedback form. Submission has not been performed or confirmed. Push only with user authorization; local commits do not prove public repository availability.
