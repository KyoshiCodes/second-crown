# Bakeoff after W16 — presentation + war chrome

Ground is `main`. Do not merge. Do not edit `packages/sim/src/core/tickEngine.ts` except Claude if a test forces a one-line import (prefer not).

## Claude — `bakeoff/claude-war2`

War tab must read as a briefing in 20 seconds:
- Incoming column (name, ETA, wall HP, gate up or not).
- One row: wounded / beds / treat.
- One row: people / beds (housingCap).
- Do not change combat math, march formulas, or fog rules.
- Tests stay green. `git diff main -- packages/sim/src/core` should be empty.

## Gemini — `bakeoff/gemini-board2`

Presentation only. `git diff main -- packages/sim server` must be empty.

1. Distinct isometric **cottage** and **gate** (gatehouse with doors on rim tiles).
2. Board-band tokens: unseen provinces (`isProvinceSeen` is already on state) draw as blank parchment / fog chips. Do not invent a second fog system.
3. Hostile marches (`listMarches` where `realmId !== "player"`) use a red/iron meeple, not the player blue pawn.
4. Keep zoom/pan, tile click, ChromeDock, recorded audio.
5. Dim holiday lanterns stay dim.

## Both

Update `docs/HANDOFF.md`, `docs/CHANGELOG.md`, `docs/USER-NOTES.md`, `docs/DEV-NOTES.md`, rewrite `walkthrough.md` for your PR only.
`npm test` and `npm run build -w @second-crown/app` must pass. Leave PR unmerged.
