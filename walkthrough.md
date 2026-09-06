# Claude Fort — walkthrough

Branch: `bakeoff/claude-fort` → PR into `main` (not merged).
Scope per `docs/AGENT-TASK.md` (Claude lane, "Two lanes after PR 7"): sim foundations only —
fortification buildings that change realm power/defense, and a citizen stub with `job` + `tile`.
No theme, Pixi, or presentation changes.

## What changed

### 1. Fortification combat hook (`packages/sim/src/systems/combat.ts`)

- Extracted the existing watchtower/walls/fortify power bonus (previously inlined in
  `realmPower`) into `fortificationPower(state, realmId)`, and added a new **`keep`**
  building (`packages/sim/src/content/buildings.ts`) to it: +8 flat combat power, same
  pattern as walls (+4) and watchtower (+2).
- Added `defenseBonus(state, realmId)`: an additional +8 per keep that only applies to
  whichever side is **defending** a war. `resolveBattle` now computes
  `def = realmPower(defender) + defenseBonus(defender)`, so a keep is worth more when
  you're holding a siege than when you're marching out to attack. This is the "hook" —
  a small, isolated seam future combat content (e.g. a moat, a garrison decree) can plug
  into the same way without touching `realmPower`'s general-purpose callers (raid power,
  rival comparisons, world-clash, war odds display all keep their existing behavior
  unchanged since none of them pass a role).
- `realmPower` itself is unchanged for existing buildings (walls/watchtower/fortify still
  count the same as before), so no existing test or balance value moved.

### 2. Citizen job stub (`packages/sim/src/systems/citizens.ts`, `content/citizens.ts`)

- Added `CitizenInstance` to `@second-crown/shared`: `{ id, realmId, job, tile }`, where
  `job` is one of `unassigned | farmer | woodcutter | miner | merchant | guard | scholar`
  (deliberately the same vocabulary as the presentation walker roles already in
  `packages/render/src/index.ts`, so a later pass can bind one to the other) and `tile`
  is `{ x, y } | null`.
- `GameState.citizens: CitizenInstance[]` is new, defaulted to `[]` in `createGameState`
  and migrated in `ensureWorldStubs` (`save/serialize.ts`) for old saves.
- Stub API only, no economy: `createCitizen`, `assignJob`, `assignTile`,
  `citizensByRealm`, `countCitizensByJob`. Nothing calls these yet — no citizens are
  spawned, no production/upkeep is attached, and nothing runs on tick. That's
  intentionally left for a later sim pass per the brief ("No full economy").
- `jobForBuildingType(typeId)` maps a building type to a suggested job (farm→farmer,
  quarry/mason/gold_mine→miner, watchtower/walls/keep/barracks→guard, chapel→scholar,
  etc.) — a lookup table only, not wired into `tryBuild`. This is what ties the two
  halves of the task together: the same fortification buildings that grant combat power
  also suggest "guard" as their citizen job, for whenever citizen assignment lands.

### Why not more

- Did not touch `TickEngine`/`SYSTEMS` — the engine's event/analytic fast-forward
  machinery (`nextEventTick`, `advanceAnalytic`) is nontrivial to satisfy correctly, and
  a stub with no economy doesn't need a tick hook yet.
- Did not wire `keep` into the app's build menu or Pixi/theme rendering — out of lane
  (Gemini/presentation), and the brief says "sim foundations only."
- Did not change `realmPower`'s signature (e.g. adding a `role` param) — it's called from
  five other places (`raid.ts`, `rival.ts`, `worldClash.ts`, `war.ts` odds, tests) that
  aren't attacker/defender-specific; adding a role param there would be a much larger,
  riskier diff than the brief asked for. `defenseBonus` is additive instead.

## Tests

Added to `packages/sim`:
- `systems/combat.test.ts`: keep adds flat power to both sides; keep's defense bonus
  only shows up when the keep's owner is the defender in `resolveBattle`, not the
  attacker.
- `systems/citizens.test.ts`: default empty roster, create/assign job+tile, unknown-id
  assignment fails safely, building→job mapping (including fortifications → guard).
- `save/serialize.test.ts`: citizens round-trip through serialize/deserialize, and
  `ensureWorldStubs` defaults a pre-citizens save to `citizens: []`.

## Verify

```
npm test                              # 20 files, 57 tests, all green
npm run build -w @second-crown/app    # tsc -b (workspace-wide) + vite build, clean
```

`git diff main -- packages/sim server` is non-empty (required); no changes outside
`packages/shared` (new shared type) and `packages/sim`.
