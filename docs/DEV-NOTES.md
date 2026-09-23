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

Kingdom "Scarred works" rows read `listScarred` and call `tryRepair` (cost is `REPAIR_STONE` = 8 in `sim/systems/ward.ts`; the "8 stone" label in the app is hardcoded, so update both if cost changes).

`VisionLine` (app) is display only. "Watchtowers" is `rimWatchtowers` (finished rim towers only), not `countBuilding(state, "watchtower")`; `visionRange` adds both plus surveying, so the numbers will not sum by eye.

`WallLine` (app) is display only. Note `wallHp` already includes `gateHp`, so gate HP is shown as a part of wall HP, not added to it.

Sim: packages/sim + shared only.
Art: packages/render + app, empty diff on sim/server.
No Caddy or Discord route edits unless asked.

## Render architecture (packages/render)

Split from monolithic index.ts into:
- `camera.ts`: camera viewport, zoom bands, projection, coordinate conversion, province token bounds, table rim.
- `tiles.ts`: terrain elevation, height faces, fog height veil, isometric ground, rim fort navigation.
- `buildings.ts`: culture palettes, theme visuals, isometric building drawers across all 21 types and 5 culture kits, building height resolver (`buildingHeight`), scarred / knocked-out building presentation (`completesAtTick !== null`, rendering cracked stone fissures, radial siege impact craters, fallen 3D rubble blocks, and scattered debris via `drawCrackedStoneOverlay`), comprehensive smoke & active flame suppression during repair, connected rim wall curtains (`drawCurtainSpan`, `drawRimWallCurtain` with continuous straight runs, 4 corner keep bastions at `(0,0)`, `(15,0)`, `(15,9)`, `(0,9)`, and buttress pilasters), seamless gatehouse curtain wings (`drawGatehouseCurtainWings` bridging twin bastion flanks to adjacent wall boundaries), and perimeter ground foundation shadows.
- `tokens.ts`: miniature pixel keep drawers (with contact shadows, high-contrast facets, NPC heraldic escutcheons, and golden home coronets), board provinces painter, march columns (faction pedestal bases, iconic 8-unit silhouettes, glowing route trails), distinct gather columns (`isGatherMarch`, `drawGatherColumnMeeple` with rolling spoked wheels, burlap sacks, node cargo, animated draft mule, and pastoral route trails), reconnaissance scout columns (`isScoutMarch`, `drawScoutColumnMeeple` with hooded cowl, glowing cyan eye slit, billowing ranger cloak, brass spyglass, and stealth cyan recon trails), dynamic resource node stock piles (`getNodeStockInfo`, `drawNodeStockPile`, `drawResourceNode` with timber log ricks, ashlar block pyramids, burlap grain sacks, and 4-tier depletion states), posted garrison encampments on flag tiles & marches (`getPostedGarrison`, `isGarrisonMarch`, `drawGarrisonMeeple`), hostile incoming red warband meeples (`isIncomingMarch`, `drawRedWarbandMeeple` with spiked iron pedestal, blood-red tabard, horned helm, crimson eye visor, barbed poleaxe, and ragged pennant), province inspect plaque.
- `walkers.ts`: citizen job mapping, dynamic tool resolution (`toolForCitizen` / `resolveWalkerTool`), authentic 2-3 frame pixel animation physics, and high-contrast job tools (`farm`, `wood`, `stone`, `gold`).
- `index.ts`: re-exports public API + MapRenderer factory with responsive canvas sizing.
