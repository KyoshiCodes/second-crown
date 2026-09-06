# CHANGELOG

Playtest log. Not a marketing changelog. Newest first.

## 2026-09-06 — Playtest cloud + world crowns

- Oracle Always Free VM serves game and API on port **8787** (`server/index.mjs` + `packages/app/dist`)
- Guest sessions with recovery codes; Discord OAuth (`identify`)
- Auto-push every 2 minutes and on tab hide
- Watch links: `POST /watch`, `GET /watch/:code`, client `#watch=`
- Extra kingdoms (Frost, Tide, Ember, Bronze, plus Silk/Ash/Veil/Glass pool)
- Per-crown gifts, declare buttons, peace timers
- Faction souring written to world log
- Battle playback phases (no extra RNG)
- SVG heater-shield crests
- New Game uses `engineRef` (old loop was ticking a stale engine)

## 2026-09-05–06 — Core loop

- Tick engine + coarse settlement, mulberry32 streams
- Buildings, upgrades, market, units, barracks discount
- War declare / resolve / white peace
- Offline catch-up
- Tabs: Kingdom, Army, War, World, Crown
- IndexedDB + file export/import

## Known not shipped

- HTTPS
- Lockstep multiplayer / PvP rooms
- 3D battle scene
- Full intrigue (characters exist as stubs)
