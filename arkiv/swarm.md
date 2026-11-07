# Arkiv + Ethereum Swarm — current status

**Status: NOT IMPLEMENTED / NOT ELIGIBLE for the Arkiv + Swarm bonus.**

Official bonus requirements: [ETHGlobal Mumbai · Arkiv prizes](https://ethglobal.com/events/mumbai/prizes/arkiv) · Swarm docs: https://docs.ethswarm.org · https://www.ethswarm.org

## Clarification

FrameFuzz’s **multi-agent AI swarm** (Contract Scout, Semantic Mutation, Feasibility Validator, Evidence Critic) is **not** the Ethereum Swarm decentralized storage network. Those agents call OpenRouter models; they do not upload to Bee, buy postage stamps, or produce Swarm content references.

## Required `/arkiv/swarm.md` fields (official checklist)

| Required field | Status |
|---|---|
| What is kept on Swarm vs Arkiv | **Missing** — nothing stored on Swarm |
| Arkiv entity field holding Swarm reference | **Missing** |
| One Arkiv entity key + openable Swarm reference | **Missing** |
| Postage stamp batch ID + wallet + Bee node/service | **Missing** |
| Repo files that upload/read Swarm | **Missing** — no Bee API client |
| Steps to run one upload and one read | **Missing** |
| Demo video moment showing Swarm | **Missing** |
| Friction with Swarm | N/A until integration exists |

## What FrameFuzz does have on Arkiv (without Swarm)

- Schema `framefuzz.regression.v1` — portable admission regression fixtures
- Live publish / query / fetch / unsigned import on Rabdi chain **7794095**
- Example entity: `0xf1089c05e4a7ec4d3a66087381c1c78b43728a836e4ae10eb694cfd6ce2a06a1` (no Swarm field)

## Do not invent

No Bee endpoint, postage batch, Swarm reference, or Arkiv→Swarm link is claimed here. Implementing Swarm storage requires separate explicit authorization.
