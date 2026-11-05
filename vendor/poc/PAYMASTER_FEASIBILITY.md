# PAYMASTER_FEASIBILITY.md

## VERDICT: **PARTIAL**

Admission differential testing with **real Uniswap v4 predeploys** (StateView → PoolManager storage) **works** on the official public devnet documented at [docs.altmempool.wtf/guides/devnet/](https://docs.altmempool.wtf/guides/devnet/). **Plain ETH gas sponsorship** (0-ETH sender, paymaster payer) was **admitted and executed on-chain**. The full **USDC fee + swap-via-AMM execution lifecycle is not verified** on this devnet today because the documented WETH/USDC v4 pool has **zero price/liquidity after the Oct 2025 devnet reset** (`getSlot0` returns zeros). **`https://gateway1.altmempool.wtf` was unreachable** (TLS failure from the test agent); all live tests used **`https://altmempool.forshtat.com/rpc`** (sidecar) and **`https://altmempool.forshtat.com`** (ethrex), chain ID **1337** (`0x539`).

---

## Step 0 — FAST GATE (first result)

**Question:** Do otherwise identical paymaster frame txs differ on admission when the paymaster VERIFY frame reads Uniswap pool state vs not (unstaked, then staked)?

**Answer: YES** (once paymasters are funded with sufficient creation value — see below).

| Case | Alt mempool (`eth_sendFrameTransaction`) | Canonical (`eth_sendRawTransaction` via gateway) |
| --- | --- | --- |
| Plain paymaster, unstaked | **ACCEPTED** | **ACCEPTED** |
| Reserve read (`StateView.getSlot0`), unstaked | **REJECT** — `unstaked payer accessed 0x6bF9…9848 slot 0xf6a8…` (**STO**) | **REJECT** — `StorageReadNonSender` (**STO**) |
| Reserve read, **after paymaster staked** | **ACCEPTED** | **REJECT** — `StorageReadNonSender` (intended public vs alt policy) |

Evidence JSON: [`poc/evidence/fast-gate-final.json`](poc/evidence/fast-gate-final.json), [`poc/evidence/reserve-staked-after-stake.json`](poc/evidence/reserve-staked-after-stake.json).

**Staked reserve-read admitted tx:** `0x93049c5d14580f74803800374146fda52bb4e2e4bd3fa179a5819ea916b69f83` — admission **accepted**; receipt **`status: 0x1`**, block **`0x6340c`** (mined during polling).

**Plain sponsorship executed tx:** `0xc9b27a980b3741b299e54d0053fa91871db6b929b4b8e3222860a502d8c65132` — receipt `status: 0x1`, block `0x63404`, `payer: 0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30` ([explorer](https://explorer.altmempool.wtf/) search by hash).

**Gateway note:** User requested `gateway1.altmempool.wtf`; ETHGlobal/devnet docs list `altmempool.forshtat.com` ([devnet guide](https://docs.altmempool.wtf/guides/devnet/)). `gateway1` failed with `SSL_ERROR_SYSCALL` (Nov 6, 2026). **UNVERIFIED** whether Mumbai hackathon gateway1 works on-site.

---

## Step 1 — Devnet verification

| Check | Result | Source / RPC |
| --- | --- | --- |
| Sidecar gateway | OK | `POST https://altmempool.forshtat.com/rpc` → `eth_chainId` = `0x539` |
| Execution RPC | OK | `POST https://altmempool.forshtat.com` |
| Block production | OK | `latest` block `0x63404`+ with non-zero `gasUsed` during tests |
| Faucet | **Disabled** on this node | `skandha_explorer_faucet` → disabled message |
| Funding | Genesis / deployer premine transfers | [genesis.values.env](https://github.com/forshtat/mempool-workshop-sidecar/blob/main/deploy/devnet/genesis.values.env), [devnet.md deployer key](https://github.com/forshtat/mempool-workshop-sidecar/blob/main/deployments/devnet.md) |
| Contract deploy | OK | Foundry + workshop `deployContract` (~6M gas) |
| Frame admission | OK | `eth_sendFrameTransaction` |
| Receipts | **Intermittent then OK** | Plain sponsor receipt observed after ~12–120s; earlier runs stuck at `mempool status: New` |
| Uniswap bytecode | **Real predeploys present** | See [sidecar `deployments/devnet.md`](https://github.com/forshtat/mempool-workshop-sidecar/blob/main/deployments/devnet.md) |

**Bytecode checks (Nov 6, 2026):**

| Contract | Address | Code length (hex chars) |
| --- | --- | --- |
| USDC | `0xEFe0D421fD473564c9C9b0cDCeB194cF476D6AF5` | 4374 |
| WETH9 | `0x1b7d32025F7cA633943BbCC9Ec61a98ef66187b6` | 6250 |
| Uniswap v4 PoolManager | `0x6bF9Aa9c04fd001385742d61f6818C3236429848` | 24009 |
| Uniswap v4 StateView | `0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB` | 3531 |
| Universal Router | `0x5e2250a42608a5cc9f62e23ab24824ee25b5e2be` | 48762 |

**No Uniswap V2 factory** on this devnet (Universal Router’s v2/v3 paths point at mainnet addresses with no local counterpart — [devnet.md](https://github.com/forshtat/mempool-workshop-sidecar/blob/main/deployments/devnet.md)). **Do not deploy a homemade “Uniswap”**; we used **official v4 StateView** for reserve/slot reads.

**Pool state:** `StateView.getSlot0(0x784bd787…6048)` returned **all zeros** — pool **not initialized / liquidity absent** after reset (consistent with devnet.md “WETH9/USDC pool … state … is gone”).

---

## Step 2 — Smallest real sponsorship flow

**Implemented and verified (partial):**

1. Deploy `SponsorPaymaster` with **0.15 ETH** creation value (0.01 ETH left **0 balance** on paymaster — HegotaSupport helper creation consumes value; **workshop default underfunds** for this devnet).
2. Sender EOA with **0 ETH**; paymaster pays via `[VERIFY exec, VERIFY payment on paymaster, SENDER transfer]`.
3. **Executed on-chain** — see receipt for `0xc9b27…` above (`payer` = paymaster, 3 successful frame receipts).

**Not verified (blocked):**

- User holds **USDC**, 0 ETH → paymaster reads **Uniswap v4** pricing → user pays USDC in execution → **swap USDC→WETH** via router/pool.

**Blocking reason:** v4 **WETH/USDC pool not live** (`getSlot0` zero). Re-seeding liquidity requires deployer-driven `PositionManager` flow (documented in devnet.md, **not run in this session** — would add ~hours). **V2 deploy is the wrong fit** for this chain’s official Uniswap stack.

**Contract added:** `ReserveReadingPaymaster.sol` — VERIFY calldata `0x01` calls real `StateView.getSlot0(POOL_ID)`; empty calldata = plain payment approval.

---

## Step 3 — Admission boundary cases

| Case | Expected rule / behavior | Alt verdict | Canonical verdict | Tx hash (computed or returned) |
| --- | --- | --- | --- | --- |
| (a) Plain paymaster, no external read | Solvency + prefix rules | **Admit** | **Admit** | `0xc9b27a980b3741b299e54d0053fa91871db6b929b4b8e3222860a502d8c65132` |
| (b) Uniswap reserve read, unstaked | STO / external storage | **Reject** STO | **Reject** STO | `0x968ca3aa848c60febf364f5c8f6f652243f23493eb992f4bddf102fd0a697501` |
| (c) Same read, staked paymaster | Alt relaxes storage for staked entity ([workshop pattern](https://docs.altmempool.wtf/guides/quickstart)) | **Admit** | **Reject** STO (expected) | `0x93049c5d14580f74803800374146fda52bb4e2e4bd3fa179a5819ea916b69f83` |
| (d) Invalid verify gas (broken test harness) | Reject | Reject (bad sig in batch run) | Reject | See [`paymaster-feasibility.json`](poc/evidence/paymaster-feasibility.json) |

**Stake tx:** `0xdc7d5fca492f3b4ca238bee64180e9f24c3778bad7f39ddee4e7a69aa22f5383` — admitted, mined block `0x63407`, registry stake **0.012 ETH** on paymaster `0x552e75d45ee70f09ff69f465ddc4264e6ee31396`.

Debug admission reports: `cd poc/workshop-ref && npm run step_11_debug -- <hash>`.

---

## Step 4 — Execution / accounting proof (successful plain sponsorship)

**Tx:** `0xc9b27a980b3741b299e54d0053fa91871db6b929b4b8e3222860a502d8c65132`

| Field | Value |
| --- | --- |
| Receipt status | `0x1` (success) |
| Block | `0x63404` |
| Payer | `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30` (plain paymaster) |
| Paymaster ETH after | ~0.149945012 ETH (paid gas; from [`fast-gate-final.json`](poc/evidence/fast-gate-final.json)) |

**USDC / pair reserves:** Not measured for a completed swap — **UNVERIFIED**. Deployer USDC balance readable (~1B USDC nominal on devnet); mint-to-user + swap **not executed**.

---

## Step 5 — Sponsor stack assessment

### Ethereum Foundation (alt mempool)

**Genuinely exercised:** `eth_sendFrameTransaction`, admission reports, canonical vs alt differential, one **mined** sponsored frame tx with paymaster as `payer`. Qualification “admitted tx or submitting code” is met ([prizes](https://ethglobal.com/events/mumbai/prizes)).

### Uniswap

**Essential for the reserve-read gate:** paymaster staticcall to **Uniswap v4 StateView** pulls **PoolManager** storage (`0x6bF9…` slot shown in rejection text). **Not essential** for plain sponsorship. **Do not claim a live swap demo** without re-initializing the v4 pool. **Recommend:** FrameFuzz scenarios around **v4 StateView admission**, not “ERC20 swap sponsorship” unless pool is re-seeded on-site with EF help.

### Arkiv

**Honest fit:** store reproducible admission fixtures (tx envelope, expected STO outcome, gateway URL, block height). **No Arkiv integration built** in this run. Does not require swap execution.

---

## Can we honestly build **EF + Uniswap + Arkiv** FrameFuzz at ETHGlobal Mumbai?

**Partially.**

- **Yes:** FrameFuzz as **admission differential fuzzer** with scenarios `plain-paymaster`, `uniswap-v4-slot-read-unstaked`, `uniswap-v4-slot-read-staked`, plus mined plain sponsor demo — on **`altmempool.forshtat.com`** (or whatever gateway EF enables on-site if `gateway1` is fixed).
- **No (without extra work):** marketing a **full USDC-paid gas + Uniswap swap** story on the official devnet today; **drop or defer Uniswap track swap claims** until pool liquidity is restored or EF re-seeds the documented WETH/USDC v4 pool ([devnet.md Pools section](https://github.com/forshtat/mempool-workshop-sidecar/blob/main/deployments/devnet.md)).
- **Arkiv:** optional third sponsor only if you publish fixture hashes + repro CLI; **not proven here**.

**Three-sponsor eligibility:** Admission alone does **not** prove Uniswap or Arkiv prize requirements — only EF alt-mempool usage is demonstrated.

---

## Reproduce

```bash
git clone https://github.com/forshtat/mempool-workshop.git poc/workshop-ref
cd poc/workshop-ref && npm install --legacy-peer-deps
# Install Foundry; forge install in contracts/
npm run build:contracts
# Copy scripts from this repo poc/scripts/ into workshop-ref/scripts/
export PATH="$HOME/.foundry/bin:$PATH"
npx tsx scripts/fast_gate_rerun.ts          # gate + plain execution wait
npx tsx scripts/reserve_staked_only.ts      # after stake mined on reserve PM from gate output
npm run step_11_debug -- 0x<c9b27...>      # admission + receipt
```

**RPCs**

- Gateway: `https://altmempool.forshtat.com/rpc`
- Execution: `https://altmempool.forshtat.com`
- Chain ID: `1337`
- Explorer: `https://explorer.altmempool.wtf/`

**Logs / artifacts**

- [`poc/evidence/fast-gate-final.json`](poc/evidence/fast-gate-final.json)
- [`poc/evidence/paymaster-feasibility.json`](poc/evidence/paymaster-feasibility.json) (failed early funding — **superseded** by fast gate)
- [`poc/evidence/reserve-staked-after-stake.json`](poc/evidence/reserve-staked-after-stake.json)

**Failed attempts documented**

- `gateway1.altmempool.wtf` TLS failure.
- Paymaster deploy with `0.01 ETH` → **0 wei** paymaster balance → solvency reject.
- Faucet disabled on public gateway.
- First reserve-read tests signed **after** mutating frame data → invalid signature.
- Full USDC swap path **not attempted** (empty v4 pool).

---

## Narrowest valid workarounds

| Blocker | Workaround |
| --- | --- |
| Empty v4 pool | On-site: rerun devnet.md pool seeding with deployer key, **or** demo admission-only Uniswap read without swap |
| gateway1 unreachable | Use documented `altmempool.forshtat.com/rpc`; ask EF for Mumbai gateway URL |
| Underfunded paymaster | Fund with **≥ 0.15 ETH** at deploy creation value |
| Inclusion latency | Demo admission + `step_11_debug`; keep explorer link for txs that mined (plain sponsor) |

**Do not** move swap demos to a private chain and claim official devnet execution.
