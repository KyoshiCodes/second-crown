# Handoff (2026-09-27)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active Bakeoff (bakeoff/gemini-battle)

- **Last-Battle Card & 28px Clash Pip (`packages/app/src/hud/BattleCard.tsx`, `packages/app/src/hud/ClashPip.tsx`, `packages/app/src/hud/battle-card.css`, `packages/app/src/WarRoom.tsx`, `packages/app/src/theme.css`)**:
  - Replaces raw paragraphs and event list in the War tab with a dedicated `BattleCard`:
    - Shows combatants (winner vs loser) and outcome verdict (green Victory, red Defeat, or amber X won for AI rival clashes).
    - **28px Clash Pip (`ClashPip.tsx`)**:
      - **Crossed Blades (`variant="crossed_blades"`)**: Two crossed forged steel arming swords with gold pommels, quillons, and clash spark; green/gold glow on victory or general field clash.
      - **Broken Shield (`variant="broken_shield"`)**: Fractured iron-rimmed heater shield split by a jagged fissure crack with fiery embers and rivets; red glow when player is defeated (`loserId === "player"`).
    - **Non-blocking Clicks**:
      - Wrapper (`.sc-clash-pip-wrapper`), SVG, and child paths strictly enforce `pointer-events: none !important;` so card inspection and folded details remain completely unobstructed.
    - Shows combat log report, Butcher's bill phase when present, and folds detailed round-by-round events under `<details className="sc-battle-log"><summary>Blow by blow</summary>`.

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
