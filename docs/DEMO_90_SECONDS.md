# FrameFuzz — ninety-second truthful demo

Launch the key-free saved-demo command in CURRENT_CAPABILITIES.md. Enable FRAMEFUZZ_SWARM=on before launch to view saved Sonnet evidence. No API key is needed. Do not load `.env`, click provider consent/start, or enable submissions.

**0–15 seconds — Overview.** “FrameFuzz tests EIP-8141 admission compatibility using reproducible semantic cases. These are saved historical LIVE captures, not transactions sent during this demo.” Show14/14 gas decisions and eight receipts; a returned hash alone is not execution.

**15–35 seconds — Evidence Explorer.** Open the gas capture and inspect a boundary rejection and its diagnostic. Show the Uniswap comparison: unstaked read rejects on both paths; staked StateView.getSlot0 read rejects publicly and accepts alternatively. “That expected policy difference is a PASS. No swap or token reimbursement is claimed.”

**35–55 seconds — Arkiv Registry.** Click Inspect saved registry snapshots, select a publication and show creator/owner, expiry, digest and the SAVED label. Current validity is unknown in offline mode and new import is disabled. Click Open saved imported PREVIEW. “The portable fixture regenerates unsigned inputs; publisher outcomes stay separate. No broadcast occurs.” If demonstrating online, use the normal server and the fresh Query → Select → Verify → Import path only while the entity is active.

**55–75 seconds — Swarm Lab.** Load saved investigation. “Four actual Sonnet responses selected two calldata mutations, including record(2,10). Local ECDSA checks and fresh processes reproduced the unsafe/safe signature-binding difference. This did not execute the validators in an EVM and is not a verified exploit.”

**75–90 seconds — Technical Briefing.** Enter presentation mode to show the evidence-derived checkpoint. “We preserve rules, inputs and evidence for developers to compare changes. Live owned-validator proof remains blocked on runtime/context verification and separately authorized execution.” End on the source/proof inventory. Video recording/upload and form submission are still human tasks.
