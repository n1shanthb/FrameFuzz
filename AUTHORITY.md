# FrameFuzz project authority

## Purpose and precedence
FrameFuzz is an admission-rule mutation and compatibility testing lab for EIP-8141 frame transactions. The flagship scenario is a Uniswap v4-aware gas sponsor/paymaster.

Current explicit user instructions take precedence. `docs/BUILD_BRIEF.md` preserves the full supplied product brief and acceptance criteria. `AGENTS.md` governs repository workflow; this document records durable scope and decisions. `CURRENT_STATUS.md` records observations; `UP_NEXT.md` records planned work. Source, executed tests, and saved evidence determine what actually works. Resolve discrepancies explicitly instead of turning plans into completion claims.

Deadline supplied in the brief: **November 7, 2026, 09:00 IST**. Do not infer endpoint availability from historical notes.

## Acceptance gate
A developer can run a real signed EIP-8141 admission test, compare expected and observed policy, distinguish admission from execution, and export reproducible evidence. If signer artifacts are unavailable, deliver tested adapter/runner infrastructure and list exact missing inputs; mocked output cannot satisfy the live gate.

## Implementation order
1. Stabilize the existing starter and retain working components.
2. Add a real adapter interface with fresh signatures, nonce/sender management, per-path RPC selection, replay metadata, and scenario setup hooks.
3. Integrate available known-good workshop/PoC code; otherwise test the interface with clearly identified mocks.
4. Add `uniswap-v4-paymaster`: basic sponsorship, unstaked external pool read, staked external pool read, and grounded boundary cases.
5. Improve verdict/error classification and independent receipt handling; fully implement verification-gas boundary mutations before broadening scope.
6. Improve the existing dashboard using saved evidence; run tests and CLI/dashboard smoke checks.

## Fixed decisions
- Swarm work is opt-in (`FRAMEFUZZ_SWARM=on`). Current authorization covers offline compilation/cryptographic checks and read-only preflight only, then STOP. No live deployment, broadcast or Arkiv write without separate explicit approval and resolved wallet/health/hash checks. Only owned unsafe fixtures are in scope; action execution and independent reproduction are required for a finding. Milestones3–5, real LLM investigation and its UI are not implicitly complete.
- Public identity: FrameFuzz stands on its own demonstrated functionality. Keep competitive research/marketing outside the public project; retain legitimate upstream licenses and technical attribution. Use immutable saved evidence when devnets fail, label its capture time and disable external actions in offline mode. Human feedback/submission is pending unless confirmed.
- Registry scope authorized after the core gate passed: Arkiv Rabdi chain7794095 only, official SDK, separate test writer, sanitized wallet-owned expiring semantic fixtures. Community reads cross publishers; all community imports are unsigned previews with UNKNOWN local rule confidence. No remote script/fixture-path execution or automatic broadcast. Historical receipts remain publisher claims separate from new outcomes. Do not add unrelated sponsor integrations.
- Mutation task scope: generate deterministic unsigned models and environment/setup variants, then compile through the proven adapter. Preserve `evidence/live/2026-11-06/` unchanged; new campaign evidence belongs under `evidence/mutations/`. Confidence is explicit and provenance-limited. No automatic remote shrinking or large public campaigns; at most seven selected variants per live invocation.
- Node.js 20+, dependency-light implementation; no giant frontend rewrite.
- Independent signed transactions and safe state for each public/alternative comparison.
- Expected policy differences are not automatically vulnerabilities.
- Sidecar version/rule provenance is required for concrete rule expectations.
- No claim of USDC reimbursement or an executed Uniswap swap without complete receipts, logs, and balance evidence.
- Preserve the separate Cursor paymaster experiment; import only known-good artifacts after identifying its branch/workspace.
- No mainnet, committed secrets, unrelated integrations, or high-volume shared-gateway testing.

## Handoff contract
The handoff is file-backed, so it does not depend on access to this chat. Open this exact folder in Cursor. Its always-applied `.cursor/rules/framefuzz.mdc` points to `AGENTS.md` and the checkpoint documents. Read them, inspect Git, then resume the first pending task. This shares project state, not IDE chat history or authentication sessions.

## Commit and GitHub policy
The user requests frequent coherent commits, including single-file commits when appropriate, with one-line conventional messages. Do not wait until the whole MVP is complete. Keep unrelated work separate and check staged changes for secrets. GitHub authentication is personal and cannot be repaired by guessing credentials. The configured remote is `https://github.com/n1shanthb/ethglobalmumbai.git`; pushing still requires authorization. Preserve the active `feat/framefuzz-mvp` branch.

## Offline investigator authorization update
The user explicitly requested a real bounded investigator using OpenRouter and selected Sonnet. This authorizes bounded provider requests for owned-fixture offline investigation, including three perspective proposals and an observation-conditioned follow-up, plus additive Swarm Lab controls. It does not authorize blockchain deployment/submission, registry writes or push. Existing live gates remain in force. See docs/INVESTIGATOR.md; real provider demonstration is pending credential visibility, not implied by implementation.
