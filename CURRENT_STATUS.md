# Current status — real-user acceptance readiness (QuotaVault)

Playground is **ready for the operator to personally authorize one real QuotaVault investigation**. No paid OpenRouter calls and no chain/Arkiv broadcasts were made in this pass.

## Acceptance evidence (browser + API)
- Server: `FRAMEFUZZ_SWARM=on` + `node --env-file=.env bin/framefuzz.mjs serve --mode LIVE_READ_ONLY --results runs --port 4190`
- URL: http://127.0.0.1:4190/ → Contract Playground → BYOC
- **OPENROUTER_API_KEY**: present (length 73, `sk-or-v…`); config API reports `openRouterKeyPresent: true` with **no key material** in JSON
- **QuotaVault** analyzed: READY · profile byoc · solc `0.8.28+commit.7893614a…` · digest `4953d79f…` · analysis `d98ee41b…` · role UNKNOWN · 7 ABI functions
- **Arkiv**: `NO_APPLICABLE_QUERY` · 0 cases · broadcasts **0** · notice “No EIP-8141 admission/paymaster signals…” — analysis stayed READY (non-blocking)
- Consent checked → **Start Investigation enabled** without `--submit` and without `LIVE_AUTHORIZED`
- Agent cards: 0 actual requests (Start not clicked)
- Provider line: `OpenRouter · anthropic/claude-sonnet-4.6 · READY · mode LIVE_READ_ONLY · OpenRouter key loaded · budget $1.0000 remaining`
- Config: `canStart: true`, `writesEnabled: false`, `arkivWritesEnabled: false`, `chainBroadcastEnabled: false`, sprint spent `$0.0000` / remaining `$1.0000`

## Live-agent enablement (no hidden toggle)
`playgroundInvestigationReadiness()` treats **`--mode LIVE_READ_ONLY` or `LIVE_AUTHORIZED` + OpenRouter key** as sufficient. `FRAMEFUZZ_SWARM=on` remains a legacy/alternate enable for Swarm Lab offline crypto; it is **not** required for Playground when live mode is set. If blocked, the UI shows the explicit `investigationReadiness.notice` / blockers (not a silent disable).

## Fixture
- `examples/contracts/QuotaVault.sol` — self-contained BYOC acceptance fixture (not EIP-8141; not a live deploy target)

## Tests
- `node --test test/playground-readiness.test.mjs` → 4/4 pass
- Prior full suite: **205/205** (Arkiv×Playground); readiness test is additive

## Operator next step
In the open browser session: leave consent checked and click **Start Investigation** only when you personally authorize the paid QuotaVault run. Do not expect chain broadcast from Playground start.
