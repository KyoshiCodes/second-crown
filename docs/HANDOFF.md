# HANDOFF — current project state

Last updated: 2026-09-05 | Version: pre-0.1.0 | Updated by: project bootstrap

**This is a seed file.** No agent has worked on this project yet. The first agent to run must
rewrite this file completely at its first phase gate, following the twelve-section structure
below. Do not append to it — replace it.

---

## 1. Where we are

Bootstrap only. The repository contains design documentation and no code.

Present:
- `AGENTS.md` — standing instructions
- `docs/CONCEPT-BIBLE.md` — design authority, v1.0, locked
- `docs/MASTER-PROMPT.md` — working agreement and phase definitions
- `docs/INVARIANTS.md` — the sixteen hard rules
- `docs/DECISIONS.md` — ADR-001 through ADR-007
- `docs/BACKLOG.md` — deferred scope

Absent: all code, `package.json`, CI, and the rest of the doc set.

## 2. Current version

Pre-0.1.0. Nothing tagged. No releases.

## 3. What was just completed

Design phase, by the owner working with an AI architect. Five open design forks were resolved,
each in the ambitious direction, each paired with a mitigation. The concept bible was locked at
v1.0 and the master build prompt reviewed for gaps, producing sixteen invariants from an
original eleven.

## 4. What is in progress

Nothing. Awaiting the first agent session.

## 5. Immediate next step

Phase A of the master prompt: read the bible and prompt, confirm or challenge the stack, name
three likely failure points, list underspecified areas, ask at most three questions, then stop
at the gate.

Two agents are running Phase A and Phase B independently, in separate working folders, as an
evaluation the owner is conducting. Work only on your own copy.

## 6. Known issues

None — no code exists.

Known *risks*, carried from design review, all mitigated in the invariants: offline settlement
performance, interactive battles versus determinism, cross-device float drift, save loss, and
free placement inviting citizen simulation.

## 7. Decisions made this session

See `docs/DECISIONS.md`, ADR-001 through ADR-007.

## 8. Files touched

All bootstrap files listed in section 1.

## 9. Anything the owner must do manually

- The private GitHub repository already exists at github.com/KyoshiCodes/second-crown

- Push only the winning agent's folder to that repository

## 10. How to verify the build is healthy

Not applicable yet. **The first agent to add code must replace this section with exact
commands** — install, dev server, test, build — and what correct output looks like. Every
future session begins by running them.

## 11. Open questions for the owner

None outstanding. The first agent's Phase A questions go here when it stops at the gate.

## 12. Pickup prompt for the next agent

Copy everything below into a fresh agent session.

---

You are taking over **Second Crown**, an idle / kingdom-builder / grand-war hybrid game. It is
at the bootstrap stage: design documentation is complete and locked, and no code exists.

Read these, in order:
1. `AGENTS.md` — your standing instructions, including the agent economy and IP rules
2. `docs/MASTER-PROMPT.md` — the working agreement, phase definitions, and required doc set
3. `docs/CONCEPT-BIBLE.md` — the design authority, v1.0, locked
4. `docs/INVARIANTS.md` — sixteen hard rules; violating one is a project-level failure
5. `docs/DECISIONS.md` — ADR-001 to ADR-007, all locked

Then begin **Phase A** exactly as the master prompt defines it: confirm or challenge the stack
with reasoning, name the three most likely failure points of this specific design, list what is
underspecified, ask at most three blocking questions, and **stop at the phase gate**. Write no
code in Phase A.

Context you need:
- The owner is a beginner coder and the only contributor. Explain your reasoning and give exact
  commands. They are on Windows with PowerShell, Node, VS Code, and Obsidian
- Every design fork was resolved ambitiously, each with a mitigation. Respect the mitigations —
  they are the only reason the scope is survivable
- The stack is locked: TypeScript monorepo, Vite, React, PixiJS, break_infinity.js, Vitest,
  GitHub Pages. No backend, no database, no Docker. You may argue against it in Phase A, with a
  real argument
- Do not add a LICENSE file and do not make the repository public. Ask first
- Rewrite this handoff file completely at your first phase gate

---

## Session log

| Date | Agent | Phase | Version | Summary |
|---|---|---|---|---|
| 2026-09-05 | Design architect | Design | pre-0.1.0 | Bible locked at v1.0; sixteen invariants; ADR-001–007; bootstrap files created |
