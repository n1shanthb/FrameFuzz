# Current status — Stage B PREPARE ONLY (approval gate)

Stage B prepare completed on `feat/framefuzz-mvp` without broadcast, funding, deploy, publish, paid LLM, push, or form submit. LIVE_READ_ONLY served at `http://127.0.0.1:4177` after stopping the conflicting saved-demo on that port. Probe status `READ_ONLY_READY`. Approval endpoint returns HTTP 409 with `approvalIssued:false` (no token).

## Readiness classifications (live reads 2026-11-06T18:16:09.690Z)
- **Arkiv `ARKIV_PUBLISH`**: `BLOCKED_MISSING_KEY` (co-blocker `BLOCKED_SCHEMA` on current Stage A source report).
  - Manifest SHA-256: `3814673fc75d47d8a2042247576ebb0e6d6ba890df740083e29a813f834e00de`
  - Chain/RPC: 7794095 / `https://rpc.rabdi.db-chain.testnet.arkiv.network` (live chainId match; head block `301600`)
  - Writer: `UNRESOLVED` — `ARKIV_PRIVATE_KEY` absent; nonce/balance unresolved
  - Fee basis: historical createEntity gasUsed `314427` × gasPrice `1000000000` wei → est `314427000000000` wei; max cap `628854000000000` wei (~0.000629 test ETH)
  - Fresh query `verification-gas`/`MAX_VERIFY_GAS`: 1 entity `0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1`
  - Source `evidence/playground/2026-11-06/byoc-paid-report.json` is playground BYOC shape (no `framefuzz.mutation-reproduction.v1`); `buildRegressionCase` cannot finalize contentDigest even after a key is added without switching to a semantic mutation report (new digest)
- **EF `EIP8141_UNISWAP_COMPARE`**: `BLOCKED_MISSING_KEY` and `BLOCKED_OTHER` (`PINNED_BASIC_PAYMASTER_CODE_EMPTY_OR_MISSING`).
  - Manifest SHA-256: `f0fe91b05dc3ff4e33ab75521b5eb1a521bdc8167cd6fd503ff15ccab90f6756`
  - Admission `https://altmempool.forshtat.com/rpc` chainId 1337; head `7071`→`7072` advancing; client `skandha/v4.1.1-`
  - StateView/PoolManager code hashes MATCH pinned; poolId `0x784bd7879f8155eda79b7834d53c2f19ace60aed221fe33ef03ce660eff60648`; getSlot0 initialized=`false` (sqrtPrice 0)
  - Basic/staked/unstaked paymasters: code empty, balance `0` — do not invent replacements without listing all new prerequisites
  - `FRAMEFUZZ_DEPLOYER_KEY` absent; sender/nonce unresolved
  - Max total testnet spend upper bound for 1 public + 1 alt path: `2000000000000000` wei (0.002 test ETH) excluding redeploy/stake/funding

## LIVE_AUTHORIZED boundary (verified in code + tests)
- Started only via explicit `--mode LIVE_AUTHORIZED` plus `--submit`, configured RPC, and `allowChainId` in `EXECUTION_CHAINS` (`1337`,`31337`). Credential presence never sets `writesEnabled`.
- `/api/readiness/approve` is operation + exact digest specific, one-time, issues no token (409). Saved demo irrevocably non-network/non-write. `submitEnabled` false on LIVE_READ_ONLY. No global write bypass. 7/7 `test/live-readiness.test.mjs` pass.

## Evidence
- Prepare readout: `runs/stage-b-prepare-readiness.json` (gitignored under `runs/`)
- Repro script: `scripts/stage-b-prepare-readiness.mjs`
- Zero real transactions / Arkiv publications / paid provider calls / push

## Preserved prior
Stage A commits `cf4be7e`, `45050f6`. Paid LLM remaining **$0.37798696** unused this pass.
