# Bounded adversarial investigator

Current implementation: [Agentic feasibility validator](AGENTIC_FEASIBILITY.md). All real OpenRouter investigations use Scout → Mutation → LLM Validator → deterministic gates → Executor → Critic. One role-conditioned Sonnet model makes distinct requests. The explicitly labeled simulated demonstration remains separate. Missing credentials or failed provider/schema validation never silently select simulation.

Set FRAMEFUZZ_SWARM=on and OPENROUTER_API_KEY in the launching environment; never paste or commit credentials. OPENROUTER_MODEL=sonnet selects anthropic/claude-sonnet-4.6. CLI deliberate paid selection: node bin/framefuzz.mjs swarm investigate --mode openrouter --output runs/new-investigation.json. UI requires its explicit consent checkbox. Default ceilings:6 calls,60000 accounted tokens,2000 output tokens,24000 input bytes,45 seconds/request and $0.50. Reservations precede requests; missing usage retains reservations. No automatic provider retries or fallback. Blockchain and Arkiv writes remain disabled.

Supported tools: bounded existing owned-validator ECDSA recovery and unsigned existing gas-policy predictions. No arbitrary Solidity compilation or universal contract analysis. Every proposal receives genuine LLM feasibility review and independent deterministic gates. Deferred/rejected cases and one bounded repair are retained. PASS/XFAIL/XPASS/FAIL require real tool observations; predictions keep observedVerdict=null and PREDICTED. XPASS/FAIL are candidates, never verified vulnerabilities. Critic may request one bounded fresh-process local replay, never broadcast.

The current real demo completed four paid role calls and two local tool evaluations; all attempts together cost $0.19351332 over11 requests. Full details, provenance, limitations, exact commands and tests: AGENTIC_FEASIBILITY.md. Key-free saved mode restores the fourth run plus the original investigation. The sections below are historical reports of the prior perspective pipeline, not the current orchestration contract.

## Executed status, November 6

No real OpenRouter request has been demonstrated: process, user and machine `OPENROUTER_API_KEY` presence checks were false after the user reported configuration. The location/terminal holding it remains pending; no value was requested in chat.

Saved fallback: `evidence/investigator/2026-11-06/simulated-investigation.json`. Scripted record(1,73) and record(19,10) both showed unsafe owner recovery and safe rejection and reproduced in independent processes. These are not model-selected values. Separate CLI replays are saved beside the report. Mock-transport tests prove different proposed values alter actual calldata and actual observations condition the revision request; they do not prove a real provider call.

## Latest OpenRouter attempt - November 6, 2026

The root .env now exists, is Git-ignored, and exposes OPENROUTER_API_KEY when loaded with Node --env-file=.env. Key presence verified without displaying its value; credentials/authentication are not proven by presence alone. Model: anthropic/claude-sonnet-4.6.

Executed: $env:FRAMEFUZZ_SWARM='on'; $env:OPENROUTER_MODEL='anthropic/claude-sonnet-4.6'; node --env-file=.env bin/framefuzz.mjs swarm investigate --mode openrouter --output evidence/investigator/2026-11-06/sonnet-investigation.json

Observed INCOMPLETE: one provider request attempted, OpenRouter request timeout, zero validated model responses, zero generated/executed experiments, zero blockchain broadcasts. No generation ID, response usage or actual charge was received. The reported $0.06163 is a retained conservative reservation, not an observed bill. No automatic retry. Existing 92-test result unchanged; this checkpoint changes only documentation/evidence. Historical fallback and LIVE evidence remain untouched.

Next: diagnose provider/network responsiveness before an explicitly bounded rerun; retain this failed capture and write any later run to a new file. Successful real model investigation remains unverified. Launch future configured processes with --env-file=.env; the existing dashboard process does not automatically load that file.

## Real Sonnet investigator verified - November 6, 2026

OpenRouter authentication reachability returned HTTP200 in737ms without displaying account data/key. The authorized retry reached three valid model proposals, executed record(1,999) and independently replayed it, but rejected the revision at strict schema validation (sonnet-retry-1.json). Four provider responses cost $0.04813776 according to reported usage; three were locally valid. The original rejected response was not retained, so its exact invalid value/length is not asserted.

Added concise one-sentence output instructions, preserving the existing600-character hard limit, and content-free response-length diagnostics. A new test proves a601-character revision is rejected without truncation or logging its content. No automatic retry path was introduced.

The corrected bounded run (sonnet-retry-2.json) completed **four real validated Sonnet4.6 calls**, three perspective proposals plus an observation-conditioned revision. Three unique hypotheses; two executed semantic variants: **record(1,20)** then **record(2,10)**. Actual unsafe owner recovery true, safe false, same witness/target and changed canonical hash for both. Both independently reproduced with source/compiler hashes verified in fresh processes17904 and18564; separate descriptor-only CLI replays also passed. Classification OFFLINE_SIGNATURE_BINDING only: no EVM execution, admission, successful action or vulnerability finding. Model prose is untrusted, including poorly phrased falsifiers; local observations control verdicts.

Successful-run usage10085 tokens, reported cost $0.03823281, within six-call/$0.25 client limits. This task's two runs total eight provider responses, seven validated, reported cost $0.08637057; the earlier timeout's actual billing remains unknown. No additional model calls were made for the dashboard.

Normal dashboard restarted using node --env-file=.env bin/framefuzz.mjs serve --results runs --port 4180 with FRAMEFUZZ_SWARM=on and OPENROUTER_MODEL=anthropic/claude-sonnet-4.6. Browser loaded saved report2a910262-9dcd-4261-b661-d245a7d20122 after process restart, displaying real proposals, revision, actual observations, four calls and two independent replays. Screenshot sonnet-dashboard.png. Existing port4177 saved demo and historical evidence preserved. No blockchain/Arkiv writes or pushes.

Verification: npm test **93 passed/0 failed**,19.199s, loopback permitted; node scripts/live-evidence.mjs --check passed. Root.env remains ignored and is never committed.

Next phase: offline model investigation acceptance is met. Live phase remains gated on funded owned deployer/owner and viable sponsor, current canonical hash compatibility and confirmed gateway write health; then resolve the exact owned deployment/submission manifest before requesting live approval. Last read-only capture found old sponsor code empty and balance0. Do not broadcast or infer live findings from offline proof. Earlier notes below are historical checkpoints.


### Exact real investigation and descriptor replay commands

With FRAMEFUZZ_SWARM=on and OPENROUTER_MODEL=anthropic/claude-sonnet-4.6:

- node --env-file=.env bin/framefuzz.mjs swarm investigate --mode openrouter --output evidence/investigator/2026-11-06/sonnet-retry-1.json (INCOMPLETE, schema rejection)
- node --env-file=.env bin/framefuzz.mjs swarm investigate --mode openrouter --output evidence/investigator/2026-11-06/sonnet-retry-2.json (COMPLETE_OFFLINE_INVESTIGATION)
- node bin/framefuzz.mjs swarm replay evidence/investigator/2026-11-06/sonnet-regressions.json --variant 0 --output evidence/investigator/2026-11-06/sonnet-replay-0.json (passed)
- node bin/framefuzz.mjs swarm replay evidence/investigator/2026-11-06/sonnet-regressions.json --variant 1 --output evidence/investigator/2026-11-06/sonnet-replay-1.json (passed)

Transaction hashes and chain receipts: none; no blockchain transactions were sent. OpenRouter generation IDs and request usage are in each sanitized report.
