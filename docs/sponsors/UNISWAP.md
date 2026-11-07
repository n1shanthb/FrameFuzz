# Uniswap Foundation — Build with Uniswap

## 1. Sponsor / prize name

**Build with Uniswap** — Uniswap Foundation at ETHGlobal Mumbai.

Official page: https://ethglobal.com/events/mumbai/prizes/uniswap-foundation  
Prizes hub: https://ethglobal.com/events/mumbai/prizes  
Feedback form: https://developers.uniswap.org/hackathon-feedback

## 2. Official prize description (source)

Build on or integrate any part of the Uniswap stack (API, AMM v2/v3/v4, CCA, hooks, ecosystem tooling).

## 3. Exact eligibility requirements

| # | Requirement | Source |
|---|---|---|
| U1 | Public GitHub repository with open-source code | Prize page |
| U2 | `FEEDBACK.md` in the repository | Prize page |
| U3 | Completed Uniswap Developer Feedback Form linking to `FEEDBACK.md` | Prize page + form URL |
| U4 | README points to relevant contracts and code lines for verification | Prize page |

## 4–5. How FrameFuzz satisfies + compliance table

| Requirement | How satisfied | Status |
|---|---|---|
| U1 Public OSS repo | Origin `https://github.com/n1shanthb/ethglobalmumbai.git` (MIT) | **NEEDS VERIFICATION** — anonymous HTTP HEAD returned 404 at audit time |
| U2 FEEDBACK.md | [`FEEDBACK.md`](../../FEEDBACK.md) | COMPLETE |
| U3 Form submitted | Human action | **MISSING / NOT SUBMITTED** |
| U4 README pointers | README + this doc + CONTRACT_ADDRESSES | COMPLETE in docs; keep README links current |
| Meaningful integration | Validation-time `StateView.getSlot0(poolId)` inside paymaster PAYMENT VERIFY | LIVE evidence |
| Swaps / LP / USDC | — | **NOT CLAIMED** |

## 6. Technical architecture

`ReserveReadingPaymaster` is compiled and deployed on EF chain 1337. During frame **PAYMENT VERIFY**, calldata prefix `0x01` triggers:

`IStateView(STATE_VIEW).getSlot0(POOL_ID)`

That external storage access is exactly what canonical ethrex can reject as `StorageReadNonSender`, while Skandha may accept a staked payer — producing a **developer-tooling** demonstration of Uniswap v4 state reads under EIP-8141 admission policy.

**Why this matters:** wallet/paymaster authors may gate sponsorship on pool state. Ordinary `eth_call` success does not imply public mempool admission. FrameFuzz makes that gap visible.

## 7–8. Repository files

| Path | What it does |
|---|---|
| `vendor/paymaster/ReserveReadingPaymaster.sol` | Paymaster source; VERIFY path calls StateView.getSlot0 |
| `vendor/paymaster/ReserveReadingPaymaster.json` | Compiled artifact |
| `artifacts/step2e/ReserveReadingPaymaster.json` | Step 2E bind artifact |
| `scripts/step2e-compile-paymaster.mjs` | Compile/bind pipeline |
| `src/adapters/uniswap-state.mjs` | StateView / pool binding checks |
| `src/adapters/workshop-live.mjs` | Live sponsored submission helpers |
| `src/playground/profiles.mjs` / `facts.mjs` / `investigate.mjs` | Playground analysis hooks |
| `examples/live/devnet.json` | Pinned StateView / PoolManager identities (see FEEDBACK.md) |
| `evidence/live/2026-11-07/uniswap-policy-divergence-final.json` | LIVE dual-path result |
| `evidence/live/2026-11-06/*` | Earlier Uniswap live/historical captures |
| `FEEDBACK.md` | Required developer feedback write-up |
| `docs/PAYMASTER_STATUS_AND_NEXT_GATE.md` | Internal status notes |

Source digest (Step 2E): `85a4891e08085f09d8c23df2a67e455d8f1e130e7c4bcbe17de6966ed9cf43ec`

## 9. Functions / routes / CLI

- Solidity: `getSlot0` call site in `ReserveReadingPaymaster.sol` (VERIFY/`0x01` path — see FEEDBACK.md line reference)
- JS: Uniswap state adapter exports used by preflight/live scripts
- Live compare uses shared `comparePolicyCandidate` path
- UI: Playground currently productizes ViolatingWallet live button; Uniswap path evidenced via scripts/evidence (see CURRENT_STATUS caveat on single-button wiring)

## 10. Addresses (chain 1337)

| Name | Address |
|---|---|
| StateView | `0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB` |
| PoolManager (via StateView) | `0x6bF9Aa9c04fd001385742d61f6818C3236429848` |
| Pool ID | `0x784bd7879f8155eda79b7834d53c2f19ace60aed221fe33ef03ce660eff60648` |
| ReserveReadingPaymaster (LIVE divergence) | `0x3df63DFD230156C3656Bd4448326482030c31f96` |
| Deploy tx | `0xddd9925994b02afe443f9804fb2f361aa595e2509b1d98b5339d57b040694032` |
| Stake tx | `0x88f2a4ec59df362a47ee65e20f4430495763e8be567de3ab014d0657ccbed251` |
| Candidate | `0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067` |

Slot0 observed as zeros in FEEDBACK context → proves **read of uninitialized pool storage**, not trading.

## 11–12. Evidence

| File | Proves |
|---|---|
| `evidence/live/2026-11-07/uniswap-policy-divergence-final.json` | Canonical REJECTED_POLICY StorageReadNonSender; alt ACCEPTED_AND_INCLUDED / OnChain; admission id 2065 |
| FEEDBACK.md | Honest DX write-up |

## 13. Tests

Paymaster/reserve/uniswap-related Node tests; full suite 236/239 pass observed. Specific compile test `pasted StorageAccessValidator…` currently failing — unrelated naming but triage before claiming green CI.

## 14. Browser / UI

Evidence Explorer + Comparisons can surface Uniswap JSON. Dedicated one-click Uniswap Playground live flow may still need wiring per CURRENT_STATUS — do not imply the Playground button alone re-runs Uniswap without checking.

## 15. Reproduce

1. Confirm StateView/PoolManager code hashes via `src/adapters/uniswap-state.mjs` / `examples/live/devnet.json`
2. Deploy/stake paymaster only with authorization on 1337
3. Sign VERIFY calldata `0x01` candidate
4. Dual submit; compare to `uniswap-policy-divergence-final.json`

## 16. Verified LIVE

Uniswap policy divergence candidate `0x72a82645…` with validation-time StateView read (2026-11-07 evidence).

## 17. Prepared / historical / not claimed

- Earlier PREPARED packets under `evidence/prepared/` (superseded by final LIVE file when present)
- **No** swap, LP, initialized pool price, or USDC reimbursement claims
- Form submission not done

## 18. Limitations

Public repo visibility; form; optional UI wiring; uninitialized pool; stake/funding fragility on reset.

## 19. Demo instructions

Show Solidity getSlot0 line → evidence comparison panel → emphasize tooling use case → open FEEDBACK.md. Do not demo a swap UI.

## 20. Required external submission

1. Ensure public GitHub  
2. Submit https://developers.uniswap.org/hackathon-feedback with link to public `FEEDBACK.md`  
3. Keep status in FEEDBACK.md as **NOT SUBMITTED** until human confirms
