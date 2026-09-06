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
  - **Citizen Job Presentation Hook (`packages/render/src/index.ts`)**:
    - `roleForCitizenJob(job)` maps `farmer` to `villager`, `woodcutter` to `woodcutter`, `miner` to `miner`, `merchant` to `merchant`, `guard` to `guard`, and `scholar` to `scholar`.
    - `pickDestination(w, state)` queries `state.citizens` for player workers with assigned tiles (`realmId === "player" && tile != null`).
    - Walkers are assigned to workers via index modulo (`w.id % playerWorkers.length`), setting matching role and dispatching the walker to the target tile coordinates.
    - If the walker is already within proximity of their assigned tile (`dist <= 0.4`), a subtle work pacing offset (±0.35 tiles) keeps the walker active at their post without freezing.
    - If no citizens exist in state, falls back to default random wander around center tiles / existing buildings.
    - `packages/render/src/index.test.ts` provides comprehensive unit tests for role mapping, tile routing, worker modulo wrapping, and empty state fallback.
  - **Distinct Stone Keep Architecture (`drawIsometricBuilding`)**:
    - Replaces generic civic box fallback with a dedicated, towering stone hold (`h = 30 + heightBoost`).
    - Multi-tiered geometry: flared talus foundation plinth, dual-facet ashlar granite walls (`0x64748b` / `0x475569`) with horizontal mortar scoring, twin projecting corner bartizans with slate roofs, machicolation corbel ledge, parapet battlements with merlon crenellations, arched gateway with iron-grated portcullis and carved keystone, arrow loops, warm candlelit leaded royal high window, courtyard ashlar steps, standing iron brazier with animated fire tongues, and soaring royal flagpole with animated waving standard.
- **Halloween-Class Board Dressing & Weather Across All Holidays (`packages/render`)**:
  - Procedural Ground Scatter (`paintIsometricGround`): Deterministic spatial hash distribution (`(x * 13 + y * 29) % 17`) rendering distinct multi-object scatter per holiday/season (Midwinter snowdrifts, pine sprigs with red holly berries, ice crystals; Easter painted eggs, wildflowers, pale ribbons, clover; Harvest wheat sheaves with twine ties, pumpkins, apple bushels, fallen leaves; Midsummer sunflowers, flower crowns, chamomile, warm flagstones; subtle seasonal scatter for off-holidays).
  - Building Dressing & Dynamic Light Sources (`drawIsometricBuilding`): Rooftop decorations and animated light sources for all holidays (Midwinter thick snow blankets with hanging icicles, door wreaths with red bows, warm candlelit windows with flickering golden ground halos, doorstep brass lanterns; Easter climbing flower vines, fluttering pastel ribbons, morning dawn lamps with golden-lilac halos; Harvest golden wheat bundles, amber oil lamps with deep amber flicker and cast halos, cider barrels; Midsummer standing iron solstice brazier with leaping animated flame tongues and wide bonfire halos, sunset roofline highlights, and marigold garlands).
  - Light Fog / Weather on the Iso Map (`updateFog`): Fog layer across the board with tailored palettes and opacities (Midwinter icy blizzard drift, Easter pastel dawn mist, Harvest golden twilight haze, Midsummer warm sunset shimmer, and light ambient seasonal weather).
- **War Tab Living Pixel Unit Strip (`packages/app/src/WarLivingStrip.tsx`)**:
  - Strict two-sided layout: player forces on the left, foe forces on the right, central battle clash / border watch demarcation.
  - Directional SVG standard bearers (Player facing right, Foe facing left) with animated 3-frame waving pennants and marching strides. Foe unit icons face left via CSS `scaleX(-1)` on the icon frame only, preventing text mirroring or bounding box distortion.
  - Aggregates units by `typeId` using `break_infinity.js` (`D`), mapping only official unit names (`getUnitType(u.typeId)?.name`) and true counts. Eliminates all debug artifacts (no "Suki", no "Stone Frontier Marker", no "duplicate Cohort").
  - Dedicated vertical separation (icon frame + gap + padded label badge) guarantees zero label or portrait overlapping.
  - Responsive at 1280px wide with flex containment.
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
