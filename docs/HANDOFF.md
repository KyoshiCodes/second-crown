# HANDOFF — current ground (2026-09-21)

Play: https://129.153.17.72.sslip.io/
Plan: docs/ASCENT.md | Recap: docs/PROGRESS.md

Phase 1 of Ascent is on main: stats, harness, rounds/morale, wounded-by-default.
`resolveBattle` is still the only fight function.

## Recent Wave (bakeoff/gemini-overworld)

- **Lords Mobile Overworld Map**: Zoomed-out board tiles feature 3D stepped elevations and height faces per terrain (peaks tower highest with granite rock strata and snow streaks, hills with stepped contour terraces, wastes with basalt columns and magma veins, woods with loam and tree roots, plains with sod cuts, shores with wave wash).
- **Tiny Pixel Keeps on Board Holds**: Provinces with holds now reuse authentic culture kit keep silhouettes at miniature scale (Western stone keep, Cedar longhouse, Sand courtyard keep with minaret, Steppe circular hall, Islands stilt pile-house, and Iron March spiked battlement keep).
- **Fog Height Veil**: Unscouted provinces rise as billowing volumetric cloud plateaus rather than flat parchment.
- **Chrome-Filling Canvas**: Canvas expands to fill the full container width (`maxWidth: 900px`) without being capped at 560px.
- **Packages/Render Split**: Decomposed `packages/render/src/index.ts` into modular `camera.ts`, `tiles.ts`, `buildings.ts`, `tokens.ts`, `walkers.ts`, and `index.ts`.

## Next recommended wave

Marshal schema (`systems/marshal.ts`) on `CharacterInstance`. Do not add a second combat path.
Skills can no-op until they fire inside `resolveRounds`.
