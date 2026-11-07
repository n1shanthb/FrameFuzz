# Agentic feasibility validator — executed checkpoint

## Product and trust boundary

Real OpenRouter investigations now use Scout → Mutation → Validator → Executor → Critic. These are distinct requests to one role-conditioned Sonnet model, not separate autonomous models. src/swarm/investigate.mjs dispatches all openrouter runs to agentic.mjs; the old explicitly labeled simulated path remains available only by explicit selection. Missing credentials, transport failure, invalid JSON or schema failure produce INCOMPLETE, never simulated success.

agent-schema.mjs defines bounded strict Scout, two-candidate mutation, batch Validator, one-proposal repair and Critic responses. Every candidate includes ID, actual target path, source digest/profile, original/mutated inputs, role/rule, expected verdicts, prerequisites, method, negative-test intent, hypothesis and evidence. Text is bounded at1200 characters, citations at16, candidates at2, operations at65535 and parameters at1000000. The provider requests strict JSON schema and locally validates it without truncating output. Failed responses are preserved when parsed; the first attempt predates raw-response tracing and has diagnostics only.

feasibility.mjs derives source references with file/line/quote/hash from fixed repository files and the actual compiled ActionRecorder ABI. It reuses src/analysis prepare/generate/evaluate and existing fixed compilation. Input digests, current compilation/base identity, role, function, original inputs, bounded values, rule/profile/layout, explicit virtual sender/payer/target/nonce, prerequisites, execution mode, write prohibition and semantic duplicates are checked independently. Source references supplied by a model are fixed fact IDs, never filesystem paths or commands. Model approval cannot override a deterministic veto; disagreements are recorded. Unknown runtime funding/stake/nonce/deployment is conditional, not a contract failure. Current executor modes require no live balances. Arbitrary Solidity and storage/live tools remain unsupported.

Each model-deferred/rejected case stays in rejectedDeferred and proposals, with reasons and outcomes. At most one repair per proposal is supported; the shared six-call budget permits at most one overall repair plus revalidation and Critic. Other rejected cases remain deferred rather than entering an endless loop. Original and revision are separate trace records. Only executable identities reserve deduplication slots, so invalid input cannot poison a legitimate repair. Duplicate IDs are rejected at schema orchestration; semantically identical distinct IDs cannot execute twice.

outcome.mjs keeps expected and observed independently: PASS, XFAIL, XPASS, FAIL, INCONCLUSIVE, SKIPPED_INVALID, BLOCKED_PRECONDITION, UNSUPPORTED; duplicates additionally use SKIPPED_DUPLICATE. No observation means no PASS/XFAIL/XPASS/FAIL. Policy results are PREDICTED with observedVerdict=null. Offline ACCEPT/REJECT means owner recovered/not recovered, never admission. XPASS/FAIL are investigation candidates; verifiedVulnerability stays false. A Critic may request one fresh-process replay of an executed authorization descriptor; unavailable IDs and mode escalation are refused. Reproduction uses the same implementation in a fresh process, not an independent client implementation.

## Real paid demonstration and actual limitations

All captures are additive in evidence/investigator/2026-11-06/; feasibility-manifest.json records SHA256 and usage for every attempt. Original sonnet-retry-2.json and historical chain evidence are unchanged.

- feasibility-sonnet.json: 1 request,0 validated, $0.01436589. Scout structured-string validation failed; no proposals/tools. Raw failed response was not retained in this first attempt.
- feasibility-sonnet-2.json: 5 requests,4 validated, $0.07489449. Genuine model proposals used wrong rule identifiers/roles and a runtime nonce dependency. Deterministic gates overrode model EXECUTABLE recommendations; repair did not resolve the rule mismatch. The final Validator response exceeded the then600-character limit (692). No tool executed.
- feasibility-sonnet-3.json: 1 request,0 validated, $0.01723194. Scout cited all11 actual supplied facts; schema's then8-item limit rejected it. No tools. Citation bound was corrected to16.
- feasibility-sonnet-4.json: COMPLETE_OFFLINE_INVESTIGATION. 4 genuine validated Sonnet4.6 calls: Scout, Mutation, Validator, Critic. $0.087021 reported. Two distinct generated proposals and two actual local tool evaluations. One fresh-process crypto reproduction.

Cumulative: 11 actual requests, $0.19351332 provider-reported cost, no missing-cost requests, below user-authorized $0.50. Budgets reserved before requests; failed billable usage remains counted. No additional paid calls are needed or running.

Successful candidate mut-unsafe-param-change-001: record(1,10) → record(1,99). Model expected unsafe REJECT and safe UNKNOWN. Actual recovery: unsafe=true, safe=false; same witness and target retained, canonical transaction hash changed. Outcomes: unsafe XPASS candidate; safe INCONCLUSIVE because expectation UNKNOWN. Critic received these actual results, changed its assessment to discuss XPASS/unknown evidence, and requested reproduction. Fresh process matched. This is an intentionally unsafe local fixture and incorrect model expectation, not a discovered protocol vulnerability. The Critic's suggestions about freshly signed hashes are model speculation, not established facts: the existing tool retains the original witness and unsafe authorization hash is distinct from the canonical transaction hash. These statements are preserved and labeled as model reasoning.

Successful candidate mut-gas-above-cap-001: verificationGasLimit50000 →67201. Computed budget67201+30000+2800=100001 >100000. Intentional negative retained and evaluated by the actual existing policy engine. Expected REJECT; observedVerdict=null; PREDICTED, never XFAIL. No mempool request occurred.

Both final proposals were feasible; the LLM did not reject one in the successful run. We did not fabricate an impossible candidate. Deterministic tests demonstrate actual invalid ABI/role/profile, missing funding, deduplication, incorrect Validator recommendation override and feedback-conditioned repair. Earlier paid proposals also demonstrate deterministic vetoes. Real-run XFAIL is not claimed; XFAIL is covered with actual local cryptographic observations under mocked model transport. The saved fourth capture retains a legacy hypothesis compatibility placeholder for UNKNOWN; its authoritative candidate.expectedVerdict and outcomes remain UNKNOWN/INCONCLUSIVE. New runs keep UNKNOWN in the public compatibility wrapper too.

## UI and reproduction

Existing Swarm Lab now renders actual role responses, Validator reasoning, source citations, deterministic gates, execution/defer/reject state, expected/observed outcomes, provenance/confidence, Critic and reproduction. Filters: all, executed, expected rejections, unexpected, invalid/filtered, missing prerequisites. Legacy saved and explicitly simulated reports remain viewable. No generic Contract Playground upload/compiler was added. The saved fourth run is digest-checked and restored alongside the original Sonnet run, not substituted for a new investigation.

Key-free saved view:
node bin/framefuzz.mjs saved-demo --results runs/agentic-demo --port 4195
Swarm Lab → newest saved investigation → Load. Provider and chain controls remain disabled. Export investigation includes candidates, raw role responses, outcomes, tool observations, gas semantic reproduction spec and crypto descriptors. Export replay descriptors includes authorization descriptors only; gas reproduction uses evaluateSemanticTest on predictions[0].result.reproduction.test with POLICY_PREDICTION.

Fresh offline replay:
$env:FRAMEFUZZ_SWARM='on'
node bin/framefuzz.mjs swarm replay evidence/investigator/2026-11-06/feasibility-sonnet-4.json --variant 0 --output runs/agentic-replay.json

A future paid investigation requires deliberate CLI --mode openrouter selection or UI consent. Default provider ceilings:6 calls,60000 accounted tokens,2000 output tokens,24000 input bytes,45s request timeout,$0.50. The one-shot scripts/agentic-demo.mjs refuses existing captures and tracks cumulative prior costs. Do not rerun the paid demonstration automatically.

## Verification

Baseline checkpoint158 tests; final164 pass,0 fail/skip. npm test exit0; runs/agentic-final-tests.txt. Focused node --test test/agentic.test.mjs test/investigator.test.mjs before the final duplicate test:15 passed,exit0. Tests use mocked provider transport/local HTTP only, no paid calls or chain writes. Existing provider tests retain call/token/cost/timeout and credential-redaction coverage. New coverage includes malformed real-role responses, missing-key no-fallback, wrong functions/roles, stale source identity, conditional funding, intentional negatives, model/deterministic disagreement, one feedback repair, actual changed ABI values, repeated semantic deduplication and actual Critic observations. Gas integration produces PREDICTED with no observed admission.

Actual IAB browser: port4195, Swarm Lab → newest saved run → Load. Both candidates, real4-call usage, XPASS/local recovery, gas PREDICTED/observed NONE, Critic and replay were displayed. Unexpected filter removed the gas case and retained the local XPASS. The browser automation reported a select-retention error during DOM replacement, but the subsequent observed state confirmed the requested filter and result. Other filters are implemented; do not claim every filter was individually browser-tested. JSON/regression exports and key-free saved routes are covered by local HTTP tests.

No deployment, funding, signed broadcast, Arkiv publication or push. No current EIP-8141 action execution. Historical receipt provenance remains separate. Remaining limits are compatible live runtime/action evidence and arbitrary-contract support, not hidden behind model prose.

Additional executed checks: npm run verify exit0 (75 modules and generated facts); npm run run:preview exit0 (existing seven unsigned variants); node scripts/live-evidence.mjs --check exit0; fresh CLI swarm replay of feasibility-sonnet-4.json variant0 exit0 (sourceHashesVerified=true, equivalentSemanticProperties=true, fresh PID26524); git diff --exit-code 1be0864 -- evidence contracts rules vendor exit0 before staging additive captures, proving original tracked bytes unchanged. No dependency changes.
