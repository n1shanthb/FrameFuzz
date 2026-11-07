# Step 2E — source-driven policy-divergence preparation

Preparation-only checkpoint, November 7, 2026 IST. No transaction, funding, deployment, stake, Arkiv write, paid model call or Git push occurred.

## Minimum experiment

No new user-pasted Solidity was supplied in this step. The selected owned source is explicitly the supplied `vendor/paymaster/ReserveReadingPaymaster.sol`, not a substitute presented as user input.

The contract's PAYMENT VERIFY path receives calldata `0x01` and calls the genuine Uniswap v4 `StateView.getSlot0(poolId)` before approving payment. After the paymaster is staked, the predicted policy difference is:

- Canonical ethrex: reject `StorageReadNonSender`.
- Alternative Skandha: permit the staked external read and accept.

These remain predictions until both live observations exist for the same signed candidate. The expected difference is intended policy behavior, not a vulnerability.

Source SHA-256: `85a4891e08085f09d8c23df2a67e455d8f1e130e7c4bcbe17de6966ed9cf43ec`. The source was freshly compiled with solc `0.8.28`, optimizer enabled at 200 runs. Generated artifact: `artifacts/step2e/ReserveReadingPaymaster.json`; creation bytecode hash `0xd2196e…44f0`, creation-data hash `0x509f1f…3eb5`. A read-only creation `eth_call` produced the exact expected 936-byte runtime hash `0x45603f…88fd`, binding the constructor's StateView and pool ID.

The older supplied artifact did not byte-match this compiler configuration and is not used by the new packet.

## Live readiness and required setup

Current StateView and PoolManager hashes still match their pinned deployments. However, every historical basic/staked/unstaked paymaster address now has empty code and zero balance. Therefore this experiment requires:

1. One deployer top-up.
2. One reserve-paymaster deployment with constructor funding.
3. One stake transaction for 0.01 test ETH and 86,400-second delay.
4. The rejection-first policy comparison.

The existing wallet `0x366E…f235` has `0.000419592` test ETH and nonce 2. It is **not sufficiently funded**. The read-only plan requires a `0.024917785` top-up, after which its maximum deployment debit is `0.025337377` test ETH. Predicted contract: `0x6d5bED568904290fCA0b8d4e99Bed2a7F9D44145`.

Live deployment estimate: 3,289,967 gas; approval gas limit: 4,112,459. The 3-gwei cap exceeds the observed 2.4-gwei quote. Constructor value is 0.013 test ETH, sufficient for the 0.01 stake plus two 0.0015 gas reserves.

## Exact prepared identities

- Deployment: `0x04578a20d8f19fa80af9ff57a66a82ec4fd166d0cbbaa776b2042f3ab81598cd`
- Stake: `0x6211e4c543a2324e0d441c9be7d2390fd18ccc8a73a1623872b817d256d294e6`
- Policy candidate: `0x2c91a12ddf22ebb870ed1672ff040600d52f3d02b0089c2d37b4da403d6ab12d`
- Policy sender: `0xE3cfC223B49708B11B9bEdFf1C0B9711E1F0ddEE`, nonce 0
- Paymaster/payer: predicted contract above

Raw deployment/stake envelopes and the policy candidate are saved under `evidence/prepared/2026-11-07/`; no private key is included.

## Rejection-first protocol and table

`src/policy-comparison.mjs` enforces:

1. Optional ethrex simulation labeled `SIMULATION_ONLY`.
2. Canonical submission first, followed by its final response.
3. Alternative submission only after a classified canonical policy rejection, unchanged sender nonce and null canonical receipt.
4. Exact signed identity on both paths.
5. `POLICY_DIVERGENCE` only when canonical has a real policy rejection and Skandha returns acceptance plus an accepted explorer report.

| Mutation | Canonical verdict | Alternative verdict | Divergence | Reason | Evidence |
| --- | --- | --- | --- | --- | --- |
| Staked PAYMENT verifier calls `StateView.getSlot0` | `SIMULATION_ONLY` / currently `REJECTED_PRECONDITION` | `NOT_TESTED` | No | Predicted paymaster has 0 bytes of code until approved deployment | ethrex simulation: VERIFY frame 1 default code failed |

The live simulation method exists and accepts raw type-0x06 bytes. The current result is not a storage-policy verdict.

## Cost and approval packet

- Funding transfer: value `0.024917785`; 250,000 gas × 3 gwei = `0.00075`; maximum source debit `0.025667785`.
- Deployment: value `0.013`; maximum gas `0.012337377`.
- Stake: value locked `0.01`; maximum gas `0.0015`.
- Policy candidate: maximum gas `0.0015`.
- Maximum gas burn: `0.016087377`.
- Maximum stake locked: `0.01`.
- Maximum overall exposure: `0.026087377` test ETH.

The shared funding-source nonce was 149 at capture and is volatile. Any nonce, gas, sender balance, deployed-code, predicted-address, runtime-hash, stake or candidate-hash change requires a new packet and approval.

The complete machine-readable packet is `evidence/prepared/2026-11-07/step2e-approval-packet.json`, SHA-256 `cf22db5a447de2adb5017c7f5ade594783d0a5cb680fc7d0946dae81721f5476`. Approval must cover the exact funding, deployment, stake and conditional comparison sequence. This step does not request or imply that approval.

Verification: focused protocol/source/setup tests 7/7; full suite 231/231.
