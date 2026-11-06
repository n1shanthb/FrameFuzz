# Current status — judge-facing live admission product

Core divergence is preserved and productized in Contract Playground. No new broadcast, Arkiv publish, OpenRouter spend, or push in this pass.

## Claims (verified)
| Claim | Value |
|---|---|
| ADMISSION_DIVERGENCE | TRUE |
| INCLUSION | FALSE |
| EXECUTION_SUCCESS | NOT_OBSERVED |

Reference capture `0xf69e0f4b…e31d` validated (`evidence/live/2026-11-07/storage-access-verification.json`). Same signed identity on both paths; ethrex `StorageReadNonSender`; Skandha admission **1647** then mempool dropped.

## Product path
Load supported scenario → Analyze → Prepare Admission Test → Run Live Comparison → Results table → Save Regression (local). Comparison table is primary; ABI facts secondary. Supported scenario is labeled **not arbitrary BYOC** — binds pasted source digest to operator-deployed wallet/foreign fixtures.

## Arkiv
Sanitized descriptor: `evidence/prepared/2026-11-07/storage-access-regression-descriptor.json` (`framefuzz.storage-access-regression.v1`, digest `dae7dee0…`). Publication status **AWAITING_EXPLICIT_USER_APPROVAL**. Existing `framefuzz.regression.v1` schema unchanged.

## Tests
15/15 focused: live-admission + policy-comparison + playground-admission + storage-access-product.

## Demo
`docs/DEMO_STORAGE_ACCESS.md` — must record a **new** live prepare→run, not the reference hash.
