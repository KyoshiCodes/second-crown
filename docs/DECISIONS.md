# DECISIONS — architecture decision records

Last updated: 2026-09-05 | Version: pre-0.1.0 | Updated by: project bootstrap

One entry per meaningful decision. Never delete an entry; supersede it with a new one that
links back. Format: context, options, decision, consequences, mitigation.

Records 001–006 were decided by the owner during design and are **locked**. An agent may
argue against one by writing a new ADR, but may not act against one.

---

## ADR-001 — City building uses free placement

**Date:** 2026-09-05 · **Status:** Locked · **Decided by:** owner

**Context.** The kingdom layer needs a build interface. Two shapes were available: fixed
district slots (a menu of buildings that fill predetermined spaces) or free placement (the
player lays out the city).

**Options.**
- *Fixed slots.* Trivially easy, no collision logic, no camera, no layout state in saves.
  Loses the feeling of it being your kingdom.
- *Free placement.* The city becomes a personal artifact players screenshot and share.
  Introduces collision, camera, layout serialization, and the standing temptation to simulate
  citizens.

**Decision.** Free placement.

**Consequences.** Adds a tile grid, an occupancy array, a pan/zoom camera, and city layout in
the save schema with its own migration concerns. Roughly doubles the 0.3.0 milestone.

**Mitigation.** Placement snaps to a tile grid — free-form in feel, discrete in data.
Collision is a 2D occupancy array, never geometry intersection. **No citizen agents and no
city pathfinding, ever** (invariant 13). Adjacency bonuses read the occupancy array directly.
This is the specific scope trap that kills solo city-builders, and it is closed by rule.

---

## ADR-002 — Themes are hybrid: cosmetic plus one perk

**Date:** 2026-09-05 · **Status:** Locked · **Decided by:** owner

**Context.** The owner wants theme-swappable nations (feudal, frontier, ascendant) where power
comes from progression rather than theme choice. Question: are themes purely cosmetic, or do
they carry mechanics?

**Options.**
- *Purely cosmetic.* Zero balance risk. Themes feel like hats.
- *Full mechanical factions.* Deep replay value. Enormous balance debt, and every new theme
  multiplies the testing surface.
- *Hybrid.* Cosmetic, plus one signature perk each.

**Decision.** Hybrid — one signature perk per theme.

**Consequences.** Every theme now needs balance attention, not just art.

**Mitigation.** All signature perks are drawn from a **shared pool where each perk is costed to
the same power budget** (invariant 11). Adding a theme means picking a perk from the pool, not
inventing a new axis of power. Balance work per theme approaches zero. A theme may never gate
content.

---

## ADR-003 — Watch mode ships before Report mode is enough

**Date:** 2026-09-05 · **Status:** Locked · **Decided by:** owner

**Context.** Battles need a presentation layer. The design calls for three modes: Report (text
summary), Watch (observe the simulation), Command (intervene).

**Options.**
- *Report first, Watch later.* Fastest path to a playable war layer.
- *Watch first.* Far more satisfying, and it is what makes the war layer feel real.

**Decision.** Watch mode in the 0.5.0 milestone.

**Consequences.** 0.5.0 grows substantially — sprites, formations, a battle camera, timeline
scrubbing, and animation timing tied to a tick-based resolver.

**Mitigation.** **The resolver is built headless and fully unit-tested before any sprite
animates.** Watch mode is strictly a view over a deterministic tick log. If the visualization
were deleted, the resolver would still be correct and complete. This ordering is mandatory,
not preferred.

---

## ADR-004 — Full intrigue is in scope for 1.0

**Date:** 2026-09-05 · **Status:** Locked · **Decided by:** owner

**Context.** The living-world layer can be modeled as realms with numeric relations, or as
realms populated by characters with ambitions who scheme against each other and the player.

**Options.**
- *Numeric relations only.* Simple, testable, and forgettable.
- *Full intrigue.* Rulers, heirs, advisors, generals, betrayal, succession crises. The
  strongest source of stories, and the largest system in the game.

**Decision.** Full intrigue, landing at 0.9.0.

**Consequences.** The largest and least predictable system in the project, arriving late.

**Mitigation.** **Realms are character-based from 0.1.0** (invariant 10) — named characters
with traits and opinions exist in the data model from the first commit, even though nothing
displays them until 0.6.0. Retrofitting characters onto realms modeled as loose numbers is a
rewrite; carrying an unused character model is nearly free. If 0.9.0 proves too large, intrigue
degrades gracefully to fewer event types rather than requiring restructuring.

---

## ADR-005 — 1.0 ships two themes, not three

**Date:** 2026-09-05 · **Status:** Locked · **Decided by:** owner

**Context.** Four ambitious decisions were taken in a row. Something had to absorb the cost, or
the project becomes unfinishable.

**Decision.** Content breadth absorbs it. 1.0 ships **two themes** (Feudal, Frontier), three
doctrines, and one player-laid-out city. Ascendant moves to 1.1.0.

**Consequences.** Less variety at launch than originally imagined.

**Rationale.** Systems depth is hard to add later; content breadth is easy. Once themes are
data plus a costed perk, the third theme is a weekend, and it can arrive in the first post-launch
update while the game already exists. Shipping two working themes beats sketching three.

---

## ADR-006 — Web stack over a game engine

**Date:** 2026-09-05 · **Status:** Locked · **Decided by:** owner, on architect recommendation

**Context.** Godot was considered, and the owner has prior Godot exposure from an unrelated
project.

**Decision.** TypeScript monorepo — Vite, React for UI, PixiJS for map and battle rendering,
break_infinity.js, Vitest, GitHub Pages.

**Rationale.**
- This is a UI-heavy game — nested panels, tooltips, huge numbers, dense tables. React is
  built for that; game-engine UI is not
- Web export is the distribution channel, and Godot's is heavier and clumsier
- The AI training corpus for TypeScript/React/Vite dwarfs the Godot corpus, and this project is
  being written primarily by AI agents. This matters more than any technical merit
- The owner already has Node, TypeScript, React, and Vite installed
- Deployment is a free static host with no server

**Explicitly not needed:** Docker, Prisma, Ollama, Oracle Cloud, Lightning AI, any backend, any
database, any account system. The owner has these available; the project does not want them.

**Consequences.** No built-in editor or scene tooling. Rendering performance requires more
deliberate care than an engine would.

---

## ADR-007 — Licensing deliberately deferred

**Date:** 2026-09-05 · **Status:** Open · **Decided by:** owner

**Context.** An agent scaffolding a project will conventionally add an MIT `LICENSE` and assume
a public repository.

**Decision.** No license file. Repository private. Revisit before any public release.

**Rationale.** MIT on a game that might later be sold or ported gives away the right to do so.
The default is irreversible in practice and chosen by habit rather than intent.

**Consequences.** Agents must not add a license or make the repo public without asking. Noted
in `AGENTS.md` and in the master prompt.
