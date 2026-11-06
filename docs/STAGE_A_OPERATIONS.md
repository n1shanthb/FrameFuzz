# Stage A — normal-mode readiness and approval boundary

Launch the real normal dashboard in read-only mode:

```powershell
node --env-file=.env bin/framefuzz.mjs serve --mode LIVE_READ_ONLY --results runs --port 4177
```

Open `http://127.0.0.1:4177`, then Live Readiness. `SAVED_DEMO` never contacts a provider or chain and can never write, regardless of supplied keys. `LIVE_READ_ONLY` permits only explicit bounded read probes. `LIVE_AUTHORIZED` names a future execution posture, but Stage A still exposes no approval token, signing, submit, publish, or broadcast implementation.

## Configuration

- OpenRouter: `OPENROUTER_API_KEY`, optional `OPENROUTER_MODEL`, optional `OPENROUTER_ENDPOINT`.
- Arkiv Rabdi: `ARKIV_PRIVATE_KEY`, optional `ARKIV_ACCESS_KEY`, optional read-only `ARKIV_READER_ADDRESS`.
- EIP-8141: `FRAMEFUZZ_DEPLOYER_KEY`, `FRAMEFUZZ_RPC`, `FRAMEFUZZ_PUBLIC_RPC`, `FRAMEFUZZ_ALT_RPC`, optional `FRAMEFUZZ_LIVE_CONFIG`.
- Existing offline investigator opt-in: `FRAMEFUZZ_SWARM=on`.

Credentials are readiness inputs, not authority. OpenRouter calls still require deliberate per-run UI consent and the existing cost/call limits. The readiness panel itself makes zero provider calls.

## Exact prepared operations

`ARKIV_PUBLISH` prepares an immutable readonly Rabdi entity manifest for chain 7794095 with source report, case index, expiration, unresolved/derived writer, and a canonical SHA-256 manifest digest. Pathway: prepare → approve → submit → reconcile → query → verify → import.

`EIP8141_UNISWAP_COMPARE` prepares the first minimal EF transaction manifest for chain 1337: one `uniswap-v4-paymaster` basic-sponsorship comparison, public `eth_sendRawTransaction`, alternative `eth_sendFrameTransaction`, expected accept/accept, and bounded receipt wait. Pathway: inspect → prepare → approve → broadcast → reconcile → verify.

Both stop at approval. An approval request must identify the operation and exact manifest digest, is declared one-time, and returns no token. Submit controls remain disabled. A later separately authorized stage must revalidate chain, endpoint, balances, nonce, bytecode/configuration, and digest immediately before any signature or write.
