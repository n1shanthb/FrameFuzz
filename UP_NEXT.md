# Up next

Read `AGENTS.md`, `AUTHORITY.md`, `CURRENT_STATUS.md`, `BUILD_STATUS.md`, and the full `docs/BUILD_BRIEF.md` before implementing.

## 1. Confirm workspace and GitHub
```powershell
Set-Location E:\ethglobalmumbai
git status --short
git log -5 --oneline
gh auth status
```
If authentication is still invalid, the user must complete `gh auth login -h github.com --web`. Do not block local engine development on this. Ask for/confirm a repository URL before configuring `origin`; do not guess a repository or visibility. Verify owner/repository before any authorized push. Keep short conventional commits at every coherent verified milestone.

## 2. Build the adapter interface (highest implementation priority)
- Create `src/adapters/` with a documented builder contract: fresh signed baseline, independently re-signed variants, nonce/sender state, per-path endpoints, setup operations, and secret-free replay metadata.
- Look for user-provided PoC files locally before inventing an integration. They were absent from this starter extraction.
- Required import inputs: `PAYMASTER_FEASIBILITY.md`, `poc/scripts/fast_gate_rerun.ts`, known-good signer/encoder such as `poc/workshop-ref/scripts/run_framefuzz_fresh_account.ts`, contract sources/ABIs, setup and stake scripts, chain configuration, complete addresses/hashes/receipts, sidecar version and rule references, and dependency/license information.
- Keep credentials in environment variables. Do not copy another workspace's `.env` into fixtures.
- If inputs remain absent, implement the interface and meaningful mock tests; document the exact live blocker.
- Gate: tests demonstrate independent variants, safe nonce/state handling, setup failure propagation, and metadata without secret leakage.
- Suggested commit: `feat: add frame transaction adapter contract`.

## 3. Improve comparison and path safety
- Support separate public and alternative RPC URLs; chain-check every selected endpoint.
- Never reuse one signed transaction/nonce across comparison paths.
- Implement expected accept/reject, unexpected accept/reject, unexpected rule/error class, transport failure, and inconclusive outcomes. Retain independent receipt states.
- Prevent bad nonce, malformed payload, insufficient funding, and RPC errors from appearing as policy discrepancies.
- Gate: mock integration tests for both endpoints, chain mismatches, error classes, receipt success/revert/pending, and duplicate-state avoidance.

## 4. Implement one real mutation family and paymaster scenarios
- Verification gas: below/at/above an actual documented sidecar threshold; re-encode and re-sign each variant.
- Record rule provenance/version. Replace speculative generator expectations only after checking deployed rules.
- Add `uniswap-v4-paymaster` cases A basic sponsor, B unstaked pool reader, C staked pool reader, D verified boundaries. Perform authorized state/funding/staking setup through adapter hooks.
- Gate: one low-volume authorized live baseline plus independently signed policy comparisons, complete evidence and receipt status. Mock tests are a separate gate, never live proof.

## 5. Dashboard and final demonstration
- Extend the existing console with network status, scenario/mutation selector, run state, per-path expected/actual outcomes, mismatch/error detail, receipt state, and replay/export.
- Use actual saved runner evidence; label SYNTHETIC and LIVE visibly. Ground explorer links in verified network data.
- Run tests, CLI smoke checks, and dashboard checks. Update README and all checkpoint documents with exact results and limitations.
- Keep Arkiv, unrelated sponsors, and swap/reimbursement claims out until supported by the requested evidence.

## Handoff at every stop
Record changed behavior, tests actually run, known failures, files being edited, missing inputs, and the single next action in `CURRENT_STATUS.md`. Update this queue as work completes. Commit the checkpoint with its related change; leave unrelated user edits untouched. Never leave secrets in documentation.
