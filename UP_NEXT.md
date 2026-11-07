# Up next

## P0 — record and submit

1. Start `LIVE_AUTHORIZED`, load **Uniswap proof**, Analyze, and Prepare a NEW candidate. Review the new hash/run ID and request separate operator approval before clicking Run; no new chain write is authorized by this shipping pass.
2. Record captured evidence first, then the fresh prepare/review flow. Never present `0x72a82645…` as newly executed.
3. Push only with user authorization, make GitHub public, verify anonymous access, upload the demo, and complete ETHGlobal portal fields/check three prizes. Uniswap feedback form already submitted 2026-11-07.

## P0 — human ETHGlobal submission (deadline 09:00 IST 7 Nov 2026)

1. Make GitHub public; verify anonymous clone/browse (audit saw 404).
2. Submit Hacker Dashboard project (name FrameFuzz, tagline, repo, description).
3. Upload demo video + thumbnail using `docs/submission/DEMO_RUNBOOK.md`.
4. Select ≤3 partners: EF Frame Tx Alt Mempool, Uniswap Foundation, Arkiv Build — **not** Swarm bonus.

## P1 — sponsor eligibility

1. Verify public `FEEDBACK.md` URL after GitHub is public (form already submitted 2026-11-07).
2. Paste explorer/evidence links for `0xf69e0f4b…` and Uniswap `0x72a82645…` into portal EF text.
3. Confirm README lists all Arkiv writer addresses judges should query.

## P0 — OCI live backend (in progress)

1. Create Oracle Always Free VM; open TCP **4190** (+22). Follow `deploy/oci/README.md`.
2. Install FrameFuzz + `/etc/framefuzz/framefuzz.env` (or `pwsh deploy/oci/push-env-from-local.ps1 -RemoteHost <IP>`).
3. Set Vercel production `FRAMEFUZZ_BACKEND_URL=http://<IP>:4190` and redeploy; confirm `/api/readiness` is `LIVE_AUTHORIZED` with `x-framefuzz-proxy: oci-backend`.

## P2 — polish

1. Triage Node failures (236/239): StorageAccessValidator compile bind; dashboard preview; supported scenario digest bind.
2. Optional: one-click Uniswap Playground live wiring (evidence already LIVE via scripts).
3. Optional TLS / domain in front of OCI (Caddy/nginx) instead of raw `:4190`.

## Do not start without explicit approval

Broadcast, deploy, fund, stake, OpenRouter spend, Swarm Bee implementation, git push, external form submit (except when user asks).
