# Up next

## Real Sonnet investigator verified - November 6, 2026

OpenRouter authentication reachability returned HTTP200 in737ms without displaying account data/key. The authorized retry reached three valid model proposals, executed record(1,999) and independently replayed it, but rejected the revision at strict schema validation (sonnet-retry-1.json). Four provider responses cost $0.04813776 according to reported usage; three were locally valid. The original rejected response was not retained, so its exact invalid value/length is not asserted.

Added concise one-sentence output instructions, preserving the existing600-character hard limit, and content-free response-length diagnostics. A new test proves a601-character revision is rejected without truncation or logging its content. No automatic retry path was introduced.

The corrected bounded run (sonnet-retry-2.json) completed **four real validated Sonnet4.6 calls**, three perspective proposals plus an observation-conditioned revision. Three unique hypotheses; two executed semantic variants: **record(1,20)** then **record(2,10)**. Actual unsafe owner recovery true, safe false, same witness/target and changed canonical hash for both. Both independently reproduced with source/compiler hashes verified in fresh processes17904 and18564; separate descriptor-only CLI replays also passed. Classification OFFLINE_SIGNATURE_BINDING only: no EVM execution, admission, successful action or vulnerability finding. Model prose is untrusted, including poorly phrased falsifiers; local observations control verdicts.

Successful-run usage10085 tokens, reported cost $0.03823281, within six-call/$0.25 client limits. This task's two runs total eight provider responses, seven validated, reported cost $0.08637057; the earlier timeout's actual billing remains unknown. No additional model calls were made for the dashboard.

Normal dashboard restarted using node --env-file=.env bin/framefuzz.mjs serve --results runs --port 4180 with FRAMEFUZZ_SWARM=on and OPENROUTER_MODEL=anthropic/claude-sonnet-4.6. Browser loaded saved report2a910262-9dcd-4261-b661-d245a7d20122 after process restart, displaying real proposals, revision, actual observations, four calls and two independent replays. Screenshot sonnet-dashboard.png. Existing port4177 saved demo and historical evidence preserved. No blockchain/Arkiv writes or pushes.

Verification: npm test **93 passed/0 failed**,19.199s, loopback permitted; node scripts/live-evidence.mjs --check passed. Root.env remains ignored and is never committed.

Next phase: offline model investigation acceptance is met. Live phase remains gated on funded owned deployer/owner and viable sponsor, current canonical hash compatibility and confirmed gateway write health; then resolve the exact owned deployment/submission manifest before requesting live approval. Last read-only capture found old sponsor code empty and balance0. Do not broadcast or infer live findings from offline proof. Earlier notes below are historical checkpoints.

## Latest OpenRouter attempt - November 6, 2026

The root .env now exists, is Git-ignored, and exposes OPENROUTER_API_KEY when loaded with Node --env-file=.env. Key presence verified without displaying its value; credentials/authentication are not proven by presence alone. Model: anthropic/claude-sonnet-4.6.

Executed: $env:FRAMEFUZZ_SWARM='on'; $env:OPENROUTER_MODEL='anthropic/claude-sonnet-4.6'; node --env-file=.env bin/framefuzz.mjs swarm investigate --mode openrouter --output evidence/investigator/2026-11-06/sonnet-investigation.json

Observed INCOMPLETE: one provider request attempted, OpenRouter request timeout, zero validated model responses, zero generated/executed experiments, zero blockchain broadcasts. No generation ID, response usage or actual charge was received. The reported $0.06163 is a retained conservative reservation, not an observed bill. No automatic retry. Existing 92-test result unchanged; this checkpoint changes only documentation/evidence. Historical fallback and LIVE evidence remain untouched.

Next: diagnose provider/network responsiveness before an explicitly bounded rerun; retain this failed capture and write any later run to a new file. Successful real model investigation remains unverified. Launch future configured processes with --env-file=.env; the existing dashboard process does not automatically load that file.

Implementation committed as `9e5e4c4`; evidence checkpoint includes sanitized CLI/dashboard reports, standalone regression descriptors, two CLI replays, read-only preflight, screenshot and SHA-256 manifest. No real provider demonstration or push.

## First unfinished task — real Sonnet demonstration

Expose OPENROUTER_API_KEY to the terminal/process launching FrameFuzz (key location clarification pending; never put its value in chat/files/commits). Model already selects anthropic/claude-sonnet-4.6. Then run `$env:FRAMEFUZZ_SWARM='on'; node bin/framefuzz.mjs swarm investigate --mode openrouter --output runs/sonnet-investigation.json`. Inspect sanitized provider usage/generation IDs, three proposals, actual observations, revision, two distinct executed model-selected values and fresh-process replays. Save a new evidence capture without overwriting scripted or historical results. No real model calls demonstrated yet; do not label this task finished.

92 tests pass. Offline implementation is complete and browser verified, including saved investigation after server restart. Use normal port4180 Swarm Lab with explicit model consent; existing port4177 saved-demo stays external-free. Setup and limits: docs/INVESTIGATOR.md. Default swarm remains off. No blockchain writes or pushes authorized by this checkpoint. Current live sponsor is empty/unfunded, current hash compatibility/write health unverified; see docs/LIVE_COMPATIBILITY_AUDIT.md. Resolve those gates and obtain separate live authorization before any future chain experiment.

## Dashboard UI complete — use for EF / judge demos
Premium light SPA is live on the existing saved-demo server. Prefer `node bin/framefuzz.mjs saved-demo --results runs/saved-demo --port 4177` then open Technical Briefing → Present to EF. Do not treat Swarm Lab as a live investigator. Historical evidence and APIs unchanged.

## STOP — offline milestone1 and read-only milestone2 implemented
83 tests pass (all71 baseline +12 swarm). Read `docs/SWARM_MILESTONES.md` and `evidence/swarm/milestone-2/preflight.json`. Do not deploy or broadcast. The executed preflight found a stale execution head, no secure funded deployer key/owner addresses, unverified canonical-hash compatibility and unconfirmed write health. Conditional plan:5 owned deployments,4 isolated alternative submissions; no live execution or action proof exists.

Next only after new instructions: resolve funded devnet-only deployment environment and owner address without pasting keys, obtain operator confirmation of health, verify client canonical hash, present the resolved manifest and obtain separate explicit live approval. Then implement/execute milestone3 safely. Milestone4 real LLM investigator remains deferred; UI/Arkiv presentation surfaces now exist without claiming live swarm results. Arkiv writes require separate approval. Keep the existing saved demo, historical evidence and v1 fixtures unchanged; no current feature should imply a live finding.

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
