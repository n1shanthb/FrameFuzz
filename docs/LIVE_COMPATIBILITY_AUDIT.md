# Current live compatibility audit

Capture: `evidence/investigator/2026-11-06/compatibility-preflight.json`, 2026-11-06T06:44:10.667Z. Command:

```powershell
$env:FRAMEFUZZ_SWARM='on'
node bin/framefuzz.mjs swarm preflight --output evidence/investigator/2026-11-06/compatibility-preflight.json
```

Eight allowlisted read-only RPC requests; no deployment, transaction, retry or Arkiv write. Chain1337 endpoint: https://altmempool.forshtat.com/rpc.

Observed ethrex v23.0.0-eip8141-tracer commit9aa3645d795945c64400f41a70aace0edfa7f383; sidecar v4.1.1 with empty build commit, boot ID ef0fccbaca0c428c, latestSeq16. Head0x98 was three seconds old. Compared with the earlier stale high head and different boot ID, this is consistent with a restart/reset; the operator has not confirmed that inference.

Pinned sponsor 0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30 now returns empty code (keccak c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470) and zero balance. Do not reuse historical fixture viability assumptions. Prior disk-full submission failures remain historical evidence, unchanged; the fresh head does not establish gateway persistence/write health.

No funded owned deployer/owner context is configured. Current canonical EIP hash compatibility versus workshop hash is unresolved. The conditional five-deployment/four-submission manifest retains unresolved addresses/initcode; it is a plan, not executed transactions. No live unauthorized action or independent live reproduction is proven. A separate live authorization and resolved funding, fixtures, hash compatibility and write-health checks are required before broadcasting. There is no automatic retry.
