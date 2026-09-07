# AGENT-TASK — Gemini W3 only

Branch: `bakeoff/gemini-board-cam` → PR into `main`, do not merge.

## Lane
Presentation only. `git diff main -- packages/sim server` must stay empty.

## Goal
Same Pixi canvas, two zoom bands.

1. **Hold (current):** 16×10 isometric turf. Tile click still builds/upgrades. Zoom/pan/rim stay.
2. **Board (new):** when the camera is zoomed out past a threshold (pick one number, document it), hide or shrink the turf detail and draw `state.board.provinces` as tabletop tokens on an 8×6 grid. Terrain chips: plain, wood, hill, waste, shore, peak. Node marks: hold, camp, woodcut, quarry, field. Player hold and Iron March reads as tokens, not full towns.

Click a province on the board band:
- If it is home → snap back to Hold band.
- Else call `tryMarch(state, provinceId)` through the existing `act` helper. Toast the result. Do not invent a second travel system.

Show active march from `listMarches` / `activePlayerMarch` as a small pawn between home and dest (lerp by tick vs arrivesTick is enough).

Add a **Board / Hold** toggle next to ChromeDock so testers who cannot scroll the wheel can switch bands.

## Must keep
Holiday dressings, walkers, lanterns, recorded audio, ChromeDock collapse, tile-click contract.

## Must not
New combat math. New province generation. Server routes. Real multiplayer pins.

## Verify
npm test
npm run build -w @second-crown/app
git diff main -- packages/sim server   # empty

Rewrite walkthrough.md for this PR only.
Update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES.
