# Bakeoff — Army tab matches the hold (Gemini only)

Ground is current `main`. Do not merge. `git diff main -- packages/sim server` must be empty.

## Gemini — `bakeoff/gemini-army`

Presentation only.

1. **Army tab roster** (`packages/app/src/tabs/ArmyTab.tsx`, `ArmyVisual.tsx`, `UnitIcon.tsx`): replace the flat chip portraits with pixel silhouettes in the same language as hold walkers and buildings — 2–3 frame idle/march, facing, tabard colors, weapons that match type (militia spear-less levy, archer bow, cavalry horse, siege frame, knight heater). No new combat math.
2. **Board meeple reuse:** player columns already on the board should use the same sprites/colors as the Army tab so a sent archer column looks like the Army archer, not a generic blue pawn.
3. Keep ChromeDock, holidays, dim lanterns, inspect card, primer, zoom/pan.
4. Tests: `npm test` and `npm run build -w @second-crown/app` green. Add render tests only if you extract pure helpers.

Rewrite `walkthrough.md` for this PR. Update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES. PR into main, leave unmerged.

## Claude

Idle this wave.
