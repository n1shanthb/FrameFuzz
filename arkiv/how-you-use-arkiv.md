# How FrameFuzz uses Arkiv

Official docs: https://docs.arkiv.network. SDK: `@arkiv-network/sdk@1.0.1`. Network: Rabdi, chain **7794095**, RPC https://rpc.rabdi.db-chain.testnet.arkiv.network, test gas token tGLM. This is separate from the frame-transaction devnet on chain 1337.

Writer/publisher/current owner: `0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715`.

Real entity: `0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1`.

Creation transaction: `0x0158db1bec0a20a8671ba18d0d9776b437a6a5cdb18970948a6c51d8fe5e8388`. Receipt: **success**, block **267241**, gas **314427**. Expires at block **569638**. Complete receipt and payload: `evidence/arkiv/2026-11-06/publish.json`.

## Publish

Configure a separate funded Rabdi test wallet as `ARKIV_PRIVATE_KEY` in the process environment; do not put the key in commands, reports or Git. `ARKIV_ACCESS_KEY` is optional. Then:

```powershell
node bin/framefuzz.mjs arkiv publish evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json --case-index 0 --expiration-blocks 302400 --submit --output evidence/arkiv/2026-11-06/publish.json
```

The command makes a real SDK `createEntity` transaction, validates the Rabdi chain, preserves the complete receipt/key and publishes a sanitized semantic projection. Never run it merely to view a case: it creates a new paid testnet entity.

## Query, retrieve, import

These commands need no signing key. Run query in a fresh process:

```powershell
node bin/framefuzz.mjs arkiv query --suite verification-gas --rule MAX_VERIFY_GAS --output evidence/arkiv/2026-11-06/query-fresh-process.json
node bin/framefuzz.mjs arkiv fetch --key 0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1
node bin/framefuzz.mjs arkiv import --key 0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1 --results runs
```

Optional query flags: `--implementation forshtat-1337-observed-2026-11-06.v1`, `--owner 0x...`, `--limit 20`. By default discovery crosses all publishers. SDK expression: `arkiv.schema = str('framefuzz.regression.v1') AND $expiresAt > u64(CURRENT_BLOCK) AND suite = str('verification-gas') AND ruleId = str('MAX_VERIFY_GAS')`; current block is obtained freshly from Rabdi, not hardcoded.

Start `node bin/framefuzz.mjs serve --results runs --port 4177`. Open Community Cases, filter and Query Arkiv, select the retrieved row, inspect owner/creator/expiry/content and click **Open selected case as replay PREVIEW**. Each query/fetch/import reads Arkiv through the SDK. There is no local registry cache. Expiry, creator/attributes, schema/digests and semantic regeneration are checked before import.

The selected demo regenerates seed42 variant0, payer verification gas **67198**, with **zero broadcasts** and no signer/setup calls. Original LIVE receipts remain under `communityOrigin.originalOutcomes`; new path outcomes are inconclusive/not checked. UNKNOWN confidence is intentional for untrusted remote claims. JSON, Markdown and replay exports preserve this separation. Imported cases supply no executable references or stale signatures. CLI/API reject community submission flags.

Verification: `npm test` passes 66 tests including eight Arkiv tests with mocked SDK JSON-RPC transport, schema/digest tampering, ownership, expiry, chain isolation, preview safety and dashboard import. The real demo is separate from automated mocked tests. Saved evidence proves fresh-process query and actual dashboard retrieval/import, not a second live EIP-8141 run.
