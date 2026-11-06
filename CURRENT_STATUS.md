# Current status — stability and internal foundation complete

Canonical product truth: docs/CURRENT_CAPABILITIES.md. Latest implemented boundary: docs/CONTRACT_ANALYSIS_FOUNDATION.md. Verification: docs/STABILITY_FOUNDATION_REPORT.md. Baseline b48d9fc had147 passing tests; now158 pass,0 fail/skip;69 JS modules verify. Git history records coherent local stability/foundation commits. No push.

Internal prepare/generate/evaluate service reuses v1 gas descriptors and v2 owned authorization descriptors. Executed gas case67198: new prediction actual=null, historical public/alt accepted stored separately. Original Sonnet record(2,10) recomputed with real ECDSA: unsafe owner recovered after tampering=true, safe=false. Ordinary Counter remains UNVERIFIED with explicit prerequisites. No arbitrary Solidity compilation or Playground UI.

Real browser at http://127.0.0.1:4194 inspected saved Overview, default-off saved Sonnet load, historical gas detail and imported unsigned PREVIEW. New provider/simulation actions disabled. Server process is local saved-demo; restart: node bin/framefuzz.mjs saved-demo --results runs/foundation-demo --port 4194. No .env required.

STABLE_WITH_LIMITATIONS: current runtime signing hash/client compatibility, owned-validator EVM action execution and independent live proof remain unverified. Deadline errors are infrastructure, not admission-rule rejection. SDK read already in flight may continue after UI/HTTP deadline; no late preview is saved. No universal contract behavioral analysis. Historical evidence/contracts/rules/vendor unchanged against b48d9fc.

Remote read-only observed b15df81376664baaeaf426086c5a1a2683f8be4d; See git rev-list for authoritative divergence rather than a stale count. No paid model call, chain RPC/write, deployment, funding, Arkiv publication, push or form submission this sprint. Read-only Git/advisory infrastructure checks only. Existing Pass2 E7/G6 blockers remain.
