# BUILD TASK — Turn FrameFuzz Starter into a Working Hackathon MVP

You have been given `framefuzz-starter.zip`.

**Your job is to IMPLEMENT and TEST FrameFuzz, not just provide an architecture plan or research report.**

We are building an Ethereum infrastructure tool for ETHGlobal Mumbai 2026, deadline November 7, 9:00 AM IST.

## Product definition

**FrameFuzz — an admission-rule mutation and compatibility testing lab for EIP-8141 frame transactions.**

It constructs valid frame transactions, changes specific rule-relevant properties, submits them through Ethereum's public and alternative admission paths, compares observed decisions against expected rules, and saves reproducible evidence.

Our flagship case is a **Uniswap v4-aware gas sponsor/paymaster**.

### Important results from a separate Cursor research agent

The following was reportedly demonstrated on the EIP-8141 devnet:

- Normal sponsored frame transaction: admitted, mined and successful.
- Real Uniswap v4 `StateView.getSlot0` call during paymaster verification.
- Unstaked paymaster reading external pool storage: rejected by both public and alternative admission rules.
- Staked paymaster reading that same external storage: accepted by the alternative mempool, rejected by the public mempool.
- Staked sponsored transaction: mined successfully.
- Existing Uniswap v4 PoolManager, StateView, Universal Router, USDC and WETH9 contracts have deployed bytecode.
- The full USDC reimbursement and Uniswap swap are **NOT YET PROVEN**.
- Gateway `altmempool.forshtat.com/rpc` worked for that agent; a different official gateway had TLS trouble.

Evidence and code, when available, will be supplied from the separate Cursor workspace:
- `PAYMASTER_FEASIBILITY.md`
- `poc/scripts/fast_gate_rerun.ts`
- Other working frame transaction signers and paymaster contracts

**Do not treat these reported results as tests you personally executed. Do not invent transaction hashes, deployed addresses or successful swap receipts.**

## PHASE 1 — Inspect and stabilize the starter

1. Extract the ZIP and examine `README.md` and `docs/CURSOR_HANDOFF.md`.
2. Inspect all existing code under `src/`, `bin/`, `examples/`, `web/` and `test/`.
3. Run `npm test` and fix any issues.
4. Preserve working components instead of rewriting the project.
5. Keep Node.js 20+ compatibility.
6. Work in your own branch/workspace; do not overwrite the separate Cursor paymaster experiment.

The starter already supports:
- `eth_sendFrameTransaction`
- `eth_sendRawTransaction`
- explicit testnet chain-ID checks
- admission verdict classification
- separate transaction receipt states
- JSON/Markdown evidence
- a numeric boundary mutation scaffold
- a basic web dashboard

## PHASE 2 — Build the real EIP-8141 adapter interface

This is the highest-priority implementation task.

Create a clean interface under `src/adapters/` for plugging in a working transaction builder/signing implementation.

It must support:

- Generating a fresh valid signed frame transaction.
- Generating independently re-signed transaction variants.
- Managing nonce and sender state safely.
- Selecting an RPC endpoint for each admission path.
- Returning transaction metadata needed for replay.
- Supporting setup operations such as deploying a contract, funding a sponsor or establishing stake when the scenario requires them.

Use the existing Cursor/workshop signer code **if it is available locally**.

If that code is absent, implement the adapter interface and verified mock-based tests, but DO NOT fabricate a real signer. Clearly record what files are needed to complete the integration.

Keep keys in environment variables; never store private keys in fixtures, logs or reports.

## PHASE 3 — Implement the Uniswap paymaster admission suite

Create a scenario family named `uniswap-v4-paymaster`.

Target these cases:

**Case A — Basic gas sponsorship**
A sponsor verifies and pays gas without reading Uniswap pool storage.

**Case B — Unstaked pool-reading sponsor**
The sponsor reads real Uniswap v4 pool state through StateView during validation. Check rejection under both admission policies.

**Case C — Staked pool-reading sponsor**
Same essential pool-read behavior, with the required staking/reputation state. Check public rejection versus alternative-mempool acceptance.

**Case D — Rule-boundary mutations**
Produce controlled variations around verification gas budgets and supported storage-access constraints.

Expected verdicts must be grounded in the actual deployed sidecar's rules, not guesses.

Every transaction variation must be properly encoded and signed.

Do not mutate signed hex bytes and call that meaningful fuzzing.

Do not claim we completed the USDC-to-ETH swap. That remains under investigation by the separate agent.

If the Cursor artifacts are not accessible, put the scenario framework and adapter hooks in place using documented interfaces, mark live verification pending, and continue with the independent tasks below.

## PHASE 4 — Improve the comparison engine

Make results distinguish:

- EXPECTED ACCEPT
- EXPECTED REJECT
- UNEXPECTED ACCEPT
- UNEXPECTED REJECT
- UNEXPECTED RULE / ERROR CLASS
- TRANSPORT FAILURE
- INCONCLUSIVE

Also track execution independently:

- Admitted
- Included, status 1
- Included, reverted
- Pending / no receipt
- Receipt not checked

A public-mempool rejection and alternative-mempool acceptance may be **the correct expected result**, not a security bug.

Support distinct RPC URLs for public and alternative admission paths. Do not submit identical signed transactions with the same nonce to both paths and mislabel duplicate-submission errors as policy discrepancies.

Output structured JSON suitable for CI, a readable Markdown report and replay metadata.

## PHASE 5 — Make the mutation engine real

Implement ONE well-supported mutation family completely before adding others.

Preferred priority:

1. Verification-gas boundaries.
2. External storage reads with staked/unstaked sponsor conditions.
3. Sponsor balance or gas-payment sufficiency.

Generate meaningful below/at/above boundary cases using actual transaction re-encoding and signing.

Distinguish a genuine admission-rule mismatch from a malformed transaction, bad nonce, insufficient funding, or RPC error.

Add automated tests for the generator and classifier.

## PHASE 6 — Improve the existing dashboard

Do NOT replace the project with a giant frontend rewrite.

Improve the existing local web UI into a clean developer-oriented testing console.

It should show:

**Test Runner**
- Network / gateway status
- Scenario selector
- Selected mutation family
- Run button
- Visible test execution state

**Results**
- Test case
- Expected public admission
- Actual public admission
- Expected alternative admission
- Actual alternative admission
- Rule mismatch, if any
- Receipt and execution status

**Case Details**
- Mutation parameters
- Rule or error message
- Transaction hash
- Explorer link when grounded in a real network
- Relevant transaction metadata
- Replay/export action

**Evidence Library**
- Saved runs
- JSON evidence
- Markdown reports
- Distinct labels for SYNTHETIC versus LIVE results

The dashboard must use the runner's actual saved evidence. Do not display fictitious successful tests as real.

Keep UI work secondary to the actual testing engine.

## PHASE 7 — Test and document

Run the test suite and smoke-test the CLI and dashboard.

Required outputs:

- Source code changes.
- Adapter module.
- Updated CLI.
- Working sample scenarios.
- At least one useful rule-boundary mutation generator.
- Unit/integration tests.
- Updated README with accurate run instructions.
- A concise `BUILD_STATUS.md`.

In `BUILD_STATUS.md`, list:

1. What you implemented.
2. What tests actually passed.
3. Which scenarios ran against real devnet infrastructure.
4. Real transaction hashes and receipts, if any.
5. What is blocked by missing Cursor PoC files or devnet instability.
6. What is needed to import the Uniswap paymaster experiment.
7. Exact commands to reproduce the current working demonstration.

## SAFETY AND SCOPE

- Only use local chains or explicitly authorized devnets.
- Never send transactions to Ethereum mainnet.
- Avoid high-volume tests against shared public gateways.
- Keep secrets out of commits and reports.
- Do not spend hours recreating the paymaster that the other agent is already building.
- Do not implement Arkiv yet. First make the EF admission-testing core work.
- Do not add Chainlink, World or unrelated sponsor integrations.
- Do not claim a protocol vulnerability unless actual evidence demonstrates it.
- Avoid unnecessary dependencies and complicated infrastructure.

## Definition of done

The minimum successful deliverable is:

**A developer can run a real signed EIP-8141 admission test, inspect an expected-versus-actual verdict, see whether the transaction was merely admitted or actually executed, and export a reproducible result.**

If the signer artifacts aren't available, deliver the strongest fully tested runner/adapter implementation possible and clearly identify the exact missing inputs—do not present a mocked run as a live success.

**Start executing the implementation immediately. Don't stop at a plan.**

At the end, show the final repo structure, tests executed, features working, missing dependencies and the next concrete integration step.
