# Current status — Arkiv native in Playground investigation

Arkiv is wired into Contract Playground analyze → agent investigation → import → optional operator publish. No new chain writes or paid LLM calls this pass. Full suite **205/205** pass.

## Product behavior (verified)
- **Analyze** auto-runs bounded Arkiv discovery (no consent). Uniswap profile: `AVAILABLE` with relevant `uniswap-storage` + `verification-gas` cases and relevance reasons. Generic ERC-20: `NO_APPLICABLE_QUERY` (no fishing).
- Live Rabdi may rate-limit → **SAVED_FALLBACK** with honest labeling; investigation continues.
- Agents receive `COMMUNITY_REGRESSION_INTELLIGENCE` + `arkiv_regressions` tool; usage recorded in `report.arkivIntelligence`.
- **Import** `/api/playground/arkiv/import` → unsigned preview, `broadcasts:0` (confirmed for entity `0xf1089c05…06a1`).
- **Publish** preview/confirm for operator only (`ARKIV_PRIVATE_KEY`); public gets 403. Intent digest + fee ceiling; no auto-retry.
- Browser (http://127.0.0.1:4188): Playground Uniswap analyze shows **Community Regression Intelligence** with 3 cases including our published entity; Start Investigation disabled without `FRAMEFUZZ_SWARM=on` (expected for this serve mode).

## Key files
- `src/playground/arkiv-intelligence.mjs` — discovery, relevance, sanitize, publish confirmation
- `src/playground/{investigate,http,session,tools,schemas}.mjs` — agent + API wiring
- `web/js/playground.js` + `web/css/app.css` — Community Regression Intelligence UI
- Tests: `test/arkiv-intelligence.test.mjs`, `test/playground-arkiv-http.test.mjs`

## Prior Arkiv one-shot (unchanged)
Entity `0xf1089c05e4a7ec4d3a66087381c1c78b43728a836e4ae10eb694cfd6ce2a06a1` · contentDigest `0f7f0145…` · evidence under `evidence/arkiv/2026-11-07/`.

## Limitations
- Saved snapshots mark `replayAllowed:false`; import still re-verifies live when clicked.
- Agent decision influence with a **paid** Uniswap run not re-executed this pass (no paid LLM); covered by mock-provider tests.
- EF Uniswap live path still paymaster-blocked. No push.
