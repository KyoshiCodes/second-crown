# CHANGELOG

Newest first.

## 2026-09-06 — Gemini immersion foundation (isometric pixel hold, living walkers, theme packs)

- **Isometric Pixel Hold**: 2:1 isometric diamond grid in `packages/render` replacing flat 2D grid. Retains identical 16×10 tile click contract for placing/upgrading buildings.
- **Detailed Pixel Buildings**: Silhouettes for all 15 building types + fallback with construction scaffolding, level upgrade frames (1–5), chimney smoke, and seasonal trims.
- **Living Presentation Walkers**: 8 animated pixel citizens (villagers, woodcutters, miners, merchants, sentries, scholars) with walking strides and idle routines roaming between buildings. Zero sim tick rules.
- **Theme Packs System**: 9 complete packs in `packages/app/src/themes/` (halloween, midwinter, easter, harvest, midsummer, spring, summer, autumn, winter) with dedicated CSS atmospheric backgrounds, chrome, and ambient lighting.
- **Audio Manager**: Recorded audio first (`/audio/<id>.ogg`) with seamless procedural synth fallback and active battle support. Preserves owner's `halloween.ogg`.
- **Sticky TesterBar**: TesterBar pinned at `zIndex: 100` for instant holiday switching.
- **Sim & Server Purity**: `git diff main -- packages/sim server` verified empty.

## 2026-09-06 — Holiday stage + sticky tester bar

- Illustrated holiday stages (not used on plain seasons).
- TesterBar pinned so Holiday overlay stays visible.
- Recorded loop hook `/audio/<id>.ogg` with synth fallback.

## 2026-09-06 — Bakeoff merge: WarRoom, seasons, practice ledger

- Claude WarRoom, Gemini weather/audio/chips, Astra practice exchange.

## 2026-09-06 — HTTPS live + specialist buildings

- `https://129.153.17.72.sslip.io/`
