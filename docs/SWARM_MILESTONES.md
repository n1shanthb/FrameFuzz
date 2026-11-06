# Owned authorization fixtures — phased implementation

The working submission-ready baseline was pushed to `origin/feat/framefuzz-mvp` at `0b1040c9ad7f9dffbf6d456264daf52233565407` and verified with `git ls-remote`. Public HTTP access returned404; public visibility remains unverified. The user then explicitly requested implementation. No repository visibility setting was changed.

## Milestone1 — offline implementation complete

- Exact compiler `solc@0.8.28` compiles owned unsafe/safe validators and ActionRecorder in memory. Compiler settings and all source/dependency digests accompany actual bytecode/ABI in the artifact. Transitive `tmp` is overridden to0.2.7 to address current advisories; final install audit reports0 vulnerabilities.
- Unsafe validator binds chain ID, account, nonce and action target but deliberately omits action calldata. Safe validator uses the executing client's `TXPARAM(SIG_HASH)`. Shared layout checks enforce sender EXECUTION and separate payer PAYMENT approval; the fixed65-byte ARBITRARY witness has empty signer/msg and canonical low-s r||s||v. No circular hash construction or ARBITRARY resolved-signer introspection.
- Versioned v2 semantic mutation changes only recorder calldata from record(1,10) to record(2,999), preserving target, nonce and the owner's original witness. V1 generator/schema and historical fixture digests are unchanged. A test checks the original committed definition digest.
- Actual ECDSA recovery shows the unsafe partial digest still authorizes the substituted calldata, while canonical coverage changes and the retained witness fails the safe digest. These are **offline cryptographic checks**, not EVM contract execution, EIP-8141 execution or an authorization finding. No general EVM emulator was installed or presented as frame execution.
- Deterministic oracle distinguishes authorization, nonce, funding, layout, gas, transport, infrastructure and action-frame execution failures. It requires owned contexts, original authorization, retained signature, changed hash, verified individual action evidence and an authorized baseline; an outer receipt alone never proves a weakness. A candidate finding is not promoted without independent live reproduction.
- Feature requires `FRAMEFUZZ_SWARM=on`. CLI/API exposure of existing functionality is unchanged; new CLI rejects --deploy, --submit and --publish before entering the experiment. No Swarm Lab UI, LLM provider or Arkiv schema change is implemented before later milestones.

Executed:

```powershell
npm install --save-dev --save-exact solc@0.8.28
# Final package.json override: tmp 0.2.7; npm install reports0 vulnerabilities.
$env:FRAMEFUZZ_SWARM='on'
node bin/framefuzz.mjs swarm offline --output evidence/swarm/milestone-1/offline.json
node --test test/swarm-offline.test.mjs
npm test
```

Observed: **79 tests passed**, preserving all71 existing tests plus8 new tests. Bytecode creation sizes: unsafe4311 bytes, safe4206 bytes, recorder508 bytes. Evidence: `evidence/swarm/milestone-1/offline.json`, source `SWARM_SIMULATED — NO LLM`, execution class OFFLINE_SIGNATURE_BINDING. Placeholder addresses are explicitly not deployments. Owner key was ephemeral and never exported.

Real LLM calls: NO. Live executions: NO. Unauthorized action proven: NO. Independent live reproduction: NO. Milestone1 commit: see Git history for the matching feature checkpoint.

## Precise hash compatibility limitation

The [current EIP-8141 draft](https://eips.ethereum.org/EIPS/eip-8141#signature-hash) replaces empty-msg signature bytes with their length in the signing payload. Its current envelope uses a scalar nonce and aggregate fee budget. The pinned workshop package0.0.1 instead uses keyed nonces/rate-fee fields and replaces empty-msg witness bytes with empty bytes. `src/swarm/signatures.mjs` implements separate explicit current-spec vectors and workshop hashing; tests prove fixed-length witness rewrites do not introduce a circular dependency, changes of length affect current-spec hashes, explicit-msg bytes are committed and calldata changes both commitments.

The safe contract reads the **actual client's canonical hash**, not a caller-supplied hash. Offline preparation uses the existing workshop codec and marks its live canonical compatibility UNVERIFIED. Before any future live signatures are accepted as valid, the client's precise signing hash must be confirmed. No claim is made that the workshop envelope matches the current draft. A read-only client-version response alone cannot establish this compatibility.

## Milestone2 — next: read-only preparation

Prepare owned deployment addresses/calldata and isolated contexts only if the future deployer/owner addresses are available; otherwise emit an exact conditional manifest and list missing inputs. Check chain1337, pinned sponsor code/balance, actual client version, nonce-manager storage and latest block data through a fixed read-only RPC allowlist. No signing of deployment transactions, deployment, broadcast or publication is permitted. Historical disk-full evidence remains a blocker until write health is established by the operator; read availability is not proof of write health.

After this milestone, stop for a separate human decision. The later live experiment, independent execution reproduction, real three-pass LLM investigator, timeline UI and Arkiv writes are not completed or implicitly authorized. Human feedback form, recording and ETHGlobal submission remain pending as documented in SUBMISSION_CHECKLIST.md.
