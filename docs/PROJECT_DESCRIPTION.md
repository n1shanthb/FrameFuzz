# ETHGlobal project description

**FrameFuzz — deterministic admission regressions for EIP-8141.**

FrameFuzz helps wallet and paymaster developers discover which signed frame-transaction configurations satisfy public and alternative mempool policies. It generates seeded semantic mutations, signs isolated transactions, compares expected rules with actual admission decisions, tracks inclusion separately and exports reproducible regression evidence.

The Uniswap scenario tests real StateView.getSlot0 access during paymaster validation. Historical captures demonstrate basic sponsorship, unstaked pool-read rejection and an expected staked public-reject/alternative-accept difference. A generated gas campaign matched14 real path decisions around MAX_VERIFY_GAS. The newer generated storage campaign preserves remote disk failures honestly rather than treating them as policy bugs or successful execution. No swap settlement or reimbursement is claimed.

Arkiv Rabdi stores sanitized, wallet-owned, searchable, expiring semantic fixtures. Developers query by suite/rule/version, validate a retrieved case and regenerate it as an unsigned preview. Publisher outcomes stay separate from newly generated results; community imports never auto-broadcast. An offline saved-evidence mode supports a wallet-free demonstration when experimental services are unavailable.

Built with the existing EIP-8141 workshop codec, real Uniswap v4 devnet contract interaction and the official Arkiv SDK. AI assisted implementation, tests, documentation and verification. Live claims are supported by saved RPC captures and receipts; mocked and preview data are labeled distinctly. The genuine Sonnet investigation selected two offline signature-binding mutations with four actual responses and fresh-process replay; no owned-validator EVM action proof exists. Code is MIT licensed. Current test results and limits are in CURRENT_CAPABILITIES.md and TEST_CHECKPOINT.json.
