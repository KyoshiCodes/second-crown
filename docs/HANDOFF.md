# Handoff (2026-09-24)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active Bakeoff (bakeoff/gemini-strip)

- **Carved Timber Ledger with Animated Resource Pips (`packages/app/src/hud/ResourceHud.tsx`, `packages/app/src/hud/ResourcePip.tsx`, `packages/app/src/theme.css`)**:
  - Each resource cell (Food, Wood, Stone, Gold) features a looping 2–3 frame animated sprite pip:
    - Food: Burlap grain sack with tied twine, gentle breathing and golden grain glints.
    - Wood: Felled timber log with bark ridges and growth rings, catching amber resin glints.
    - Stone: Dressed cubic ashlar masonry block in isometric relief with chiseled margins and tool sparkle.
    - Gold: Minted royal coin with reeded edge and crown stamp, gleaming with specular star shine.
  - **Empty food pip slumps**: When player food stores are empty or critically low (`isFoodStoresEmptyOrLow`), the grain sack pip visibly slumps flat to the ground with a deflated pancake silhouette and sagging neck.
  - **Full store pip stacks high**: When any store reaches capacity (`full`), its pip stacks high into a proud pyramid/tower (3 bursting grain sacks with sprouting wheat sheaves, 5 stacked timber logs in a cord, 4-tier stepped ashlar fortress pier, towering double coin stacks) bathed in a radiant golden glow.
  - **Non-blocking clicks**: All pips and wrappers strictly enforce `pointer-events: none !important;` guaranteeing zero interference with clicks, tooltips, or interactions.

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
