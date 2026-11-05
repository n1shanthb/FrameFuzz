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

Missing live imports: the known-good workshop encoder and signer, paymaster contract ABIs/sources, funding/deployment/stake receipt logic, authorized network configuration, full deployed addresses and original evidence, pinned sidecar rule provenance. See `UP_NEXT.md`. No compatible signer exists in the supplied archive.
