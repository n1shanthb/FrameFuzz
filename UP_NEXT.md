# Up next — Stage B approval gate (neither path READY)

**STOP.** Do not broadcast, fund, deploy, publish, spend OpenRouter, push, or submit forms until the user explicitly approves one exact resolved packet.

Neither prepared operation is `READY_FOR_EXPLICIT_APPROVAL`.

## Shortest actionable setup (prefer Arkiv first once unblocked)
1. Create a **Rabdi-only** test writer key; set `ARKIV_PRIVATE_KEY` in local `.env` (never commit).
2. Fund that public address on Rabdi chain `7794095` with ≥ **0.001** test ETH (observed max cap ≈ **0.000629** ETH from 2× historical gasUsed `314427` @ 1 gwei).
3. Re-prepare using a **semantic mutation report** with `framefuzz.mutation-reproduction.v1` (e.g. `evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json`), not the current BYOC playground source — expect a **new** manifest digest and fresh approval.
4. Re-run read-only resolve: writer address, nonce, balance, contentDigest, duplicate query, fee re-estimate → only then request explicit Packet A approval.

## EF Uniswap path (longer; currently paymaster-blocked)
Do **not** silently switch to owned-validator path. To recreate historical Uniswap basic-sponsorship:
1. `FRAMEFUZZ_DEPLOYER_KEY` (devnet-only) + funded sender
2. Restore or re-approve replacement for pinned basic paymaster `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30` (code currently empty; balance 0) — any address/code change needs new prerequisites + new digest
3. Fund paymaster; re-check StateView/PoolManager hashes; note pool slot0 currently uninitialized
4. Cap ≤ **0.002** test ETH for one public+alt comparison excluding redeploy/stake

Owned-validator alternative requires separate approval and all Phase3 prerequisites (deployer ≥0.064 test ETH, five CREATE deployments, four submissions, client vector checks, distinct manifest).

## After one path is READY
Design Stage B one-time token consumption with immediate chain/endpoint/balance/nonce/config/digest revalidation. Never reuse approval across operations or regenerated manifests.

Preserve `evidence/playground/2026-11-06/`, `evidence/live/2026-11-06/`, historical digests. No push authorized.
