# Up next

Read `AGENTS.md`, `AUTHORITY.md`, `CURRENT_STATUS.md`, `BUILD_STATUS.md`, and `docs/ADAPTER.md`. Inspect Git before editing. Current branch is `feat/framefuzz-mvp`; retain user work and use frequent coherent conventional commits.

## Completed gates
- Starter preserved and tested.
- Signer adapter interface, mock-tested isolated account/nonce/setup lifecycle.
- Separate endpoint preflight, explicit verdicts, precondition errors, independent receipts and replay exports.
- Provenance-driven Uniswap suite and verification-gas boundary framework.
- Runnable six-case/twelve-path mock demonstration.
- Existing dashboard extended; CLI/API/browser verification completed.
- 30 automated tests passed on Node 22.13.0; no external dependencies.

## 1. Obtain the external experiment artifacts
The following were not present in the supplied workspace/archive:
- `PAYMASTER_FEASIBILITY.md` with complete evidence and deployment configuration.
- `poc/scripts/fast_gate_rerun.ts`.
- Known-good encoder/signer such as `poc/workshop-ref/scripts/run_framefuzz_fresh_account.ts` and its exact dependencies/license.
- Paymaster/account contract sources and ABIs, funding/deployment/stake/setup functions that wait for successful receipts.
- Authorized devnet chain ID and public/alternative gateway URLs; current StateView/PoolManager/pool IDs, token addresses and deployment evidence.
- Complete hashes/receipts and pinned deployed sidecar rule source/version, including actual verification-gas constraints.

Do not modify the separate experiment's active branch or reconstruct its signer speculatively. Import a known-good snapshot into an isolated adapter. Never copy keys or `.env` files into fixtures.

## 2. Implement one LIVE plugin
Use `src/adapters/index.mjs` and `docs/ADAPTER.md`. Supply isolated funded accounts per case/path, checked setup hooks, actual pending nonces and correct EIP-8141 signatures. Plugin factories must not broadcast. Confirm any plugin endpoint uses the checked authorized chain.

Create real rules JSON declaring `VERIFIED` only after checking the deployed rule version. Populate the actual path expectations, rejection rule labels, addresses, pool ID and setup configuration. The shipped mock config cannot become a live fixture by relabeling it.

Run a preview, then one authorized basic sponsored baseline, then pool-reading comparisons with isolated state. Save complete admission responses, full hashes and receipts. A public rejection and alternative acceptance may be expected. Check signer/nonce/funding preconditions before investigating policy mismatches.

## 3. Prove one live boundary family
Use `verification-gas` with a pinned actual threshold and correct acceptance direction. Verify each below/at/above model is independently encoded/signed. The built-in family uses one supplied common threshold for both paths; add a custom case generator if deployed path limits differ. Capture reproducible JSON/Markdown/replay and independent receipt states. Mark pending/reverted/error honestly.

## 4. Final acceptance and optional follow-up
- Re-run tests, live baseline, and dashboard with the actual adapter/rules.
- Add explorer links only after the real chain/explorer is established.
- Test Node 20 explicitly if installed; current execution was Node 22 only.
- Preserve imported source/version and actual evidence before any optional swap/reimbursement experiment. Do not claim swap success from admission alone.
- Keep Arkiv, Chainlink, World and unrelated sponsor work out of scope.

## Reproduce now
```powershell
Set-Location E:\ethglobalmumbai
npm test
npm run demo:mock
npm start
```
Open `http://127.0.0.1:4177`, inspect the MOCK run and export its evidence. No credentials or network access beyond loopback are needed. Stop the server with Ctrl+C.

## Handoff and GitHub
Use `git status --short`, `git log -5 --oneline`, and `git remote -v` before resuming. GitHub auth/remote was verified; network-restricted checks may misleadingly report an invalid token. Push only with authorization to the verified destination. Update status/build/queue documents at each meaningful checkpoint, including exact tests, outstanding work and the next action.
