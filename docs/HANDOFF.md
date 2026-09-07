# HANDOFF

Bakeoff Claude lane delivered on branch `bakeoff/claude-walls` (PR into main unmerged).

- **`listRimForts(state, realmId = "player")` (`packages/sim/src/systems/rimForts.ts`)**: returns `{ x, y, kind: "wall" | "gate" }[]` for finished (`completesAtTick === null`) `walls`/`gate` buildings on the 16×10 hold rim (`x===0 || y===0 || x===15 || y===9`), sorted walking the rim clockwise from `(0,0)` (top L→R, right T→B, bottom R→L, left B→T) so `@second-crown/render` can stroke a connected ring without recomputing the walk order.
- Exported from `packages/sim/src/index.ts` alongside a new `RimFort` type.
- New tests in `packages/sim/src/systems/rimForts.test.ts`: empty rim, mixed walls+gate sorted clockwise, and interior walls / unfinished buildings / other realms excluded.
- Pure sim helper only. `git diff main -- packages/app packages/render server` is empty. No combat, march, fog, or housing changes. Full `@second-crown/sim` test suite (90 tests) and the app build (`tsc -b && vite build`) pass.

W16 Claude War tab briefing delivered on branch `bakeoff/claude-war2` (PR into main unmerged).
- War tab now opens with a single "Briefing" card readable in ~20 seconds:
  - **Incoming**: one line per hostile march bound for your hold — name (only once a Watchtower is built, otherwise "Unknown host") and ETA in seconds — followed by current Wall HP and whether the gate is up or down.
  - **Wounded**: wounded count vs. infirmary beds, with a "Treat (4 food)" button (`tryTreatWounded`) disabled when nobody is wounded.
  - **People**: population vs. housing cap (`housingCap`).
- New pure-function exports from `@second-crown/sim`: `gateOnRim`, `gateHp` (already used internally by `wallHp`/siege math, now exposed for the UI). No combat math, march formulas, or fog rules changed.
- `git diff main -- packages/sim/src/core` is empty. All existing sim tests (87) and the app build (`tsc -b && vite build`) pass unchanged.

W3 Gemini two-band camera delivered on branch `bakeoff/gemini-board-cam` (PR into main unmerged).
- Two camera bands on existing Pixi canvas: Hold (`zoom > 0.70`) vs Board (`zoom <= 0.70`).
- Tabletop 8×6 board tokens rendered from `state.board.provinces`:
  - 6 terrain chips: plain, wood, hill, waste, shore, peak.
  - Node marks: hold, camp, woodcut, quarry, field.
  - Player hold (`x=2, y=2`) and Iron March / rival (`x=5, y=2`) read as tokens with heraldic styling.
- Board interaction:
  - Clicking home province snaps back to Hold band.
  - Clicking foreign province dispatches `tryMarch(state, provinceId)` through existing `act` helper and toasts outcome.
- Active player march from `listMarches` / `activePlayerMarch` displays an animated tabletop marching meeple pawn lerped by tick vs arrivesTick with amber route path.
- Board / Hold toggle button next to ChromeDock and on canvas controls allows switching bands without mouse wheel.
- Sim and server purity strictly preserved (`git diff main -- packages/sim server` 100% empty).

Bakeoff Gemini lane delivered on branch `bakeoff/gemini-board2` (PR into main unmerged).

- **Distinct Isometric Cottage & Gatehouse (`packages/render`)**:
  - **Cottage (`case "cottage"`)**: Cozy half-timbered residential dwelling with steep gabled reed thatch, stone chimney with curling animated smoke puffs, leaded-glass window glowing with honey candlelight, arched wooden door with brass knob, stone doorstep, stone-lined flowerbed with blossoms, and stacked cord of split firewood.
  - **Gatehouse (`case "gate"`)**: Towering ashlar granite gatehouse with twin bastion towers, crenellated battlements, arrow slits, and arched gateway portal.
    - On rim tiles (`isRimTile(gx, gy)`: `gx === 0 || gy === 0 || gx === GRID_W - 1 || gy === GRID_H - 1`), features heavy reinforced oak double-doors with blackened iron hinge straps, studs, iron lock bar, lowered portcullis iron teeth, and defensive faction pennant.
    - On interior tiles, features an open vaulted passage.
- **Board Fog Chips (`packages/render`)**:
  - Board-band tokens query `isProvinceSeen(state, p.id)` directly from `@second-crown/sim`.
  - Unseen provinces render as tactile 3D blank parchment / fog chips: dark vellum bevel, blank parchment face, subtle drifting fog mist curves, concealing terrain graphics, node icons, and rival heraldry without creating a second fog system.
  - Hover highlight plaque masks confidential occupant info for unscouted tiles.
- **Hostile Red/Iron March Meeple (`packages/render`)**:
  - Hostile marches (`listMarches` where `realmId !== "player"`) use a distinct red/iron meeple:
    - Heavy blackened iron pedestal with rivets.
    - Angular dark iron torso with spiked pauldrons.
    - Blood-red war tabard with crossed iron harness straps.
    - Horned dark iron helm with glowing crimson eye-slit.
    - Blackened polearm with jagged halberd blade and ragged crimson/black war pennant.
    - Dotted crimson route trail and blackened iron / crimson ETA pill badge.
  - Player marches retain the polished wood pedestal, royal blue tunic, bright steel helm, golden standard, and amber trail.
- **Invariants & Preservations**:
  - Sim and server purity strictly preserved (`git diff main -- packages/sim server` 100% empty).
  - Zoom/pan, tile click, ChromeDock, and recorded audio completely intact.
  - Holiday lanterns remain dim.
  - All tests passing: 87/87 in `@second-crown/sim`, 12/12 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).
