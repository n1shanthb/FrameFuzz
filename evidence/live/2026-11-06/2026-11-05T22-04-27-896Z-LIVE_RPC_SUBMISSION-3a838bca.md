# FrameFuzz admission evidence

- Source: **LIVE_RPC_SUBMISSION**
- Chain ID: **1337**
- RPC host: https://altmempool.forshtat.com/[redacted-path]
- Generated: 2026-11-05T22:04:27.052Z

> A submission RPC hash proves an admission response, not block inclusion or successful execution.

| Test | Path | Expected | Observed | Verdict | Receipt |
|---|---|---|---|---|---|
| basic-baseline-50000 | public | accepted | accepted | EXPECTED_ACCEPT | included_success |
| basic-baseline-50000 | alt | accepted | accepted | EXPECTED_ACCEPT | included_success |
| unstaked-baseline-50000 | public | rejected | rejected | EXPECTED_REJECT | not_checked |
| unstaked-baseline-50000 | alt | rejected | rejected | EXPECTED_REJECT | not_checked |
| staked-baseline-50000 | public | rejected | rejected | EXPECTED_REJECT | not_checked |
| staked-baseline-50000 | alt | accepted | accepted | EXPECTED_ACCEPT | included_success |
| basic-below-67199 | public | accepted | accepted | EXPECTED_ACCEPT | included_success |
| basic-below-67199 | alt | accepted | accepted | EXPECTED_ACCEPT | included_success |
| basic-at-67200 | public | accepted | accepted | EXPECTED_ACCEPT | included_success |
| basic-at-67200 | alt | accepted | accepted | EXPECTED_ACCEPT | included_success |
| basic-above-67201 | public | rejected | rejected | EXPECTED_REJECT | not_checked |
| basic-above-67201 | alt | rejected | rejected | EXPECTED_REJECT | not_checked |

## Details

### basic-baseline-50000

Fresh independently signed transactions using the supplied PoC sponsors and official workshop codec

- **public:** Observed expected accepted decision.
  - Transaction: `0x3a61f84bef43dee398ce5e1ec17c9cc8b9e6d498a33fef9ff44011c4b334ec84`
  - RPC response: Submission RPC returned a transaction hash; inclusion NOT implied.
  - Receipt: included_success, block 0x6384d
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0x96a9ff0d0bb73bea9226cae11ca48be2f5701744","nonce":"0","chainId":1337,"caseId":"basic-baseline-50000","pathId":"public","mode":"LIVE","transaction":{"hash":"0x3a61f84bef43dee398ce5e1ec17c9cc8b9e6d498a33fef9ff44011c4b334ec84","payer":"0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30","payerBalance":"149945012000000000","senderBalance":"0","verificationGas":50000}}
- **alt:** Observed expected accepted decision.
  - Transaction: `0xb810446fcc43d674db0faae8c6e833976a4f3344c418cdb1a2fbb7fe5b35cc6a`
  - RPC response: Submission RPC returned a transaction hash; inclusion NOT implied.
  - Receipt: included_success, block 0x6384f
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0xfc28448c3c18b6f599195e728c7705b7fa505ef3","nonce":"0","chainId":1337,"caseId":"basic-baseline-50000","pathId":"alt","mode":"LIVE","transaction":{"hash":"0xb810446fcc43d674db0faae8c6e833976a4f3344c418cdb1a2fbb7fe5b35cc6a","payer":"0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30","payerBalance":"149890048000000000","senderBalance":"0","verificationGas":50000}}
- Rule provenance: {"status":"SOURCE_REVIEWED_DEPLOYMENT_PARTIAL","workshopCommit":"bcfe02a196ca97b6fb0d1044db9d0b4c673831fc","sidecarSourceReviewed":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","deployedSidecarCommit":null,"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","source":"Supplied framefuzz-poc.zip fast_gate_rerun.ts and PAYMASTER_FEASIBILITY.md; live code/stake/balance checked","note":"Execution client commit verified by web3_clientVersion. Sidecar v4.1.1 exposes an empty commit; exact source/deployment equivalence is not attested."}
- Reproduction fixture: `E:\ethglobalmumbai\examples\live\basic.mjs`

### unstaked-baseline-50000

Fresh independently signed transactions using the supplied PoC sponsors and official workshop codec

- **public:** Observed expected rejected decision.
  - RPC response: Invalid params: Frame transaction validation-prefix simulation failed: StorageReadNonSender
  - Receipt: not_checked, block unconfirmed
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0x9ea5774c2be348894d8b3040c545e72f69d12835","nonce":"0","chainId":1337,"caseId":"unstaked-baseline-50000","pathId":"public","mode":"LIVE","transaction":{"hash":"0x3aca70802e2b6db284daf66dec3bd9873a3e48a231e7e5411b4d77bb62d06bc8","payer":"0x3d66c53105be7930fd89571157a41137c12b003f","payerBalance":"150000000000000000","senderBalance":"0","verificationGas":50000,"stateView":"0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB","poolId":"0x784bd7879f8155eda79b7834d53c2f19ace60aed221fe33ef03ce660eff60648"}}
- **alt:** Observed expected rejected decision.
  - RPC response: unstaked payer accessed 0x6bf9aa9c04fd001385742d61f6818c3236429848 slot 0xf6a862ad9e4b3f79dd2626ae081b3a49de5d55002e5339e1bdff7d8f5e202404
  - Receipt: not_checked, block unconfirmed
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0xf835a968e8e0f7954b64f34c2e47c254a686a87e","nonce":"0","chainId":1337,"caseId":"unstaked-baseline-50000","pathId":"alt","mode":"LIVE","transaction":{"hash":"0xff59ca1dc469b03528937a1a69d13e062a8b2ede5b166f11158cdee4bc517fd6","payer":"0x3d66c53105be7930fd89571157a41137c12b003f","payerBalance":"150000000000000000","senderBalance":"0","verificationGas":50000,"stateView":"0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB","poolId":"0x784bd7879f8155eda79b7834d53c2f19ace60aed221fe33ef03ce660eff60648"}}
- Rule provenance: {"status":"SOURCE_REVIEWED_DEPLOYMENT_PARTIAL","workshopCommit":"bcfe02a196ca97b6fb0d1044db9d0b4c673831fc","sidecarSourceReviewed":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","deployedSidecarCommit":null,"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","source":"Supplied framefuzz-poc.zip fast_gate_rerun.ts and PAYMASTER_FEASIBILITY.md; live code/stake/balance checked","note":"Execution client commit verified by web3_clientVersion. Sidecar v4.1.1 exposes an empty commit; exact source/deployment equivalence is not attested."}
- Reproduction fixture: `E:\ethglobalmumbai\examples\live\unstaked.mjs`

### staked-baseline-50000

Fresh independently signed transactions using the supplied PoC sponsors and official workshop codec

- **public:** Observed expected rejected decision.
  - RPC response: Invalid params: Frame transaction validation-prefix simulation failed: StorageReadNonSender
  - Receipt: not_checked, block unconfirmed
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0x18e6c9937c42cac6ef8f770092c62c928e2fe89a","nonce":"0","chainId":1337,"caseId":"staked-baseline-50000","pathId":"public","mode":"LIVE","transaction":{"hash":"0x98404ebac440ec9ee2d82110fa8452ce72c0d8678b14bff08d70fa16ab44c91a","payer":"0x552e75d45ee70f09ff69f465ddc4264e6ee31396","payerBalance":"137416766000000000","senderBalance":"0","verificationGas":50000,"stateView":"0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB","poolId":"0x784bd7879f8155eda79b7834d53c2f19ace60aed221fe33ef03ce660eff60648"}}
- **alt:** Observed expected accepted decision.
  - Transaction: `0xbb9143eb2964bdc4de9d59f15404baf14f59465f0ac0f5d5903dfa0173741b6c`
  - RPC response: Submission RPC returned a transaction hash; inclusion NOT implied.
  - Receipt: included_success, block 0x63863
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0x5ce69d7761f2c3cfd1e6635afcc0b54ecbfec394","nonce":"0","chainId":1337,"caseId":"staked-baseline-50000","pathId":"alt","mode":"LIVE","transaction":{"hash":"0xbb9143eb2964bdc4de9d59f15404baf14f59465f0ac0f5d5903dfa0173741b6c","payer":"0x552e75d45ee70f09ff69f465ddc4264e6ee31396","payerBalance":"137416766000000000","senderBalance":"0","verificationGas":50000,"stateView":"0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB","poolId":"0x784bd7879f8155eda79b7834d53c2f19ace60aed221fe33ef03ce660eff60648"}}
- Rule provenance: {"status":"SOURCE_REVIEWED_DEPLOYMENT_PARTIAL","workshopCommit":"bcfe02a196ca97b6fb0d1044db9d0b4c673831fc","sidecarSourceReviewed":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","deployedSidecarCommit":null,"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","source":"Supplied framefuzz-poc.zip fast_gate_rerun.ts and PAYMASTER_FEASIBILITY.md; live code/stake/balance checked","note":"Execution client commit verified by web3_clientVersion. Sidecar v4.1.1 exposes an empty commit; exact source/deployment equivalence is not attested."}
- Reproduction fixture: `E:\ethglobalmumbai\examples\live\staked.mjs`

### basic-below-67199

Fresh independently signed transactions using the supplied PoC sponsors and official workshop codec

- **public:** Observed expected accepted decision.
  - Transaction: `0xa56f367868376cc4ab7d4f938d03c148c9a1711f736e7bffb7c0fb556b889c1b`
  - RPC response: Submission RPC returned a transaction hash; inclusion NOT implied.
  - Receipt: included_success, block 0x6385b
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0x78eba4196e98e32b012b6b4ac5240f9384083ebd","nonce":"0","chainId":1337,"caseId":"basic-below-67199","pathId":"public","mode":"LIVE","transaction":{"hash":"0xa56f367868376cc4ab7d4f938d03c148c9a1711f736e7bffb7c0fb556b889c1b","payer":"0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30","payerBalance":"149835036000000000","senderBalance":"0","verificationGas":67199}}
- **alt:** Observed expected accepted decision.
  - Transaction: `0xa5f569b2de2079fc586b6428706828c2fb9b9b92c7fd34338aefa5f8e748632b`
  - RPC response: Submission RPC returned a transaction hash; inclusion NOT implied.
  - Receipt: included_success, block 0x63865
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0xb0787789cf50997aa6a924096094d527aeb59a8c","nonce":"0","chainId":1337,"caseId":"basic-below-67199","pathId":"alt","mode":"LIVE","transaction":{"hash":"0xa5f569b2de2079fc586b6428706828c2fb9b9b92c7fd34338aefa5f8e748632b","payer":"0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30","payerBalance":"149780048000000000","senderBalance":"0","verificationGas":67199}}
- Mutation: {"family":"verification-gas","field":"payerVerificationGas","value":67199,"boundary":67200,"derivation":"100000 total prefix - 30000 sender VERIFY - 2800 secp256k1 intrinsic cost"}
- Rule provenance: {"status":"SOURCE_REVIEWED_DEPLOYMENT_PARTIAL","workshopCommit":"bcfe02a196ca97b6fb0d1044db9d0b4c673831fc","sidecarSourceReviewed":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","deployedSidecarCommit":null,"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","source":"Supplied framefuzz-poc.zip fast_gate_rerun.ts and PAYMASTER_FEASIBILITY.md; live code/stake/balance checked","note":"Execution client commit verified by web3_clientVersion. Sidecar v4.1.1 exposes an empty commit; exact source/deployment equivalence is not attested."}
- Reproduction fixture: `E:\ethglobalmumbai\examples\live\verification-gas.mjs`

### basic-at-67200

Fresh independently signed transactions using the supplied PoC sponsors and official workshop codec

- **public:** Observed expected accepted decision.
  - Transaction: `0x7916c6a306044ba424e43ccbe871945b30a5357a19cba224bfbfc9b3af8f08eb`
  - RPC response: Submission RPC returned a transaction hash; inclusion NOT implied.
  - Receipt: included_success, block 0x6385d
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0x37f6b0beda5d3e09b3350797377db17d090aa727","nonce":"0","chainId":1337,"caseId":"basic-at-67200","pathId":"public","mode":"LIVE","transaction":{"hash":"0x7916c6a306044ba424e43ccbe871945b30a5357a19cba224bfbfc9b3af8f08eb","payer":"0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30","payerBalance":"149780048000000000","senderBalance":"0","verificationGas":67200}}
- **alt:** Observed expected accepted decision.
  - Transaction: `0xb1c1583660a3da5ab7264579becdce2a2d04f4e3fdfc4e41bafd0db99f3a9605`
  - RPC response: Submission RPC returned a transaction hash; inclusion NOT implied.
  - Receipt: included_success, block 0x63865
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0xaaaf2ddb04d05c84f5169c5acfb909e9f3ac8162","nonce":"0","chainId":1337,"caseId":"basic-at-67200","pathId":"alt","mode":"LIVE","transaction":{"hash":"0xb1c1583660a3da5ab7264579becdce2a2d04f4e3fdfc4e41bafd0db99f3a9605","payer":"0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30","payerBalance":"149725036000000000","senderBalance":"0","verificationGas":67200}}
- Mutation: {"family":"verification-gas","field":"payerVerificationGas","value":67200,"boundary":67200,"derivation":"100000 total prefix - 30000 sender VERIFY - 2800 secp256k1 intrinsic cost"}
- Rule provenance: {"status":"SOURCE_REVIEWED_DEPLOYMENT_PARTIAL","workshopCommit":"bcfe02a196ca97b6fb0d1044db9d0b4c673831fc","sidecarSourceReviewed":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","deployedSidecarCommit":null,"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","source":"Supplied framefuzz-poc.zip fast_gate_rerun.ts and PAYMASTER_FEASIBILITY.md; live code/stake/balance checked","note":"Execution client commit verified by web3_clientVersion. Sidecar v4.1.1 exposes an empty commit; exact source/deployment equivalence is not attested."}
- Reproduction fixture: `E:\ethglobalmumbai\examples\live\verification-gas.mjs`

### basic-above-67201

Fresh independently signed transactions using the supplied PoC sponsors and official workshop codec

- **public:** Observed expected rejected decision.
  - RPC response: Invalid params: Frame transaction prefix gas budget (frames + sig cost) exceeds MAX_VERIFY_GAS
  - Receipt: not_checked, block unconfirmed
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0x778f4536aa458e6edbf2ed98abe99130134399a0","nonce":"0","chainId":1337,"caseId":"basic-above-67201","pathId":"public","mode":"LIVE","transaction":{"hash":"0x58a9214e8c1188379e80e7cc4beb1b5acc2ce0897f014eab68fdd8a1c29d9bc8","payer":"0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30","payerBalance":"149725036000000000","senderBalance":"0","verificationGas":67201}}
- **alt:** Observed expected rejected decision.
  - RPC response: validation prefix execution gas sum 97201 + signature-verification cost 2800 = 100001 exceeds MAX_VERIFY_GAS 100000
  - Receipt: not_checked, block unconfirmed
  - Admission endpoint: https://altmempool.forshtat.com/[redacted-path]
  - Replay metadata: {"adapter":"workshop-hegota-0.0.1","sender":"0xf7e13ba104b7beec2e2d986eef43f4fd93267df9","nonce":"0","chainId":1337,"caseId":"basic-above-67201","pathId":"alt","mode":"LIVE","transaction":{"hash":"0x675d7d64bfe8a3d20624d117e87a1b19281c087681eae658bfd0fbb31246fb54","payer":"0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30","payerBalance":"149725036000000000","senderBalance":"0","verificationGas":67201}}
- Mutation: {"family":"verification-gas","field":"payerVerificationGas","value":67201,"boundary":67200,"derivation":"100000 total prefix - 30000 sender VERIFY - 2800 secp256k1 intrinsic cost"}
- Rule provenance: {"status":"SOURCE_REVIEWED_DEPLOYMENT_PARTIAL","workshopCommit":"bcfe02a196ca97b6fb0d1044db9d0b4c673831fc","sidecarSourceReviewed":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","deployedSidecarCommit":null,"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","source":"Supplied framefuzz-poc.zip fast_gate_rerun.ts and PAYMASTER_FEASIBILITY.md; live code/stake/balance checked","note":"Execution client commit verified by web3_clientVersion. Sidecar v4.1.1 exposes an empty commit; exact source/deployment equivalence is not attested."}
- Reproduction fixture: `E:\ethglobalmumbai\examples\live\verification-gas.mjs`

