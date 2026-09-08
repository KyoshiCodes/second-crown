# Lane: Gemini culture kits

Branch: `bakeoff/gemini-kits` from current `main`.
Do not merge. Do not edit `packages/sim` or `server`.
`git diff main -- packages/sim server` must stay empty.

## Ship

Player `playerCultureId(state)` already picks western | cedar | sand | steppe | islands.
Crown Marches (`western`) keeps current keep, cottage, farm, walkers, UnitIcon.
The other four packs need **silhouette changes**, not only palette tints:

- cedar: timber longhouse keep, split-rail yards, woodland walker cloaks
- sand: courtyard keep, flat roofs, linen/sash walkers
- steppe: felt-roof hall, wagon yard, coat-and-sash walkers
- islands: pile-house keep, net racks, sailcloth walkers

Cover at least: keep, cottage, farm, lumber, walker villager/guard, UnitIcon militia + spearman.
Original designs. No copyrighted franchise shapes.
Do not add building types or combat math.
Keep zoom/pan, inspect/gather, holidays, dim lanterns, ChromeDock, recorded audio.

## Verify
`npm test`
`npm run test -w @second-crown/render`
`npm run build -w @second-crown/app`
Rewrite `walkthrough.md` for this PR only. Update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES.
PR into main, leave unmerged.
