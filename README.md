# FrameFuzz — EIP-8141 admission testing lab

Compare expected and observed admission decisions across public and alternative Ethereum admission paths, keep execution receipts separate, and export reproducible evidence.

**Current deliverable:** tested adapter/runner/scenario infrastructure with an executable local mock demonstration. The external workshop signer and Uniswap paymaster PoC were not supplied. No real devnet transaction or Uniswap swap was executed by this build. See [BUILD_STATUS.md](BUILD_STATUS.md).

## Run the working local demonstration

Node.js **20+**, no dependencies and no `npm install` required. Verified here with Node **22.13.0**.

```powershell
Set-Location E:\ethglobalmumbai
npm test
npm run demo:mock
npm start
```

Open [the dashboard](http://127.0.0.1:4177). The mock demo starts two temporary loopback gateways, runs six scenarios / twelve path submissions, saves JSON, Markdown and replay metadata under `runs/`, and closes both gateways. Its transactions, receipts, hashes, addresses and rule thresholds are **fictional test data**, labeled `MOCK_RPC_TEST — NOT LIVE`. It never signs an Ethereum transaction or connects to a devnet.

The dashboard loads saved evidence; select a run or case to inspect both paths, receipts, mutation parameters and rule provenance. Download JSON, Markdown or replay metadata. Live submission stays disabled unless explicitly configured. For scenario dropdowns in read-only mode:

```powershell
node bin/framefuzz.mjs serve --adapter examples/mock-adapter.mjs --rules examples/mock-rules.json --port 4177
```

`npm run demo` remains the simpler static SYNTHETIC UI fixture. Both types remain separate from LIVE evidence.

## Working features

- Adapter plugin interface with fresh account allocation, setup hooks, pending nonce lookup, independent variant signing, fail-closed sessions and allowlisted metadata.
- Separate `public` and `alt` endpoints; every selected endpoint is chain-checked before adapter setup or transaction submission. Chain 1 is blocked.
- Lazy builds prevent setup/signing in preview mode. The provided adapter requires a distinct sender for each case/path to avoid nonce gaps after expected rejections.
- Duplicate signed payload and known sender/nonce guards. Comparative raw fixtures require sender + decimal nonce metadata.
- `EXPECTED_ACCEPT`, `EXPECTED_REJECT`, `UNEXPECTED_ACCEPT`, `UNEXPECTED_REJECT`, `UNEXPECTED_RULE`, `TRANSPORT_FAILURE`, and `INCONCLUSIVE` path verdicts. Case totals retain `MATCH`, `UNEXPECTED`, `INCONCLUSIVE` for compatibility.
- Malformed payload, nonce/duplicate, funding, and RPC errors remain inconclusive unless explicitly tested as an error class. A generic rejection cannot prove a specific policy match.
- Independent receipt states: not checked, included success/revert/unknown, pending before timeout, and receipt RPC error. Hash/block validation prevents mismatched receipts from proving inclusion.
- Provenance-driven `uniswap-v4-paymaster` cases A–C and optional gas-boundary D; `verification-gas` below/at/above variants. No sidecar rule is hardcoded as deployed truth.
- Saved JSON/Markdown/replay exports and a local console with scenario/mutation selection, gateway check, running state and per-path results.

## Import a real signer

Implement the plugin contract in [docs/ADAPTER.md](docs/ADAPTER.md) using the separate experiment's known-good encoder, signer, contracts and setup scripts. Do not reimplement speculative signing or copy private keys into fixtures. Plugin modules are trusted local executable code; factories and case-loading modules must not broadcast during import. Transaction setup belongs in the checked runner lifecycle.

Supply a rules JSON with actual deployed sidecar version, rule reference, verification date, path expectations, StateView/pool configuration and setup parameters. `status: VERIFIED` is an operator declaration, not independent verification by FrameFuzz. The shipped `examples/mock-rules.json` is fictional; changing its label does not make it valid live configuration. The built-in gas family assumes a common explicitly supplied boundary and acceptance direction for both paths; use custom fixtures when policies have distinct thresholds.

After importing real artifacts and authorizing the test devnet, the command shape is:

```powershell
# Set these to the authorized endpoints and checked devnet chain ID first.
# Keep credential-bearing URLs in environment variables.
node bin/framefuzz.mjs run --scenario uniswap-v4-paymaster --adapter ./local/workshop-adapter.mjs --rules ./local/devnet-rules.json --allow-chain $env:FRAMEFUZZ_CHAIN_ID --submit --receipt-wait-ms 5000
```

Endpoints come from `FRAMEFUZZ_PUBLIC_RPC` and `FRAMEFUZZ_ALT_RPC`, or `--public-rpc` / `--alt-rpc`. `FRAMEFUZZ_RPC` / `--rpc` is the legacy shared fallback. This command is an integration template; `local/workshop-adapter.mjs` and actual network rules are **not included**. Omit `--submit` for a chain-checking preview with no builder/setup/submission. Use `serve` with the same options for live dashboard runs.

For existing signed case fixtures:

```powershell
node bin/framefuzz.mjs run examples/cases --rpc $env:FRAMEFUZZ_RPC --allow-chain $env:FRAMEFUZZ_CHAIN_ID
```

The included placeholder fixture is never broadcast. Actual comparative fixtures need independent signatures and `metadata: { sender: '0x…40 hex digits…', nonce: '0' }` on each path. Metadata must describe the real encoded transaction; the generic harness does not decode or verify signatures itself. Never interpret duplicate/nonce errors as policy differences.

Filters: `--case CASE_ID`, `--mutation all|baseline|verification-gas`. CLI exit codes: `0` all selected cases matched, `2` any unexpected verdict, `3` incomplete/inconclusive/transport outcome, `1` configuration or safety failure. Admission success alone does not make an execution claim; inspect each receipt.

## Evidence and replay

Each run writes `.json`, `.md`, and `.replay.json` files. Replay includes observed signed inputs, adapter/sender/nonce/chain metadata, case IDs, mutation/rule provenance, and original adapter/rules paths. It is exported for inspection; there is no automatic rebroadcast. Nonces, stake, balances and contracts may have changed. Rebuild fresh variants through the original adapter and pinned setup.

RPC host labels omit credentials and paths; evidence is scrubbed for credential fields and URL paths. Plugins must keep secrets out of thrown errors. Local `runs/` is ignored by Git. Archive real evidence separately after checking it contains no secrets. Never use mainnet, real funds, high-volume shared-gateway testing, or speculative protocol vulnerability claims.

## Repository map

```text
bin/framefuzz.mjs       CLI: run, serve, mock-demo, demo, help
src/adapters/          signer plugin contract and lifecycle
src/scenarios.mjs      paymaster cases and verification-gas variants
src/selection.mjs      fixture/scenario selection and filters
src/runner.mjs         endpoint preflight, submission, comparisons, receipts
src/rpc.mjs            transport and receipt polling
src/verdict.mjs        admission/error classification
src/reports.mjs        JSON, Markdown and replay evidence
src/server.mjs         local console API
src/safety.mjs         chain guard and evidence redaction
src/fixtures.mjs       trusted local JSON/MJS fixture loader
src/mutations.mjs      legacy generic boundary helper
examples/              placeholder fixture, mock adapter/rules/gateways
test/                  unit, mock integration, CLI and dashboard tests
web/index.html         existing dashboard, extended in place
docs/                  original brief, adapter contract and external PoC notes
runs/                  ignored local generated evidence
```

## Resume in Codex or Cursor

Read [AGENTS.md](AGENTS.md), [AUTHORITY.md](AUTHORITY.md), [CURRENT_STATUS.md](CURRENT_STATUS.md), and [UP_NEXT.md](UP_NEXT.md). Cursor loads `.cursor/rules/framefuzz.mdc` automatically. The full task remains in [docs/BUILD_BRIEF.md](docs/BUILD_BRIEF.md). Commit coherent verified changes frequently with short conventional subjects.

EF admission testing is the core. Real Uniswap storage-dependent validation and swap/reimbursement claims require imported evidence and reproduction. Arkiv, Chainlink and World are not implemented.
