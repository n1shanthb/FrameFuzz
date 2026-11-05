# Signer adapter contract

`src/adapters/index.mjs` wraps an actual encoder/signer plugin. It does not implement cryptography or claim mock bytes are real transactions. A trusted local module default-exports an async factory returning:

```js
export default async function () {
  return {
    id: 'your-workshop-version',
    mode: 'LIVE', // MOCK for tests only
    async accountFor({ caseId, pathId, rpcUrl, chainId }) { /* isolated sender + private in-memory context */ },
    async setup({ account, setup, rpcUrl, chainId }) { /* deploy/fund/stake; wait for receipts; fail on revert */ },
    async getNonce({ account, blockTag, rpcUrl }) { /* return decimal pending nonce */ },
    async sign({ account, sender, nonce, chainId, model, rpcUrl }) { /* return { raw: actualSignedBytes } */ },
  };
}
```

Read keys from environment variables in the plugin factory. Never return credentials as metadata or interpolate them into thrown error messages. `accountFor` must allocate a distinct account for every case/path in a session. Merely incrementing nonces fails when preceding transactions are rejected. The signer must encode the supplied sender/nonce/chain/model correctly and independently sign every variation; the wrapper validates shape and uniqueness, not cryptographic validity. Funding/setup must use the selected endpoint and checked chain; plugins must not silently send to other chains.

The runner preflights every endpoint before invoking any builder or setup. It builds lazily in submission order, runs setup, then queries the pending nonce, then signs. Builds are serialized; failures poison the session to prevent uncertain state reuse. Recreate the plugin for the next run, and query fresh chain state. A process crash may leave setup transactions or test transactions pending; inspect chain state before retrying.

Replay metadata exports only adapter ID, sender, decimal nonce, checked chain ID, case/path ID, and explicit MOCK/LIVE mode. Signed bytes are included in a separate replay fixture; they may become stale and are not safe to rebroadcast automatically. Prefer rebuilding through the original adapter with isolated accounts. RPC credentials and keys must be supplied separately.

## Structured alternative submissions

`sign` may return `{ raw, submission: { method, params }, evidence }`. `raw` is always the canonical signed encoding used for fingerprint/duplicate checks. `submission` must match the selected method and contain exactly one parameter. The integrated workshop adapter uses structured `toWire(signed)` for `eth_sendFrameTransaction` and raw type-0x06 bytes for canonical `eth_sendRawTransaction`; passing raw bytes to the former is not compatible with this devnet.

Optional `evidence` is allowlisted to hash, payer, payer/sender balances, verification gas, StateView and pool ID under `metadata.transaction`. Account objects and private keys never enter evidence. The plugin is responsible for ensuring structured and raw representations describe the same signed transaction; the integration tests recover its actual signature and check the codec roundtrip.

## Working LIVE integration

`workshop-codec.mjs` reuses the actual pinned upstream encoding/signing library and PoC frame construction. `workshop-live.mjs` allocates ephemeral sender keys and verifies configured sponsors' code hash, balance, stake and Uniswap reads. `workshop-setup.mjs` deploys the supplied original paymaster artifact from a funding key supplied through the process environment. It waits for a successful receipt before updating the configuration; no automatic restaking or genesis fallback is performed.

Use the individual `examples/live/*.mjs` fixtures for the verified snapshot. The default LIVE plugin factory also accepts `FRAMEFUZZ_LIVE_CONFIG` for custom configurations. Endpoint authorization and chain1337 are mandatory; tests use dependency injection to verify behavior without contacting live infrastructure. Sponsor contracts need no new setup for each path when existing state already matches the scenario.

Source/artifact imports are now present under `vendor/`. Exact execution-client commit and runtime rule checks are verified; the sidecar's commit field is blank, so its reviewed source pin is explicitly marked as a partial deployment provenance match. See `BUILD_STATUS.md` and `UP_NEXT.md`.

## Generated mutation campaigns

`src/mutations/campaign.mjs` compiles generated unsigned model/setup pairs into lazy `prepare` calls on this same adapter. Every path calls `build` independently. A preview never instantiates/invokes the plugin. Storage mutations select checked basic/unstaked/staked fixtures; setup is a verified environment requirement, not arbitrary signed-byte manipulation or automatic restaking. Rule oracle confidence/coverage/descriptors are layered on the runner's saved results, preserving the original receipt state. See `docs/MUTATIONS.md`.
