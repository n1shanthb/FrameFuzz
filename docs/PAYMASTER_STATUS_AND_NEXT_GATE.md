# Paymaster feasibility: reported outcome and next gate

## Source and verification level

This is a **user-supplied summary of results from a separate Cursor Cloud Agent**, not independently verified by this starter repository. Do not mark a test as reproduced by FrameFuzz until it runs through this engine and captures its own evidence.

Latest user-reported verdict: **PARTIAL**.

### Reported demonstrated observations

- Basic EIP-8141 sponsor-paid transaction **included and executed successfully**; receipt reported payer as paymaster. Reported truncated hash: `0xc9b27a98…5132`, block `0x63404`.
- Real predeployed Uniswap **v4** `StateView.getSlot0` read during `VERIFY` changes admission: public mempool rejects, alt mempool rejects while unstaked, and alt mempool admits once the paymaster is staked. The divergence is **expected protocol policy**, not a vulnerability.
- Staked Uniswap-read transaction reportedly **included and executed successfully**: truncated hash `0x93049c5d…9f83`, block `0x6340c`. Reported stake transaction `0xdc7d5fca…5383`.
- User reports predeployed bytecode for v4 PoolManager, StateView, Universal Router, USDC, WETH9. No need to deploy Uniswap v2.
- Documented gateway `altmempool.forshtat.com/rpc` worked from agent; event `gateway1.altmempool.wtf` reportedly had TLS failures from that machine.

**Do not cite truncated hashes as verifiable links.** Import full hashes, contract addresses, chain configuration and receipts from `PAYMASTER_FEASIBILITY.md` and `poc/scripts/fast_gate_rerun.ts` when available.

### Not yet demonstrated

- WETH/USDC v4 pool had no liquidity after devnet reset, so a swap was not executed.
- User's USDC fee transfer / sponsor reimbursement / pool conversion were **not** shown as a single successfully included transaction.
- FrameFuzz starter has not yet imported the Cursor builder, signature and trace logic.
- No Arkiv read/write integration.

## Action for existing Cursor agent — focused follow-up

1. **Preserve the known-good evidence** before making any changes. Record complete transaction hashes, receipts, chain ID, contract bytecode hashes and stake setup.
2. Verify whether the predeployed v4 WETH/USDC pool is initialized, has liquidity and can be safely re-seeded. Identify actual v4 PoolManager/PoolKey parameters and the supported LP path. Do not assume v2 reserve and router APIs apply to v4.
3. If necessary, add a small amount of authorized testnet liquidity using official v4 code/interfaces, then prove a simple swap works **independent of the paymaster**.
4. Wire actual USDC reimbursement + post-operation Uniswap v4 swap into the already-proven EIP-8141 sponsor flow, respecting `VERIFY` static restrictions. Ensure sponsor is prefunded with sufficient testnet ETH and user has no ETH, but does hold USDC.
5. Submit to the supported alternative-mempool gateway; capture distinct status for: RPC admission, block inclusion, EVM success, USDC charge, v4 swap execution, and sponsor ETH balance. Collect relevant event logs and before/after balances. Do not infer these states from hash submission alone.
6. If the v4 swap cannot execute, stop and report exact failing opcode, frame, revert or deployment blocker. Keep the proven Uniswap pool-read admission test as the EF+Uniswap-compatible technical core but do not claim swap-backed reimbursement.
7. Produce a self-contained, reproducible `PAYMASTER_FEASIBILITY.md` with GO/PARTIAL/NO-GO, script commands, addresses, full hashes and supporting evidence. No mainnet transactions.

## Branch and integration plan

**Do not modify the live Cloud Agent's active PoC through this starter package.** Merge the final known-good builders after its work is complete.

In this starter:
- Use the existing `examples/cases/00-template.json` format to add `uniswap-v4-foreign-slot-unstaked` and `uniswap-v4-foreign-slot-staked` as *separately signed* transactions.
- Record expected public/alt differences as **expected**. These are not bugs.
- Add signed value and expected rule from actual current sidecar specs. Each case needs correct nonce, state setup and stake/reputation state.
- Preserve admission and execution as distinct evidence categories.
- Only then generalize rule-aware state-access/gas mutations.

## Sponsor gate

- **EF Alternative Mempool:** Evidence appears strong in the user-supplied report; import and reproduce it.
- **Uniswap:** Real v4 storage-dependent admission behavior appears meaningful; complete actual swap/reimbursement if possible. Do not claim that swap happened unless receipt logs and balance deltas prove it.
- **Arkiv:** Not yet built. Needs real testnet case write + query + replay, not just evidence files on disk.
