# DEV-NOTES

Updated: 2026-09-21
Per-PR bakeoff history: docs/CHANGELOG.md
Plan: docs/ASCENT.md | Player recap: docs/PROGRESS.md | Agent start: docs/HANDOFF.md

## Combat

`resolveBattle` is still power × count × (0.85 + rng * 0.3).
R1 added `attack`, `defense`, `hp`, `speed`, `role`, `tier` on `UnitType` and `matchupModifier` in `content/matchup.ts`. Do not wire matchup into combat until R3.
Keep `power` — `realmPower` and existing tests still use it.

## Layout multipliers

- staffBonus: job on tile +20% each, cap +40%
- adjacencyBonus: same type on edge +10% each, cap +20%
- pairBonus: farm/granary, lumber_camp/sawmill, quarry/mason, gold_mine/mint +15%
- keepBonus: finished keep on edge +10%
- barracks on keep edge: trainCostMultiplier × 0.9, floor 0.45

## Agent lanes

Sim: packages/sim + shared only.
Art: packages/render + app, empty diff on sim/server.
No Caddy or Discord route edits unless asked.
