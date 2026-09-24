# Handoff (2026-09-24)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active Bakeoff (bakeoff/gemini-army-chips)

- **Army Unit Cards with 28px Culture-Kit Chips (`packages/app/src/hud/UnitCard.tsx`, `packages/app/src/tabs/ArmyTab.tsx`, `packages/app/src/theme.css`)**:
  - Each trainable unit on the Army tab (militia, spearman, archer, skirmisher, cavalry, knight, champion, siege) sits in a dedicated `UnitCard`.
  - **28px Culture-Kit Chip Art**: Displays the unit's culture-kit icon (`UnitIcon` at 28px) inside `.sc-unit-art-wrapper`.
  - **Locked Cards Greyed**: Locked units (such as cavalry/knights without Horse lore or siege without Siege craft) are styled with `.is-locked` (`filter: grayscale(1)`, `opacity: 0.55`, muted text, `cursor: not-allowed`).
  - **Non-blocking Clicks**: Strictly enforces `pointer-events: none !important;` on `.sc-unit-art-wrapper` and its SVG children so drilling levies and clicking unit cards is never obstructed.

## Active wave (wave/hud-army)

- Army tab units are cards (`packages/app/src/hud/UnitCard.tsx`) instead of "Militia pwr 4" buttons. Not merged yet.
- Known red test on `origin/main` before this branch: render test "theme.css defines work card grid…" expects `sc-work-title-group`, which `theme.css` does not define (from the gemini-works bakeoff merge).

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
