# Walkthrough — Claude Rim Fort Listing (`bakeoff/claude-walls`)

## What changed

Added a single pure sim helper, `listRimForts(state, realmId = "player")`, in `@second-crown/sim`:

- Returns `{ x, y, kind: "wall" | "gate" }[]` for **finished** (`completesAtTick === null`) `walls`/`gate` buildings sitting on the 16×10 hold rim (`x===0 || y===0 || x===15 || y===9`).
- The list is sorted by walking the rim clockwise starting at `(0,0)` — top edge left→right, right edge top→bottom, bottom edge right→left, left edge bottom→top — so a renderer can connect the points in order and stroke a continuous wall run around the hold.

This is groundwork for a future wall-run renderer; it does not draw anything itself.

## Where

- `packages/sim/src/systems/rimForts.ts` — the new `listRimForts` function and `RimFort` type.
- `packages/sim/src/index.ts` — exports `listRimForts` and `RimFort` from `@second-crown/sim`.
- `packages/sim/src/systems/rimForts.test.ts` — new tests.

## Tests

- Empty rim (no buildings) returns `[]`.
- A mix of walls and a gate across all four rim edges comes back sorted clockwise from `(0,0)`.
- An interior wall, an unfinished (in-progress) wall, and a rival-realm wall are all excluded.

## What did not change

- No combat, march, fog, or housing logic.
- No `packages/app`, `packages/render`, or `server` changes (`git diff main -- packages/app packages/render server` is empty).
- No tickEngine, Discord, Caddy, or holiday/audio changes.

## Verification

- `npm test` — 90/90 sim tests pass (87 existing + 3 new).
- `npm run build -w @second-crown/app` — `tsc -b && vite build` passes.
