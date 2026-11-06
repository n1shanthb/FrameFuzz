# FrameFuzz

**Reproducible EIP-8141 admission tests and shared semantic regression fixtures.** FrameFuzz changes unsigned models, signs isolated transactions when explicitly authorized, compares public/alternative admission decisions and tracks inclusion separately from action execution. Intended policy differences are not vulnerabilities.

[Canonical current capabilities and limits](docs/CURRENT_CAPABILITIES.md) · [Latest executed checkpoint](CURRENT_STATUS.md) · [Pass2 report](docs/PASS2_REPORT.md) · [90-second demo](docs/DEMO_90_SECONDS.md) · [Delivery checklist](docs/DELIVERY_PASS2.md)

## Key-free saved demonstration

Requires Node 20.12+ (tested on Node 22; no Node 20 runtime matrix). After installing pinned dependencies:

```powershell
npm ci
npm test
npm run verify
npm run run:preview
node bin/framefuzz.mjs saved-demo --results runs/demo --port 4192
```

Open http://127.0.0.1:4192. Select historical reports in Evidence Explorer, inspect/export actual JSON/Markdown/replay, and generate unsigned previews. Arkiv Registry → Inspect saved registry snapshots shows historical publication ownership/digests with current validity UNKNOWN; Open saved imported PREVIEW views an existing import. Swarm Lab → Load saved investigation shows genuine Sonnet evidence without an API key. Technical Briefing supports presentation mode. Saved-demo disables external chain/registry/provider actions; it does not represent saved results as a fresh execution.

Current test results are recorded in [TEST_CHECKPOINT.json](docs/TEST_CHECKPOINT.json). Briefing facts are generated from canonical evidence and this explicit checkpoint. `node scripts/briefing-facts.mjs --check` detects drift; see [verification limitations](docs/CURRENT_CAPABILITIES.md#verification-limits-and-human-delivery).

## What the evidence establishes

- **Gas:** seven generated variants,14 historical real admission decisions,14 matches, eight included-success receipts. Sender VERIFY30000 + payer VERIFY67200 + signature2800 =100000 in the tested workshop profile.
- **Uniswap v4:** genuine validation-time StateView.getSlot0 read. Basic sponsorship accepted on both paths, unstaked external read rejected on both, staked read rejected publicly and accepted alternatively with historical inclusion. No swap, USDC reimbursement or active-price demonstration is claimed.
- **Arkiv:** two historical successful publications and a freshly verified premium UI query → retrieve → verify → import unsigned preview journey. One demonstrated publisher; no adoption numbers. Current reads depend on availability/expiry.
- **Sonnet:** four actual successful-run responses selected record(1,20), then record(2,10); two fresh-process replays reproduced offline ECDSA behavior. Same implementation assumptions remain. No owned-validator EVM execution or protocol vulnerability is proven.

Full captures/digests: [LIVE_EVIDENCE.md](docs/LIVE_EVIDENCE.md), [gas evidence](evidence/mutations/2026-11-06/), [Uniswap evidence](evidence/live/2026-11-06/), [Sonnet evidence](evidence/investigator/2026-11-06/sonnet-retry-2.json). Historical artifacts are immutable. New generated storage testing previously recorded infrastructure errors; those are not policy bugs or successful inclusions.

## Arkiv Community Cases

Network: **Rabdi, chain 7794095**, RPC `https://rpc.rabdi.db-chain.testnet.arkiv.network`, SDK `@arkiv-network/sdk@1.0.1`. This is separate from the experimental EIP-8141 chain 1337 and its transaction format/accounts.

Writer wallet: `0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715`. Its historical in-memory signing key is not distributed.

- Gas entity: `0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1`; creation tx `0x0158db1bec0a20a8671ba18d0d9776b437a6a5cdb18970948a6c51d8fe5e8388`; successful receipt block 267241; expiry569638.
- Uniswap entity: `0x6779cf38a4398eb90da94b11885e691b84a6bb09dda59974cf5b8f1a21db773e`; creation tx `0x44f0084455b54724624fffd3e2c186986146d316c5d6bf27207409872acc9ec2`; successful receipt block 268363; expiry570761.

```powershell
node bin/framefuzz.mjs arkiv query --suite verification-gas --rule MAX_VERIFY_GAS
node bin/framefuzz.mjs serve --results runs/registry --port 4193
```

Public reading/import requires no wallet. In the normal dashboard, filter by suite/rule/version/owner, select a case, inspect creator/owner/schema/expiry/digest and import as unsigned PREVIEW. Bounded discovery returns at most 20; possible truncation is explicit. Import rechecks current expiry and regenerates constrained semantic inputs at UNKNOWN confidence, never signatures or broadcasting. Saved snapshots cannot bypass current expiry checks.

Arkiv stores the portable fixture, indexed metadata, digest and selected historical outcome summaries. Full reports remain offchain in Git; a digest is not a resolver or proof that publisher outcomes are true. Shared searchable fixtures can be found across developers without knowing a repository layout; ownership gives attribution and expiry removes stale replay candidates. Local JSON and Git retain private/permanent evidence roles. No external adoption is claimed.

Required sponsor documents: [schema](arkiv/schema.md), [friction](arkiv/friction.md), [reach](arkiv/reach.md), [why Arkiv](arkiv/why-arkiv.md), [how used](arkiv/how-you-use-arkiv.md). Existing explicit publish CLI remains documented there; no new publication is authorized by this sprint.

## Offline experiments and conditional execution

`swarm sponsored-plan` completes deterministic offline sponsored preparation: constructor/init-code digests, optional CREATE predictions, dependencies and unresolved runtime/funding gates. [Preparation instructions](docs/SPONSORED_PREPARATION.md). The isolated self-funded candidate remains [PLAUSIBLE_UNVERIFIED](docs/SELF_FUNDED_FEASIBILITY.md). Neither path deploys or signs with user keys.

`swarm verify-action` ingests a strict candidate raw receipt/log/state bundle. It checks consistency but always keeps actionEvidenceVerified=false/liveVerified=false because no actual owned-validator live action receipt or canonical collector exists. [Raw-proof boundaries](docs/RAW_ACTION_PROOF.md).

A new live campaign requires a healthy compatible gateway, valid funded/staked fixtures, exact allowlisted chain/endpoints and separate authorization. Devnet resets can invalidate historical addresses. Only explicit chain 1337 or local 31337 generic execution is allowed; Arkiv uses its separate client. No mainnet, unrelated integrations, automated community broadcast or fabricated evidence. Standalone reserve deployment requires `--submit --allow-chain 1337` and separate authorization; do not run it for the demo.

[Mutation/semantic replay instructions](docs/MUTATIONS.md) · [Adapter contract](docs/ADAPTER.md) · [Investigator setup and limits](docs/INVESTIGATOR.md).

## License, AI and handoff

**MIT**: [LICENSE](LICENSE). Imported upstream code retains technical attribution and notices in vendor/. AI assisted implementation, test design, documentation and execution support; the product also has genuine bounded Sonnet requests. Mocked/constructed/preview data is labelled separately from real historical receipts and fresh read-only verification.

Read AGENTS.md, AUTHORITY.md, CURRENT_STATUS.md and UP_NEXT.md in this same repository when changing IDEs. Older status snapshots are preserved under docs/history/ and dated evidence, rather than treated as current capabilities. Public access, push, video and external submission confirmations remain pending human actions; no submission ID or video is claimed.

## Internal contract-analysis foundation

Versioned input/context and semantic-test adapters reuse the existing gas and owned-validator engines. See [foundation scope and executed fixtures](docs/CONTRACT_ANALYSIS_FOUNDATION.md) and [stability verification](docs/STABILITY_FOUNDATION_REPORT.md). This adds no Playground UI or arbitrary Solidity compiler. Saved transcript reading needs no execution opt-in; offline cryptographic execution still requires FRAMEFUZZ_SWARM=on.

## Genuine feasibility-gated agents

[Current agent pipeline and actual evidence](docs/AGENTIC_FEASIBILITY.md): Scout → Mutation → Validator → Executor → Critic through separate Sonnet calls. Two model-selected supported local cases evaluated; Validator advice cannot override deterministic gates. The latest saved investigation includes a local XPASS candidate, gas PREDICTED/observed null, and a Critic-requested matching replay. No live validator action or vulnerability is claimed. Default paid-run ceiling is $0.50/6 calls with explicit consent; saved viewing makes no provider request. All164 tests pass.
