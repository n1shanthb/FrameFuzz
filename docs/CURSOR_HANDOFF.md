# Cursor agent handoff — integrate only after paymaster experiment is isolated

## Avoid merge conflicts

The active Cloud Agent is working on `PAYMASTER_FEASIBILITY.md` and the Uniswap sponsorship PoC. Do **not** edit the active paymaster contracts or its experiment scripts from another agent mid-run.

Bring this `framefuzz-starter/` directory into a separate branch or separate folder. Its engine is intentionally independent of the sponsor-specific paymaster implementation.

## Connect the known-good transaction builder

1. Find the successful `eth_sendFrameTransaction` signer/encoder in the existing PoC (`poc/workshop-ref/scripts/run_framefuzz_fresh_account.ts` or related file). Verify that code is still compatible with the official devnet endpoints and chain ID.
2. Write `examples/cases/real-baseline.mjs`, exporting an async function `cases()` that builds a *fresh* signed transaction with the matching nonce and returns:

   ```js
   export async function cases() {
     const signedRawFrame = await yourActualWorkshopSigner({ /* chosen frame setup */ });
     return [{ id: 'self-relay-real', paths: [
       { id: 'alt', method: 'eth_sendFrameTransaction', params: [signedRawFrame], expected: 'accepted' }
     ] }];
   }
   ```

3. Keep private keys in environment variables; never persist private keys in logs, fixtures or artifacts. Only signed transaction bytes go to the runner.
4. Run exactly one baseline case with `--allow-chain` and `--submit`. Save the JSON and Markdown evidence. Verify the hash is an admission response, not necessarily an inclusion receipt.
5. Add a baseline where `expected: 'rejected'` with a specific `expectedRule` string **from the real currently deployed sidecar**, not from a speculative model.
6. Use `src/mutations.mjs` with a real re-encoder/re-signer to generate multiple numerical boundary cases. **Each case needs fresh nonces / isolated state** to avoid false positives caused by duplicate transactions.
7. Once the paymaster feasibility verdict is GO or PARTIAL, add it as an optional `cases` module with real deployed contract addresses and exact expected rule families. If NO-GO, leave Uniswap out and focus on EF rule testing.

## Honest evidence checklist

For each result collect: gateway host, chain ID, test case ID, expected outcome, raw RPC admission response, rule label, transaction hash, receipt state, block number if included, and path to deterministic reproduction fixture.

Never conflate these pairs:

- RPC submission hash / onchain inclusion
- Included receipt / successful transaction
- Intended public-vs-alt admission difference / unexpected bug
- Homemade AMM / deployed official Uniswap contract
- Synthetic demo data / actual PoC evidence

## Next feature after the core is green

Implement rule-aware generators for (1) verification-gas boundaries, (2) foreign-storage access with actual staked/unstaked setup, and (3) sponsor ETH sufficiency. Favor one well-verified family of cases over many speculative mismatches.

Build an Arkiv registry *last*, with live write, query, and replay into this case loader.
