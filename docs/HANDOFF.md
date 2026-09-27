# Handoff (2026-09-27)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active Bakeoff (bakeoff/gemini-quests)

- **Quest Cards & 24px Scroll Pip (`packages/app/src/hud/QuestCard.tsx`, `packages/app/src/hud/ScrollPip.tsx`, `packages/app/src/hud/quest-card.css`, `packages/app/src/QuestPanel.tsx`)**:
  - Replaces raw quest rows with dedicated `QuestCard` components arranged in `.sc-quest-grid`:
    - Shows quest title, hint, 0/1 progress bar, and a Claim button when complete and ready.
    - Card edge colors by status: `.is-open` (amber `#d29922`), `.is-ready` (green `#3fb950`), `.is-claimed` (muted slate `#6e7681`).
  - **24px Scroll Pip (`ScrollPip.tsx`)**:
    - Unrolled medieval parchment mandate at 24px (`width: 24px; height: 24px; viewBox="0 0 24 24"`) with roller rods, sepia script lines, and wax signet seal.
    - **Ready Pip is LIT**: When complete and ready to claim (`status === "ready"`), the scroll glows with radiant golden vellum, an incandescent aura, dual sparkle stars, and candle flame flicker (`drop-shadow(0 0 2.5px rgba(250, 204, 21, 0.95)) drop-shadow(0 0 6px rgba(245, 158, 11, 0.65))`).
    - In progress ("open") shows warm antique vellum; claimed shows muted archived silver-grey.
  - **Styles isolated to quest-card.css only**: `theme.css` was not touched. Zero conflict markers.
  - **Non-blocking Clicks**: Wrapper (`.sc-scroll-pip-wrapper`), SVG, and all child paths strictly enforce `pointer-events: none !important;` so that Claim button and card clicks are never obstructed.

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
