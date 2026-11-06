# Step 2D — canonical versus alternative endpoint correction

Read-only/offline checkpoint, November 7, 2026 IST. No broadcast, transfer, deployment, Arkiv write, paid model call or Git push occurred. Official method reference: [Alt Mempool RPC methods](https://docs.altmempool.wtf/reference/rpc-methods/).

## Verified topology and capabilities

| Role | Endpoint | Identity | Submission |
| --- | --- | --- | --- |
| Canonical execution | `https://altmempool.forshtat.com` | `ethrex/v23.0.0-eip8141-tracer-9aa3645d795945c64400f41a70aace0edfa7f383` | `eth_sendRawTransaction` with locally signed type-`0x06` bytes |
| Alternative sidecar | `https://altmempool.forshtat.com/rpc/` | `skandha/v4.1.1-` | `eth_sendFrameTransaction` with the structured signed frame object |

Both returned `eth_chainId = 0x539` (1337). Read-only sidecar health returned:

- `skandha_explorer_info`: version `v4.1.1`, chain 1337, bundling `auto`, P2P enabled, history capacity 10,000, boot ID `6ba711bc5014aeb0`.
- `skandha_config`: chain 1337, `redirectRpc: true`, `rpcEndpointSubmit: true`, validation gas limit 10,000,000, standard mempool configured.
- `skandha_explorer_getTransaction(0xd4d612…ba226)`: JSON-RPC `-32600`, `Frame transaction not found`.

Therefore the included nonce-0 transaction has no recoverable sidecar admission report. Its canonical inclusion remains valid historical evidence, but it is not retroactively relabeled as a separate alternative admission. The immutable Step 2C JSON was not modified.

## Code correction

`src/adapters/ef-routing.mjs` classifies endpoints using chain ID plus actual `web3_clientVersion`, not URL labels. Ethrex is required for canonical raw submission and Skandha for alternative structured submission. Unknown, reversed or wrong-chain identities fail closed. Self-relay, Playground candidate construction, mutation campaign defaults and the live configuration now use the corrected mapping.

The raw bytes and structured request are generated from the same signed transaction model. Regression tests assert their respective parameter shapes and fixed endpoint roles, and reject reversed identities.

## Fresh nonce-1 candidate

- Hash: `0xc05703acca2def2f89567ac33618b48a44b7eb021c2db0023e5f3b90227ba510`
- Sender/payer: `0x366E6203603C39Eec1e75b3be6f078911447f235`
- Pending nonce: 1; code: `0x`
- Balance: `459796000000000` wei = 0.000459796 test ETH
- Observed gas price: 7,166,380 wei = 0.00716638 gwei
- Signed maximum fee: 2 gwei
- Conservative gas upper bound: 103,254
- Maximum sender expenditure: `206508000000000` wei = 0.000206508 test ETH
- Proposed operator ceiling: `210000000000000` wei = 0.00021 test ETH
- Minimum remaining balance after the signed maximum: `253288000000000` wei

The candidate fits the current balance and proposed ceiling. It was signed offline using the existing ignored devnet-only sender key. It has not been submitted. Machine-readable candidate: ignored `runs/step2d-corrected-candidate.json`.

## One-shot approval packet

Awaiting approval for exactly one request per path using the unchanged hash above:

1. Initiate alternative first at `https://altmempool.forshtat.com/rpc/` with `eth_sendFrameTransaction` and the candidate's structured signed object.
2. Immediately initiate canonical at `https://altmempool.forshtat.com` with `eth_sendRawTransaction` and the candidate's signed type-`0x06` bytes, without waiting for the alternative response.
3. No retries. Maximum sender expenditure `0.000206508` test ETH under an operator ceiling of `0.00021` test ETH. No funding or deployment.
4. Capture both raw requests/responses/timestamps. Query the canonical receipt and `skandha_explorer_getTransaction` independently.
5. Duplicate, known, timeout, nonce-consumed or already-included responses remain inconclusive for that path. A Skandha explorer record is required to claim alternative admission.

Before signing/submission, refresh both identities, chain IDs, sidecar health, sender balance/code/pending nonce, gas price, absence of a canonical receipt and absence of a sidecar record. Any hash, nonce, endpoint identity or fee-cap change invalidates this packet.
