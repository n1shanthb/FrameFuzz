# LIVE evidence — generated from committed captures

Rebuild: `node scripts/live-evidence.mjs`; verify: `node scripts/live-evidence.mjs --check`. This document reads the committed Git blobs and rejects changed working copies. No network requests or submissions occur.

LIVE means an actual historical RPC capture, not a new execution. PREVIEW is unsigned semantic generation; MOCK is simulated transport. ADMITTED is a returned hash; REJECTED is an admission response; INCLUDED_SUCCESS requires a successful receipt. TRANSPORT_FAILURE and INCONCLUSIVE prove neither admission nor execution. Intentional public/alternative policy differences are expected compatibility behavior, not vulnerabilities.

The latest generated Uniswap campaign encountered remote sidecar disk exhaustion; it is separate from the successful historical scenarios below. See [current build status](../BUILD_STATUS.md) and [integrated capture](../evidence/integrated/2026-11-06/). No new successful inclusion is inferred from that failed campaign.

## Generated gas campaign

Source: [evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json](../evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json), captured 2026-11-05T22:40:15.811Z; SHA-256 `de690539fac4b65b5047141d592bd8cef44ef3991a030d6912c730ae08ee2972`. Chain 1337.

| Scenario | Rule | Semantic parameters / staking | Public expected → actual / receipt | Alternative expected → actual / receipt |
|---|---|---|---|---|
| verification-gas-s42-0-67198 | MAX_VERIFY_GAS | {"field":"verificationGasLimit","value":67198,"offset":-2,"boundary":67200,"region":"below"}; staking: false | ACCEPTED → ADMITTED / INCLUDED_SUCCESS | ACCEPTED → ADMITTED / INCLUDED_SUCCESS |
| verification-gas-s42-1-67202 | MAX_VERIFY_GAS | {"field":"verificationGasLimit","value":67202,"offset":2,"boundary":67200,"region":"above"}; staking: false | REJECTED → REJECTED / NOT_CHECKED | REJECTED → REJECTED / NOT_CHECKED |
| verification-gas-s42-2-67200 | MAX_VERIFY_GAS | {"field":"verificationGasLimit","value":67200,"offset":0,"boundary":67200,"region":"at"}; staking: false | ACCEPTED → ADMITTED / INCLUDED_SUCCESS | ACCEPTED → ADMITTED / INCLUDED_SUCCESS |
| verification-gas-s42-3-67210 | MAX_VERIFY_GAS | {"field":"verificationGasLimit","value":67210,"offset":10,"boundary":67200,"region":"above"}; staking: false | REJECTED → REJECTED / NOT_CHECKED | REJECTED → REJECTED / NOT_CHECKED |
| verification-gas-s42-4-67201 | MAX_VERIFY_GAS | {"field":"verificationGasLimit","value":67201,"offset":1,"boundary":67200,"region":"above"}; staking: false | REJECTED → REJECTED / NOT_CHECKED | REJECTED → REJECTED / NOT_CHECKED |
| verification-gas-s42-5-67190 | MAX_VERIFY_GAS | {"field":"verificationGasLimit","value":67190,"offset":-10,"boundary":67200,"region":"below"}; staking: false | ACCEPTED → ADMITTED / INCLUDED_SUCCESS | ACCEPTED → ADMITTED / INCLUDED_SUCCESS |
| verification-gas-s42-6-67199 | MAX_VERIFY_GAS | {"field":"verificationGasLimit","value":67199,"offset":-1,"boundary":67200,"region":"below"}; staking: false | ACCEPTED → ADMITTED / INCLUDED_SUCCESS | ACCEPTED → ADMITTED / INCLUDED_SUCCESS |

### verification-gas-s42-0-67198

Artifact: [evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json](../evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json) → results[id=verification-gas-s42-0-67198].

**public:** ACCEPTED → ADMITTED / INCLUDED_SUCCESS; verdict EXPECTED_ACCEPT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: none (expected admission).
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67198.
- Returned admission hash: `0xef7bec20e34df87fdf264d9f5fe65934e53a5e6fc65b38b7db78ad8981c50cbd`.
- Receipt: INCLUDED_SUCCESS; block 0x63a06; status 0x1.
- RPC response: Submission RPC returned a transaction hash; inclusion NOT implied..
- Sidecar admission report: not present for this path; public rejection diagnostics are the RPC response above.

**alt:** ACCEPTED → ADMITTED / INCLUDED_SUCCESS; verdict EXPECTED_ACCEPT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: none (expected admission).
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67198.
- Returned admission hash: `0xbe6c43a9740e0e04eb080a23957df96ab7259cb1fe6f49c9fe18dc8ea4c63b2d`.
- Receipt: INCLUDED_SUCCESS; block 0x63a0d; status 0x1.
- RPC response: Submission RPC returned a transaction hash; inclusion NOT implied..
- Sidecar admission report: accepted; 24 checks; failing checks: []. Full report is preserved in paths[id=alt].admissionReport.

### verification-gas-s42-1-67202

Artifact: [evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json](../evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json) → results[id=verification-gas-s42-1-67202].

**public:** REJECTED → REJECTED / NOT_CHECKED; verdict EXPECTED_REJECT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: MAX_VERIFY_GAS.
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67202.
- Computed-only hash (not admitted): `0x06029dbda56b1efaee257e32d3d38d2655c055cef19e4bcd754ee4d5ae289a93`.
- Receipt: NOT_CHECKED; block not recorded; status not recorded.
- RPC response: Invalid params: Frame transaction prefix gas budget (frames + sig cost) exceeds MAX_VERIFY_GAS.
- Sidecar admission report: not present for this path; public rejection diagnostics are the RPC response above.

**alt:** REJECTED → REJECTED / NOT_CHECKED; verdict EXPECTED_REJECT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: MAX_VERIFY_GAS.
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67202.
- Computed-only hash (not admitted): `0x722bf60bae57399afdb5f0ab7887e2950fbe3d4aad5ba56d966d25cf69a12377`.
- Receipt: NOT_CHECKED; block not recorded; status not recorded.
- RPC response: validation prefix execution gas sum 97202 + signature-verification cost 2800 = 100002 exceeds MAX_VERIFY_GAS 100000.
- Sidecar admission report: rejected; 16 checks; failing checks: [{"rule":"structure","verdict":"fail","detail":"validation prefix execution gas sum 97202 + signature-verification cost 2800 = 100002 exceeds MAX_VERIFY_GAS 100000"}]. Full report is preserved in paths[id=alt].admissionReport.

### verification-gas-s42-2-67200

Artifact: [evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json](../evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json) → results[id=verification-gas-s42-2-67200].

**public:** ACCEPTED → ADMITTED / INCLUDED_SUCCESS; verdict EXPECTED_ACCEPT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: none (expected admission).
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67200.
- Returned admission hash: `0xab67907c2c9c26faeaed5b34504bf2b4907ffbff132d67e696b2c9c0c2d76429`.
- Receipt: INCLUDED_SUCCESS; block 0x63a08; status 0x1.
- RPC response: Submission RPC returned a transaction hash; inclusion NOT implied..
- Sidecar admission report: not present for this path; public rejection diagnostics are the RPC response above.

**alt:** ACCEPTED → ADMITTED / INCLUDED_SUCCESS; verdict EXPECTED_ACCEPT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: none (expected admission).
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67200.
- Returned admission hash: `0xe427da3c92b78e33d114c1d91e0dae0c87f68c94d43db7d087454445808e6951`.
- Receipt: INCLUDED_SUCCESS; block 0x63a0d; status 0x1.
- RPC response: Submission RPC returned a transaction hash; inclusion NOT implied..
- Sidecar admission report: accepted; 24 checks; failing checks: []. Full report is preserved in paths[id=alt].admissionReport.

### verification-gas-s42-3-67210

Artifact: [evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json](../evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json) → results[id=verification-gas-s42-3-67210].

**public:** REJECTED → REJECTED / NOT_CHECKED; verdict EXPECTED_REJECT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: MAX_VERIFY_GAS.
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67210.
- Computed-only hash (not admitted): `0x43068ae6808e18859ef59823bb640181e91f44f0dfcf995fd634ba3d92b11f23`.
- Receipt: NOT_CHECKED; block not recorded; status not recorded.
- RPC response: Invalid params: Frame transaction prefix gas budget (frames + sig cost) exceeds MAX_VERIFY_GAS.
- Sidecar admission report: not present for this path; public rejection diagnostics are the RPC response above.

**alt:** REJECTED → REJECTED / NOT_CHECKED; verdict EXPECTED_REJECT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: MAX_VERIFY_GAS.
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67210.
- Computed-only hash (not admitted): `0x4bd87d45de5b34fff5a2ee59946b3314342fbb7a2a1bf87dea9579830d1bab9e`.
- Receipt: NOT_CHECKED; block not recorded; status not recorded.
- RPC response: validation prefix execution gas sum 97210 + signature-verification cost 2800 = 100010 exceeds MAX_VERIFY_GAS 100000.
- Sidecar admission report: rejected; 16 checks; failing checks: [{"rule":"structure","verdict":"fail","detail":"validation prefix execution gas sum 97210 + signature-verification cost 2800 = 100010 exceeds MAX_VERIFY_GAS 100000"}]. Full report is preserved in paths[id=alt].admissionReport.

### verification-gas-s42-4-67201

Artifact: [evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json](../evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json) → results[id=verification-gas-s42-4-67201].

**public:** REJECTED → REJECTED / NOT_CHECKED; verdict EXPECTED_REJECT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: MAX_VERIFY_GAS.
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67201.
- Computed-only hash (not admitted): `0xcdd20f6c0921b0b10ea9702a29bdd7bc60f281502d69f1c8f321c9a3dbdf98f2`.
- Receipt: NOT_CHECKED; block not recorded; status not recorded.
- RPC response: Invalid params: Frame transaction prefix gas budget (frames + sig cost) exceeds MAX_VERIFY_GAS.
- Sidecar admission report: not present for this path; public rejection diagnostics are the RPC response above.

**alt:** REJECTED → REJECTED / NOT_CHECKED; verdict EXPECTED_REJECT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: MAX_VERIFY_GAS.
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67201.
- Computed-only hash (not admitted): `0x80e7331c3213421cdba422eb1fb81d022146d80ea726e3b9b994a6b0f8b3c030`.
- Receipt: NOT_CHECKED; block not recorded; status not recorded.
- RPC response: validation prefix execution gas sum 97201 + signature-verification cost 2800 = 100001 exceeds MAX_VERIFY_GAS 100000.
- Sidecar admission report: rejected; 16 checks; failing checks: [{"rule":"structure","verdict":"fail","detail":"validation prefix execution gas sum 97201 + signature-verification cost 2800 = 100001 exceeds MAX_VERIFY_GAS 100000"}]. Full report is preserved in paths[id=alt].admissionReport.

### verification-gas-s42-5-67190

Artifact: [evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json](../evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json) → results[id=verification-gas-s42-5-67190].

**public:** ACCEPTED → ADMITTED / INCLUDED_SUCCESS; verdict EXPECTED_ACCEPT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: none (expected admission).
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67190.
- Returned admission hash: `0xdc9dca105fe84c358f864c0228199bf9eaf42e77cb2f2c756ba27dc150aeaaf1`.
- Receipt: INCLUDED_SUCCESS; block 0x63a0b; status 0x1.
- RPC response: Submission RPC returned a transaction hash; inclusion NOT implied..
- Sidecar admission report: not present for this path; public rejection diagnostics are the RPC response above.

**alt:** ACCEPTED → ADMITTED / INCLUDED_SUCCESS; verdict EXPECTED_ACCEPT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: none (expected admission).
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67190.
- Returned admission hash: `0x3bf94779b7f08978ae5f3f5ef214b7ae2206c9e8f36de3a083c37eca142f141c`.
- Receipt: INCLUDED_SUCCESS; block 0x63a10; status 0x1.
- RPC response: Submission RPC returned a transaction hash; inclusion NOT implied..
- Sidecar admission report: accepted; 24 checks; failing checks: []. Full report is preserved in paths[id=alt].admissionReport.

### verification-gas-s42-6-67199

Artifact: [evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json](../evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json) → results[id=verification-gas-s42-6-67199].

**public:** ACCEPTED → ADMITTED / INCLUDED_SUCCESS; verdict EXPECTED_ACCEPT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: none (expected admission).
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67199.
- Returned admission hash: `0xf7d68462aa3b7c0b21c2bb5af46ed5db52bec131440b33741e49abe766b461f7`.
- Receipt: INCLUDED_SUCCESS; block 0x63a0c; status 0x1.
- RPC response: Submission RPC returned a transaction hash; inclusion NOT implied..
- Sidecar admission report: not present for this path; public rejection diagnostics are the RPC response above.

**alt:** ACCEPTED → ADMITTED / INCLUDED_SUCCESS; verdict EXPECTED_ACCEPT.
- Target rule: MAX_VERIFY_GAS / expected rejection diagnostic: none (expected admission).
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 67199.
- Returned admission hash: `0x6d70b783f4c2131fd7fc3ce7562f52bf67d29d96d2438dbc69dedbaffd59241e`.
- Receipt: INCLUDED_SUCCESS; block 0x63a10; status 0x1.
- RPC response: Submission RPC returned a transaction hash; inclusion NOT implied..
- Sidecar admission report: accepted; 24 checks; failing checks: []. Full report is preserved in paths[id=alt].admissionReport.

## Historical Uniswap scenarios

Source: [evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json](../evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json), captured 2026-11-05T22:04:27.052Z; SHA-256 `c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6`. Chain 1337.

| Scenario | Rule | Semantic parameters / staking | Public expected → actual / receipt | Alternative expected → actual / receipt |
|---|---|---|---|---|
| basic-baseline-50000 | baseline valid sponsorship | {"payerVerificationGas":50000,"poolRead":false}; staking: not staked | ACCEPTED → ADMITTED / INCLUDED_SUCCESS | ACCEPTED → ADMITTED / INCLUDED_SUCCESS |
| unstaked-baseline-50000 | StorageReadNonSender | {"payerVerificationGas":50000,"poolRead":true}; staking: unstaked | REJECTED → REJECTED / NOT_CHECKED | REJECTED → REJECTED / NOT_CHECKED |
| staked-baseline-50000 | StorageReadNonSender | {"payerVerificationGas":50000,"poolRead":true}; staking: staked | REJECTED → REJECTED / NOT_CHECKED | ACCEPTED → ADMITTED / INCLUDED_SUCCESS |

### basic-baseline-50000

Artifact: [evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json](../evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json) → results[id=basic-baseline-50000].

**public:** ACCEPTED → ADMITTED / INCLUDED_SUCCESS; verdict EXPECTED_ACCEPT.
- Target rule: baseline sponsorship / expected rejection diagnostic: none (expected admission).
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 50000.
- Returned admission hash: `0x3a61f84bef43dee398ce5e1ec17c9cc8b9e6d498a33fef9ff44011c4b334ec84`.
- Receipt: INCLUDED_SUCCESS; block 0x6384d; status 0x1.
- RPC response: Submission RPC returned a transaction hash; inclusion NOT implied..
- Sidecar admission report: not present for this path; public rejection diagnostics are the RPC response above.

**alt:** ACCEPTED → ADMITTED / INCLUDED_SUCCESS; verdict EXPECTED_ACCEPT.
- Target rule: baseline sponsorship / expected rejection diagnostic: none (expected admission).
- Paymaster: `0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30`; verification gas: 50000.
- Returned admission hash: `0xb810446fcc43d674db0faae8c6e833976a4f3344c418cdb1a2fbb7fe5b35cc6a`.
- Receipt: INCLUDED_SUCCESS; block 0x6384f; status 0x1.
- RPC response: Submission RPC returned a transaction hash; inclusion NOT implied..
- Sidecar admission report: included; 24 checks; failing checks: []. Full report is preserved in paths[id=alt].admissionReport.

### unstaked-baseline-50000

Artifact: [evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json](../evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json) → results[id=unstaked-baseline-50000].

**public:** REJECTED → REJECTED / NOT_CHECKED; verdict EXPECTED_REJECT.
- Target rule: StorageReadNonSender / expected rejection diagnostic: StorageReadNonSender.
- Paymaster: `0x3d66c53105be7930fd89571157a41137c12b003f`; verification gas: 50000.
- Computed-only hash (not admitted): `0x3aca70802e2b6db284daf66dec3bd9873a3e48a231e7e5411b4d77bb62d06bc8`.
- Receipt: NOT_CHECKED; block not recorded; status not recorded.
- RPC response: Invalid params: Frame transaction validation-prefix simulation failed: StorageReadNonSender.
- Sidecar admission report: not present for this path; public rejection diagnostics are the RPC response above.

**alt:** REJECTED → REJECTED / NOT_CHECKED; verdict EXPECTED_REJECT.
- Target rule: unstaked payer accessed / expected rejection diagnostic: unstaked payer accessed.
- Paymaster: `0x3d66c53105be7930fd89571157a41137c12b003f`; verification gas: 50000.
- Computed-only hash (not admitted): `0xff59ca1dc469b03528937a1a69d13e062a8b2ede5b166f11158cdee4bc517fd6`.
- Receipt: NOT_CHECKED; block not recorded; status not recorded.
- RPC response: unstaked payer accessed 0x6bf9aa9c04fd001385742d61f6818c3236429848 slot 0xf6a862ad9e4b3f79dd2626ae081b3a49de5d55002e5339e1bdff7d8f5e202404.
- Sidecar admission report: rejected; 24 checks; failing checks: [{"rule":"storage","frameIndex":1,"entity":"payer","verdict":"fail","detail":"unstaked payer accessed 0x6bf9aa9c04fd001385742d61f6818c3236429848 slot 0xf6a862ad9e4b3f79dd2626ae081b3a49de5d55002e5339e1bdff7d8f5e202404"}]. Full report is preserved in paths[id=alt].admissionReport.

### staked-baseline-50000

Artifact: [evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json](../evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json) → results[id=staked-baseline-50000].

**public:** REJECTED → REJECTED / NOT_CHECKED; verdict EXPECTED_REJECT.
- Target rule: StorageReadNonSender / expected rejection diagnostic: StorageReadNonSender.
- Paymaster: `0x552e75d45ee70f09ff69f465ddc4264e6ee31396`; verification gas: 50000.
- Computed-only hash (not admitted): `0x98404ebac440ec9ee2d82110fa8452ce72c0d8678b14bff08d70fa16ab44c91a`.
- Receipt: NOT_CHECKED; block not recorded; status not recorded.
- RPC response: Invalid params: Frame transaction validation-prefix simulation failed: StorageReadNonSender.
- Sidecar admission report: not present for this path; public rejection diagnostics are the RPC response above.

**alt:** ACCEPTED → ADMITTED / INCLUDED_SUCCESS; verdict EXPECTED_ACCEPT.
- Target rule: baseline sponsorship / expected rejection diagnostic: none (expected admission).
- Paymaster: `0x552e75d45ee70f09ff69f465ddc4264e6ee31396`; verification gas: 50000.
- Returned admission hash: `0xbb9143eb2964bdc4de9d59f15404baf14f59465f0ac0f5d5903dfa0173741b6c`.
- Receipt: INCLUDED_SUCCESS; block 0x63863; status 0x1.
- RPC response: Submission RPC returned a transaction hash; inclusion NOT implied..
- Sidecar admission report: included; 24 checks; failing checks: []. Full report is preserved in paths[id=alt].admissionReport.

## Runtime provenance and explorer policy

The reports preserve actual client/version metadata and rule-model limitations. The sidecar does not attest its deployed commit; reviewed source is not proof of binary identity. Full rule checks, signatures and receipt objects remain in the local evidence artifacts. No explorer URL is generated: this repository does not pin a verified public transaction-explorer URL for these devnet captures. Returned and computed-only hashes are deliberately separate. No swap, USDC reimbursement or mainnet behavior is claimed.
