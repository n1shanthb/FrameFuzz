# FrameFuzz

**FrameFuzz is a deterministic admission-rule testing and regression platform for EIP-8141 frame transactions.**

Frame transactions can behave differently across public and alternative mempool admission policies. Developers need to know which transaction configurations will be admitted, which rules reject them, and whether a change in their contracts or validation setup breaks compatibility.

FrameFuzz generates semantic transaction variations, signs and submits them to supported admission paths, classifies expected versus observed rule decisions, and publishes reusable regression cases for other developers to inspect and replay. It mutates unsigned models rather than corrupting signed bytes. Real RPC results, receipts and runtime provenance support the verdicts; an intended policy difference is not a discovered vulnerability.

**Workflow:** Generate → Compare → Inspect → Publish/Discover → Import → Replay Preview.

## Quickstart — no wallet or devnet required

Experimental owned-validator work is disabled by default behind `FRAMEFUZZ_SWARM=on`. Four real Sonnet calls drove two independently reproduced OFFLINE_SIGNATURE_BINDING experiments. No owned-validator EVM execution or vulnerability is claimed. The completion sprint preserves the 107-test baseline; see BUILD_STATUS.md for current verification.

Requires Node20.12+; tested on22.13.0. From this repository:

```powershell
npm ci
npm test
node bin/framefuzz.mjs saved-demo --results runs/saved-demo --port 4177
```

Open http://127.0.0.1:4177. The offline demonstration copies committed historical LIVE reports and a previously imported Arkiv PREVIEW into a local library. Network checks, live submissions and current Arkiv discovery/import are disabled. Select the gas campaign, the historical Uniswap report, or `saved-arkiv-import-preview.json`. Preview mutations still generates unsigned local scenarios. Saved evidence is never presented as a fresh execution or current registry query.

For current Arkiv discovery, stop that server and use `node bin/framefuzz.mjs serve --results runs --port 4177`; public reads require no funded wallet. Real reads still depend on Rabdi availability and entity expiry. The experimental EIP-8141 sidecar last reported a full disk; do not repeat live campaigns until its operator confirms recovery.

Start here: [generated LIVE evidence matrix](docs/LIVE_EVIDENCE.md), [four-minute demo](docs/DEMO_SCRIPT.md), [submission checklist](docs/SUBMISSION_CHECKLIST.md), [project description](docs/PROJECT_DESCRIPTION.md), [recording guidance](docs/RECORDING_GUIDE.md), [developer feedback](FEEDBACK.md).

## Architecture

`semantic definition + seed → unsigned model/setup → fresh signer adapter → public/alternative gateways → rule-aware classifier → receipt/evidence exports`.

The generator and confidence-aware oracle are pure modules under `src/mutations/`; `src/adapters/` checks deployment/stake/nonce/funding state and reuses the proven frame codec. The runner separates admission from execution. `src/arkiv/` publishes sanitized portable descriptors, queries indexed metadata and verifies retrieved schema/digests/ownership/expiry. Community imports feed only constrained semantic data to the existing generator as PREVIEW; they cannot supply executable plugins, RPC configuration or stale signatures. The existing localhost dashboard exposes this workflow. Full reports remain offchain in Git; their digests and selected summaries accompany the onchain fixture.

**Verified November 6, 2026:** seven generated gas variants produced **14/14 matching live decisions**, eight included successfully and six expected cap rejections. **71 automated tests passed at that historical checkpoint**, retaining all previous tests. Historical Uniswap baseline cases show basic ACCEPT/ACCEPT, unstaked pool read REJECT/REJECT and staked pool read REJECT/ACCEPT with successful historical receipts. The new generated Uniswap campaign made six real submissions: four expected decisions, two sidecar disk failures, zero new confirmed inclusions and zero genuine rule discrepancies. Historical evidence is unchanged. No USDC reimbursement, swap settlement or mainnet EIP-8141 support is claimed.

## Arkiv Community Cases — real testnet registry

Additional real Uniswap fixture: `0x6779cf38a4398eb90da94b11885e691b84a6bb09dda59974cf5b8f1a21db773e`; creation transaction `0x44f0084455b54724624fffd3e2c186986146d316c5d6bf27207409872acc9ec2`, successful Rabdi receipt, expiry block570761. Query: `node bin/framefuzz.mjs arkiv query --suite uniswap-storage --rule STORAGE_ACCESS`. It records actual contract/stake references and the new campaign's honest INFRASTRUCTURE_FAILURE outcome; it does not claim the failed staked attempt was admitted. Both this and the original gas entity were re-fetched and safely imported from fresh processes during final verification. No additional signing key remains configured after the in-memory writer session ended; no extra MAX_VERIFY_GAS rejection entity was published.

FrameFuzz now publishes sanitized semantic regression fixtures, discovers cases across developers, verifies their integrity and opens a selected fixture in the existing mutation runner as an unsigned **PREVIEW**. The real publish → fresh-process query → retrieve → dashboard import → preview cycle succeeded. No EIP-8141 transaction is broadcast by community import.

- Network: **Arkiv Rabdi, chain 7794095**, RPC `https://rpc.rabdi.db-chain.testnet.arkiv.network`, test gas tGLM, SDK `@arkiv-network/sdk@1.0.1`. The EIP-8141 devnet remains separate on chain 1337.
- Writer wallet: `0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715`.
- Real entity: `0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1`.
- Creation transaction: `0x0158db1bec0a20a8671ba18d0d9776b437a6a5cdb18970948a6c51d8fe5e8388`, successful receipt at block267241. Entity expires at block569638 (selected approximately seven days).
- Public query/import requires no wallet. The UI explicitly identifies anonymous unsigned reads and displays each case's publisher, immutable creator and current owner. An optional reader address is only a label, never authenticated ownership.

```powershell
node bin/framefuzz.mjs arkiv query --suite verification-gas --rule MAX_VERIFY_GAS
node bin/framefuzz.mjs arkiv fetch --key 0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1
node bin/framefuzz.mjs arkiv import --key 0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1 --results runs
node bin/framefuzz.mjs serve --results runs --port 4177
```

Open **Community Cases**, Query Arkiv, select a case, then **Open selected case as replay PREVIEW**. Optional query filters are `--implementation`, `--owner` and `--limit` (maximum20). Expired records and invalid payloads cannot be imported. Query/fetch/import use the official SDK directly with no local registry cache. See [the exact publish command and walkthrough](arkiv/how-you-use-arkiv.md).

For a new publish, securely configure a separate funded test wallet as `ARKIV_PRIVATE_KEY`; optionally set `ARKIV_ACCESS_KEY` for the SDK RPC. Publishing requires explicit `--submit` and writes only to Rabdi. The demonstration writer key was kept in memory and is not distributed in this repository. Never reuse chain1337 signing/funding configuration for Arkiv.

Arkiv stores the actual portable semantic descriptor, indexed suite/rule/version metadata, content digest and selected original outcome/receipt summaries. Full historical evidence stays offchain in Git, identified by SHA-256; it is not all uploaded to Arkiv. Publisher LIVE labels are claims, not independently attested facts. Imported outcomes are new UNKNOWN-confidence previews; historical claims remain separately labeled under `communityOrigin` in exports. Signatures/nonces are never reused.

Shared indexed fixtures let another developer find a relevant rule/version without knowing a repository's layout. Wallet ownership supplies attribution and a filterable current owner. Expiration stops stale devnet assumptions from remaining replay candidates indefinitely. Local JSON remains useful for private experiments; GitHub remains the permanent source/evidence archive. Arkiv adds shared discovery and bounded fixture lifetimes. No external adoption or testimonials are claimed.

Sponsor documentation: [schema](arkiv/schema.md), [friction](arkiv/friction.md), [reach](arkiv/reach.md), [why Arkiv](arkiv/why-arkiv.md), [how it is used](arkiv/how-you-use-arkiv.md). Real receipt, fresh-process query and dashboard preview evidence: [evidence/arkiv/2026-11-06](evidence/arkiv/2026-11-06/).

License: **MIT**, see [LICENSE](LICENSE); bundled upstream sources retain their notices. AI was used for implementation, documentation, test design and execution assistance. Actual testnet receipts and saved evidence support live claims; AI-generated or mocked data is not labeled live.

## Generate and run mutations

```powershell
# Fully offline: unsigned models, rule expectations, coverage and replay descriptors
node bin/framefuzz.mjs mutate --suite verification-gas --seed 42 --count 7 --preview
node bin/framefuzz.mjs mutate --suite uniswap-storage --seed 42 --count 3 --preview
# Explicitly authorized controlled batch on the configured chain-1337 devnet
node bin/framefuzz.mjs mutate --suite verification-gas --seed 42 --count 7 --submit --allow-chain 1337
```

Seed 42 generates payer limits 67198, 67202, 67200, 67210, 67201, 67190, 67199 in that order. Expectations are calculated from sender gas + payer gas + signature cost. Low validation budgets are treated separately from cap violations. The storage suite derives basic/no-read, unstaked/read and staked/read variants from one setup specification, reusing the real sponsor/state checks.

Definitions include a base template, semantic operation, rule model, constraints, seed/count and target paths. The same seed regenerates the same semantic sequence; fresh accounts/signatures remain intentionally independent. Larger offline sweeps sample additional seeded offsets. At most seven selected variants can be submitted in one live invocation. Rule confidence is VERIFIED, INFERRED or UNKNOWN; inferred/unknown deviations cannot become claimed protocol findings.

The existing dashboard now has suite/seed/count, an offline preview button, generated parameter rows and per-rule/per-path coverage. Its submit button requires the server's explicit `--submit` authorization and matching chain configuration. Start read-only to inspect saved results. New campaign evidence and replay exports are in [evidence/mutations/2026-11-06](evidence/mutations/2026-11-06/); see [docs/MUTATIONS.md](docs/MUTATIONS.md) for definitions, oracle behavior and bounded opt-in shrinking.

```powershell
node bin/framefuzz.mjs mutate --replay evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.replay.json --variant 0 --preview
```

## Open the real evidence dashboard

Requires Node.js **20.12+**; tested with **22.13.0**.

```powershell
Set-Location E:\ethglobalmumbai
npm ci
npm test
# Restore committed evidence into the ignored local dashboard library:
Copy-Item evidence/mutations/2026-11-06/*LIVE_RPC_SUBMISSION-947a7e01.json runs/
node bin/framefuzz.mjs serve --cases examples/live/basic.mjs --rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --port 4177
```

Open [the dashboard](http://127.0.0.1:4177). Select the seven-variant generated LIVE run, inspect public/alternative outcomes, coverage and receipts, and download JSON, Markdown or replay. The historical six-case report can also be copied from `evidence/live/2026-11-06/`. This command is read-only: it cannot submit transactions. `npm start` also displays saved evidence but does not configure a network status check. MOCK, PREVIEW and SYNTHETIC runs retain separate labels.

Full receipts, replay inputs, deployment record, and real sidecar admission checks are committed in [evidence/live/2026-11-06](evidence/live/2026-11-06/). [BUILD_STATUS.md](BUILD_STATUS.md) records complete hashes and exact executed commands.

## Run a small live test

The current nonsecret chain configuration and deployed sponsor code hashes live in `examples/live/devnet.json`. Devnet resets can invalidate them. The adapter checks chain ID, authorized endpoint, sponsor code, funding, stake, fresh zero-ETH sender and pending nonce before signing. It uses the actual pinned workshop codec/signing package.

```powershell
node bin/framefuzz.mjs run examples/live/basic.mjs --public-rpc https://altmempool.forshtat.com/rpc --alt-rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --submit --receipt-wait-ms 12000
```

Use `examples/live/unstaked.mjs`, `examples/live/staked.mjs` or `examples/live/verification-gas.mjs` instead for the other suites. Omit `--submit` for a chain-checking preview with no setup/signing/submission. Use individual files; `examples/live/` also contains configuration/helpers and is not a fixture directory. Keys for fresh sponsored senders are generated in memory and never exported. Existing sponsors pay their gas; these sends need no funding key.

The canonical path uses `eth_sendRawTransaction` with encoded type-0x06 bytes; the alternative path uses `eth_sendFrameTransaction` with the codec's structured wire object. Both can use the same gateway URL while exercising distinct admission methods. Every path gets a different sender/signature, so duplicate submission cannot masquerade as policy divergence.

Verification-gas cases set payer VERIFY execution gas to **67199 / 67200 / 67201**. Sender VERIFY contributes 30000 and secp256k1 signature verification contributes 2800, yielding total budgets **99999 / 100000 / 100001**. Both real paths accepted below/at and rejected above. The intended staked public/alternative difference is a PASS, not a vulnerability.

## Setup and receipts

`vendor/paymaster/` contains the original supplied reserve-reading source and compiled artifact. To deploy a fresh unstaked fixture, set `FRAMEFUZZ_DEPLOYER_KEY` in your terminal environment to a funded **devnet-only** key, then run `node bin/deploy-reserve.mjs`. This spends 0.15 devnet ETH creation value plus gas and updates the nonsecret config/deployment evidence. Do not put the key in source, command arguments, reports or commits. The adapter can reuse the existing verified stake; it does not restake an unstaked fixture automatically.

To refresh receipts and reclassify captured errors **without resubmitting**:

```powershell
node bin/framefuzz.mjs refresh PATH_TO_LIVE_REPORT.json --rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --receipt-wait-ms 1000
```

Admission and inclusion are independent. Inspect receipt status, payer and frame receipts. Rejected transactions have computed hashes for inspection, not mined transaction claims. Replay exports retain structured RPC parameters and signed raw bytes; rebuild with fresh state rather than rebroadcasting stale nonces.

CLI exits: `0` all admission cases matched, `2` unexpected verdict, `3` incomplete/inconclusive/transport result, `1` configuration/safety failure. Evidence preserves precondition errors separately from rule mismatches.

## Mock tests and custom integration

`npm run demo:mock` uses two local fake gateways and fictional JSON-encoded inputs; it never signs Ethereum transactions. `npm run demo` generates static SYNTHETIC UI data. Neither is live proof. Automated tests include real signature recovery/codec roundtrips plus mocked transport/setup tests; they never broadcast externally.

Custom integrations use [docs/ADAPTER.md](docs/ADAPTER.md). Generic provenance-driven scenarios remain available with `--scenario`, `--adapter`, `--rules`, `--case`, and `--mutation`. `FRAMEFUZZ_PUBLIC_RPC`, `FRAMEFUZZ_ALT_RPC` and `FRAMEFUZZ_RPC` avoid credential-bearing endpoint arguments. The live fixtures directly bind the supplied PoC and preserve the sidecar deployment-provenance limitation instead of falsely declaring an exact source match.

## Source and limits

See [vendor/README.md](vendor/README.md) for imported artifact and dependency provenance. The execution client reports `9aa3645d795945c64400f41a70aace0edfa7f383`. Sidecar v4.1.1 exposes no commit, so the reviewed sidecar source is not claimed to be an attested build match. Actual runtime storage and gas-limit admission checks are saved with the LIVE evidence.

Only authorized local/devnet chains; mainnet is blocked. No high-volume gateway testing, fabricated receipts, Arkiv, unrelated sponsors, swap or reimbursement work. ZIPs and raw key-bearing PoC files are ignored; key-free imported references and actual evidence are committed.

## Repository and IDE handoff

`src/mutations/` holds the deterministic generator, transparent oracle and campaign compiler; `rules/` holds versioned evidenced models. `src/adapters/` holds the proven codec/live/setup integration. `src/runner.mjs`, `rpc.mjs`, `verdict.mjs`, `refresh.mjs`, and `reports.mjs` handle execution/evidence. `test/` contains 58 tests; `web/` is the existing dashboard with minimal engine controls. `evidence/live/` preserves the original six cases; `evidence/mutations/` preserves the new automatic campaign. `vendor/` retains original artifact/source provenance.

Read [AGENTS.md](AGENTS.md), [AUTHORITY.md](AUTHORITY.md), [CURRENT_STATUS.md](CURRENT_STATUS.md) and [UP_NEXT.md](UP_NEXT.md) when changing IDEs. Cursor's always-applied rule loads the same handoff. Use coherent, frequent conventional commits.

## OpenRouter offline investigator

Opt in with `FRAMEFUZZ_SWARM=on`, configure `OPENROUTER_API_KEY` in the launching terminal and select `OPENROUTER_MODEL=anthropic/claude-sonnet-4.6` (or `sonnet`). Run `node bin/framefuzz.mjs swarm investigate --mode openrouter`, or open Swarm Lab on the normal dashboard and authorize bounded model requests. No blockchain writes are available. [Investigator setup, budgets, exports and replay](docs/INVESTIGATOR.md).

The implemented loop uses one model with three specialist perspectives and an observation-conditioned follow-up. Results are OFFLINE_SIGNATURE_BINDING, not EVM execution or a verified vulnerability. The real Sonnet4.6 demonstration completed four validated model calls, two model-selected experiments and independent descriptor replays; 93 tests passed at that historical checkpoint. Evidence: `evidence/investigator/2026-11-06/sonnet-retry-2.json`. This proves offline signature binding only. [Current live compatibility blockers](docs/LIVE_COMPATIBILITY_AUDIT.md).

### Isolated self-funded candidate

`swarm self-funded-readiness` prepares a two-frame sender-as-payer variant using the actual Sonnet descriptor. It removes the separate PAYMENT sponsor from this candidate, but remains PLAUSIBLE_UNVERIFIED with no live execution.107tests pass. [Feasibility, funding caps and alternative devnet observations](docs/SELF_FUNDED_FEASIBILITY.md). Original sponsored flow remains intact.

## Offline preview and saved investigation

`npm run run:preview` generates seven unsigned variants without credentials or RPC.
`node bin/framefuzz.mjs saved-demo --results runs/saved-demo --port 4191` restores historical LIVE reports, the community PREVIEW and the genuine Sonnet transcript. Set `FRAMEFUZZ_SWARM=on` before launching to view the saved transcript; no API key is needed and provider requests are disabled in saved-demo.

Execution is limited to explicitly selected chain 1337 or local 31337; Arkiv uses its separate Rabdi client. Standalone reserve deployment additionally requires `--submit --allow-chain 1337`; this sprint authorizes no deployment.

Completion sprint verification: **119 passing tests**,57 syntax-checked modules. [Pass0/Pass1 dispositions and remaining limits](docs/COMPLETION_SPRINT.md).
