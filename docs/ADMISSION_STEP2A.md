# Step 2A — self-funded EOA admission preparation

Read-only / offline checkpoint, November 7, 2026 IST. This is an **infrastructure candidate**, not Bring Your Own Contract (BYOC) admission evidence. No funding, deployment, admission submission, paid model call, Arkiv write or Git push occurred.

## A. Can self-funded run without a paymaster?

**YES at the pinned protocol/source level; runtime admission remains unverified.** The advertised ethrex commit `9aa3645d795945c64400f41a70aace0edfa7f383` recognizes `SelfVerify` as a VERIFY frame with scope `EXECUTION_AND_PAYMENT` targeting `tx.sender`. Its default-code VERIFY path accepts a canonical secp256k1 signature at index 0 whose resolved signer equals the EOA target, then calls the same approval handler as a contract validator. No paymaster or validator deployment is needed for this EOA path. [Pinned transaction implementation](https://github.com/lambdaclass/ethrex/blob/9aa3645d795945c64400f41a70aace0edfa7f383/crates/common/types/transaction.rs), [pinned default-code VERIFY implementation](https://github.com/lambdaclass/ethrex/blob/9aa3645d795945c64400f41a70aace0edfa7f383/crates/vm/levm/src/opcode_handlers/frame_tx.rs), [sidecar prefix documentation](https://docs.altmempool.wtf/concepts/frame-transactions/). The current execution RPC advertised that exact ethrex commit. The deployed sidecar commit is not attested. No funding or runtime execution occurred here.

This differs from `src/adapters/self-funded-validator.mjs`, which uses an **ARBITRARY** owner witness and needs a deployed owned validator. The new minimum path uses the existing workshop `signTx` with scheme **SECP256K1** and empty `msg`, the pinned `ethrex-eip8141-tracer` profile, and the EOA default-code VERIFY rule.

## B. Shortest route and exact candidate

Zero contract deployments. One devnet EOA funding transfer, then two endpoint submissions carrying the **same signed identity**. The second submission may report duplicate/known, nonce conflict or already-included; that is an inconclusive path observation, not a policy rejection. The two submissions do not necessarily provide independent policy observations on a shared network. If independent verdicts are required, the subsequent experiment must fund and sign a second isolated EOA candidate.

Offline candidate is in ignored `runs/step2a-self-relay-candidate.json`; private key is only in ignored local `.env` as `FRAMEFUZZ_SENDER_KEY`. No private key is in the artifact. Its hash is `0xd4d6123f6b142acccb5cf6c302877fe7a1ed499bd3bfb0263c70763febbba226`, sender/payer `0x366E6203603C39Eec1e75b3be6f078911447f235`, pending nonce sequence 0/key 0 at preparation, and source digest **null** because no pasted Solidity was supplied or executed. VERIFY frame: mode 1, flags 3, target sender (encoded `null`), execution gas 30,000, state gas 0, empty data. SENDER frame: mode 2, target the same EOA, execution gas 50,000, state gas 0, value 0, empty data. Scheme 1 signature is 65 bytes. Signing-hash recovery and codec roundtrip pass locally. Validation prefix uses 30,000 + 2,800 signature gas against the pinned 100,000 maximum.

Historical preparation used reversed endpoint labels. Step 2D corrected the mapping after actual client/capability probes: canonical is `POST https://altmempool.forshtat.com` with `eth_sendRawTransaction` and exact signed type-0x06 bytes; alternative is `POST https://altmempool.forshtat.com/rpc/` with `eth_sendFrameTransaction` and the structured `wire` object for the same signed transaction. See `docs/ADMISSION_STEP2D.md`. This correction does not rewrite the nonce-0 evidence.

## C. Pasted Solidity participation

**None in this candidate.** There is no pasted Solidity in this Step 2A request, so source digest and compiler artifact are null. The EOA default-code experiment validates only the underlying frame codec, signature, fee payment and endpoint comparison. It cannot be displayed as a test of a user's contract. To make an ordinary pasted contract participate, compile its exact source to creation/runtime bytecode, deploy that exact artifact as an execution target, and use its ABI to generate the SENDER frame data; a separate EOA self-verify can pay. That adds a contract deployment and a source-to-address/bytecode/constructor binding. For a pasted validator/paymaster, the compiler must support its exact dependency graph and prove a compatible runtime approval role; the current self-contained compiler does not resolve imports or make such a claim. This integration remains unimplemented.

## D–E. Wallet, transactions and maximum spend

Read-only chain 1337 revalidation after the authorized funding receipt: public `skandha/v4.1.1-`, alternative `ethrex/v23.0.0-eip8141-tracer-9aa3645d795945c64400f41a70aace0edfa7f383`. Sender code `0x`, balance **500000000000000 wei**, pending nonce **0**. `eth_gasPrice` reported 3,456,010 wei; the signed candidate caps at **2 gwei**. Funding status is `FUNDED`, and the regenerated transaction hash remains unchanged. The separate Arkiv chain-7794095 balance did not participate.

| Planned write | From → to | Value | Maximum fee exposure |
| --- | --- | ---: | ---: |
| EOA funding transfer | official shared genesis account → `0x366E6203603C39Eec1e75b3be6f078911447f235` | 0.0005 test ETH | 250,000 gas × 0.002 gwei = 0.0000005 test ETH; live estimate was 207,391 gas |
| Public admission | signed sender → itself; zero-value SENDER frame | 0 | Pinned conservative 103,254 gas × 2 gwei = 0.000206508 test ETH; hard allocation 0.0005 test ETH |
| Alternative admission of the **same bytes** | same sender, nonce, hash | 0 | No second execution fee if the same transaction is included once; separate RPC response still required |

**Funding-source debit cap: 0.0005005 test ETH.** This is 0.0005 transferred principal plus a 0.0000005 gas ceiling. The 0.0005 is prefunding, not immediately spent gas; any remainder remains at the sender. There are **zero deployments**, zero constructor values, and no paymaster stake/funding. The prior 0.152012 and provisional 0.000542 proposals are superseded. The theoretical frame fee estimate is lower than the sender allocation; runtime fee calculation still needs confirmation after funding.

## F–G. Blockers and final one-shot authorization packet

Current blocker: public and alternative admission submissions require a new, separate authorization. Execution and sidecar runtime admission of this exact candidate remain unverified. Immediately before submission, recheck chain ID, sender code/balance/pending nonce, client versions and head. If sender nonce or code changed, discard and re-sign the frame candidate.

The funding transfer is now a separate Step 2B approval packet. It must complete and be verified before the two admission submissions are proposed for execution.

## Verification

`node --test test/self-relay.test.mjs`: 3 pass, including ECDSA recovery, codec roundtrip, fresh identity and distinct mock path responses. `node --env-file=.env scripts/step2a-prepare-self-relay.mjs`: read-only EF checks, locally signed artifact, 0 broadcasts. `npm test`: **220/220 pass, 0 fail**. No observed ACCEPT/REJECT outcomes exist for this candidate.
