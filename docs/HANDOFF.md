# Handoff (2026-09-24)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active Bakeoff (bakeoff/gemini-works)

- **Kingdom Work Cards with 24px Isometric Hall Chips (`packages/app/src/hud/WorkCard.tsx`, `packages/app/src/hud/HallChip.tsx`, `packages/app/src/tabs/KingdomTab.tsx`, `packages/app/src/theme.css`)**:
  - Each work card features a tailored 24px isometric hall chip illustrating the building type (cottage, farm, lumber camp, quarry, market, barracks, academy, chapel, infirmary, watchtower, granary, sawmill, etc.).
  - **Unstaffed chip is dim**: When unstaffed, the chip dims (`opacity: 0.42`, `filter: grayscale(0.55) brightness(0.68)`) with dark unlit windows and cold hearths. Staffed buildings show warm glowing candlelight and vibrant colors.
  - **Scarred chip is cracked**: When damaged by siege strikes, the chip displays jagged stone crack fractures (`sc-chip-cracks`, `sc-chip-crack-main`, `sc-chip-crack-branch`) and chipped masonry.
  - **Non-blocking clicks**: All chips and wrappers strictly enforce `pointer-events: none !important;` so Demolish and Repair buttons always receive clicks with zero obstruction.

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
