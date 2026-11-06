# Repository completion sprint — Pass 0 and Pass 1

Baseline: audit at `0a503f9`, 107 passing tests. Branch `feat/framefuzz-mvp`.
This pass makes no new external execution, paid model call, deployment, funding, publication or push claim. Historical evidence, Solidity fixtures and rule digests are unchanged.

## Pass 0

- A16 FIXED: generic LIVE scenarios choose raw public submission and structured alternative submission. The regression composes `createScenarioCases`, `createAdapter`, the actual workshop plugin and `runSuite`, with transport mocked at the RPC boundary. Six independently signed calls reach their intended methods. This verifies composition, not fresh devnet admission.
- G3 FIXED: `npm run run:preview` generates seven unsigned gas variants locally, with zero submissions and no credential requirement. CLI smoke test executes the package script's actual arguments.
- Full suite after Pass 0: 109 passing, zero failed/skipped.

## All 24 originally limited items

P = PROMOTED_TO_FULL; I = IMPROVED_STILL_LIMITED; D = DEFERRED_EXTERNAL_OR_SCOPE. D items retain their original limited classification; no implementation completion is implied. FULL applies only to the explicit supported scope below.

| Audit ID | Original limitation | Change made | Verification | New status | Remaining blocker |
|---|---|---|---|---|---|
| A3 | Bounded operation/parameter mutations | Retain explicit offline bounded scope; no new mutation dimensions | Existing frame/investigator ECDSA and tamper tests | D | Broader mutations/EVM execution are separate scope |
| A5 | Signed historical bytes can be stale | Label signed history; separate unsigned semantic projection, preview command and historical outcomes; CLI consumes semantic-only export | CLI removes all legacy reproduction/paths and regenerates same variant with zero submissions | I | Legacy history retained for compatibility; fresh live reproduction needs viable state/signing |
| A6 | Method composition and fixture viability | Fix generic method contract through real adapter composition | Six mocked-final-transport signed submissions; existing generated campaigns preserved | I | Fresh sponsor and gateway viability unverified |
| A7 | Pinned codec differs from latest draft | Preserve exact versioned profile and golden vectors; no compatibility shortcut | Existing encoding, signing, readiness/source-vector tests | D | Running-client/draft compatibility requires external verification |
| A8 | Narrow rules and no binary attestation | Retain provenance/confidence downgrades and bounded rule scope | Existing drift, rule oracle and policy-difference tests | D | No deployed sidecar binary attestation or broader rule evidence |
| A9 | Incomplete regex diagnostics | Classify wrapped funding/nonce before generic invalid-params; keep unknown diagnostics without string truncation | New wrapped-error, long diagnostic and inconclusive-precondition assertions | I | Unknown policy formats still require reviewed classifiers |
| A10 | No action-event/state verifier | Separate outer inclusion, per-frame status, absent action proof and check time; receipt refresh retains original receipt and appends observations | Mixed successful/reverted/unknown frames, mismatch and refresh tests | I | No raw action-event/state proof collector; no reorg attestation |
| A11 | Sidecar build commit unknown | Preserve advertised versions versus attested source distinction | Existing source/provenance and evidence-digest tests | D | Operator binary/build attestation |
| A12 | Generic guard accepted other production IDs | Explicit execution chain IDs1337/31337; adapter guard before keys/setup; reserve CLI requires --submit --allow-chain1337 | Production/unapproved ID refusals, no-key deploy refusal and existing budget tests | I | RPC identities still trusted; generic fixtures lack aggregate fee/request budgets |
| A13 | Missing visible coverage; library-only shrinking | Render report-derived regions/confidence/counts and actual shrink metadata; explain bounded explicit library shrink scope | Actual browser historical/preview coverage, SPA behavioral assertion, existing minimizer tests | P | No automatic network or UI-triggered shrinking is supported |
| B4 | Saved pool zero/uninitialized | Preserve code/manager/pool inspection with no active-price/trade claim | Existing Uniswap inspection/binding tests and immutable captures | D | Initialized suitable live pool and new chain evidence |
| C7 | No pagination or outside adoption proof | Enforce 1–20 bounded discovery; expose returned count, possible truncation and refine-filter notice | Limit-one/limit-twenty and SDK mock-transport tests | I | No pagination/completeness guarantee; one demonstrated publisher |
| C8 | Full reports offchain; digest not resolver | Document fixture payload versus offchain evidence boundary | Existing sanitized projection, schema/digest tests and historical publication evidence | D | Evidence hosting/resolution is separate architecture scope |
| D2 | One model in three sequential perspectives | Keep accurate single-model, three-perspective presentation | Existing mocked loop and preserved four-response Sonnet capture | D | Separate autonomous agents not part of supported design |
| D7 | Fresh process shares implementation assumptions | Bind worker-reported PID to spawned PID; record parent/worker/transport/scope; compare semantic properties independent of object key order | Actual spawned-process replay, reordered semantics and provenance-tampering tests | I | Same JS codec/algorithm; no independent EVM verifier |
| D8 | Saved-demo omitted Sonnet transcript | Restore exact committed report into saved investigation directory; no key required | Fresh server HTTP transcript/config and browser load with four real historical calls/two experiments | P | Scope is saved evidence viewing/export; new provider requests require normal mode/credentials |
| D11 | Per-run client budgets, no global spend quota | Preserve explicit provider consent and bounded run restrictions; document quota boundary | Existing reservation, timeout, disabled-default and provider gate tests | D | Cross-process/global billing quota is separate provider/operator scope |
| E4 | Offline self-funded fixtures, runtime unverified | Preserve isolated profile, original descriptor and funding caps; no execution expansion | Existing self-funded compilation/signing/oracle preparation tests | D | Funded owned contexts, runtime helpers/hash, separate approval and actual execution |
| F2 | Stale counts/status constants | Update checkpoint count and real Sonnet status; correct stale preflight wording | Browser Overview and saved evidence; 119-test suite | I | Curated briefing constants are not a dynamically generated attestation |
| F3 | Inputs reset and chain-only gateway readiness | Persist campaign/community input values through rerenders; explicit chain_verified/writeHealth unverified response | Browser seed123 preview/retention, SPA input test and localhost API test | I | Fresh live run unavailable; no mining/funding/write-health proof |
| F4 | Mouse-only rows and hidden filtered selection | Keyboard Enter/Space row selection; detail follows filtered rows or clears; include infrastructure/transport filters | Actual browser keyboard invocation; real SPA filter/selection tests; existing JSON/Markdown/replay HTTP tests | P | Supported scope is saved report inspection/export, not action-proof verification |
| F7 | Presentation input handling/checklist reset | Editable fields/modifier shortcuts retain navigation keys; checklist survives rerenders; existing session notes kept | SPA key handler test; actual browser Next/Escape and checked item after navigation | P | Checklist is session-local and clears on full page reload |
| F9 | Three reports only and external font request | Restore real Sonnet report; remove Google Fonts import and use existing fallbacks | Fresh offline server/browser without key; network-route refusal tests; local CSS served | P | Scope is historical viewing and unsigned preview; no current network assertion |
| G2 | No repeatable syntax/build check | Add network-free npm run verify for all57 source modules; retain pinned dependency audit | 57 syntax checks; read-only npm audit returns zero known vulnerabilities | I | Node20 runtime matrix/type/lint/CI not added or exercised |

Five promotions, ten substantive improvements still limited, nine deferred. Both broken items become FULL in their supported scopes.

## Taxonomy reconciliation

Of the original65 items: FULL27, FUNCTIONAL WITH LIMITATIONS19, PARTIAL7, BROKEN0, BLOCKED EXTERNALLY3, SCAFFOLD/MOCK1, DEAD WEIGHT1, NOT IMPLEMENTED7.

Arithmetic: original FULL19 + two repaired broken workflows + five promoted limited workflows + F5 visible coverage =27. F5 was originally NOT IMPLEMENTED and is now FULL for displaying generated report coverage, implemented as the explicitly requested A13 improvement. It is not counted as an extra limited promotion. All seven PARTIAL items retain their classifications; overlapping copy/accessibility fixes do not complete those broader features. G7 remains DEAD WEIGHT: unused state was removed, but compatibility markers/bootstrap still exist. No category is silently dropped.

## Verification and boundaries

- `npm test`: 119 passed, zero failed/skipped; all107 baseline tests retained. Loopback permission needed for local fake RPC/dashboard servers. Initial restricted run failed local transport, then passed with loopback access.
- `node --test test/sprint-reliability.test.mjs test/workshop-live.test.mjs test/ui-behavior.test.mjs`:17 pass after receipt-history refinement.
- `node --test test/mutation-integration.test.mjs`:5 pass, including semantic-only export → CLI unsigned preview.
- `npm run verify`:57 JavaScript modules checked, no network or writes.
- `npm audit --package-lock-only --ignore-scripts --json`: exit0, zero known vulnerabilities; first restricted attempt failed DNS, permitted read-only retry succeeded. No dependency install/update.
- `node scripts/live-evidence.mjs --check`: committed guide matches.
- `npm run run:preview`: exit0;7 unsigned variants/14 prospective decisions/0 submissions, saved under ignored runs/. Expectations are not observed matches.
- `$env:FRAMEFUZZ_SWARM='on'; node bin/framefuzz.mjs saved-demo --results runs/sprint-saved-demo --port 4191`: fresh process, submission disabled, no key loaded. Browser preview seed123, real coverage, keyboard row action, saved Sonnet load, presentation Next/Escape, checklist retention verified. Screenshot at ignored `runs/sprint-saved-demo/browser-sonnet.png`.
- Five new automated SPA behavior tests execute actual functions with minimal DOM doubles. **No browser-engine automation suite was added.** Manual real-browser checks are separate; no real external chain/registry/model call was used for these checks.

No owned-validator action evidence, new receipt, Arkiv publication, adopted external publisher, new sponsor viability or current devnet health is claimed. Unknown diagnostics remain unknown. Historical receipts and newly checked receipt observations are separate. Aggregate budgets for arbitrary generic fixtures, runtime/binary attestation and trusted RPC identity remain limitations.

## Next action

STOP after Pass1. The seven PARTIAL features require the user's next instruction. Deployment, funding, live submission, paid provider requests, Arkiv writes and pushing remain separately gated. See Git history for coherent checkpoint commit subjects/hashes. Public delivery/video/forms remain pending; this sprint does not authorize them.

## Exact changed paths

- `BUILD_STATUS.md`
- `CURRENT_STATUS.md`
- `README.md`
- `UP_NEXT.md`
- `bin/deploy-reserve.mjs`
- `bin/framefuzz.mjs`
- `docs/COMPLETION_SPRINT.md`
- `package.json`
- `scripts/verify-local.mjs`
- `src/adapters/index.mjs`
- `src/arkiv/registry.mjs`
- `src/refresh.mjs`
- `src/reports.mjs`
- `src/rpc.mjs`
- `src/safety.mjs`
- `src/saved-demo.mjs`
- `src/scenarios.mjs`
- `src/server.mjs`
- `src/swarm/experiment.mjs`
- `src/swarm/replay.mjs`
- `src/verdict.mjs`
- `test/arkiv.test.mjs`
- `test/cli.test.mjs`
- `test/investigator.test.mjs`
- `test/mutation-integration.test.mjs`
- `test/saved-demo.test.mjs`
- `test/sprint-reliability.test.mjs`
- `test/ui-behavior.test.mjs`
- `test/workshop-live.test.mjs`
- `web/css/app.css`
- `web/js/api.js`
- `web/js/app.js`
- `web/js/briefing.js`

## Implementation checkpoints

- `84ea493` fix: preserve dashboard state and show evidence-backed coverage
- `3eaaf77` fix: restore Sonnet demo and bind replay process provenance
- `ef95082` fix: disclose bounded registry discovery results
- `4f36a0f` fix: replay unsigned semantic exports directly
- `cfed867` fix: harden execution gates and preserve evidence boundaries
- `ce1898f` fix: repair live scenario routing and offline preview

The final documentation/verification checkpoint is the following commit in Git history; no self-referential hash is embedded here.
