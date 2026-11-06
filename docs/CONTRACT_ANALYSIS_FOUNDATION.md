# Internal contract-analysis foundation

No new Playground UI or HTTP endpoint. Import src/analysis/service.mjs internally. Sequence: prepareContractAnalysis(input, context), generateSemanticTests(prepared, options), evaluateSemanticTest(spec, explicitMode). Unsupported inputs use analysisResult(prepared) with actual=null and prerequisites; generation rejects unsupported capabilities rather than fabricating cases.

## Versioned boundaries

ContractInput (framefuzz.contract-input.v1): SOLIDITY_SOURCE with bounded source/fileId label, ABI metadata, or DEPLOYED address plus chain ID. Optional ABI, compiler metadata, declared role and provenance. Roles: SENDER_VALIDATOR, PAYMASTER, EXECUTION_TARGET, EXTERNAL_POLICY_DEPENDENCY, UNKNOWN. Source content/ABI/deployment/compiler define contentDigest; filename and role do not prove behavior. 64 KiB source, 32 KiB ABI/256 entries; JSON/depth/node limits; no credential fields, cycles or prototype keys. File IDs and descriptive references are never resolved.

AnalysisContext (framefuzz.analysis-context.v1): optional explicit profile, chain/path/client commit, credential-free endpoint identity, frame layout, sender/payer/target/nonce, gas components and deployment/funding/staking assumptions. Omitted fields stay unknown. Supplied frame targets or offline executor account overrides are unsupported rather than ignored. supportedContext() explicitly selects the existing chain1337 workshop profile; this is not an implicit model default or execution authorization.

SemanticTest (framefuzz.semantic-test.v1): existing descriptor nested unchanged, original/modified inputs, role/family/rule/profile, seed, expected observation, execution method, prerequisites, evidence requirements, contract/context digests and descriptorHash. Evaluation regenerates the entire specification and rejects rehashed semantic tampering. Only POLICY_PREDICTION and OFFLINE_EXECUTED are executable here.

AnalysisResult (framefuzz.analysis-result.v1): classification, contract/profile/rule/context, mutation, expected versus actual, provenance, confidence, prerequisites, reproduction and explicit zero-write execution counters. Predictions/UNVERIFIED have actual=null. Offline crypto cannot claim admission, transaction hashes or action proof. Fixed capture adapter produces HISTORICAL_LIVE separately. CURRENT_LIVE is refused. Normalization is structural validation, not authentication of arbitrary third-party provenance claims.

## Actual reuse and dependency map

Gas: CLI mutate / HTTP mutate -> mutations/campaign.loadMutationDefinition -> generator.generateMutations/regenerateMutation -> existing oracle. Foundation uses the same definition and unsigned models, but never invokes campaign live execution. Policy evidence is read only through fixed trusted local rules. Historical capture uses its existing Arkiv publication SHA256 to verify bytes. No user evidence reference becomes a file read.

Authorization: saved Sonnet descriptor -> mutations/frames.replayFrameMutation/generateFrameMutation -> swarm/compile.compileOwnedFixtures -> swarm/experiment.executeMutation -> real ECDSA recovery. Foundation canonical comparisons reuse adapters/sender-validator.unsignedValidatorTransaction and swarm/signatures.workshopSigningHash. OFFLINE_CONTEXT exposes the existing fixed virtual accounts; no signer implementation was duplicated. Compilation remains restricted to the repository's unsafe/safe/base/recorder fixtures. Exact full source digest, not filename, unlocks this adapter. Both owner-binding outcomes are measured; no EVM action is executed.

Existing live boundary remains runner.runSuite/adapters/workshop-live with chain/endpoint/nonce/funding/signing gates. Foundation does not import an adapter dispatcher, RPC, OpenRouter or Arkiv SDK. UI and legacy CLI keep their existing descriptors and URLs. Reports gain additive evidence classifications only. Initial intended consumers are internal fixture tests and scripts/analysis-fixtures.mjs; no general upload route exists.

## Three executed demonstrations

Run in PowerShell: $env:FRAMEFUZZ_SWARM='on'; node scripts/analysis-fixtures.mjs
Output is ignored runs/foundation-fixtures.json; public fixture source only. No root .env required.

1. Historical gas case0, seed42: verificationGasLimit=67198, boundary67200, offset=-2. Existing v1 descriptor retained. Fresh result POLICY_PREDICTION, actual=null. Separate digest-verified HISTORICAL_LIVE observation: public accepted, alt accepted, captured receipts preserved. Source: evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json. A gas-budget prediction does not execute arbitrary paymaster code.
2. Actual Sonnet proposal record(2,10), original record(1,10), existing v2 descriptor. Source: evidence/investigator/2026-11-06/sonnet-retry-2.json, verified against sonnet-manifest.json and current compiled fixture input digest. New OFFLINE_EXECUTED recovery: unsafe authorized=true/tampered=true; safe authorized=true/tampered=false. Same witness and target in each pair; canonical hash changes for both. Unsafe hashes original 0x695067a5c0708a988a99e6b4ddd8dd408611fb376102a3161ff76ffc799997f2, modified 0x8a7b318a17922392f798e610360424940fe5f4528b817e9edbd38fd210b72841. Safe original 0x63ab1d9448122e377e888cb3e0dae40e0d36b9b9381f73b4e8eff43cac7b3181, modified 0x085a6b971a308100e7434f282d3ba301a9a0334928770bccb1d83796f70de609. New tests independently evaluate again and evaluate record(3,11), whose modified hash differs. No timestamps, random signatures or fake transaction hashes enter deterministic normalized results. Historical model provenance and new offline observations remain distinct.
3. Ordinary Counter.sol: UNVERIFIED, actual=null; no inferred validation role. Missing VALIDATION_ROLE_OR_INTEGRATION, SUPPORTED_WORKSHOP_PROFILE, SUPPORTED_CHAIN_1337, SUPPORTED_THREE_FRAME_LAYOUT. No source compilation, fabricated mutation success or chain query.

## Limits before UI

Local: explicit input/context selection and prerequisite UX, schema migration and more supported adapters would be separate work. Runtime: canonical signing hash is verified against the pinned source/vector only; runtime compatibility, funding/stake, admission and owned-validator action receipts remain unverified. Universal analysis: arbitrary Solidity compilation, inheritance/dependency resolution, role inference and general behavioral execution require a new security design. This internal boundary intentionally makes no such claim.
