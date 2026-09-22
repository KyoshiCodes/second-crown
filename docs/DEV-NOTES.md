# DEV-NOTES

Updated: 2026-09-22
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

## Render architecture (packages/render)

Split from monolithic index.ts into:
- `camera.ts`: camera viewport, zoom bands, projection, coordinate conversion, province token bounds, table rim.
- `tiles.ts`: terrain elevation, height faces, fog height veil, isometric ground, rim fort navigation.
- `buildings.ts`: culture palettes, theme visuals, isometric building drawers across all 21 types and 5 culture kits.
- `tokens.ts`: miniature pixel keep drawers (with contact shadows, high-contrast facets, NPC heraldic escutcheons, and golden home coronets), board provinces painter, march columns (faction pedestal bases, iconic 8-unit silhouettes, glowing route trails), distinct gather columns (`isGatherMarch`, `drawGatherColumnMeeple` with rolling spoked wheels, burlap sacks, node cargo, animated draft mule, and pastoral route trails), dynamic resource node stock piles (`getNodeStockInfo`, `drawNodeStockPile`, `drawResourceNode` with timber log ricks, ashlar block pyramids, burlap grain sacks, and 4-tier depletion states), province inspect plaque.
- `walkers.ts`: citizen job mapping, dynamic tool resolution (`toolForCitizen` / `resolveWalkerTool`), authentic 2-3 frame pixel animation physics, and high-contrast job tools (`farm`, `wood`, `stone`, `gold`).
- `index.ts`: re-exports public API + MapRenderer factory with responsive canvas sizing.
