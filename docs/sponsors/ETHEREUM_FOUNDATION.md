# Ethereum Foundation — Frame Transaction Alternative Mempool

## 1. Sponsor / prize name

**Best use of the Frame Transaction Alternative Mempool** — Ethereum Foundation Access Layer track at ETHGlobal Mumbai.

Official page: https://ethglobal.com/events/mumbai/prizes/ethereum-foundation

Related resources: https://docs.altmempool.wtf/ · https://explorer.altmempool.wtf/ · https://eips.ethereum.org/EIPS/eip-8141 · workshop https://github.com/forshtat/mempool-workshop

**Primary FrameFuzz prize target.** (Anon-RPC and CROPS are separate EF prizes; FrameFuzz does not claim Anon-RPC. One EF prize placement per project per official rules.)

## 2. Official prize description (source)

EIP-8141 frame transactions bring native account abstraction; the public mempool only accepts simple ones; the alternative mempool (ERC-8421) takes the rest with ERC-7562-style staking/reputation. Build apps needing higher verification budget / flexible state access, **developer tooling** (admission simulator, mempool monitoring, SDKs), or rule-breaking research.

**Qualification (official):** Show real alt mempool usage — a link to an admitted transaction on the devnet explorer, **or code that submits one**. Team must explain design, code, and trade-offs.

## 3. Exact eligibility requirements

| # | Requirement | Source |
|---|---|---|
| Q1 | Real alternative mempool usage evidenced (explorer link and/or submitting code) | EF prize page |
| Q2 | Explainable design / code / trade-offs | EF prize page |
| Q3 | Relation to alt mempool (judging) | EF prize page |
| — | Optional CROPS README section only if entering CROPS | Separate prize; not required for alt-mempool track |
| — | One EF prize placement per project | EF prize page |

## 4–5. How FrameFuzz satisfies + compliance table

| Requirement | How satisfied | Status |
|---|---|---|
| Real alt mempool usage | Dual-path submit: Skandha alternative accepts same type-0x06 bytes rejected by canonical ethrex | LIVE |
| Explorer / code proof | Evidence JSON + submitting code in adapters/playground; explorer may be used with hash `0xf69e0f4b…` / Uniswap `0x72a82645…` | LIVE |
| Developer tooling angle | Admission comparison lab, mutation/feasibility, evidence, UI | COMPLETE |
| Flexible state-access class | StorageReadNonSender divergence; Uniswap StateView paymaster path | LIVE |
| Do not over-claim inclusion | storage-access demo explicitly DROPPED after admit | Documented |

## 6. Technical architecture

```text
Unsigned frame model → pinned ethrex-eip8141-tracer codec → sign
        ↓                              ↓
 submitCanonical (ethrex)     submitAlternative (Skandha)
        ↓                              ↓
 REJECTED_POLICY / …          ACCEPTED + admission id / report
        ↓______________________________↓
              comparePolicyCandidate / live-admission
              evidence JSON (identity, raw responses, later status)
```

- Profile: `ethrex-eip8141-tracer` via `src/adapters/workshop-codec.mjs`
- Comparison: `src/policy-comparison.mjs` → `comparePolicyCandidate`
- Product live path: `src/playground/live-admission.mjs`, `src/playground/storage-access-regression.mjs`
- Routing/endpoints: `src/adapters/ef-routing.mjs`
- UI: `web-ui` Playground public vs alternative panels

## 7–8. Repository files used (and what they do)

| Path | Role |
|---|---|
| `src/adapters/workshop-codec.mjs` | Pinned EIP-8141 profile + sponsored frame construction |
| `src/adapters/wallet-codec.mjs` | Wallet candidate signing, stake/registry constants |
| `src/adapters/workshop-live.mjs` | Live workshop plugin / submission helpers |
| `src/adapters/ef-routing.mjs` | Canonical vs alternative RPC routing |
| `src/adapters/self-relay.mjs` | Self-relay inclusion path (separate from policy divergence) |
| `src/adapters/sender-validator.mjs` | Sender validation adapter |
| `src/policy-comparison.mjs` | Same-identity dual admission comparison |
| `src/playground/live-admission.mjs` | Authorized live admission orchestration |
| `src/playground/storage-access-regression.mjs` | ViolatingWallet / StorageReadNonSender product path |
| `src/playground/admission.mjs` | Admission request shaping for playground |
| `src/playground/http.mjs` | HTTP API surfaces for UI |
| `src/verdict.mjs` | Verdict classification |
| `src/scenarios.mjs` | Supported scenarios |
| `bin/framefuzz.mjs` | CLI entry |
| `evidence/live/2026-11-07/storage-access-live.json` | Flagship policy divergence |
| `evidence/live/2026-11-07/uniswap-policy-divergence-final.json` | StateView paymaster divergence + alt inclusion |
| `evidence/admission/2026-11-07/self-relay-*.json` | Canonical inclusion (not clean policy split) |
| `web-ui/src/pages/*` | Judge-facing UI for comparison |

## 9. Functions / modules / routes / CLI

- `comparePolicyCandidate(...)` — dual path compare
- `signWalletCandidate` / `buildSponsored` — construct+sign
- Playground HTTP admission endpoints under `src/playground/http.mjs`
- CLI: `node bin/framefuzz.mjs serve …`, scenario/mutate commands per README
- Modes: `SAVED_DEMO`, `LIVE_READ_ONLY`, `LIVE_AUTHORIZED`

## 10. Contracts / chain

| Item | Value |
|---|---|
| Chain ID | **1337** |
| Foreign fixture | `0x6d5bed568904290fca0b8d4e99bed2a7f9d44145` |
| ViolatingWallet | `0x6b7206fa6fc5fe541061bdedf2c6a2bbf4cf8199` |
| Staking registry | `0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f` |
| Operator | `0x366E6203603C39Eec1e75b3be6f078911447f235` |
| Uniswap paymaster | `0x3df63DFD230156C3656Bd4448326482030c31f96` |

Full tables: [CONTRACT_ADDRESSES.md](../submission/CONTRACT_ADDRESSES.md)

## 11. Transaction hashes / keys

| Hash | Meaning |
|---|---|
| `0xf69e0f4b87827d8d5d295188d10e7672b2bace87e6ac8d09916758bee155e31d` | Policy divergence; alt admit **1647**; later **DROPPED**; **no inclusion claim** |
| `0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067` | Uniswap path; canonical reject; alt admit **2065** + OnChain |
| `0xd4d6123f…` / `0xc05703ac…` | Self-relay canonical inclusion — not clean dual policy split |

## 12. Evidence files

| File | Proves |
|---|---|
| `evidence/live/2026-11-07/storage-access-live.json` | StorageReadNonSender vs Skandha accept id 1647 → dropped |
| `evidence/live/2026-11-07/uniswap-policy-divergence-final.json` | StateView validation-time policy split |
| `evidence/admission/2026-11-07/self-relay-*.json` | Inclusion without claiming policy divergence |

## 13. Tests

Node suite covers admission, gateway policy wrappers, reserve deployment, playground paths. Observed **2026-11-07**: 236 pass / 3 fail of 239. See [GAP_MATRIX.md](../submission/GAP_MATRIX.md).

## 14. Browser / UI

Contract Playground → analyze supported scenario → authorized dual admission → canonical vs alternative verdicts. Comparisons / Evidence pages for saved runs.

## 15. Reproduce

Follow [DEMO_RUNBOOK.md](../submission/DEMO_RUNBOOK.md). Requires `FRAMEFUZZ_*` RPC envs + deployer key for `LIVE_AUTHORIZED`, funded/staked fixtures on 1337.

## 16. Verified LIVE

- Dual-path policy divergence (`0xf69e0f4b…`)
- Uniswap StateView paymaster divergence with alt inclusion (`0x72a82645…`)
- Self-funded canonical inclusion hashes (separate claim class)

## 17. Historical / simulated / prepared only

- Saved-demo UI mode (no fresh chain)
- Agent Sonnet trails when not re-run this session
- Older gas-suite historical admissions

## 18. Limitations / blockers

- Public GitHub currently **not anonymously reachable** (HTTP 404 on origin URL at audit time)
- Devnet resets invalidate addresses
- Arbitrary Solidity ≠ supported EIP-8141 execution
- 3 Node tests failing as of audit run

## 19. Sponsor-specific demo

Lead with storage-access divergence; say admission ≠ inclusion; optionally show Uniswap path as second divergence class; show code in `policy-comparison.mjs` / `live-admission.mjs`.

## 20. External feedback / forms

No separate Uniswap-style form for this EF prize beyond ETHGlobal portal materials + explorer/code proof. Confirm any booth QR / feedback at submit time on the prize page. **CROPS** requires a README `CROPS` section + ≤3 min video only if that prize is selected.
