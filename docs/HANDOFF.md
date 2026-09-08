# HANDOFF

Bakeoff Gemini Culture Kits lane delivered on branch `bakeoff/gemini-kits` (PR into main unmerged).

- **Culture Kit Silhouettes for Hold Buildings (`packages/render`)**:
  - `resolveCultureKit(cultureId)` exported: maps sim culture IDs (`western`, `woodland`, `desert`, `steppe`, `tide`) and aliases (`cedar`, `sand`, `steppe`, `islands`) to canonical `CultureKit` keys.
  - Crown Marches (`western`) keeps current keep, cottage, farm, lumber, walkers, and UnitIcon 100% untouched.
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

---

Bakeoff Gemini Crowns lane delivered on branch `bakeoff/gemini-crowns` (PR into main unmerged).

- **NPC Hold Tokens on Board (`packages/render`)**:
  - `paintBoardProvinces`: Every province occupied by another realm with `node === "hold"` draws a distinct keep token on the board (`zoom <= 0.70`), not just Iron March.
  - Reuses existing flavor colors and names via `realmTokenPalette(realmId)`: Iron March (`rival`), Silk Road (`k_silk`), Ash Kingdom (`k_ash`), Veil Sanctuary (`k_veil`), Glass Shore (`k_glass`), Frost Reaches (`k_frost`), Tide Clans (`k_tide`), Ember Wastes (`k_ember`), Bronze Horn (`k_bronze`), with deterministic hash fallback.
  - Renders stone walls, corner bartizans, plinth, rivets, animated fluttering swallowtail banner in realm colors, and seal. Iron March preserves spiked battlements. Claimed non-hold nodes render a distinct realm claim flag.
  - Highlight pips in `paintBoardHighlight` reflect the realm's accent color.
  - Pure exported helpers: `realmTokenPalette`, `REALM_TOKEN_PALETTES`, `isNpcHoldProvince`.
- **Player Culture Tints (`packages/render` & `packages/app`)**:
  - Reads `playerCultureId(state)` and `CULTURES` from `@second-crown/sim`.
  - Crown Marches (`western`) strictly retains 100% of the original art.
  - Cedar Kin (`cedar`), Sand Banner (`sand`), Wind Host (`steppe`), and Tide Clans (`islands`) tint:
    - Hold keep isometric building: walls, bartizans, plinth, lintels, heraldic shield, and royal banner.
    - Hold walkers: villager/miner/guard tunics, tool handles, spear shafts, and pennants.
    - UnitIcon across all 8 unit classes: tunics, bows/shafts, and shields/armor.
  - In `packages/app`:
    - `UnitIcon.tsx`: `CultureContext` created; `UnitIconProps` accepts `culture?: string`, defaulting to context or `"western"`.
    - `AppShell.tsx`: Wrapped tabs in `<CultureContext.Provider value={state ? playerCultureId(state) : "western"}>`. Choosing culture in `CrownTab` via `CulturePicker` dynamically re-tints Army rosters immediately.
    - `WarLivingStrip.tsx`: Passes player culture to player `UnitIcon`s and opponent realm culture (`cultureOfRealm(state, enemyRealmId)`) to opposing `UnitIcon`s.
- **World Log Visibility (`packages/app`)**:
  - `WorldTab.tsx`: Elevated Crown Chronicle to the top of World tab. Category filter pills (`All`, `Claims 🚩`, `Trades ⚖️`, `Wars ⚔️`, `Musters 🛡️`), formatted badges, monospace ticks (`T{e.tick}`), newest entry highlight, and scrollable container. "Holds on the Board" card displays realm crest color swatches matching board tokens.
  - `ChromeDock.tsx` & `useGameEngine.ts`: `useGameEngine` dispatches `sc-world-dispatch` on `state.flags.last_world` updates. `ChromeDock.tsx` renders a live ticker (`📜 WORLD: ...`) in the dock header bar.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` is 100% empty.
  - Full `@second-crown/sim` test suite (117 tests) and `@second-crown/render` test suite (24 tests) pass.
  - `npm run build -w @second-crown/app` passes cleanly.

---

Bakeoff Claude Pace lane delivered on branch `bakeoff/claude-pace` (PR into main unmerged).

- **Raid haul cut (`packages/sim/src/systems/march.ts`)**: camp break payout cut from +20 wood to +6; woodcut/quarry/field node payouts cut from +12 to +5 of the matching resource. Player wins on both paths still call `plantOutpost(state, dest)`.
- **Academy building (`packages/sim/src/content/buildings.ts`)**: new `BUILDING_TYPES.academy` entry — `productionPerTick: {}` (no drip income), cost `{ wood: 24, stone: 20, gold: 12 }`, `buildTicks: 130`.
- **Horse lore fallback (`packages/sim/src/systems/research.ts`)**: `RESEARCH.horse.needsAny` is now `["academy", "barracks"]` (was a single required `barracks`); a finished academy or a finished barracks either one unlocks the research, so existing barracks-only saves are never soft-locked. `RESEARCH.siege` kept its single-requirement shape (`needsAny: ["siege_workshop"]`).
- **Storehouses (`packages/sim/src/systems/storage.ts`, new file)**: `storageCap(state, res)` — finite warehouse ceilings for `food`/`wood`/`stone`/`gold` only (base 200/150/150/100), raised by +300/+250/+250/+150 per finished `granary`/`sawmill`/`mason`/`mint` respectively (chosen over a new `storehouse` building type — smaller footprint, no new build-menu/render surface). `addCapped(state, res, amount)` adds a gain clamped at the cap (excess lost); spends pass through uncapped. Wired into `EconomySystem.advanceAnalytic` (building production, both the per-tick and fast-forward paths) and into the camp/node raid payouts in `march.ts`. Deliberately not applied to spoils (iron/banners/relics), trade, tithe, or quest rewards — out of this lane's "production and raid payouts" scope.
- **Determinism**: capping is a monotonic `min(current + gain, cap)` clamp on non-negative credits, so splitting a production window into smaller sub-windows (as `TickEngine.settleTicks` does when it interleaves single ticks and analytic jumps) yields the identical final resource value as one big window — verified in `storage.test.ts`.
- **Invariants & Preservations**:
  - `git diff main -- packages/app packages/render server` is 100% empty. No app, render, or server files touched.
  - `packages/sim/src/core/tickEngine.ts` untouched — no second tick rate.
  - `resolveBattle` (`systems/combat.ts`) and `UNIT_TYPES` (`content/units.ts`) untouched — no second combat resolver, no new unit types.
  - Full `@second-crown/sim` test suite (104 tests, 93 pre-existing + 11 new) and `npm run build -w @second-crown/app` (`tsc -b && vite build`) pass.

---

Bakeoff Gemini Army lane delivered on branch `bakeoff/gemini-army` (PR into main unmerged).

- **Pixel Walker Style for Army Tab Roster & Visuals (`packages/app`)**:
  - `UnitIcon.tsx`: Replaced flat chip portraits with authentic integer-pixel silhouettes in the exact aesthetic of hold walkers and buildings. Supports 2–3 frame animated marching/idle cadence (`0 -> 1 -> 0 -> 2`), facing (`facing = 1 | -1`), tabard colors, and weapons matching each class:
    - **Militia**: Spear-less levy peasant with homespun coarse tunic (`#854d0e`), rope belt (`#a16207`), cloth coif (`#52525b`), unarmed/cudgel posture.
    - **Spearman**: Steel kettle hat (`#94a3b8` / `#cbd5e1`), royal blue tabard (`#1e40af`), long ash pole with gleaming steel spearhead (`#f1f5f9`), and round boss shield (`#1e3a8a` / `#facc15`).
    - **Skirmisher**: Scout green coat (`#15803d`), leather coif (`#5c3818`), throwing javelins with iron barb (`#cbd5e1`), and arm buckler.
    - **Archer**: Deep forest coat (`#14532d`), feathered cap with quill (`#facc15`), recurve yew longbow (`#854d0e`), taut bowstring, nocked arrow, and back quiver.
    - **Cavalry**: Warhorse mount (`#6b3a19`) with animated galloping legs, leather saddle, reins, and mounted armored lancer with royal blue tunic, steel helm, and pennant.
    - **Knight**: Full steel plate harness (`#cbd5e1`), great helm with visor eye-slit (`#0f172a`), heraldic crimson heater shield (`#b91c1c`) with golden cross (`#facc15`), steel broadsword, and red mantle.
    - **Siege Engine**: Sturdy timber chassis (`#5c3818`), spoked wooden wheels with iron rims, upright A-frame trestle, and throwing beam with counterweight bucket and granite boulder.
    - **Champion**: Radiant gilded plate (`#f59e0b`), winged royal crown helm (`#fde047`), Tyrian purple tabard (`#581c87`), glowing runic broadsword (`#38bdf8`), and flowing crimson cape.
  - `ArmyTab.tsx`: Redesigned training roster from basic text buttons into rich roster cards featuring animated pixel silhouettes, power badges, training costs, and flavor blurbs. Dedicated Champion recruitment card with gilded champion silhouette, name customization, and recruitment actions.
  - `ArmyVisual.tsx`: Raised companies in "Your Host" display the animated pixel silhouettes alongside company counts, total combat power, and lively multi-unit squad formations marching in 2–3 frame cadence.
  - `ProvinceInspect.tsx`: Column composer rows include mini unit pixel silhouettes next to each unit count.
- **Board Meeple Reuse for Marching Columns (`packages/render`)**:
  - `primaryUnitTypeForMarch(march)`: Pure sim-reading helper exported from `@second-crown/render` that resolves the primary unit type for any column based on `march.force` counts and tier priority (champion > siege > knight > cavalry > archer > skirmisher > spearman > militia).
  - `unitPalette(typeId)`: Pure palette/gear helper exported from `@second-crown/render` providing matching tabard, armor, weapon, and helm properties for all 8 unit types.
  - Tabletop board marching meeples (`paintBoardMarches`) now render player columns using the exact same sprites, colors, weapons, and 2–3 frame stride cadence as the Army tab. An archer column looks like an archer on the march; a knight column marches with great helm and heater shield; cavalry trots with a warhorse mount; siege engines roll on spoked wheels.
  - Hardwood pedestal, contact shadow, destination trail, and floating ETA pill badge are fully preserved.
  - Hostile marches strictly preserve their menacing red/iron war meeple with horned helm and glowing crimson visor.
- **Invariants & Preservations**:
  - Presentation only: `git diff main -- packages/sim server` is 100% empty. No combat math, march durations, or server endpoints changed.
  - All features preserved: ChromeDock, holidays, dim lanterns, inspect card, primer, zoom/pan.
  - Full automated tests pass: 90/90 in `@second-crown/sim`, 18/18 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).

---

Bakeoff Claude lane delivered on branch `bakeoff/claude-walls` (PR into main unmerged).

- **`listRimForts(state, realmId = "player")` (`packages/sim/src/systems/rimForts.ts`)**: returns `{ x, y, kind: "wall" | "gate" }[]` for finished (`completesAtTick === null`) `walls`/`gate` buildings on the 16×10 hold rim (`x===0 || y===0 || x===15 || y===9`), sorted walking the rim clockwise from `(0,0)` (top L→R, right T→B, bottom R→L, left B→T) so `@second-crown/render` can stroke a connected ring without recomputing the walk order.
- Exported from `packages/sim/src/index.ts` alongside a new `RimFort` type.
- New tests in `packages/sim/src/systems/rimForts.test.ts`: empty rim, mixed walls+gate sorted clockwise, and interior walls / unfinished buildings / other realms excluded.
- Pure sim helper only. `git diff main -- packages/app packages/render server` is empty. No combat, march, fog, or housing changes. Full `@second-crown/sim` test suite (90 tests) and the app build (`tsc -b && vite build`) pass.

---

Bakeoff Gemini Map delivered on branch `bakeoff/gemini-map` (PR into main unmerged).

- **Connected Rim Wall Run on the Hold (`packages/render`)**:
  - Automatically queries finished rim fort structures (`listRimForts` if exported from `@second-crown/sim`, otherwise reading `state.buildings` using the matching 16×10 rim rule: `gx === 0 || gy === 0 || gx === 15 || gy === 9` ordered clockwise).
  - Connects neighboring rim forts (walls and gate) with a continuous stone curtain wall:
    - Foundation plinth, ashlar stone curtain faces (illuminated sunlit faces on South-West edges, shaded faces on South-East edges).
    - Horizontal mortar scoring lines, stone wall-walk walkway with timber planking center line.
    - Crenellated stone merlons along the outer parapet with coping highlights.
    - Arrow loop slits in the curtain face and center bastion towers with animated flickering wall torch sconces.
    - Corner bastion towers anchoring the four perimeter corners `(0,0)`, `(15,0)`, `(15,9)`, `(0,9)`.
  - Gatehouses sit flush in the gap: flanking bastion towers connect seamlessly to adjacent curtain spans while retaining heavy reinforced double oak doors, iron strap hinges, portcullis teeth, and defensive pennant.
  - Interior walls (`!isRimTile`) strictly preserve the original isometric block visual.
  - Tile clicks and building placement/upgrade contracts remain 100% intact.
- **Stronger 8×6 Terrain Chips on the Board Band (`packages/render`)**:
  - All 6 tabletop province terrain chips redesigned to read instantly at 0.58 zoom (Peak, Shore, Wood, Waste, Hill, Plain).
- **Invariants & Preservations**:
  - Pure presentation lane: `git diff main -- packages/sim server` is 100% empty.
  - Fog chips, hostile red meeple, cottage art, zoom/pan, ChromeDock, and dim lanterns completely preserved.

---

W16 Claude War tab briefing delivered on branch `bakeoff/claude-war2` (PR into main unmerged).
- War tab now opens with a single "Briefing" card readable in ~20 seconds:
  - **Incoming**: one line per hostile march bound for your hold — name (only once a Watchtower is built, otherwise "Unknown host") and ETA in seconds — followed by current Wall HP and whether the gate is up or down.
  - **Wounded**: wounded count vs. infirmary beds, with a "Treat (4 food)" button (`tryTreatWounded`) disabled when nobody is wounded.
  - **People**: population vs. housing cap (`housingCap`).
- New pure-function exports from `@second-crown/sim`: `gateOnRim`, `gateHp`. No combat math, march formulas, or fog rules changed.
- `git diff main -- packages/sim/src/core` is empty.

---

Bakeoff Gemini lane delivered on branch `bakeoff/gemini-board2` (PR into main unmerged).
- Distinct Isometric Cottage & Gatehouse (`packages/render`): cottage with reed thatch and curled hearth smoke, gatehouse with rim detection, double doors, iron straps, portcullis, and faction pennant.
- Board Fog Chips: Unseen provinces rendered as blank parchment chips with dark vellum bevels and drifting fog curves.
- Hostile Red/Iron March Meeple: Imposing red/iron war meeple pawn with horned helm and glowing visor slit for non-player marches.

---

W3 Gemini two-band camera delivered on branch `bakeoff/gemini-board-cam` (PR into main unmerged).
- Two camera bands on existing Pixi canvas: Hold (`zoom > 0.70`) vs Board (`zoom <= 0.70`).
- Tabletop 8×6 board tokens rendered from `state.board.provinces`.
- Active player march displays animated tabletop marching meeple pawn with amber route path.

