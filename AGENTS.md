# FrameFuzz agent instructions

Applies to the whole repository in Codex, Cursor, and other coding agents.

## Start every session
1. Read `AUTHORITY.md`, `CURRENT_STATUS.md`, `UP_NEXT.md`, and `docs/BUILD_BRIEF.md`.
2. Inspect `git status --short`, `git log -5 --oneline`, and relevant diffs before editing.
3. Follow the first unfinished task in `UP_NEXT.md`, preserving user changes.
4. Open the same repository folder (`E:\ethglobalmumbai`) when switching IDEs.

## Work and checkpoints
- Keep Node.js 20+ compatibility and preserve working starter code.
- Complete a medium-sized coherent change, verify it, then commit it without waiting for another request. One file is fine when it is a complete change.
- Use a short single-line conventional subject: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, or `refactor:`. Stage explicit paths; never blindly stage everything.
- Keep related implementation and tests together. Do not commit broken intermediate work merely to increase commit count.
- Update `CURRENT_STATUS.md` and `UP_NEXT.md` at each meaningful checkpoint and before handoff; synchronize `BUILD_STATUS.md` when verification or capabilities change.
- Record exact commands, observed outcomes, blockers, active work, and the next concrete action. Refer to Git history for commit IDs to avoid self-referential commit hashes.
- Do not force-push, rewrite history, change Git identity, or overwrite another experiment. Push only with user authorization and a verified destination.

## Evidence and safety
- Only local chains or explicitly authorized devnets; never mainnet or real funds.
- Keys belong in environment variables, never fixtures, logs, reports, or commits.
- Distinguish synthetic data, mock RPC tests, externally reported results, and independently reproduced live evidence.
- Admission, inclusion, and successful execution are distinct states.
- Never fabricate signatures, hashes, receipts, deployed addresses, rules, or swap success.
- Mutate unsigned models and re-sign every variant; isolate nonce/state across admission paths.
- No Arkiv, Chainlink, World, or unrelated sponsor work before the core passes its acceptance gate.
