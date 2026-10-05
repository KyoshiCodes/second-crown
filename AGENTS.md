# AGENTS.md — standing instructions for any AI agent in this repository

Last updated: 2026-09-06 | Version: playtest-0.3 | Updated by: Grok docs cadence

Read this file first. Then `docs/HANDOFF.md`, `docs/INVARIANTS.md`, `docs/CHANGELOG.md`, `docs/USER-NOTES.md`, `docs/DEV-NOTES.md`.

---

## The project

**Second Crown** — idle / kingdom-builder / grand-war hybrid. Design: `docs/CONCEPT-BIBLE.md`. Rules: `docs/INVARIANTS.md`. State: `docs/HANDOFF.md`.

The human owner is a beginner coder. Give exact commands. Never assume tooling fluency.

Live playtest: `http://129.153.17.72:8787/` (Oracle, process `sc-cloud`, port 8787). Repo: `KyoshiCodes/second-crown`, branch `main`.

---

## Stack

TypeScript monorepo. Vite. React UI. PixiJS map. break_infinity.js. Vitest.

```
packages/sim      pure TS rules. no DOM, no React, no I/O.
packages/render   PixiJS map.
packages/app      Vite + React shell, cloud UI.
packages/shared   types.
server/index.mjs  JSON saves, Discord, board. Runs the sim only for a shared hold (none yet).
```

---

## Documentation cadence (required)

After every **meaningful** merge to `main` (new system, live behavior change, or architecture decision), update all four in the same change set:

- `docs/HANDOFF.md`
- `docs/CHANGELOG.md`
- `docs/USER-NOTES.md`
- `docs/DEV-NOTES.md`

Skip only for throwaway local experiments that never leave the machine. Do not “do docs later.”

**Slice rule.** After any slice that changes what a player sees or what the sim does, update `HANDOFF.md`, `CHANGELOG.md`, `USER-NOTES.md`, and `DEV-NOTES.md` in the **same commit**. Skip only for a comment, a rename, or a test-only tweak that does not change behavior. A slice is not done while any of those four files still describes it as unmerged.

---

## Non-negotiables (short)

Full text in `docs/INVARIANTS.md`. Especially: determinism (2), sim independent of React (6), no sim on the server for solo play (17). A shared hold may call `packages/sim` on the server (ADR-011); never copy rules into `server/`.

---

## Workflow

Owner verifies with `npm test` then `npm run build -w @second-crown/app`, then SSH:

```bash
cd ~/second-crown && git pull && npm test && npm run build -w @second-crown/app && pm2 restart sc-cloud
```

There is no `sc-game` process.

Ask before large `packages/sim` rewrites. UI/docs/render are the default sandbox.

---

## Agent roles

Grok / ChatGPT: architecture, docs, balance, briefs.  
Claude: multi-file UI structure.  
Gemini: art, flavor, long-context review.  
Do not run two agents on the same files without a merge plan.

---

## IP and license

Inspired by Realm Grinder and Bannerlord. Copy nothing. Repo stays private. Do not add a LICENSE unless the owner asks.
