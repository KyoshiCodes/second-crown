# DEV-NOTES

Last updated: 2026-09-06

## Presentation Architecture (Gemini Immersion Lane)

- **Isometric Pixel Hold (`packages/render`)**:
  - 2:1 diamond isometric projection (`TILE_W = 40`, `TILE_H = 20`, viewport `560×360`).
  - Reverse mouse projection: `gx = Math.floor(dx / 40 + dy / 20)`, `gy = Math.floor(dy / 20 - dx / 40)` bounds-checked to `[0..15, 0..9]`. Exact click contract for sim building actions preserved.
  - Depth sorting: Pixi `Container.sortableChildren = true` with `zIndex` calculated as `(x + y) * 100 + offset`. Walkers naturally walk behind foreground buildings and in front of background buildings.
  - Living Hold Walkers: 8 presentation citizen sprites (villager, woodcutter, miner, merchant, guard, scholar) with animated stride cycles, destination targeting towards buildings or town center, and idle timers. Presentation-only; zero sim tick rules.
  - Terrain & Architecture: Raised 3D stone cliff rim along south edges, cobblestone thoroughfares, and detailed pixel art for all 15 building types + fallback with construction scaffolding, level upgrade pips (1–5), animated chimney smoke, and holiday trims.
  - Atmospheric Particles: In-engine Pixi particle layer rendering snowflakes (midwinter/winter), spectral embers (halloween), fireflies (midsummer), petals (spring/easter), and autumn leaves.

- **Theme Packs & Audio Coordination (`packages/app/src/themes/`)**:
  - `types.ts` & `packs.ts`: 9 complete packs (`halloween`, `midwinter`, `easter`, `harvest`, `midsummer`, `spring`, `summer`, `autumn`, `winter`) specifying rich CSS background gradients, tab/badge chrome, map ambient parameters, and audio sources.
  - `audioManager.ts`: Coordinates HTML5 audio playback with `packages/app/src/music.ts`. Attempts to stream `/audio/<id>.ogg` (preserves owner's `halloween.ogg`), suppresses synth melody when recorded music plays, and falls back to procedural pentatonic synth on missing/error tracks. Battle audio triggers during active wars.
- **Sticky TesterBar**: `zIndex: 100` guarantees holiday overlay selector remains pinned and clickable above canvas and stages.
- **Item Chips**: `packages/app/src/ItemChip.tsx` maps `ITEMS` from `loot.ts` into styled rarity badges (`common`, `uncommon`, `rare`, `epic`) with SVG iconography.


## HTTPS

Caddyfile `/etc/caddy/Caddyfile` → `129.153.17.72.sslip.io` → `127.0.0.1:8787`.
Never `pm2 delete sc-cloud` without restoring DISCORD_* and PUBLIC_APP_URL=https://129.153.17.72.sslip.io

Prefer `pm2 restart sc-cloud` for code deploys.

## Train discounts

`trainCostMultiplier(state, typeId)` — barracks global, then stables/range/workshop by unit family. Combat tests use militia (no specialist building).

## Astra ledger foundation (PR, not deployed)

See `SPEC-AUCTION-PVP.md`. New routes use existing Discord bearer identities.
`server/ledger.mjs` uses the already installed break_infinity.js dependency for
practice accounting; it imports no sim rules. Kingdom saves are not a trusted
inventory, so there is deliberately no deposit/withdraw bridge.

Persistence is one bounded versioned JSON ledger, written with temp-file fsync
and rename. Use one server process, not PM2 cluster mode. Back up
`DATA_DIR/ledger.json`; deleting it resets practice accounts and receipts. On
capacity errors retain the file and migrate to transactional storage rather than
pruning receipts. No production data is initialized by the PR.

Verification: `npm test`, `npm run build -w @second-crown/app`, and
`node --test server/ledger.test.mjs server/ledger-http.test.mjs`. The last command
uses temporary directories and local HTTP only; it does not call Discord or the
live host. Existing package.json/package-lock working changes are outside this PR.
