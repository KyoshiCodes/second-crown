# HANDOFF

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

