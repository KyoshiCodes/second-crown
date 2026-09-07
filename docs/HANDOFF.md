# HANDOFF

Bakeoff Gemini Map delivered on branch `bakeoff/gemini-map` (PR into main unmerged).

- **Connected Rim Wall Run on the Hold (`packages/render`)**:
  - Automatically queries finished rim fort structures (`listRimForts` if exported from `@second-crown/sim`, otherwise reading `state.buildings` using the matching 16×10 rim rule: `gx === 0 || gy === 0 || gx === 15 || gy === 9` ordered clockwise).
  - Connects neighboring rim forts (walls and gate) with a continuous stone curtain wall:
    - Foundation plinth, ashlar stone curtain faces (illuminated sunlit faces on South-West edges, shaded faces on South-East edges).
    - Horizontal mortar scoring lines, stone wall-walk walkway with timber planking center line.
    - Crenellated stone merlons along the outer parapet with coping highlights.
    - Arrow loop slits in the curtain face and center bastion towers with animated flickering wall torch sconces.
    - Corner bastion towers anchoring the four perimeter corners `(0,0)`, `(15,0)`, `(15,9)`, `(0,9)`.
  - Gatehouses sit flush in the gap: flanking bastion towers connect seamlessly to adjacent curtain spans while retaining heavy reinforced double oak doors, iron strap hinges, portcullis teeth, and defensive pennant.
  - Interior walls (`!isRimTile`) strictly preserve the original isometric block visual.
  - Tile clicks and building placement/upgrade contracts remain 100% intact.
- **Stronger 8×6 Terrain Chips on the Board Band (`packages/render`)**:
  - All 6 tabletop province terrain chips redesigned to read instantly at 0.58 zoom:
    - **Peak**: Continuous grand mountain ridge with illuminated western granite slopes, dark basalt eastern shadows, dividing arête, pure white snowcaps across 3 peaks, glacial cirque, and scree teeth.
    - **Shore**: Deep ocean waters, turquoise shallows, golden sand beach with wet sand tideline, curling wave rollers, crashing white surf crest, and bubbling sea foam lace.
    - **Wood**: Dense stand of 6-7 layered evergreen pines with forest mulch floor, timber trunks, dark spruce background trees, emerald mid-tier pines, and towering foreground monarch pines with highlighted boughs.
    - **Waste**: Scorched basalt caldera with dark crust plates, radiating volcanic fissure trenches with multi-layered outer crimson magma glow, incandescent orange lava mid-vein, pulsing yellow-white heat core, caldera vent, and floating ember specks.
    - **Hill**: Topographic highland contour ridges with shaded elevation terraces, rounded hill domes, 3 bold highlighted elevation contour bands, and exposed granite bluffs.
    - **Plain**: Lush pastoral meadow with rolling grass knoll bands, clustered 3-blade tall grass tufts, and sprinkled chamomile daisy, yellow buttercup, and blue cornflower blossoms.
- **Invariants & Preservations**:
  - Pure presentation lane: `git diff main -- packages/sim server` is 100% empty.
  - Fog chips, hostile red meeple, cottage art, zoom/pan, ChromeDock, and dim lanterns completely preserved.
  - Automated tests passing: 87/87 in `@second-crown/sim`, 14/14 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).

---

W16 Claude War tab briefing delivered on branch `bakeoff/claude-war2` (PR into main unmerged).
- War tab now opens with a single "Briefing" card readable in ~20 seconds:
  - **Incoming**: one line per hostile march bound for your hold — name (only once a Watchtower is built, otherwise "Unknown host") and ETA in seconds — followed by current Wall HP and whether the gate is up or down.
  - **Wounded**: wounded count vs. infirmary beds, with a "Treat (4 food)" button (`tryTreatWounded`) disabled when nobody is wounded.
  - **People**: population vs. housing cap (`housingCap`).
- New pure-function exports from `@second-crown/sim`: `gateOnRim`, `gateHp` (already used internally by `wallHp`/siege math, now exposed for the UI). No combat math, march formulas, or fog rules changed.
- `git diff main -- packages/sim/src/core` is empty. All existing sim tests (87) and the app build (`tsc -b && vite build`) pass unchanged.

Bakeoff Gemini lane delivered on branch `bakeoff/gemini-board2` (PR into main unmerged).
- Distinct Isometric Cottage & Gatehouse (`packages/render`): cottage with reed thatch and curled hearth smoke, gatehouse with rim detection, double doors, iron straps, portcullis, and faction pennant.
- Board Fog Chips: Unseen provinces rendered as blank parchment chips with dark vellum bevels and drifting fog curves.
- Hostile Red/Iron March Meeple: Imposing red/iron war meeple pawn with horned helm and glowing visor slit for non-player marches.
