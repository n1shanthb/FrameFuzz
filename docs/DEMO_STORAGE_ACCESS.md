# Demo recording sequence — live StorageReadNonSender divergence

Record a **new** Playground run. Do not show the reference hash `0xf69e0f4b…e31d` as if it were produced live in the video. That file is verification only.

## Operator host (off-camera or cold open)

```bash
FRAMEFUZZ_OWNER_KEY=$FRAMEFUZZ_SENDER_KEY node --env-file=.env bin/framefuzz.mjs serve --mode LIVE_AUTHORIZED --results runs --port 4190
```

Judges never receive the key. No OpenRouter spend required for this path.

## On-camera flow (~3–5 min)

1. Open **http://127.0.0.1:4190** (React UI) → sidebar **Contract Playground**.
2. Click **Load supported scenario** (supported scenario, not arbitrary BYOC).
3. Confirm source is `StorageAccessValidator.sol`, contract **ViolatingWallet**.
4. **Detect / Analyze** → show SENDER_VALIDATOR + analysis summary from backend.
5. **Bind supported fixtures** → **Refresh readiness** → READY_FOR_LIVE_COMPARISON.
6. **Prepare Admission Test** → fresh hash + nonce + fee exposure (not the reference hash).
7. **Run Live Comparison** → approve the bounded-write dialog (requires `LIVE_AUTHORIZED`).
8. Side-by-side ethrex / Skandha panels + table must show LIVE provenance:
   - Public: REJECTED_POLICY / StorageReadNonSender
   - Alternative: ACCEPTED + admission id
   - Policy divergence TRUE
   - Inclusion DROPPED or ADMITTED_NOT_MINED (do not claim mined/execution)
9. **Save Regression** → local digest; Arkiv awaits explicit approval.
10. Keep agent cards visible but do not Start Investigation (no OpenRouter spend).

## Claims to speak aloud

- ADMISSION_DIVERGENCE = true  
- INCLUSION = false  
- EXECUTION_SUCCESS = not observed  

## If prepare/run fails

Show the real error. Do not paste prior evidence into the LIVE table.
