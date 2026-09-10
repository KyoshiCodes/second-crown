# CHANGELOG

## 2026-09-10 — Gemini Remaining Silhouettes: Hold Buildings & Army Units (`bakeoff/gemini-remain`)

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
