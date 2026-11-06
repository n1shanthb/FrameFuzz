# Current status — Arkiv createEntity PUBLISHED (one-shot)

Explicit user approval of intent `be8bb848e49f63f3d14c3418e239d3b1eccd8b6360eb1c326ec192a5ddd40ff4` / max fee `0.001` tGLM was consumed once. Preflight passed; **one** Rabdi `createEntity` submitted; no retry; no EF / funding / LLM / push.

## Confirmed publication
- **tx:** `0x007bd10f4d720a124c4dd0b44449f235b32f364a4b68e7657917f1717a307c00`
- **receipt:** `success` at block `302519`
- **entityKey:** `0xf1089c05e4a7ec4d3a66087381c1c78b43728a836e4ae10eb694cfd6ce2a06a1`
- **creator/owner:** `0x20370BE5BA867Ab4779ad0686963A55ADc0722b1`
- **expiresAtBlock:** `345303`
- **contentDigest:** `0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25` (fresh fetch + owner query MATCH)
- **fee paid:** `0.000278489` tGLM (`gasUsed` `278489` × `1 gwei`) — under `0.001` ceiling
- **import:** unsigned preview `PREVIEW_COMMUNITY — UNTRUSTED, NO BROADCAST`, `submissions: 0`
- **explorer:** none verified/pinned for Rabdi in-repo (not invented)

## Evidence
- `evidence/arkiv/2026-11-07/publish-receipt.json`
- `evidence/arkiv/2026-11-07/fresh-fetch.json`
- `evidence/arkiv/2026-11-07/unsigned-import-preview.json`
- `evidence/arkiv/2026-11-07/confirmation-summary.json`
- Gate: `src/arkiv/approval-gate.mjs` (11/11 tests); submit lock cleared after one-shot

## Not done
EF Uniswap path still blocked (empty paymasters). No Git push authorized.
