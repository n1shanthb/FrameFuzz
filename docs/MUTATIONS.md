# Deterministic semantic mutation engine

`src/mutations/generator.mjs` is pure: it changes unsigned models and setup requirements, never signed bytes. `oracle.mjs` explains expectations. `campaign.mjs` binds generated models to the existing adapter and runner. `rules/devnet-1337.v1.json` pins observed behavior to the historical evidence digest and sponsor code hashes; a changed/missing evidence file or fixture hash downgrades confidence to UNKNOWN.

## Definition contract

Use `mutationDefinition({ suite, seed, count, rules })` for a default definition, or pass a trusted JSON definition using `--definition FILE --rules MODEL.json`. The latter replaces its rule model with the explicitly loaded rules file. Example shape:

```json
{
  "version": "framefuzz.semantic.v1",
  "suite": "verification-gas",
  "seed": 42,
  "count": 7,
  "baseTemplate": {
    "id": "workshop-sponsored-v1",
    "model": { "verificationGasLimit": 50000, "poolRead": false },
    "setup": { "staked": false, "poolRead": false, "configuration": { "kind": "basic" } }
  },
  "operation": { "type": "set-field", "field": "verificationGasLimit", "distances": [1, 2, 10], "radius": 32 },
  "paths": ["public", "alt"]
}
```

Only the supported model fields and semantic operations are accepted. Seed is uint32; preview count is 1–1000; live selection is at most seven variants. Radius is bounded. Credential fields are rejected. Rule/model hashes are deterministic for a given JSON definition/version; account allocation is explicitly independent from semantic generation.

Gas generation derives payer boundary = total cap − sender execution − signature cost. It anchors the boundary and symmetric configured distances, then samples unique remaining offsets with a seeded LCG for larger counts. Seed controls ordering and additional samples. Current builder components are sender 30000 and secp256k1 2800; live campaigns reject rule component configurations inconsistent with that builder. Sampling changes unsigned `verificationGasLimit`, then the real adapter re-encodes and signs every path.

Storage generation uses one `storage-and-stake` operation with three meaningful states: basic/no-read, unstaked/read, staked/read. These produce corresponding setup requirements, not signed-byte changes. Existing configured fixtures are checked for actual code/funding/stake before signing. The engine does not automatically stake the unstaked fixture, deploy speculative contracts, or relabel a mismatched environment as a rule rejection.

## Oracle and confidence

Each path records target rule ID, model/source version, confidence, expected outcome, reason, budget components or state prerequisite. VERIFIED means observed rule behavior bound to the saved fixture, **not** an attestation that the reviewed sidecar commit equals its deployed build. The live sidecar exposes no commit; the limitation is retained in every model/descriptor. Client version differences downgrade expectations.

For plain sponsorship, successful historical receipts used payer verification gas 7093 and demonstrated sufficient budgets starting at 50000. Values below observed usage are precondition candidates, not cap findings. Budgets between observed usage and the evidenced sufficient interval are INFERRED: a mismatch is inconclusive. A budget below the maximum is never sufficient evidence by itself that validation can execute. The engine does not claim to have proved a universal minimum-gas threshold.

New campaign labels are EXPECTED_ACCEPT, EXPECTED_REJECT, UNEXPECTED_ACCEPT, UNEXPECTED_REJECT, UNEXPECTED_RULE_CLASS, PRECONDITION_FAILURE, TRANSPORT_FAILURE, INCONCLUSIVE. Legacy scenario labels and historical evidence remain unchanged. Nonce, funding, malformed signatures, out-of-gas and adapter setup failures are not rule bugs. Missing provenance yields UNKNOWN/INCONCLUSIVE. Intended canonical/alternative storage differences are expected behavior.

## Evidence and reproduction

```powershell
node bin/framefuzz.mjs mutate --suite verification-gas --seed 42 --count 7 --preview
node bin/framefuzz.mjs mutate --suite uniswap-storage --seed 42 --count 3 --preview
node bin/framefuzz.mjs mutate --suite verification-gas --seed 42 --count 7 --submit --allow-chain 1337 --receipt-wait-ms 1000
```

The configured devnet endpoints are the default; existing `--rpc`, `--public-rpc`, `--alt-rpc` and environment conventions override them. `--config FILE` chooses the nonsecret sponsor configuration. `--variant INDEX` selects one zero-based variant without changing the seed/count sequence. Preview performs no RPC, setup, key allocation or signing.

Every saved case has a self-contained semantic reproduction descriptor: base ID, definition and digest, seed/count/index, unsigned model, setup/signing instructions, source version/confidence, gateway/network identifiers and exact default CLI command. Completed cases also retain observed response/errors, actual admission reports when available, full hashes, receipts and signed inputs. Semantic descriptors regenerate deterministically; observed hashes, receipts, times and newly allocated accounts naturally differ on fresh executions.

```powershell
node bin/framefuzz.mjs mutate --replay PATH_TO_REPORT.replay.json --variant 0 --preview
# Rebuild with fresh isolated accounts only when another live submission is authorized:
node bin/framefuzz.mjs mutate --replay PATH_TO_REPORT.replay.json --variant 0 --submit --allow-chain 1337
```

For custom configuration locations, preserve/provide `--config`; replay also retains the original config path. Descriptors include the full rule model and recheck evidence digests, so reproducing a model does not require trusting an undocumented threshold. No replay command automatically resends stale signed bytes.

On a verified unexpected outcome the descriptor is marked `unexpected` and contains a bounded shrink plan. `minimizeBoundary({ value, boundary, reproduces, maxAttempts:8 })` can reduce one numeric dimension toward the nearest reproducing boundary. It requires an explicit caller-provided predicate and assumes monotonicity; attempts are capped at 16. This is tested offline. It never starts network probes automatically. No unexpected result occurred in the live campaign, so no live shrinking or finding is claimed.

## Dashboard

Use suite/seed/count and Preview mutations to create an offline saved report. Submit generated tests is available only when the server was explicitly started with `--submit` and an authorized chain/RPC configuration. Server-side batch/chain/origin guards apply independently of the UI. Results show mutation parameters, per-path oracle/actual/receipt states, coverage by rule/path/region/confidence, and JSON/Markdown/replay downloads. PREVIEW, MOCK and LIVE labels remain distinct.

The current read-only dashboard displays the seven-variant LIVE campaign. The browser also generated and inspected the three-state storage preview. No additional storage-family live campaign was sent in this task; the original live storage evidence and new setup/signature tests support that family. The only new devnet submissions were the fourteen generated gas tests.
