# Handoff (2026-09-27)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active wave (wave/hud-diplo)

- War tab "Odds" section is now **Diplomacy**: one `RealmCard` per other realm (`packages/app/src/hud/RealmCard.tsx`, `realm-card.css`) in `.sc-realm-dip-grid`.
- Card: name, stance (At war / Truce Ns / Friendly / Wary / Hostile), opinion of you, power odds, existing Declare war button, and the existing Gift button on Varric's (rival) card only.
- `DiplomacyPanel` removed from `HudControls.tsx`. Sim untouched. Not merged.

## Active Bakeoff (bakeoff/gemini-decrees)

- **Royal Decree Cards & 24px Wax-Seal Pip (`packages/app/src/hud/DecreeCard.tsx`, `packages/app/src/hud/WaxSealPip.tsx`, `packages/app/src/hud/decree-card.css`, `packages/app/src/DecreesPanel.tsx`, `packages/app/src/theme.css`)**:
  - Replaces raw decree buttons in the Crown tab with dedicated `DecreeCard` elements arranged in `.sc-decree-grid`:
    - Shows decree name, blurb, cost row with 16px `ResourcePip`s, and active countdown timer (`${Math.ceil(left / 10)}s left`).
    - Action button: "Issue" (or "Already active" when in effect).
    - Status tones: `.is-ready` (amber), `.is-active` (green + illuminated backdrop), `.is-off` (unaffordable).
  - **24px Wax-Seal Pip (`WaxSealPip.tsx`)**:
    - Circular stamped royal wax seal at 24px (`width: 24px; height: 24px; viewBox="0 0 24 24"`):
      - Scalloped wax matrix edge with molten droplets and hanging silk ribbons.
      - Stamped royal crown matrix sigil (with specialized emblems for "muster", "rite", "envoys").
      - **Active Seal is LIT**: Molten amber-gold wax, glowing incandescent core, radiant crown flare, and animated flame flicker (`drop-shadow(0 0 2.5px rgba(250, 204, 21, 0.95)) drop-shadow(0 0 6px rgba(245, 158, 11, 0.65))`).
      - **Dormant Seal**: Deep pressed royal crimson wax (`#991b1b` / `#7f1d1d`).
  - **Non-blocking Clicks**:
    - Wrapper (`.sc-wax-seal-pip-wrapper`), SVG (`.sc-wax-seal-pip`), and all child elements strictly enforce `pointer-events: none !important;` so that Issue button and card clicks are never intercepted.

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
