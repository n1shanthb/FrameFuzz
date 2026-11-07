# ETHGlobal Mumbai 2026 — requirements checklist

**Official sources**

| Topic | URL |
|---|---|
| Event home | https://ethglobal.com/events/mumbai |
| Submission rules / deadline | https://ethglobal.com/events/mumbai/info/details |
| Prizes hub | https://ethglobal.com/events/mumbai/prizes |
| Ethereum Foundation prizes | https://ethglobal.com/events/mumbai/prizes/ethereum-foundation |
| Uniswap Foundation prizes | https://ethglobal.com/events/mumbai/prizes/uniswap-foundation |
| Arkiv prizes | https://ethglobal.com/events/mumbai/prizes/arkiv |
| Uniswap hackathon feedback form | https://developers.uniswap.org/hackathon-feedback |
| Alt mempool docs / explorer | https://docs.altmempool.wtf/ · https://explorer.altmempool.wtf/ |

**Deadline:** Saturday, **7 November 2026, 09:00 am IST** ([info/details](https://ethglobal.com/events/mumbai/info/details)).  
**Partner prizes:** select up to **3** (a partner with multiple tracks still counts as one pick).  
**Demo video:** strongly encouraged 2–4 minutes on the Showcase; CROPS EF prize requires ≤3 minutes if that prize is selected.

Status legend: `COMPLETE` · `NEEDS VERIFICATION` · `MISSING` · `NOT APPLICABLE`

---

## A. ETHGlobal overall / main submission

| Requirement | Status | Notes |
|---|---|---|
| Project name: FrameFuzz | COMPLETE | README + this package |
| Tagline | COMPLETE | Break the tx before the mempool does |
| Project description | COMPLETE | [ETHGLOBAL_SUBMISSION.md](./ETHGLOBAL_SUBMISSION.md) |
| Technologies used | COMPLETE | Node, EIP-8141 codec, ethrex/Skandha adapters, Solidity/solc, React+MUI, Arkiv |
| Public GitHub repository | NEEDS VERIFICATION | Confirm remote is public/anonymous-accessible before portal submit |
| Repository URL on portal | MISSING | Human portal action |
| Demo video | MISSING | Human upload; use [DEMO_RUNBOOK.md](./DEMO_RUNBOOK.md) |
| Live website URL | NEEDS VERIFICATION | Local demo is verified; public host optional unless portal requires |
| Screenshot / thumbnail | MISSING | Human portal asset |
| Team information | NEEDS VERIFICATION | Portal fields |
| README | COMPLETE | Root README updated for submission |
| Technical documentation | COMPLETE | `docs/submission/*` + `docs/sponsors/*` |
| Contract addresses | COMPLETE | [CONTRACT_ADDRESSES.md](./CONTRACT_ADDRESSES.md) |
| Live evidence links | COMPLETE | [PROOF_INDEX.md](./PROOF_INDEX.md) |
| Eligible sponsors selected (≤3) | NEEDS VERIFICATION | Recommend EF + Uniswap + Arkiv Build |
| ≤3 partner prize rule understood | COMPLETE | Documented |

## B. Ethereum Foundation / EIP-8141 / Alternative Mempool

| Requirement | Status | Notes |
|---|---|---|
| Build tooling or app exercising EIP-8141 / alt mempool | COMPLETE | Dual-path admission lab |
| Real signed type-0x06 txs | COMPLETE | Evidence + codec |
| Canonical vs alternative comparison | COMPLETE | Flagship LIVE divergence |
| Explorer / code / write-up proof | COMPLETE | Evidence JSON + sponsor EF doc |
| Special feedback form beyond portal | NEEDS VERIFICATION | Follow EF prize page instructions at submit time |
| Claiming inclusion for policy-only divergence | NOT APPLICABLE | Explicitly **not** claimed for `0xf69e0f4b…` |

## C. Uniswap sponsor prize

| Requirement | Status | Notes |
|---|---|---|
| Meaningful Uniswap developer tooling use | COMPLETE | StateView in paymaster validation |
| Public repo with integration | NEEDS VERIFICATION | Same as GitHub publicity |
| `FEEDBACK.md` in repo | COMPLETE | Root FEEDBACK.md |
| External feedback form submitted | COMPLETE | Human-confirmed 2026-11-07; keep public FEEDBACK.md URL reachable |
| Claiming swaps / LP / USDC payback | NOT APPLICABLE | Not claimed without evidence |

## D. Arkiv — Build on Arkiv

| Requirement | Status | Notes |
|---|---|---|
| On-chain writes (createEntity) | COMPLETE | Live tx + entity |
| User-facing reads / queries | COMPLETE | API + UI Arkiv surfaces |
| Integrity / schema evidence | COMPLETE | Content digest + import path |
| `/arkiv/*.md` sponsor docs | COMPLETE | Existing arkiv docs + this package |

## E. Arkiv + Ethereum Swarm bonus

| Requirement | Status | Notes |
|---|---|---|
| Bee upload / postage / Swarm reference | MISSING | **NOT IMPLEMENTED** |
| `/arkiv/swarm.md` honest status | COMPLETE | Declares not eligible |
| Eligibility for bonus | NOT APPLICABLE | Do not select until implemented |

## F. Other prizes

Only select prizes with a real FrameFuzz integration. Do not invent eligibility for unselected sponsors.

---

## Human actions before deadline (ordered)

1. **P0** Portal project create/update + public GitHub URL  
2. **P0** Demo video + thumbnail  
3. **P0** Select ≤3 prizes (EF, Uniswap, Arkiv Build recommended)  
4. **P1** Submit Uniswap https://developers.uniswap.org/hackathon-feedback  
5. **P1** Confirm EF prize page for any extra write-up/video fields  
6. **P2** Triage 3 failing Node tests (236/239 pass observed 2026-11-07)  
7. **P2** Optional public web host (Render/Railway) — not required for core EF claim
