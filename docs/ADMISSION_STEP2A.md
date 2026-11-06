# Step 2A — self-funded EOA admission preparation

Read-only / offline checkpoint, November 7, 2026 IST. This is an **infrastructure candidate**, not Bring Your Own Contract (BYOC) admission evidence. No funding, deployment, admission submission, paid model call, Arkiv write or Git push occurred.

## A. Can self-funded run without a paymaster?

**YES at the pinned protocol/source level; runtime admission remains unverified.** The advertised ethrex commit `9aa3645d795945c64400f41a70aace0edfa7f383` recognizes `SelfVerify` as a VERIFY frame with scope `EXECUTION_AND_PAYMENT` targeting `tx.sender`. Its default-code VERIFY path accepts a canonical secp256k1 signature at index 0 whose resolved signer equals the EOA target, then calls the same approval handler as a contract validator. No paymaster or validator deployment is needed for this EOA path. [Pinned transaction implementation](https://github.com/lambdaclass/ethrex/blob/9aa3645d795945c64400f41a70aace0edfa7f383/crates/common/types/transaction.rs), [pinned default-code VERIFY implementation](https://github.com/lambdaclass/ethrex/blob/9aa3645d795945c64400f41a70aace0edfa7f383/crates/vm/levm/src/opcode_handlers/frame_tx.rs), [sidecar prefix documentation](https://docs.altmempool.wtf/concepts/frame-transactions/). The current execution RPC advertised that exact ethrex commit. The deployed sidecar commit is not attested. No funding or runtime execution occurred here.

This differs from `src/adapters/self-funded-validator.mjs`, which uses an **ARBITRARY** owner witness and needs a deployed owned validator. The new minimum path uses the existing workshop `signTx` with scheme **SECP256K1** and empty `msg`, the pinned `ethrex-eip8141-tracer` profile, and the EOA default-code VERIFY rule.

## B. Shortest route and exact candidate

Zero contract deployments. One devnet EOA funding transfer, then two endpoint submissions carrying the **same signed identity**. The second submission may report duplicate/known, nonce conflict or already-included; that is an inconclusive path observation, not a policy rejection. The two submissions do not necessarily provide independent policy observations on a shared network. If independent verdicts are required, the subsequent experiment must fund and sign a second isolated EOA candidate.

Offline candidate is in ignored `runs/step2a-self-relay-candidate.json`; private key is only in ignored local `.env` as `FRAMEFUZZ_SENDER_KEY`. No private key is in the artifact. Its hash is `0xd4d6123f6b142acccb5cf6c302877fe7a1ed499bd3bfb0263c70763febbba226`, sender/payer `0x366E6203603C39Eec1e75b3be6f078911447f235`, pending nonce sequence 0/key 0 at preparation, and source digest **null** because no pasted Solidity was supplied or executed. VERIFY frame: mode 1, flags 3, target sender (encoded `null`), execution gas 30,000, state gas 0, empty data. SENDER frame: mode 2, target the same EOA, execution gas 50,000, state gas 0, value 0, empty data. Scheme 1 signature is 65 bytes. Signing-hash recovery and codec roundtrip pass locally. Validation prefix uses 30,000 + 2,800 signature gas against the pinned 100,000 maximum.

Public request: `POST https://altmempool.forshtat.com/rpc`, `eth_sendRawTransaction`, parameter 0 = exact signed type-0x06 hex in the local artifact. Alternative request: `POST https://altmempool.forshtat.com`, `eth_sendFrameTransaction`, parameter 0 = the structured `wire` object for the **same** signed transaction. This method split is in the existing workshop adapter and [sidecar RPC reference](https://docs.altmempool.wtf/reference/rpc-methods/). No send method was called. Actual submission timestamps will be recorded at submission; none exist yet. Query canonical `eth_getTransactionReceipt` and sidecar `eth_getFrameTransactionReceipt` by hash afterward, retaining admission and inclusion separately.

## C. Pasted Solidity participation

**None in this candidate.** There is no pasted Solidity in this Step 2A request, so source digest and compiler artifact are null. The EOA default-code experiment validates only the underlying frame codec, signature, fee payment and endpoint comparison. It cannot be displayed as a test of a user's contract. To make an ordinary pasted contract participate, compile its exact source to creation/runtime bytecode, deploy that exact artifact as an execution target, and use its ABI to generate the SENDER frame data; a separate EOA self-verify can pay. That adds a contract deployment and a source-to-address/bytecode/constructor binding. For a pasted validator/paymaster, the compiler must support its exact dependency graph and prove a compatible runtime approval role; the current self-contained compiler does not resolve imports or make such a claim. This integration remains unimplemented.

## D–E. Wallet, transactions and maximum spend

Read-only chain 1337 checks: public `skandha/v4.1.1-`, alternative `ethrex/v23.0.0-eip8141-tracer-9aa3645d795945c64400f41a70aace0edfa7f383`, both at block `0x226a` when prepared. Sender code `0x`, balance **0 wei**, pending nonce **0**. `eth_gasPrice` reported 8 wei; the signed candidate caps at **2 gwei**. `FRAMEFUZZ_DEPLOYER_KEY` is absent in this process, but no deployer is needed on the EOA route. A separate funding wallet with chain-1337 test ETH is not yet configured or identified; its balance and nonce remain unknown. Do not use the separate Arkiv chain-7794095 wallet.

| Planned write | From → to | Value | Maximum fee exposure |
| --- | --- | ---: | ---: |
| EOA funding transfer, nonce unresolved | operator testnet funding wallet → `0x366E6203603C39Eec1e75b3be6f078911447f235` | 0.0005 test ETH | 21,000 gas × 2 gwei = 0.000042 test ETH, only if recipient remains code-empty |
| Public admission | signed sender → itself; zero-value SENDER frame | 0 | Pinned conservative 103,254 gas × 2 gwei = 0.000206508 test ETH; hard allocation 0.0005 test ETH |
| Alternative admission of the **same bytes** | same sender, nonce, hash | 0 | No second execution fee if the same transaction is included once; separate RPC response still required |

**Operator funding wallet balance needed: at least 0.000542 test ETH.** This is 0.0005 transferred to the sender plus a 0.000042 transfer-gas ceiling. The 0.0005 is prefunding, not immediately spent gas; any remainder remains at the sender. Total economic exposure is capped at 0.000542 test ETH for this packet. There are **zero deployments**, zero constructor values, and no paymaster stake/funding. The prior 0.152012 test ETH proposal is superseded for this EOA experiment. The theoretical frame fee estimate from the current envelope is lower than the sender funding allocation; runtime fee calculation still needs confirmation after funding. Do not increase the signed fee cap automatically.

## F–G. Blockers and final one-shot authorization packet

Current blockers: sender has zero balance; operator funding wallet address/key/balance/nonce are unresolved; execution and sidecar runtime admission of this exact candidate are unverified. Funding changes the network state, so recheck chain ID, sender code/balance/pending nonce, funding source balance/nonce, client versions and head immediately before writing. If the EOA nonce or code changed, discard and re-sign a new candidate. If the signed fee cap is incompatible with current rules, stop and prepare a new packet. Public judges must never access the funding key.

The smallest eventual approval request is: **on EF chain 1337 only, one funding transfer of 0.0005 test ETH to the sender above, gas ≤21,000 at ≤2 gwei; then submit the exact locally saved signed hash once through public raw RPC and once through alternative structured RPC; query receipts; no deployment, no extra variant, no retry, no Arkiv write; maximum 0.000542 test ETH moved from the funding wallet.** This is a proposal, not authorization. Exact source wallet, its nonce and balance, and fresh pre-write state must be filled before any approval can execute it safely.

## Verification

`node --test test/self-relay.test.mjs`: 3 pass, including ECDSA recovery, codec roundtrip, fresh identity and distinct mock path responses. `node --env-file=.env scripts/step2a-prepare-self-relay.mjs`: read-only EF checks, locally signed artifact, 0 broadcasts. `npm test`: **220/220 pass, 0 fail**. No observed ACCEPT/REJECT outcomes exist for this candidate.
