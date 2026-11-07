# Contract addresses & transaction proofs

All entries below are taken from repository evidence. Explorer links are omitted unless the repo already records a working public explorer URL for that network. **Do not treat predicted CREATE addresses as deployed.**

## EF frame-tx chain (chain ID **1337**)

| Network | Chain ID | Contract / account | Address | Purpose | Deploy tx | Bytecode verified? | Funding/stake | Source | Evidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| EF ethrex frame-tx | 1337 | Reserve (token) | `0x3d66c53105be7930fd89571157a41137c12b003f` | Stake/reserve asset used in paymaster flows | `0xb6df27ca069439f8ca7009a0a5a4ba111a37d2c569bd73e330477a1c4ac108ad` | Yes — `codeHash` in evidence | Operator-funded on 1337 | Reserve deployment pipeline | [`evidence/live/2026-11-06/reserve-deployment.json`](../../evidence/live/2026-11-06/reserve-deployment.json) | LIVE historical |
| EF ethrex frame-tx | 1337 | ReserveReadingPaymaster | `0x3df63DFD230156C3656Bd4448326482030c31f96` | PAYMENT VERIFY → StateView.getSlot0 | Deploy `0xddd9925994b02afe443f9804fb2f361aa595e2509b1d98b5339d57b040694032`; stake `0x88f2a4ec59df362a47ee65e20f4430495763e8be567de3ab014d0657ccbed251` | Runtime matched compiled artifact; source digest `85a4891e08085f09d8c23df2a67e455d8f1e130e7c4bcbe17de6966ed9cf43ec` | Staked 0.01 test ETH / 86400 delay (see evidence) | [`vendor/paymaster/ReserveReadingPaymaster.sol`](../../vendor/paymaster/ReserveReadingPaymaster.sol) | [`evidence/live/2026-11-07/uniswap-policy-divergence-final.json`](../../evidence/live/2026-11-07/uniswap-policy-divergence-final.json) | LIVE |
| EF ethrex frame-tx | 1337 | Uniswap v4 StateView (external) | `0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB` | Validation-time pool slot0 reads | Not FrameFuzz-owned | Runtime hash pinned in `examples/live/devnet.json` | N/A | `src/adapters/uniswap-state.mjs` | FEEDBACK.md + Uniswap evidence | LIVE binding checks |
| EF ethrex frame-tx | 1337 | Uniswap v4 PoolManager (external) | `0x6bF9Aa9c04fd001385742d61f6818C3236429848` | Storage backing StateView | Not FrameFuzz-owned | Bound via StateView.poolManager() | N/A | same | same | LIVE binding checks |
| EF ethrex frame-tx | 1337 | ViolatingWallet | `0x6b7206fa6fc5fe541061bdedf2c6a2bbf4cf8199` | Storage-access divergence subject | Deploy `0xa30017366a7cfcc86a1618a59d20118135617fa23e41a5c0c1fb21a52d77e744` | Runtime verify in evidence | Staked | storage-access product | [`storage-access-live.json`](../../evidence/live/2026-11-07/storage-access-live.json) | LIVE |
| EF ethrex frame-tx | 1337 | Foreign fixture | `0x6d5bed568904290fca0b8d4e99bed2a7f9d44145` | Non-sender storage target | `0xb1703856dfb91ff894fae18ef6b69db41a28e809f088e98fc7322fddc6f3e81c` | Yes | N/A | same | same | LIVE |
| EF ethrex frame-tx | 1337 | Staking registry | `0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f` | ERC-7562-style stake | Stake tx in storage-access evidence | N/A | Wallet stake 0.012 test ETH | wallet-codec | storage-access-live.json | LIVE |
| EF ethrex frame-tx | 1337 | Operator | `0x366E6203603C39Eec1e75b3be6f078911447f235` | Sign and submit authorized frame txs | N/A | N/A | Devnet faucet/funding only | Env `FRAMEFUZZ_DEPLOYER_KEY` (name only) | evidence JSON | LIVE ops — keys never committed |

### Uniswap v4 reads (external, not FrameFuzz-owned)

| Name | Role | Notes |
|---|---|---|
| StateView | `getSlot0(poolId)` during validation | Addresses embedded in paymaster / evidence; must match EF chain 1337 deployment used by the demo |
| PoolManager | Pool state backing StateView | Not a FrameFuzz deploy; read-only validation-time access |
| Pool ID | Bytes32 pool id in calldata | Recorded in Uniswap divergence evidence |

**Claims we do not make:** Uniswap swaps, liquidity provision, initialized trading-pool UX, USDC reimbursement — unless a specific evidence file proves them (current package: validation-time StateView read only).

## Arkiv Rabdi (chain ID **7794095**)

| Network | Chain ID | Name | Address / key | Purpose | Tx | Evidence | Status |
|---|---|---|---|---|---|---|---|
| Arkiv Rabdi | 7794095 | Writer | `0x20370BE5BA867Ab4779ad0686963A55ADc0722b1` | Operator-authorized entity publisher | N/A (EOA) | publish-receipt | LIVE |
| Arkiv Rabdi | 7794095 | Entity | `0xf1089c05e4a7ec4d3a66087381c1c78b43728a836e4ae10eb694cfd6ce2a06a1` | `framefuzz.regression.v1` regression | `0x007bd10f4d720a124c4dd0b44449f235b32f364a4b68e7657917f1717a307c00` | [`evidence/arkiv/2026-11-07/publish-receipt.json`](../../evidence/arkiv/2026-11-07/publish-receipt.json) | LIVE |
| Content digest | — | — | `0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25` | Integrity of published payload | — | Same receipt + query evidence | LIVE |

## Prepared / not broadcast

| Item | Status |
|---|---|
| Predicted CREATE addresses without broadcast receipt | **Not listed as deployed** |
| Ethereum Swarm Bee postage / content refs | **NOT IMPLEMENTED** |
| Historical deployments no longer present on chain | Mark HISTORICAL in evidence filenames; do not re-list as current without refresh |

## Transaction-proof table

| Transaction hash | Network | Purpose | Result | Receipt / report | Evidence path |
|---|---|---|---|---|---|
| `0xf69e0f4b87827d8d5d295188d10e7672b2bace87e6ac8d09916758bee155e31d` | 1337 dual-path | Storage-access policy divergence | Canonical REJECTED_POLICY StorageReadNonSender; Alt ACCEPTED id 1647; later DROPPED | Dual responses in JSON | `evidence/live/2026-11-07/storage-access-live.json` |
| `0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067` | 1337 dual-path | Uniswap StateView paymaster divergence | Canonical REJECTED_POLICY StorageReadNonSender; Alt ACCEPTED_AND_INCLUDED (report OnChain) | comparison block | `evidence/live/2026-11-07/uniswap-policy-divergence-final.json` |
| `0xd4d6123f6b142acccb5cf6c302877fe7a1ed499bd3bfb0263c70763febbba226` | 1337 | Self-relay / inclusion | Canonical inclusion path | admission comparison | `evidence/admission/2026-11-07/self-relay-first-comparison.json` |
| `0xc05703acca2def2f89567ac33618b48a44b7eb021c2db0023e5f3b90227ba510` | 1337 | Self-relay corrected comparison | Canonical inclusion / execution evidence | admission comparison | `evidence/admission/2026-11-07/self-relay-corrected-comparison.json` |
| `0xb6df27ca069439f8ca7009a0a5a4ba111a37d2c569bd73e330477a1c4ac108ad` | 1337 | Reserve deployment | status 0x1, contract created | receipt | `evidence/live/2026-11-06/reserve-deployment.json` |
| `0x007bd10f4d720a124c4dd0b44449f235b32f364a4b68e7657917f1717a307c00` | 7794095 | Arkiv createEntity publish | Entity created | publish-receipt | `evidence/arkiv/2026-11-07/publish-receipt.json` |

### Distinctions (mandatory)

- `0xf69e0f4b…` → **policy divergence only** (no inclusion / frame execution claim).
- `0xd4d6123f…` / `0xc05703ac…` → **canonical inclusion/execution**, not clean dual-path policy difference.
- `0x72a82645…` → Uniswap-path divergence with alternative report `OnChain` — still separate from the storage-access ViolatingWallet demo.

## Arkiv entity keys

| Entity key | Chain | Content digest | Writer | Publish tx |
|---|---|---|---|---|
| `0xf1089c05e4a7ec4d3a66087381c1c78b43728a836e4ae10eb694cfd6ce2a06a1` | 7794095 | `0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25` | `0x20370BE5BA867Ab4779ad0686963A55ADc0722b1` | `0x007bd10f4d720a124c4dd0b44449f235b32f364a4b68e7657917f1717a307c00` |
