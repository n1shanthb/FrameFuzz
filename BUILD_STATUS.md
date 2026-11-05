# Build status — deterministic mutation engine

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
