# HANDOFF — current ground (2026-09-22)

Play: https://129.153.17.72.sslip.io/
Plan: docs/ASCENT.md | Recap: docs/PROGRESS.md

Phase 1 of Ascent is on main: stats, harness, rounds/morale, wounded-by-default.
`resolveBattle` is still the only fight function.

## Recent Wave (bakeoff/gemini-garrisons)

- **Posted Garrison Tent & Banner Meeple on Flag Tiles**:
  - Implemented distinct `drawGarrisonMeeple` in `tokens.ts` (pitched pavilion ridgepole canvas tent with guy ropes, timber ground stakes, glowing warm interior lantern light, leaning steel spearhead and heraldic guard shield, tall hardwood flagpole with finial, waving swallowtail standard with golden chevron charge, and floating fortified shield crest).
  - Outposts on the board with active garrisons display the complete military encampment meeple; undefended/unguarded outposts display a solitary boundary marker stake and pennant, clearly contrasting fortified flags with vacant claims.
  - Garrison dispatch and recall marches classified via `isGarrisonMarch` with royal blue & gold supply trails.
  - Zero diff on `packages/sim` or `server/`. Hit-tests and camera math strictly untouched.

## Prior Wave (bakeoff/gemini-scouts)

- **Cloak & Spy Meeple for Reconnaissance Scouts**:
  - Implemented distinct `drawScoutColumnMeeple` in `tokens.ts` (nimble running boots, deep shadowed hooded cowl with glowing cyan eye slit, billowing ranger stealth cloak, brass spyglass scanning frontier, cartography map scroll, and floating recon status badge).
  - Scout columns classified via `isScoutMarch` receive stealth midnight cyan glowing trails with starlight core and 4-point compass rose reticles on destination provinces.
  - Zero diff on `packages/sim` or `server/`. Hit-tests and camera math strictly untouched.

## Prior Wave (bakeoff/gemini-nodes)

- **Dynamic Resource Node Stock Piles on Isometric Board**:
  - Resource nodes (`woodcut`, `quarry`, `field`, `ruins`) now display material-specific stock piles (stacked timber logs on skid beams, dressed ashlar granite masonry blocks on gravel, plump burlap grain sacks on threshing mats) that visibly deplete across 4 volume tiers as nodes are harvested down to dry/empty.
  - Work station landmarks on the left (stump with broadaxe, granite quarry cliff with pickaxe, wheat sheaf with reaping sickle, broken classical column) paired with dynamic stock piles on the right.
  - Zero diff on `packages/sim` or `server/`. Hit-tests and camera math strictly untouched.

## Prior Wave (bakeoff/gemini-gathers)

- **Gather Columns vs War Marches on Isometric Board**:
  - Implemented distinct `drawGatherColumnMeeple` in `tokens.ts` (rolling spoked wheels with iron tires, timber cart chassis, stacked burlap sacks with tied twine knots, resource overlays for field/woodcut/quarry/ruins, and harnessed trotting draft mule with animated 2-3 frame walking gait).
  - Gather marches classified via `isGatherMarch` receive soft emerald/harvest pastoral supply route trails and golden node harvest indicators, distinct from military war marches (tactical battle pedestals, iconic weapon silhouettes, war route trails, red targeting reticles).
  - Zero diff on `packages/sim` or `server/`. Hit-tests and camera math strictly untouched.

## Prior Wave (bakeoff/gemini-walkers)

- **Hold Citizens & 2-3 Frame Job Tools**:
  - Citizens walking the isometric hold view read as 2–3 frame pixel walkers with job tools for the 4 primary hold works: `farm` (pitchfork + straw hat + golden sheaf), `wood` (felling broadaxe + feather cap + pine log), `stone` (double-pointed quarry pickaxe + quarry cowl + granite block), and `gold` (gilded prospector pick + assayer lamp + gold pan with animated star twinkle).
  - Dynamic tool resolution links citizen jobs and work tile building types to matching tools; default 8-citizen wander pool rotates across all four tools.
  - Zero diff on `packages/sim` or `server/`. Hit-tests and camera math strictly untouched.

## Prior Wave (bakeoff/gemini-units)

- **Unit & Keep Readability on Diamond Board**:
  - Miniature keeps now have ambient ground contact shadows and stepped foundation plinths to detach cleanly from textured 3D terrain relief.
  - High-contrast facet illumination on keeps (bright sunlit left face with quoins/shakes vs deep shaded right face with dividing corner seams).
  - NPC holds display mounted heraldic escutcheon shields with faction colors (`k_silk`, `k_ash`, `k_veil`, `k_glass`, `k_frost`, `k_tide`, etc.).
  - Player home keep features a regal golden coronet crest with pearl jewels.
  - March pawns feature distinct faction pedestal bases (turned walnut + golden/sapphire faction ring for player; spiked blackened iron + crimson danger ring for hostile).
  - Iconic weapon and armor silhouettes for all 8 unit types (archer recurve bow + bodkin arrow + quiver; spearman towering pike + heraldic shield; skirmisher poised javelin; cavalry warhorse + couched lance; knight plate armor + Greathelm + heater shield; siege engine timber chassis + wheels + throwing beam; champion royal cape + crown + glowing runic claymore; militia spiked war club).
  - Floating ETA pill badges with glass drop-shadows and glowing timer pips.
  - Zero diff on `packages/sim` or `server/`.

## Prior Wave (bakeoff/gemini-overworld)

- **Lords Mobile Overworld Map**: Zoomed-out board tiles feature 3D stepped elevations and height faces per terrain (peaks tower highest with granite rock strata and snow streaks, hills with stepped contour terraces, wastes with basalt columns and magma veins, woods with loam and tree roots, plains with sod cuts, shores with wave wash).
- **Tiny Pixel Keeps on Board Holds**: Provinces with holds now reuse authentic culture kit keep silhouettes at miniature scale (Western stone keep, Cedar longhouse, Sand courtyard keep with minaret, Steppe circular hall, Islands stilt pile-house, and Iron March spiked battlement keep).
- **Fog Height Veil**: Unscouted provinces rise as billowing volumetric cloud plateaus rather than flat parchment.
- **Chrome-Filling Canvas**: Canvas expands to fill the full container width (`maxWidth: 900px`) without being capped at 560px.
- **Packages/Render Split**: Decomposed `packages/render/src/index.ts` into modular `camera.ts`, `tiles.ts`, `buildings.ts`, `tokens.ts`, `walkers.ts`, and `index.ts`.

## Next recommended wave

Marshal schema (`systems/marshal.ts`) on `CharacterInstance`. Do not add a second combat path.
Skills can no-op until they fire inside `resolveRounds`.

## War tab + camera (claude-war lane)

WarRoom is now sectioned: Odds, Levy and fight, Last battle, Home front, Decrees.
Camera/zoom/pan moved from render/src/index.ts to render/src/camera.ts (createCamera).
