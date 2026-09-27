# Handoff (2026-09-24)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Wave: hud-market (branch `wave/hud-market`, not merged)

- Kingdom tab Market is a grid of `OfferCard`s (give / get / Trade). Disabled via `canTrade`. `tryTrade` and `MARKET_OFFERS` untouched.

## Active Bakeoff (bakeoff/gemini-war-chips)

- **War Force Cards & 24px War Chips (`packages/app/src/hud/WarChip.tsx`, `packages/app/src/hud/ForceCard.tsx`, `packages/app/src/WarRoom.tsx`, `packages/app/src/theme.css`)**:
  - The War room organizes standing military actions into dedicated force cards (`.sc-force-grid`), each equipped with a bespoke 24px tactical SVG chip:
    - **Incoming Cards (`tone="hostile"`)**: Red warband pip (`WarbandSvg`) with horned iron crest, blood-red tabard, and spiked morningstar flail; bordered in crimson with soft red shadow glow.
    - **Scouts Cards (`tone="scout"`)**: Cloak pip (`CloakSvg`) with twilight-navy cowl mantle, sky-cyan border trim, and polished brass spyglass telescope; bordered in blue.
    - **Gathers Cards (`tone="gather"`)**: Cart pip (`CartSvg`) with heavy timber cargo flatbed, banded grain sacks, and iron-spoke wagon wheel; bordered in amber.
    - **Garrisons Cards (`tone="garrison"`)**: Tent pip (`TentSvg`) with heavy canvas pavilion ridgepole, leaning spear and tower heater shield, and glowing warm lantern; bordered in emerald.
  - **Force Card Structure**:
    - Header mounts 24px `WarChip` beside force name, destination province/token, and countdown ETA ("posted" or `${seconds}s`).
    - Compact action buttons ("Sally" for incoming raids, "Recall" for player march/gather/scout columns) align neatly on the card.
  - **Non-blocking Clicks**:
    - All chip wrappers (`.sc-war-chip-wrapper`), SVGs, and child paths strictly enforce `pointer-events: none !important;` so Recall, Sally, and province targeting clicks fire cleanly without obstruction.

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
