# Up next — after admission Step 2E preparation

1. STOP before all writes. Review `evidence/prepared/2026-11-07/step2e-approval-packet.json` (SHA-256 `cf22db5a447de2adb5017c7f5ade594783d0a5cb680fc7d0946dae81721f5476`); no approval has been granted.
2. If approved later, refresh the volatile shared funding nonce (captured 149), 3-gwei cap, sender nonce 2/balance, predicted address, empty code and endpoint identities. Any drift requires a replacement packet.
3. Execute setup strictly: one top-up, deployment with runtime-hash verification, stake with registry verification, then regenerate/revalidate the exact policy candidate if any prerequisite changed.
4. Run canonical first. Only a confirmed `StorageReadNonSender` rejection with unchanged nonce/null receipt permits the same signed candidate to go to Skandha. No retry or concurrent submission.

# Previous up next — after executed admission Step 2D

1. Preserve the nonce-1 evidence and never resubmit candidate `0xc05703…ba510`.
2. Do not interpret Skandha's nonce-race rejection as a policy difference; signature/structure passed and policy checks were skipped.
3. Before another comparison, design truly isolated state (separate funded senders with semantically equivalent independently signed transactions) or an operator-supported admission-only mechanism that cannot race canonical inclusion.
4. Any nonce-2 candidate, funding decision or broadcast requires a fresh exact packet and approval.

# Previous up next — after admission Step 2D

1. STOP before submission. Candidate `0xc05703acca2def2f89567ac33618b48a44b7eb021c2db0023e5f3b90227ba510` awaits the exact approval in `docs/ADMISSION_STEP2D.md`.
2. On approval, rerun the read-only/offline Step 2D preparation. Stop if nonce is not 1, balance is insufficient, either client role changes, sidecar health fails, or the hash changes.
3. Initiate the alternative structured request first and canonical raw request immediately afterward without awaiting; never retry automatically.
4. Preserve each response independently and require `skandha_explorer_getTransaction` evidence before claiming alternative admission.

# Previous up next — after admission Step 2C

1. Preserve the live evidence and do not resubmit the included nonce-0 candidate.
2. Resolve the currently supported alternative admission endpoint/method using read-only official documentation or operator guidance. Do not probe support by sending another transaction.
3. If a valid alternative route is established, prepare a fresh independently signed nonce-1 candidate and a new funding/fee/state packet; obtain authorization before broadcasting it.
4. Keep the result honest: public admission/inclusion/execution is proven; alternative admission remains unobserved because the configured method returned `-32601`.

# Previous up next — after admission Step 2B

1. Funding is complete and confirmed by transaction `0x9b16d59eb1bca1070d7fcf7ce01b75c11caa519ad6b84423a93586d5bcf873ef`; do not repeat it.
2. Preserve the regenerated candidate hash `0xd4d6123f6b142acccb5cf6c302877fe7a1ed499bd3bfb0263c70763febbba226` and its exact public/alternative request payloads.
3. STOP before admission submission. Obtain separate authorization for public `eth_sendRawTransaction` and alternative `eth_sendFrameTransaction`; the funding authorization did not cover them.
4. At execution time, refresh sender balance/code/nonce and both endpoint identities. Record each raw response independently; classify duplicate/known, nonce consumption and inclusion races without inventing a policy verdict.

# Previous up next — after admission Step 2A

1. STOP before funding or submitting the saved self-relay candidate. No write authorization was granted in Step 2A.
2. Resolve an operator-controlled chain-1337 test-ETH funding wallet without sharing a key in chat. Read its address, balance and pending nonce; recheck the candidate sender code/nonce, head and client versions. If context drifted, re-sign and replace the candidate/packet.
3. Seek separate explicit approval for the **resolved** one-transfer/two-submission packet in `docs/ADMISSION_STEP2A.md`. Capture each raw endpoint response and timing; treat known/duplicate as inconclusive, then query canonical and frame receipts.
4. Only after the infrastructure comparison, implement exact pasted-source artifact deployment and source-to-target binding for BYOC; no current Solidity source participates in the self-relay candidate.

# Previous up next — after admission Step 1

1. STOP before any deployment, funding, submission, paid model call, Arkiv write or push. Step 1 is complete and Step 2 needs separate explicit authorization.
2. Resolve a devnet-only funded deployer wallet, its chain 1337 nonce and balance, and the exact basic paymaster deployment address/code hash after deployment approval. The historical basic address is empty.
3. Decide which supported sender/paymaster harness exercises the exact pasted source; generic Solidity does not confer a frame role. Prepare a new source/context-bound packet with exact calldata and caps before approval.
4. For the first pair, use the pinned raw public and structured alternative methods. Record duplicates and chain-state changes as confounders. See `docs/ADMISSION_STEP1.md`.

# Previous up next — after budget-completion fix

## Ready now (human gate)
1. Re-analyze QuotaVault if needed, consent, Start Investigation once for a real completion attempt under ~$0.26 sprint remaining / est. finish ~$0.18.
2. Expect Scout → Mutation → Validator → local ABI execute → Critic → COMPLETE when budgets hold.

## After that
3. Optional Uniswap profile run only if sprint remainder still covers est. finish
4. EF Uniswap live path only after paymaster restoration + digest approval
5. Submission polish / Present-to-EF (deadline 2026-11-07 09:00 IST)

## Hard stops
No automatic Start, no raising the $1 FrameFuzz sprint cap, no equating OpenRouter key limits with app authorization, no EF broadcast, no push without authorization.
