# FrameFuzz — EIP-8141 admission testing lab

FrameFuzz builds independently signed frame transactions, compares canonical and alternative admission rules, tracks execution separately, and exports reproducible evidence.

**LIVE integration verified November 6, 2026:** all three sponsored admission scenarios and three gas-boundary variants matched on the forshtat throwaway devnet, chain **1337**. Twelve admission submissions; seven successful included transactions. **37 automated tests pass.** No USDC reimbursement or Uniswap swap is claimed.

## Open the real evidence dashboard

Requires Node.js **20.12+**; tested with **22.13.0**.

```powershell
Set-Location E:\ethglobalmumbai
npm ci
npm test
# Restore committed evidence into the ignored local dashboard library:
Copy-Item evidence/live/2026-11-06/*LIVE_RPC_SUBMISSION-3a838bca.json runs/
node bin/framefuzz.mjs serve --cases examples/live/basic.mjs --rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --port 4177
```

Open [the dashboard](http://127.0.0.1:4177). Select the six-case LIVE run, inspect public/alternative outcomes and receipts, and download JSON, Markdown or replay. This command is read-only: it cannot submit transactions. `npm start` also displays saved evidence but does not configure a network status check. MOCK and SYNTHETIC runs retain separate labels.

Full receipts, replay inputs, deployment record, and real sidecar admission checks are committed in [evidence/live/2026-11-06](evidence/live/2026-11-06/). [BUILD_STATUS.md](BUILD_STATUS.md) records complete hashes and exact executed commands.

## Run a small live test

The current nonsecret chain configuration and deployed sponsor code hashes live in `examples/live/devnet.json`. Devnet resets can invalidate them. The adapter checks chain ID, authorized endpoint, sponsor code, funding, stake, fresh zero-ETH sender and pending nonce before signing. It uses the actual pinned workshop codec/signing package.

```powershell
node bin/framefuzz.mjs run examples/live/basic.mjs --public-rpc https://altmempool.forshtat.com/rpc --alt-rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --submit --receipt-wait-ms 12000
```

Use `examples/live/unstaked.mjs`, `examples/live/staked.mjs` or `examples/live/verification-gas.mjs` instead for the other suites. Omit `--submit` for a chain-checking preview with no setup/signing/submission. Use individual files; `examples/live/` also contains configuration/helpers and is not a fixture directory. Keys for fresh sponsored senders are generated in memory and never exported. Existing sponsors pay their gas; these sends need no funding key.

The canonical path uses `eth_sendRawTransaction` with encoded type-0x06 bytes; the alternative path uses `eth_sendFrameTransaction` with the codec's structured wire object. Both can use the same gateway URL while exercising distinct admission methods. Every path gets a different sender/signature, so duplicate submission cannot masquerade as policy divergence.

Verification-gas cases set payer VERIFY execution gas to **67199 / 67200 / 67201**. Sender VERIFY contributes 30000 and secp256k1 signature verification contributes 2800, yielding total budgets **99999 / 100000 / 100001**. Both real paths accepted below/at and rejected above. The intended staked public/alternative difference is a PASS, not a vulnerability.

## Setup and receipts

`vendor/paymaster/` contains the original supplied reserve-reading source and compiled artifact. To deploy a fresh unstaked fixture, set `FRAMEFUZZ_DEPLOYER_KEY` in your terminal environment to a funded **devnet-only** key, then run `node bin/deploy-reserve.mjs`. This spends 0.15 devnet ETH creation value plus gas and updates the nonsecret config/deployment evidence. Do not put the key in source, command arguments, reports or commits. The adapter can reuse the existing verified stake; it does not restake an unstaked fixture automatically.

To refresh receipts and reclassify captured errors **without resubmitting**:

```powershell
node bin/framefuzz.mjs refresh PATH_TO_LIVE_REPORT.json --rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --receipt-wait-ms 1000
```

Admission and inclusion are independent. Inspect receipt status, payer and frame receipts. Rejected transactions have computed hashes for inspection, not mined transaction claims. Replay exports retain structured RPC parameters and signed raw bytes; rebuild with fresh state rather than rebroadcasting stale nonces.

CLI exits: `0` all admission cases matched, `2` unexpected verdict, `3` incomplete/inconclusive/transport result, `1` configuration/safety failure. Evidence preserves precondition errors separately from rule mismatches.

## Mock tests and custom integration

`npm run demo:mock` uses two local fake gateways and fictional JSON-encoded inputs; it never signs Ethereum transactions. `npm run demo` generates static SYNTHETIC UI data. Neither is live proof. Automated tests include real signature recovery/codec roundtrips plus mocked transport/setup tests; they never broadcast externally.

Custom integrations use [docs/ADAPTER.md](docs/ADAPTER.md). Generic provenance-driven scenarios remain available with `--scenario`, `--adapter`, `--rules`, `--case`, and `--mutation`. `FRAMEFUZZ_PUBLIC_RPC`, `FRAMEFUZZ_ALT_RPC` and `FRAMEFUZZ_RPC` avoid credential-bearing endpoint arguments. The live fixtures directly bind the supplied PoC and preserve the sidecar deployment-provenance limitation instead of falsely declaring an exact source match.

## Source and limits

See [vendor/README.md](vendor/README.md) for imported artifact and dependency provenance. The execution client reports `9aa3645d795945c64400f41a70aace0edfa7f383`. Sidecar v4.1.1 exposes no commit, so the reviewed sidecar source is not claimed to be an attested build match. Actual runtime storage and gas-limit admission checks are saved with the LIVE evidence.

Only authorized local/devnet chains; mainnet is blocked. No high-volume gateway testing, fabricated receipts, Arkiv, unrelated sponsors, swap or reimbursement work. ZIPs and raw key-bearing PoC files are ignored; key-free imported references and actual evidence are committed.

## Repository and IDE handoff

`src/adapters/` holds codec/live/setup integration; `src/runner.mjs`, `rpc.mjs`, `verdict.mjs`, `refresh.mjs`, and `reports.mjs` handle execution/evidence. `examples/live/` contains working fixtures; `test/` contains 37 tests; `web/` is the existing dashboard, unchanged during live integration. `scripts/collect-live-evidence.mjs` collects existing reports and read-only admission checks. `vendor/` holds provenance/artifacts; `evidence/live/` holds committed real results.

Read [AGENTS.md](AGENTS.md), [AUTHORITY.md](AUTHORITY.md), [CURRENT_STATUS.md](CURRENT_STATUS.md) and [UP_NEXT.md](UP_NEXT.md) when changing IDEs. Cursor's always-applied rule loads the same handoff. Use coherent, frequent conventional commits.
