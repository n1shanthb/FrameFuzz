# Demo runbook — FrameFuzz (live where claimed)

**Audience:** judges / teammates recording the ETHGlobal demo video.  
**Deadline context:** submit before **09:00 IST, 7 Nov 2026**.

## Preconditions

| Need | Notes |
|---|---|
| Node 20+ | `npm install` / `npm start` per README |
| Operator signing env | Names only — never show values on stream |
| EF chain 1337 RPC reachability | Canonical ethrex + Skandha URLs configured |
| Optional Arkiv Rabdi | Writer key + RPC for publish; read-only query works with public RPC if configured |
| Optional OpenRouter | Agents; skip agent segment if no credits |
| Supported Solidity sample | Use repo-supported scenario (ViolatingWallet / ReserveReadingPaymaster) — **not** arbitrary paste claiming full EIP-8141 execution |

If EF devnet or Rabdi is down: show historical evidence JSON from `evidence/` and label it **HISTORICAL**, then continue UI walkthrough. Do not fake live RPC responses.

## Script (≈8–12 minutes)

### 1. Open FrameFuzz
- Start server; open local UI (or public host if verified).
- State tagline: **Break the tx before the mempool does**.

### 2. Paste supported Solidity
- Contract Playground → paste a **supported** sample (storage-access or paymaster path).
- Say aloud: arbitrary Solidity is analyzed best-effort; only supported scenarios get honest dual admission.

### 3. Analyze real compiler facts
- Run Analyze. Show compiler version, bytecode/facts, binding if present.
- Point at source digest for ReserveReadingPaymaster when on Uniswap path: `85a4891e…`.

### 4. Generate feasible mutation
- Run mutation / feasibility. Show rejected infeasible ideas if UI exposes them.
- Emphasize feasibility gate before signing.

### 5. Fresh authorized EIP-8141 admission comparison
- Trigger **live** dual admission (operator-authorized).
- Confirm UI shows **one transaction identity** for both paths.

### 6. Canonical verdict
- Expect policy rejection class such as `REJECTED_POLICY` / `StorageReadNonSender` on ethrex for the storage-access demo.
- Read the raw error message on screen.

### 7. Skandha alternative
- Show `ACCEPTED` (or richer status) and admission ID when returned.
- Reference prior LIVE example id **1647** only if replaying history; prefer the fresh id from this run.

### 8. Divergence vs inclusion
- Say explicitly: **admission ≠ inclusion ≠ execution**.
- For storage-access LIVE classic: later status may be `DROPPED` — **do not claim inclusion**.
- If Uniswap path returns alt `OnChain`, say that is a **different** evidence class than `0xf69e0f4b…`.

### 9. Agent evidence (optional)
- Open Agents page; show Scout → Mutation → Validator → Critic trail **only if** this run actually called models.
- Otherwise open saved agent evidence and label it.

### 10. Arkiv publish / query / import
- Publish regression (operator) **or** open existing entity `0xf1089c05…`.
- Run a **fresh query** (not only cached fallback).
- Import unsigned regression and show local replay inputs without re-broadcast unless authorized.

## Repeatability matrix

| Step | Repeatable now? | Blockers |
|---|---|---|
| UI analyze / mutate | Yes (local) | None |
| Dual admission | Yes if RPCs + key + stake/gas | EF devnet down; empty balance; stake rules |
| Storage-access divergence | Yes for supported scenario | Same |
| Uniswap StateView path | Yes if contracts still deployed/funded | Redeploy/stake if state wiped |
| Canonical inclusion demos | Needs funding + scenario | Gas/stake |
| Arkiv publish | Operator key + Rabdi | Permissions |
| Arkiv query/import | Yes with RPC | Network |
| Swarm storage | **No** | Not implemented |
| Agents | Needs model API credit | OpenRouter |

## Graceful failure lines (use verbatim if needed)

- “Canonical gateway unreachable — showing last verified evidence file and continuing with architecture.”
- “Alternative mempool timeout — we still have the signed identity and canonical verdict.”
- “Arkiv query failed — here is the publish receipt and content digest for integrity; import uses saved payload.”

## Do not do on stream

- Paste private keys or `.env`
- Claim Swarm storage
- Claim Uniswap swap/LP/USDC
- Claim inclusion for `0xf69e0f4b…`
- Broadcast mainnet or real-fund txs
