# Step 2B — exact EF funding preparation

Read-only checkpoint, November 7, 2026 IST. No faucet request, transfer signing, transaction submission, paid model call, Arkiv write or Git push occurred.

## Network separation and current balances

The existing sender remains `0x366E6203603C39Eec1e75b3be6f078911447f235`; no replacement was generated. Fresh reads returned:

- EF chain `1337`: balance **0 wei**, pending nonce 0, code `0x` on both the official gateway and the existing FrameFuzz endpoint.
- Arkiv Rabdi chain `7794095` (`0x76edaf`): balance **10 tGLM** (`10000000000000000000` wei).

Rabdi tGLM is separate testnet state and is not transferable to the EF chain by the FrameFuzz workflow.

## Official workshop procedure

The [official workshop quickstart](https://docs.altmempool.wtf/guides/quickstart/) uses `step_1_check`, which asks the gateway faucet to fund a participant. The current workshop repository routes every request through `https://altmempoolgateway.forshtat.com/rpc` and calls `skandha_explorer_faucet`. The [official devnet documentation](https://github.com/forshtat/mempool-workshop-sidecar/blob/master/deploy/devnet/devnet-readme.md) states that the faucet sends 1 test ETH once per hour per address. Current `skandha_explorer_info` returned `faucetEnabled: true`.

That faucet is unsuitable for the requested exact 0.0005 amount because its implementation fixes every drip at 1 ETH. The same official devnet documentation publishes a throwaway genesis account specifically for this chain. Its public address is `0x5544596212F91984C986A919C8026DF0576816f9`; it is also the current block producer/relayer and is shared, so its pending nonce can change at any time. The documented private key is intentionally not copied into FrameFuzz source, artifacts, reports or chat. A later authorized executor must load it locally as `FRAMEFUZZ_EF_FUNDING_KEY`, derive the published source address, and stop if it does not match.

## Resolved read-only source and transfer

The ignored machine-readable packet is `runs/step2b-ef-funding-packet.json`.

| Field | Resolved value |
| --- | --- |
| Chain / endpoint | 1337 / `https://altmempoolgateway.forshtat.com/rpc` |
| Funding source | `0x5544596212F91984C986A919C8026DF0576816f9` |
| Source code | `0x` |
| Source balance | `899851656336000578878583` wei at packet capture |
| Latest / pending nonce | 145 / 145 at packet capture |
| Recipient | `0x366E6203603C39Eec1e75b3be6f078911447f235` |
| Recipient state | balance 0, pending nonce 0, code `0x` |
| Value | `500000000000000` wei = 0.0005 test ETH |
| Live `eth_estimateGas` | 207,391 gas |
| Gas limit | 250,000, matching the official workshop legacy cap |
| Current gas price | 8 wei |
| Explicit gas-price cap | 2,000,000 wei = 0.002 gwei, matching the workshop |
| Maximum gas fee | `500000000000` wei = 0.0000005 test ETH |
| Maximum source debit | `500500000000000` wei = 0.0005005 test ETH |
| Approval digest | `60b68b599ba011ad2c6b4f15e21e9b5776a466b8c0709d6cb8d2e49bbf311efa` |

The 0.0005 value is transferred principal and becomes the self-funded sender's balance. It is not gas expenditure. The funding gas ceiling is separate. The prepared frame transaction's conservative fee upper bound is 0.000206508 test ETH, so the requested funding covers it with residual balance if execution charges less than the allocation.

## Exact one-transfer approval packet

Proposed write, awaiting separate authorization:

`chainId=1337`, legacy transaction, source `0x5544596212F91984C986A919C8026DF0576816f9`, recipient `0x366E6203603C39Eec1e75b3be6f078911447f235`, value `500000000000000` wei, data `0x`, gas limit `250000`, gas price no more than `2000000` wei, nonce refreshed from the source's pending nonce immediately before signing, maximum source debit `500500000000000` wei.

The packet captured nonce 145, but the shared account makes that field volatile. Immediately before signing, re-read chain ID, source derived address, source latest/pending nonce and balance, recipient balance/code/pending nonce, current gas price and estimate. If the pending nonce is no longer 145, generate a replacement packet and approval digest and stop for review. Submit once through the official gateway, record the raw response and transaction hash, wait for a matching status-1 receipt, then independently verify the recipient balance increased by exactly 0.0005 test ETH. No retry is authorized automatically.

After funding confirmation, rerun the existing candidate preparation/revalidation. Require sender balance ≥0.0005 test ETH, code `0x`, pending nonce 0, chain 1337, pinned client/profile, unchanged signature recovery and transaction hash `0xd4d6123f6b142acccb5cf6c302877fe7a1ed499bd3bfb0263c70763febbba226`. Only then prepare a separate approval for public `eth_sendRawTransaction` and alternative `eth_sendFrameTransaction`. A duplicate/known response remains inconclusive rather than an invented verdict.

## Verification

- `node scripts/step2b-prepare-funding.mjs`: read-only packet generated; writes 0, broadcasts 0.
- `node --test test/ef-funding.test.mjs test/self-relay.test.mjs`: 5 pass.
- `npm test`: 222/222 pass, 0 fail with localhost integration-test access.
- `FRAMEFUZZ_EF_FUNDING_KEY`: absent from process, user and ignored local `.env`; no funding transaction can currently be signed.
