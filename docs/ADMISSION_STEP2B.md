# Step 2B — exact EF funding preparation

Funding execution checkpoint, November 7, 2026 IST. One explicitly authorized EF devnet transfer was confirmed. No admission submission, paid model call, Arkiv write or Git push occurred.

## Executed result

- Transaction: `0x9b16d59eb1bca1070d7fcf7ce01b75c11caa519ad6b84423a93586d5bcf873ef`
- Receipt: success, block 9083
- Source nonce: 146
- Value: `500000000000000` wei
- Gas: 204,600 used at 3,456,010 wei/gas
- Actual gas charge: `707099646000` wei
- Actual total source debit: `500707099646000` wei
- Recipient after confirmation: balance `500000000000000` wei, pending nonce 0, code `0x`

The quote exceeded the earlier 0.003 gwei packet. After explicit user approval to proceed, execution enforced a new 0.005 gwei hard ceiling; the observed pre-sign maximum-debit bound was `500864002500000` wei. The documented public workshop key existed only in process memory and was neither printed nor persisted. The transaction was submitted once with no retry.

## Network separation and current balances

The existing sender remains `0x366E6203603C39Eec1e75b3be6f078911447f235`; no replacement was generated. Fresh reads returned:

- EF chain `1337`: post-receipt balance **500000000000000 wei**, pending nonce 0, code `0x`.
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
| Source balance | `899850661361025185745676` wei at packet capture |
| Latest / pending nonce | 146 / 146 at packet capture |
| Recipient | `0x366E6203603C39Eec1e75b3be6f078911447f235` |
| Recipient state | balance 0, pending nonce 0, code `0x` |
| Value | `500000000000000` wei = 0.0005 test ETH |
| Live `eth_estimateGas` | 207,391 gas |
| Gas limit | 250,000, matching the official workshop legacy cap |
| Current gas price | 2,400,008 wei |
| Explicit gas-price cap | 3,000,000 wei = 0.003 gwei |
| Maximum gas fee | `750000000000` wei = 0.00000075 test ETH |
| Maximum source debit | `500750000000000` wei = 0.00050075 test ETH |
| Approval digest | `854693298e68e6c1241895127a2921eb6bdd25c5bfd7d8bf374e9a7964750806` |

The 0.0005 value is transferred principal and becomes the self-funded sender's balance. It is not gas expenditure. The funding gas ceiling is separate. The prepared frame transaction's conservative fee upper bound is 0.000206508 test ETH, so the requested funding covers it with residual balance if execution charges less than the allocation.

## Exact one-transfer approval packet

Historical approved packet (now executed):

`chainId=1337`, legacy transaction, source `0x5544596212F91984C986A919C8026DF0576816f9`, recipient `0x366E6203603C39Eec1e75b3be6f078911447f235`, value `500000000000000` wei, data `0x`, gas limit `250000`, gas price no more than `3000000` wei, nonce 146, maximum source debit `500750000000000` wei.

The packet captured nonce 146, but the shared account makes that field volatile. Immediately before signing, re-read chain ID, source derived address, source latest/pending nonce and balance, recipient balance/code/pending nonce, current gas price and estimate. If the pending nonce is no longer 146 or gas exceeds the cap, generate a replacement packet and approval digest and stop for review. Submit once through the official gateway, record the raw response and transaction hash, wait for a matching status-1 receipt, then independently verify the recipient balance increased by exactly 0.0005 test ETH. No retry is authorized automatically.

After funding confirmation, rerun the existing candidate preparation/revalidation. Require sender balance ≥0.0005 test ETH, code `0x`, pending nonce 0, chain 1337, pinned client/profile, unchanged signature recovery and transaction hash `0xd4d6123f6b142acccb5cf6c302877fe7a1ed499bd3bfb0263c70763febbba226`. Only then prepare a separate approval for public `eth_sendRawTransaction` and alternative `eth_sendFrameTransaction`. A duplicate/known response remains inconclusive rather than an invented verdict.

## Verification

- `node scripts/step2b-prepare-funding.mjs`: read-only packet generated; writes 0, broadcasts 0.
- `node --test test/ef-funding.test.mjs test/self-relay.test.mjs`: 5 pass.
- `npm test`: 181/181 pass, 0 fail with localhost integration-test access.
- `node --env-file=.env scripts/step2a-prepare-self-relay.mjs`: unchanged candidate regenerated after funding; funding status `FUNDED`, writes 0.
