# CHANGELOG

Newest first.

## 2026-09-07 — Gemini Academy & Siege Workshop Art, Scriptorium Lectern & Board Outpost Flags (`bakeoff/gemini-academy`)

- **Distinct Isometric Academy & Polished Siege Workshop (`packages/render`)**:
  - `drawIsometricBuilding`: Dedicated architectural rendering for `case "academy":` featuring flared sandstone ashlar foundation plinth, limestone facade with buttress pilasters, arched cloister colonnade with marble pillars, Gothic library windows glowing with warm honey candlelight and diamond lattice mullions, steep royal sapphire slate roof with gilded coping, elevated observatory cupola with aged verdigris copper dome, fluttering blue/gold scholar gonfalon, rotating brass armillary astrolabe with celestial rings, and forecourt stone reading lectern with open illuminated vellum folio and brass celestial globe.
  - `drawIsometricBuilding`: Polished `case "siege_workshop":` from a generic flat polygon box into an authentic heavy siege ordnance yard with timber framing, master engineer's blueprint drafting desk, timber A-frame gantry crane derrick, assembled heavy trebuchet with four spoked wheels and counterweight box, chained pyramid of granite siege boulders, and smoldering ordnance forge hearth with iron anvil.
- **Scriptorium Lectern / Study Card (`packages/app`)**:
  - `ResearchBar.tsx` & `theme.css`: Overhauled research bar from two raw `<button>`s into an illuminated medieval Scriptorium Lectern study card.
  - Dynamic cost binding: Directly reads `@second-crown/sim`'s exported `RESEARCH[id].cost` and `RESEARCH[id].needs`, displaying resource chips with real-time affordability indicators.
  - Displays unit unlock tags featuring miniature integer-pixel walker silhouettes (`UnitIcon`).
  - Clear state rendering for Mastered (golden seal), in-progress study (active progress bar with remaining countdown), and available study actions with disabled reason hints.
- **Board Outpost Flags & Gather Expedition Stubbing (`packages/render`)**:
  - `paintBoardProvinces`: Distinguishes player home hold from player-occupied field tiles / outposts. Outposts display a dedicated Outpost / Flag Token with royal blue & gold border trim, 4 brass corner pins, stone cairn anchor, tall wooden flagpole with waving royal standard, field bivouac tent, and "OUTPOST" plaque.
  - `paintBoardGathers` & `listGathersPresentation`: Safely stubs gather expedition queries and renders foraging routes and pack carts when present, cleanly skipping when Astra's lane is unmerged.
  - Exported pure helpers `isOutpostProvince` and `listGathersPresentation`.
- **Automated Tests & Purity**:
  - Added unit test suites in `packages/render/src/index.test.ts` for `isOutpostProvince` and `listGathersPresentation`.
  - All 20/20 render tests and 93/93 sim tests pass.
  - Production build clean (`npm run build -w @second-crown/app`).
  - `git diff main -- packages/sim server` 100% empty. All existing features preserved.

## 2026-09-07 — Gemini Pixel Army Tab & Board Marching Columns (`bakeoff/gemini-army`)

- **Pixel Walker Style for Army Tab Roster & Visuals (`packages/app`)**:
  - `UnitIcon.tsx`: Replaced flat chip portraits with integer-pixel SVG silhouettes in the authentic aesthetic of hold walkers and buildings (`shapeRendering: "crispEdges"`).
  - Supports 2–3 frame animated marching/idle cadence (`frame = 0 | 1 | 2` cycling 0 → 1 → 0 → 2), directional facing (`facing = 1 | -1`), and faction tabard colors matching hold walkers.
  - Weapons and gear match type:
    - **Militia**: Spear-less peasant levy, coarse homespun tunic (`#854d0e`), rope belt (`#a16207`), cloth coif (`#52525b`), unarmed/cudgel posture.
    - **Spearman**: Steel kettle hat (`#94a3b8` / `#cbd5e1`), royal blue tabard (`#1e40af`), long ash spear with pointed steel spearhead (`#f1f5f9`), and round boss shield (`#1e3a8a` / `#facc15`).
    - **Skirmisher**: Scout green coat (`#15803d`), leather coif (`#5c3818`), throwing javelins with steel barbs (`#cbd5e1`), and arm buckler.
    - **Archer**: Deep forest coat (`#14532d`), feathered cap with quill (`#facc15`), recurve yew longbow (`#854d0e`), taut bowstring, nocked arrow, and back quiver.
    - **Cavalry**: Warhorse mount (`#6b3a19`) with animated galloping hooves, leather saddle, reins, and mounted armored lancer with royal blue tunic, steel helm, and pennant.
    - **Knight**: Full steel plate harness (`#cbd5e1`), great helm with visor eye-slit (`#0f172a`), heraldic crimson heater shield (`#b91c1c`) with golden cross (`#facc15`), steel broadsword, and red mantle.
    - **Siege Engine**: Sturdy timber carriage (`#5c3818`), spoked wooden wheels with iron rims, upright A-frame trestle, and throwing beam with counterweight bucket and granite boulder.
    - **Champion**: Radiant gilded plate (`#f59e0b`), winged royal crown helm (`#fde047`), Tyrian purple tabard (`#581c87`), glowing runic broadsword (`#38bdf8`), and flowing crimson cape.
  - `ArmyTab.tsx`: Transformed unit training section into rich roster cards with animated pixel silhouettes, power ratings, training costs, and flavor blurbs. Dedicated Champion recruitment card with gilded champion silhouette, custom naming input, and recruitment actions.
  - `ArmyVisual.tsx`: Raised companies in "Your Host" display the animated pixel silhouettes alongside company counts, total combat power, and lively multi-unit squad formations marching in 2–3 frame cadence.
  - `ProvinceInspect.tsx`: March column composer displays mini unit pixel silhouettes next to each unit count.
- **Board Meeple Reuse for Marching Columns (`packages/render`)**:
  - `primaryUnitTypeForMarch(march)`: Pure sim-reading helper exported from `@second-crown/render` that resolves the primary unit type for any column based on `march.force` counts and tier priority (champion > siege > knight > cavalry > archer > skirmisher > spearman > militia).
  - `unitPalette(typeId)`: Pure palette/gear helper exported from `@second-crown/render` providing matching tabard, armor, weapon, and helm properties for all 8 unit types.
  - Tabletop board marching meeples (`paintBoardMarches`) now render player columns using the exact same sprites, colors, weapons, and 2–3 frame stride cadence as the Army tab. An archer column looks like an archer on the march; a knight column marches with great helm and heater shield; cavalry trots with a warhorse mount; siege engines roll on spoked wheels.
  - Hardwood pedestal, contact shadow, destination trail, and floating ETA pill badge are fully preserved.
  - Hostile marches strictly preserve their menacing red/iron war meeple with horned helm and glowing crimson visor.
- **Sim & Server Purity**:
  - `git diff main -- packages/sim server` 100% empty.
  - All automated tests passing: 90/90 in `@second-crown/sim`, 18/18 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).
  - ChromeDock, holidays, dim lanterns, inspect card, primer, and zoom/pan fully preserved.

## 2026-09-07 — Claude Rim Fort Listing (`bakeoff/claude-walls`)

- **Sim helper (`packages/sim/src/systems/rimForts.ts`)**: new `listRimForts(state, realmId = "player")` returns `{ x, y, kind: "wall" | "gate" }[]` for finished `walls`/`gate` buildings on the 16×10 hold rim (`x===0 || y===0 || x===15 || y===9`), ordered clockwise from `(0,0)` so a renderer can stroke a connected ring.
- **Sim exports (`packages/sim/src/index.ts`)**: `listRimForts` and the `RimFort` type are now exported from `@second-crown/sim`.
- **Tests (`packages/sim/src/systems/rimForts.test.ts`)**: empty rim, mixed walls+gate sorted clockwise, and interior walls / unfinished buildings / other realms excluded.
- **Sim & App Purity**: `git diff main -- packages/app packages/render server` empty. No combat, march, fog, housing, or tickEngine changes. Full `@second-crown/sim` test suite (90 tests) and `npm run build -w @second-crown/app` pass.

## 2026-09-07 — Gemini Connected Rim Wall Run & Stronger Terrain Chips (`bakeoff/gemini-map`)

- **Connected Rim Wall Run on the Hold (`packages/render`)**:
  - Automatically queries finished rim fort structures (`listRimForts` if exported from `@second-crown/sim`, otherwise reading `state.buildings` using the matching 16×10 rim rule: `gx === 0 || gy === 0 || gx === 15 || gy === 9` ordered clockwise).
  - Draws a continuous ashlar stone curtain wall connecting adjacent rim forts (walls and gates):
    - Dark foundation plinths and dual-tone ashlar granite curtain faces (sunlit on South-West edges, shaded on South-East edges).
    - Horizontal mortar scoring lines and wall-walk walkway with timber planking center line.
    - Regular crenellated stone merlons along the outer parapet with bright coping highlights.
    - Arrow loop slits in the curtain face and center bastion towers with animated flickering wall torches.
    - Sturdy corner bastion towers anchoring the four perimeter corners `(0,0)`, `(15,0)`, `(15,9)`, `(0,9)`.
  - Gatehouses sit flush in the gap: flanking bastion towers connect seamlessly to adjacent curtain spans while retaining heavy reinforced double oak doors, iron strap hinges, portcullis teeth, and defensive pennant.
  - Interior walls (`!isRimTile`) strictly preserve the original isometric block visual.
  - Tile clicks and building placement/upgrade contracts remain 100% intact.
- **Stronger 8×6 Terrain Chips on the Board Band (`packages/render`)**:
  - All 6 tabletop province terrain chips redesigned to read instantly at 0.58 zoom (Peak, Shore, Wood, Waste, Hill, Plain).
- **Sim & Server Purity**:
  - `git diff main -- packages/sim server` 100% empty.
  - Automated tests passing: 87/87 in `@second-crown/sim`, 14/14 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).
  - Fog chips, hostile red meeple, cottage art, zoom/pan, ChromeDock, and dim lanterns completely preserved.

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
