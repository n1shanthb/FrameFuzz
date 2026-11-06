# Sponsored offline preparation

Supported workflow: deterministic manifest generation, not deployment. `swarm sponsored-plan` accepts a completed saved investigation and a JSON context containing only chainId, profile, deployer, owner, deploymentNonce and payer. No key, signer, RPC, live-state claim or write capability is accepted.

```powershell
$env:FRAMEFUZZ_SWARM='on'
node bin/framefuzz.mjs swarm sponsored-plan --investigation evidence/investigator/2026-11-06/sonnet-retry-2.json --context examples/swarm/sponsored-context.json --output runs/sponsored-plan.json
```

The supplied context deliberately has unresolved addresses. Missing inputs appear explicitly; no addresses are fabricated. For a resolved offline prediction, supply nonzero deployer/owner addresses, an observed decimal pending deployer nonce, and the existing pinned basic payer. These are assertions for planning, not verified live state. Wrong chain/profile, unknown fields, mismatched payer and contradictory nonce/deployer inputs fail closed.

Five sequential top-level CREATE predictions assume no interleaving deployer transactions. Constructor arguments, creation/init-code hashes, compiler input/source digests, actual Sonnet `record(2,10)` descriptor and per-role dependencies are included. Each sender account nonce must be observed after construction: internal CREATEs can advance it. No historical signature is reused.

Caps: five deployments ×6m gas ×2gwei =0.06 test ETH, plus four frame fees capped at0.001 each =0.064 total fee envelope. This is a cap, not a gas estimate or proof of sufficient sponsor funds. Sponsor restoration/funding remains unresolved and excluded; never silently transfer funds. Preparation completeness never sets liveReady true. Runtime hash/helpers, baseline gas, code/state/funding and separate approval remain required.

This is the three-frame sponsored path. The two-frame self-funded candidate and its0.066 funding proposal remain separate in SELF_FUNDED_FEASIBILITY.md. No deployment workflow is claimed complete.
