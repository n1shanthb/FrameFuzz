# Up next

## Active — approved swarm, stop after read-only milestone2
Milestone1 complete with79 tests. Read `docs/SWARM_MILESTONES.md` for actual evidence and signing-hash compatibility limitation. Implement/run only read-only preflight and conditional deployment/submission manifest next. No live deployment, broadcast, LLM execution claim or Arkiv write is authorized. Secure funded wallet, healthy authorized chain1337 endpoint, verified canonical hash behavior and separate human approval are prerequisites for the next phase. Preserve all71 baseline tests and v1 fixture digests.

## Ready — final submission materials
README/product copy, generated `docs/LIVE_EVIDENCE.md`, four-minute `docs/DEMO_SCRIPT.md`, checklist, project description, recording guidance, FEEDBACK and sponsor docs are complete.71 tests pass. The offline saved demo and live Arkiv query/import were verified in browser. Exact proof: `evidence/submission/2026-11-06/`. Preserve successful historical LIVE evidence unchanged.

Next: follow `docs/SUBMISSION_CHECKLIST.md` for human video review/recording, authorized push/public-access verification, required Uniswap feedback form and ETHGlobal submission. None is claimed submitted. Port4177 is running wallet-free saved-demo mode; no current registry reads or broadcasts occur. To query live Arkiv, restart normal serve mode explicitly. Optional new fixture publication requires a newly configured funded test-wallet key; the old in-memory key is gone.

External blocker: chain1337 sidecar disk full. Do not retry broadcasts until the operator confirms recovery. The generated Uniswap campaign has4/6 matching decisions,2 infrastructure failures and0 new inclusions. Do not generalize historical successful receipts into a new campaign success. Sponsor feedback form is human-required and not submitted. Push/public submission is not authorized by local commit instructions.

## Registry completed — current handoff
The real Arkiv publish → fresh-process query → retrieve → dashboard import → unsigned replay preview cycle succeeded. Read `arkiv/how-you-use-arkiv.md` and `evidence/arkiv/2026-11-06/` for exact identity/receipt and commands. All66 tests pass. No remaining implementation blocker for the requested registry MVP.

Next action: demonstrate via the running http://127.0.0.1:4177/#community dashboard or a fresh `arkiv query` process while entity `0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1` remains unexpired (expiry block569638). Query is public; no signing wallet is authenticated or required. A future publish needs a separately funded Rabdi ARKIV_PRIVATE_KEY environment variable; the demo key was not persisted. Do not republish merely to inspect the case. No unrelated integrations or live community auto-broadcast.

Optional future work, not performed: pagination, second independent external publisher validation, moderation and locally verified rules before separately authorized live reruns. Preserve all existing LIVE/MOCK/PREVIEW evidence and receipts. Archive records are not an excuse to bypass current Arkiv expiry checks.

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
