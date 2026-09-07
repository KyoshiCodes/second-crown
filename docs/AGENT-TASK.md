# Map bakeoff — wall run + terrain (not a full overworld rewrite)

Ground is `main` after PRs 14 and 15. Do not merge. Do not touch tickEngine, Discord, Caddy, holidays, or audio.

## Claude — `bakeoff/claude-walls`

Sim helper only.

Add `listRimForts(state, realmId = "player")` in `packages/sim` that returns
`{ x, y, kind: "wall" | "gate" }[]` for **finished** buildings on the 16×10 hold rim
(`x===0 || y===0 || x===15 || y===9`).

- Sort walking the rim clockwise from (0,0) so a renderer can stroke a ring.
- Export it from `packages/sim/src/index.ts`.
- Tests: empty rim, mixed walls+gate, interior wall excluded.
- No combat, march, fog, or housing changes.
- `git diff main -- packages/app packages/render server` should be empty.

## Gemini — `bakeoff/gemini-map`

Presentation only. `git diff main -- packages/sim server` must be empty.

1. **Wall run on the hold:** for each rim fort (use `listRimForts` if exported, else `state.buildings` with the same rim rule) draw a connected stone curtain between neighbors, merlons on top, and the existing gatehouse sitting in the gap. Do not hide tile clicks. Interior `walls` stay the old block.
2. **Terrain chips on the board band:** make the six terrains read at a glance from 0.58 zoom — peak is a real ridge, shore has water+foam, wood is a stand of trees, waste glows, hill has contours, plain stays meadow. Keep the 8×6 grid and hardwood rim.
3. Keep fog chips, hostile red meeple, cottage art, zoom/pan, ChromeDock, dim lanterns.

## Both

`npm test` and `npm run build -w @second-crown/app` green.
Update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES. Rewrite `walkthrough.md` for your PR only. Leave PR unmerged.
