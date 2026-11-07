# FrameFuzz — canonical current capabilities

This is the current product status. Dated milestone reports and captures are historical observations, not current endpoint guarantees. `CURRENT_STATUS.md` records the latest executed verification; `TEST_CHECKPOINT.json` is the explicit Node-test checkpoint used by the briefing. The Pass0/1 report remains a historical sprint snapshot; Pass2 dispositions are in PASS2_REPORT.md.

## Offline without keys

Seeded gas/storage mutation generation, unsigned previews, semantic-only replay, evidence exports, historical report inspection and the full local Node suite work without a wallet or devnet. Swarm is disabled by default. Saved-demo permits restored genuine Sonnet transcript viewing without opting in; opting in enables offline compilation/replay; saved-demo prohibits new provider requests even if a key happens to exist in the environment.

```powershell
npm ci
npm test
npm run verify
npm run run:preview
node bin/framefuzz.mjs saved-demo --results runs/demo --port 4192
```

Open http://127.0.0.1:4192. If the port is occupied, choose another local port. No `.env`, key or RPC is needed. `npm ci` initially downloads pinned dependencies; after installation the demonstration is local.

Show gas/Uniswap captures in Evidence Explorer; inspect JSON, Markdown and replay. In Arkiv Registry, choose **Inspect saved registry snapshots**. These are two historical publications, with current validity UNKNOWN and fresh import disabled. **Open saved imported PREVIEW** opens an already saved report; it does not regenerate an expired record or claim a fresh query. Swarm Lab → newest saved investigation shows the genuine feasibility-gated run: four actual role calls, one cryptographic experiment and one gas-policy evaluation, with one fresh-process replay. The older four-response/two-experiment investigation remains separately selectable. Technical Briefing → Present to EF uses the same evidence-derived facts.

## Historical live evidence

- Gas: seven generated variants,14 observed admission decisions,14 matches and eight included-success receipts. No new campaign was executed in either completion sprint.
- Uniswap: real validation-time StateView.getSlot0 read. Basic sponsorship accepted on both paths; unstaked read rejected on both; staked read rejected publicly and accepted alternatively with historical inclusion. Intended policy differences are PASS, not vulnerabilities. Captured pool state was uninitialized; no swap or USDC reimbursement exists.
- Arkiv: two successful historical Rabdi publications, one demonstrated publisher. Full reports remain offchain in Git; portable descriptors and selected summaries/digests are onchain. Neither wallet ownership nor a digest proves publisher outcome truth.
- Sonnet: four real validated responses in the successful saved run, record(1,20) then record(2,10), actual local ECDSA behavior and fresh-process reproduction. This is OFFLINE_SIGNATURE_BINDING, not EVM execution or a protocol finding.

Canonical file/hash references are in LIVE_EVIDENCE.md and the generated briefing facts. Historical captures remain unchanged.

## Current reads and conditional live execution

Normal `serve` enables Arkiv public reads/import without a signing wallet:

```powershell
node bin/framefuzz.mjs serve --results runs/registry --port 4193
node bin/framefuzz.mjs arkiv query --suite verification-gas --rule MAX_VERIFY_GAS
```

Pass2 freshly queried Rabdi and completed the premium UI Query → Select → Verify → Import unsigned PREVIEW → Inspect journey. Entity `0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1` was active at the observed blocks; availability and expiry can change. Query is bounded to20, with explicit possible-truncation notice. All imports recheck current chain expiry and regenerate unsigned semantics at UNKNOWN confidence. No new entity was published. No writer key is distributed or required for reading.

A new EIP-8141 campaign additionally requires compatible client/gateway, valid sponsor bytecode/funding/stake, exact allowlisted chain 1337 and endpoints, isolated sender/nonce state, grounded rules, a bounded request budget and separate authorization. Existing adapter/campaign paths can execute under those conditions; those conditions are not currently established by historical success. `--submit` is never part of this demo. Chain-ID matching alone does not prove mining/funding/write health. Generic execution is restricted to1337/31337; Arkiv's separate SDK uses Rabdi7794095.

## Owned-validator experiment

Sponsored `swarm sponsored-plan` is a deterministic offline preparation workflow with constructor/init-code digests, conditional CREATE predictions, dependencies and0.064 test-ETH fee cap excluding unresolved sponsor funding. It accepts no keys/RPC. See SPONSORED_PREPARATION.md. The self-funded candidate is separate and remains PLAUSIBLE_UNVERIFIED; its proposed0.066 funding envelope is not authorization.

Raw action ingestion checks a candidate receipt/log/state bundle conservatively. Its output always keeps actionEvidenceVerified=false and liveVerified=false. See RAW_ACTION_PROOF.md. There is no actual owned-validator execution, canonical action-proof collector or independent live reproduction. No live deployment/funding/signing request is pending approval in this sprint.

## Verification limits and human delivery

Node tests include real offline crypto/compiler work, mocked transports and constructed raw-proof adversarial cases. There is no automated browser-engine suite, EVM execution suite or fresh blockchain-write test. Real browser interactions and375/768/1440px layout checks are recorded separately in PASS2_REPORT.md; they are not a physical-device/screen-reader certification. Briefing facts are regenerated from canonical captures and the explicit test checkpoint; consistency tests detect drift.

After an actual full-suite pass, update TEST_CHECKPOINT.json with observed counts/date, run `node scripts/briefing-facts.mjs`, then `npm run verify`. Do not estimate counts from source files. Generated JavaScript checks tolerate checkout CRLF; historical capture digests always use original bytes.

Public GitHub access, authorized push, video recording/upload, ETHGlobal submission and Uniswap feedback confirmation remain human actions. Pass2 anonymous repository/branch GETs returned404; that does not identify the repository's exact visibility setting. No video/submission ID is claimed. See DELIVERY_PASS2.md and DEMO_90_SECONDS.md. No public delivery or live write has been performed in this sprint.

## Internal foundation checkpoint

164 passing Node tests. src/analysis exposes versioned ContractInput/AnalysisContext/SemanticTest/AnalysisResult and prepare → generate → evaluate for existing gas-policy and owned offline crypto fixtures. Ordinary contracts return UNVERIFIED prerequisites. No Playground UI, arbitrary-source HTTP compilation or new live support. Exact scope: [foundation](CONTRACT_ANALYSIS_FOUNDATION.md); executed checks: [stability report](STABILITY_FOUNDATION_REPORT.md).

## Genuine feasibility-gated investigator

Real mode now invokes distinct Scout, Mutation, Validator and Critic calls to one role-conditioned Sonnet model. Deterministic feasibility guards can veto model approvals; rejected/deferred cases and one bounded repair remain in the trace. Local outcome classifications preserve expected/observed separation and never promote predictions to PASS/XFAIL. The completed genuine demo and11-call cumulative cost ($0.19351332), source/provenance limits and UI behavior are documented in [AGENTIC_FEASIBILITY.md](AGENTIC_FEASIBILITY.md). No live validator action, arbitrary Solidity execution or security finding is established.
