# Imported PoC provenance

`poc/fast_gate_rerun.ts`, `poc/reserve_staked_only.ts`, and `poc/PAYMASTER_FEASIBILITY.md` are key-free reference files supplied in `framefuzz-poc.zip` (SHA-256 `A44B844156E1C3738345AFF82C1BD7AD52BA9386A87F3C8B25992338F14A1C8C`). The two `external-*.json` files are earlier agent evidence supplied in `framefuzz-paymaster.zip`; they are **external reports**, not this build's executions.

`paymaster/ReserveReadingPaymaster.sol` and its ABI/creation bytecode JSON are the user's original paymaster implementation/artifact. They were imported from `framefuzz-paymaster.zip` without reconstructing the contract. It inherits the MIT-licensed `@forshtat/hegota-support` package. The contract deliberately has no production security model.

The archived scripts are references, not runnable FrameFuzz entrypoints. They import workshop files omitted from the first archive and reuse a signed transaction across both paths. The integrated code fixes that: every case/path gets a fresh sender and independent signature. Some other supplied scripts embed throwaway keys and are intentionally NOT imported into Git. Raw ZIPs/extractions and local upstream clones are ignored.

The integrated `src/adapters/workshop-codec.mjs` adapts the frame construction from `forshtat/mempool-workshop` commit `bcfe02a196ca97b6fb0d1044db9d0b4c673831fc` (`src/lib/frameTx/build.ts`, `codec.ts`, `profile.ts`) and the supplied `fast_gate_rerun.ts`. Cryptographic encoding/signing uses the actual pinned `@forshtat/hegota-support@0.0.1` and `viem@2.57.7` packages, not copied/generated cryptography.

Reviewed rule source: `forshtat/mempool-workshop-sidecar` commit `2e22ff0a2898e69ea4bf5275bce1be8581a8582a`, particularly `validationPrefix.ts` and `validators/frameTx.ts`. Live execution client reports commit `9aa3645d795945c64400f41a70aace0edfa7f383`; live sidecar reports v4.1.1 but an empty commit. The reviewed sidecar source is therefore a candidate source pin, not a verified build-to-deployment match. Runtime admission reports in `evidence/live/2026-11-06/` independently show the actual applied storage and gas-limit rules.
