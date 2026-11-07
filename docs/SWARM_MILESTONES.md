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

## Milestone2 — read-only preparation implemented and executed

`src/swarm/preflight.mjs` checks both fixed authorized chain1337 endpoints, actual client/sidecar versions, the pinned basic PAYMENT sponsor's code/balance, nonce-manager storage and latest block data through an exact read-only method allowlist. Every send/deploy/debug-write method and any other endpoint is rejected before transport. No signing of deployment transactions, deployment, broadcast or publication is implemented. Swarm remains disabled by default.

Executed:

```powershell
$env:FRAMEFUZZ_SWARM='on'
node bin/framefuzz.mjs swarm preflight --output evidence/swarm/milestone-2/preflight.json
node --test test/swarm-preflight.test.mjs
npm test | Tee-Object -FilePath evidence/swarm/milestone-2/tests.txt | Select-Object -Last 9
npm audit --json
node scripts/live-evidence.mjs --check
```

Observed **8 read-only RPC requests**, no writes. Execution client still reports9aa3645d795945c64400f41a70aace0edfa7f383; sidecar reports v4.1.1 with an empty commit. Latest head0x63ac6 was19114 seconds old at capture, so mining is not established. Pinned sponsor code hash matched and balance was149175156000000000 wei. No funded deployer key or owned deployer/owner addresses were configured. The nonce-manager probe demonstrates readable protocol storage, not an owned deployment or executed validator. Read availability does not establish recovery from the prior full-disk failure.

The artifact contains an exact **conditional** manifest: ActionRecorder plus four distinct validators (unsafe baseline, unsafe attack, safe baseline, safe attack), zero-value deployments capped at6m gas each and2gwei (aggregate deployment fee upper bound0.06 test ETH, not an estimate), followed by four alternative-path frame submissions. All contexts use key0/seq0 only after protocol storage checks. Legacy account nonce can change during helper CREATEs and must not substitute for the keyed frame sequence. With public deployer/owner addresses configured, CREATE addresses, constructor initcode and pending deployment nonce are computed without signing; nonempty code or a nonzero keyed sequence blocks the context. Without those inputs, addresses/validator initcode remain null rather than fabricated. The plan's signatures authorize A separately in each owned context; attacked variants retain their own original A witness while substituting B.

Individual verification must establish the ActionRecorder caller/operation/parameter through state/event and a successful action-frame receipt. A safe rejection must specifically establish authorization failure with no B action; nonce, funding, layout, gas, infrastructure and transport failures do not pass. Independent reproduction needs a separately approved fresh deployment/context set and is not included in the first four-submission manifest.

Final automated suite: **83 passed /0 failed**, including all71 baseline tests and12 swarm tests. Dependency audit:0 vulnerabilities. Existing evidence guide matches committed captures; historical live/mutation/Arkiv/integrated/submission evidence has no diff against0b1040c. Artifacts:

- `evidence/swarm/milestone-1/offline.json` — actual compiled ABI/bytecode, source digests, versioned descriptor and offline retained-witness comparisons.
- `evidence/swarm/milestone-2/preflight.json` — actual read responses, method log, conditional deployment/submission manifest and blockers.
- `evidence/swarm/milestone-2/tests.txt` — actual full83-test TAP run.
- `evidence/swarm/milestone-2/dependency-audit.json` — actual audit result.

Real LLM calls: NO. Live EIP-8141 executions: NO. Unauthorized action proven: NO. Independent live reproduction: NO. Milestone2 commit: see Git history for the matching read-only preparation checkpoint. The first milestone is committed as `a1ff75a`.

After this milestone, stop for a separate human decision. The later live experiment, independent execution reproduction, real three-pass LLM investigator, timeline UI and Arkiv writes are not completed or implicitly authorized. Human feedback form, recording and ETHGlobal submission remain pending as documented in SUBMISSION_CHECKLIST.md.

**Current stop gate:** securely configured funded devnet-only deployer and owned owner address; healthy/mining authorized chain1337 service with operator confirmation of write recovery; canonical-hash compatibility verification; then explicit approval of the resolved deployment/submission manifest. Public repository visibility is still unverified. No key should be pasted into chat. Arkiv writes require their own later approval. Do not resume broadcasts merely because HTTP reads answer.

## Investigator implementation update
The later user request explicitly authorizes the bounded OpenRouter offline investigator and additive Swarm Lab controls. Implemented code supersedes the earlier deferred-LLM plan; it does not complete the live milestones. See docs/INVESTIGATOR.md and docs/LIVE_COMPATIBILITY_AUDIT.md. Historical milestone evidence remains unchanged.

## Phase3 focused readiness
Read-only preparation and source/vector comparison complete; overall runtime compatibility UNVERIFIED, sponsor/wallet unavailable, no live execution. See docs/PHASE3_MANIFEST.md.99tests pass. The prior real Sonnet and dashboard evidence is preserved.
