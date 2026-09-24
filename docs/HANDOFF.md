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

## Active wave (wave/hud-people)

- People panel (Kingdom tab) groups workers into job cards (`packages/app/src/hud/JobCard.tsx`): job name, count, and the building(s) they walk to. Idle card is dashed/amber, assigned cards have a green edge. Per-worker "Post at…" and "Idle" controls are kept. Not merged yet.
- Known red on `origin/main` before this branch: 3 render tests in `packages/render/src/index.test.ts` expect `sc-work-title-group` and `sc-unit-art-wrapper`, which `theme.css` / `UnitCard.tsx` do not define (from the Gemini bakeoff merges). `npm test` (sim) is green.

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
