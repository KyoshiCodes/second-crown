# Lane: Gemini kits + climate

Branch: `bakeoff/gemini-climate` from current `main`.
Do not merge. Do not edit `packages/sim` or `server`.
`git diff main -- packages/sim server` must stay empty.

PR 23 already gave keep / cottage / farm / lumber plus villager/guard and militia/spearman kits.
This lane finishes the rest of the hold + army, then adds per-culture climate. Crown Marches (`western`) stays the current art and current holiday/season weather.

## A. Remaining silhouettes
Use `resolveCultureKit` already on the branch (western | cedar | sand | steppe | islands).
Cover every other `drawIsometricBuilding` type that has a western drawing: quarry, barracks, chapel, watchtower, walls, gate, infirmary, academy, siege workshop, mint/granary/sawmill/mason if those cases exist, outpost flag.
Cover remaining UnitIcon types: skirmisher, archer, cavalry, knight, siege, champion.
Original designs. No copyrighted franchise shapes.

## B. Culture climate (presentation only)
When `playerCultureId` is not western, overlay a light climate on the hold + board that does not replace holidays:
- cedar: mist / pine pollen, cooler greens, optional woodwind bed if no recorded track
- sand: heat shimmer, dune wash on board waste/plain chips, dust motes, dry percussion fallback
- steppe: wide-sky wash, grass ripple, horsehair drone fallback
- islands: sea haze, wet stone sheen, surf bed fallback
Do not drown dim lanterns. Do not block tile clicks. Prefer CSS + existing WeatherOverlay / audioManager hooks over a second Pixi engine.
If you add `/audio/<kit>.ogg` placeholders, missing files must fall back to synth. Do not require new binaries in the PR.

## C. Preserve
Zoom/pan, inspect/gather, holidays, ChromeDock, recorded halloween/easter/midwinter oggs, vault/army posts UI.

## Verify
`npm test`
`npm run test -w @second-crown/render`
`npm run build -w @second-crown/app`
Rewrite `walkthrough.md` for this PR only. Update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES.
PR into main, leave unmerged.
