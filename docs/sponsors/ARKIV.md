# Arkiv — Build on Arkiv

## 1. Sponsor / prize name

**Build on Arkiv (from scratch)** — Arkiv at ETHGlobal Mumbai (unless Continuity track applies).

Official page: https://ethglobal.com/events/mumbai/prizes/arkiv  
Docs: https://docs.arkiv.network  
Rabdi RPC: https://rpc.rabdi.db-chain.testnet.arkiv.network · Explorer: https://rabdi.explorer.arkiv.network · Chain ID **7794095**

Arkiv partner prizes count as **one** partner prize pick; Swarm bonus can stack without consuming another pick (official page).

## 2. Official prize description (source)

Build a new app whose data lives in Arkiv entities (SQL-like filters, owner wallet, expiry). Directions include agents, markets, publishing, identity.

## 3. Exact eligibility requirements (Build on Arkiv from scratch)

| # | Requirement | Source |
|---|---|---|
| A1 | Writes to current Arkiv testnet via `@arkiv-network/sdk` or JSON-RPC | Prize page |
| A2 | At least one **user-visible** feature **reads** Arkiv data | Prize page |
| A3 | README lists writer wallet(s) + one runnable query | Prize page |
| A4 | `/arkiv/schema.md` + `/arkiv/friction.md` | Prize page |
| A5 | Criterion files: `/arkiv/reach.md`, `/arkiv/why-arkiv.md`, `/arkiv/how-you-use-arkiv.md` | Prize page |
| A6 | Public OSS repo + AI usage disclosure | Prize page |
| A7 | Not counted: SDK installed but never read; Arkiv only as unread log | Prize page |

## 4–5. Compliance table

| Requirement | FrameFuzz | Status |
|---|---|---|
| A1 Writes | `createEntity` publish of `framefuzz.regression.v1` | LIVE |
| A2 User-facing reads | UI Arkiv page + CLI `arkiv query` + import unsigned preview | COMPLETE |
| A3 README wallets + query | Documented (multiple historical writers — see below) | COMPLETE / keep synced |
| A4–A5 `/arkiv/*.md` | Present | COMPLETE |
| A6 Public repo | Origin exists; anonymous access **404** at audit | NEEDS VERIFICATION |
| Swarm bonus | See [SWARM.md](./SWARM.md) | NOT ELIGIBLE YET |

## 6. Technical architecture

```text
Operator approval gate → createEntity (Rabdi 7794095)
        → entity key + content digest + expiry + owner
UI / CLI query (SQL-like filters) → fetch entity
        → integrity verify digest
        → unsigned import into local PREVIEW investigation
Agents may consume verified regressions when intelligence path enabled
```

**Do not confuse** saved fallback snapshots with a fresh live query. Soft-fail paths exist when Rabdi is down.

## 7–8. Repository files

| Path | Role |
|---|---|
| `src/arkiv/registry.mjs` | Registry client / query helpers |
| `src/arkiv/case.mjs` | Case schema mapping |
| `src/arkiv/approval-gate.mjs` | Operator-authorized publish gate |
| `src/playground/arkiv-intelligence.mjs` | Playground/agent Arkiv intelligence |
| `scripts/arkiv-approved-publish.mjs` | Approved publish script |
| `scripts/arkiv-approval-packet.mjs` | Approval packet builder |
| `scripts/create-arkiv-writer.mjs` | Writer setup |
| `web-ui/src/pages/Arkiv.tsx` | User-facing browse/query/import |
| `bin/framefuzz.mjs` | `arkiv query` and serve modes |
| `arkiv/schema.md` | Entity schema |
| `arkiv/friction.md` | Feedback |
| `arkiv/reach.md` | Reach criterion |
| `arkiv/why-arkiv.md` | Why Arkiv |
| `arkiv/how-you-use-arkiv.md` | How used |
| `arkiv/swarm.md` | Honest Swarm status (not implemented) |
| `evidence/arkiv/2026-11-07/publish-receipt.json` | Confirmed publish |
| `evidence/integrated/2026-11-06/arkiv-query-fresh-process.json` | Fresh query process evidence |
| `test/arkiv.test.mjs` / `test/arkiv-*.test.mjs` | Tests |

## 9. Functions / CLI / UI

- Publish: approval-gated scripts + registry createEntity
- Query: `node bin/framefuzz.mjs arkiv query --suite … --rule …`
- UI: Arkiv page filters, inspect creator/owner/schema/expiry/digest, import unsigned PREVIEW
- Import never reuses operator signatures for broadcast

## 10–11. Addresses / txs / entities

### Confirmed 2026-11-07 publication (primary audit target)

| Field | Value |
|---|---|
| Chain | 7794095 |
| Tx | `0x007bd10f4d720a124c4dd0b44449f235b32f364a4b68e7657917f1717a307c00` |
| Entity | `0xf1089c05e4a7ec4d3a66087381c1c78b43728a836e4ae10eb694cfd6ce2a06a1` |
| Writer | `0x20370BE5BA867Ab4779ad0686963A55ADc0722b1` |
| Content digest | `0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25` |

### Additional historical README entities (still valid as history)

| Entity | Writer (README) | Tx |
|---|---|---|
| Gas `0x5393e97d…` | `0xd4A81a21…C715` | `0x0158db1b…` |
| Uniswap `0x6779cf38…` | same | `0x44f00844…` |

List **all** writers used in README for judges.

## 12. Evidence

| File | Proves |
|---|---|
| `evidence/arkiv/2026-11-07/publish-receipt.json` | Live createEntity |
| `evidence/integrated/2026-11-06/arkiv-query-fresh-process.json` | Fresh query process |
| `evidence/integrated/2026-11-06/arkiv-*-import.json` | Import paths |

## 13. Tests

`test/arkiv.test.mjs`, approval-gate, playground-arkiv-http, arkiv-intelligence tests.

## 14. Browser / UI

`web-ui` Arkiv page: filter ≤20 discovery, inspect metadata, import unsigned preview. Influences investigations by loading portable regression fixtures (not by inventing live admission results).

## 15. Reproduce

```powershell
node bin/framefuzz.mjs arkiv query --suite verification-gas --rule MAX_VERIFY_GAS
# or open UI Arkiv page against LIVE_READ_ONLY serve
```

Publish requires approval packet + `ARKIV_PRIVATE_KEY` / access key — do not run without authorization.

## 16. Verified LIVE

Publish receipt + entity above; prior gas/uniswap entities; UI query/import journey documented in product status.

## 17. Historical / fallback only

Saved registry snapshots in Evidence Explorer with validity UNKNOWN until rechecked; outage soft-fail fallbacks.

## 18. Limitations

Expiry removes stale entities; bounded discovery truncation; public repo visibility; writer key never distributed; Swarm not linked.

## 19. Demo

Show UI query of entity `0xf1089c05…` (or gas/uniswap entities) → digest verify → unsigned import → explain agents can reuse fixtures. Optionally show publish receipt JSON if not publishing live.

## 20. External submissions

ETHGlobal portal prize checkbox for Arkiv. Required `/arkiv/*.md` already in repo. No separate Uniswap-style web form for Arkiv beyond those files.
