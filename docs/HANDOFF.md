# HANDOFF — current ground (2026-09-22)

Play: https://129.153.17.72.sslip.io/
Plan: docs/ASCENT.md | Recap: docs/PROGRESS.md

Phase 1 of Ascent is on main: stats, harness, rounds/morale, wounded-by-default.
`resolveBattle` is still the only fight function.

## Recent Wave (bakeoff/gemini-units)

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
