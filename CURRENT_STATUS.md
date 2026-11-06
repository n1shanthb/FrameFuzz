# Current status — incomplete-run budget gate fixed

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
