# Proof index — claim → evidence → code → test → network

Judges: start here to falsify or confirm any README claim.

Verification status: `LIVE` · `HISTORICAL` · `TEST-ONLY` · `PREPARED` · `NOT IMPLEMENTED` · `NEEDS REFRESH`

| Claim | Exact evidence | Code / entry points | Test | Network / tx | Status |
|---|---|---|---|---|---|
| Real EIP-8141 signed type-0x06 transaction | `evidence/live/2026-11-07/storage-access-live.json`; Uniswap + self-relay admission JSON | Pinned codec under `vendor/eip8141/`; construction/sign paths in `src/` | Node suite EIP-8141 / admission tests | 1337 · e.g. `0xf69e0f4b…` | LIVE |
| Real canonical ethrex rejection with StorageReadNonSender | `evidence/live/2026-11-07/storage-access-live.json` | Canonical ethrex adapter | Admission comparison tests | 1337 · same hash REJECTED_POLICY | LIVE |
| Real alternative Skandha acceptance + admission ID | Same file — ACCEPTED id **1647** | Skandha adapter | Admission comparison tests | 1337 · same hash | LIVE |
| Later mempool DROPPED (not inclusion) | Same file mempool/status fields | Status polling helpers | — | 1337 | LIVE |
| Clean dual-path **policy** divergence (primary EF story) | storage-access-live.json | Dual submit + compare API/CLI | — | `0xf69e0f4b87827d8d5d295188d10e7672b2bace87e6ac8d09916758bee155e31d` | LIVE — **no inclusion claim** |
| Canonical inclusion / self-relay execution | `evidence/admission/2026-11-07/self-relay-first-comparison.json`, `self-relay-corrected-comparison.json` | Self-relay admission path | — | `0xd4d6123f…`, `0xc05703ac…` | LIVE — **not** clean policy divergence |
| Uniswap StateView validation-time paymaster divergence | `evidence/live/2026-11-07/uniswap-policy-divergence-final.json` | `vendor/paymaster/ReserveReadingPaymaster.sol`; paymaster deploy/sign flows | Reserve / paymaster tests | Candidate `0x72a82645…`; canonical REJECTED_POLICY; alt OnChain | LIVE (as of evidence file) |
| Source digest for ReserveReadingPaymaster | Documented Step 2E digest `85a4891e08085f09d8c23df2a67e455d8f1e130e7c4bcbe17de6966ed9cf43ec` | Same Solidity source | Binding tests if present | — | HISTORICAL bind + LIVE use |
| Reserve token deploy on 1337 | `evidence/live/2026-11-06/reserve-deployment.json` | Reserve deployment signer | `reserve deployment signs…` tests | Deploy `0xb6df27ca…` → `0x3d66c531…` | LIVE historical |
| Solidity compilation | Compiler service / solc integration in `src/` | Analyze API used by playground | Compile/bind tests | Local | TEST + product path |
| Source/runtime bytecode binding | Binding helpers | Playground analyze | Binding tests | Local | Supported scenarios |
| Mutation generation + feasibility | Mutation + validator agents / services | Feasibility gate before sign | Mutation/feasibility tests | Local | Supported |
| Genuine agent model calls | Agent evidence under `evidence/` / runs when present | Scout/Mutation/Validator/Critic | Agent tests (may be mocked) | OpenRouter when authorized | LIVE only when evidence says so; else TEST-ONLY |
| Arkiv createEntity publication | `evidence/arkiv/2026-11-07/publish-receipt.json` | Arkiv client publish | Arkiv tests | 7794095 · tx `0x007bd10f…` · entity `0xf1089c05…` | LIVE |
| Fresh Arkiv query (not fallback-only) | Query/fetch evidence beside publish; UI Arkiv page | Query API | Arkiv query tests | 7794095 | LIVE when freshly run; else NEEDS REFRESH |
| Unsigned regression import | Import API + UI | Import path strips operator auth for replay | Import tests | Local + Rabdi fetch | Supported |
| Ethereum Swarm Bee storage | — | — | — | — | **NOT IMPLEMENTED** |
| Same-transaction identity across paths | Dual-path JSON `transactionIdentity` / hash fields | Compare pipeline | Comparison tests | 1337 | LIVE |
| Validation gas / storage-access rules exercised | Policy error payloads in evidence | ethrex rejection surfaces | Gateway policy tests | 1337 | LIVE |
| Race handling | Admission race / status code paths | Adapters | Related tests | 1337 | Partially evidenced in suite |
| Deterministic regression reproduction | Arkiv entity content digest `0f7f0145…` | Publish schema `framefuzz.regression.v1` | Import/replay tests | 7794095 | LIVE publish |

## Provenance rules

1. Prefer `evidence/**/*.json` over narrative.
2. Do not upgrade PREPARED → LIVE without a new receipt.
3. Do not treat AI agent “swarm” as Ethereum Swarm.
4. Distinguishing admission / inclusion / execution is mandatory in demos.
