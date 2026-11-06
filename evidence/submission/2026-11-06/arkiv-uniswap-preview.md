# FrameFuzz admission evidence

- Source: **PREVIEW_COMMUNITY — UNTRUSTED, NO BROADCAST**
- Chain ID: **1337**
- RPC host: [offline preview]
- Generated: 2026-11-06T01:41:29.583Z

> A submission RPC hash proves an admission response, not block inclusion or successful execution.

| Test | Path | Expected | Observed | Verdict | Receipt |
|---|---|---|---|---|---|
| uniswap-storage-s42-1-staked | public | - | inconclusive | INCONCLUSIVE | not_checked |
| uniswap-storage-s42-1-staked | alt | - | inconclusive | INCONCLUSIVE | not_checked |

## Mutation campaign and rule coverage

- Campaign: {"generatorVersion":"framefuzz.semantic.v1","suite":"uniswap-storage","seed":42,"count":3,"selectedVariant":1,"definitionDigest":"a6d9f5ee9c9f5e89092953e77aff2eb7a410cf23c57eaacb80bbc1d5eb3594d6","ruleModelVersion":"forshtat-1337-observed-2026-11-06.v1"}
- STORAGE_ACCESS / public: 1 variants, 0 matching decisions, 0 unexpected, regions staked; verified 0, inferred 0, unknown 1
- STORAGE_ACCESS / alt: 1 variants, 0 matching decisions, 0 unexpected, regions staked; verified 0, inferred 0, unknown 1

## Community origin (historical publisher claims)

This run is a new unsigned PREVIEW. Original receipts below are not newly rerun outcomes.

```json
{
  "chainId": 7794095,
  "entityKey": "0x6779cf38a4398eb90da94b11885e691b84a6bb09dda59974cf5b8f1a21db773e",
  "publisher": "0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715",
  "owner": "0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715",
  "creator": "0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715",
  "expiresAtBlock": "570761",
  "contentDigest": "cd5acbe16ee2ee8cdb44b0200ad7758668df661cea99090a54b717eec0df5038",
  "originalEvidenceClassification": "LIVE",
  "originalOutcomes": {
    "public": {
      "expected": "rejected",
      "confidence": "VERIFIED",
      "admission": "rejected",
      "verdict": "EXPECTED_REJECT",
      "returnedHash": null,
      "computedHash": "0x7e7e173ac7e898cbaad7857eaa29c00eb04be3ca78f21555ea8600e22e69a586",
      "receipt": {
        "state": "not_checked",
        "status": null,
        "blockNumber": null
      }
    },
    "alt": {
      "expected": "accepted",
      "confidence": "VERIFIED",
      "admission": "rejected",
      "verdict": "INFRASTRUCTURE_FAILURE",
      "returnedHash": null,
      "computedHash": "0x72cdfcddf89518d02b368aaf05b3e6a10cc2cb05cf33ae3146b2f58742090ff2",
      "receipt": {
        "state": "not_checked",
        "status": null,
        "blockNumber": null
      }
    }
  },
  "protocolMetadata": {
    "protocol": "uniswap-v4",
    "chainId": 1337,
    "poolId": "0x784bd7879f8155eda79b7834d53c2f19ace60aed221fe33ef03ce660eff60648",
    "contracts": {
      "stateView": {
        "address": "0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB",
        "codeHash": "0xa0ef20cd92d4b7fede36b2291bc7295146efb4a2f949c2e701d676888c29a1fe"
      },
      "poolManager": {
        "address": "0x6bF9Aa9c04fd001385742d61f6818C3236429848",
        "codeHash": "0x7e6f74167f749db1dd7da71fe8da91a6e7484dea8f2eab11a3211536b26b90f8"
      }
    },
    "slot0": {
      "sqrtPriceX96": "0",
      "tick": 0,
      "protocolFee": 0,
      "lpFee": 0,
      "initialized": false
    },
    "paymaster": {
      "address": "0x552e75d45ee70f09ff69f465ddc4264e6ee31396",
      "codeHash": "0x2ac1dce1c1843e82101b1f6732da8fb3cf46a21438d7f6a90d5ba0cfef1ce5ac",
      "stake": {
        "registry": "0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f",
        "amountWei": "12000000000000000",
        "delaySeconds": "86400",
        "withdrawTime": "0",
        "staked": true
      }
    },
    "policies": {
      "public": {
        "ruleId": "StorageReadNonSender",
        "expected": "rejected"
      },
      "alt": {
        "ruleId": "STORAGE_ACCESS_STAKE_REQUIRED",
        "expected": "accepted"
      }
    },
    "source": {
      "file": "vendor/paymaster/ReserveReadingPaymaster.sol",
      "line": 33
    },
    "limitation": "Devnet runtime hash/binding checks and publisher claims; zero pool state is not swap execution; deployed sidecar commit is not attested"
  },
  "notice": "Original outcomes are publisher claims. This imported run is a new unsigned preview, not a live reproduction."
}
```

## Details

### uniswap-storage-s42-1-staked

Seed 42, variant 1: {"operation":"storage-and-stake","kind":"staked","poolRead":true,"staked":true,"region":"staked"}

- **public:** Missing verified rule-model provenance; no policy finding can be inferred
  - RPC response: Offline preview: no signing, setup, RPC or submission
  - Receipt: not_checked, block unconfirmed
  - Rule oracle: {"ruleId":"STORAGE_ACCESS","modelVersion":"forshtat-1337-observed-2026-11-06.v1","confidence":"UNKNOWN","source":{"confidence":"UNKNOWN","meaning":"Untrusted community fixture; original confidence is a publisher claim, not local verification","evidence":[],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a"},"expected":null,"reason":"Missing verified rule-model provenance; no policy finding can be inferred"}
- **alt:** Missing verified rule-model provenance; no policy finding can be inferred
  - RPC response: Offline preview: no signing, setup, RPC or submission
  - Receipt: not_checked, block unconfirmed
  - Rule oracle: {"ruleId":"STORAGE_ACCESS","modelVersion":"forshtat-1337-observed-2026-11-06.v1","confidence":"UNKNOWN","source":{"confidence":"UNKNOWN","meaning":"Untrusted community fixture; original confidence is a publisher claim, not local verification","evidence":[],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a"},"expected":null,"reason":"Missing verified rule-model provenance; no policy finding can be inferred"}
- Mutation: {"generatorVersion":"framefuzz.semantic.v1","seed":42,"index":1,"baseTemplateId":"workshop-sponsored-v1","definitionDigest":"a6d9f5ee9c9f5e89092953e77aff2eb7a410cf23c57eaacb80bbc1d5eb3594d6","unsignedModel":{"verificationGasLimit":50000,"poolRead":true},"setup":{"staked":true,"poolRead":true,"configuration":{"kind":"staked"}},"parameter":{"operation":"storage-and-stake","kind":"staked","poolRead":true,"staked":true,"region":"staked"}}
- Rule provenance: {"confidence":"UNKNOWN","meaning":"Untrusted community fixture; original confidence is a publisher claim, not local verification","evidence":[],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a"}
- Fresh-signature reproduction: `node bin/framefuzz.mjs arkiv import --key 0x6779cf38a4398eb90da94b11885e691b84a6bb09dda59974cf5b8f1a21db773e`
