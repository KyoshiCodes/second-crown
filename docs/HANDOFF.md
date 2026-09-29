# Handoff (2026-09-28)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active Bakeoff (bakeoff/gemini-wall-scar)

- **Damaged Rim Wall Art Presentation on Low wallHp (`packages/render/src/buildings.ts`, `packages/render/src/index.ts`)**:
  - When `wallHp` is present on `state` (or `state.flags`) and is low (`ratio < 0.60` or `cur <= 0`), the rim fort wall art now dynamically renders battle scars, impact fissures, and missing merlons:
    - **Straight Rim Wall Curtain Spans (`drawCurtainSpan`)**:
      - Structural jagged fissures and impact cracks descending down the vertical ashlar stone face with shadow crevice strokes, secondary branch fractures, and sunlight highlight catch edges.
      - Dislodged masonry rubble chips fallen at the plinth base.
      - Crenellated merlons dynamically break down based on deterministic PRNG per merlon: ~45% missing merlon gaps (revealing jagged crumbled mortar rubble stumps and open gaps in the battlements), ~25% shattered/chipped merlons at partial height, with remainder intact.
      - Terminal caps show cleaved stone notches.
    - **Corner Bastion Towers (`drawRimWallCurtain`)**:
      - Front-center merlon knocked out / sheared away, leaving a crumbled mortar stump.
      - Left merlon chipped down to partial height.
      - Vertical stress crack stroke descending across the tower facet with fallen stone chip at plinth base.
    - **Pilaster Wall Buttresses**: Stress fracture splitting across the central visible pilaster face.
    - **Gatehouse Curtain Wings (`drawGatehouseCurtainWings`)**: Adjacent connecting curtain wings display matching cracked stone and battlement gaps.
    - **Full HP Walls Stay As They Are**: When `wallHp` is at or near full HP (`ratio >= 0.60`) or when `wallHp` is not set on state (`undefined`), rim walls remain 100% intact with pristine merlons, clean stone faces, and zero cracks.
  - **Invariants**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-camps)

- **Player Camps and Outposts Clearer Tent + Flag (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Player camps and outposts on the board now display a high-fidelity pitched canvas tent and fluttering heraldic flag standard:
    - **Pitched Canvas Pavilion Tent**: Dual-tone 3D tent faces (shaded flank, sunlit roof pitch), timber ridgepole along apex, culture tabard valance trim along eaves, arched doorway flap, and cozy interior golden lantern / hearth amber glow. Steppe culture renders nomadic round yurt with felt dome and crown ring.
    - **Anchoring Guy Ropes & Stakes**: Angled tension guy ropes anchored into the ground with hardwood pegs, resting over soft ground contact shadows.
    - **Hardwood Flagpole & Flying Banner**: Grounded timber pole with iron base bracket, polished golden finial sphere (with culture-specific adornments: cedar huntsman plume, steppe horsehair tuft, islands sea pearl), and animated waving swallowtail heraldic flag with chevron charge.
    - **Camp Node Upgrade**: Neutral / unaligned wild camps on the board (`node === "camp"`) now draw a distinct weathered canvas tent with crimson camp pennant instead of the primitive red polygon.
    - **Overworld Atlas `<MiniCamp>`**: SVG mini tent + flag component on diamond for `p.node === "camp"` and player outposts (`style={{ pointerEvents: "none" }}`).
  - **Invariants**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-node-piles)

- **Node Stock Piles on Diamond (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Provinces that already have node stock draw a small pile on the diamond: stacked timber logs on `woodcut`, burlap grain sacks on `field`, and ashlar stone blocks on `quarry`.
  - Empty nodes (`stock <= 0`) stay as they are without any pile drawn.
  - Implemented across both the Pixi tabletop diorama and the SVG Overworld Atlas.
  - Hit-test math and camera math remain 100% untouched.
  - Sim and server strictly empty diff. Zero conflict markers.

## Active Bakeoff (bakeoff/gemini-ledger)

- **Ledger Cards & 16–20px Quill/Ink Pip (`packages/app/src/hud/QuillPip.tsx`, `packages/app/src/hud/LedgerCard.tsx`, `packages/app/src/hud/ledger-card.css`, `packages/app/src/LedgerPanel.tsx`)**:
  - Each ledger card in `packages/app/src/hud` displays an authentic 16–20px quill & inkpot pip with goose feather plume, carved rachis, sharp writing nib, faceted inkpot, and wet ink droplet.
  - Scribe ink color dynamically reflects entry kind (war/defeat: rubrication crimson, victory/truce: royal gold, marshal: imperial indigo, default: azure iron-gall).
  - Pip CSS strictly in `ledger-card.css`; `theme.css` not edited. Strictly `pointer-events: none`.
  - Sim and server untouched. No conflict markers.

## Active Bakeoff (bakeoff/gemini-select-rim)

- **Selected Board Province Clear Gold Rim & Ground Ring (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/app/src/OverworldAtlas.tsx`, `packages/app/src/game/useGameEngine.ts`)**:
  - **Clear Gold Rim & Ground Ring (`paintBoardSelectionRim`)**:
    - **Tabletop Ground Ring (`wy`)**: Encircles the province footprint at ground level with a brilliant gold ring (`0xfacc15`, `0xb45309`, `0xfef08a`), inner shimmer line, and 4 cardinal corner bracket pips, clearly anchoring the tile to the tabletop.
    - **Vertical Cliff Struts**: For elevated tiles (`elev > 0`), corner struts descend along the vertical cliff edges connecting the ground ring to the top plateau with a front cliff ground rim.
    - **Top Gold Rim (`cy = wy - elev`)**: Surrounds the elevated plateau with a double gold rim (`0xfacc15`, `0xd97706`), sunlight facet glint, and 4 cardinal diamond corner glints.
  - **Synchronized Board & Atlas Selection**:
    - Board Pixi renderer introduces dedicated `boardSelectionLayer` and integrates `paintBoardSelectionRim` into `paintBoardHighlight` and `paintBoardProvinces`.
    - `MapRenderer` exposes `setSelectedProvince(provinceId: string | null)` and `getSelectedProvince()`, kept in sync with engine state in `useGameEngine.ts`.
    - `OverworldAtlas.tsx` renders matching `.sc-atlas-select-rim` with base ground ring and top gold rim (`pointerEvents="none"`).
  - **Strict Invariants Preserved**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% unchanged.
    - `git diff main -- packages/sim server` strictly empty. Zero conflict markers.

## Active wave (wave/hud-inspect)

- **Province inspect card (`packages/app/src/ProvinceInspect.tsx`, `packages/app/src/hud/inspect-card.css`)**: the clicked-province panel is now one `.sc-inspect-card`.
  - Head: name (your hold's name at home, the node label once scouted, "Unscouted province" in fog) plus Close.
  - Facts grid: Terrain, Owner, Tile (x,y), Gold.
  - Status lines (stock, camp threat, flag tithe, incoming, column, gather), then the existing action buttons in `.sc-inspect-actions`, the Column picker, and Send raid column.
  - All inline styles removed; styles live only in `inspect-card.css`. Click, march, scout, gather and garrison handlers are unchanged.

## Verify

```
npm test
npm run test -w @second-crown/render
npm run build -w @second-crown/app
```

## Invariants that still bite

- HUD chrome palette: `<html data-chrome>` via `ThemeDock.tsx`, key `sc-chrome`. Buttons default dark from `theme.css`.
- World atlas pans by drag. 6px slop keeps clicks working. Recenter resets.

- Sim is 10 Hz, deterministic, offline catch-up. No sim on `server/`.
- Column clashes use the column, not the home army.
- Presentation branches must leave `git diff main -- packages/sim server` empty.
- One study at a time. Academy only shortens *new* studies.
- Treat wounded is 4 food + 50 ticks → 1 militia.
- Wall HP already includes gate HP; do not add them twice in copy.
- Vision ≠ rim tower count. See DEV-NOTES.

## Docs map

| File | Who |
|---|---|
| USER-NOTES.md | playtesters |
| CHANGELOG.md | every merge crumb |
| DEV-NOTES.md | footguns |
| ROADMAP.md | next |
| PROGRESS.md | eras |
| INVARIANTS.md | law |
| CONCEPT-BIBLE.md | fantasy |
| obsidian/ | vault seed |
