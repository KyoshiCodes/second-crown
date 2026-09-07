# Lane: Gemini crowns

Branch: `bakeoff/gemini-crowns` from current `main`.
Do not merge to main. Do not edit `packages/sim` or `server`.
`git diff main -- packages/sim server` must stay empty.

## Ship

1. **Every NPC hold is a token, not only Iron March.** `paintBoardProvinces` (or equivalent) must draw a distinct keep/chip for each `occupantRealmId` that is not the player. Reuse existing crest colors / realm names from flavor if present; do not invent a second board schema.
2. **Player culture tint.** Read `playerCultureId(state)` / `CULTURES` from `@second-crown/sim`. Crown Marches stays current art. Cedar Kin, Sand Banner, Wind Host, Tide Clans get tabard/timber/stone tints on hold walkers, keep dress, and `UnitIcon` — palettes already exist on `CULTURES[i].palette`. Do not replace combat or building types.
3. **World log visibility.** World tab (or dock) should show the latest claim / trade / npc-war lines so extra crowns are readable without opening DevTools.
4. Keep zoom/pan, inspect/gather, holidays, dim lanterns, ChromeDock, recorded audio.

## Verify
`npm test`
`npm run test -w @second-crown/render`
`npm run build -w @second-crown/app`
Rewrite `walkthrough.md` for this PR only. Update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES.
PR into main, leave unmerged.
