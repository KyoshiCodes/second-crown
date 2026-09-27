# Handoff (2026-09-27)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active Bakeoff (bakeoff/gemini-diplo)

- **Diplomacy Realm Cards & 28px Realm Crest Pip (`packages/app/src/hud/RealmCard.tsx`, `packages/app/src/hud/RealmCrestPip.tsx`, `packages/app/src/hud/realm-card.css`, `packages/app/src/WarRoom.tsx`, `packages/app/src/theme.css`)**:
  - Replaces raw odds button list in the War tab with dedicated `RealmCard` elements arranged in `.sc-realm-dip-grid`:
    - Shows realm name, stance badge (with truce countdown timer), opinion breakdown, power odds comparison (mine vs theirs and share %), and Declare war / Gift actions.
    - Card edge colors by stance: `.is-war` (red `#f85149`), `.is-truce` (azure `#58a6ff`), `.is-friendly` (green `#3fb950`), `.is-wary` (amber `#d29922`), `.is-hostile` (orange `#db6d28`).
  - **28px Realm Crest Pip (`RealmCrestPip.tsx`)**:
    - Mounts the existing heraldic `Crest` at 28px (`width: 28px; height: 28px; size={28}`).
    - **Hostile Crest is Colder**: When in a hostile stance (`stance === "hostile"` or `stance === "war"`), the crest shifts to a colder hue-rotated blue-grey steel frost (`saturate(0.5) hue-rotate(185deg) brightness(0.9)`), accompanied by a crystalline frost contour overlay and icy cyan glow (`drop-shadow(0 0 2.5px rgba(56, 189, 248, 0.75))`).
    - Stance auras: friendly is warm emerald green, truce is serene azure, and wary is warm amber.
  - **Non-blocking Clicks**:
    - Wrapper (`.sc-realm-crest-wrapper`), SVG, and all child paths strictly enforce `pointer-events: none !important;` so that Declare war and Gift gold button clicks are never obstructed.

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
