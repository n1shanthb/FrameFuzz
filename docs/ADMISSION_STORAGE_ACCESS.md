# Fresh live storage-access admission

**Executed** after explicit approval. Live evidence: `evidence/live/2026-11-07/storage-access-live.json`. Packet SHA-256: `6c55073e8f579b86eb58a515fb690fa6165e43c223c5c7388ed909fb40a0a6b4`.

| Field | Value |
|---|---|
| ethrex | `REJECTED_POLICY` — `StorageReadNonSender` |
| Skandha | `ACCEPTED` — admission id 1647 |
| Hash | `0xf69e0f4b87827d8d5d295188d10e7672b2bace87e6ac8d09916758bee155e31d` |
| Wallet / Foreign | `0x6b7206fa…8199` / `0x6d5bed56…4145` |
| Inclusion | Not mined (admission ≠ inclusion; later mempool dropped) |

---

## Preparation packet (historical)

Deadline priority prep. Packet path: `evidence/prepared/2026-11-07/storage-access-approval-packet.json`.

## 1. Exact minimum setup and transaction count

Workshop-aligned sequence (10 operator actions, **4 on-chain write classes** after funding):

| # | Action | Count |
|---|---|---|
| 0 | Fund operator EOA | 1 transfer (or faucet) |
| 1 | Deploy `Foreign` | 1 legacy create |
| 2 | Deploy `ViolatingWallet(owner, foreign)` with **0.03 ETH** creation value | 1 create |
| 3 | Stake wallet via frame `VERIFY(clean)+SENDER(addStake(86400))` with **0.012 ETH** | 1 frame tx |
| 4 | Sign one policy candidate (`VERIFY data=0x01`) | offline |
| 5 | Submit **same** signed bytes to ethrex, then (only after policy reject + unchanged nonce) to Skandha | 1–2 submissions |

**Same signed transaction identity** on both paths. No parallel race.

## 2. Source and deployment binding

- Paste: `examples/contracts/StorageAccessValidator.sol`
- Select contract: `ViolatingWallet` (companion `Foreign` in same file)
- Compiler: solc 0.8.28, optimizer 200, HegotaSupport imports from local `@forshtat/hegota-support` only
- Detected role: `SENDER_VALIDATOR` / capability `LIVE_STORAGE_ACCESS_ADMISSION`
- Runtime bytecode hash (source-bound): `0xa0b282997f1eacc54f302d398988e4cae8124b9fc8fd0ca3c2e2f21d326ec1ea`
- On-chain code must keccak256-match that hash before Prepare is allowed

Arbitrary Solidity is **not** live-tested. This one labeled interface is.

## 3. Required stake / funding

- Entity staked: the **ViolatingWallet address itself** (not the EOA), via SENDER→`NaiveStakingRegistry.addStake`
- Registry: `0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f`
- Stake: **0.012 ETH** (> minStake 0.01), unstake delay **86400** s
- Wallet creation funding: **0.03 ETH** (workshop `violatingWalletFundingEth`)

## 4. Maximum test ETH spend

Conservative ceiling in the packet: **≈ 0.079 ETH top-up** on top of current sender balance `0.000419592` (max exposure ≈ **0.0802 ETH** including create gas at 3 gwei × 6M × 2, wallet value, stake, policy gas). Stake **locks** 0.012; not all exposure is burned.

## 5. Current chain readiness (read-only, head ~9507)

| Check | Result |
|---|---|
| Canonical `https://altmempool.forshtat.com` | ethrex / chain 1337 READY |
| Alternative `https://altmempool.forshtat.com/rpc/` | skandha/v4.1.1 READY |
| Workshop gateway | also Skandha (manual bundling); FrameFuzz keeps identity-based ethrex vs `/rpc/` routing |
| Staking registry code | present (1259 bytes) |
| Operator sender `0x366E…f235` | balance 0.000419592, nonce 2, empty code — **needs top-up** |
| Deployed ViolatingWallet | none yet → classification `BLOCKED_PRECONDITION` |

## 6. One simple approval packet

Approve **exactly** the sequence in `evidence/prepared/2026-11-07/storage-access-approval-packet.json` (digest above):

1. Top-up operator EOA by the stated wei  
2. Deploy Foreign + ViolatingWallet (verify runtime hash)  
3. Stake wallet 0.012 / 86400  
4. One rejection-first live comparison of one signed candidate  

Any nonce/gas/hash/runtime drift requires a **replacement packet**. No silent retries.

## 7. Tests

`node --test test/live-admission.test.mjs test/policy-comparison.test.mjs test/playground-admission.test.mjs` → **12/12** pass (compile+role+bytecode, wallet identity, readiness blockers, rejection-first race gates, QuotaVault remains non-live).

## 8. Exact recording workflow

1. Operator host only: `FRAMEFUZZ_OWNER_KEY=… node --env-file=.env bin/framefuzz.mjs serve --mode LIVE_AUTHORIZED --results runs --port 4190`
2. Paste `StorageAccessValidator.sol` → select `ViolatingWallet` → **Detect / Analyze**
3. After you approve and the setup writes land, enter wallet / foreign / owner → **Refresh live readiness**
4. **Prepare fresh admission experiment** → review hash/nonce/endpoints  
5. **Run Live Comparison** (confirms exact hash; ethrex first, then Skandha)  
6. Table must show LIVE provenance, `StorageReadNonSender` vs accepted + sidecar admission id + inclusion if mined  

Judges never receive the signing key. No OpenRouter. No Arkiv/Uniswap changes for this path.
