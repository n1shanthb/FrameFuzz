# Current status — live StorageReadNonSender divergence captured

Deadline priority completed for the **fresh** public-vs-alternative storage-access demo (not historical Uniswap/self-relay rows).

## Live result (chain 1337)
| Path | Verdict |
|---|---|
| ethrex `eth_sendRawTransaction` | `REJECTED_POLICY` — `StorageReadNonSender` |
| Skandha `eth_sendFrameTransaction` | `ACCEPTED` — sidecar admission id **1647** |
| Divergence | `POLICY_DIVERGENCE` |
| Inclusion | Not mined; explorer later showed mempool `dropped` (admission ≠ inclusion) |

- Evidence: `evidence/live/2026-11-07/storage-access-live.json`
- Packet: SHA-256 `6c55073e8f579b86eb58a515fb690fa6165e43c223c5c7388ed909fb40a0a6b4`
- Tx: `0xf69e0f4b87827d8d5d295188d10e7672b2bace87e6ac8d09916758bee155e31d`
- Wallet: `0x6b7206fa6fc5fe541061bdedf2c6a2bbf4cf8199` (Foreign `0x6d5bed56…4145`), staked 0.012 ETH / 86400
- Funding: gateway faucet 1 ETH (`0xac29dccb…0cfc`); operator nonce started at 2 as packeted
- Runtime bind: on-chain code matches solc template after immutable-slot mask (`IMMUTABLE_SLOTS`)
- OpenRouter/Arkiv/Uniswap: untouched

## Verification
Focused admission tests 12/12 after immutable-binding fix. Provenance LIVE only.
