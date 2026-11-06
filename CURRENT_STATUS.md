# Current status — Stage A live readiness complete

Stage A implementation commit `cf4be7e` adds the real normal launcher, explicit `SAVED_DEMO` / `LIVE_READ_ONLY` / `LIVE_AUTHORIZED` capability model, Live Readiness panel, bounded Arkiv/EIP-8141 read probes, exact Arkiv and first EF manifest preparation, and a hard approval stop. Keys report readiness only. Saved demo ignores keys and cannot read networks, call paid providers, or write.

## Stage A observed readiness
- Normal command: `node --env-file=.env bin/framefuzz.mjs serve --mode LIVE_READ_ONLY --results runs --port 4177`.
- Browser on port 4217: Arkiv chain 7794095 `READY_READ_ONLY`; EIP-8141 chain 1337 `READY_READ_ONLY`; OpenRouter `CONFIGURED_CONSENT_REQUIRED`; `ARKIV_PRIVATE_KEY` and `FRAMEFUZZ_DEPLOYER_KEY` absent.
- Browser prepared both exact operation manifests. Submit remained disabled; approval endpoint returned the expected conflict/stop and no token.
- `npm test`: 185/185. `npm run verify`: 91 modules. Audit: 0 vulnerabilities. Offline preview: 7 variants, 0 submissions.
- Zero real transactions, deployments, funding, Arkiv publications, or new paid calls. No push. Historical paid evidence and live digests are unchanged.

## Preserved prior sprint

HEAD before this sprint: `093c82d`. Sprint adds ABI_TOOL_TEST correctness, $1 shared OpenRouter ledger, Uniswap paymaster profile, three-mode Playground UI, genuine paid BYOC + Uniswap Sonnet investigations, Arkiv/EIP-8141 preflight blockers.

## Paid LLM (new allowance $1.00)
- Spent: **$0.62201304** provider-reported · Remaining: **$0.37798696**
- Successful BYOC: `8edbdf04-…` FreshInventoryLock · 7 validated calls · $0.15530130 · natural Validator objections + Mutation repair · ABI PASS + structure CONDITIONAL
- Successful Uniswap profile: `da5e54ff-…` ReserveReadingPaymaster · 7 calls · $0.13936428 · historical_evidence / uniswap_context → PREDICTED (not fresh admission)
- Failed/incomplete billable attempts included in spend (schema length, agent budget, tool range) — ledger: `evidence/playground/2026-11-06/sprint-budget-2026-11-06-real-agent-quality.json`

## Network stages
- Arkiv: **ARKIV_PUBLICATION_BLOCKED** (no ARKIV_PRIVATE_KEY; no explicit publish approval). Draft manifest only. Historical entity `0x6779cf38…` retained.
- EIP-8141: **FRESH_EIP8141_BLOCKED_EXTERNAL** (gateway chainId 1337 + fresh head observed; no FRAMEFUZZ_DEPLOYER_KEY; no broadcast approval). Historical alt inclusion `0xbb9143eb…` retained.

## Verification
178/178 tests · `npm run verify` 90 modules · audit 0 vulns · no push / no chain writes / no Arkiv writes.
