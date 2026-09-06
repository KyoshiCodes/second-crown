# DEV-NOTES

Last updated: 2026-09-06

## Presentation Architecture (Gemini Tabletop Board Lane)

- **Tabletop Board & Hardwood Rim (`packages/render`)**:
  - Diorama is framed in a 16px beveled polished walnut rim with mitered 45° joints, antique brass corner plates with rivets, and inner recessed drop shadows cast onto the diorama.
  - Viewport Clipping Mask: Pixi `boardMask` clips all contents of `worldContainer` to `[16, 16, 528, 328]`, ensuring zoomed and panned elements stay cleanly bounded within the wooden frame.
  - Zoom & Pan Navigation (No Rotate):
    - Smooth mouse wheel zoom centered at cursor pointer (`MIN_ZOOM = 0.75`, `MAX_ZOOM = 2.2`).
    - Pointer drag panning with velocity bounds clamping to prevent the board from getting lost.
    - Drag vs Click distinction (< 6px movement) guarantees 100% accurate building placement and upgrade clicks without accidental placement during panning.
    - Coordinate inversion: `wx = (px - panX) / zoom`, `wy = (py - panY) / zoom` passed to `worldToGrid(wx, wy)`.
    - `zoomIn()`, `zoomOut()`, `resetView()` exported on `MapRenderer` and bound to React UI buttons.
- **Denser Pixel Architecture (`packages/render`)**:
  - Each building tile is rendered as a dense multi-structure vignette: outbuildings, stone wells, fenced vegetable patches, hayricks, pine groves, firewood cords, stepped quarry pits, derrick cranes, ore carts, silos, spinning waterwheels, multi-stall bazaars, training dummies, and wall bastions.
  - Isometric ground contact shadows anchor structures to the terrain.
  - Dynamic level scaling (`heightBoost = (lvl - 1) * 3`) with gold level pips on the front foundation.
- **2–3 Frame Walker Sprites (`packages/render`)**:
  - Discrete integer-pixel animation keyframes: Frame 0 (planted neutral / pass), Frame 1 (left step), Frame 2 (right step) cycling at ~5 steps/second.
  - 6 distinct citizen roles (Villager, Woodcutter, Miner, Merchant, Guard, Scholar) with animated carried tools, weapons, and accessories.
- **All Hallows Atmosphere (`packages/render` & `ThemeStage.tsx`)**:
  - Creeping low mist / fog bank layer in PixiJS rolling across cobblestones and buildings.
  - Carved Jack-o'-lanterns and lanterns on doorsteps with non-uniform organic witchfire/amber flicker math and soft radial ground light cast.
  - Spooky gothic folklore backdrop (crescent harvest moon, haunted hold silhouette, gnarled trees; zero Disney likenesses).
- **War Tab Living Pixel Unit Strip (`packages/app/src/WarLivingStrip.tsx`)**:
  - Tactile battlefield strip visualizer displaying player companies lined up on the left with animated 2-3 frame soldiers, animated royal standard bearer, opposing enemy vanguard on the right, and dynamic power share meter.
  - Pure presentation layer reading `state.units`, `state.wars`, and `realmPower(state)`. Zero simulation changes.
- **Recorded Audio Coordination (`packages/app/src/themes/audioManager.ts` & `main.tsx`)**:
  - Streams recorded audio loops (`/audio/halloween.ogg`, `/audio/easter.ogg`, `/audio/midwinter.ogg`) when present.
  - User interaction triggers `audioManager.start()` to satisfy browser autoplay requirements.
  - Suppresses procedural synth melody while recorded audio is playing; falls back smoothly to procedural synth on error or missing tracks.
  - Sticky ChromeDock (`zIndex: 120`) allows real-time holiday switching.


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
