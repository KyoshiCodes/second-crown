# Lane: Gemini remaining silhouettes

Branch: `bakeoff/gemini-remain` from current `main`.
Do not merge. Do not edit `packages/sim` or `server`.
`git diff main -- packages/sim server` must stay empty.
Owner screenshots (Sand + teal-roof holds): grey curtain walls, grey gate towers, purple chapel, red-cross infirmary, western siege yard, and Army icons for cavalry / knight / champion / siege still use the Crown Marches drawing.

## Still western (must redesign for cedar, sand, steppe, islands)

Buildings (hold):
- walls (interior block AND rim curtain + merlons)
- gate / gatehouse towers
- chapel
- infirmary (drop the generic red-cross field hospital)
- siege_workshop
- watchtower if it is still the same slate turret on all kits
- barracks / stables / archery_range if they still share one western hall

Units (UnitIcon.tsx — these cases have no kit switch today):
- archer
- skirmisher
- cavalry
- knight
- siege
- champion (named heroes like Suki still use this type)

Already kit-switched (do not restyle western; only touch if a kit is missing):
- keep, cottage, farm, lumber_camp, quarry, gold_mine, market, granary, sawmill, mason, mint
- militia, spearman
- villager / guard walkers

## Rules
Western Crown Marches stays the current look.
Original designs. No franchise copies.
Do not break tile clicks, rim wall HP presentation, holidays, or dim lanterns.
Do not add a second music bed.

## Verify
Render tests: walls, gate, chapel, infirmary, siege_workshop, plus UnitIcon types above, for all 5 kits without throw.
`npm test`
`npm run test -w @second-crown/render`
`npm run build -w @second-crown/app`
Rewrite walkthrough.md for this PR only. Update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES.
PR into main, leave unmerged.
