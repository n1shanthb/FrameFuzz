# Bounded adversarial investigator

Implemented behind `FRAMEFUZZ_SWARM=on`. Default is off. One OpenRouter model performs three specialist perspective passes (validation, state and differential), followed by an observation-conditioned investigator revision. These are sequential model requests, not independent autonomous agents.

## Configure and run

Configure `OPENROUTER_API_KEY` in the environment of the terminal launching FrameFuzz. Never paste or commit the key. Set `OPENROUTER_MODEL=anthropic/claude-sonnet-4.6`; the alias `sonnet` selects this default. Optional `OPENROUTER_ENDPOINT` must be a credential-free HTTPS URL (localhost HTTP is permitted for testing).

```powershell
$env:FRAMEFUZZ_SWARM='on'
$env:OPENROUTER_MODEL='anthropic/claude-sonnet-4.6'
node bin/framefuzz.mjs swarm investigate --mode openrouter --output runs/sonnet-investigation.json
node bin/framefuzz.mjs swarm replay runs/sonnet-investigation.json --variant 0 --output runs/replay-0.json
node bin/framefuzz.mjs swarm replay runs/sonnet-investigation.json --variant 1 --output runs/replay-1.json
node bin/framefuzz.mjs serve --results runs --port 4180
```

In Swarm Lab check configuration, explicitly authorize bounded model requests, then start the offline AI investigation. Results and the actual event timeline can be exported, saved and reopened after restart. Saved-demo mode prohibits external model calls. The normal dashboard shell, Technical Briefing and original runner are preserved.

For a deliberately scripted demonstration use `swarm investigate --mode simulated` or the labeled deterministic fallback button. Missing credentials also select `SWARM_SIMULATED — NO REAL LLM` in the CLI. A failed real request produces INCOMPLETE; it never silently becomes a successful scripted model investigation.

## Execution and trust boundary

Strict JSON proposals name a suite, assumption, changed field(s), bounded operation (0..65535), parameter (0..1000000), unsafe/safe recovery predictions, falsifier and revision. Authorized A is record(1,10). Unknown properties, unchanged values and inconsistent change labels fail closed. Gas/storage suites are rejected by this offline backend. Runtime code fixes contracts, targets, keys, signing context, tools and verdicts. Model output cannot add endpoints, shell commands, deployments or verdict flags.

The coordinator deduplicates actual semantic values, penalizes known record(2,999), ranks new field coverage and selects one experiment. The engine ABI-encodes those values, performs real ECDSA owner-recovery checks against deliberately unsafe/safe fixture hash profiles, and reports actual invariants independently of predictions. Actual observations are sent to the same model to revise and select a distinct follow-up. At least two executions and two fresh-process reproductions are required for COMPLETE_OFFLINE_INVESTIGATION.

Classification is **OFFLINE_SIGNATURE_BINDING**. No EVM execution, admission, successful action or onchain vulnerability is established. Unsafe recovery true and safe recovery false are local cryptographic observations only. Workshop/current-EIP hash differences remain a separate live compatibility blocker.

Replay descriptors contain semantic mutation, compiler version, compiler input and source hashes, expected semantic properties and an integrity digest. A new Node process receives only the descriptor, strips provider/deployer credentials from its environment, recompiles fixed owned sources and checks provenance and semantic equivalence. It needs neither the model transcript nor stale signatures. A digest proves integrity, not publisher authenticity.

## Provider limits and logging

Maximum six requests, 60000 total accounted tokens, 1000 output tokens/request, 24000 input bytes/request, 45-second timeout and $0.25 client budget. Conservative reservations precede requests; actual reported usage replaces reservations when available. Provider routing requests prompt/completion ceilings of $5/$25 per million tokens. Missing usage retains reservation. These client checks are not a guarantee against provider billing errors. No automatic retries. No blockchain write/deploy/publish capability is exposed.

Reports include sanitized hypotheses, actual observations, revisions, model/generation identifiers, usage and prompt digests. Authorization headers, API keys and raw error bodies are never exported. Only the three fixed owned contract sources and bounded experimental context are sent to the provider; raw historical evidence/environment configuration are not prompts.

Implementation follows official [structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs) and [usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting) documentation.

## Executed status, November 6

No real OpenRouter request has been demonstrated: process, user and machine `OPENROUTER_API_KEY` presence checks were false after the user reported configuration. The location/terminal holding it remains pending; no value was requested in chat.

Saved fallback: `evidence/investigator/2026-11-06/simulated-investigation.json`. Scripted record(1,73) and record(19,10) both showed unsafe owner recovery and safe rejection and reproduced in independent processes. These are not model-selected values. Separate CLI replays are saved beside the report. Mock-transport tests prove different proposed values alter actual calldata and actual observations condition the revision request; they do not prove a real provider call.

## Latest OpenRouter attempt - November 6, 2026

The root .env now exists, is Git-ignored, and exposes OPENROUTER_API_KEY when loaded with Node --env-file=.env. Key presence verified without displaying its value; credentials/authentication are not proven by presence alone. Model: anthropic/claude-sonnet-4.6.

Executed: $env:FRAMEFUZZ_SWARM='on'; $env:OPENROUTER_MODEL='anthropic/claude-sonnet-4.6'; node --env-file=.env bin/framefuzz.mjs swarm investigate --mode openrouter --output evidence/investigator/2026-11-06/sonnet-investigation.json

Observed INCOMPLETE: one provider request attempted, OpenRouter request timeout, zero validated model responses, zero generated/executed experiments, zero blockchain broadcasts. No generation ID, response usage or actual charge was received. The reported $0.06163 is a retained conservative reservation, not an observed bill. No automatic retry. Existing 92-test result unchanged; this checkpoint changes only documentation/evidence. Historical fallback and LIVE evidence remain untouched.

Next: diagnose provider/network responsiveness before an explicitly bounded rerun; retain this failed capture and write any later run to a new file. Successful real model investigation remains unverified. Launch future configured processes with --env-file=.env; the existing dashboard process does not automatically load that file.
