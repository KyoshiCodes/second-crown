# INVARIANTS

Last updated: 2026-09-05 | Version: pre-0.1.0 | Updated by: project bootstrap

Sixteen rules. Violating one is a project-level failure, not a bug. If a task appears to
require violating one, stop and escalate to the owner instead of proceeding.

The **Enforced by** column is aspirational until the phase noted. Each row must be filled in
with the actual test name once that phase lands. An invariant with no test is a wish.

---

## Simulation correctness

### 1. Determinism
The simulation is a pure function of `(state, inputs, seed, ticksElapsed)`. Same inputs always
produce the same outputs.

- No `Math.random()` anywhere outside a seeded PRNG
- No `Date.now()`, `performance.now()`, or `new Date()` inside simulation logic
- Time enters only as a tick count, passed in from outside the sim
- No reads of DOM, storage, network, or environment inside `packages/sim`

**Enforced by:** `_TBD — invariant suite, phase C_`

### 2. Offline equals online
Settling N ticks in one batch produces a state identical to settling N ticks one at a time.

This is the load-bearing property of the entire game. Everything about idle progress, offline
catch-up, and trust in the war layer rests on it.

**Enforced by:** `_TBD — property test, phase C_`

### 3. Player inputs are recorded inputs
Anything the player does that affects the simulation — including Command-mode battle decisions
— enters as a timestamped entry in an input record, never as an out-of-band mutation of state.

Without this, interactive battles break determinism and replay the moment 0.7.0 lands.

**Enforced by:** `_TBD — replay test, phase C, extended at 0.7.0_`

### 4. Big numbers from day one
All game-facing quantities use a big-number library (break_infinity.js or equivalent), never
native floats. Introduced at 0.1.0 with a single resource, before it can hurt.

**Enforced by:** `_TBD — lint rule + type boundary, phase C_`

### 5. Determinism is same-build only
Big-number libraries use floating point internally, so identical results are guaranteed only
for the same build on the same engine — not across devices or versions.

Therefore: authoritative outcomes are **stored in the save**, never recomputed from a seed on
load. Replays are a presentation feature, not a source of truth. Never design a feature that
depends on cross-device bit-identical replay.

**Enforced by:** `_TBD — documented in ARCHITECTURE.md + save schema review_`

---

## Architecture

### 6. The sim is headless and pure
All game rules live in `packages/sim`, with no DOM, no React, no rendering, no I/O. The UI
reads state and dispatches intents; it never contains a rule. A rule inside a component is a
bug.

**Enforced by:** `_TBD — dependency-boundary lint, phase C_`

### 7. Content is data
Buildings, units, themes, doctrines, perks, cost curves, and AI personalities are declarative
data files. Adding content must never require touching systems code.

**Enforced by:** `_TBD — schema validation test, phase D_`

### 8. Stable IDs forever
Internal identifiers (`unit.shock.t4`, `building.economic.mint`) are permanent, lowercase,
snake_case, and never renamed. Display names are separate and freely editable. Saves reference
IDs only.

**Enforced by:** `_TBD — ID registry test, phase D_`

### 9. Strings are externalized
Every player-facing string lives in a keyed data file, never hardcoded in a component. This is
what makes theme renaming possible at all, and it makes localization a content task rather
than a rewrite.

**Enforced by:** `_TBD — lint rule against literal UI strings, phase C_`

### 10. Realms are made of characters
From 0.1.0, every realm's data model includes named characters — rulers, heirs, advisors,
generals — with traits, ambitions, and opinions, even though nothing displays them until
0.6.0.

Full intrigue lands at 0.9.0 and is impossible to retrofit onto realms modeled as loose
numbers. This costs almost nothing now and prevents a catastrophic rewrite later.

**Enforced by:** `_TBD — schema test, phase C_`

---

## Player experience

### 11. Aesthetic is free, power is earned
Each theme carries exactly one signature perk, drawn from a shared pool where every perk is
costed to the same power budget. No theme may exceed that budget. No theme may gate content.

A player who picks a theme purely because they like the look must never be mathematically
behind.

**Enforced by:** `_TBD — perk budget test, phase 0.9.0_`

### 12. Active play multiplies, it never unlocks
A fully idle player must reach all content, just slower. No content behind active-only play, no
login streaks, no punishment for absence.

**Enforced by:** `_TBD — balance harness idle-only run, phase D_`

### 13. No citizen agents
The city is a diorama, not an ant farm. Population is a number. No per-citizen simulation, no
pathfinding inside the city, ever. Building placement is free-form but snaps to a tile grid,
with collision as a 2D occupancy array.

**Enforced by:** Design review. This is the single trap that kills solo city-builders.

---

## Durability

### 14. Saves are versioned and migratable
Every save carries a schema version, with a migration path from 0.1.0 forward. Never break a
save without a migration. Always flag changes that touch save compatibility.

**Enforced by:** `_TBD — migration round-trip test, phase C_`

### 15. Save safety is a feature
From 0.1.0: IndexedDB as primary storage, rotating local backups (keep the last N), and manual
export-to-file / import-from-file in the UI. Never depend on a single storage key.

A player who clears their browser must have had a way to protect a hundred hours of progress.

**Enforced by:** `_TBD — storage integration test, phase C_`

### 16. No blocking settlement
Offline catch-up must never freeze the interface. A coarse-tick granularity ladder (fine ticks
for minutes, coarser for hours and days) with a hard time budget: settling 30 days of absence
completes in well under a second on a mid-range laptop.

If it cannot be done synchronously, chunk it with a progress indicator. Never loop a million
fine ticks on load.

**Enforced by:** `_TBD — performance test with 30-day gap, phase C_`

---

## Amendment procedure

These are not immutable, but changing one is a deliberate act:

1. Write the case in `docs/DECISIONS.md` as a new ADR — what breaks, what improves, what it
   costs
2. Get explicit owner approval
3. Update this file, the master prompt, and `AGENTS.md` together
4. Note it in `CHANGELOG.md`

Silently bending an invariant, or working around a failing invariant test, is the specific
failure mode this document exists to prevent.
