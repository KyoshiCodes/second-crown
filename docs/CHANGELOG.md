# CHANGELOG

## 2026-09-28 — Gemini Hold Gatehouse Open vs Shut Doors (bakeoff/gemini-gate)

- **Hold Gatehouse Open vs Shut Doors (`packages/render/src/buildings.ts`, `packages/render/src/index.ts`)**:
  - **Wall Ring Closed Detection (`isWallRingClosed`)**:
    - Automatically evaluates whether the hold's defensive wall ring is closed using existing state via `sim.hasClosedWallRing(state, realmId)` (requiring `>= 8` rim walls and a rim gate).
    - Also supports explicit test or flag overrides (`state.flags.isRingClosed`, `state.isRingClosed`).
    - Added `isRingClosed?: boolean` to `BuildingDrawOptions` and exported `isWallRingClosed` from `@second-crown/render`.
  - **Shut Doors on Closed Ring (`isRingClosed === true`)**:
    - Western gatehouse: Heavy oak double-doors shut tight meeting at the center with vertical plank seam, heavy blackened iron hinge straps with rivets, central iron drop bar / lock hasp, and lowered portcullis teeth.
    - Cedar Kin: Split-cedar double doors shut tight with cross-straps and lowered log portcullis.
    - Sand Banner: Brass-studded cedar double doors shut tight with bronze lattice portcullis.
    - Wind Host: Heavy cross-braced timber double gates barred shut against pylons.
    - Tide Clans: Weathered driftwood double doors shut tight with lowered bamboo portcullis.
  - **Open Doors on Open Ring (`isRingClosed === false`)**:
    - Double doors swing open inward in perspective against the door jambs/reveals, displaying 3D door leaf thickness and iron strap hinges.
    - Open vaulted portal reveals courtyard threshold road pavers and warm amber/golden lantern glow cast from within.
    - Portcullis is drawn raised high tucked under the archway lintel.
    - Applied across all 5 cultures: Western, Cedar, Sand, Steppe, and Islands.
  - **Interior / Non-Rim Gatehouses**: Un-hung open vaulted passage preserved as before.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Tests pass: 221 sim tests pass, 169 render tests pass (+5 new tests verifying ring detection, open vs shut gate graphics across all cultures, state inference, and invariants); app build clean.

## 2026-09-28 — Gemini Damaged Rim Wall Art Presentation with Low wallHp (bakeoff/gemini-wall-scar)

- **Damaged Rim Wall Art Presentation with Low wallHp (`packages/render/src/buildings.ts`, `packages/render/src/index.ts`)**:
  - **Wall HP Status Detection (`getWallHpStatus`, `isWallHpLow`)**:
    - Automatically checks `state.wallHp` (number or `{ cur, max }`), `state.wall_hp`, or `state.flags.wallHp` / `wall_hp` / `wallHpCur` / `wall_hp_cur`.
    - Returns `hasWallHp: false, isLow: false` when `wallHp` is not on state (undefined / null), ensuring full HP walls stay untouched.
    - Accurately computes `ratio = cur / max` against nominal intact wall ring baseline (~96–146 HP) or explicit `maxHp`, detecting low wall HP when `ratio < 0.60` or `cur <= 0`.
  - **Battle Scars & Missing Merlons Presentation**:
    - **Straight Rim Wall Curtain Spans (`drawCurtainSpan`)**:
      - Deep shadow fissure paths descending jaggedly down the vertical ashlar wall face with secondary branch cracks, sunlight highlight ridge accents, and fallen masonry rubble chunks at the plinth base.
      - Dynamic parapet crenellation damage: deterministic PRNG per merlon drops ~45% of merlons into missing gaps with crumbled mortar stumps, chips ~25% down to partial fractured height, and leaves remaining merlons intact with cultural coping stones.
    - **Corner Bastion Towers (`drawRimWallCurtain`)**: Shears away the front center merlon into an open jagged gap with a crumbled mortar stump, chips the sunlit merlon, and draws vertical stress fractures with fallen stone chips at the base.
    - **Pilaster Wall Buttresses**: Draws stress fracture lines across visible center wall buttresses.
    - **Gatehouse Curtain Wings (`drawGatehouseCurtainWings`)**: Adjacent connecting curtain wings display matching cracked masonry and battlement gaps across all 5 cultures.
  - **Full HP Walls Stay As They Are**: When walls are at full HP or when `wallHp` is absent from state, 100% full-height merlons and pristine stone curtain faces are rendered exactly as before.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Tests pass: 221 sim tests pass, 164 render tests pass (+6 new tests verifying wallHp detection, low vs high HP thresholds, missing merlons, corner bastion cracks, gatehouse wings, and invariant preservation); app build clean.

## 2026-09-28 — Gemini Player Camps and Outposts Clearer Tent + Flag (bakeoff/gemini-camps)

- **Clearer Tent + Flag for Player Camps and Outposts (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - **Encampment Tent (`drawCampTentAndFlag`, `drawPlayerCampTentAndFlag`)**:
    - Replaces the rudimentary stake or primitive red triangle with an authentic pitched military pavilion tent: dual-tone canvas roof panels, timber apex ridgepole, scalloped valance eaves trim in faction tabard colors, dark arched entry flap, and cozy glowing lantern/hearth light.
    - Nomadic Steppe culture features a rounded felt yurt with conical dome and compression crown ring.
    - Angled tension guy ropes anchored by timber ground pegs with soft ground contact footprint shadows.
  - **Heraldic Flag Standard**:
    - Tall hardwood flagpole with iron ground bracket and polished finial sphere (customized per culture: cedar huntsman plume, steppe horsehair tuft, islands sea pearl).
    - Fluttering swallowtail heraldic banner waving in the wind with animated phase wave and golden chevron charge.
  - **Tile Integration**:
    - Player outposts on the board (`p.occupantRealmId === "player"` and `p.id !== homeProvinceId`) now prominently display the clear tent + flag when unguarded, and the fortified pavilion with garrison armor when guarded.
    - Wild / neutral camp nodes (`p.node === "camp"`) render a rugged weathered hide canvas tent with crimson camp pennant.
  - **Overworld Atlas `<MiniCamp>`**:
    - Adds `<MiniCamp>` SVG component to `OverworldAtlas.tsx` for camp tiles and player outposts (`style={{ pointerEvents: "none" }}`), displaying pitched tent, entrance, lantern glow, flagpole, and heraldic flag pennant.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera geometry remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Tests pass: 221 sim tests pass, 158 render tests pass (+5 new tests covering tent and flag rendering across all culture kits, board painting, and atlas components); app build clean.

## 2026-09-28 — Gemini Node Stock Piles on Diamond (bakeoff/gemini-node-piles)

- **Node Stock Piles on Diamond (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Provinces that already have node stock draw a small stock pile on the diamond tile:
    - **Woodcut**: Stacked timber logs on supporting skid beams with detailed bark bodies and cut growth rings.
    - **Field**: Burlap harvest grain sacks on a threshing mat with tied necks and golden grain ear tips.
    - **Quarry**: Dressed isometric ashlar stone blocks with sunlit top facets and shaded faces.
  - **Empty Nodes Stay As They Are**: When a node has no stock (`stock <= 0` or depleted), no pile is drawn on the diamond and empty nodes stay as they are (preserving the base landmark/circle marker without red blinking dots).
  - **Overworld Atlas Integration**: Adds `<MiniLogs>`, `<MiniSacks>`, and `<MiniBlocks>` SVG components to `OverworldAtlas.tsx` for provinces with positive stock (`nodeStock(state, p.id) > 0`). Empty nodes remain as default node circles.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera geometry remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Tests pass: 220 sim tests pass, 153 render tests pass (+5 new tests covering stock pile detection, empty node preservation, and atlas mini-piles); app build clean.

## 2026-09-28 — Gemini Ledger Cards & 16–20px Quill/Ink Pip (bakeoff/gemini-ledger)

- **Ledger Cards with Quill / Ink Pip (`packages/app/src/hud/QuillPip.tsx`, `packages/app/src/hud/LedgerCard.tsx`, `packages/app/src/hud/ledger-card.css`, `packages/app/src/LedgerPanel.tsx`)**:
  - **Quill / Ink Pip (`QuillPip.tsx`)**: 16–20px vector pip (`size = 18`, `viewBox="0 0 20 20"`) featuring a finely detailed goose feather scribe quill (slender rachis, barb notches, calamus barrel, writing nib, and slit) beside a faceted stone inkpot with liquid ink pool, gloss meniscus glint, and a hanging wet ink bead.
  - **Dynamic Rubrication Ink Tinting (`resolveInkColors`)**: Inks automatically harmonize with entry categories:
    - War / Defeat / Clash: Scribe's crimson rubrication ink (`#dc2626`).
    - Victory / Truce / Peace: Royal golden illumination ink (`#d97706`).
    - Marshal / Decrees: Imperial sapphire/indigo court ink (`#6366f1`).
    - General Chronicle: Traditional azure iron-gall ink (`#0284c7`).
  - **Ledger Card Component (`LedgerCard.tsx`)**: Renders `<li className="sc-ledger-card">` with `QuillPip`, `sc-ledger-card-time`, and `sc-ledger-card-text`. Integrated into `LedgerPanel.tsx`.
  - **Strict Invariants**:
    - Strictly `pointer-events: none` on both pip wrapper and SVG elements.
    - All pip styling contained entirely in `packages/app/src/hud/ledger-card.css`.
    - `packages/app/src/theme.css` remains 100% untouched.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - `git diff main -- packages/sim server` strictly empty.
    - Tests pass: 220 sim tests pass, 148 render tests pass; app build clean.

## 2026-09-28 — Ledger cards (wave/hud-ledger)

- `LedgerPanel.tsx` renders each Ledger of Crowns entry as a small `.sc-ledger-card`: time (`tN`) then text.
- Order unchanged: `listLedger` already sorts newest first.
- Styles only in `packages/app/src/hud/ledger-card.css`; inline styles removed from the component. `theme.css` not edited.
- No sim, server or ledger data changed. No conflict markers. 220 sim tests pass, 146 render tests pass; app build clean.

## 2026-09-27 — Gemini Selected Board Province Clear Gold Rim & Ground Ring (bakeoff/gemini-select-rim)

- **Clear Gold Rim & Ground Ring (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/app/src/OverworldAtlas.tsx`, `packages/app/src/game/useGameEngine.ts`)**:
  - **Tabletop Ground Ring (`wy`)**: Selected board provinces now project a clear radiant gold ground ring at tabletop ground level (`0xfacc15`, `0xb45309`, `0xfef08a`) with an inner shimmer line and 4 cardinal corner bracket pips, anchoring the tile firmly to the tabletop plane.
  - **Vertical Cliff Corner Struts**: For elevated provinces (`elev > 0`), vertical corner struts drop down the cliff facets from the elevated plateau to the ground ring, paired with a front cliff ground rim.
  - **Top Gold Rim (`cy = wy - elev`)**: Surrounds the elevated playable plateau with a double gold rim (`0xfacc15`, `0xd97706`), rear sunlight facet glint, and 4 cardinal diamond corner glints.
  - **Board Selection Layer & MapRenderer API**:
    - Adds `boardSelectionLayer` to Pixi `boardContainer` and implements `paintBoardSelectionRim`.
    - `MapRenderer` exposes `setSelectedProvince(provinceId: string | null)` and `getSelectedProvince()`, synchronizing seamlessly with game state in `useGameEngine.ts`.
    - `paintBoardHighlight` (hover) and `paintBoardProvinces` both integrate `paintBoardSelectionRim`.
    - `OverworldAtlas.tsx` renders matching `.sc-atlas-select-rim` with base ground ring, top gold rim, and corner bracket pips (`pointerEvents="none"`).
- **Invariants & Preservations**:
  - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% unchanged.
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero `<<<<<<<` merge conflict markers anywhere in the repository.
  - Monorepo tests pass: 220 sim tests, 144 render tests (+6 unit tests covering ground ring geometry, top gold rim, vertical cliff struts, selection layer, MapRenderer methods, and camera invariants).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Gemini Event Cards & 24px Omen Pip (bakeoff/gemini-events)

- **World Event Cards (`packages/app/src/hud/EventCard.tsx`, `packages/app/src/hud/event-card.css`, `packages/app/src/EventPanel.tsx`)**:
  - Presents world events as medieval chronicle cards with title, body narrative, tick count, and optional interactive choices.
  - The latest event is highlighted as a banner card, followed by Advisor Mira's counsel, with past events arranged in a responsive grid (`.sc-event-grid`).
  - Distinct left-edge border colors by event type: `.is-harvest`, `.is-timber`, `.is-spoil`, `.is-levy`, `.is-tribute`, `.is-comet`, `.is-raven`.
- **24px Omen Pip (`packages/app/src/hud/OmenPip.tsx`, `packages/app/src/hud/event-card.css`)**:
  - 24px SVG heraldic omen pip (`width: 24px; height: 24px; viewBox="0 0 24 24"`) with three authentic medieval portent variants:
    - `comet`: blazing celestial star portent with streaking fiery tail, star dust embers, glowing nucleus, and astral aura.
    - `raven`: prophetic obsidian raven perched upon a twilight crag with piercing glinting eye, sharp beak, and folded wing plumage.
    - `harvest`: auspicious golden wheat sheaf bound with crimson ribbon, alternating ripe wheat grains, awn whiskers, and solar sparkles.
  - `resolveOmenVariant` helper maps simulation events (`harvest`, `timber`, `spoil`, `levy`, `tribute`, `comet`, etc.) to the appropriate omen pip.
  - Click pass-through: strictly enforces `pointer-events: none !important;` on wrapper, SVG, and child elements so choice buttons and event cards are never blocked.
- **Invariants & Preservations**:
  - Styles strictly isolated to `packages/app/src/hud/event-card.css` only; `packages/app/src/theme.css` was NOT edited.
  - Zero `<<<<<<<` merge conflict markers anywhere in the repository.
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 138 render tests (+6 unit tests covering event card CSS rules, variant resolution, text splitting, 24px omen pip SVG art, EventCard mounting, and EventPanel grid).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Gemini Quest Cards & 24px Scroll Pip (bakeoff/gemini-quests)

- **Quest Cards (`packages/app/src/hud/QuestCard.tsx`, `packages/app/src/hud/quest-card.css`, `packages/app/src/QuestPanel.tsx`)**:
  - Replaces raw quest rows with dedicated `QuestCard` components arranged in a responsive grid (`.sc-quest-grid`).
  - Card displays quest title, hint, 0/1 progress bar track and fill, count, and Claim button when ready (or gold reward preview / taken text).
  - Left border highlights status: `.is-open` (amber `#d29922`), `.is-ready` (green `#3fb950`), `.is-claimed` (muted slate `#6e7681`).
- **24px Scroll Pip (`packages/app/src/hud/ScrollPip.tsx`, `packages/app/src/hud/quest-card.css`)**:
  - Unrolled medieval parchment mandate at 24px (`width: 24px; height: 24px; viewBox="0 0 24 24"`) with wooden roller rod curls, sepia script lines, and a wax signet seal.
  - **Ready Pip is LIT**: When complete and ready to claim, the scroll glows with radiant golden vellum (`#fffbeb`, `#fbbf24`), dual sparkle stars, and candle flame flicker (`drop-shadow(0 0 2.5px rgba(250, 204, 21, 0.95)) drop-shadow(0 0 6px rgba(245, 158, 11, 0.65))`).
  - Open quests display warm antique vellum; claimed quests show archived slate-grey.
  - Unconditionally enforces `pointer-events: none !important;` on wrapper, SVG, and all child paths so card clicks and Claim button presses are never obstructed.
- **Invariants & Preservations**:
  - Styles strictly isolated to `packages/app/src/hud/quest-card.css` only; `packages/app/src/theme.css` was NOT edited.
  - Zero `<<<<<<<` merge conflict markers anywhere in the repository.
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 132 render tests (+5 unit tests covering quest card CSS rules, questStatus state machine, 24px scroll pip ready lit glow, QuestCard mounting, and QuestPanel grid).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Gemini Diplomacy Realm Cards & 28px Realm Crest Pip (bakeoff/gemini-diplo)

- **Diplomacy Realm Cards (`packages/app/src/hud/RealmCard.tsx`, `packages/app/src/hud/realm-card.css`, `packages/app/src/WarRoom.tsx`, `packages/app/src/theme.css`)**:
  - Replaces raw odds button list in the War tab with dedicated `RealmCard` components arranged in a responsive grid (`.sc-realm-dip-grid`).
  - Card displays realm name, stance badge (with truce countdown timer), opinion breakdown, power odds comparison (mine vs theirs and share percentage with favorable green or unfavorable red color), and direct Declare war / Gift actions.
  - Card left border indicates diplomatic stance: `.is-war` (red `#f85149`), `.is-truce` (azure `#58a6ff`), `.is-friendly` (green `#3fb950`), `.is-wary` (amber `#d29922`), `.is-hostile` (orange `#db6d28`).
- **28px Realm Crest Pip (`packages/app/src/hud/RealmCrestPip.tsx`, `packages/app/src/hud/realm-card.css`, `packages/app/src/theme.css`)**:
  - Integrates the existing heraldic `Crest` at 28px (`width: 28px; height: 28px; size={28}`).
  - **Hostile Crest is Colder**: When a realm is in a hostile stance (`stance === "hostile"` or `stance === "war"`), the crest shifts to a colder hue-rotated steel frost (`saturate(0.5) hue-rotate(185deg) brightness(0.9)`), accompanied by a crystalline frost contour overlay and icy cyan glow (`drop-shadow(0 0 2.5px rgba(56, 189, 248, 0.75))`).
  - Friendly stances apply a warm emerald radiance, truce a calm azure glow, and wary a warm amber rim.
  - Unconditionally enforces `pointer-events: none !important;` on wrapper, SVG, and child elements so Declare war and Gift gold button clicks are never obstructed.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 127 render tests (+5 unit tests covering diplomacy card CSS rules, stance mapping, 28px realm crest pip colder state, RealmCard mounting, and WarRoom grid).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Gemini Royal Decree Cards & 24px Wax-Seal Pip (bakeoff/gemini-decrees)

- **Royal Decree Cards (`packages/app/src/hud/DecreeCard.tsx`, `packages/app/src/hud/decree-card.css`, `packages/app/src/DecreesPanel.tsx`, `packages/app/src/theme.css`)**:
  - Replaces raw decree buttons in the Crown tab with dedicated `DecreeCard` components in a responsive `.sc-decree-grid`.
  - Card displays decree name, blurb, cost row with 16px `ResourcePip`s (with red short amounts when unaffordable), active countdown timer (`${Math.ceil(left / 10)}s left`), and Issue button ("Already active" when sworn).
  - Tones match system states: `.is-ready` (amber), `.is-active` (green with subtle illuminated background), `.is-off` (muted when unaffordable).
- **24px Wax-Seal Pip (`packages/app/src/hud/WaxSealPip.tsx`, `packages/app/src/hud/decree-card.css`, `packages/app/src/theme.css`)**:
  - 24px circular stamped royal wax seal (`width: 24px; height: 24px; viewBox="0 0 24 24"`) featuring organic scalloped wax pooling, hanging royal ribbon tails, and a stamped royal signet crown matrix.
  - **Active seal is LIT**: Transmutes to molten amber-gold wax with radiant incandescent core, crown flare, secondary specular glints, and gentle flame glow flicker (`drop-shadow(0 0 2.5px rgba(250, 204, 21, 0.95)) drop-shadow(0 0 6px rgba(245, 158, 11, 0.65))`).
  - **Dormant seal**: Deep regal crimson pressed wax (`#991b1b` / `#7f1d1d`).
  - Unconditionally enforces `pointer-events: none !important;` on wrapper, SVG, and all child paths so card clicks and Issue button presses are never blocked.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 122 render tests (+4 unit tests covering decree card CSS rules, 24px wax-seal pip active lit state and dormant state, DecreeCard mounting, and DecreesPanel grid).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Gemini Last Battle Card & 28px Clash Pip (bakeoff/gemini-battle)

- **Last Battle Card (`packages/app/src/hud/BattleCard.tsx`, `packages/app/src/hud/battle-card.css`, `packages/app/src/WarRoom.tsx`, `packages/app/src/theme.css`)**:
  - Replaces raw paragraphs and event list with a dedicated `BattleCard`:
    - Header shows combatants (`winner` vs `loser`), outcome verdict (Victory in green, Defeat in red, or X won in amber), and the 28px clash pip.
    - Shows combat report line, Butcher's bill phase when present, and folds detailed round-by-round combat logs under `<details className="sc-battle-log"><summary>Blow by blow</summary>`.
- **28px Clash Pip (`packages/app/src/hud/ClashPip.tsx`, `packages/app/src/hud/battle-card.css`, `packages/app/src/theme.css`)**:
  - **Crossed Blades (`variant="crossed_blades"`)**: Two crossed forged steel arming swords with gold pommels and central clash spark with emerald victor glow (`rgba(63, 185, 80, 0.65)`). Displays on victory or AI clash.
  - **Broken Shield (`variant="broken_shield"`)**: Fractured iron-rimmed heater shield cleaved by a jagged glowing fissure with embers and silver rivets (`rgba(248, 81, 73, 0.75)`). Displays when the player is defeated (`loserId === "player"`).
  - Strictly enforces `pointer-events: none !important;` across all pip elements, wrappers, and SVGs.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 118 render tests (+4 unit tests covering battle card structure, clash pip variant resolution, defeat broken shield, and WarRoom mounting).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Market offer cards (wave/hud-market)

- Kingdom tab Market: each `MARKET_OFFERS` entry is now an `OfferCard` (`packages/app/src/hud/OfferCard.tsx`, `offer-card.css`) in `.sc-offer-grid`: Give row, Get row (resource pips), Trade button.
- Trade is disabled when `canTrade` is false (no Market, or short on the give resource). Short amounts show in red.
- Still calls `tryTrade`. Prices unchanged. No sim or server changes.

## 2026-09-24 — Gemini War Force Cards & 24px War Chips (bakeoff/gemini-war-chips)

- **Tactical War Force Cards (`packages/app/src/hud/ForceCard.tsx`, `packages/app/src/WarRoom.tsx`, `packages/app/src/theme.css`)**:
  - Converts plain military mission lists into a structured, responsive CSS grid (`.sc-force-grid`) of force cards.
  - Covers incoming hostile warbands, scouting expeditions, supply gather convoys, and outpost garrisons.
  - Each card presents force name, destination target, dynamic ETA timer ("posted" or `${seconds}s`), and instant Sally / Recall actions.
- **24px Bespoke Tactical War Chips (`packages/app/src/hud/WarChip.tsx`, `packages/app/src/theme.css`)**:
  - Every force card features a distinct 24px tactical SVG chip matching its mission role:
    - **Incoming (`tone="hostile"` / `kind="warband"`)**: Red warband pip with horned barbarian helm, blood-red tabard, and spiked morningstar flail; crimson left accent with `drop-shadow(0 0 2px rgba(239, 68, 68, 0.7))`.
    - **Scouts (`tone="scout"` / `kind="cloak"`)**: Scout cloak pip with twilight-navy cowl mantle, sky-cyan border trim, and brass spyglass telescope; blue left accent with cyan glow.
    - **Gathers (`tone="gather"` / `kind="cart"`)**: Gather cart pip with timber cargo wagon, banded grain sacks, and iron-spoke wheel; golden amber left accent with warm glow.
    - **Garrisons (`tone="garrison"` / `kind="tent"`)**: Garrison tent pip with canvas pavilion ridgepole, leaning spear and tower heater shield, and warm lantern hearth; emerald green left accent.
- **Strict Non-blocking Pointer Events**:
  - All chip wrappers (`.sc-war-chip-wrapper`), SVGs, and descendant elements unconditionally enforce `pointer-events: none !important;`.
  - Guarantees zero obstruction for Sally, Recall, and atlas interaction clicks.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 114 render tests (+4 unit tests covering force grid, war chip rendering, kind normalization, and WarRoom mounting).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-24 — Gemini People Cards with Walker Role Pips (bakeoff/gemini-people)

- **Walker Role Pips (`packages/app/src/hud/WalkerPip.tsx`, `packages/app/src/hud/JobCard.tsx`, `packages/app/src/theme.css`)**:
  - Each people trade card features an authentic 24px walker role pip with matching tools:
    - **Farmer (Hoe)**: Forged iron field hoe, ash haft, straw sun hat, golden harvest wheat ear.
    - **Woodcutter (Axe)**: Bearded felling broadaxe with razor steel cutting edge, wool cap, rough pine log.
    - **Miner (Pick)**: Double-pointed heavy quarry pickaxe with piercing beak, leather miner coif, brass lantern.
    - **Merchant (Coin)**: Minted royal gold sovereign with starburst twinkle shine, merchant beret, coin purse.
- **Idle Pip Sits**:
  - When unassigned or idle (`assigned === false`), the walker sits in a peaceful, restful posture on a hay bale, pine log, ashlar granite block, or strongbox trunk with hands on knees.
- **Assigned Pip Walks 2 Frames**:
  - When assigned (`assigned === true`), the pip walks through a stepped 2-frame cycle (`.sc-walker-f0`, `.sc-walker-f1`) with bobbing and tool swaying via GPU-accelerated CSS keyframes (`steps(1)`).
- **People Panel & Job Cards (`packages/app/src/PeoplePanel.tsx`, `packages/app/src/hud/JobCard.tsx`)**:
  - Displays people roster grouped into trade cards (`.sc-job-grid`) with idle villagers first in a dashed amber card, and assigned trades with a green left accent.
  - Shows trade name, walker role pip, worker count, worksite paths, and per-worker "Post at..." and "Idle" controls.
- **Non-blocking Clicks**:
  - Strictly enforces `pointer-events: none !important;` across all pip wrappers, SVGs, and child elements.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 110 render tests (+5 new unit tests covering job card grid, walker role pips, 2-frame walk animations, sitting pose, tool resolution, and non-blocking clicks).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-24 — Gemini Army Unit Cards with 28px Culture-Kit Chips (bakeoff/gemini-army-chips)

- **Trainable Army Unit Cards (`packages/app/src/hud/UnitCard.tsx`, `packages/app/src/tabs/ArmyTab.tsx`, `packages/app/src/theme.css`)**:
  - Replaces text buttons with rich unit cards in a responsive CSS grid (`.sc-unit-grid`) for all units: Militia, Spearman, Archer, Skirmisher, Cavalry, Knight, Champion, and Siege.
  - Each card displays unit name, power rating (`pwr {power}`), dynamic train costs/duration, and locked requirements.
- **28px Culture-Kit Chip Art (`packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/app/src/theme.css`)**:
  - Each card embeds a culture-kit `UnitIcon` sized to 28px within `.sc-unit-art-wrapper`.
  - Units reflect the player's active culture style and gear aesthetic.
- **Greyed Out Locked Cards**:
  - Units not yet unlocked via Crown study (e.g. Cavalry/Knights without Horse lore, Siege without Siege craft) are styled with `.is-locked`:
  - Applies `filter: grayscale(1)`, `opacity: 0.55`, muted slate color on names/power, desaturated 28px chip art, and `cursor: not-allowed`.
- **Non-blocking Clicks**:
  - Chip art and wrapper strictly enforce `pointer-events: none !important;` so that card button interactions, clicks, and training triggers fire with zero obstruction.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 105 render tests (+3 new unit tests covering army card grid, 28px chip art wrapper, locked state styling, UnitCard states, and ArmyTab integration).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-24 — Gemini Kingdom Work Cards with 24px Isometric Hall Chips (bakeoff/gemini-works)

- **24px Isometric Hall Chips (`packages/app/src/hud/HallChip.tsx`, `packages/app/src/theme.css`)**:
  - Each player work card is equipped with a distinct 24px isometric SVG architectural chip reflecting its building type:
    - `cottage`: Timber hall with half-timber studs, pitched thatch roof, stone chimney with smoke wisp.
    - `farm`: Barn with gambrel roof, cross-braced doors, cylindrical stone granary silo, spilling golden straw.
    - `lumber_camp` / `camp`: A-frame timber shelter, stacked firewood rick with growth rings, woodsman's axe in stump.
    - `quarry` / `mason`: Stepped ashlar blocks, timber crane derrick boom with pulley and hoisted stone.
    - `market`: Merchant stall with striped crimson/gold scalloped awning canopy and goods baskets.
    - `barracks`: Fortified stone training hall with crenellated parapet battlements, arched gateway, heraldic shield.
    - `academy`: Classical scriptorium with stone columns, triangular pediment, scholar's cupola and golden astrolabe finial.
    - `chapel`: Soaring sanctuary bell spire crowned with golden cross and stained glass lancet window.
    - `infirmary`: Healer's hospice hall with steep slate roof and bold red cross medallion.
    - `watchtower`: Tall stone tower shaft, corbelled parapet, elevated iron brazier with signal fire beacon.
    - Additional bespoke isometric SVGs for `granary`, `sawmill`, `gold_mine`/`mint`, `stables`, `archery_range`, `siege_workshop`, `walls`, `gate`.
- **Unstaffed Chip is Dim**:
  - When a building lacks assigned staff, its chip dims (`opacity: 0.42`, `filter: grayscale(0.55) brightness(0.68)`) with extinguished windows and dormant hearths. Staffed buildings display warm golden candlelight and vibrant colors.
- **Scarred Chip is Cracked**:
  - When damaged from siege attacks, the chip renders jagged stone fracture crack lines (`sc-chip-cracks`, `sc-chip-crack-main`, `sc-chip-crack-branch`) and chipped stone effects.
- **Kingdom Tab Card Grid (`packages/app/src/hud/WorkCard.tsx`, `packages/app/src/tabs/KingdomTab.tsx`)**:
  - Replaces text lists with responsive cards featuring building name, level, staffing status, bonuses, and Demolish/Repair actions.
  - Distinguishes fresh building scaffolding from siege scars via `isScarred`.
- **Non-blocking Clicks**:
  - Strictly enforces `pointer-events: none !important;` on all chip wrappers and SVGs so Demolish and Repair buttons always receive clicks cleanly.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 102 render tests (+4 new unit tests covering work card grid, 24px hall chip, dim unstaffed state, and cracked scarred state).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-24 — Gemini Resource Strip Animated Pips (bakeoff/gemini-strip)

- **Looping 2–3 Frame Animated Pips (`packages/app/src/hud/ResourcePip.tsx`, `packages/app/src/hud/ResourceHud.tsx`, `packages/app/src/theme.css`)**:
  - Each resource store cell in the carved timber ledger features an authentic 2–3 frame looping animated pip:
    - **Food (Grain Sack)**: Plump burlap sack tied with twine, breathing and shifting folds, settling with golden grain glints.
    - **Wood (Timber Log)**: Felled cylindrical log with tree growth rings and bark grain, catching glowing amber resin sap droplets.
    - **Stone (Cut Ashlar)**: Isometric masonry ashlar block with drafted bevel margins and crystalline chisel tool glints.
    - **Gold (Minted Coin)**: Royal gold sovereign with reeded edge and crown stamp, gleaming with traveling starburst shines.
  - **Empty Food Pip Slumps**:
    - When player food stores are depleted or critically low (`isFoodStoresEmptyOrLow`), the food pip deflates completely into a flat slumped sack collapsed in the dirt with a drooping limp neck and tired horizontal folds.
  - **Full Store Pip Stacks High**:
    - When any store is full (`isFull`), its pip stacks high into an impressive multi-tier structure:
      - Food: 3-sack pyramid stacked high with sprouting ripe wheat ears.
      - Wood: 5-log timber cord rick stacked high in three tiers with cross-section rings.
      - Stone: 4-tier stepped fortress masonry pier and capstone stacked high.
      - Gold: Twin towering treasury coin stacks with loose golden coins spilled at the base.
      - Enhanced with a warm golden aura glow (`@keyframes sc-pip-stacked-glow`).
  - **Non-blocking Clicks**:
    - Strictly enforced `pointer-events: none !important;` on all pips and wrappers. All cell clicks, tooltips, and interactions remain 100% responsive.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Form inputs not restyled to white.
  - Monorepo tests pass: 220 sim tests, 98 render tests (+4 new unit tests covering stepped loops, slumped idle, stacked glow, variant resolution, and non-blocking click pass-through).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-24 — Gemini Inhabited Shell HUD, Stamped Tabs & Primer Banner (bakeoff/gemini-hud)

- **Inhabited Atmosphere for Lectern & Realm Cards (`packages/app/src/hud/InhabitedOverlay.tsx`, `packages/app/src/theme.css`, `packages/app/src/ResearchBar.tsx`)**:
  - Lectern card and realm cards enhanced with inner gold leaf edge (`inset 0 0 0 1px rgba(212, 163, 89, 0.42)`), subtle candle flare, and warm scriptorium ambience.
  - Ambient dust motes drift lazily upward and twinkle as they catch candlelight via dedicated canvas overlay (`InhabitedOverlay`).
  - Organic multi-harmonic candle flicker (`@keyframes sc-candle-flicker`) provides a living, breathing study and kingdom atmosphere.
  - Overlay strictly enforces `pointer-events: none` and content uses `z-index: 1`, guaranteeing 100% click-through and interaction integrity.
- **Stamped Metal Navigation Tabs & Active Lantern Tick (`packages/app/src/theme.css`, `packages/app/src/AppShell.tsx`)**:
  - Navigation tabs restyled as stamped bronze/iron plates with beveled highlights, metallic gradient backings, and pressed tactile responses.
  - Active tab features an ornate hanging lantern tick icon (`.sc-tab-lantern`) with a pulsing candle flame (`@keyframes sc-lantern-flame`) and top metal notch indicator.
- **Primer Banner with Royal Wax Seal & Page Edge (`packages/app/src/TutorialBanner.tsx`, `packages/app/src/theme.css`)**:
  - Tutorial banner upgraded to look like imperial vellum with a deckled page edge, gold embroidery stitch border, and ruby wax seal medallion.
  - Action buttons ("Done with this step" and "Skip primer") given prominent high-contrast finishes to preserve immediate readability against parchment.
- **HUD Input Styling Preserved**:
  - Did not restyle form inputs to white; form elements retain consistent dark HUD styling.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Full test suite passes: 220 sim tests, 94 render & HUD unit tests.
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-23 — Upkeep line on Army tab (`wave/upkeep-line`)

- `packages/app/src/UpkeepLine.tsx` (new, display only): "Upkeep · N mouths · X food/tick (Y/s)." Mounted under Posts in `ArmyTab.tsx`.
- `packages/sim/src/index.ts`: now re-exports existing read-only `armyMouths` and `upkeepPerTick` from `systems/upkeep.ts`. No logic change; units eat the same.
- No render or server changes.
 
+## 2026-09-23 — Gemini Tired Home Militia on Low/Empty Food Stores (`bakeoff/gemini-upkeep`)
+
+- **Tired Home Militia Meeples on Hold & Units When Food Stores Depleted (`packages/render/src/walkers.ts`, `packages/render/src/index.ts`, `packages/app/src/UnitIcon.tsx`)**:
+  - If player food stores are empty or nearly empty, home militia meeples on the hold and army displays visually slump into a tired posture with dragged weapons and zero banner bounce:
+    - **Food Upkeep Depletion Detection (`isFoodStoresEmptyOrLow`)**:
+      - Self-contained function checking whether food is missing, `<= 0`, or depleted below standing army upkeep demands (`mouths * 0.02 * 50` ticks buffer, minimum 5 food).
+    - **Slumped Meeple Stance & Drooping Brow (`drawWalkerFrame`, `drawCultureWalker`)**:
+      - Torso and head slump down by 2px (`slumpY = 2`).
+      - Drooping exhausted brow line drawn across eyes/face.
+      - Shield hangs low at the hip (`-3 + slumpY`).
+    - **Low Dragged Weapons & Suppressed Banner Bounce (No Banner Bounce)**:
+      - Spear/lance dragged low along the ground (`moveTo(facing * 3, 1)`, `lineTo(facing * 4, -10)`).
+      - Pennants hang limp and sagged; coordinates remain completely static across walk animation frames 0, 1, 2 (**zero banner bounce**).
+    - **Culture-Kit Adaptations**: Western, Cedar Kin, Sand Banner, Wind Host (Steppe), and Tide Clans all feature tailored tired postures and suppressed banner bounce.
+    - **Full Food Stores Unchanged**: Alert upright posture and energetic banner bounce preserved when food stores are sufficient.
+    - **App Visuals (`UnitIcon.tsx`, `ArmyVisual.tsx`, `WarLivingStrip.tsx`)**:
+      - `UnitIcon` supports `tired?: boolean` slumping clubs and tunics.
+      - `ArmyVisual` passes `tired` to company cards and marching squad rows.
+      - `WarLivingStrip` slumps the Royal Standard Bearer and suppresses royal banner wave when food is low.
+- **Invariants & Preservations**:
+  - `git diff main -- packages/sim server` strictly 100% empty.
+  - Zero changes to camera math, projection, or click hit-testing.
+  - Full test suite passes: 216 monorepo tests, 92 tests in `@second-crown/render` (+5 new tests covering empty/low food detection, slumped coordinates, suppressed banner bounce, and culture kits).
+  - Clean production build in `@second-crown/app`.
+
 ## 2026-09-23 — Gemini Rim Watchtowers Taller with Beacon & Scaffolding (`bakeoff/gemini-towers`)
+
+- **Rim Watchtowers & Unfinished Scaffolding (`packages/render/src/buildings.ts`)**:
+  - Finished watchtowers on the rim now read taller with a small beacon, and unfinished towers stay scaffolding:
+    - **Elevated Rim Profile (`buildingHeight`, `drawIsometricBuilding`)**:
+      - Extended `buildingHeight` to accept optional `(gx, gy)` coordinates. Rim watchtowers resolve to height `44 + heightBoost` (vs interior `34 + heightBoost`), rising prominently above walls (20px) and gates (24px).
+      - Extended Western stone shaft with multi-level arrow slit tiers and stone corbel belt course.
+    - **Small Signal Beacon**:
+      - Elevated iron brazier basket cage with animated beacon fire (`0xf97316`), inner hot ember (`0xfacc15`), radiant beacon illumination halo (`0xfde047`), and floating ember sparks.
+      - Culture kits feature tailored beacons: Cedar beacon cage with signal fire, Sand minaret golden cupola beacon with crimson pennant, Steppe signal pylon with coals and smoke, and Islands maritime beacon lens and halo.
+    - **Unfinished Towers Stay Scaffolding (`drawWatchtowerScaffolding`)**:
+      - When `complete === false`, watchtowers render as timber construction scaffolding towers across Western and all 4 culture kits:
+        - Heavy corner timber upright standards, multi-tier horizontal ledger rails, and diagonal X-braces with rope lashings.
+        - Planking staging platforms at mid-height and top levels with stacked materials.
+        - Side access ladder and cantilevered builder's hoist boom with pulley wheel, dangling rope, and hoisted ashlar block.
+        - Low WIP masonry footings and mortar bucket.
+        - Completely suppresses finished roofs, pennants, and beacon fire.
+        - Exempted watchtowers from `drawCrackedStoneOverlay`, ensuring unfinished towers stay authentic scaffolding.
+- **Invariants & Preservations**:
+  - `git diff main -- packages/sim server` strictly 100% empty.
+  - Zero changes to camera math, zoom, or tile click hit-testing.
+  - Full test suite passes: 216 monorepo tests, 87 tests in `@second-crown/render` (+6 new tests covering rim height, beacons across cultures, scaffolding details, and rim scaffolding scale).
+  - Clean production build in `@second-crown/app`.
+
 ## 2026-09-22 — Gemini Scarred Buildings with Cracked Stone & Smoke Suppression (`bakeoff/gemini-scar`)
+
+- **Scarred / Knocked-out Buildings with Cracked Stone & Smoke Suppression (`packages/render/src/buildings.ts`)**:
+  - Buildings with `completesAtTick !== null` (knocked out by siege strikes, or under build/repair) now render as solid, battered structures with rich cracked stone detailing and complete suppression of work-in-progress smoke puffs:
+    - **Cracked Stone Overlay (`drawCrackedStoneOverlay`)**: Replaced the placeholder under-construction scaffolding overlay with a comprehensive cracked stone presentation:
+      - **Primary Structural Fissures**: Jagged shadow crevice fault lines (`0x0f172a`) paired with offset light stone highlight ridges (`0xcbd5e1`) that zig-zag down the wall facets across masonry courses, accompanied by branching diagonal stress fractures.
+      - **Transverse Masonry Fractures & Roof Cleave**: Secondary hairline cracks scoring opposing facets and cleaved notches splitting the roofline/eave coping.
+      - **Radial Impact Blowout Crater**: Dark scorch shadow halo, pulverized stone crater depression, bright shattered stone fleck highlights, and radiating micro-fracture spokes simulating a direct siege artillery impact strike.
+      - **Fallen Masonry Rubble & Debris Chunks**: 3D faceted isometric stone blocks sheared from the walls lying at the ground footing/plinth with cast shadows, lit top faces, and shaded side facets, surrounded by scattered debris pebbles.
+      - **Culture-Adapted Palettes**: Material palettes adapt automatically across culture kits (granite/slate for western, desert sandstone for sand, weathered shale/basalt for steppe, river rock/timber for cedar, and reef limestone/coral for islands).
+      - **Deterministic Stability**: Fissure paths and rubble placements use a deterministic PRNG seeded by tile coordinates `(gx, gy)` and building height, giving stable, diverse fracture patterns across the hold.
+    - **Complete Smoke & Flame Suppression**:
+      - Suppressed chimney smoke in Western farm, cottage, and infirmary.
+      - Suppressed culture smoke puffs across Cedar farm, cottage, keep, chapel (incense), and infirmary, as well as Steppe farm, cottage, keep, infirmary, and watchtower (signal smoke pylon).
+      - Extinguished active forge flame in siege workshop and beacon braziers in watchtower and keep, displaying dormant ash coals instead.
+    - **Solid Stonework Presentation**: Changed base building opacity from 0.45 translucent ghost to solid `1.0` so masonry and cracks read with crisp clarity.
+    - **Finished Buildings Unchanged**: Finished buildings (`completesAtTick === null`) remain 100% untouched with all smoke, decorations, and lighting preserved.
+- **Invariants & Preservations**:
+  - `git diff main -- packages/sim server` strictly 100% empty.
+  - Zero changes to camera math, zoom, or tile click hit-testing.
+  - Full test suite passes: 216 monorepo tests, 81 tests in `@second-crown/render` (+10 new comprehensive test blocks for scarred building presentation, cracked stone overlay, and culture smoke suppression).
+  - Clean production build in `@second-crown/app`.
+
 ## 2026-09-22 — Gemini Connected Rim Walls & Gate Ring on Isometric Hold (`bakeoff/gemini-walls`)

- **Connected Rim Walls & Gate Ring (`packages/render/src/buildings.ts`)**:
  - Rim walls and the gatehouse now render as a continuous, unified defensive ring on the isometric hold view with gap-free curtain spans:
    - **Gapless Continuous Curtain Runs**: For contiguous wall runs (`hasPrev && hasNext`), wall segments span cleanly from neighbor boundary to neighbor boundary (`bPrev` to `bNext`). Features continuous stone foundation plinths, vertical curtain faces with horizontal ashlar mortar scoring, top wall-walk ramparts at height `-h` with planking centerlines, and culture-kit specific crenellations along the outer parapet.
    - **Wall Buttress Pilasters & Torches**: Intermediate wall segments feature a projecting stone buttress pilaster with an arrow loop slit and culture-specific wall fixtures (western animated flame torch sconces, cedar carved beast totems with pitch torches, sand brass oil lanterns with amber glow, steppe horsehair standards, and islands driftwood sea-lanterns with cyan beacons).
    - **Four Corner Bastion Towers**: Grid corners `(0,0)`, `(15,0)`, `(15,9)`, and `(0,9)` feature towering keep bastions (`towerH = h + 5`) with diamond plinths, sunlit/shaded facets, roof platforms, four-sided merlons, arrow loops, and cultural apex banners, cleanly bonding orthogonal wall directions without visual clipping.
    - **Seamless Gatehouse Flanking Wings (`drawGatehouseCurtainWings`)**: Gatehouse curtain wings now span from the left/right flanking bastion towers to the exact tile boundaries (`bLeft` and `bRight`) with identical profile geometry (matching wall-walk height, width, plinth, and merlons), creating a seamless transition where the defensive curtain meets the gatehouse.
    - **Terminal Pier End Caps**: Unconnected wall terminals (`hasPrev` or `hasNext` false) cleanly terminate with a fortified terminal pier and merlon post instead of open hollow cross-sections; isolated walls render as compact defensive bastion blocks.
    - **Perimeter Ground Foundation Shadow**: Tailored ambient ground footprint shadows along the rim to prevent individual isolated diamond cutouts or awkward southeast diagonal shadow breaks under wall runs.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 71 tests in `@second-crown/render` (+3 new comprehensive test blocks for closed 48-tile ring, partial runs, and 4-edge gatehouse wings).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Red Warband Meeple for Hostile Incoming Marches (`bakeoff/gemini-incoming`)

- **Distinct Red Warband Meeple (`drawRedWarbandMeeple` in `packages/render/src/tokens.ts`)**:
  - Hostile incoming marches advancing on player territory or traversing the board now display a menacing, hulking red warband meeple clearly distinct from player war marches, scout runners, gather carts, and garrison encampments:
    - **Spiked Blackened Iron Pedestal**: Heavy faceted iron pedestal base flanked by spiked flange studs and an illuminated crimson danger ring (`0xdc2626`).
    - **Hulking Iron Torso & Blood-Red Tabard**: Broad angular blackened iron breastplate (`0x27272a`) draped in a blood-red warband surcoat (`0x991b1b`) with crossed heavy iron harness straps and central skull/stud medallion.
    - **Tiered Spiked Pauldrons**: Aggressive tiered iron shoulder guards flaring outward on both flanks.
    - **Horned Iron War Helm**: Menacing dark iron Greathelm crowned with two sweeping curved demonic horn spikes (`0x52525b`).
    - **Glowing Crimson Visor**: Deep shadowed eye-slit cavity with a pulsing crimson eye corona and dual burning white/red specular pupil hot spots.
    - **Wicked Barbed Poleaxe & Ragged War Pennant**: Tall blackened shaft carrying a jagged, barbed halberd axe head with a razor cutting bevel and a violently fluttering ragged crimson/black battle pennant.
    - **Spiked Heater Shield**: Heavy off-hand iron-trimmed heater shield with central spiked iron boss.
    - **Hostile Threat & ETA Badge**: Floating blackened iron pill badge with skull hazard insignia and pulsing crimson threat LEDs indicating impending impact.
    - **Rival Realm Integration**: Automatically incorporates realm heraldic palettes (`realmTokenPalette`) for the war pennant and shield trims when the hostile march belongs to a rival kingdom (`k_silk`, `k_ash`, `k_frost`, `k_tide`, etc.).
  - **March Classification & Identification (`isIncomingMarch`)**:
    - `isIncomingMarch` safely identifies all hostile incoming threats (`m.realmId !== "player"` and not scout/gather/garrison), cleanly separating enemy warbands from player columns.
    - Re-exports `drawWarbandMeeple` as an alias for flexible integration.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or province tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 68 tests in `@second-crown/render` (+3 new comprehensive test blocks for `isIncomingMarch`, `drawRedWarbandMeeple`, and board march rendering).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Posted Garrison Tent & Banner Meeple (`bakeoff/gemini-garrisons`)

- **Distinct Tent & Banner Meeple for Posted Garrisons (`packages/render/src/tokens.ts`)**:
  - Outpost flag tiles with a posted garrison now show a distinctive, compact military encampment meeple clearly separate from gather carts, stealth scouts, and war march pedestals:
    - **3D Pitched Pavilion Tent**: High-tensile canvas ridgepole pavilion with shadowed left pitch, sunlit right gable, timber ridgepole, taut guy ropes stretching to timber ground pegs, and culture-colored valance trim.
    - **Glowing Hearth / Lantern Interior**: Arched dark entryway revealing a warm golden lantern glow (`0xfef08a`, `0xf59e0b`) radiating candlelight from inside the shelter.
    - **Leaning Defensive Armaments**: Steel-tipped guard spear/halberd and an iron-bossed heraldic heater shield leaning ready beside the encampment entrance.
    - **Elevated Royal Heraldic War Banner**: Hardwood flagpole topped with a gilded finial and waving royal swallowtail standard emblazoned with a golden garrison chevron charge.
    - **Floating Garrison Readiness Crest**: Fortified obsidian shield badge hovering above the pavilion indicating garrison presence, with golden rank studs reflecting garrison defensive strength.
    - **Culture Kit Responsive**:
      - `western`: Royal blue canvas valance, steel halberd, gold finial, and heater shield with gold rim.
      - `cedar`: Woodland forest green pavilion, dark timber ridgepole, red huntsman plume on flagpole, and oak stakes.
      - `sand`: Desert nomad pavilion with scalloped amber cloth, sun brass finial, and round bronze buckler shield.
      - `steppe`: Conical felt yurt dome with horsehair flagpole tuft and round shield.
      - `islands`: Marine blue pavilion with ocean pearl finial and naval wave heraldry.
  - **Guarded vs Unguarded Outpost Clarity**:
    - Provinces with posted garrisons (`getPostedGarrison(state, provinceId).posted`) display the fortified tent + banner encampment meeple.
    - Unguarded outposts / territory claims display a solitary wooden boundary marker stake with a fluttering pennant flag, making undefended borders immediately obvious at a glance.
  - **Garrison Deployment & Recall Marches (`isGarrisonMarch`)**:
    - Automatically classifies garrison dispatches (`purpose === "garrison"`) and recalls (`purpose === "garrison_home"`), rendering them with a royal blue and steel/gold garrison deployment route trail and fortified outpost reticle.
    - Marching garrison columns render with the distinct tent + banner meeple in animated marching mode with vertical bob.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or province tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 65 tests in `@second-crown/render` (+5 new comprehensive test blocks for garrison status, march classification, meeple rendering, board provinces, and multi-march routes).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Reconnaissance Scout Cloak & Spy Meeple (`bakeoff/gemini-scouts`)

- **Distinct Cloak/Spy Meeple for Scout Columns (`packages/render/src/tokens.ts`)**:
  - Scout columns exploring uncharted provinces on the isometric board now use an iconic, agile spy/ranger meeple clearly distinct from heavy military war marches and agrarian gather carts:
    - **Deep Shadowed Hooded Cowl**: Deep shadow-cast facial cavity concealing the operative's identity, pierced by glowing radiant cyan scout eyes (`0x38bdf8`) with a specular starlight slit scanning the frontier.
    - **Billowing Ranger Stealth Cloak**: Midnight slate mantle (`0x0f172a` tinted by culture) trailing behind the runner with dynamic flapping physics across stride frames (`frame 1` & `frame 2` lift up in the wind; `frame 0` drapes gracefully), silver cloak clasp pin, and moonlit hem highlights.
    - **Brass Spyglass / Monocular Telescope**: Held forward in the scout's outstretched lead hand, featuring polished brass tubing, brass eyepiece and objective rings, and a glinting glass lens with a bright sky reflection flare.
    - **Nimble Running Legs**: Agile stride with leather scout boots and turn-down cuffs animated in a 2-3 frame running gait with zero pedestal, keeping the silhouette grounded and fleet-footed.
    - **Scout Kit Gear**: Leather utility belt with brass buckle and a rolled cartography map scroll sealed with a crimson wax stamp.
    - **Culture Kit Detailing**:
      - `western`: Classic silver-brooched ranger cowl with trailing swallowtail cloak hem.
      - `cedar`: Red huntsman feather pinned to the hood crown.
      - `sand`: Ivory nomad headwrap sash fluttering behind.
      - `steppe`: Fur-trimmed hood rim.
      - `islands`: Marine sailor cowl with cyan sea-shell pearl brooch.
    - **Floating Reconnaissance Status Badge**: Obsidian glass pill with a glowing spyglass/eye icon and travel progress pips.
  - **March Classification & Recon Route Trails (`isScoutMarch`)**:
    - Automatically classifies scout missions (`purpose === "scout"` or `id` starting with `m_scout_`), ensuring scout marches to resource node tiles are never misclassified as gather trips.
    - **Reconnaissance Route Trails**: Renders with stealth midnight cyan glowing trail and crisp starlight core, leading to a 4-point compass rose reticle and vision eye target indicator on the destination province.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or province tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 60 tests in `@second-crown/render` (+3 new comprehensive test blocks for scout classification, meeple rendering, and multi-march board rendering).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Resource Node Dynamic Stock Piles (`bakeoff/gemini-nodes`)

- **Dynamic Resource Node Stock Piles (`packages/render/src/tokens.ts`)**:
  - Resource nodes on the isometric board now display a dedicated, material-specific stock pile beside their work station that visibly empties as the node stock drains:
    - **Woodcut (`woodcut`)**: Sturdy timber skid rails supporting stacked pine logs with dark bark and golden heartwood growth rings. Transitions dynamically across 4 volume tiers:
      - *Full (ratio >= 0.65)*: 6 logs stacked 3 tiers high with retaining end stakes and golden dust sparkle.
      - *Medium (0.35 <= ratio < 0.65)*: 4 logs stacked 2 tiers high.
      - *Low (0.10 <= ratio < 0.35)*: 2 lone logs resting flat on the skids with loose wood shavings.
      - *Depleted / Dry (ratio < 0.10)*: Zero logs; bare timber skid rails on sawdust ground with a soft pulsing amber/red depletion alert dot when empty (`ratio <= 0`).
    - **Quarry (`quarry`)**: Excavated gravel bed with dressed ashlar granite masonry blocks displaying 3D sunlit facets, shaded walls, and chisel bevels:
      - *Full (ratio >= 0.65)*: 6 dressed ashlar blocks stacked in a stepped pyramid with specular chisel glint.
      - *Medium (0.35 <= ratio < 0.65)*: 4 blocks stacked in 2 tiers.
      - *Low (0.10 <= ratio < 0.35)*: 2 lone blocks resting on gravel with loose stone rubble chips.
      - *Depleted / Dry (ratio < 0.10)*: Zero blocks; bare excavated gravel pit with chisel scoring and a pulsing depletion alert pip when empty.
    - **Field (`field`)**: Woven burlap threshing pad with plump harvest grain sacks tied with twine knots and golden wheat sprigs:
      - *Full (ratio >= 0.65)*: 5 plump harvest sacks stacked high with wheat ear highlights.
      - *Medium (0.35 <= ratio < 0.65)*: 3 sacks nestled together.
      - *Low (0.10 <= ratio < 0.35)*: 1 lone sagging sack with scattered chaff seeds.
      - *Depleted / Dry (ratio < 0.10)*: Zero sacks; bare trampled threshing cloth with a pulsing depletion alert pip when empty.
    - **Ruins (`ruins`)**: Cracked flagstones with an iron-banded treasure chest overflowing with gold bullion and jewels when stocked, or an open empty picked-clean chest when looted.
  - **Work Station Facility Landmarks (`drawResourceNode`)**:
    - Each node pairs its dynamic stock pile on the right (`cx + 5, cy + 1`) with an evocative labor landmark on the left (`cx - 5, cy`):
      - *Woodcut*: Root-flared tree stump with an embedded steel felling broadaxe and an A-frame timber sawbuck.
      - *Quarry*: Stratified granite rock wall with exposed bedrock seams and a heavy double-pointed quarry pickaxe.
      - *Field*: Standing golden wheat sheaf bundle tied with a crimson waist cord and an embedded crescent reaping sickle.
      - *Ruins*: Weathered classical stone archway with fluted column drums and cracked lintel.
  - **Stock Resolution Helper (`getNodeStockInfo`)**:
    - Resolves stock directly from sim (`nodeStock(state, provinceId)` and `nodeStockMax(p.node)`) or `state.flags[\`node_stock_${p.id}\`]`, normalizing cleanly to `ratio` in `[0, 1]`.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or province tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 57 tests in `@second-crown/render` (+4 comprehensive test blocks for stock pile tiers and node rendering).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Distinct Gather Columns vs War Marches (`bakeoff/gemini-gathers`)

- **Distinct Cart & Sack Meeple for Gather Columns (`packages/render/src/tokens.ts`)**:
  - Implemented `drawGatherColumnMeeple` giving gather columns on the isometric board a distinct, highly readable non-military meeple silhouette:
    - **Wheeled Cart Chassis**: Sturdy timber freight bed with iron corner brackets, heavy iron axle, and rolling spoked wheels with iron rim tires and bronze axle hubs that rotate with movement frames.
    - **Burlap Cargo Sacks**: Bulging woven burlap sacks with tied twine knots stacked high in the cart bed.
    - **Resource Cargo Overlays**: Dynamic visual cargo rendered atop the sacks matching destination node types:
      - `field`: Golden sheaf of wheat stalks and harvest ears.
      - `woodcut`: Rough-hewn pine logs with bark and cut rings.
      - `quarry`: Dressed ashlar granite stone blocks with chisel facets.
      - `ruins`: Gilded treasure chest with golden bullion and coin glints.
    - **Harnessed Draft Mule / Pack Animal**: Animated pack animal leading the cart in front with harness shafts, bridle straps, alert pricked ears, and a 2-3 frame walking leg gait matching column travel ticks.
    - **Culture Kit Adaptations**: Timber bed, wheel spokes, and mule harness accents dynamically adapt to regional culture palettes (`western`, `cedar`, `sand`, `steppe`, `islands`).
    - **Gather Status Pill**: Semi-transparent dark obsidian floating indicator showing active harvest progress pips (`outbound`, `gathering`, `returning`).
  - **March Classification & Distinct Trails (`isGatherMarch`)**:
    - Automatically classifies marches as gather operations (`kind === "node"`, `purpose === "gather"`, or targeting resource node provinces `field`, `woodcut`, `quarry`, `ruins`) vs military war marches (`kind === "camp"`, `kind === "hold"`).
    - **Gather Columns**: Render with soft emerald/harvest amber pastoral supply route trails and a gentle golden node harvest indicator.
    - **War Marches**: Retain tactical battle pedestals (walnut/faction ring for player, dread iron/danger ring for rival), iconic unit weapon silhouettes, high-contrast war route trails, and red targeting reticles.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or province tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 53 tests in `@second-crown/render` (+4 comprehensive test blocks for gather meeples and trails).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Isometric Hold Citizen Walkers (`bakeoff/gemini-walkers`)

- **2-3 Frame Pixel Walkers & Job Tools (`packages/render/src/walkers.ts`)**:
  - Citizens walking the isometric hold village now read as authentic 2–3 frame pixel walkers with distinct, high-contrast tools for the hold's 4 core resource works:
    - **Farm (`farm`)**: Peasant wide-brim straw sun hat with sunny crown highlight and rustic band, harvest amber tunic with rope waist twine, 3-tined forged iron pitchfork with steel tips that tilts with the stride, and a golden sheaf of harvested wheat stalks nestled on the hip.
    - **Wood (`wood`)**: Forester/huntsman felt cap with red pheasant quill feather, forest green tunic with dark leather shoulder baldric, heavy felling broadaxe with bearded iron head and razor-sharp specular steel cutting bit that flashes on the swing, and a rough-hewn pine timber log slung over the shoulder with exposed ring core.
    - **Stone (`stone`)**: Protective quarry dust cowl/hood, heavy split-cowhide mason apron with iron belt buckle over stone-grey tunic, double-pointed heavy quarry pickaxe with long curved forward piercing beak and rear chisel striker, and a hand-hewn square granite ashlar block carried on the hip with chisel highlights.
    - **Gold (`gold`)**: Royal midnight navy velvet tunic with gleaming gold waist sash and polished gold buckle, miner/assayer leather headband with glowing golden forehead reflector lamp, gilded prospector's pick with golden steel head and flashing tip, and an iron prospecting pan filled with raw gold dust, bullion bar, and an animated 2–3 frame specular gold star twinkle.
  - **Dynamic Tool Resolution (`toolForCitizen`, `resolveWalkerTool`)**:
    - Automatically links citizen jobs and work tile building types (`farm`/`granary` → farm pitchfork; `lumber_camp`/`sawmill` → wood broadaxe; `quarry`/`mason` → stone pickaxe; `gold_mine`/`mint` → gold prospector pick & pan).
    - Default presentation pool (8 citizens) rotates across all four job tools (`farm`, `wood`, `stone`, `gold`) so the hold feels active with industry from the very first tick.
  - **Culture Kit Adaptations (`drawCultureWalker`)**:
    - Supports non-western culture kits (`cedar`, `sand`, `steppe`, `tide`) by tinting tool handles and stonework with culture timber and stone palettes while preserving culture-specific headwear and cloaks.
  - **Authentic 2-3 Frame Animation Physics**:
    - Frame 0 (planted / neutral): 0px bob, legs centered under body, tools in neutral carry pose.
    - Frame 1 (forward step): 1px bob up, forward leg extends, lead arm swings forward, tool tilts into the stride catching specular light.
    - Frame 2 (opposite step): 1px bob up, opposite leg extends, lead arm swings back, tool head flashes/sparkles.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or tile click hit-testing.
  - Full test suite passes: 215 in `@second-crown/sim`, 49 in `@second-crown/render` (+5 new test blocks).
  - Clean production build in `@second-crown/app`.


- **Miniature Keeps Readability on Diamond Board (`packages/render/src/tokens.ts`)**:
  - Added ground contact footprint shadows (`0x050403`, alpha 0.62) to cleanly detach miniature keeps from textured, height-mapped 3D terrain relief.
  - Added stepped foundation plinths with crisp dark contour outlining across all culture kits.
  - Enhanced facet lighting contrast: bright sunlit left facets with corner quoins, masonry seams, and shingle highlights vs deep cool shaded right facets with vertical dividing corner seams.
  - Culture kits:
    - `western`: Heavy dressed ashlar talus plinth, granite walls with alternating corner quoins, corbelled watch bartizans with golden finials, arched portcullis gate, warm candlelit window with ambient halo, and waving swallowtail royal banner.
    - `cedar`: Riverstone plinth with individual stone outlines, golden cedar cross-lap logs, steep shake roof with shingle texture highlights, golden eagle ridgepole finials, and warm hearthfire doorway.
    - `sand`: Terraced sandstone plinth, radiant ivory limestone hold, sharp sawtooth merlons, lookout minaret turret with specular dome glint and crescent spire, and horseshoe arched portal with keystone.
    - `steppe`: Packed earthen kurgan mound with stone rim, royal felt yurt with radial tension ribs, carved timber smoke crown (*shangyrak*), crimson embroidered felt bands, and tall horsehair streamer pole.
    - `islands`: Elevated driftwood/ironwood pilings with cross-bracing, planked wharf deck, multi-tier ocean teal pavilion roof with wave-crest finial, glowing hanging sea lantern, and maritime swallowtail pennant.
    - `rival` (Iron March): Charred basalt foundation talus with corner brackets, cold gunmetal lit wall, obsidian shadow wall, spiked battlements with sharpened steel spike glints, sinister crimson eye-slit gate with dark iron backing, and waving blood-red spiked war pennant.
  - **NPC Hold Faction Escutcheons**: Mounted heraldic realm shields on NPC keep walls displaying `realmPal.pennantColor`, `realmPal.borderColor`, and `realmPal.accentColor`, making NPC holds instantly identifiable by realm at a glance without having to click them.
  - **Player Home Keep Badge**: Rendered a majestic golden coronet crest with pearl jewels above the capital keep tower.
- **Pixel Units & March Pawns Readability (`packages/render/src/tokens.ts`)**:
  - **Faction Pedestal Bases**:
    - Player columns: Turned walnut plinth with beveled base, dual-tier golden and sapphire faction ring (`0xfacc15` / `0x2563eb`), and corner golden studs.
    - Hostile (Rival) columns: Heavy spiked blackened iron pedestal with crimson danger ring (`0xdc2626`) and dark iron rivets.
  - **Iconic Unit Silhouettes across all 8 unit types**:
    - `archer`: High-visibility recurve bow held forward with taut string and nocked bodkin arrow, feathered back quiver, Robin Hood cowl with cockade feather.
    - `spearman`: Towering steel-tipped pike reaching high above the column, culture-styled heraldic shield with metallic rim and boss.
    - `skirmisher`: Poised throwing stance with steel-tipped javelin, back harness with spare javelins, off-arm target buckler.
    - `cavalry`: Muscular warhorse with animated 2-frame galloping stride, hooves, saddle caparison with golden trim, mounted armored lancer with couched lance and fluttering lance pennon.
    - `knight`: Polished silver plate armor, Greathelm with cross-visor and waving chivalric plume, heavy heraldic heater shield with golden cross, upright broadsword.
    - `siege`: Heavy timber bed with iron corner brackets, studded wheels with bronze axle hubs, A-frame gantry, pivoting throwing beam with iron counterweight and stone projectile.
    - `champion`: Billowing royal mantle with golden border, golden spiked coronet helm, and massive two-handed claymore with glowing azure runic edge and power pulse.
    - `militia`: Peasant levy tunic and coif, spiked knotty oak war club with steel studs, and banded target buckler.
  - **Hostile March Meeples**: Blackened iron dreadplate with spiked pauldrons, horned greathelm, glowing crimson eye-slit with ambient corona, jagged halberd axe head, and tattered blood-red war pennant.
  - **Floating March ETA Badge**: Dark obsidian glass background with drop shadow, sharp unit accent border, and cleanly spaced glowing progress timer dots.
  - **Route Trails**: Two-tone glowing pulse with high-contrast inner core and concentric target crosshair reticle.
- **Claimed Territory Outposts**:
  - Enhanced player outposts with ground contact shadows, detailed expedition shelter tents with entrance flaps, and waving royal swallowtail banners.
  - Enhanced NPC outposts with ground shadows, realm-colored territory flags, and iron-banded supply crates.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zooming, pan, tile clicks, building placement/upgrades, holidays, and dim lanterns remain completely preserved.
  - Full test suite passes: 214 in `@second-crown/sim`, 44 in `@second-crown/render` (+2 new test blocks).
  - Clean production build in `@second-crown/app`.

## 2026-09-21 — Gemini Lords Mobile Overworld & Height-Mapped Tiles (`bakeoff/gemini-overworld`)

- **Lords Mobile 3D Overworld Map (`packages/render`)**:
  - `terrainElevation`: Added vertical elevation thickness mapping across all 6 board terrain types: peaks tower highest (13px), hills form stepped highland contour terraces (9px), wastes feature cracked basalt cliffs (8px), woods form elevated loam embankments (6px), plains form rich sod terraces (5px), and shores meet coastal sea shelves (3px).
  - `paintTileHeightFace`: Stratified vertical cliff faces with light/shadow facets, vertical granite chisel clefts and snowmelt gullies (`peak`), horizontal sedimentary strata lines and overhanging highland sod (`hill`), dark loam and dangling gnarled tree roots (`wood`), agricultural loam and fine rootlets (`plain`), vertical basalt columns with animated pulsing molten magma fissures (`waste`), and wave-cut sandstone notches with frothing surf spray (`shore`).
  - Taller relief artwork for each terrain feature on the top plateau (towering arête mountain massifs with cirque glaciers, multi-tier evergreen pine groves with taller monarch spires, stepped contour knolls, bubbling caldera vents, and breaking coastal surf).
- **Miniature Pixel Keeps on Board Holds (`packages/render`)**:
  - `drawMiniatureKeep`: Replaced generic flat 14×11 rectangle with authentic miniature scale (`~0.42x`) pixel keeps reusing the culture kit silhouettes:
    - `western`: Ashlar stone tower with twin corner bartizans, merlon battlements, iron portcullis, candlelit high royal window, heraldic shield, and waving royal standard.
    - `cedar`: Sturdy timber longhouse keep on riverstone plinth with cross-lap logs, steep shake roof, golden eagle ridgepole finials, corner watchposts, and forest pennant.
    - `sand`: Sunbleached limestone quadrangle keep with parapet flat roof, observation minaret turret, and desert silk standard.
    - `steppe`: Circular felt-roof great hall on earthen mound with conical dome, timber door frame, and horsehair streamer standard.
    - `islands`: Elevated stilt pile-house keep on driftwood pilings with woven pavilion roof, hanging sea lantern, and ocean pennant.
    - `rival` (Iron March): Spiked blackened iron fortress keep with angular iron bastion walls, serrated spiked battlements, narrow glowing crimson eye-slit gate, and blood-red war standard.
    - Neutral/unclaimed: Weathered ancient stone keep ruins.
- **Fog as a Height Veil (`packages/render`)**:
  - `paintFogHeightVeil`: Unscouted provinces rise as billowing volumetric cloud plateaus with 3D drop shadow, shaded vapor strata in the height face, undulating cloud crests, shifting mist tendrils, and faint cartographer markings.
- **Full-Chrome Canvas Presentation (`packages/app` & `packages/render`)**:
  - `theme.css`: Removed `max-width: 560px` restriction on `.sc-map-canvas`, setting `max-width: 100%` so the canvas expands cleanly across the full chrome container (`maxWidth: 900px`).
  - `createMapRenderer`: Ensures canvas style width fills 100% dynamically without fixed pixel clamping.
- **Modular Split of `packages/render`**:
  - Split 7,921-line monolithic `index.ts` into modular, focused files:
    - `src/camera.ts`: camera viewport, zoom bands, projection, coordinate conversion, province token bounds, table rim.
    - `src/tiles.ts`: terrain elevation, height faces, fog height veil, isometric ground, rim fort navigation.
    - `src/buildings.ts`: culture palettes, theme visuals, isometric building drawers across all 21 types and 5 culture kits.
    - `src/tokens.ts`: miniature pixel keep drawers, board provinces painter, march columns, gather carts, province inspect plaque.
    - `src/walkers.ts`: citizen job mapping, destination picking, 2-3 frame animation cadence.
    - `src/index.ts`: public re-exports and MapRenderer factory.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zooming, tile clicks, building placement/upgrades, holidays, and dim lanterns remain completely preserved.
  - Full tests pass: 195 in `@second-crown/sim`, 42 in `@second-crown/render` (+4 new tests).
  - Clean build in `@second-crown/app`.

- **Hold Building Silhouettes (`packages/render`)**:
  - `walls`: Distinct interior block ramparts and rim curtain walls + parapet merlons across all 4 cultures: riverstone log palisade (`cedar`), sandstone rampart with sawtooth merlons (`sand`), rammed-earth wattle hurdle rampart with horsehair streamers (`steppe`), and coral/driftwood stilt wall (`islands`). Western ashlar stone untouched.
  - `gate`: Distinct gatehouses and arches: cedar log blockhouse (`cedar`), horseshoe-arched sandstone portal (`sand`), leather-wrapped pylon gateway (`steppe`), and driftwood/bamboo gatehouse with bamboo portcullis (`islands`). Western bastion towers untouched.
  - `chapel`: Spirit grove totem lodge (`cedar`), sandstone sun sanctuary with cupola dome (`sand`), open-sky Tengri cairn altar (`steppe`), tidal stone shrine with giant clam font (`islands`). Western gothic chapel untouched.
  - `infirmary`: Dropped generic red cross for all non-western cultures: woodland herbalist lodge with hot tub (`cedar`), bimaristan courtyard hospital with cooling fountain (`sand`), nomad shaman yurt with wormwood smoke braziers (`steppe`), slatted reef apothecary with nautilus emblem (`islands`). Western red-cross hospice untouched.
  - `siege_workshop`: Cedar logging yard ram/catapult (`cedar`), desert mangonel arsenal (`sand`), war arba wagon workshop (`steppe`), shoreline outrigger artillery dock (`islands`). Western carriage yard untouched.
  - `watchtower`: Cedar trestle lookout with beacon cage (`cedar`), sandstone minaret with observation balcony (`sand`), four-legged signal smoke pylon (`steppe`), driftwood/bamboo stilt lighthouse (`islands`). Western turret untouched.
  - `barracks`: Cedar log warrior lodge (`cedar`), colonnaded sandstone barracks (`sand`), three-yurt war camp (`steppe`), open coral/bamboo stilt pavilion (`islands`). Western soldier hall untouched.
  - `stables`: Split-rail cedar paddock (`cedar`), domed equestrian pavilion (`sand`), steppe horse paddock (`steppe`), coastal stilt pen (`islands`). Western stable untouched.
  - `archery_range`: Forest stump range (`cedar`), silk-canopied desert pavilion (`sand`), mounted nomad ring-target track (`steppe`), beachside spear deck (`islands`). Western butt range untouched.
- **Unit Silhouettes (`UnitIcon.tsx` in `packages/app`)**:
  - `archer`: Woodland marksman with flatbow (`cedar`), turban composite reflex bowman (`sand`), conical cap horn bowman (`steppe`), reed-hat daikyu bamboo marksman (`islands`).
  - `skirmisher`: Fur hood tomahawk stalker (`cedar`), keffiyeh javelin thrower with red tassels (`sand`), nomad dart outrider (`steppe`), reef diver with barbed harpoon (`islands`).
  - `cavalry`: Boreal bay charger with boar lance (`cedar`), cream Arabian courser with silk banner lance (`sand`), dun steppe pony with horsehair streamer lance (`steppe`), slate tide mount with trident polearm (`islands`).
  - `knight`: Hearthguard with antler helm and oak-leaf shield (`cedar`), Mamluk in mirror armor with sunburst sipar and shamshir (`sand`), Kheshig in lamellar coat with tamga shield and kilij (`steppe`), Tide Sentinel in pearl-shell armor with wave shield and leiomano (`islands`).
  - `siege`: Cedar log ram/trebuchet with river-stone basket (`cedar`), desert mangonel with flaming Greek fire pot (`sand`), war arba wagon cart with sandbag counterweight (`steppe`), bamboo catamaran shore catapult with volcanic pumice (`islands`).
  - `champion`: High Chieftain with antler emerald crown and radiant green blade (`cedar`), Sultan with ruby turban-crown and blazing sun-scimitar (`sand`), Khagan with winged falcon crown and lightning saber (`steppe`), Tide Sovereign with ray crown and aqua tidestrike trident (`islands`).
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` is 100% empty.
  - Western Crown Marches hold buildings, curtain walls, and army unit icons remain 100% untouched.
  - Full tests pass: 119 in `@second-crown/sim`, 38 in `@second-crown/render`.
  - `npm run build -w @second-crown/app` builds cleanly.

## 2026-09-08 — Gemini Leftover Kits: Hold Building Art, Gold Mine & Market Culture Silhouettes, Column Kits (`bakeoff/gemini-holdrest`)

- **Hold Building Art & Silhouettes (`packages/render`)**:
  - Aliased `lumber` to `lumber_camp` in `drawIsometricBuilding`: both IDs render identically across all kits.
  - Dedicated hold art for `infirmary`: half-timbered hospice hall on stone plinth, red cross emblem on front gable, steep slate roof with candlelit dormer, stone chimney with herbal hearth smoke, courtyard medicinal herb garden (lavender and red poppies), and herbalist water basin bench.
  - Bespoke culture silhouettes for `gold_mine`:
    - `cedar`: River-panning flume, heavy cedar log headframe, gravel sluice box, and nugget wash pan.
    - `sand`: Sandstone canyon adit portal with sunshade awning, rocker box dry winnower, and ore amphorae.
    - `steppe`: Alluvial gravel trench with timber shoring, nomad felt windbreak screen, golden fleece sluice trough, and ironbound spoil chest.
    - `islands`: Coastal reef/cave mine with elevated stilt flume on driftwood pilings, tidal paddle wheel, and wicker black-sand gold baskets.
    - `western`: Classic crag portal, timber headframe, ore tracks, and gold cart untouched.
  - Bespoke culture silhouettes for `market`:
    - `cedar`: Forest log trading post with cedar bark roof canopy, left stall canopy, buckskin/fur pelt rack, berry baskets, and hanging amber lantern.
    - `sand`: Desert souk grand bazaar with mudbrick base, striped crimson & desert gold silk awning, teal silk wing canopy, hanging brass lantern, spice sacks, and date palm baskets.
    - `steppe`: Nomad caravan fair with trade yurt tent canopy, arba two-wheeled trade wagon, kumis flagons, and horsehair standard.
    - `islands`: Shoreline pier market on elevated driftwood boardwalk pilings, thatched palm pavilion canopy with frond fringe, fish drying rack, and woven baskets of pearls and sea glass.
    - `western`: Classic three-canopy grand bazaar with fruit crates untouched.
  - Complete coverage: all 21 IDs from `packages/sim/src/content/buildings.ts` (`farm`, `cottage`, `lumber_camp`, `quarry`, `gold_mine`, `granary`, `sawmill`, `mason`, `market`, `mint`, `barracks`, `stables`, `archery_range`, `academy`, `siege_workshop`, `watchtower`, `chapel`, `infirmary`, `walls`, `gate`, `keep`) plus `lumber` alias render cleanly across all 5 culture kits (`western`, `cedar`, `sand`, `steppe`, `islands`).
- **Board March Columns & Gather Expeditions Culture Kits (`packages/render`)**:
  - Player march meeples (`paintBoardMarches`) dynamically resolve the player hold's active culture kit (`resolveCultureKit(playerCultureId)`):
    - `cedar`: Hooded hunter cowl, buckskin tunic, leaf-blade hunting spear, round cedar bark shield.
    - `sand`: Desert turban with havelock veil, crimson sash, slender lance with red pennon, polished brass sun buckler.
    - `steppe`: Conical spangenhelm with horsehair crest, nomad coat, horsehair collar lance, studded rawhide buckler.
    - `islands`: Woven reed war cap, teal vest, 3-pronged barbed fishing trident, turtle-shell reef buckler.
    - `western`: Classic kettle hat, royal blue tabard, ash spear, brass-boss round shield untouched.
    - Hostile Iron March columns strictly remain red/iron.
  - Gather pack-carts (`paintBoardGathers`) render culture-adapted pack-carts: split-cedar cart with foraging burlap sack (`cedar`), acacia cart with terracotta amphorae (`sand`), two-wheeled arba wagon with wool felt pack (`steppe`), coastal driftwood slip cart with reed baskets (`islands`), or classic timber cart (`western`).
  - Unit visual palette (`unitPalette`): accepts optional `cultureId` and adapts tabard, armor, and accent colors for non-western cultures while preserving default western palettes.
- **Army Visual Culture Kit Propagation (`packages/app`)**:
  - `packages/app/src/ArmyVisual.tsx`: Resolves player culture using `playerCultureId(state)` / `cultureOfRealm(state, "player")` and passes `culture={culture}` to both commander and squad formation `UnitIcon` instances.
  - `packages/app/src/AppShell.tsx`: Unified `CultureContext.Provider` wrapping `ProvinceInspect` and tab contents.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` is 100% empty.
  - Western culture visual assets remain 100% unaltered.
  - Full tests pass: 119 in `@second-crown/sim`, 37 in `@second-crown/render`.
  - `npm run build -w @second-crown/app` builds cleanly.

## 2026-09-08 — Gemini Culture Kits: Distinct Silhouettes for Cedar, Sand, Steppe & Islands (`bakeoff/gemini-kits`)

- **Culture Kit Silhouettes for Hold Buildings (`packages/render`)**:
  - Exported `resolveCultureKit(cultureId)` resolving sim IDs (`western`, `woodland`, `desert`, `steppe`, `tide`) and culture kit names (`cedar`, `sand`, `steppe`, `islands`).
  - Western Crown Marches (`western`) keeps current keep, cottage, farm, lumber, walkers, and UnitIcon 100% untouched.
  - Distinct architectural silhouette changes in `drawIsometricBuilding`:
    - **Keep**:
      - `cedar`: Sturdy timber longhouse keep on riverstone plinth with cross-lap log walls, pitched roof, and carved ridgepole.
      - `sand`: Open quadrangle courtyard keep on sunbleached limestone with flat parapet roofs and inner courtyard opening.
      - `steppe`: Nomadic circular felt-roof great hall on low earth mound with conical tent canopy, timber door frame, and smoke cowl.
      - `islands`: Elevated stilt pile-house keep on timber pilings with driftwood ladder, woven pavilion roof, and hanging sea lantern.
    - **Cottage**:
      - `cedar`: Hewn log cabin with overhanging gables and stone hearth.
      - `sand`: Flat-roof desert adobe dwelling with timber shade canopy.
      - `steppe`: Circular felt yurt/ger with domed roof, felt bands, and low door frame.
      - `islands`: Stilthouse cabin raised above ground on timber piles with reed thatch.
    - **Farm**:
      - `cedar`: Forest split-rail log fenced clearing with dark loam soil and vegetable mounds.
      - `sand`: Terraced irrigation garden with earthen bunds, central water channel, and date palm fronds.
      - `steppe`: Nomad hurdle livestock pen with steppe grasses and sheep hayrack.
      - `islands`: Tidal crop paddy with drying racks and flooded basin lines.
    - **Lumber**:
      - `cedar`: Split-rail logging yard with stacked heavy timber logs, chopping stump, and splitting axe.
      - `sand`: Desert acacia drying yard with lashed lumber poles and desert woodpile.
      - `steppe`: Nomad wagon yard with timber cart axles, wheelwright trestle, and wood sled.
      - `islands`: Coastal timber slipway with net-drying racks, boat timbers, and rope coils.
- **Hold Walkers (`packages/render`)**:
  - `drawCultureWalker`: Villagers and guards feature distinct headwear and gear silhouettes per culture kit:
    - `cedar`: Hooded hunter cowl, buckskin tunic, leaf-spear / woodsman tool.
    - `sand`: Desert turban with draped havelock veil behind, flowing linen robe, crimson sash, slender lance.
    - `steppe`: Pointed nomad cap / conical steel helmet with horsehair plume, double-breasted caftan coat, horsehair lance.
    - `islands`: Woven reed war cap / straw sun hat, sailcloth vest and rope wraps, 3-pronged barbed fishing trident.
- **Unit Icons (`packages/app/src/UnitIcon.tsx`)**:
  - `spearman`:
    - `western`: Untouched steel kettle hat, royal blue tabard over chainmail, ash pike, and round shield.
    - `cedar`: Pointed hunter cowl, fur shoulder mantle, buckskin tunic, broad leaf-blade spear, and cedar bark shield.
    - `sand`: Desert turban with fluttering havelock veil, flowing linen tunic, crimson waist sash, slender lance with red pennon, and polished brass sun buckler.
    - `steppe`: Conical spangenhelm with horsehair crest, nomad caftan coat with gold silk sash, horsehair collar lance, and studded rawhide buckler.
    - `islands`: Woven reed war cap with shell band, teal sailcloth vest, rope wrap kilt, 3-pronged barbed trident, and oval turtle-shell reef buckler.
  - `militia`:
    - `western`: Untouched homespun tunic, cloth coif, and simple wooden club.
    - `cedar`: Woodland hunter hood, buckskin tunic, and heavy carved cedar cudgel.
    - `sand`: Desert turban, flowing linen robe with hanging sash tails, and upright ironwood walking staff.
    - `steppe`: Conical felt cap with fur brim, belted nomad coat (deel), and spiked wooden cudgel.
    - `islands`: Broad-brim woven straw hat, frayed sailcloth tunic with rope belt, and carved boat paddle oar.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` is 100% empty.
  - Western culture visual assets remain 100% unaltered.
  - Full tests pass: 119 in `@second-crown/sim`, 26 in `@second-crown/render`.
  - `npm run build -w @second-crown/app` builds cleanly.

## 2026-09-07 - Astra map gathering PR

Added sim-only map gathering: outbound, loading, return and recall; three resource node profiles; reserved tiles; shared march capacity checked before troop withdrawal; decimal cargo and event-based settlement; tick-stamped action records and additive save flags. Added 11 regression cases. No app/render/server changes. Existing upkeep starvation batching limitation documented in walkthrough.md.


Newest first.

## 2026-09-07 — Gemini Crowns: Distinct NPC Hold Tokens, Culture Tints & World Log Visibility (`bakeoff/gemini-crowns`)

- **Distinct NPC Hold Tokens on Board (`packages/render`)**:
  - `paintBoardProvinces`: Every province with `node === "hold"` occupied by a non-player realm draws a distinct heraldic keep token on the board (`zoom <= 0.70`), not just Iron March.
  - Exported `realmTokenPalette(realmId)` mapping `rival`, `k_silk`, `k_ash`, `k_veil`, `k_glass`, `k_frost`, `k_tide`, `k_ember`, `k_bronze` to canonical crest colors, with deterministic hash fallback.
  - Keeps render stone plinth, corner bartizans, ashlar walls, rivets, fluttering swallowtail banner in realm colors, and heraldic seal. Iron March preserves spiked battlements. Claimed non-hold nodes render a realm claim flag.
  - `paintBoardHighlight` selection pips reflect the realm's accent color.
  - Pure exported helpers: `realmTokenPalette`, `REALM_TOKEN_PALETTES`, `isNpcHoldProvince`.
- **Player Culture Tints (`packages/render` & `packages/app`)**:
  - Reads `playerCultureId(state)` and `CULTURES` from `@second-crown/sim`.
  - Crown Marches (`western`) strictly retains 100% of the original art.
  - Cedar Kin (`cedar`), Sand Banner (`sand`), Wind Host (`steppe`), and Tide Clans (`islands`) tint:
    - Hold keep isometric building: stone walls, bartizans, plinth, lintels, heraldic shield, and royal banner.
    - Hold walkers: villager/miner/guard tunics, tool handles, spear shafts, and guard pennants.
    - `UnitIcon` across all 8 unit classes: tunics, bows/shafts, and shields/armor.
  - In `packages/app`:
    - `UnitIcon.tsx`: `CultureContext` created; `UnitIconProps` accepts optional `culture?: string`, defaulting to context or `"western"`.
    - `AppShell.tsx`: Wrapped tabs in `<CultureContext.Provider value={state ? playerCultureId(state) : "western"}>`. Choosing culture in `CrownTab` via `CulturePicker` dynamically re-tints Army rosters immediately.
    - `WarLivingStrip.tsx`: Passes player culture to player `UnitIcon`s and opponent realm culture (`cultureOfRealm(state, enemyRealmId)`) to opposing `UnitIcon`s.
- **World Log Visibility (`packages/app`)**:
  - `WorldTab.tsx`: Elevated Crown Chronicle to the top of World tab. Category filter pills (`All`, `Claims 🚩`, `Trades ⚖️`, `Wars ⚔️`, `Musters 🛡️`), formatted badges, monospace ticks (`T{e.tick}`), newest entry highlight, and scrollable container. "Holds on the Board" card displays realm crest color swatches matching board tokens.
  - `ChromeDock.tsx` & `useGameEngine.ts`: `useGameEngine` dispatches `sc-world-dispatch` on `state.flags.last_world` updates. `ChromeDock.tsx` renders a live ticker (`📜 WORLD: ...`) in the dock header bar.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` is 100% empty.
  - Tests passing: 117 in `@second-crown/sim`, 24 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).

## 2026-09-07 — Claude Hold Economy: Smaller Raids, Academy, Storehouses (`bakeoff/claude-pace`)

- **Raid haul cut (`packages/sim/src/systems/march.ts`)**: breaking a camp now pays +6 wood (was +20); clearing a woodcut/quarry/field node now pays +5 of the matching resource (was +12). Player wins still call `plantOutpost`.
- **Academy building (`packages/sim/src/content/buildings.ts`, `systems/research.ts`)**: new `academy` building type — no drip production, `wood`/`stone`/`gold` cost, `buildTicks: 130`. Horse lore research now accepts a finished `academy` **or** a finished `barracks` (`needsAny`), so existing barracks-only saves stay unlocked.
- **Storehouses (`packages/sim/src/systems/storage.ts`, new)**: `storageCap(state, res)` gives `food`/`wood`/`stone`/`gold` finite warehouses (base 200/150/150/100, raised per finished `granary`/`sawmill`/`mason`/`mint`); `addCapped` clamps production and raid payouts at the cap so overflow is lost. Chose reusing existing bulk-production buildings over adding a dedicated `storehouse` type — smaller footprint, no new render/app surface needed.
- **Tests**: new `storage.test.ts` plus additions to `march.test.ts`, `research.test.ts`, and `build.test.ts` covering cap growth, clamped gains, batching-independent determinism, the new haul amounts, and the academy fallback path.
- **Sim & App Purity**: `git diff main -- packages/app packages/render server` empty. `tickEngine.ts` untouched — no new tick rate. No new combat resolver, no new unit types. Full `@second-crown/sim` suite (104 tests) and `npm run build -w @second-crown/app` pass.

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
