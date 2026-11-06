# Self-funded feasibility - Phase 3B

**SELF_FUNDED_PATH: PLAUSIBLE_UNVERIFIED.** The missing PAYMENT sponsor is eliminated from the isolated code/configuration. Deployment funding, funded senders and a runtime authorized baseline remain prerequisites. No live transactions, funding, faucet requests, Arkiv writes or additional model calls were made.

## Why this is plausible

At advertised ethrex commit9aa3645d795945c64400f41a70aace0edfa7f383, transaction.rs recognizes SelfVerify and requires VERIFY(scope3) to target the sender. frame_tx.rs apply_approve(0x3) consumes the sender nonce, deducts max cost from the frame target, then sets both sender approval and payer=sender. An insufficient balance reverts separately. The pinned workshop profile has scope3 and the supplied fast_gate_rerun.ts builds this layout. These are source/example checks, not runtime success.

[Advertised transaction source](https://github.com/lambdaclass/ethrex/blob/9aa3645d795945c64400f41a70aace0edfa7f383/crates/common/types/transaction.rs#L3040), [approval handler](https://github.com/lambdaclass/ethrex/blob/9aa3645d795945c64400f41a70aace0edfa7f383/crates/vm/levm/src/opcode_handlers/frame_tx.rs#L186); bounded excerpts/digests in self-verify-source.json. The public [self-relay example](https://docs.altmempool.wtf/guides/submit-a-transaction/) illustrates scope3 but uses an EOA/protocol signature; it does not demonstrate the new owned ARBITRARY validator.

## Minimal isolated changes

- New contracts/self-funded variants retain unsafe partial intent vs safe TXPARAM(SIG_HASH). Two frames replace the sponsored three-frame layout. Both EXECUTION and PAYMENT are granted only after canonical65-byte low-s owner authorization. OWNER/ACTION remain immutable; no PAYER constructor argument.
- Each fixture has a payable receiver for separately approved funding. VERIFY uses nonempty marker0x01 so it reaches the authorization fallback, rather than the receiver. The receiver never grants approval. Contract checks no blobs/value, exact layout and a0.001 ETH TXPARAM(MAX_COST) cap plus2gwei price cap.
- Versioned examples/swarm/self-funded.v1.json, dedicated offline builder/signing pair and self-funded oracle; no changes to original sponsored contracts/scenario or historical receipts. The sponsored compiler input remains2c014bf67354663c1bcad20c7d6d9122840868abe8950314beee25c87cdb9d70. New self-funded input454b5c58d3f7f874729abce73f864cecd43d7315775701d1bc18e52b0ef58f71.
- Sonnet's actual record(2,10) revision and original descriptor0a7d359e26f6d10337c4c36b6e560d99abfa1f6fdb7893d53d7501e76c1dfe76 are preserved verbatim. A separate derivation records action frame2 becoming frame1. Fresh original A authorization is signed per actual future context; historical signatures must not be reused across layouts or accounts.

Offline ECDSA tests confirm unchanged A witness recovers the owner after B under the unsafe partial hash and fails under the safe workshop hash. These tests do not execute EVM contracts.

## Exact proposed deployment and funding envelope

One context:5 top-level deployments (ActionRecorder,2unsafe,2safe),4 sender-funding transfers,4 frame submissions;13 transactions total if separately approved. Hegota constructor helper CREATEs are internal to those deployments and included in their gas caps. Deployer, owner and all CREATE addresses remain unresolved. Constructor arguments are(owner,action), with none for the recorder. Bytecode/init-code digests and conditional addresses are in self-funded-readiness.json.

Read each sender's latest/pending account nonce after constructor helper CREATEs; never assume0. Use separate sender accounts for both baselines and both tampered cases. Require both original record(1,10) baselines before testing B.

Each sender must be provisioned with the proposed0.001 test ETH cap. Source-derived conservative fee bound for the fixed envelope is438502gas /0.000877004 test ETH at2gwei, using full wire length and the pinned gas schedule; this is not an execution gas estimate. Runtime validation gas and opcode behavior remain unverified. The contract cap independently limits maximum collection; exceeding a cap must stop rather than auto-increase it.

- Deployment fees:5 x6m gas x2gwei =0.06 test ETH.
- Funding-transfer fees:4 x250k gas x2gwei =0.002 test ETH maximum.
- Sender prefunding:4 x0.001 =0.004 test ETH; this funds the frame fees, counted once.
- Source wallet funding target / combined maximum fee exposure: **0.066 test ETH**. Safe rejection may leave its balance unused; residual balances remain owned. No sweep is planned.

A full independent fresh context requires another5deployments,4fundings and4submissions with another0.066 cap; two contexts together0.132. Neither is authorized. No funded deployer or owner is configured.

## Oracle and runtime uncertainty

Oracle requires sender=payer, sufficient pre-approval balance, verified self-payment in baseline/unsafe receipt evidence and individual action frame1. It requires actual recorder caller/parameters/state, retained A signature and isolated contexts. Insufficient balance, fee-cap violation and sender/payer mismatch cannot become authorization findings. Safe rejection needs the exact owned AuthorizationRejected selector, verified origin and no-effect observation. A finding additionally requires a separately verified fresh reproduction. Synthetic test proof objects are not live evidence; no live receipt parser/executor is claimed.

The source-level golden hash still matches the workshop; actual TXPARAM/helper/signing behavior is UNVERIFIED. Current EIP length-elision/scalar-nonce/aggregate-fee semantics differ from this advertised client's empty-elision/keyed-nonce/rate-fee envelope. Nothing silently changes EIP rules or historical profiles.

## Alternative devnet comparison

The [official EF Mumbai prize listing](https://ethglobal.com/events/mumbai/prizes) names these pairs:

- Devnet1: https://devnet1.altmempool.wtf / https://gateway1.altmempool.wtf
- Devnet2: https://devnet2.altmempool.wtf / https://gateway2.altmempool.wtf
- Devnet3: https://devnet3.altmempool.wtf / https://gateway3.altmempool.wtf

All six hosts failed transport reads from this environment.24 bounded initial reads and3 second head observations were attempted; second RPC reads report ECONNRESET. For each pair, chain ID, client version, advancing head, available modules and compatible envelope are **UNKNOWN**. This does not prove the networks are globally down or that a method is unsupported. No send/simulation/admin methods were used to discover support. Execution allowlists are unchanged. Captures: devnet-first.json and devnet-second.json.

The [official documentation](https://docs.altmempool.wtf/guides/devnet/) describes the older chain1337 endpoint as a shared-genesis-funded throwaway network with no faucet. Its workshop step_1_check performs funding transfers, so it was not run. The Mumbai prize listing mentions a faucet, but no working faucet URL or per-alternative funding instructions were independently established. Obtain those from the operator; do not fetch/use a shared key or fund accounts without separate authorization.

## Result and recommendation

**107 tests pass**, preserving all99; evidence-guide check passes. Sponsored source digest, all historical evidence and premium UI are unchanged. No actual self-funded EVM execution or vulnerability is proven.

Pursue the self-funded proof as the next candidate only when an owned funded deployer/owner, exact addresses, sender funding plan and runtime baseline/health checks can be resolved for separate approval. Otherwise stop here and preserve the genuine offline Sonnet demo plus clearly historical LIVE admission captures. No further infrastructure, client rebuild or repeated network probing is needed. Endpoint changes, deployments, all funding transfers, frame broadcasts and any publication require separate human authorization.

## Reproduce the preparation

With FRAMEFUZZ_SWARM=on:

node --env-file=.env bin/framefuzz.mjs swarm self-funded-readiness --investigation evidence/investigator/2026-11-06/sonnet-retry-2.json --preflight evidence/swarm/phase-3/preflight.json --head evidence/swarm/phase-3/head-second.json --variant 1 --output runs/self-funded-readiness.json

This command is entirely offline and uses the prior read-only context only as labeled historical preparation input. It signs no transaction and performs no network requests. Tests use ephemeral in-memory keys for local signature checks.
