# Build status — Pass2

Full report and exact changed paths: [docs/PASS2_REPORT.md](docs/PASS2_REPORT.md). Current supported capabilities: [docs/CURRENT_CAPABILITIES.md](docs/CURRENT_CAPABILITIES.md). Older checkpoint text is preserved under docs/history/ and Git history.

## Observed verification

- Baseline e44bce4: clean feat/framefuzz-mvp,119 tests pass.
- Final `npm test`:147 pass, 0 fail, 0 skipped;23646ms. Loopback allowed for local mocks/dashboard servers. Output retained at runs/pass2-final-tests.txt.
- `npm run verify`:63 modules syntax-check; generated facts match canonical evidence and docs/TEST_CHECKPOINT.json.
- `node scripts/live-evidence.mjs --check`: committed guide matches.
- `npm run run:preview`: exit0,7 unsigned variants, 0 submissions. Output runs/pass2-preview-command.txt.
- `npm audit --package-lock-only --ignore-scripts --json`: exit0, 0 known vulnerabilities; dependencies unchanged.
- `$env:FRAMEFUZZ_SWARM='on'; node bin/framefuzz.mjs saved-demo --results runs/pass2-saved-demo --port 4192`: fresh key-free offline server; snapshots/previous PREVIEW and genuine Sonnet load available. Real browser checks are manual, not147 automated browser tests.
- `node bin/framefuzz.mjs serve --results runs/pass2-live-ui --port 4193`: fresh read-only server; actual Arkiv UI journey completed. Query block 293040; retrieval expiry check293088; new imported report0 submissions/UNKNOWN confidence/no signed bytes. Capture: evidence/completion-pass2/2026-11-06/manifest.json, query.json, import-preview.json and registry-preview.png.
- `$env:FRAMEFUZZ_SWARM='on'; node bin/framefuzz.mjs swarm sponsored-plan --investigation evidence/investigator/2026-11-06/sonnet-retry-2.json --context examples/swarm/sponsored-context.json --output runs/pass2-sponsored-plan.json`: exit0, unresolved public inputs explicit;0 signatures/deployments. Resolved-context snapshot/negative tests pass.
- Raw-proof CLI exercised through constructed fixture subprocess;19 proof tests,18 adversarial negatives, no live proof claim. See docs/RAW_ACTION_PROOF.md.
- Real browser widths375/768/1440: sampled page widths360/753/1425; local table overflow,44 px mobile nav, focus/Tab/Escape and all Registry filters checked.
- `git ls-remote --heads origin feat/framefuzz-mvp main`: remote branch b15df81376664baaeaf426086c5a1a2683f8be4d; main bb0be5ec520981331c7655b44cc0503a835adabd. Anonymous repo/branch requests both HTTP 404; public access unconfirmed. No video file found by workspace extension search.

## Capabilities and limits

C6/F6/F8/G4/E3 promoted to FULL only in supported scopes; E7/G6 remain PARTIAL. FULL 32,LIMITED 19,PARTIAL 2,BLOCKED 3,BROKEN 0,MOCK 1,DEAD WEIGHT 1,NOT IMPLEMENTED 7 =65. No LIMITED or dead-weight pass was reopened.

No new EIP-8141 transaction hash/receipt, funding, deployment, Arkiv publication, paid model call, push or form submission exists from this pass. Historical chain proof remains at its original paths/digests; only fresh read/unsigned-preview evidence was added separately. No owned-validator runtime execution, action proof or finding is established.

The sponsored preparation fee envelope remains0.064 test ETH excluding unresolved sponsor funding; no spending authorized. Self-funded candidate remains separate/unverified. Current gateway/sponsor/runtime viability is not established by historical success. Manual delivery steps remain in docs/DELIVERY_PASS2.md.

Implementation commits and final handoff checkpoint: inspect Git history. Stop before further passes or external actions.

## Stability checkpoint — 2026-11-06
158/158 tests pass;69 modules verify; saved-demo browser checked with execution default off. Exact commands, results and limitations: docs/STABILITY_FOUNDATION_REPORT.md. No original evidence changes, paid calls or chain writes. Internal foundation checkpoint follows in Git history.

## Internal foundation complete — 2026-11-06
158/158 tests pass,0 fail/skip;69 modules verified. Actual three fixture results, full canonical hashes, input/context/spec/result schemas and dependency map: docs/CONTRACT_ANALYSIS_FOUNDATION.md. Commands/exit codes/browser distinction/safety: docs/STABILITY_FOUNDATION_REPORT.md. Gas preview actual=null; historical accepted/accepted; record(2,10) fresh offline unsafe=true safe=false; ordinary contract UNVERIFIED. No Playground UI or new live proof. Stop here pending explicit next instruction.

## Agentic feasibility pipeline — 2026-11-06
Implemented genuine Scout/Mutation/Validator/Executor/Critic calls, deterministic gates, deferred/rejected logs, bounded repair, outcome taxonomy and existing Swarm Lab filters/exports. 164/164 tests,0 fail/skip;75 modules verified. Successful Sonnet run4 calls,$0.087021; all preserved attempts11 requests,$0.19351332 actual reported total. Real local record(1,99): unsafe XPASS candidate, safe INCONCLUSIVE due UNKNOWN expectation; gas67201 PREDICTED with no observed admission. Matching fresh-process replay, no finding. Both final proposals feasible; rejection/repair proven in tests and earlier deterministic vetoes, no manufactured rejection. Exact evidence, commands/exit codes and limitations: docs/AGENTIC_FEASIBILITY.md. Original evidence unchanged; no chain writes/Arkiv publication/push.

## BYOC compiler checkpoint — 2026-11-06
Baseline164/164 tests verified; isolated compiler3 tests pass. Fixed source filename, disabled import resolution, supervised process/worker with heap/RSS/time/output limits; actual ABI/AST/source ranges and selection diagnostics for unseen contracts. Active work continues on stateful agents, HTTP/UI, tool negotiation and full regression checks. No paid/chain/Arkiv calls or push.

## BYOC multi-agent integration — 2026-11-06
175/175 tests pass; `npm run verify` 86 modules. Independent Scout/Mutation/Validator/Critic sessions with private history, structured agent messages, deterministic veto over LLM decisions, local ABI/AST tools, export/replay/cancel, Contract Playground UI. Real browser paste→analyze→mock negotiation→XFAIL ABI repair→replay→source invalidation verified on mock transport (`scripts/byoc-browser-demo.mjs --mock-transport`). Paid calls:0. Chain writes:0. Generic contracts: compiler/ABI/AST only — not EVM or admission. Verdict: BYOC_MULTI_AGENT_PARTIAL.

## Real agent quality / Uniswap / preflight — 2026-11-06
178/178 tests; verify 90 modules; audit 0. ABI_TOOL_TEST vs impossible ABI fixed. Sprint OpenRouter spend $0.62201304 / $1.00. Genuine paid BYOC FreshInventoryLock COMPLETE (`8edbdf04…`, 7 calls). Genuine paid Uniswap ReserveReadingPaymaster COMPLETE (`da5e54ff…`, 7 calls, PREDICTED historical/context — not fresh admission). Arkiv ARKIV_PUBLICATION_BLOCKED. Fresh EIP-8141 FRESH_EIP8141_BLOCKED_EXTERNAL (gateway alive; no deployer key/approval). Evidence: `evidence/playground/2026-11-06/`. No push/chain/Arkiv writes.
