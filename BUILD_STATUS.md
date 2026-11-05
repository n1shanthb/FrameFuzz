# Build status

Verified November 6, 2026 (IST). This is the starter baseline plus a persistent Codex/Cursor handoff, not the completed hackathon MVP.

## Implemented
Imported the existing runner, CLI, dashboard, numeric mutation scaffold, fixtures, reports, and tests. Added `AGENTS.md`, `AUTHORITY.md`, `CURRENT_STATUS.md`, `UP_NEXT.md`, the full build brief, and an always-applied Cursor rule. Initialized local version control and documented frequent conventional commits.

## Tests actually executed
- Node v22.13.0: `npm test` passed **10/10** with local loopback permitted. The restricted run initially failed four local-RPC tests; no source fix was needed for the passing rerun.
- `node bin/framefuzz.mjs help` passed.
- `node bin/framefuzz.mjs demo --results runs` passed and generated SYNTHETIC evidence only.
- Dashboard HTTP/API smoke passed: HTML response, configuration with submission disabled, saved evidence listing, and HTTP 409 rejection of a disabled POST run. Used a temporary loopback server and closed it afterward. Visual/browser interaction was not tested.

## Live evidence
No real devnet scenario was executed here. No real transaction hash or receipt was generated. External Cursor paymaster reports remain unverified by this repository. USDC reimbursement and an actual Uniswap v4 swap are unproven.

## Blockers and import requirements
The signer, adapter, live setup, per-path endpoints, expanded verdict taxonomy, and complete mutation/scenario implementations are pending. Import the known-good PoC signer/encoder, contract interfaces and setup, chain/deployment configuration, full evidence, and sidecar rule provenance listed in `UP_NEXT.md`. GitHub's saved CLI token is invalid; no remote/push has been established.

## Reproduce the current local demonstration
```powershell
Set-Location E:\ethglobalmumbai
node --version
npm test
node bin/framefuzz.mjs help
node bin/framefuzz.mjs demo --results runs
npm start
```
Open `http://127.0.0.1:4177`. Choose a clearly labeled synthetic saved run. Stop the server with Ctrl+C. No npm install is required. The local demo does not send transactions. Restricted environments must permit local loopback for the mock-RPC tests.

## Next integration step
Implement and test `src/adapters/` while obtaining the known-good signer artifacts; then run one explicitly authorized signed devnet baseline. See `UP_NEXT.md` for the ordered implementation gates.
