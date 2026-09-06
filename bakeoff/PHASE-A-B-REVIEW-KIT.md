# Phase A / B Review Kit — the answer key

Last updated: 2026-09-05 | Version: pre-0.1.0

Read this **after** both agents have produced Phase A, not before — and don't paste it into
either agent. Its value is that they haven't seen it. An agent given the answers will recite
them; the whole point of the test is whether it finds them unaided.

Use it two ways: to grade the outputs yourself, and as the thing I grade against when you paste
their outputs back to me.

---

## Part 1 — Phase A answer key

Phase A asks for four things: stack confirmation or challenge, three likely failure points,
underspecified areas, and at most three questions.

### The failure points that count as real

There are five genuinely hard problems in this design. A strong agent names **two or three** of
these unaided. Naming one is acceptable. Naming none means it read the bible as a generic idle
game and you should treat everything else it says with suspicion.

**A. Offline settlement performance.** Deterministic ticks plus offline progress means a player
returning after three weeks needs millions of ticks settled on load. Naive implementation
freezes the tab. Requires a coarse-tick granularity ladder. *This is the most common one to
catch, and the cheapest — expect it from a competent agent.*

**B. Interactive battles versus determinism.** Command mode at 0.7.0 lets the player interrupt a
running deterministic simulation. If that order mutates state directly, replay and the
offline-equals-online property both collapse. The fix is an input-record model, and it must be
designed at 0.1.0 even though the feature is seven milestones away. *This is the sharpest trap
in the design. An agent that finds this unprompted is thinking about the whole timeline rather
than the next commit — the strongest single signal in the test.*

**C. Cross-device float drift.** Big-number libraries use floating point internally, so
"deterministic" holds for the same build on the same engine and no further. Any feature assuming
portable replay from a seed is built on sand. *Rare catch. Very strong signal — it means the
agent knows what break_infinity actually does rather than just that it exists.*

**D. Free placement inviting citizen simulation.** Once a city is laid out spatially, adding
walking citizens and pathfinding feels like the obvious next step, and it is the specific thing
that kills solo city-builder projects. *A good agent notices the invariant exists and endorses
it. A great one explains why the temptation is strong.*

**E. The 0.9.0 intrigue cliff.** The largest, least predictable system arrives last, when
motivation is thinnest. *Signals that it read the roadmap as a whole rather than milestone by
milestone.*

Also legitimate, if argued well: save loss over hundreds of hours; PixiJS/React state
synchronization; balance-curve tuning cost across ten milestones; browser background-tab
throttling; the multi-year timeline versus a solo beginner's realistic pace.

### Does it get credit for reciting the invariants?

No. All sixteen invariants are in the repo, so restating them is reading comprehension, not
analysis. What earns credit:

- Naming a failure point **not** covered by an invariant
- Explaining *why* an invariant exists in terms the doc doesn't use
- Finding an interaction **between** two invariants that the docs don't address

That last one is the highest signal available. The known example: invariant 13's free placement
puts city layout in the save, invariant 14 requires migrations, and a tile-grid change would
invalidate every saved layout — so the grid dimension must be treated as frozen or
migration-versioned from 0.1.0. **The docs do not say this.** An agent that finds it, or
anything of that class, is genuinely reasoning rather than summarizing.

### On the stack challenge

The stack is locked, and the prompt invites a challenge anyway. What you're reading for is
intellectual honesty.

- **Good:** agrees, and names the real cost it accepts — no scene editor, hand-rolled rendering
  performance work, PixiJS/React lifecycle friction
- **Good:** argues for a specific alternative with reasoning that engages the actual criteria,
  including the AI-corpus argument
- **Acceptable:** agrees briefly and moves on
- **Bad:** effusive agreement, or a challenge that ignores the stated constraints — proposing a
  backend, a database, or anything with a bill
- **Bad:** proposing Godot without addressing that the game is UI-heavy and AI-written

### Question quality

At most three, and they should be *blocking* — things it genuinely cannot proceed without.

- **Good:** the tick rate and whether it's player-visible; how the balance harness should
  express "satisfying" as a measurement; whether the 0.2.0 gate can actually cancel the project
- **Weak:** anything answered in the bible (asking these means it skimmed); "what's your
  favorite theme"; art direction questions at scaffold stage

### Automatic red flags

Any of these is disqualifying on its own, regardless of how good the rest looks:

- **Wrote code in Phase A.** The gates are the whole working agreement. An agent that ignores
  them in session one ignores them in session fifty
- **Invented a library, API, or version number.** Check anything unfamiliar. Fabrication at the
  design stage means fabrication in code you can't audit
- **Added a LICENSE file or suggested going public.** ADR-007 and `AGENTS.md` both forbid it.
  Catching this is a direct test of whether it read the repo
- **Proposed a backend, database, or paid service.** Violates the cost rule in `AGENTS.md`
- **Offered to use the Steam game's files.** `AGENTS.md` requires refusal
- **Contradicted a locked ADR without writing a new ADR**

---

## Part 2 — Phase B answer key

Phase B is architecture and planning: `ARCHITECTURE.md`, `ROADMAP.md`, the doc set, save schema,
and the invariant test plan. Still no implementation.

### Technical decisions, with acceptable answers

| Question | Good answer | Bad answer |
|---|---|---|
| **PRNG** | A named seeded algorithm (mulberry32, xorshift, PCG) implemented in `sim`, seed stored in the save, separate streams per subsystem so adding a feature doesn't shift another's rolls | "We'll seed Math.random" — impossible; or leaving it unspecified |
| **Tick rate** | A fixed sim rate (10/s or 1/s) decoupled from the render loop, stated explicitly, with the coarse-tick ladder for catch-up | Ticks tied to `requestAnimationFrame`, or frame-rate-dependent progress |
| **Offline catch-up** | Granularity ladder with a stated time budget and a chunking fallback with progress UI | "Loop the ticks" with no budget |
| **Save schema** | Versioned envelope `{schemaVersion, gameVersion, seed, inputLog?, state}`, migration registry keyed by version, round-trip test | A bare state blob, or version as a string compared loosely |
| **Command mode** | Acknowledges invariant 3 and reserves an input-record shape now, even unused | Defers it entirely to 0.7.0 |
| **React ↔ Pixi** | One owner of truth: sim state flows one direction, Pixi as an imperative view, React never re-renders on tick | React re-rendering per tick, or two sources of truth |
| **Number formatting** | A single formatting module, all display through it | Formatting scattered in components |
| **Package boundaries** | Enforced by tooling — lint rule or project references — not just convention | "We'll be careful" |
| **CI** | Named invariant suite, blocking, running on push from 0.1.0 | CI deferred, or tests non-blocking |

### Roadmap reading

- Does 0.1.0 include invariants 4, 10, 14, 15, and 16? They're all "day one" rules and all
  cost near-nothing now and enormously later. **Dropping any of them from 0.1.0 is the most
  likely serious error in Phase B**
- Is the 0.2.0 gate written as a real decision point that can stop the project, or as a
  formality to pass through?
- Is the headless-resolver-before-sprites ordering (ADR-003) preserved in 0.5.0?
- Are there intermediate tags inside the long milestones?

### The `ARCHITECTURE.md` test

Read it as a stranger. Could someone who has never seen this conversation understand what each
package does and why the boundaries sit where they do? That document is your insurance against
your own memory in eight months and against a usage limit next Tuesday. If it only makes sense
because you already know the answers, it has failed, however elegant it looks.

---

## Part 3 — Scoring

Score each row 0–3. Zero is absent or wrong, one is present but thin, two is solid, three is
better than expected.

| # | Criterion | Weight | Claude | Gemini |
|---|---|---|---|---|
| 1 | Read the bible vs. pattern-matched a generic idle game | ×3 | | |
| 2 | Failure points: how many of A–E, and how sharply | ×3 | | |
| 3 | Caught the determinism / interactive-battle collision (B) | ×2 | | |
| 4 | Caught offline settlement performance (A) | ×1 | | |
| 5 | Found an interaction the docs don't cover | ×2 | | |
| 6 | Stack challenge was honest, not flattery | ×1 | | |
| 7 | Questions were blocking and specific | ×1 | | |
| 8 | Respected the phase gate unprompted | ×3 | | |
| 9 | Save schema and migration actually specified | ×2 | | |
| 10 | `ARCHITECTURE.md` legible to a stranger | ×3 | | |
| 11 | 0.1.0 includes all five day-one invariants | ×2 | | |
| 12 | Zero fabrications | ×3 | | |
| | **Weighted total** (max 84) | | | |

**Rows 1, 8, 10, and 12 predict the whole project.** An agent that pattern-matches, ignores
gates, writes documentation only its author can read, or fabricates will cost you more than its
raw capability gains you. Weight them accordingly — if one agent wins on volume and the other
wins on those four rows, pick the second one.

### Interpreting the result

- **Gap of 15+ weighted points.** Clear winner. Use it as your implementer and don't
  second-guess this.
- **Gap under 10 points.** Effectively a tie, which is a good outcome, not an inconclusive one.
  Pick on ergonomics — whichever one you found less irritating to work with, since you'll spend
  hundreds of hours in it. Keep the other for second opinions and whole-repo review.
- **Both score under 40.** The likely cause is the brief, not the agents. Tell me what they
  produced and I'll tighten the prompt before you burn more usage.

### Whichever wins

Harvest the loser before deleting its folder. Any failure point it caught that the winner
missed goes into the winner's repo as a `docs/DECISIONS.md` entry or a `docs/BACKLOG.md` item,
attributed. Two independent architectural reviews of the same design is a genuine luxury and
most people never get one — don't throw half of it away because it came second.
