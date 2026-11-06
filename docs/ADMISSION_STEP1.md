# Fresh admission comparison — Step 1, read-only

Observed November 7, 2026. No deployment, funding, signed broadcast, paid model call, Arkiv write, or Git push occurred in this step.

## Existing machinery

- `src/playground/compile.mjs` compiles the exact pasted, self-contained Solidity with solc 0.8.28 in a bounded child process. ABI, AST-derived source facts, role declaration, source digest and analysis identity are retained. Imports are disabled.
- `src/adapters/workshop-codec.mjs` uses the pinned workshop package/profile to sign and serialize type-0x06 frames. `src/adapters/workshop-live.mjs` uses a fresh sender and reads code, stake, balance and nonce before building.
- Public submission uses `eth_sendRawTransaction` with encoded hex on `/rpc`. Alternative submission uses `eth_sendFrameTransaction` with the structured wire object at the root service. These are distinct APIs. `src/runner.mjs` retains path-specific response, error, and receipt state. Prior live captures are historical, not current verdicts.
- `LIVE_READ_ONLY` permits reads but cannot submit. `LIVE_AUTHORIZED` plus CLI `--submit`, configured RPC and allowlisted chain are necessary for the existing runner. This step issues no approval token and does no write.

## New preparation path

`src/playground/admission.mjs` reads both endpoint chain IDs, versions and blocks, checks the pinned basic paymaster code hash/balance, and produces per-source admission readiness. A role selected in the UI does not establish EIP-8141 authorization: the generic compiler currently detects `UNKNOWN` because a pasted source cannot resolve the HegotaSupport import or prove runtime behavior. Ordinary execution contracts require a separately deployed trusted sender/paymaster harness. Source is never rewritten.

The isolated candidate builder calls the real workshop signer only after exact analysis identity and verified context. Its result holds one raw signed encoding, one structured wire encoding, one transaction hash and both exact JSON-RPC method/parameter pairs. It never sends either request. The builder is currently a testable internal API, not exposed to public judges as a signing endpoint. Baseline verification gas is 50,000; a bounded gas variation can be signed separately. No static result or prior signature is loaded.

Identical bytes on both paths carry the same nonce. A later submission may be rejected as known/duplicate or may observe changed chain state. Such a response must be recorded as a collision/state confounder rather than an independent policy verdict. A true independent comparison would use separate fresh senders and signed bytes, while retaining equivalent semantic parameters.

## Fresh EF observations

Read-only JSON-RPC calls to both `https://altmempool.forshtat.com/rpc` and `https://altmempool.forshtat.com` returned chain ID `0x539` (1337) and block `0x220a`, then `0x220d` on the later check. Public client: `skandha/v4.1.1-`; alternative client: `ethrex/v23.0.0-eip8141-tracer-9aa3645d795945c64400f41a70aace0edfa7f383/...`. Both are reachable for reads. Submission support is established by the existing adapter/earlier evidence, not retested by a write in Step 1.

Pinned basic payer `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30` returned code `0x` and balance 0 wei. `FRAMEFUZZ_DEPLOYER_KEY` was absent from this process. No fresh signed comparison candidate can currently be prepared from pasted generic source. Current classification: `BLOCKED_PRECONDITION`; admission outcomes: none.

## One-shot operator packet for a first real pair — proposed, not approved

1. Choose an explicitly authorized devnet-only deployer wallet and confirm its address, pending nonce, and balance on chain 1337. Preserve the private key outside reports and commits.
2. Deploy `vendor/paymaster/ReserveReadingPaymaster.json` with `StateView=0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB`, pinned pool ID from `examples/live/devnet.json`, and 0.15 test ETH creation value. For the basic path, VERIFY calldata is empty, so no pool read is requested. Verify receipt/status, code hash, and contract balance before signing. Existing deploy helper uses gas limit 6,000,000 and gas price 2,000,000 wei: max deployment gas 0.000012 test ETH, plus 0.15 test ETH value.
3. Generate a fresh ephemeral sender key in memory per independent path; check nonce and zero balance. Build the unchanged-source action context only if a supported deployed execution target/harness is identified. Sign one baseline with the pinned workshop profile and, if feasible, one separately signed verification-gas boundary variant. Do not submit a generic pasted source as a validator.
4. Only after a new explicit approval covering the resolved contract address/code hash, wallet, nonce, exact request payloads, chain, path order and fee cap, submit public `eth_sendRawTransaction` and alternative `eth_sendFrameTransaction`. Record raw responses, timestamps, returned hashes, nonce transitions, duplicate/known-tx errors and receipts separately.

Proposed ceiling for the minimal deployment plus **one submission per path** is **0.152012 test ETH**: 0.15 creation value + 0.000012 deployment gas + 0.002 two-path frame cap. The 0.002 frame cap assumes 500,000 gas × 2 gwei on each path. Extra boundary variants, staking, or funding transfers are outside this packet. Recompute fee estimates and exact calldata against the fresh chain before asking for approval; do not interpret this proposal as authorization. A generic pasted contract may require its own deployment and a larger revised packet.

## Verification

- `node --test test/playground-admission.test.mjs`: 3 pass.
- `npm test`: 217 pass, 0 fail (with localhost integration test access).
- `node --check web/js/playground.js`; `node --check src/playground/http.mjs`; `git diff --check`: pass.
- Read-only JSON-RPC `eth_chainId`, `web3_clientVersion`, `eth_blockNumber`, `eth_getCode`, `eth_getBalance`: observed above.

Next Step 2 requires separate authorization after the actual deployer wallet, deployment, source/harness role, and fee scope are resolved. Step 1 stops here.
