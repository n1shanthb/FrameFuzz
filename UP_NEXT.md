# Up next — after admission Step 2B

1. STOP before the EF funding transfer. The exact packet digest is `60b68b599ba011ad2c6b4f15e21e9b5776a466b8c0709d6cb8d2e49bbf311efa`; no write approval was granted.
2. Configure the official throwaway chain-1337 shared key locally as `FRAMEFUZZ_EF_FUNDING_KEY` without placing it in chat, source or artifacts. Derive and require source `0x5544596212F91984C986A919C8026DF0576816f9`.
3. Before any signing, rerun `node scripts/step2b-prepare-funding.mjs`. If shared pending nonce differs from 145, produce a new packet/digest and stop for review. Preserve the 0.0005 value and 0.0005005 total-debit ceiling.
4. After separately approved funding and a status-1 receipt, revalidate the unchanged candidate hash and sender state. Then prepare a separate public-versus-alternative submission authorization; do not combine it with funding implicitly.

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
