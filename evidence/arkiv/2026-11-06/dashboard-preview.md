# FrameFuzz admission evidence

- Source: **PREVIEW_COMMUNITY — UNTRUSTED, NO BROADCAST**
- Chain ID: **1337**
- RPC host: [offline preview]
- Generated: 2026-11-05T23:26:59.270Z

> A submission RPC hash proves an admission response, not block inclusion or successful execution.

| Test | Path | Expected | Observed | Verdict | Receipt |
|---|---|---|---|---|---|
| verification-gas-s42-0-67198 | public | - | inconclusive | INCONCLUSIVE | not_checked |
| verification-gas-s42-0-67198 | alt | - | inconclusive | INCONCLUSIVE | not_checked |

## Mutation campaign and rule coverage

- Campaign: {"generatorVersion":"framefuzz.semantic.v1","suite":"verification-gas","seed":42,"count":7,"selectedVariant":0,"definitionDigest":"3a417f5cc66eb4f87f35d20f2045fcfc719d997b1598c58cf4b55e7f1256e54b","ruleModelVersion":"forshtat-1337-observed-2026-11-06.v1"}
- MAX_VERIFY_GAS / public: 1 variants, 0 matching decisions, 0 unexpected, regions below; verified 0, inferred 0, unknown 1
- MAX_VERIFY_GAS / alt: 1 variants, 0 matching decisions, 0 unexpected, regions below; verified 0, inferred 0, unknown 1

## Community origin (historical publisher claims)

This run is a new unsigned PREVIEW. Original receipts below are not newly rerun outcomes.

```json
{
  "chainId": 7794095,
  "entityKey": "0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1",
  "publisher": "0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715",
  "owner": "0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715",
  "creator": "0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715",
  "expiresAtBlock": "569638",
  "contentDigest": "281434c862232ac4557bd917b0c65d812a6bd5372eab977912117b53edc37e6b",
  "originalEvidenceClassification": "LIVE",
  "originalOutcomes": {
    "public": {
      "expected": "accepted",
      "confidence": "VERIFIED",
      "admission": "accepted",
      "verdict": "EXPECTED_ACCEPT",
      "returnedHash": "0xef7bec20e34df87fdf264d9f5fe65934e53a5e6fc65b38b7db78ad8981c50cbd",
      "computedHash": "0xef7bec20e34df87fdf264d9f5fe65934e53a5e6fc65b38b7db78ad8981c50cbd",
      "receipt": {
        "state": "included_success",
        "status": "0x1",
        "blockNumber": "0x63a06"
      }
    },
    "alt": {
      "expected": "accepted",
      "confidence": "VERIFIED",
      "admission": "accepted",
      "verdict": "EXPECTED_ACCEPT",
      "returnedHash": "0xbe6c43a9740e0e04eb080a23957df96ab7259cb1fe6f49c9fe18dc8ea4c63b2d",
      "computedHash": "0xbe6c43a9740e0e04eb080a23957df96ab7259cb1fe6f49c9fe18dc8ea4c63b2d",
      "receipt": {
        "state": "included_success",
        "status": "0x1",
        "blockNumber": "0x63a0d"
      }
    }
  },
  "notice": "Original outcomes are publisher claims. This imported run is a new unsigned preview, not a live reproduction."
}
```

## Details

### verification-gas-s42-0-67198

Seed 42, variant 0: {"field":"verificationGasLimit","value":67198,"offset":-2,"boundary":67200,"region":"below"}

- **public:** Missing verified rule-model provenance; no policy finding can be inferred
  - RPC response: Offline preview: no signing, setup, RPC or submission
  - Receipt: not_checked, block unconfirmed
  - Rule oracle: {"ruleId":"MAX_VERIFY_GAS","modelVersion":"forshtat-1337-observed-2026-11-06.v1","confidence":"UNKNOWN","source":{"confidence":"UNKNOWN","meaning":"Untrusted community fixture; original confidence is a publisher claim, not local verification","evidence":[],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a"},"expected":null,"reason":"Missing verified rule-model provenance; no policy finding can be inferred"}
- **alt:** Missing verified rule-model provenance; no policy finding can be inferred
  - RPC response: Offline preview: no signing, setup, RPC or submission
  - Receipt: not_checked, block unconfirmed
  - Rule oracle: {"ruleId":"MAX_VERIFY_GAS","modelVersion":"forshtat-1337-observed-2026-11-06.v1","confidence":"UNKNOWN","source":{"confidence":"UNKNOWN","meaning":"Untrusted community fixture; original confidence is a publisher claim, not local verification","evidence":[],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a"},"expected":null,"reason":"Missing verified rule-model provenance; no policy finding can be inferred"}
- Mutation: {"generatorVersion":"framefuzz.semantic.v1","seed":42,"index":0,"baseTemplateId":"workshop-sponsored-v1","definitionDigest":"3a417f5cc66eb4f87f35d20f2045fcfc719d997b1598c58cf4b55e7f1256e54b","unsignedModel":{"verificationGasLimit":67198,"poolRead":false},"setup":{"staked":false,"poolRead":false,"configuration":{"kind":"basic"}},"parameter":{"field":"verificationGasLimit","value":67198,"offset":-2,"boundary":67200,"region":"below"}}
- Rule provenance: {"confidence":"UNKNOWN","meaning":"Untrusted community fixture; original confidence is a publisher claim, not local verification","evidence":[],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a"}
- Fresh-signature reproduction: `node bin/framefuzz.mjs arkiv import --key 0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1`
