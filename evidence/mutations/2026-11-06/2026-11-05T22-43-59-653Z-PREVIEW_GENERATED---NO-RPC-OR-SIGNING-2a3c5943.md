# FrameFuzz admission evidence

- Source: **PREVIEW_GENERATED — NO RPC OR SIGNING**
- Chain ID: **1337**
- RPC host: [offline preview]
- Generated: 2026-11-05T22:43:59.647Z

> A submission RPC hash proves an admission response, not block inclusion or successful execution.

| Test | Path | Expected | Observed | Verdict | Receipt |
|---|---|---|---|---|---|
| uniswap-storage-s42-0-unstaked | public | rejected | inconclusive | INCONCLUSIVE | not_checked |
| uniswap-storage-s42-0-unstaked | alt | rejected | inconclusive | INCONCLUSIVE | not_checked |
| uniswap-storage-s42-1-staked | public | rejected | inconclusive | INCONCLUSIVE | not_checked |
| uniswap-storage-s42-1-staked | alt | accepted | inconclusive | INCONCLUSIVE | not_checked |
| uniswap-storage-s42-2-basic | public | accepted | inconclusive | INCONCLUSIVE | not_checked |
| uniswap-storage-s42-2-basic | alt | accepted | inconclusive | INCONCLUSIVE | not_checked |

## Mutation campaign and rule coverage

- Campaign: {"generatorVersion":"framefuzz.semantic.v1","suite":"uniswap-storage","seed":42,"count":3,"selectedVariant":null,"definitionDigest":"25b92b3e079ca2ecc9e5b7c2cc03851fae0c189eebb7b1a3d38b89e5a57793c8","ruleModelVersion":"forshtat-1337-observed-2026-11-06.v1"}
- STORAGE_ACCESS / public: 3 variants, 0 matching decisions, 0 unexpected, regions unstaked, staked, basic; verified 3, inferred 0, unknown 0
- STORAGE_ACCESS / alt: 3 variants, 0 matching decisions, 0 unexpected, regions unstaked, staked, basic; verified 3, inferred 0, unknown 0

## Details

### uniswap-storage-s42-0-unstaked

Seed 42, variant 0: {"operation":"storage-and-stake","kind":"unstaked","poolRead":true,"staked":false,"region":"unstaked"}

- **public:** Offline preview: no signing, setup, RPC or submission
  - RPC response: Offline preview: no signing, setup, RPC or submission
  - Receipt: not_checked, block unconfirmed
  - Rule oracle: {"ruleId":"STORAGE_ACCESS","modelVersion":"forshtat-1337-observed-2026-11-06.v1","confidence":"VERIFIED","source":{"confidence":"VERIFIED","meaning":"Verified observed rule behavior for the pinned fixture, not an attestation of the sidecar build","evidence":[{"file":"evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json","sha256":"c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6"}],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","fixtureCodeHashes":{"basic":"0x9e6b5997a6014b4593d16a2c94beb18ba375ffc97523b5d380f2b96f3b72ea69","staked":"0x2ac1dce1c1843e82101b1f6732da8fb3cf46a21438d7f6a90d5ba0cfef1ce5ac","unstaked":"0xa5e5c558645d99b864453e7db878d54339cabe62eb8e9be97a72f18b31caa17e"}},"components":{"payer":50000,"sender":30000,"signature":2800,"total":82800,"cap":100000},"expected":"rejected","expectedRule":"StorageReadNonSender","prerequisite":{"poolRead":true,"staked":false,"paymasterKind":"unstaked"},"reason":"public unstaked external Uniswap storage read is disallowed by the evidenced policy"}
- **alt:** Offline preview: no signing, setup, RPC or submission
  - RPC response: Offline preview: no signing, setup, RPC or submission
  - Receipt: not_checked, block unconfirmed
  - Rule oracle: {"ruleId":"STORAGE_ACCESS","modelVersion":"forshtat-1337-observed-2026-11-06.v1","confidence":"VERIFIED","source":{"confidence":"VERIFIED","meaning":"Verified observed rule behavior for the pinned fixture, not an attestation of the sidecar build","evidence":[{"file":"evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json","sha256":"c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6"}],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","fixtureCodeHashes":{"basic":"0x9e6b5997a6014b4593d16a2c94beb18ba375ffc97523b5d380f2b96f3b72ea69","staked":"0x2ac1dce1c1843e82101b1f6732da8fb3cf46a21438d7f6a90d5ba0cfef1ce5ac","unstaked":"0xa5e5c558645d99b864453e7db878d54339cabe62eb8e9be97a72f18b31caa17e"}},"components":{"payer":50000,"sender":30000,"signature":2800,"total":82800,"cap":100000},"expected":"rejected","expectedRule":"unstaked payer accessed","prerequisite":{"poolRead":true,"staked":false,"paymasterKind":"unstaked"},"reason":"alt unstaked external Uniswap storage read is disallowed by the evidenced policy"}
- Mutation: {"generatorVersion":"framefuzz.semantic.v1","seed":42,"index":0,"baseTemplateId":"workshop-sponsored-v1","definitionDigest":"25b92b3e079ca2ecc9e5b7c2cc03851fae0c189eebb7b1a3d38b89e5a57793c8","unsignedModel":{"verificationGasLimit":50000,"poolRead":true},"setup":{"staked":false,"poolRead":true,"configuration":{"kind":"unstaked"}},"parameter":{"operation":"storage-and-stake","kind":"unstaked","poolRead":true,"staked":false,"region":"unstaked"}}
- Rule provenance: {"confidence":"VERIFIED","meaning":"Verified observed rule behavior for the pinned fixture, not an attestation of the sidecar build","evidence":[{"file":"evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json","sha256":"c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6"}],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","fixtureCodeHashes":{"basic":"0x9e6b5997a6014b4593d16a2c94beb18ba375ffc97523b5d380f2b96f3b72ea69","staked":"0x2ac1dce1c1843e82101b1f6732da8fb3cf46a21438d7f6a90d5ba0cfef1ce5ac","unstaked":"0xa5e5c558645d99b864453e7db878d54339cabe62eb8e9be97a72f18b31caa17e"}}
- Fresh-signature reproduction: `node bin/framefuzz.mjs mutate --suite uniswap-storage --seed 42 --count 3 --variant 0 --submit --allow-chain 1337`

### uniswap-storage-s42-1-staked

Seed 42, variant 1: {"operation":"storage-and-stake","kind":"staked","poolRead":true,"staked":true,"region":"staked"}

- **public:** Offline preview: no signing, setup, RPC or submission
  - RPC response: Offline preview: no signing, setup, RPC or submission
  - Receipt: not_checked, block unconfirmed
  - Rule oracle: {"ruleId":"STORAGE_ACCESS","modelVersion":"forshtat-1337-observed-2026-11-06.v1","confidence":"VERIFIED","source":{"confidence":"VERIFIED","meaning":"Verified observed rule behavior for the pinned fixture, not an attestation of the sidecar build","evidence":[{"file":"evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json","sha256":"c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6"}],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","fixtureCodeHashes":{"basic":"0x9e6b5997a6014b4593d16a2c94beb18ba375ffc97523b5d380f2b96f3b72ea69","staked":"0x2ac1dce1c1843e82101b1f6732da8fb3cf46a21438d7f6a90d5ba0cfef1ce5ac","unstaked":"0xa5e5c558645d99b864453e7db878d54339cabe62eb8e9be97a72f18b31caa17e"}},"components":{"payer":50000,"sender":30000,"signature":2800,"total":82800,"cap":100000},"expected":"rejected","expectedRule":"StorageReadNonSender","prerequisite":{"poolRead":true,"staked":true,"paymasterKind":"staked"},"reason":"public staked external Uniswap storage read is disallowed by the evidenced policy"}
- **alt:** Offline preview: no signing, setup, RPC or submission
  - RPC response: Offline preview: no signing, setup, RPC or submission
  - Receipt: not_checked, block unconfirmed
  - Rule oracle: {"ruleId":"STORAGE_ACCESS","modelVersion":"forshtat-1337-observed-2026-11-06.v1","confidence":"VERIFIED","source":{"confidence":"VERIFIED","meaning":"Verified observed rule behavior for the pinned fixture, not an attestation of the sidecar build","evidence":[{"file":"evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json","sha256":"c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6"}],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","fixtureCodeHashes":{"basic":"0x9e6b5997a6014b4593d16a2c94beb18ba375ffc97523b5d380f2b96f3b72ea69","staked":"0x2ac1dce1c1843e82101b1f6732da8fb3cf46a21438d7f6a90d5ba0cfef1ce5ac","unstaked":"0xa5e5c558645d99b864453e7db878d54339cabe62eb8e9be97a72f18b31caa17e"}},"components":{"payer":50000,"sender":30000,"signature":2800,"total":82800,"cap":100000},"expected":"accepted","expectedRule":null,"prerequisite":{"poolRead":true,"staked":true,"paymasterKind":"staked"},"reason":"alt staked external Uniswap storage read is allowed by the evidenced policy"}
- Mutation: {"generatorVersion":"framefuzz.semantic.v1","seed":42,"index":1,"baseTemplateId":"workshop-sponsored-v1","definitionDigest":"25b92b3e079ca2ecc9e5b7c2cc03851fae0c189eebb7b1a3d38b89e5a57793c8","unsignedModel":{"verificationGasLimit":50000,"poolRead":true},"setup":{"staked":true,"poolRead":true,"configuration":{"kind":"staked"}},"parameter":{"operation":"storage-and-stake","kind":"staked","poolRead":true,"staked":true,"region":"staked"}}
- Rule provenance: {"confidence":"VERIFIED","meaning":"Verified observed rule behavior for the pinned fixture, not an attestation of the sidecar build","evidence":[{"file":"evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json","sha256":"c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6"}],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","fixtureCodeHashes":{"basic":"0x9e6b5997a6014b4593d16a2c94beb18ba375ffc97523b5d380f2b96f3b72ea69","staked":"0x2ac1dce1c1843e82101b1f6732da8fb3cf46a21438d7f6a90d5ba0cfef1ce5ac","unstaked":"0xa5e5c558645d99b864453e7db878d54339cabe62eb8e9be97a72f18b31caa17e"}}
- Fresh-signature reproduction: `node bin/framefuzz.mjs mutate --suite uniswap-storage --seed 42 --count 3 --variant 1 --submit --allow-chain 1337`

### uniswap-storage-s42-2-basic

Seed 42, variant 2: {"operation":"storage-and-stake","kind":"basic","poolRead":false,"staked":false,"region":"basic"}

- **public:** Offline preview: no signing, setup, RPC or submission
  - RPC response: Offline preview: no signing, setup, RPC or submission
  - Receipt: not_checked, block unconfirmed
  - Rule oracle: {"ruleId":"STORAGE_ACCESS","modelVersion":"forshtat-1337-observed-2026-11-06.v1","confidence":"VERIFIED","source":{"confidence":"VERIFIED","meaning":"Verified observed rule behavior for the pinned fixture, not an attestation of the sidecar build","evidence":[{"file":"evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json","sha256":"c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6"}],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","fixtureCodeHashes":{"basic":"0x9e6b5997a6014b4593d16a2c94beb18ba375ffc97523b5d380f2b96f3b72ea69","staked":"0x2ac1dce1c1843e82101b1f6732da8fb3cf46a21438d7f6a90d5ba0cfef1ce5ac","unstaked":"0xa5e5c558645d99b864453e7db878d54339cabe62eb8e9be97a72f18b31caa17e"}},"expected":"accepted","components":{"payer":50000,"sender":30000,"signature":2800,"total":82800,"cap":100000},"reason":"Budget 82800 <= 100000, payer gas >= evidenced sufficient 50000, and no external pool read; setup must still pass"}
- **alt:** Offline preview: no signing, setup, RPC or submission
  - RPC response: Offline preview: no signing, setup, RPC or submission
  - Receipt: not_checked, block unconfirmed
  - Rule oracle: {"ruleId":"STORAGE_ACCESS","modelVersion":"forshtat-1337-observed-2026-11-06.v1","confidence":"VERIFIED","source":{"confidence":"VERIFIED","meaning":"Verified observed rule behavior for the pinned fixture, not an attestation of the sidecar build","evidence":[{"file":"evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json","sha256":"c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6"}],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","fixtureCodeHashes":{"basic":"0x9e6b5997a6014b4593d16a2c94beb18ba375ffc97523b5d380f2b96f3b72ea69","staked":"0x2ac1dce1c1843e82101b1f6732da8fb3cf46a21438d7f6a90d5ba0cfef1ce5ac","unstaked":"0xa5e5c558645d99b864453e7db878d54339cabe62eb8e9be97a72f18b31caa17e"}},"expected":"accepted","components":{"payer":50000,"sender":30000,"signature":2800,"total":82800,"cap":100000},"reason":"Budget 82800 <= 100000, payer gas >= evidenced sufficient 50000, and no external pool read; setup must still pass"}
- Mutation: {"generatorVersion":"framefuzz.semantic.v1","seed":42,"index":2,"baseTemplateId":"workshop-sponsored-v1","definitionDigest":"25b92b3e079ca2ecc9e5b7c2cc03851fae0c189eebb7b1a3d38b89e5a57793c8","unsignedModel":{"verificationGasLimit":50000,"poolRead":false},"setup":{"staked":false,"poolRead":false,"configuration":{"kind":"basic"}},"parameter":{"operation":"storage-and-stake","kind":"basic","poolRead":false,"staked":false,"region":"basic"}}
- Rule provenance: {"confidence":"VERIFIED","meaning":"Verified observed rule behavior for the pinned fixture, not an attestation of the sidecar build","evidence":[{"file":"evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json","sha256":"c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6"}],"executionCommit":"9aa3645d795945c64400f41a70aace0edfa7f383","sidecarVersion":"v4.1.1","deployedSidecarCommit":null,"reviewedSidecarCommit":"2e22ff0a2898e69ea4bf5275bce1be8581a8582a","fixtureCodeHashes":{"basic":"0x9e6b5997a6014b4593d16a2c94beb18ba375ffc97523b5d380f2b96f3b72ea69","staked":"0x2ac1dce1c1843e82101b1f6732da8fb3cf46a21438d7f6a90d5ba0cfef1ce5ac","unstaked":"0xa5e5c558645d99b864453e7db878d54339cabe62eb8e9be97a72f18b31caa17e"}}
- Fresh-signature reproduction: `node bin/framefuzz.mjs mutate --suite uniswap-storage --seed 42 --count 3 --variant 2 --submit --allow-chain 1337`
