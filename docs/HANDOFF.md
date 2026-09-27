# Handoff (2026-09-27)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active Bakeoff (bakeoff/gemini-events)

- **Event Cards & 24px Omen Pip (`packages/app/src/hud/EventCard.tsx`, `packages/app/src/hud/OmenPip.tsx`, `packages/app/src/hud/event-card.css`, `packages/app/src/EventPanel.tsx`)**:
  - Replaces raw paragraphs/buttons in `EventPanel` with dedicated `EventCard` components:
    - Displays event title, body narrative, tick count (`tX`), and optional interactive choices.
    - Prominently showcases latest event with `.is-latest`, followed by Advisor Mira, with previous events organized in a responsive `.sc-event-grid`.
    - Card left edge colors by event kind: harvest (green), timber (wood brown), spoil (red), levy (purple), tribute/comet (amber gold).
  - **24px Omen Pip (`OmenPip.tsx`)**:
    - Authentic 24px medieval omen art (`width: 24px; height: 24px; viewBox="0 0 24 24"`) with three variants:
      - `comet`: blazing celestial star portent with streaking flaming tail, incandescent core, and star dust embers.
      - `raven`: prophetic obsidian raven perched with glinting keen eye and twilight plumage.
      - `harvest`: auspicious golden wheat sheaf tied with crimson ribbon, ripe wheat grains, awn whiskers, and solar glints.
    - Helper `resolveOmenVariant(eventId?: string, text?: string)` automatically maps simulation event types to the proper omen pip.
  - **Styles isolated to event-card.css only**: `theme.css` was not edited. Zero conflict markers.
  - **Non-blocking Clicks**: Wrapper (`.sc-omen-pip-wrapper`), SVG, and all child paths strictly enforce `pointer-events: none !important;` so that button clicks and cards are never obstructed.

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
