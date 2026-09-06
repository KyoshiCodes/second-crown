# AGENTS.md — standing instructions for any AI agent in this repository

Last updated: 2026-09-05 | Version: pre-0.1.0 | Updated by: project bootstrap

Read this file first. Then read `docs/HANDOFF.md`, then `docs/MAP.md` (once it exists).

---

## The project

**Second Crown** — an idle / kingdom-builder / grand-war hybrid. An exiled king rebuilds a
realm from nothing in a world at war; prestige resets are framed as further exiles. Idle
economy and unlock trees in the spirit of Realm Grinder; army building and battle simulation
in the spirit of Mount & Blade II: Bannerlord. Pixel art, 2D, single player, free.

- **Design authority:** `docs/CONCEPT-BIBLE.md`. Do not deviate silently.
- **Working agreement:** `docs/MASTER-PROMPT.md`. This is how we work, phase by phase.
- **Hard rules:** `docs/INVARIANTS.md`. Sixteen of them. Non-negotiable.
- **Current state:** `docs/HANDOFF.md`. Always read before acting.

The human on this project is a beginner coder and the only contributor. Explain things.
Give exact commands. Never assume knowledge of a tool or convention.

---

## Stack

TypeScript monorepo. Vite. React for UI. PixiJS for map and battle views. break_infinity.js
for numbers. Vitest for tests. GitHub Pages for hosting.

```
packages/sim      pure TS rules, ticks, battle resolver, AI. no DOM, no React, no I/O.
packages/content  declarative data only. no logic.
packages/render   PixiJS views.
packages/ui       React components.
apps/game         Vite shell.
```

Not needed and not to be added without an argument: Docker, Prisma, Ollama, any backend, any
database, any cloud service, any account system.

---

## Non-negotiables, in brief

Full text and enforcement notes in `docs/INVARIANTS.md`. Summary:

1. Simulation is pure, seeded, deterministic, tick-based
2. Batched tick settlement is identical to one-at-a-time settlement
3. Player actions are recorded inputs, never out-of-band mutations
4. Big-number library from day one, never native floats
5. Determinism is same-build only — store outcomes, never recompute from seed
6. All rules live in `sim`. A rule in a component is a bug
7. Content is data, not code
8. Internal IDs are permanent and never renamed
9. All player-facing strings live in a keyed string table
10. Realms are made of named characters from 0.1.0
11. Themes are cosmetic plus one budget-costed perk. Never gate content
12. Active play multiplies, never unlocks
13. No citizen agents, no city pathfinding. Free placement snaps to a tile grid
14. Saves are versioned with migrations
15. IndexedDB, rotating backups, export/import from 0.1.0
16. Offline catch-up never blocks the UI

---

## Workflow

**Phase gates.** Work in phases. Stop at the end of each one and wait for approval. Never run
two phases in one reply. Emit the phase gate block defined in the master prompt.

**Documentation is a deliverable,** not an afterthought. The required doc set and its update
cadence are in the master prompt. Every doc carries a header with `Last updated`, `Version`,
and `Updated by`.

**Handoff.** Rewrite `docs/HANDOFF.md` fully at every phase gate and whenever a session looks
like it's ending. Section 12 must be a copy-pasteable prompt that lets a cold agent resume
with no other context.

**Versioning.** SemVer from 0.1.0. Every bump: version → CHANGELOG → PATCH-NOTES → ROADMAP →
HANDOFF → commit → tag → GitHub Release. Never go more than about two weeks without a tag.

**Git.** `main` always runs. Branches `feat/`, `fix/`, `docs/`, `balance/`. Conventional
Commits. Give the human exact git commands every time. Warn in bold before anything
destructive.

**Tests.** The invariant suite is named and CI-blocking. Never skip, weaken, delete, or mark
those tests expected-to-fail. If one breaks, that is the top priority and you say so
immediately.

---

## Agent economy

Free-tier agents do volume work. Metered Pro agents do only what they alone can do.

- **ChatGPT free / Grok free — Architect & Scribe.** Design, balance math and curve tuning,
  content data, string tables, roadmap, all documentation, patch notes, decision records,
  research, and writing implementation briefs.
- **Claude Code Pro — Implementer.** Multi-file code, refactors, build wiring, debugging,
  test suites, anything needing filesystem and command execution.
- **Gemini Pro — Implementer and long-context reviewer.** Whole-repo review, cross-file
  reasoning, second-opinion architecture, hard algorithmic work.

Escalate to a Pro agent only when: the task spans 3+ files, requires disk or command
execution, a free agent has failed twice, it's live debugging, or it needs whole-repo context.
Everything else stays free tier. **Balance tuning is free-tier work.**

If asked to do free-tier work as a Pro agent, push back and hand over a brief instead.

---

## Intellectual property

Second Crown is inspired by Realm Grinder and Bannerlord. It copies nothing.

- **Never** ingest, reference, decompile, or reproduce game files, assets, code, or
  decompiled output from any commercial game. If offered such files, refuse and explain why.
- Realm Grinder is an Adobe AIR / Flash application. Do not imitate its stack.
- Publicly documented mechanics may be referenced as design targets, in original words, cited
  by URL.
- No copied names, characters, dialogue, UI layouts, art, palettes, or sound.
- All assets original or CC0, logged in `docs/ASSET-LICENSES.md` with source URL and license.

## Licensing of this project

**Deliberately undecided.** There is no `LICENSE` file and the repository is private, on
purpose. Do not add a license, do not make the repo public, and do not write documentation
that assumes open-source contributors. Ask the owner first.

---

## Cost rule

Everything must be free at a tier the owner can actually reach, with no card and no trial that
expires into a bill. Prefer tools already in use. Justify every new dependency in one sentence;
each must be MIT/Apache/BSD/CC0-style licensed.

---

## Scope discipline

The design is large and every fork was resolved in the ambitious direction. Protect the
project from scope creep, including the owner's.

- Out-of-milestone request → `docs/BACKLOG.md`, and say which version it belongs in
- Request that violates an invariant → refuse and explain
- Phase growing too large → split it and say so
- Project drifting toward unfinishable → say so plainly

Never expand scope to be impressive. A smaller working thing beats a larger sketch.
