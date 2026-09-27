# Handoff (2026-09-27)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active Bakeoff (bakeoff/gemini-select-rim)

- **Selected Board Province Clear Gold Rim & Ground Ring (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/app/src/OverworldAtlas.tsx`, `packages/app/src/game/useGameEngine.ts`)**:
  - **Clear Gold Rim & Ground Ring (`paintBoardSelectionRim`)**:
    - **Tabletop Ground Ring (`wy`)**: Encircles the province footprint at ground level with a brilliant gold ring (`0xfacc15`, `0xb45309`, `0xfef08a`), inner shimmer line, and 4 cardinal corner bracket pips, clearly anchoring the tile to the tabletop.
    - **Vertical Cliff Struts**: For elevated tiles (`elev > 0`), corner struts descend along the vertical cliff edges connecting the ground ring to the top plateau with a front cliff ground rim.
    - **Top Gold Rim (`cy = wy - elev`)**: Surrounds the elevated plateau with a double gold rim (`0xfacc15`, `0xd97706`), sunlight facet glint, and 4 cardinal diamond corner glints.
  - **Synchronized Board & Atlas Selection**:
    - Board Pixi renderer introduces dedicated `boardSelectionLayer` and integrates `paintBoardSelectionRim` into `paintBoardHighlight` and `paintBoardProvinces`.
    - `MapRenderer` exposes `setSelectedProvince(provinceId: string | null)` and `getSelectedProvince()`, kept in sync with engine state in `useGameEngine.ts`.
    - `OverworldAtlas.tsx` renders matching `.sc-atlas-select-rim` with base ground ring and top gold rim (`pointerEvents="none"`).
  - **Strict Invariants Preserved**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% unchanged.
    - `git diff main -- packages/sim server` strictly empty. Zero conflict markers.

## Active wave (wave/hud-inspect)

- **Province inspect card (`packages/app/src/ProvinceInspect.tsx`, `packages/app/src/hud/inspect-card.css`)**: the clicked-province panel is now one `.sc-inspect-card`.
  - Head: name (your hold's name at home, the node label once scouted, "Unscouted province" in fog) plus Close.
  - Facts grid: Terrain, Owner, Tile (x,y), Gold.
  - Status lines (stock, camp threat, flag tithe, incoming, column, gather), then the existing action buttons in `.sc-inspect-actions`, the Column picker, and Send raid column.
  - All inline styles removed; styles live only in `inspect-card.css`. Click, march, scout, gather and garrison handlers are unchanged.

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
