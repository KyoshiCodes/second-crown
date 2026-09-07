# DEV-NOTES

Last updated: 2026-09-07

## Presentation Architecture: Pixel Army Tab Roster & Board Marching Columns (`bakeoff/gemini-army`)

- **Integer-Pixel Unit Icon Silhouettes (`packages/app/src/UnitIcon.tsx`)**:
  - Replaced the previous flat geometric chip portraits with detailed integer-pixel silhouettes in SVG matching the exact visual style of hold walkers and stone keeps.
  - Rendered with `shapeRendering: "crispEdges"` for razor-sharp pixel definition on all displays.
  - **Dynamic 2–3 Frame Cadence (`useUnitCadence`)**:
    - Cycles `0 -> 1 -> 0 -> 2` every 240ms when `animated` is enabled and no explicit `frame` is provided.
    - Explicit `frame?: 0 | 1 | 2` prop allows parent callers (like `WarLivingStrip` or unit formation rows) to control frame synchronization.
    - Directional `facing: 1 | -1` prop (defaults to 1 = facing right) flips weapon and stride direction without bounding-box distortion.
  - **8 Distinct Unit Classes**:
    - `militia`: Spear-less peasant levy, coarse homespun tunic (`#854d0e`), rope belt (`#a16207`), cloth coif (`#52525b`), unarmed/cudgel posture.
    - `spearman`: Steel kettle hat (`#94a3b8` / `#cbd5e1`), royal blue tabard (`#1e40af`), long ash spear with pointed steel spearhead (`#f1f5f9`), and round boss shield (`#1e3a8a` / `#facc15`).
    - `skirmisher`: Scout green coat (`#15803d`), leather coif (`#5c3818`), throwing javelins with steel barbs (`#cbd5e1`), and arm buckler.
    - `archer`: Deep forest coat (`#14532d`), feathered cap with quill (`#facc15`), recurve yew longbow (`#854d0e`), taut bowstring, nocked arrow, and back quiver.
    - `cavalry`: Warhorse mount (`#6b3a19`) with animated galloping legs, leather saddle, reins, and mounted armored lancer with royal blue tunic, steel helm, and pennant.
    - `knight`: Full steel plate harness (`#cbd5e1`), great helm with visor eye-slit (`#0f172a`), heraldic crimson heater shield (`#b91c1c`) with golden cross (`#facc15`), steel broadsword, and red mantle.
    - `siege`: Heavy timber carriage (`#5c3818`), spoked wooden wheels with iron rims, upright A-frame trestle, and throwing beam with counterweight bucket and granite boulder.
    - `champion`: Radiant gilded plate (`#f59e0b`), winged royal crown helm (`#fde047`), Tyrian purple tabard (`#581c87`), glowing runic broadsword (`#38bdf8`), and flowing crimson cape.

- **Board Column Meeple Reuse (`packages/render`)**:
  - **`primaryUnitTypeForMarch(march)`**: Pure sim-reading helper exported from `@second-crown/render`. Inspects `march.force` dictionary with tier priority resolution (`champion > siege > knight > cavalry > archer > skirmisher > spearman > militia`), falling back to `militia` when force is unspecified.
  - **`unitPalette(typeId)`**: Pure visual configuration helper exported from `@second-crown/render`. Maps unit type IDs to canonical tabard colors, armor/trim highlights, weapon styles, and mount/chassis flags matching hold walkers.
  - **Player Marching Meeples (`paintBoardMarches`)**:
    - Replaced the generic blue wooden pawn for player marches with unit-specific animated meeples that share the exact equipment, silhouette, and colors of the Army tab.
    - Stride animation cycles `0 -> 1 -> 0 -> 2` via `stepIdx = Math.floor((phase * 6) % 4)`, with directional facing (`dx >= 0 ? 1 : -1`) and vertical bob.
    - Hardwood pedestal base (`0x854d0e`), base contact shadow (`0x000000`, alpha 0.45), animated trail, and floating ETA pill badge with progress dots are strictly preserved.
    - Hostile marches strictly preserve their menacing red/iron war meeple with horned helm and glowing crimson visor.
  - **Unit Tests (`packages/render/src/index.test.ts`)**:
    - Added test suite for `primaryUnitTypeForMarch` covering default militia fallback, single-type forces, and multi-type tie-breaking by count and tier priority.
    - Added test suite for `unitPalette` verifying distinct tabard, weapon, and equipment attributes across all 8 unit types.

- **Invariants & Preservations**:
  - Pure presentation lane: `git diff main -- packages/sim server` is 100% empty.
  - Automated tests passing: 90/90 in `@second-crown/sim`, 18/18 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).
  - ChromeDock, holidays, dim lanterns, inspect card, primer, and zoom/pan fully preserved.

## Rim Fort Listing (Claude Walls Lane, `packages/sim`)

- `packages/sim/src/systems/rimForts.ts` adds `listRimForts(state, realmId = "player")`, a pure reader with no new sim state and no changes to `packages/sim/src/core`.
- Filters `state.buildings` to `realmId` matches with `completesAtTick === null` (finished) whose `typeId` is `"walls"` or `"gate"` and which sit on the rim (`x===0 || y===0 || x===GRID_W-1 || y===GRID_H-1`, `GRID_W=16`, `GRID_H=10` — the same constants `systems/gate.ts` and `systems/march.ts` already use), mapping `"walls"` → `kind: "wall"` and `"gate"` → `kind: "gate"`.
- Sort order is a clockwise walk of the rim starting at `(0,0)`: top edge left→right (`y===0`, index `x`), right edge top→bottom (`x===15`, index `16 + (y-1)`), bottom edge right→left (`y===9`, index `25 + (14-x)`), left edge bottom→top (`x===0`, index `40 + (8-y)`). Each rim tile gets exactly one index (0–47) so ties don't occur, and a renderer can draw the ring by connecting `listRimForts` output in order.
- Exported from `packages/sim/src/index.ts` as `listRimForts` plus the `RimFort` type.
- Tests in `packages/sim/src/systems/rimForts.test.ts` cover an empty rim, a mix of walls and a gate sorted clockwise across all four edges, and exclusion of an interior wall, an unfinished (in-progress) wall, and a rival-realm wall.
- `git diff main -- packages/app packages/render server` stays empty; this PR only adds a sim reader and exports it.

## Presentation Architecture (Gemini Connected Rim Wall Run & Stronger Terrain Chips Lane)

- **Connected Rim Wall Run on the Hold (`packages/render`)**:
  - `listRimFortsPresentation(state, realmId = "player")` queries finished rim fort structures (`listRimForts` if exported from `@second-crown/sim`, otherwise reading `state.buildings` using the matching 16×10 rim rule: `gx === 0 || gy === 0 || gx === 15 || gy === 9` ordered clockwise).
  - `rimWalkIndex(x, y)` provides a deterministic clockwise 0..47 perimeter index starting at `(0,0)`. `getRimTileAt(idx)` provides the exact inverse mapping.
  - `paintBuildings` evaluates `rimNeighbors = { hasPrev, hasNext, prevKind, nextKind }` for all rim forts by querying `rimFortMap` for neighbor indices `(idx - 1 + 48) % 48` and `(idx + 1) % 48`.
  - `drawRimWallCurtain(g, h, a, phase, gx, gy, rimNeighbors)`:
    - Renders an unbroken ashlar stone curtain wall connecting adjacent rim forts (walls and gates).
    - Foundation plinths (`0x334155`), ashlar stone curtain faces (sunlit `0x64748b` on South-West edges, shaded `0x475569` on South-East edges).
    - Horizontal mortar scoring lines at `0.35 * h` and `0.70 * h` (`0x1e293b`).
    - Top wall-walk stone platform (`0x52525b`) with central timber planking line (`0x78350f`).
    - Parapet merlons rising 3.5px above `-h` with stone coping highlights (`0xf1f5f9`).
    - Central projecting bastion tower on each wall tile with arrow loop slit (`0x0f172a`) and animated wall torch sconce (`Math.sin(phase * 4)`).
    - Corner bastion towers anchoring the four perimeter corners `(0,0)`, `(15,0)`, `(15,9)`, `(0,9)`.
  - `drawGatehouseCurtainWings(g, h, a, gx, gy, rimNeighbors)`:
    - On rim gatehouses, flanking bastion towers connect seamlessly to neighbor boundaries, sitting flush in the gap while preserving oak double doors, iron strap hinges, lowered portcullis teeth, and defensive faction pennants.
  - **Interior Walls (`!isRimTile`)**:
    - Interior walls strictly preserve the original isometric block visual and battlements.
    - Tile clicks (`worldToGrid`) remain 100% intact for all tiles.
- **Stronger 8×6 Terrain Chips on the Board Band (`packages/render`)**:
  - All 6 tabletop province terrain chips redesigned in `paintBoardProvinces` to read instantly at 0.58 zoom (Peak, Shore, Wood, Waste, Hill, Plain).
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` is 100% empty.
  - Full automated tests passing: 87/87 in `@second-crown/sim`, 14/14 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).
  - Fog chips, hostile red meeple, cottage art, zoom/pan, ChromeDock, and dim lanterns completely preserved.

## War Tab Briefing (Claude War Lane, `packages/app`)

- `WarRoom.tsx` opens with a single `sc-realm-card` titled "Briefing" instead of the old "Hold defense" blurb, built entirely from existing/newly-exported pure sim readers — no new sim state, no combat/march/fog changes:
  - **Incoming**: `incomingOnHome(state)` lists every hostile `March` bound for `state.board.homeProvinceId`. Each row shows the realm name — gated behind `watchtowerWarning(state)` truthiness exactly as before (a Watchtower must be built; the reveal check is not per-march, matching the pre-existing single-target behavior) — else "Unknown host", plus `Math.max(0, Math.ceil((m.arrivesTick - tick) / 10))`s ETA. `wallHp(state)` and the new `gateOnRim(state)` (up/down) are shown once beneath the list since they describe home defense, not any individual column.
  - **Wounded**: `woundedCount(state)` / `infirmaryBeds(state)` with a "Treat (4 food)" button wired to `tryTreatWounded`, disabled when `woundedCount <= 0`. The 4-food cost is hardcoded in the label the same way the existing Repair button hardcodes "8 stone" (`REPAIR_STONE`/`TREAT_FOOD` live in `systems/ward.ts` and aren't exported as constants).
  - **People**: `population(state)` / `housingCap(state)`.
- `packages/sim/src/index.ts` gained `export { gateOnRim, gateHp } from "./systems/gate.js";` — both functions already existed and were already used internally by `wallHp` (`systems/march.ts`); this only exposes them to `@second-crown/app`. No logic changed, so `git diff main -- packages/sim/src/core` stays empty and the full sim suite is unaffected.

## Presentation Architecture (Gemini Cottage, Gate, Fog Chips & Iron Meeple Lane)

- **Distinct Isometric Architecture: Cottage & Rim Gatehouse (`packages/render`)**:
  - `drawIsometricBuilding` receives tile coordinates `gx, gy` to support location-aware rendering.
<<<<<<< HEAD
  - **Cottage (`case "cottage"`)**:
    - Denser half-timbered plaster residence (`h = 16 + heightBoost`).
    - Warm plaster wall facets (`0xd8c8b0` / `0xb5a38c`) with exposed timber posts, plates, and diagonal bracing (`0x5c3818`).
    - Steep reed-thatched gabled roof (`0xc68a4c`) with overhanging eaves, ridge trim, and scalloped thatch cresting (`0x7c4e1a`).
    - Fieldstone chimney (`0x64748b`) puffing animated hearth smoke circles (`Math.sin(phase * 2.2) * 1.8`).
    - Arched plank door with brass knob (`0xfacc15`) and stone doorstep (`0x78716c`).
    - Leaded casement window with shutters glowing with warm honey candlelight (`0xfef08a`, `alpha = 0.95`).
    - Front yard details: stone-lined flowerbed with rose, lavender, and daisy blossoms, plus a stacked cord of split firewood.
  - **Gatehouse (`case "gate"`)**:
    - Fortified ashlar stone gatehouse (`h = 24 + heightBoost`) with twin flanking bastion towers (`0x64748b` / `0x475569`), parapet crenellations, arrow slits (`0x0f172a`), and vaulted gateway portal.
    - **Rim Tile Detection (`isRimTile`)**: Evaluates `gx === 0 || gy === 0 || gx === GRID_W - 1 || gy === GRID_H - 1`.
    - **On Rim Tiles (`isRim`)**: Renders heavy reinforced oak double-doors (`0x5c3818` / `0x45220a`) with blackened iron strap hinges, iron rivets, central drop-bar lock, lowered portcullis iron teeth, and a defensive crimson faction pennant waving atop the central curtain wall.
    - **On Interior Tiles (`!isRim`)**: Presents an open vaulted archway passage leading into the hold courtyard.
- **Board-Band Tokens: Unseen Province Fog Chips (`packages/render`)**:
  - `paintBoardProvinces` queries `isProvinceSeen(state, p.id)` directly from `@second-crown/sim`, preserving the single source of truth for fog without inventing a second fog system.
  - Unseen provinces render as tactile 3D blank parchment / fog chips:
    - Standard drop shadow maintains board tabletop physicality.
    - Dark parchment bevel (`0x1f1a14`) and blank aged vellum face (`0x2e2720`).
    - Outer blank parchment border (`0x4d3f31`) with subtle top highlight.
    - Subtle animated procedural fog mist curves drifting across the chip (`phase * 1.5`) and faint cartographer compass center point.
    - All terrain chip visuals (trees, grass, hills, waves, peaks), node marks (camps, holds, quarries), and rival occupant heraldry are completely suppressed until revealed.
  - `paintBoardHighlight`: Unscouted provinces mask confidential occupant identities and show a neutral gray status pip and badge.
- **Hostile Red/Iron March Meeple (`packages/render`)**:
  - `paintBoardMarches` distinguishes player vs hostile marches via `isPlayer = m.realmId === "player"`.
  - Hostile marches (`realmId !== "player"`) use an imposing red/iron war meeple pawn:
    - Heavy blackened iron pedestal (`0x18181b`) with steel rivets (`0xd1d5db`).
    - Angular dark steel torso (`0x27272a`) with spiked iron pauldrons (`0x3f3f46`).
    - Blood-red war tabard (`0x991b1b`) with crossed black iron harness straps.
    - Horned dark iron helm (`0x18181b`) with horn crests and glowing crimson visor eye-slit (`0xef4444`).
    - Blackened polearm with jagged halberd blade (`0x52525b`) and ragged crimson/black battle pennant (`0x7f1d1d`).
    - Dotted crimson route trail (`0xef4444`) and blackened iron / crimson ETA pill badge (`0xdc2626`).
  - Player marches retain the classic wooden pedestal, golden torso, royal blue tunic, polished steel helm with crimson plume, and amber route trail.
=======
  - **Cottage (`case "cottage"`)**: Cozy half-timbered plaster residence with steep gabled reed thatch, stone chimney puffing animated hearth smoke, warm leaded window, plank door, and front flowerbed with firewood.
  - **Gatehouse (`case "gate"`)**: Fortified ashlar stone gatehouse with twin bastion towers, crenellations, arrow slits, and arched gateway portal. On rim tiles, features heavy oak double-doors, iron strap hinges, drop-bar lock, lowered portcullis, and defensive pennant. On interior tiles, presents open vaulted courtyard passage.
- **Board-Band Tokens: Unseen Province Fog Chips (`packages/render`)**: Unseen provinces render as tactile 3D blank parchment / fog chips with dark vellum bevels, blank parchment face, and subtle animated fog mist curves.
- **Hostile Red/Iron March Meeple (`packages/render`)**: Hostile marches use an imposing red/iron war meeple pawn with blackened iron pedestal, horned helm with glowing crimson eye-slit, blood-red tabard, and jagged halberd.
>>>>>>> origin/bakeoff/gemini-map

## Presentation Architecture (Gemini Tabletop Board Lane)

- **Two-Band Camera Architecture (`packages/render`)**:
  - Unified single Pixi canvas (560×360) partitioned into two distinct zoom bands via threshold `ZOOM_THRESHOLD = 0.70`:
    - **Hold Band (`zoom > 0.70`, range 0.70–2.2, default 1.0)**:
      - Renders 16×10 isometric turf with living workers, detailed pixel vignettes, animated chimneys, holiday dressings, mists, and particles.
      - Pointer clicks hit-test the 16×10 tile grid via `worldToGrid(wx, wy)` and trigger `onTileClick(x, y)` to build or upgrade structures.
    - **Board Band (`zoom <= 0.70`, range 0.45–0.70, default 0.58)**:
      - Hides Hold detail (`holdContainer.visible = false`) and reveals `boardContainer`.
      - Scales `boardContainer` by `boardScale = zoom / BOARD_DEFAULT_ZOOM` centered inside the 528×328 diorama window.
      - Pointer clicks hit-test 8×6 tabletop province chips via `hitTestProvince(bx, by)`.
      - Clicking home province (`state.board.homeProvinceId`) snaps back to Hold band via `setBand("hold")`.
      - Clicking foreign province dispatches `tryMarch(state, provinceId)` via `act` helper and toasts the result in the status banner.
  - Band Transition & Sync:
    - Wheel zooming across `0.70` smoothly toggles layer visibility and dispatches `onBandChange(band)` as well as a DOM `sc-camera-band-change` event.
    - `[Board / Hold]` toggle button in `ChromeDock` and on the canvas controls allows instant band switching for testers without mouse wheels.
- **8×6 Tabletop Board & Province Tokens (`packages/render`)**:
  - 8 columns × 6 rows grid laid out at `ORIGIN_BOARD_X = 35`, `ORIGIN_BOARD_Y = 27`, with chip size `CHIP_W = 56`, `CHIP_H = 46`, and spacing `GAP_X = 6`, `GAP_Y = 6`.
  - 3D tactile tokens with contact drop shadow, bottom bevel facet, top highlight, and rich terrain chip palettes:
    - `plain`: `0x2d5a27` with blade marks and chamomile flower dots.
    - `wood`: `0x163c1b` with 3 miniature stylized pine trees.
    - `hill`: `0x44403c` with layered contour ridges.
    - `waste`: `0x291d18` with glowing amber and red fissure lines.
    - `shore`: `0x0369a1` with coastal beach fringe and curled surf crests.
    - `peak`: `0x334155` with twin granite peaks and snowcaps.
  - Node marks:
    - `hold`: stone fortress keep with crenellations and flag.
    - `camp`: striped war pavilion with crossed spears.
    - `woodcut`: stacked timber cord with crossed axes.
    - `quarry`: ashlar block with pickaxe.
    - `field`: bound wheat sheaf with crimson ribbon.
  - Special realm tokens:
    - Player Hold (`x=2, y=2`): Gilded brass border, 4 corner studs, golden crown emblem, and animated halo pulse.
    - Iron March / Rival (`x=5, y=2`): Spiked blackened iron border, iron rivets, spiked battlements, blood-red banner, and dark steel banner.
- **Active March Pawn Presentation (`packages/render`)**:
  - `paintBoardMarches` reads `listMarches(state)` / `activePlayerMarch(state)`.
  - Computes manhattan step distance `dist = |to.x - from.x| + |to.y - from.y|` and total duration `dist * 15` ticks.
  - Progress lerp: `calculateMarchProgress(tick, arrivesTick, dist)` lerps between origin province center and destination province center.
  - Dotted animated amber trail connects home hold to destination with destination crosshair target.
  - Animated tabletop meeple pawn carries faction tabard, steel helm, crimson plume, waving royal standard with stride bob cadence (`Math.sin(phase * 6)`), and live ETA badge.
- **Tabletop Board & Hardwood Rim (`packages/render`)**:
  - Diorama is framed in a 16px beveled polished walnut rim with mitered 45° joints, antique brass corner plates with rivets, and inner recessed drop shadows cast onto the diorama.
  - Viewport Clipping Mask: Pixi `boardMask` clips all contents of `worldContainer` to `[16, 16, 528, 328]`, ensuring zoomed and panned elements stay cleanly bounded within the wooden frame.
  - Zoom & Pan Navigation (No Rotate):
    - Smooth mouse wheel zoom centered at cursor pointer (`MIN_CAMERA_ZOOM = 0.45`, `MAX_CAMERA_ZOOM = 2.2`).
    - Pointer drag panning with velocity bounds clamping to prevent the board from getting lost.
    - Drag vs Click distinction (< 6px movement) guarantees 100% accurate building placement, upgrade clicks, and province clicks without accidental placement during panning.
    - Coordinate inversion: `wx = (px - panX) / zoom`, `wy = (py - panY) / zoom` passed to `worldToGrid(wx, wy)`.
    - `zoomIn()`, `zoomOut()`, `resetView()`, `getBand()`, `setBand()` exported on `MapRenderer` and bound to React UI buttons.
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
