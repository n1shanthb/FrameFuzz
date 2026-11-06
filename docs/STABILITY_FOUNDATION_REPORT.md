# Stability and internal contract-analysis foundation — 2026-11-06

Baseline: b48d9fc, 147 tests; clean feat/framefuzz-mvp. Implementation adds 11 tests, preserving original evidence, contracts, rules and vendor bytes. Current checkpoint: 158 tests pass. No Playground page, arbitrary-source HTTP route or arbitrary compiler was added.

Stability fixes: saved-demo transcript reads no longer require execution opt-in; malformed API objects/unknown fields/invalid IDs return bounded structured errors; Registry query/detail/import have a server read deadline; late imports cannot save previews; origin checks include null origins; generic submission batches are capped at 14 paths before RPC/signing. Read/export adds evidence classifications without rewriting captures. SDK reads already started may finish after the HTTP deadline; no automatic retry or publication follows.

Internal service implementation and fixture proof are in docs/CONTRACT_ANALYSIS_FOUNDATION.md. No current validator EVM action proof exists. Unsupported ordinary contracts remain UNVERIFIED. This is a supported-fixture foundation, not universal Solidity analysis.

Verification commands and observed results:
- npm test (baseline): exit 0, 147 passed, zero failures/skips; runs/foundation-baseline-tests.txt.
- node --test test/stability.test.mjs test/cli.test.mjs test/dashboard.test.mjs test/pass2-registry.test.mjs test/saved-demo.test.mjs: exit 0, 11 passed.
- node --test test/analysis.test.mjs test/stability.test.mjs initially in restricted sandbox: exit 1 because three localhost fetch tests could not connect; eight passed. Full suite with localhost permission subsequently passes.
- npm test: exit 0, 158 passed, zero failures/skips; runs/foundation-full-tests.txt (24.27 seconds).
- npm run verify: exit 0, 69 modules and generated briefing facts verified.
- npm run run:preview: exit 0, seven unsigned variants; runs/foundation-cli-preview.txt.
- node scripts/live-evidence.mjs --check: exit 0, committed guide matches.
- FRAMEFUZZ_SWARM=on node scripts/analysis-fixtures.mjs (PowerShell environment assignment): exit 0; actual recomputed results in ignored runs/foundation-fixtures.json.
- node bin/framefuzz.mjs saved-demo --results runs/foundation-demo --port 4194: startup successful, live submission DISABLED. Real IAB browser inspected Overview, Swarm Lab load, Evidence Explorer historical case and imported PREVIEW. Four historical model calls/two original mutations shown; new provider/simulation controls disabled. DOM doubles in automated tests are separate from this browser inspection. Browser export links verified visually; export contents covered by HTTP tests.
- git diff --exit-code b48d9fc -- evidence contracts rules vendor: exit 0, originals unchanged.

No paid model call, external chain RPC, deployment, funding, broadcast, Arkiv publication, push or form submission occurred. Root .env was not loaded. Compilation and ECDSA used existing owned fixture code and ephemeral local witnesses. Read-only remote branch lookup and dependency advisory lookup are infrastructure checks only.

Outstanding boundaries: current rule/client/runtime hash validation, owned validator action execution and independent live reproduction still need separately authorized compatible runtime and funding. Local future UI work needs explicit input/context/prerequisite presentation and schema evolution. Arbitrary sources need a distinct sandbox/compiler/threat model; ABI metadata does not prove validator behavior. Do not start that work automatically.

- npm audit --omit=dev --audit-level=high: exit 0, found 0 vulnerabilities; runs/foundation-audit.txt.
