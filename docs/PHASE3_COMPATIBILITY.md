# Phase 3 signing compatibility

Overall runtime compatibility: **UNVERIFIED**. Source/vector agreement: **VERIFIED_VECTOR**. The client advertises 9aa3645d795945c64400f41a70aace0edfa7f383; that is self-reported, not binary attestation. No runtime canonical-hash result or owned authorized baseline has been obtained.

## Evidence

- Current [EIP-8141](https://eips.ethereum.org/EIPS/eip-8141), snapshot SHA256 1c0fe44b0829f587a20c2e7575b55498f579a17b92d683bb73be94395ea16639. Scalar nonce; aggregate max_fee/priority fee; empty-msg witnesses elided to their byte length; explicit-msg bytes retained; ARBITRARY signer empty and no protocol cryptographic check. TXPARAM SIG_HASH is canonical transaction commitment.
- Pinned @forshtat/hegota-support0.0.1, dist/tx/codec.js lines173-181 and dist/profiles/ethrex-eip8141-tracer.js: keyed nonce_keys/nonce_seq, nine-field payload including recent roots, rate-fee tuple [priority,max-per-gas,max-blob], empty-msg signature bytes replaced by empty bytes.
- Advertised-commit [transaction source](https://github.com/lambdaclass/ethrex/blob/9aa3645d795945c64400f41a70aace0edfa7f383/crates/common/types/transaction.rs#L2373) SHA256 8c657bde609a6bec61986e774dd2fd90526045eaaa35b8c5afc58f5b43f8d669: compute_sig_hash follows the workshop empty-byte elision and nine-field/rate-fee envelope. Frame calldata is covered. This differs from today's EIP and must remain a separately named profile.
- [Client golden vector](https://github.com/lambdaclass/ethrex/blob/9aa3645d795945c64400f41a70aace0edfa7f383/crates/common/types/transaction.rs#L6796) is checked byte-for-byte and hash-for-hash by compareClientVector. Actual/expected hash both 0xd4df51143828c0338882dbd10c3308f3569972fe1928a7b5040ee18057920510. Its synthetic chain1 value is an offline codec input only, never a destination. Source has additional property tests for empty/explicit messages and frame data; we inspected them, did not execute the Rust test suite. The corroborating frametx.py was retrieved/digested, not executed.
- [TXPARAM handler](https://github.com/lambdaclass/ethrex/blob/9aa3645d795945c64400f41a70aace0edfa7f383/crates/vm/levm/src/opcode_handlers/frame_tx.rs#L783) SHA256 73fc8fcc229f8bcd6b3a72f1c8ceb5c89b8a5cff67ade5401748a54fe8ce4ac8:0x01 returns nonce_seq;0x08 returns ctx.sig_hash. Fixture enum indices agree. Context construction and onchain opcode/helper behavior were not independently executed.

Same-length raw witness changes do not alter the workshop/client hash; changing length also does not. Current EIP length commitment differs, as the local paired test demonstrates. Explicit-msg raw witness bytes remain committed in both designs; using that mode for a witness which signs the canonical transaction would reintroduce circularity. The harness keeps the existing65-byte ARBITRARY empty-msg witness and r||s||v fixture convention. Protocol SECP256K1 v||r||s vectors do not authorize changing the owned ARBITRARY verifier convention.

Nonce key0 is the advertised client's account-nonce domain (transaction.rs validation comments), so a NONCE_MANAGER zero storage read alone does not prove a fresh key0 nonce. The prepared harness explicitly requires latest/pending account-nonce checks for each future owned sender. Historical preflight storage evidence remains unchanged.

## Decision

Do not change the EIP oracle or silently migrate historical hashes. Keep safe fixture TXPARAM(SIG_HASH). Source agreement reduces uncertainty but does not satisfy the runtime baseline gate. A future funded, separately approved baseline must prove the exact client, helper opcodes, signer and canonical commitment agree. No live executor is enabled during this focused readiness pass.

Source excerpts with line numbers/digests: evidence/swarm/phase-3/source-excerpts.json. Exact raw-commit requests succeeded for both lambdaclass and forshtat forks with identical file digest; GitHub tree API returned403, so raw pinned sources were used. No third-party code was executed.
