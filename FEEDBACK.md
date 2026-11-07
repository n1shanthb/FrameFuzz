# Uniswap developer feedback — FrameFuzz

Status: prepared from actual implementation and final devnet evidence. **The human feedback form has not been submitted.**

## What we built and actually used

FrameFuzz tests whether Uniswap-aware paymaster validation is compatible with public and alternative EIP-8141 admission policies. `vendor/paymaster/ReserveReadingPaymaster.sol:33` calls `IStateView(STATE_VIEW).getSlot0(POOL_ID)` when VERIFY calldata starts with `0x01`. This is actual contract execution, not an unused SDK import. The tested purpose is pool-state access during validation; no token reimbursement or swap settlement is claimed.

The devnet StateView is `0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB`; its `poolManager()` returns `0x6bF9Aa9c04fd001385742d61f6818C3236429848`. Both runtime hashes are pinned in `examples/live/devnet.json` and checked before live storage campaigns. Pool ID: `0x784bd7879f8155eda79b7834d53c2f19ace60aed221fe33ef03ce660eff60648`. Current slot0 is all zero, so this run demonstrates a real read of an uninitialized pool's storage, not price discovery from an active pool. The final candidate `0x72a82645…` was rejected by canonical ethrex with `StorageReadNonSender`, accepted by Skandha as admission 2065, included, and completed all three frames successfully.

## Helpful parts

The [StateView guide](https://developers.uniswap.org/docs/protocols/v4/guides/state-view) gives a small, stable contract interface for reading pool state. `getSlot0` lets a developer test a meaningful external storage dependency without building swap settlement first. The [pool-state documentation](https://developers.uniswap.org/docs/protocols/v4/guides/read-pool-state) explains why v4 pool state lives in PoolManager rather than a separate contract per pool. That distinction matters because the admission trace names PoolManager as the storage address, even though the paymaster calls StateView.

## Friction encountered and concrete improvements

- **Trace attribution across contracts:** the unstaked rejection identifies PoolManager and a storage slot, not the StateView method invoked. Add an account-abstraction example tracing paymaster → StateView.getSlot0 → PoolManager.extsload, explaining which address a validation policy evaluates. Include expected rejection diagnostics and a successful staked comparison.
- **Uninitialized pool semantics:** a well-formed four-word zero response is not an initialized pool or a usable price. Add a prominent initialization check (`sqrtPriceX96 != 0`) to read examples, while distinguishing successful data access from trading readiness. FrameFuzz initially guarded against zero state, then corrected the guard because the regression tests storage policy rather than trading.
- **Devnet deployment identity:** standard deployment lists do not establish provenance for workshop chain1337. Provide a reproducible devnet manifest with source commits, chain IDs, constructor links, runtime hashes and StateView→PoolManager binding, or explicitly explain how to verify custom deployments. We added both code-hash and manager-binding checks rather than trusting an address alone.
- **Validation versus execution:** successful `eth_call` does not prove the read is admissible in a verification frame. An integration guide should distinguish ordinary read simulation, public admission restrictions, stake-dependent alternative admission and eventual inclusion. This helps wallets avoid promising sponsorship for transactions the public path will refuse.
- **Actionable precondition errors:** the final campaign first reached a payer-funding precondition because Skandha retained the included stake transaction's maximum liability. After the paymaster was funded through a constructor force-send (its fallback rejects ordinary value transfers), the same candidate was admitted and included. This is devnet/account-abstraction setup friction, not a Uniswap contract defect. Examples should teach users to separate funding, admission policy, and inclusion receipts.

The highest-impact addition for this use case would be a small AA/paymaster StateView example with an access trace, explicit initialization caveat and stake-aware admission expectations. We did not measure a reliable time-to-first-integration and do not invent a duration or support rating.

## Why wallet/paymaster developers need this

A sponsor may read pool state to bound exposure or decide whether a future token-funded operation is acceptable. Its code can execute correctly and still be rejected during validation because that read reaches external storage. FrameFuzz generates no-read, unstaked-read and staked-read scenarios from one definition, shows where the path-specific policy differs, and publishes the semantic regression through Arkiv. It helps developers test compatibility before promising gas sponsorship. Zero-state reads here prove only the admission dependency, not a safe trading strategy.

## Human submission checklist

Official form: **https://developers.uniswap.org/hackathon-feedback**, verified November6,2026. The [ETHGlobal Mumbai prize requirements](https://ethglobal.com/events/mumbai/prizes) request a public open-source repository, FEEDBACK.md and a completed feedback form referencing that file.

- Publish the branch/repository only when authorized and verify the actual public FEEDBACK.md URL. Intended branch URL after push: `https://github.com/n1shanthb/ethglobalmumbai/blob/feat/framefuzz-mvp/FEEDBACK.md` (not yet verified as published).
- Human supplies name, email, Telegram, hackathon, project description and actual integration status. Include the FEEDBACK.md link in the appropriate free-text field.
- Choose honest time-to-first-success, documentation/support ratings and continuation plans. AI-assisted development is not itself an autonomous trading agent.
- Describe actual pool-state validation, historical successful receipts, current generated campaign limitations and Arkiv fixture exchange. Do not claim a swap or USDC reimbursement.
- Human reviews required terms/privacy consent and submits the form. Retain confirmation separately; until confirmed, status remains **NOT SUBMITTED**.
