# Raw action evidence: candidate offline ingestion

`src/swarm/raw-action-proof.mjs` accepts only `framefuzz.raw-action-bundle.v1` with profile `ethrex-9aa364-owned-recorder-candidate-v1`, chain1337 and the pinned advertised client commit. The receipt array shape is grounded in existing historical workshop captures. **No actual owned-validator action receipt exists.** The ActionRecorded/state portion is a candidate derived from the compiled recorder ABI, tested using explicitly constructed fixtures.

Checks cover encoded transaction hash, sender, nonce key/sequence, three-frame layout and payer, exact record calldata, outer versus individual frame status, block hash/number/parent, transaction position, matching outer/frame logs, emitter/caller/parameters/count and before/after actions(sender) RPC observations pinned to contiguous block hashes. Unsupported self-funded layouts, ambiguous logs, incomplete receipts and context mismatches return INCONCLUSIVE.

Offline CLI: with FRAMEFUZZ_SWARM=on, run `node bin/framefuzz.mjs swarm verify-action --bundle YOUR_RAW_BUNDLE.json --output runs/action-consistency.json`. It only reads the supplied file and writes a local report. No RPC/key is accepted. Unsupported or incomplete input stays INCONCLUSIVE, not authorization rejection.

A consistent bundle returns CONSISTENT_RAW_BUNDLE_UNATTESTED. It always retains actionEvidenceVerified=false, authorizationVerified=false, liveVerified=false and finding=false. Caller-supplied booleans cannot bypass checks. Caller-supplied block/receipt/state data is not cryptographic proof or independent canonical-chain attestation. Constructed logs cannot establish chain execution. Do not feed this result into the older normalized oracle as LIVE_EIP8141 evidence.

Safe-validator rejection traces are unsupported. Transport failure, funding/nonce problems, gas exhaustion, outer reverts or missing/reverted action frames never establish AuthorizationRejected or successful owner authorization. There is no raw collector, runtime-helper confirmation, reorg verification or independent live reproduction. E7 remains PARTIAL.
