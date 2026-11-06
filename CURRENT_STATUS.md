# Current status — admission Step 2B EF funding preparation

The existing sender was verified separately on EF chain 1337 (0 wei, nonce 0, code empty) and Arkiv Rabdi 7794095 (10 tGLM). Rabdi funds do not fund EF. Official workshop faucet is enabled but fixed at 1 test ETH, so the exact 0.0005 plan uses the official published shared genesis address. Refreshed packet: source balance `899850661361025185745676` wei, latest/pending nonce 146, estimate 207,391 gas, cap 250,000 gas at 0.003 gwei, maximum source debit 0.00050075 test ETH. Approval digest `854693298e68e6c1241895127a2921eb6bdd25c5bfd7d8bf374e9a7964750806`. `FRAMEFUZZ_EF_FUNDING_KEY` is not configured; no transaction was signed or sent. See `docs/ADMISSION_STEP2B.md`.

# Previous status — admission Step 2A self-funded EOA preparation

Pinned ethrex source and sidecar documentation support a no-paymaster EOA `self_verify` prefix. A fresh type-0x06 transaction was signed locally using the pinned workshop codec and an ignored devnet-only `FRAMEFUZZ_SENDER_KEY`; signed bytes and request payloads are in ignored `runs/step2a-self-relay-candidate.json`. Transaction hash `0xd4d6123f6b142acccb5cf6c302877fe7a1ed499bd3bfb0263c70763febbba226`; sender/payer `0x366E6203603C39Eec1e75b3be6f078911447f235`, code empty, balance 0, nonce 0. This is an **infrastructure milestone**, with no pasted-source participation or fresh admission verdict. No deployment, funding, broadcast, paid call, Arkiv write or push. Full prerequisites and the smaller 0.000542 test ETH proposed packet: `docs/ADMISSION_STEP2A.md`.

# Previous status — admission Step 1 read-only preparation

The user redirected the next milestone to fresh EIP-8141 admission comparison and explicitly limited this step to preparation. The source-bound readiness module and panel are implemented; the EF endpoints answered read-only probes on chain 1337. The pinned basic paymaster has empty code and zero balance, and no deployer key is configured in this process. Pasted ordinary source remains `UNKNOWN` for EIP-8141 role. No candidate, admission verdict, chain write, paid call, Arkiv publication or push was produced. `npm test` passed 217/217; details and proposed one-shot approval packet are in `docs/ADMISSION_STEP1.md`.

# Previous status — incomplete-run budget gate fixed

QuotaVault run `282b81ac…` stopped with a **mislabeled** error. Exact gate: **`maxInputBytes` 24749 > 24000** on Mutation repair — **not** OpenRouter key limit and **not** FrameFuzz sprint USD (`$0.8849` still showed remaining).

## Root cause
`OpenRouterProvider.structured` collapsed input-size / call / token / USD failures into one string: `OpenRouter run budget exhausted before request`. Repair was attempted **before** executing READY `deposit(uint8)` and **before** Critic, so the investigation aborted mid-pipeline.

## Fix (verified)
- Distinct gate errors with actual limits/reservations
- Larger adaptive input/token budgets; tighter output reservation; history trim
- Execute READY local ABI tools **before** optional repair; skip identical-args “repairs”
- Continue to Critic after unrepairable reject / failed repair
- UI separates sprint aggregate vs per-run allocation vs est. finish; OpenRouter key limit called out as separate
- Same-sprint ledger reconcile: imported prior `$0.62201304` from evidence into `runs/` → spent **`$0.73707084`**, remaining **`$0.26292916`** (cap still `$1`)

## Verification
- `npm test` → **214/214** pass
- Mock QuotaVault-shaped path: READY ABI executed, identical reject skipped, Critic ran, `COMPLETE`, counters reconcile, broadcasts 0
- Live readiness (no new paid calls): http://127.0.0.1:4190/ `canStart: true`, OpenRouter configured, BYOC allocate `~$0.26` / est. finish `$0.18`

## Operator note
FrameFuzz sprint remaining ≈ **$0.26** (not the OpenRouter key’s ~$1.97). Enough for one bounded completion attempt. Consent still required; no chain/Arkiv writes from Start.
