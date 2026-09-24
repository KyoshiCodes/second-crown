# Handoff (2026-09-24)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active wave (wave/hud-war, not merged)

- War tab: Incoming, Scouts, Gathers, Garrisons render as small `ForceCard`s (`packages/app/src/hud/ForceCard.tsx`, `hud/force-card.css`): name, dest, seconds, one Recall/Sally button. Garrisons show "posted" instead of seconds.
- Odds, Levy and fight, Last battle, Decrees, Columns list unchanged. No sim change.

## Active Bakeoff (bakeoff/gemini-people)

- **People Cards & Walker Role Pips (`packages/app/src/hud/WalkerPip.tsx`, `packages/app/src/hud/JobCard.tsx`, `packages/app/src/PeoplePanel.tsx`, `packages/app/src/theme.css`)**:
  - Each people card (Farmer, Woodcutter, Miner, Merchant, Idle) features a matching walker role pip (hoe, axe, pick, coin, or idle sitting villager).
  - **Matching Walker Role Pips**:
    - `farmer`: 3-tined forged iron field hoe & golden wheat harvest sprout.
    - `woodcutter`: Bearded felling broadaxe with razor cutting edge & pine log.
    - `miner`: Double-pointed quarry pickaxe with piercing beak & stone/ore.
    - `merchant`: Minted royal gold sovereign with starburst twinkle & coin pouch.
  - **Idle Pip Sits**: When unassigned or idle (`assigned === false`), the walker sits comfortably on a hay bale, pine log, granite ashlar block, or strongbox trunk with hands resting peacefully.
  - **Assigned Pip Walks 2 Frames**: When assigned to a trade (`assigned === true`), the pip walks through a stepped 2-frame walking cycle (`.sc-walker-f0`, `.sc-walker-f1`) with dynamic tool swaying and bobbing.
  - **Non-blocking Clicks**: Wrapper and SVG strictly enforce `pointer-events: none !important;` so all card selections, worker "Post at..." dropdowns, and "Idle" buttons receive clicks with zero obstruction.

## Verify

```
npm test
npm run test -w @second-crown/render
npm run build -w @second-crown/app
```

## Invariants that still bite

- HUD chrome palette: `<html data-chrome>` via `ThemeDock.tsx`, key `sc-chrome`. Buttons default dark from `theme.css`.
- World atlas pans by drag. 6px slop keeps clicks working. Recenter resets.

- Sim is 10 Hz, deterministic, offline catch-up. No sim on `server/`.
- Column clashes use the column, not the home army.
- Presentation branches must leave `git diff main -- packages/sim server` empty.
- One study at a time. Academy only shortens *new* studies.
- Treat wounded is 4 food + 50 ticks → 1 militia.
- Wall HP already includes gate HP; do not add them twice in copy.
- Vision ≠ rim tower count. See DEV-NOTES.

## Docs map

| File | Who |
|---|---|
| USER-NOTES.md | playtesters |
| CHANGELOG.md | every merge crumb |
| DEV-NOTES.md | footguns |
| ROADMAP.md | next |
| PROGRESS.md | eras |
| INVARIANTS.md | law |
| CONCEPT-BIBLE.md | fantasy |
| obsidian/ | vault seed |
