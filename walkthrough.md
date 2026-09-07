# Walkthrough — Gemini Connected Rim Wall Run & Stronger Terrain Chips (`bakeoff/gemini-map`)

## What changed

1. **Connected Rim Wall Run on the Hold**:
   - Fortifications placed on the outer 16×10 hold perimeter (`gx === 0 || gy === 0 || gx === 15 || gy === 9`) now connect continuously between neighbors.
   - Evaluates finished rim forts using `listRimForts` from `@second-crown/sim` if present, falling back dynamically to `state.buildings` with the matching clockwise rim order rule.
   - Adjacent rim walls and gatehouses form an unbroken ashlar stone curtain wall:
     - Foundation plinths and dual-tone ashlar granite faces (sunlit on South-West edges, shaded on South-East edges).
     - Horizontal mortar scoring lines.
     - Stone wall-walk with central timber planking line.
     - Crenellated stone merlons along the outer parapet with bright coping stone highlights.
     - Arrow loop slits in the curtain face and central bastion towers with animated torch sconces.
     - Corner bastion towers anchoring the four perimeter corners `(0,0)`, `(15,0)`, `(15,9)`, `(0,9)`.
   - Gatehouses sit flush in the gap: flanking bastion towers connect seamlessly to neighbor boundaries, while heavy reinforced oak double doors, iron strap hinges, lowered portcullis teeth, and defensive pennant defend the passage.
   - Interior walls (`!isRimTile`) strictly preserve the original isolated diamond block visual.
   - Tile clicks for placing, inspecting, and upgrading buildings are 100% preserved.

2. **Stronger 8×6 Terrain Chips on the Board Band**:
   - Redesigned all 6 province terrain chips in `paintBoardProvinces` so they read instantly from regional 0.58 zoom:
     - **Peak is a Real Ridge**: A continuous grand alpine mountain ridge spanning the chip width with illuminated western granite slopes, shadowed eastern basalt cliffs, a sharp central arête, pure white snowcaps across three summits, a glacial cirque, and scree teeth.
     - **Shore has Water & Foam**: Deep azure ocean waters meeting turquoise shallows, a golden sand beach with a wet sand tideline, rolling wave crests, and a crashing white surf line with frothing sea foam lace.
     - **Wood is a Stand of Trees**: A dense forest grove of 6-7 layered evergreen pines with timber trunks, dark spruce background trees, emerald mid-tier pines, and towering foreground monarch pines with highlighted bough needles.
     - **Waste Glows**: Scorched basalt caldera with dark crust plates, radiating volcanic fissure trenches with multi-layered outer crimson magma glow, incandescent orange lava mid-vein, pulsing yellow-white heat core, caldera vent, and floating ember specks.
     - **Hill has Contours**: Rolling highland topographic knolls with shaded elevation terraces, rounded hill domes, three bold highlighted contour ridges, and exposed granite bluffs.
     - **Plain Stays Meadow**: A lush pastoral meadow with rolling grass knoll bands, clustered 3-blade tall grass tufts, and sprinkled chamomile daisy, yellow buttercup, and blue cornflower blossoms.

3. **Invariants & Preservations**:
   - Kept fog chips, hostile red meeple, cottage art, zoom/pan, ChromeDock, and dim lanterns completely intact.
   - `git diff main -- packages/sim server` is 100% empty.

## Where

- `packages/render/src/index.ts`:
  - Added `rimWalkIndex`, `getRimTileAt`, `listRimFortsPresentation`, and `RimNeighbors`.
  - Added `drawRimWallCurtain` and `drawGatehouseCurtainWings`.
  - Updated `drawIsometricBuilding` to render the connected rim curtain on rim tiles and preserve the old block for interior walls.
  - Updated `paintBuildings` to build `rimFortMap` and pass neighbor context.
  - Redesigned all 6 terrain chips in `paintBoardProvinces`.
- `packages/render/src/index.test.ts`:
  - Added unit tests for 48-tile bijective rim walk indexing and clockwise sorting/filtering of finished rim forts.
- Documentation cadence:
  - `docs/HANDOFF.md`, `docs/CHANGELOG.md`, `docs/USER-NOTES.md`, `docs/DEV-NOTES.md`.

## Verification

- `npm test` — 87/87 sim tests pass.
- `npm run test -w @second-crown/render` — 14/14 render tests pass (12 existing + 2 new).
- `npm run build -w @second-crown/app` — `tsc -b && vite build` passes cleanly.
- `git diff main -- packages/sim server` — verified 100% empty.
