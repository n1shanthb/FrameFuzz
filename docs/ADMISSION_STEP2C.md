# Step 2C — first live self-funded admission comparison

Executed November 7, 2026 IST against explicitly authorized EF chain 1337. This is an infrastructure experiment with no pasted-contract participation.

## Exact candidate and preflight

- Hash/raw identity: `0xd4d6123f6b142acccb5cf6c302877fe7a1ed499bd3bfb0263c70763febbba226`
- Sender/payer: `0x366E6203603C39Eec1e75b3be6f078911447f235`
- Sender before submission: balance `500000000000000` wei, pending nonce 0, code `0x`
- Both endpoint chain IDs: 1337
- Public client: `skandha/v4.1.1-`
- Alternative client: `ethrex/v23.0.0-eip8141-tracer-9aa3645d795945c64400f41a70aace0edfa7f383`
- Signed maximum fee: 2,000,000,000 wei/gas
- Conservative gas upper bound: 103,254
- Maximum sender expenditure: `206508000000000` wei = 0.000206508 test ETH
- Observed gas price: 4,976,654 wei, below the signed cap
- Canonical receipt before submission: null; sender nonce remained 0. The alternative frame-receipt method was unsupported, so absence from every possible private mempool could not be proven.

Offline regeneration recovered the same signer, signature hash, raw bytes, structured wire object and transaction hash. The candidate was not rebuilt or re-signed.

## Requests and observed results

Public was initiated first and alternative immediately afterward without awaiting either response. Neither request was retried.

| Path | Endpoint / method | Observed response | Classification |
| --- | --- | --- | --- |
| Public | `https://altmempool.forshtat.com/rpc` / `eth_sendRawTransaction` | returned the exact candidate hash | `ACCEPTED` |
| Alternative | `https://altmempool.forshtat.com` / `eth_sendFrameTransaction` | JSON-RPC `-32601 Method not found` | `UNOBSERVED_METHOD_UNSUPPORTED`, not rejection |

The public transaction was canonically included in block `0x23c1` with outer status `0x1`. Both frame receipts have status `0x1`. Gas used was 20,102 at the signed effective price of 2 gwei, for an actual sender expenditure of `40204000000000` wei (0.000040204 test ETH). Post-state: balance `459796000000000` wei, pending nonce 1, code `0x`.

This proves one genuine self-funded EIP-8141 transaction flowed through FrameFuzz, was publicly admitted, included and executed successfully. It does **not** establish an alternative-mempool admission verdict because the configured alternative method was unavailable. Retrying the now-included transaction on a newly discovered endpoint would yield duplicate/nonce-confounded evidence and was not attempted.

Full raw requests, responses, timestamps and receipt: `evidence/admission/2026-11-07/self-relay-first-comparison.json`.

No deployment or additional funding was required. Duplicate, already-known and timeout responses remain inconclusive by policy; none was converted into an invented verdict.
