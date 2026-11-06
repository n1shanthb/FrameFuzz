# Build status — Arkiv regression registry and mutation engine

## Swarm milestone2 — read-only stop gate reached
Implemented guarded read-only RPC preflight and conditional deployment/submission manifest. Executed8 reads on the authorized chain1337 endpoints: matching execution commit9aa3645d795945c64400f41a70aace0edfa7f383, sidecar v4.1.1 with no commit, sponsor code hash matched and balance149175156000000000 wei, readable nonce-manager storage. Head0x63ac6 was19114 seconds old at capture; mining/write health is not established. No deployer key, deployer address or owner address was configured. No contract deployment, live EIP-8141 submission, LLM call, unauthorized action proof, independent live reproduction or Arkiv write occurred.

Manifest:5 zero-value deployments (action recorder and4 isolated owned validators), each capped6m gas/2gwei, aggregate deployment fee upper bound0.06 test ETH;4 subsequent alternative-path frame submissions with sender EXECUTION/payer PAYMENT and key0 sequence0 after protocol nonce checks. Missing addresses/initcode are null, not invented. Actual frame action proof and a specifically grounded safe authorization rejection are required before any finding; an outer receipt alone is insufficient. Additional independent live reproduction would require another approved context set.

Commands and artifacts in `docs/SWARM_MILESTONES.md`; actual report `evidence/swarm/milestone-2/preflight.json`, full83-test log and0-vulnerability npm audit in the same directory. All71 prior tests and v1 fixture digests preserved. Historical evidence diff against0b1040c is empty; generated evidence guide check passes. Milestone1 committed a1ff75a. Swarm remains disabled by default and CLI rejects write flags; no UI/LLM investigator/publication capability is claimed before the later milestones.

Stop before live approval as requested. Required: secure funded devnet-only wallet/owner addresses, confirmed healthy/mining service and write recovery, canonical-hash compatibility verification and separate explicit approval of the resolved manifest. The approved architecture document is not evidence of a completed live exploit. Existing submission-ready workflows remain intact; human feedback/video/submission and public repository visibility remain pending/unverified.

## Swarm milestone1 — offline, no live finding
Compiled owned unsafe/safe validators and ActionRecorder with exact solc0.8.28; creation bytecode4311/4206/508 bytes. Added v2 calldata mutation without modifying v1 definitions, explicit current-EIP versus workshop hash profiles, real ECDSA differential and closed deterministic false-positive classification. Swarm opt-in gate and write-flag rejection protect the existing product.79 tests passed, including all71 previous tests. Artifact: `evidence/swarm/milestone-1/offline.json`; no contract bytecode or frame lifecycle was executed. Source SWARM_SIMULATED — NO LLM. All live finding/reproduction/LLM claims are NO.

Baseline was safely pushed through0b1040c with remote SHA verified. Public HTTP branch URL returned404; no public visibility or sponsor form submission is claimed. Compiler install initially exposed tmp advisories; override tmp0.2.7 preserves solc0.8.28 and final install audit reports0 vulnerabilities. Current EIP signing-length/envelope differences are explicit; safe client canonical hash compatibility remains unverified. Exact milestone commands, test counts and limitations: `docs/SWARM_MILESTONES.md`. Next authorized action: read-only milestone2 preparation, then stop for separate live approval.

## Final submission polish — verified November6,2026 IST

- Clear independent product description and Generate → Compare → Inspect → Publish/Discover → Import → Replay Preview workflow in README/dashboard. No competitive research was imported; protocol/workshop/SDK attribution retained.
- `scripts/live-evidence.mjs` generates `docs/LIVE_EVIDENCE.md` directly from committed Git blobs and verifies unchanged working copies. It covers seven generated gas cases and three historical baseline Uniswap cases, with path expectations/observations, semantic/stake inputs, rule reports, returned versus computed-only hashes, receipt state and artifact paths. No explorer URL is invented.
- `.gitattributes` disables text/line-ending conversion under evidence/ so new checkouts preserve captured bytes and their digests across operating systems. Existing capture bytes were not rewritten.
- New `saved-demo` command copies the committed gas, historical Uniswap and previously imported Arkiv-preview reports into a dedicated result library and starts the existing dashboard with network routes disabled. It requires no funded wallet or reachable devnet. Browser verified actual saved historical staked difference/receipt, three unsigned generated storage previews and explicit saved timestamps. Automated offline test prevents live community/gateway requests even when RPC/submit options are present. Community expiry is not bypassed; archived proof is not advertised as a current entity query.
- Both gas/Uniswap entities re-fetched/imported through fresh SDK processes. Normal dashboard queried Uniswap suite from Rabdi and imported its real entity again with0 broadcasts. Owner and expiry visible; publisher outcomes remain separate from new UNKNOWN previews. Real proof and screenshots under `evidence/submission/2026-11-06/`.
- Completed `docs/DEMO_SCRIPT.md`, `docs/SUBMISSION_CHECKLIST.md`, `docs/PROJECT_DESCRIPTION.md`, `docs/RECORDING_GUIDE.md`, `FEEDBACK.md`, README install/architecture/license/AI disclosure and all five Arkiv sponsor docs. The human feedback form remains NOT SUBMITTED; neither GitHub push nor ETHGlobal/video submission was performed.
- `npm test`: **71 passed /0 failed**; actual log `evidence/submission/2026-11-06/tests.txt`. `node scripts/live-evidence.mjs --check`: matched committed captures. `git diff caf08c1 -- evidence/live evidence/mutations evidence/arkiv`: empty. Static literal signing-key assignment scan: no findings; this is not a cryptographic guarantee.

Executed final commands: `node scripts/live-evidence.mjs`; `node scripts/live-evidence.mjs --check`; `node --test test/saved-demo.test.mjs`; `npm test`; `npm test | Tee-Object -FilePath evidence/submission/2026-11-06/tests.txt | Select-Object -Last 9`; `node bin/framefuzz.mjs saved-demo --results runs/saved-demo --port 4177`. Current mode on port4177 is saved/offline with submissions disabled. Normal-mode browser and fresh-process SDK imports were executed before switching to offline mode; no additional EIP-8141 broadcasts occurred during polish.

Submission-ready saved demonstration: YES. Fresh successful generated Uniswap live acceptance/inclusion demonstration: still blocked by the remote disk-full sidecar; no repair inferred. Last read-only check returned no receipt for its accepted public candidate. Public repository verification, human feedback consent/submission, recording/upload and ETHGlobal submission remain human actions.

## Current generated Uniswap execution and submission polish

Three generated semantic setup variants, six independently signed real chain1337 submissions. Original capture: `evidence/integrated/2026-11-06/2026-11-05T23-38-50-779Z-LIVE_RPC_SUBMISSION-2dc8a729.json`; classification-only derivation: `2026-11-05T23-47-40-077Z-LIVE_RPC_SUBMISSION-b476d1a1.json` in the same directory. Four expected path decisions matched. Staked-alt and basic-alt passed validation/storage checks but the sidecar's mempool persistence failed with `/usr/app/data/userOps/000085.log: No space left on device`. The original RPC says Internal error; the actual disk diagnostic is preserved in admission-report checks. New classification INFRASTRUCTURE_FAILURE separates it from preconditions and rule discrepancies. Zero genuine discrepancies and zero newly confirmed included transactions. Read-only recheck found no public receipt. No repeat broadcasts after the failure.

Executed command: `node bin/framefuzz.mjs mutate --suite uniswap-storage --seed 42 --count 3 --submit --allow-chain 1337 --receipt-wait-ms 5000 --results evidence/integrated/2026-11-06`. The first preflight-only attempt stopped before submissions because slot0 was zero; the guard was corrected to record uninitialized state, since this scenario tests real storage access rather than trading readiness.

Uniswap preflight checks pinned StateView/PoolManager runtime hashes and the `poolManager()` binding before submissions; live setup checks reserve code, balance and actual stake. Exact identifiers/hashes are in `preflight.json`, `examples/live/devnet.json` and the combined capture. Solidity call: `vendor/paymaster/ReserveReadingPaymaster.sol:33`. Reviewed sidecar source commit2e22ff0a2898e69ea4bf5275bce1be8581a8582a storage loop lines736–805 checks read access and stake. Actual execution reports commit9aa3645d795945c64400f41a70aace0edfa7f383; deployed sidecar v4.1.1 returns an empty commit. Rule reports revalidate observed behavior, not exact deployed sidecar source identity.

Published the staked Uniswap case with actual failed-admission classification: entity `0x6779cf38a4398eb90da94b11885e691b84a6bb09dda59974cf5b8f1a21db773e`, transaction `0x44f0084455b54724624fffd3e2c186986146d316c5d6bf27207409872acc9ec2`, receipt success; complete receipt in `evidence/integrated/2026-11-06/arkiv-publish.json`; expiry570761. Optional v1 Uniswap metadata includes actual contract hashes/identifiers, staking summary, per-path policies and limitations. It is descriptive untrusted metadata, not executable configuration. Fresh-process suite query and both fixtures' safe imports succeeded; evidence under the same directory. No new signing key was persisted; the writer's in-memory session is now gone. Additional publication is deferred without a funded signing environment.

Executed registry commands: `arkiv publish <derived-report> --case-index 1 --expiration-blocks 302400 --submit --output evidence/integrated/2026-11-06/arkiv-publish.json` through the same ignored public-RPC file relay described below; `node bin/framefuzz.mjs arkiv query --suite uniswap-storage --rule STORAGE_ACCESS --output evidence/integrated/2026-11-06/arkiv-query-fresh-process.json`; `arkiv fetch --key <original-gas-key>` and `arkiv import --key <gas-or-uniswap-key> --output <recheck.json>`. All import runs show submissions0, UNKNOWN local confidence and new receipts not_checked; historical outcomes remain separate publisher claims.

Final-polish work in progress: saved offline evidence mode with network routes blocked, generated committed-evidence guide, clear product workflow, README and sponsor/submission materials. Preserve original historical evidence directories unchanged. FEEDBACK.md is prepared; human form submission is pending.

## Arkiv registry — executed November 6, 2026

Implemented `src/arkiv/` typed schema, sanitized projection, publish/query/fetch/validate/import, official SDK clients and CLI. Existing server/dashboard has a minimal Community Cases view. It directly queries Rabdi, retrieves selected cases, checks expiry/creator/digests/semantic consistency and imports only an unsigned PREVIEW. Historical and newly generated outcomes remain separate in JSON/Markdown/replay exports. No admission-runner rewrite or new chain1337 broadcast.

**Real publish → fresh-process query → retrieve → dashboard import → replay preview: PASS.**

- Writer/publisher/current owner: `0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715`. Separate in-memory test key, no persisted key. Balance before publish: 9.5 test tGLM.
- Rabdi chain7794095, official RPC `https://rpc.rabdi.db-chain.testnet.arkiv.network`, SDK1.0.1. Independent of EIP-8141 chain1337.
- Entity key: `0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1`.
- Creation transaction: `0x0158db1bec0a20a8671ba18d0d9776b437a6a5cdb18970948a6c51d8fe5e8388`.
- Full receipt: `evidence/arkiv/2026-11-06/publish.json`. Status success; block267241; block hash `0x73b437646a1f3ff4163d8789ac8f4aa0dd2cf14ef8296b4e5028591236e8a830`; gas314427; effective gas price1000000000; destination Arkiv system contract `0x4400000000000000000000000000000000000044`.
- Selected expiration302400 blocks from preflight; exact absolute expiry569638. Public reads are unsigned/anonymous, visibly distinct from creator/current owner. No authenticated querying wallet is implied.
- Content digest `281434c862232ac4557bd917b0c65d812a6bd5372eab977912117b53edc37e6b`; offchain source evidence SHA-256 `de690539fac4b65b5047141d592bd8cef44ef3991a030d6912c730ae08ee2972`.
- A fresh CLI process returned the entity at block267249; separate restarted dashboard queried/retrieved/imported it. Case seed42 variant0 regenerated payer gas67198. New source PREVIEW_COMMUNITY; submissions0; both new path outcomes inconclusive/not_checked and confidenceUNKNOWN. Original two successful LIVE receipts remain publisher claims under `communityOrigin.originalOutcomes`.
- Saved demonstration: `evidence/arkiv/2026-11-06/manifest.json`, original publish receipt/payload, fresh-process query, CLI import, dashboard API query, actual browser-import JSON/Markdown/replay exports, screenshot and test log. Existing `evidence/live/` and `evidence/mutations/` unchanged in Git.

Exact executed product commands:

```powershell
npm install --save-exact @arkiv-network/sdk
node bin/framefuzz.mjs arkiv publish evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json --case-index 0 --expiration-blocks 302400 --submit --output evidence/arkiv/2026-11-06/publish.json
node bin/framefuzz.mjs arkiv query --suite verification-gas --rule MAX_VERIFY_GAS --output evidence/arkiv/2026-11-06/query-fresh-process.json
node bin/framefuzz.mjs arkiv import --key 0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1 --output evidence/arkiv/2026-11-06/import-cli.json
node bin/framefuzz.mjs serve --results runs --port 4177
npm test
npm test | Tee-Object -FilePath evidence/arkiv/2026-11-06/tests.txt | Select-Object -Last 10
```

Environment detail: the signer process could not use network directly. First attempts failed on eth_chainId before any write. The successful publish CLI invocation included `node --import ./.local/arkiv-relay-loader.mjs` before `bin/framefuzz.mjs`, with ARKIV_PRIVATE_KEY passed in the child's environment from memory. The ignored loader/worker relayed only public RPC bodies via local files to the official endpoint; no key was written or relayed. Fresh-process query and dashboard used direct SDK networking. One real entity was published, no repeated writes.

Browser sequence on the restarted server: Community Cases → Query Arkiv → select the real row → inspect retrieved creator/owner/expiry/payload → Open selected case as replay PREVIEW. Observed UI: PREVIEW_COMMUNITY, zero broadcasts, fresh unsigned model, no new transaction hashes. The fixture expired-state rejection is tested with mocked transport; no actual expired testnet entity was created just for the test.

Automated verification: **66 passed / 0 failed**, retaining all58 previous tests. Eight new tests cover projection/secrets, schema/digest/semantic tampering, cross-owner discovery, expiry quarantine/fetch/import rejection, chain/filter/creator checks, unsigned fresh imports, guarded publish/receipt and actual official SDK decoding/query over mocked JSON-RPC transport, plus dashboard preview-only API flow. Automated tests do not send testnet transactions. Initial test-only assertion and sandbox loopback failures were corrected; final suite is green.

All five sponsor files under `arkiv/` and README writer/entity/query/network/license/AI/evidence disclosures completed. Limits: first-page20-case queries, no moderation or independent external adoption measured; public RPC can rate limit; future writes need a funded Rabdi signing key; entity expires at block569638; publisher claims are not attestations; full historical evidence is offchain. No outstanding blocker to the requested MVP cycle.

**Current checkpoint: November 6, 2026 (IST), `feat/framefuzz-mvp`.**

## New implementation and actual outcomes
- `src/mutations/generator.mjs`: pure seeded semantic generator with base template, operation, constraints, paths, setup state, version/digest and self-contained descriptors. Supported gas sweeps and storage/stake environment mutations; unsupported dimensions/credential fields are rejected.
- `src/mutations/oracle.mjs`: total-budget arithmetic, per-path storage policies, verified/inferred/unknown confidence, sufficient-execution-gas safeguards and explicit precondition/rule-class/transport classifications.
- `src/mutations/campaign.mjs`: lazy compilation through the existing real LIVE adapter, source/fixture digest checks, live client-version inspection, actual admission-report capture, coverage and a seven-variant public-devnet batch limit. Offline preview allocates no keys and performs no RPC or signing.
- CLI `mutate`, semantic replay and variant filtering; JSON/Markdown/replay exports retain model, setup, expectations, actual responses, rule reports and independent receipts. Read-only refresh preserves the mutation taxonomy and coverage.
- Minimal existing-dashboard controls: suite, seed/count, preview/authorized run, generated parameter rows, confidence/region/rule coverage and drill-down/export. Browser verified an offline storage preview and the generated LIVE gas results. No redesign.
- Bounded single-dimension shrinking is implemented and tested with an explicit monotonic predicate; it never probes the devnet automatically. No unexpected result occurred, so no live shrinking or finding is claimed.

## Automatically generated LIVE campaign

**Seven automatically generated variants / fourteen independently signed submissions; fourteen matching path decisions; zero discrepancies, precondition failures or transport failures.** Eight accepted transactions have successful included receipts; six above-cap transactions were rejected as expected.

Seed 42 produced payer gas sequence **67198, 67202, 67200, 67210, 67201, 67190, 67199**. This comes from the generated boundary plus configured distances, not seven hard-coded scenario functions or per-value expectations. Total budget is payer + sender 30000 + signature 2800. Per path, coverage is **three below, one at, three above**, four expected accepts and three expected rejections. Actual sidecar reports identify MAX_VERIFY_GAS violations at totals 100001, 100002 and 100010. Both policies matched all seven generated cases.

The second family generated three basic/unstaked-read/staked-read setup states from one specification. It was previewed in the browser and exercised with the real signing/adapter setup contract in tests using mock transport; **no additional storage-family live submissions were sent in this task**. The original real storage-policy evidence remains unchanged.

The rule model is `rules/devnet-1337.v1.json`, version `forshtat-1337-observed-2026-11-06.v1`, bound to the historical evidence SHA-256 and known sponsor code hashes. VERIFIED means observed fixture-bound behavior; live sidecar v4.1.1 still exposes no exact commit. Acceptance below the observed sufficient-gas interval is INFERRED, and values below observed payer usage cannot become cap findings. Runtime version mismatches or missing/altered evidence yield UNKNOWN rather than false discrepancies.

## Tests and verification actually executed

`npm test`: **58 passed / 0 failed** on Node v22.13.0 with loopback networking enabled, including all original 37. New tests cover seeded sequences/sampling, budget arithmetic, invalid/insufficient gas, real independently recovered signatures and isolated senders, storage/stake setup, unsupported dimensions, missing/tampered provenance, deterministic key-free replay, bounded shrinking, CLI regeneration, dashboard preview/submission guards, historical LIVE rendering/export and read-only refresh coverage.

`npm run demo:mock`: **6/6 mock cases matched**. Browser verified PREVIEW source labels, three storage-state generated rows, expected path divergence without claiming execution, then the seven-case LIVE campaign with 14 matching decisions and successful receipts. Dashboard remains at `http://127.0.0.1:4177` in read-only mode. `git diff --exit-code -- evidence/live/2026-11-06` passed: historical evidence was neither modified nor relabeled.

## New evidence paths

Directory: `evidence/mutations/2026-11-06/`. `manifest.json` points to:
- Original automatic capture: `2026-11-05T22-40-18-236Z-LIVE_RPC_SUBMISSION-aa854431.json`.
- Final receipt-refreshed LIVE JSON/Markdown/replay: prefix `2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01`.
- Three-state offline storage preview JSON/Markdown/replay: prefix `2026-11-05T22-43-59-653Z-PREVIEW_GENERATED---NO-RPC-OR-SIGNING-2a3c5943`.

Filenames use UTC timestamps; execution date here is November 6 IST. Descriptors include deterministic semantic inputs, seed/count/index, setup/signing instructions, rule model and confidence, gateway identifiers, actual decisions/errors/admission reports, signed raw/structured parameters and receipts. Fresh allocation changes hashes by design; reproduction means the same semantic mutation with current isolated accounts and state.

## Exact mutation commands

```powershell
node bin/framefuzz.mjs mutate --suite verification-gas --seed 42 --count 7 --preview --results runs
node bin/framefuzz.mjs mutate --suite verification-gas --seed 42 --count 7 --submit --allow-chain 1337 --receipt-wait-ms 1000 --results runs
node bin/framefuzz.mjs refresh runs/2026-11-05T22-40-18-236Z-LIVE_RPC_SUBMISSION-aa854431.json --rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --receipt-wait-ms 1000 --results runs
npm test
npm run demo:mock
```

Browser storage preview used `POST /api/mutate` with `{suite:"uniswap-storage", seed:42, count:3, preview:true, submit:false}`; the equivalent CLI is `node bin/framefuzz.mjs mutate --suite uniswap-storage --seed 42 --count 3 --preview`.

Replay offline without new broadcasting:
```powershell
node bin/framefuzz.mjs mutate --replay evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.replay.json --variant 0 --preview
```

To reproduce another authorized live execution, use the submitted command above, or replace `--preview` with `--submit --allow-chain 1337` on the replay command. Explicit public/alternative RPC flags and environment overrides remain supported. Do not rebroadcast stale signed bytes. The current server deliberately disables submission; start `serve` with matching RPC/chain and `--submit` only when live UI execution is intended.

## Remaining limits

Two supported mutation dimensions only; no generic byte fuzzer or expensive delta-debugging. Unknown minimum execution-gas thresholds remain unknown/inferred; the model is fixture- and version-specific. Exact sidecar build commit is unavailable. Storage state uses existing validated deployments; B is not silently staked. The opt-in shrink helper assumes a monotonic predicate and is not automatically wired to remote probing. No discrepancy or protocol bug was found. Node20.12+ is intended but only Node22.13.0 was executed. No Arkiv, swap settlement, Chainlink or additional sponsor work.

## Generated LIVE hash and receipt ledger

### verification-gas-s42-0-67198

- public: EXPECTED_ACCEPT; returned `0xef7bec20e34df87fdf264d9f5fe65934e53a5e6fc65b38b7db78ad8981c50cbd`; included_success, block `0x63a06`.
- alt: EXPECTED_ACCEPT; returned `0xbe6c43a9740e0e04eb080a23957df96ab7259cb1fe6f49c9fe18dc8ea4c63b2d`; included_success, block `0x63a0d`.

### verification-gas-s42-1-67202

- public: EXPECTED_REJECT; computed only `0x06029dbda56b1efaee257e32d3d38d2655c055cef19e4bcd754ee4d5ae289a93`; not_checked.
- alt: EXPECTED_REJECT; computed only `0x722bf60bae57399afdb5f0ab7887e2950fbe3d4aad5ba56d966d25cf69a12377`; not_checked.

### verification-gas-s42-2-67200

- public: EXPECTED_ACCEPT; returned `0xab67907c2c9c26faeaed5b34504bf2b4907ffbff132d67e696b2c9c0c2d76429`; included_success, block `0x63a08`.
- alt: EXPECTED_ACCEPT; returned `0xe427da3c92b78e33d114c1d91e0dae0c87f68c94d43db7d087454445808e6951`; included_success, block `0x63a0d`.

### verification-gas-s42-3-67210

- public: EXPECTED_REJECT; computed only `0x43068ae6808e18859ef59823bb640181e91f44f0dfcf995fd634ba3d92b11f23`; not_checked.
- alt: EXPECTED_REJECT; computed only `0x4bd87d45de5b34fff5a2ee59946b3314342fbb7a2a1bf87dea9579830d1bab9e`; not_checked.

### verification-gas-s42-4-67201

- public: EXPECTED_REJECT; computed only `0xcdd20f6c0921b0b10ea9702a29bdd7bc60f281502d69f1c8f321c9a3dbdf98f2`; not_checked.
- alt: EXPECTED_REJECT; computed only `0x80e7331c3213421cdba422eb1fb81d022146d80ea726e3b9b994a6b0f8b3c030`; not_checked.

### verification-gas-s42-5-67190

- public: EXPECTED_ACCEPT; returned `0xdc9dca105fe84c358f864c0228199bf9eaf42e77cb2f2c756ba27dc150aeaaf1`; included_success, block `0x63a0b`.
- alt: EXPECTED_ACCEPT; returned `0x3bf94779b7f08978ae5f3f5ef214b7ae2206c9e8f36de3a083c37eca142f141c`; included_success, block `0x63a10`.

### verification-gas-s42-6-67199

- public: EXPECTED_ACCEPT; returned `0xf7d68462aa3b7c0b21c2bb5af46ed5db52bec131440b33741e49abe766b461f7`; included_success, block `0x63a0c`.
- alt: EXPECTED_ACCEPT; returned `0x6d70b783f4c2131fd7fc3ce7562f52bf67d29d96d2438dbc69dedbaffd59241e`; included_success, block `0x63a10`.

## Historical live-integration checkpoint (preserved context)

**November 6, 2026 (IST)** · branch `feat/framefuzz-mvp`.

## Outcome
1. LIVE adapter working: **YES**.
2. Basic sponsored transaction: **PASS** — both paths admitted and included successfully.
3. Unstaked pool-read rejection: **PASS** — fresh original-artifact deployment rejected through both policies.
4. Staked pool-read acceptance: **PASS** — canonical storage rejection, alternative admission and successful inclusion.
5. Boundary mutation tests actually executed: **six submissions**, three below/at/above variants through two paths.
6. Dashboard displaying real evidence: **YES**, browser verified at `http://127.0.0.1:4177`.
7. Automated tests: **37 passed, 0 failed**, Node v22.13.0 with loopback networking enabled.
8. Remaining provenance gap: sidecar v4.1.1 returns an empty deployed commit; reviewed source cannot be attested to that build. Runtime rule checks are saved. No blocker to the demonstrated live flow.

Six cases / twelve admission submissions matched, with seven successful included frame transactions and five expected rejections. One additional legacy transaction deployed the fresh reserve fixture. No USDC reimbursement or Uniswap swap was performed.

## Implementation and source
Added the actual workshop codec/signing adapter, authorized-chain/endpoint/code/funding/stake checks, independent sender/nonce lifecycle, original-artifact deployment helper, structured alternative RPC submissions, complete receipt preservation and read-only evidence refresh. Corrected classification for real gateways that wrap known policy errors as Invalid params/-32602. No frontend redesign or UI changes.

The supplied original reserve source calls real Uniswap v4 `StateView.getSlot0` when VERIFY calldata starts with 0x01. Its fresh deployment is `0x3d66c53105be7930fd89571157a41137c12b003f`, transaction `0xb6df27ca069439f8ca7009a0a5a4ba111a37d2c569bd73e330477a1c4ac108ad`, receipt status 1, block `0x63893`. Creation value 0.15 throwaway devnet ETH. Full deployment receipt is committed.

Pinned dependencies: `@forshtat/hegota-support@0.0.1`, `viem@2.57.7`. Workshop source `bcfe02a196ca97b6fb0d1044db9d0b4c673831fc`. Reviewed sidecar source `2e22ff0a2898e69ea4bf5275bce1be8581a8582a`; live execution client `9aa3645d795945c64400f41a70aace0edfa7f383`. Exact sidecar deployment commit remains undisclosed. See `vendor/README.md`.

Actual alternative admission reports confirm the B storage failure on PoolManager `0x6bf9aa9c04fd001385742d61f6818c3236429848`, slot `0xf6a862ad9e4b3f79dd2626ae081b3a49de5d55002e5339e1bdff7d8f5e202404`. Gas reports confirm total prefix execution plus secp256k1 cost: payer 67199/67200/67201 + sender 30000 + signature 2800 = 99999/100000/100001. Above was rejected as MAX_VERIFY_GAS through both methods. Below/at were admitted and included.

## Evidence
Committed directory: `evidence/live/2026-11-06/`. `manifest.json` identifies the aggregate report and its original inputs. Aggregate JSON retains original responses, independently signed raw and structured RPC inputs, metadata, raw receipts, payer/frame statuses, and live sidecar rule-by-rule reports. Markdown and replay exports sit alongside it. Computed hashes of rejected transactions are not claims of inclusion.

External PoC evidence under `vendor/poc/external-*` remains labeled external. This build's LIVE evidence is separate. ZIPs and raw key-bearing extraction are ignored; only key-free imports and public chain evidence were committed. A scan checked all 71 tracked files against both private-key literals from the supplied funding script: **zero matches**.

## Exact executed commands
```powershell
npm install --save-exact @forshtat/hegota-support@0.0.1 viem@2.57.7
npm test
node bin/framefuzz.mjs run examples/live/basic.mjs --public-rpc https://altmempool.forshtat.com/rpc --alt-rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --submit --receipt-wait-ms 12000 --results runs
node bin/framefuzz.mjs run examples/live/staked.mjs --public-rpc https://altmempool.forshtat.com/rpc --alt-rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --submit --receipt-wait-ms 12000 --results runs
node bin/framefuzz.mjs run examples/live/verification-gas.mjs --public-rpc https://altmempool.forshtat.com/rpc --alt-rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --submit --receipt-wait-ms 3000 --results runs
node bin/framefuzz.mjs refresh runs/2026-11-05T21-56-20-051Z-LIVE_RPC_SUBMISSION-a4bcdfbb.json --rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --receipt-wait-ms 1000 --results runs
node bin/framefuzz.mjs refresh runs/2026-11-05T21-57-03-876Z-LIVE_RPC_SUBMISSION-6ac9f698.json --rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --receipt-wait-ms 1000 --results runs
# FRAMEFUZZ_DEPLOYER_KEY supplied via process environment from the user's test-only PoC; no key is recorded here.
node bin/deploy-reserve.mjs
node bin/framefuzz.mjs run examples/live/unstaked.mjs --public-rpc https://altmempool.forshtat.com/rpc --alt-rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --submit --receipt-wait-ms 3000 --results runs
node scripts/collect-live-evidence.mjs runs/2026-11-05T21-55-29-464Z-LIVE_RPC_SUBMISSION-5cff1031.json runs/2026-11-05T22-02-36-899Z-LIVE_RPC_SUBMISSION-9501fa3a.json runs/2026-11-05T21-58-24-164Z-LIVE_RPC_SUBMISSION-7c3f3ead.json runs/2026-11-05T21-58-26-702Z-LIVE_RPC_SUBMISSION-b5a7dbfc.json
npm test
node bin/framefuzz.mjs serve --cases examples/live/basic.mjs --public-rpc https://altmempool.forshtat.com/rpc --alt-rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --port 4177
```

The first staked/boundary reports had inconclusive classifications caused by the old generic Invalid params parser. The parser was fixed and regression-tested, and the original responses were reclassified with read-only receipt refresh; no extra transaction submissions occurred. All accepted frame transactions later returned successful full receipts.

## Reproduce the saved demonstration (no broadcasting)
```powershell
npm ci
npm test
Copy-Item evidence/live/2026-11-06/*LIVE_RPC_SUBMISSION-3a838bca.json runs/
node bin/framefuzz.mjs serve --cases examples/live/basic.mjs --rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --port 4177
```
The server is already running in this session. Browser verified all six LIVE matches, source distinction, actual unstaked rejection text, receipts, real hashes, export links and both gateways ready on chain1337. Live submission remains disabled in this demonstration server.

## Complete admission hashes and receipt blocks

The following section is generated directly from the committed aggregate evidence. Returned hashes refer to admitted transactions; computed-only hashes refer to rejected transactions and have no receipt.

### basic-baseline-50000

- public: EXPECTED_ACCEPT; returned `0x3a61f84bef43dee398ce5e1ec17c9cc8b9e6d498a33fef9ff44011c4b334ec84`; included_success, block `0x6384d`.
- alt: EXPECTED_ACCEPT; returned `0xb810446fcc43d674db0faae8c6e833976a4f3344c418cdb1a2fbb7fe5b35cc6a`; included_success, block `0x6384f`.

### unstaked-baseline-50000

- public: EXPECTED_REJECT; computed only `0x3aca70802e2b6db284daf66dec3bd9873a3e48a231e7e5411b4d77bb62d06bc8`; not_checked.
- alt: EXPECTED_REJECT; computed only `0xff59ca1dc469b03528937a1a69d13e062a8b2ede5b166f11158cdee4bc517fd6`; not_checked.

### staked-baseline-50000

- public: EXPECTED_REJECT; computed only `0x98404ebac440ec9ee2d82110fa8452ce72c0d8678b14bff08d70fa16ab44c91a`; not_checked.
- alt: EXPECTED_ACCEPT; returned `0xbb9143eb2964bdc4de9d59f15404baf14f59465f0ac0f5d5903dfa0173741b6c`; included_success, block `0x63863`.

### basic-below-67199

- public: EXPECTED_ACCEPT; returned `0xa56f367868376cc4ab7d4f938d03c148c9a1711f736e7bffb7c0fb556b889c1b`; included_success, block `0x6385b`.
- alt: EXPECTED_ACCEPT; returned `0xa5f569b2de2079fc586b6428706828c2fb9b9b92c7fd34338aefa5f8e748632b`; included_success, block `0x63865`.

### basic-at-67200

- public: EXPECTED_ACCEPT; returned `0x7916c6a306044ba424e43ccbe871945b30a5357a19cba224bfbfc9b3af8f08eb`; included_success, block `0x6385d`.
- alt: EXPECTED_ACCEPT; returned `0xb1c1583660a3da5ab7264579becdce2a2d04f4e3fdfc4e41bafd0db99f3a9605`; included_success, block `0x63865`.

### basic-above-67201

- public: EXPECTED_REJECT; computed only `0x58a9214e8c1188379e80e7cc4beb1b5acc2ce0897f014eab68fdd8a1c29d9bc8`; not_checked.
- alt: EXPECTED_REJECT; computed only `0x675d7d64bfe8a3d20624d117e87a1b19281c087681eae658bfd0fbb31246fb54`; not_checked.
