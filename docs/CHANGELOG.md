# CHANGELOG

Newest first.

## 2026-09-07 — Claude Rim Fort Listing (`bakeoff/claude-walls`)

- **Sim helper (`packages/sim/src/systems/rimForts.ts`)**: new `listRimForts(state, realmId = "player")` returns `{ x, y, kind: "wall" | "gate" }[]` for finished `walls`/`gate` buildings on the 16×10 hold rim (`x===0 || y===0 || x===15 || y===9`), ordered clockwise from `(0,0)` so a renderer can stroke a connected ring.
- **Sim exports (`packages/sim/src/index.ts`)**: `listRimForts` and the `RimFort` type are now exported from `@second-crown/sim`.
- **Tests (`packages/sim/src/systems/rimForts.test.ts`)**: empty rim, mixed walls+gate sorted clockwise, and interior walls / unfinished buildings / other realms excluded.
- **Sim & App Purity**: `git diff main -- packages/app packages/render server` empty. No combat, march, fog, housing, or tickEngine changes. Full `@second-crown/sim` test suite (90 tests) and `npm run build -w @second-crown/app` pass.

## 2026-09-07 — Claude War Tab Briefing (`bakeoff/claude-war2`)

- **War Tab Briefing (`packages/app/src/WarRoom.tsx`)**:
  - Replaced the old single-line "Hold defense" blurb with a "Briefing" card that reads in one glance:
    - **Incoming**: a row per hostile march headed for your hold, with realm name (revealed only once a Watchtower is built — otherwise "Unknown host") and ETA in seconds, plus current Wall HP and Gate status (up/down).
    - **Wounded**: wounded count vs. infirmary beds with a "Treat (4 food)" action.
    - **People**: population vs. housing cap.
- **Sim exports (`packages/sim/src/index.ts`)**: `gateOnRim` and `gateHp` are now exported from `@second-crown/sim` (pure re-exports of existing `systems/gate.ts` functions already used internally by `wallHp`). No behavior change.
- **Sim & Core Purity**: `git diff main -- packages/sim/src/core` empty. No combat math, march formulas, fog rules, tickEngine, Discord, or Caddy changes. Full `@second-crown/sim` test suite (87 tests) and `npm run build -w @second-crown/app` pass.

## 2026-09-07 — Gemini Isometric Cottage & Gate, Board Fog Chips & Hostile Iron Meeple (`bakeoff/gemini-board2`)

- **Distinct Isometric Cottage & Gatehouse (`packages/render`)**:
  - **Cottage (`case "cottage"`)**: Cozy half-timbered plaster residence with steep reed-thatched gable roof, ridge cresting, fieldstone chimney with gentle curled hearth smoke puffs, warm leaded-glass window with shutters and glowing candlelit interior, plank door with brass knob and stone threshold, front stone-lined flowerbed with blossoms, and stacked cord of split firewood.
  - **Gatehouse (`case "gate"`)**: Massive fortified ashlar granite gatehouse with twin bastion towers, crenellated parapets, arrow loops, and central vaulted portal arch.
    - **Rim Tile Detection (`isRimTile`)**: On rim edge tiles (`gx === 0 || gy === 0 || gx === 15 || gy === 9`), renders heavy iron-reinforced oak double-doors with blackened iron strap hinges, iron rivets, central drop-bar lock, lowered portcullis iron teeth, and a defensive crimson faction pennant atop the central curtain wall.
    - On interior tiles, presents an open vaulted courtyard archway.
- **Board-Band Tokens: Unseen Province Fog Chips (`packages/render`)**:
  - Queries existing sim state helper `isProvinceSeen(state, p.id)` without inventing a secondary fog mechanism.
  - Unseen provinces render as tactile 3D blank parchment / fog chips with drop shadow, dark vellum bevel, blank parchment face, subtle animated fog mist curves, and faint cartographer compass marks.
  - Completely hides terrain graphics, node icons, and rival heraldry until scouted or within vision range.
  - Highlight plaque masks confidential occupant identity for unscouted provinces.
- **Hostile Red/Iron March Meeple (`packages/render`)**:
  - Hostile marches (`listMarches` where `realmId !== "player"`) use an imposing red/iron meeple pawn:
    - Heavy blackened iron pedestal base with steel rivets.
    - Angular dark steel torso with spiked iron pauldrons.
    - Blood-red war tabard with crossed black iron harness straps.
    - Jagged dark iron sallet helm with horn crests and glowing crimson visor eye-slit.
    - Blackened polearm with jagged halberd axe head and ragged crimson/black battle pennant.
    - Dotted crimson route trail and blackened iron / crimson ETA pill badge.
  - Player marches retain the polished wood pedestal, royal blue tunic, bright steel helm, golden standard, and amber route trail.
- **Sim & Server Purity**:
  - `git diff main -- packages/sim server` 100% empty.
  - All automated tests passing: 87/87 in `@second-crown/sim`, 12/12 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).
  - Zoom/pan, tile clicks, ChromeDock, recorded audio, and dim holiday lanterns fully preserved.

## 2026-09-07 — Gemini Two-Band Camera & Tabletop Board Diorama (`bakeoff/gemini-board-cam`)

- **Two-Band Camera Architecture (`packages/render`)**:
  - Unified camera viewport on the single existing Pixi canvas with two distinct zoom bands separated by threshold `ZOOM_THRESHOLD = 0.70`:
    - **Hold Band (`zoom > 0.70`)**: 16×10 isometric turf with building placement/upgrade tile clicks, living walkers, animated keeps, holiday dressing, mist, and polished hardwood table rim.
    - **Board Band (`zoom <= 0.70`)**: Hides Hold turf detail and presents `state.board.provinces` as tactile tabletop chips on an 8×6 grid.
  - Smooth mouse wheel zooming across the threshold transitions seamlessly between close diorama view and regional tabletop view.
  - Dedicated `[Board / Hold]` toggle button next to ChromeDock and on canvas control overlay allows instant switching without mouse wheel scrolling.
- **Tabletop 8×6 Province Tokens (`packages/render`)**:
  - 8 columns × 6 rows grid framed in dark oiled walnut tabletop diorama with brass corner brackets and compass rose.
  - 6 distinct terrain chips:
    - `plain`: verdant meadow green with grass blade marks and chamomile flower dots.
    - `wood`: deep spruce forest with miniature cluster of three stylized pine trees.
    - `hill`: highland stone brown with layered rolling contour hill ridges.
    - `waste`: scorched volcanic ash with glowing amber and crimson fissure lines.
    - `shore`: coastal azure waves with sandy beach margin and surf crests.
    - `peak`: alpine granite crags with snowcapped summits.
  - Distinct node marks:
    - `hold`: carved stone keep silhouette with battlements, portcullis, and flag.
    - `camp`: striped war pavilion tent with crossed spears.
    - `woodcut`: stacked timber cord with crossed felling axes.
    - `quarry`: ashlar granite block with leaning steel pickaxe.
    - `field`: bundled golden grain sheaf bound with crimson twine.
  - Special realm occupant tokens:
    - Player Hold (`x=2, y=2`): Gilded royal brass border, 4 corner studs, royal crown emblem, crimson plaque, and golden pulse halo.
    - Iron March / Rival (`x=5, y=2`): Spiked blackened iron border, iron rivets, spiked battlements, blood-red pennant, and dark steel plaque.
- **Interactive Marching & Active March Pawn (`packages/render`, `packages/app`)**:
  - Clicking home province token snaps camera back to Hold band.
  - Clicking foreign province token calls `tryMarch(state, provinceId)` via existing `act` helper and toasts the outcome in the status banner.
  - Active march from `listMarches` / `activePlayerMarch` displays a lerped tabletop marching meeple pawn between origin and destination with animated marching bob, tabard, steel helmet, spear with pennant, dotted amber trail, and remaining ETA badge.
- **Sim & Server Purity**:
  - `git diff main -- packages/sim server` 100% empty.
  - Full automated tests passing: 68/68 in `@second-crown/sim`, 10/10 in `@second-crown/render`.

## 2026-09-06 — Gemini Citizen Job Walkers & Distinct Stone Keep (`bakeoff/gemini-jobs`)

- **Citizen Job Presentation Hook (`packages/render`)**:
  - `pickDestination` and walker presentation now read `state.citizens`.
  - Walkers assigned to player workers with an assigned tile walk directly to their workstation tile and adopt matching role visuals:
    - `farmer` → `villager` (wicker bread basket, rustic tunic)
    - `woodcutter` → `woodcutter` (felling axe, woodsman green)
    - `miner` → `miner` (quarry pickaxe, ashlar stone gray)
    - `merchant` → `merchant` (crimson mercantile robe)
    - `guard` → `guard` (steel helmet, spear with red pennant, royal blue tabard)
    - `scholar` → `scholar` (monk cowl, parchment scroll, purple habit)
  - Falls back cleanly to default center random wander when no citizens or worker tiles exist.
  - Active work pacing prevents walkers from freezing once they reach their assigned hold.
  - Full unit test coverage in `packages/render/src/index.test.ts` (5 tests passing).
- **Distinct Stone Keep (`packages/render`)**:
  - Replaced generic civic box fallback with a dedicated, towering ashlar granite keep (`h = 30 + heightBoost`).
  - Architecture: Flared talus plinth foundation, twin corner bartizans (watch turrets) with slate caps, machicolations, parapet battlements with merlon crenellations, double-height arched portal with iron portcullis grille and carved keystone, defensive arrow slits, warm candlelit leaded high royal window, courtyard ashlar steps, standing iron brazier with animated flame tongues, and a towering royal flagpole flying an animated waving crimson and gold standard.
- **Combat & Sim Integrity**:
  - Zero changes to combat math or `tickEngine`.
  - Full automated test suite passing in `@second-crown/sim` (60 tests).

## 2026-09-06 — Gemini Seasons & War Strip Overhaul (`bakeoff/gemini-seasons`)

- **Halloween-Class Board Dressing for Every Holiday & Season**:
  - **Midwinter**: Snowdrifts, pine boughs with holly berries, ice crystals; thick contoured snow roofs with hanging icicles, pine wreaths with red ribbons, warm candlelit windows with golden halos, doorstep brass lanterns; drifting frosty blizzard vapor.
  - **Easter**: Spring wildflowers & crocuses, hand-painted patterned easter eggs, fluttering pale ribbons; climbing floral vines & blooming boughs, dawn lanterns with golden-lilac morning halos; soft rolling dawn dew mist.
  - **Harvest**: Golden wheat sheaves bound with twine, field pumpkins, apple bushels, fallen leaves; amber oil lamps with deep amber flicker and cast halos, cider casks, golden wheat bundles; warm golden autumn twilight haze.
  - **Midsummer**: Golden sunflowers, solstice flower crowns on the grass, chamomile; standing iron bonfire brazier with animated dancing flames & expansive firelight halo, long light sunset highlights & marigold garlands; radiant golden heat shimmer mist.
  - **Four Seasons (when holiday is none)**: Lighter versions of ground scatter, window lighting, and ambient seasonal weather mist.
  - **Halloween**: Kept as-is (witchfire jack-o'-lanterns, pumpkins, deep purple mist banks).
- **WarLivingStrip Overhaul**:
  - Completely resolved label/portrait overlap issues by giving unit portraits and name/count badges dedicated vertical hierarchy.
  - Displays real unit type names (Militia, Spearman, Archer, Champion, etc.) and real counts only, with counts cleanly aggregated by unit type.
  - Eliminated all leftover debug labels (no "Suki", no "Stone Frontier Marker", no "duplicate Cohort").
  - Two distinct sides: player host on the left with Royal Standard Bearer; enemy vanguard on the right facing left with Host Standard Bearer; central active battle clash or peaceful border watch demarcation.
  - Crisp, spacious, and fully readable at 1280px wide.
- **Sim & Server Purity**: `git diff main -- packages/sim server` verified 100% empty.

## 2026-09-06 — Gemini Tabletop Board Presentation (`bakeoff/gemini-board`)

- **Tabletop Board & Hardwood Rim**: Recessed isometric board framed in beveled polished dark walnut with antique brass corner brackets, steel rivets, and inner drop shadow.
- **Zoom & Pan Controls (No Rotate)**: Free-form camera navigation with smooth mouse wheel zooming, pointer click-and-drag panning with velocity bounds, and on-screen `[+]`, `[-]`, `[⟲]` buttons. Strict separation between drag and click preserves 100% building click accuracy.
- **Denser Pixel Architecture**: Multi-structure vignettes across all building types (wells, crop patches, woodpile cords, stone terraces, cranes, ore carts, silos, spinning waterwheels, multi-stall bazaars, training dummies).
- **2–3 Frame Walker Sprites**: Discrete 2-3 frame walking and idle cadence (pass, left step, right step) across 6 citizen roles with integer pixel tool/weapon animations.
- **All Hallows Atmosphere**: Creeping low mist and fog banks rolling over cobblestones, jack-o'-lanterns with organic flickering witchfire glow, and gothic folklore backdrop (no Disney likenesses).
- **War Tab Living Pixel Unit Strip**: Real-time tactical army line visualizer displaying player companies, animated waving royal standard bearer, enemy cohorts, and power balance meter. Presentation-only with zero combat simulation changes.
- **Recorded Audio Playback**: Recorded audio loops (`/audio/halloween.ogg`, `/audio/easter.ogg`, `/audio/midwinter.ogg`) play on user interaction with smooth procedural synth fallback.
- **Preserved Sim/Server Purity & ChromeDock**: Zero diff on `packages/sim` and `server`. Sticky ChromeDock tools and holiday switcher intact.

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
