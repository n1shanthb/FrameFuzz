# FrameFuzz regression cases

Schema name: `framefuzz.regression.v1`. Case version: `1`. The TypeScript contract is `src/arkiv/types.d.ts`; runtime definitions and checks are in `src/arkiv/schema.mjs` and `case.mjs`.

Each entity contains a self-contained semantic fixture, not just a result log. Its SDK columns are: `caseVersion` (u64); indexed strings `suite`, `family`, `ruleId`, `implementation`, `classification`, `contentDigest`; indexed `publisher` (addr) and `expiresAtBlock` (u64); and `record` (bytes containing UTF-8 JSON). The SDK also writes the indexed `arkiv.schema` tag. Arkiv supplies immutable creator, current owner, key and expiry metadata.

The record contains:

- Schema/case version, suite, mutation family, rule ID and implementation version.
- Target network chain 1337, execution commit, sidecar version and optional deployed sidecar commit. A missing commit remains null.
- Seed and selected semantic parameters, including the gas boundary/offset/region or storage/stake state.
- Original public/alternative expected behavior, confidence, observed admission, verdict, hash and receipt summary. These are publisher claims, not Arkiv attestations.
- A constrained reproduction descriptor: generator version, portable definition, definition digest, selected variant index, base template, unsigned model and setup. It regenerates the selected scenario in the existing mutation runner.
- Evidence classification LIVE/PREVIEW/MOCK, SHA-256 of the full offchain source evidence, scope and case ID.
- Publisher wallet, selected duration in blocks, exact absolute expiry block and SHA-256 content digest.

The content digest is SHA-256 of recursively key-sorted JSON excluding `contentDigest`. The generator definition digest follows the existing generator's JSON serialization. Validation checks both digests and regenerates the selected semantic model/setup/parameters. Indexed attributes must agree with the payload, and publisher must agree with Arkiv's immutable creator. Current owner can differ after a transfer; discovery is not restricted to the reader's wallet.

Payloads are capped at 32 KiB, definitions at 64 variants, gas radius at 256. Only the existing verification-gas and uniswap-storage semantic operations are permitted. No remote scripts, local files, arbitrary RPCs, raw calldata, signatures, keys, funding configuration or freeform error logs are imported. Publishing rebuilds an allowlisted projection rather than redacting an entire log. Transaction hashes are derived from historical signed bytes; signed bytes themselves are omitted.

Creation uses readonly entities with permissionless extension disabled. Expiration is an absolute block selected using the current Rabdi block plus 30–1,296,000 blocks (approximately 30 days maximum at two seconds/block). The demo selects 302,400 blocks, approximately seven days, expiring at block **569638**. A few blocks pass between preflight and inclusion. Query filters expiry and fetch/import recheck the live block. Extended records whose expiry differs from the immutable payload are rejected; republish a new case to change its lifetime. Local historical exports remain available after expiry, but the registry will not offer the expired entity for replay.

Registry chain: Rabdi **7794095**. Fixture target: EIP-8141 devnet **1337**. These are separate chains, wallets, RPCs and transaction formats.

Optional backward-compatible v1 `uniswap` metadata describes the protocol, pool ID, StateView/PoolManager/payer runtime hashes and addresses, stake registry/amount/delay/withdrawal state, observed slot0 and initialization flag, per-path policy IDs/expectations, Solidity reference and provenance limitations. It is checked by the same strict allowlist/digest logic and copied to preview `communityOrigin.protocolMetadata`, never into executable runner configuration. Older gas entities remain valid without it. The additional Uniswap entity expires at block570761. Its actual alternative outcome is INFRASTRUCTURE_FAILURE, not successful admission.
