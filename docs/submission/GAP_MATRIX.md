# Gap matrix — ETHGlobal Mumbai submission

Audit time: **2026-11-07**. Deadline: **09:00 IST, Saturday 7 November 2026** ([event details](https://ethglobal.com/events/mumbai/info/details)).

| Requirement | Sponsor | Status | Proof file | Missing action | Priority |
|---|---|---|---|---|---|
| Portal project + description | ETHGlobal | MISSING | — | Human submit on Hacker Dashboard | **P0** |
| Public GitHub anonymous access | ETHGlobal / all | NEEDS VERIFICATION | origin URL 404 HEAD | Push/make public; verify URL | **P0** |
| Demo video 2–4 min (encouraged; CROPS ≤3 min if selected) | ETHGlobal / EF | MISSING | [DEMO_RUNBOOK.md](./DEMO_RUNBOOK.md) | Record & upload | **P0** |
| Thumbnail / screenshot | ETHGlobal | MISSING | — | Portal asset | **P0** |
| ≤3 partner prizes selected | ETHGlobal | NEEDS VERIFICATION | Recommend EF alt-mempool + Uniswap + Arkiv Build | Portal checkboxes | **P0** |
| README + tech docs | ETHGlobal | COMPLETE | README + `docs/submission/*` | — | — |
| Real alt mempool usage | EF | COMPLETE | `evidence/live/2026-11-07/uniswap-policy-divergence-final.json` | Optional explorer link in portal | — |
| Uniswap FEEDBACK.md | Uniswap | COMPLETE | [FEEDBACK.md](../../FEEDBACK.md) | — | — |
| Uniswap feedback **form** | Uniswap | MISSING | Form URL in FEEDBACK.md | Human submit; mark confirmed | **P1** |
| Uniswap public repo | Uniswap | NEEDS VERIFICATION | Same as GitHub | Publicize | **P1** |
| Arkiv write + user read | Arkiv | COMPLETE | publish-receipt + UI/CLI | Keep README writers list complete | — |
| `/arkiv/*.md` criterion files | Arkiv | COMPLETE | `arkiv/*.md` | — | — |
| Arkiv + Swarm bonus | Swarm | NOT APPLICABLE | [arkiv/swarm.md](../../arkiv/swarm.md) | Do not select; optional future Bee work | — |
| Node tests all green | Quality | NEEDS VERIFICATION | focused suites pass; default-concurrency host run unstable | Triage localhost/test-runner failures | **P2** |
| CROPS prize extras | EF CROPS | NOT APPLICABLE unless selected | — | If selected: README CROPS section + video | **P1** if selected |
| Live public website | Optional | NEEDS VERIFICATION | Local UI verified | Optional Render/Railway | **P2** |
| Secrets in git | Security | COMPLETE scan | `.env` gitignored; scan clean | Keep keys local | — |

## Human-only actions (do not automate)

1. Make GitHub public and paste URL into portal
2. Upload demo video + thumbnail
3. Select prizes (EF Frame Tx Alt Mempool, Uniswap Foundation, Arkiv Build)
4. Submit Uniswap https://developers.uniswap.org/hackathon-feedback
5. Confirm EF portal text + optional explorer links for `0x72a82645…`
6. Do **not** select Arkiv+Swarm bonus
7. Do **not** broadcast/deploy/fund without separate approval

Do not claim “all tests pass” on the portal until a clean isolated full-suite run completes.
