# Current status — fresh storage-access live admission (prep only)

Deadline priority is a **new** public-vs-alternative `StorageReadNonSender` divergence from pasted workshop `ViolatingWallet` + `Foreign`, not historical Uniswap/self-relay rows.

## Implemented (no chain writes)
- Labeled live capability `STORAGE_ACCESS_VALIDATOR_V1` / `LIVE_STORAGE_ACCESS_ADMISSION`
- Example source `examples/contracts/StorageAccessValidator.sol` compiles with allowlisted HegotaSupport imports and emits source-bound runtime hash `0xa0b28299…c1ea`
- Wallet codec + rejection-first `comparePolicyCandidate` path; Playground primary panel **PUBLIC vs ALTERNATIVE ADMISSION** with live-only table; prepare/run APIs require `LIVE_AUTHORIZED`
- Approval packet: `evidence/prepared/2026-11-07/storage-access-approval-packet.json` SHA-256 `6c55073e8f579b86eb58a515fb690fa6165e43c223c5c7388ed909fb40a0a6b4`
- Docs: `docs/ADMISSION_STORAGE_ACCESS.md`
- Focused tests 12/12. Writes/broadcasts: **0**. OpenRouter: unused.

## Chain readiness (read-only)
ethrex + Skandha on chain 1337 healthy. Operator `0x366E…f235` has **0.000419592** ETH / nonce 2 — needs ~**0.079 ETH** top-up before approved deploy/stake. No ViolatingWallet deployed yet.

## Hard stop
Await explicit approval of the packet before funding, deployment, stake, or admission broadcast.
