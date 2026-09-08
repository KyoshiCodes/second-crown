# Lane: Gemini leftover kits

Branch: `bakeoff/gemini-holdrest` from current `main`.
Do not merge. Do not edit `packages/sim` or `server`.
`git diff main -- packages/sim server` must stay empty.

PR 23–24 covered most hold art. This lane is the leftovers the sim still lists.

## Must-draw (real ids from packages/sim/src/content/buildings.ts)
`farm`, `cottage`, `lumber_camp` (not `lumber`), `quarry`, `gold_mine`, `granary`, `sawmill`, `mason`, `market`, `mint`, `barracks`, `stables`, `archery_range`, `siege_workshop`, `watchtower`, `chapel`, `infirmary`, `walls`, `gate`, `keep`.
If `drawIsometricBuilding` still keys `lumber` only, alias `lumber_camp`.
`gold_mine` and `market` are the usual misses — they need cedar/sand/steppe/islands silhouettes. Western stays current.

## Columns and strips
Player march meeples and gather carts on the board, plus WarLivingStrip / ArmyVisual UnitIcons, must use the same culture kit as the hold. Hostile Iron March meeples stay red/iron.

## Climate
Do not rip out PR 24 climate. You may thicken gold_mine/market only.
No new building types. No copyrighted franchise shapes.

## Verify
Add or extend render tests so every BUILDING_TYPES id is passed through `drawIsometricBuilding` for western + cedar + sand + steppe + islands without throw.
`npm test`
`npm run test -w @second-crown/render`
`npm run build -w @second-crown/app`
Rewrite `walkthrough.md` for this PR only. Update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES.
PR into main, leave unmerged.
