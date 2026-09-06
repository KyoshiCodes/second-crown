# DEV-NOTES

Last updated: 2026-09-06

## Presentation Architecture (Gemini Lane)

- **Weather & Holidays**: `packages/app/src/seasons/holidays.ts` and `WeatherOverlay.tsx`. Pure canvas overlay (`pointer-events: none`) matching `currentSeason(state)`. Holidays detect calendar dates with `localStorage` override `sc-preview-holiday` for instant playtester review.
- **Audio Synthesis**: `packages/app/src/music.ts` dynamically modulates pentatonic scale intervals, tempo, and oscillator timbre based on the active season and holiday without introducing heavy audio assets or violating browser autoplay rules.
- **Render Ground Seasoning**: `packages/render/src/index.ts` repaints 16x10 ground tiles on season transitions and caps rooftops with snow during Winter. Zero sim impact.
- **Item Chips**: `packages/app/src/ItemChip.tsx` maps `ITEMS` from `loot.ts` into styled rarity badges (`common`, `uncommon`, `rare`, `epic`) with SVG iconography.


## HTTPS

Caddyfile `/etc/caddy/Caddyfile` → `129.153.17.72.sslip.io` → `127.0.0.1:8787`.
Never `pm2 delete sc-cloud` without restoring DISCORD_* and PUBLIC_APP_URL=https://129.153.17.72.sslip.io

Prefer `pm2 restart sc-cloud` for code deploys.

## Train discounts

`trainCostMultiplier(state, typeId)` — barracks global, then stables/range/workshop by unit family. Combat tests use militia (no specialist building).
