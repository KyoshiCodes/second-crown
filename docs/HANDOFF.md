# Handoff (2026-09-28)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active Bakeoff (bakeoff/gemini-season-tint)

- **Light Seasonal & Holiday Tint on Board Tiles (`packages/render/src/tokens.ts`, `packages/render/src/buildings.ts`, `packages/render/src/tiles.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Board tiles pick up a light seasonal tint wash from existing season/holiday state without hiding underlying terrain colors or terrain relief art.
  - **Seasonal & Holiday Color Mapping (`getThemeVisuals`, `resolveBoardThemeVisuals`, `resolveBoardSeasonTint`)**:
    - Spring: Light pastel spring green (`0x86efac`, alpha 0.10).
    - Summer: Warm sunbeam gold (`0xfef08a`, alpha 0.10).
    - Autumn: Rich autumn gold (`0xf59e0b`, alpha 0.14).
    - Winter: Crisp winter cool frost cyan (`0xbae6fd`, alpha 0.14).
    - Holiday packs (when selected or active):
      - Halloween: Spectral shadow purple (`0x581c87`, alpha 0.18).
      - Midwinter: Glacial ice cyan (`0x38bdf8`, alpha 0.16).
      - Easter: Dawn lilac violet (`0xc084fc`, alpha 0.12).
      - Harvest: Harvest gold (`0xf59e0b`, alpha 0.16).
      - Midsummer: Solar yellow (`0xfde047`, alpha 0.14).
  - **Non-Obscuring Visual Layering ("Do Not Hide Terrain")**:
    - On the tabletop board, the base terrain color (`pal.fill`) is drawn first, followed by the translucent tint glaze (`0.08` to `0.18` alpha).
    - All relief art (trees, knoll lines, wildflowers, grass tufts, mountain crags, fissures, waves, surf) is painted *after* the tint wash, ensuring full prominent visibility.
    - 3D cliff height faces (`paintTileHeightFace`) receive subtle matching glazes on the front-left (`alpha * 0.55`) and front-right (`alpha * 0.40`) facets.
  - **Kingdom Atlas Integration (`packages/app/src/OverworldAtlas.tsx`)**:
    - Seen provinces render matching seasonal tint overlays on top diamonds and cliff faces with `style={{ pointerEvents: "none" }}`.
  - **Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-eta)

- **Tiny Seconds Badge on Board March Meeples (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Each board march meeple that already has an arrival time (`m.arrivesTick` or `g.arrivesTick`) displays a tiny seconds badge floating above its head (e.g. `4s`, `18s`, `0s`).
  - **Deterministic Pixel Art Badge (`drawMarchEtaBadge`, `MARCH_ETA_GLYPHS_3X5`)**:
    - Compact rounded pill container with subtle drop shadow, dark translucent background (`0x090d16`), and crisp border matching the march faction or mission type:
      - Player war/raid march: Warm golden amber (`pal.accentColor`) with golden hourglass pip.
      - Scout column: Celestial recon cyan (`0x38bdf8`) with cyan hourglass pip.
      - Gather column / expedition: Emerald green (`0x22c55e`) with harvest hourglass pip.
      - Garrison column: Royal blue (`0x3b82f6`) with defensive hourglass pip.
      - Hostile incoming warband: Blood-red crimson (`0xef4444`, `0xdc2626`) with hazard skull pip.
    - 3x5 bitmap pixel font rendered via pure geometry rects, eliminating external DOM font dependencies and guaranteeing 100% determinism in headless tests and WebGL.
    - Floating height automatically tracks the marching meeple stride and head bob (`pawnY - 28 - bob`).
  - **Pointer-Events None Invariant**:
    - `boardPawnsLayer.eventMode = "none"` in Pixi stage setup.
    - Mini-map SVG `<g className="sc-atlas-march-eta-badge" style={{ pointerEvents: "none" }}>` with `.sc-atlas-march-eta-badge { pointer-events: none !important; }` in `theme.css`.
    - Clicks cleanly fall through to provinces, tiles, and pawns underneath.
  - **Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-fog)

- **Cloud Veil on Unseen Tiles & Clear Seen Tiles (`packages/render/src/tiles.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Unseen provinces render as an unmistakable volumetric cloud veil, while seen provinces stay 100% clear with their full terrain, 3D cliff height faces, resource piles, camps, and keeps.
  - **High-Distinction Cloud Mass (`paintFogHeightVeil`)**:
    - Floating aerial shadow on the tabletop plane (`0x000000`, `0x0f172a`), clearly separating the airborne cloud blanket from solid ground.
    - Translucent sky-mist base stratum with cool celestial azure undertone (`0x38bdf8`, `0xdbeafe`) and soft underside shading, distinctly different from rock ashlar or terrain cliffs.
    - Multi-tiered billowing cumulus lobes spanning the full tile with brilliant sunlit crests (`0xffffff`).
    - Dynamic windblown curving vapor wisps (`0xe0f2fe`, `0xffffff`) signaling living mist in motion.
    - Antique cartographer 8-point brass compass rose with center golden star glint (`0xd4a359`, `0xfef08a`), marking uncharted lands.
    - Continuous airy floating hover animation.
  - **Kingdom Atlas (`packages/app/src/OverworldAtlas.tsx`)**:
    - Uses `isProvinceSeen(state, p.id)`: unseen provinces render `<MiniCloudVeil>` with matching atmospheric styling, while seen provinces stay clear.
  - **Invariants**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-yard)

- **Finished Keep-Yard Annexes & Construction Scaffolding (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - The player's home tile keep renders finished adjacent hold buildings as miniature architectural annexes nestled around the keep, and unfinished buildings as authentic timber scaffolding.
  - **Adjacency Mapping (`listKeepYardBuildings`)**:
    - Discovers buildings sharing an edge with the player keep (`|dx| + |dy| === 1`) on the hold grid, consistent with `keepBonus` in sim economy.
    - Maps to 4 isometric yard positions: `west` (rear-left), `north` (rear-right), `south` (front-left), `east` (front-right).
    - Checks `completesAtTick` (`null` = finished, number = under construction).
  - **Finished Annexes**:
    - Solid masonry/timber walls with light/shaded facets, foundation plinth, and gabled roof or military crenellated wing.
    - Doorway with warm candle/hearth glow (`0xfef08a`).
    - Type-specific props (grain sacks, firewood piles, cut ashlar stone blocks, golden cross).
    - Full support for 5 culture palettes (Western, Cedar, Sand, Steppe, Islands).
  - **Unfinished Scaffolding**:
    - Timber upright corner posts, horizontal ledger beams, diagonal X-bracing, plank staging deck, builder's rope hoist with suspended stone block.
  - **Depth Layering**:
    - Rear annexes (`west`, `north`) draw behind the keep; front annexes (`south`, `east`) draw in front of the keep. Clustered around the keep perimeter rather than a flat vertical stack.
  - **Invariants**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-gate)

- **Hold Gatehouse Open vs Shut Doors (`packages/render/src/buildings.ts`, `packages/render/src/index.ts`)**:
  - The hold gatehouse dynamically reflects the fortification perimeter closure state using existing state:
    - **Closed Wall Ring (`isRingClosed === true` / `hasClosedWallRing(state)` is true)**:
      - Double doors meet flush and shut tight at the center portal seam.
      - Reinforced with horizontal blackened iron hinge straps and iron rivets.
      - Heavy iron drop bar / lock hasp spans the door center.
      - Iron lattice portcullis lowered above the doors.
      - Across all 5 culture kits: Western (oak + iron drop bar), Cedar (split-cedar + blackened iron straps & portcullis), Sand (brass-studded cedar + bronze lattice portcullis), Steppe (cross-braced timber gates + pylon bars), Islands (weathered driftwood double doors + bamboo portcullis).
    - **Open Wall Ring (`isRingClosed === false` / `hasClosedWallRing(state)` is false)**:
      - Double-door leaves are swung inward in perspective against the door jambs/reveals, showing door thickness and inner edges.
      - Gateway passage is open with visible cobblestone threshold pavers and stone road lines.
      - Warm golden amber lantern glow (`0xfbbf24` / `0xfacc15` / `0xea580c` / `0x06b6d4`) casts outward from the interior courtyard onto the threshold.
      - Portcullis is raised high into the vault ceiling lintel.
    - **Wall Ring Detection (`isWallRingClosed`)**:
      - Leverages canonical sim state evaluator `sim.hasClosedWallRing(state, realmId)` (checking `>= 8` edge walls and completed rim gate).
      - Supports explicit overrides for testing or state flags (`state.flags.isRingClosed` / `state.isRingClosed`).
      - Works seamlessly when `options.state` or `options.isRingClosed` is passed to `drawIsometricBuilding`.
  - **Invariants**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

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
