# Current status — premium React UI + live admission product

FrameFuzz now ships a React + TypeScript + MUI + Lucide product UI while preserving all backend admission APIs.

## UI
- App: `web-ui/` → build output `web/dist/`
- Shell: sidebar nav (Overview, Playground, Comparisons, Campaigns, Evidence, Agents, Arkiv, Readiness, Briefing)
- Flagship: Contract Playground with source → analyze → agents → public/alt comparison → save regression
- Context line: “Live analysis enabled · chain writes require authorization” (not a global READ ONLY blocker)
- Browser verified on `:4190`: Overview metrics from real runs; Playground load+analyze against backend; readiness cards independent

## Live product claims (unchanged)
ADMISSION_DIVERGENCE=TRUE · INCLUSION=FALSE · EXECUTION_SUCCESS=NOT_OBSERVED for reference capture `0xf69e0f4b…e31d`.

## Launch
```bash
npm run ui:build
node --env-file=.env bin/framefuzz.mjs serve --mode LIVE_READ_ONLY --results runs --port 4190
```
For live writes: `--mode LIVE_AUTHORIZED` with operator key. Dev proxy: `npm run ui:dev` (proxies `/api` to :4190).

## Tests
dashboard + saved-demo + storage-access-product pass after React shell updates. No broadcast / OpenRouter spend / push in this pass.
