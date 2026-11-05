# Up next

Read `AGENTS.md`, `AUTHORITY.md`, `CURRENT_STATUS.md`, `BUILD_STATUS.md`, `docs/MUTATIONS.md` and `docs/ADAPTER.md`. Stay on `feat/framefuzz-mvp`; preserve user edits and all historical evidence.

## Completed — do not redo
Deterministic gas and storage/stake generators, transparent confidence-aware oracle, adapter compilation, CLI/replay/coverage, bounded opt-in shrink utility, minimal console controls and tests are implemented. The NEW seed42/count7 gas campaign executed fourteen independently signed live submissions: all matched, eight included successfully and six rejected above the cap. Three storage states were generated and previewed/tested locally. All 58 tests and the six-case mock demonstration pass. The old six-case evidence remains unchanged.

## Saved demonstration (no broadcasts)
```powershell
node bin/framefuzz.mjs mutate --suite verification-gas --seed 42 --count 7 --preview
node bin/framefuzz.mjs mutate --suite uniswap-storage --seed 42 --count 3 --preview
node bin/framefuzz.mjs mutate --replay evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.replay.json --variant 0 --preview
```
Port4177 is already serving the read-only console. Select the generated LIVE seven-case report to inspect actual results/coverage, or Preview mutations for unsigned expectations. PREVIEW/UNKNOWN must never be displayed as successful live execution. Evidence manifest: `evidence/mutations/2026-11-06/manifest.json`.

To restore the saved LIVE run on another checkout:
```powershell
npm ci
npm test
Copy-Item evidence/mutations/2026-11-06/*LIVE_RPC_SUBMISSION-947a7e01.json runs/
node bin/framefuzz.mjs serve --cases examples/live/basic.mjs --rpc https://altmempool.forshtat.com/rpc --allow-chain 1337 --port 4177
```

## Remaining follow-up
- Obtain the live sidecar's exact build commit from its operator if possible. It exposes v4.1.1 but an empty commit; preserve that limitation.
- Only expand mutation dimensions or minimum-validation-gas inference with new grounded fixture evidence and tests, under a new rule/generator version as needed. Do not edit historical evidence to make an oracle pass.
- If a genuine unexpected result appears, use the saved descriptor and an explicit bounded monotonic shrink predicate; no automatic high-volume probing.
- If another live campaign is requested, use explicit `--submit --allow-chain 1337`, at most seven selected variants, and the existing adapter. Recheck sponsor code/funding/stake. Keep B unstaked. Avoid unnecessary redeployments or repeated campaigns.
- Keep keys/ZIPs/raw extraction ignored. Do not force-push; push only when authorized. Keep conventional commits and checkpoint files current.

No Arkiv, Uniswap swap settlement, Chainlink or additional sponsor integrations are in scope. No discrepancy was found in the automatic campaign.
