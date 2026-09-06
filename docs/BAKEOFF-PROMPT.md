# Identical paste prompt for Claude and Gemini

The owner pastes the block below into BOTH tools with zero edits.
Each agent must already be opened against the matching branch (see owner setup).

---

You are working in the Second Crown git repo that is already checked out in this workspace.

1. Read `docs/AGENT-ROLE` first. That file assigns your role. Do not guess. Do not switch roles.
2. Read, in order: `docs/HANDOFF.md`, `docs/INVARIANTS.md`, `docs/AGENT-TASK.md`.
3. Do only the mission in `docs/AGENT-TASK.md`.
4. Stay on the current branch. Never push to `main`. Never edit `packages/sim` or `server/`.
5. When finished, commit on this branch and open a pull request into `main`.
6. If `npm test` or the app build fails because of your files, fix it. If sim tests fail and you did not touch sim, stop and report.
7. Do not deploy to the Oracle VM. Do not change Discord env vars.

Live playtest (read-only context): http://129.153.17.72:8787/
Repo: https://github.com/KyoshiCodes/second-crown

---
