# HANDOFF

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
