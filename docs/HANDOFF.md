# HANDOFF

Bakeoff Gemini Academy lane delivered on branch `bakeoff/gemini-academy` (PR into main unmerged).

- **Distinct Isometric Academy & Polished Siege Workshop (`packages/render`)**:
  - `drawIsometricBuilding` now provides a dedicated, distinguished architectural showcase for `case "academy":`:
    - Flared sandstone ashlar plinth (`0x475569` / `0x334155`), warm limestone dual-facet masonry walls (`0xf1f5f9` / `0x94a3b8`), buttress pilasters, and horizontal carved stringcourse.
    - Arched cloister arcade entrance with twin marble columns with capitals, classical pediment, and stone entrance steps.
    - Deep Gothic library casement windows glowing with warm honey candlelight (`0xfef08a` / `0xfde047`) and diamond mullion lattices with animated candle flicker.
    - Steep regal sapphire hipped slate roof (`0x1e3a8a`) with gilded ridge coping, elevated stone observatory cupola with aged verdigris copper dome (`0x0f766e`), and fluttering blue/gold scholar gonfalon (`0x2563eb`).
    - Rooftop astronomical astrolabe / armillary sphere with central brass globe and rotating celestial armillary rings (`Math.sin(phase * 2.8)`).
    - Forecourt scholarly vignette: stone reading lectern with open illuminated vellum folio with ink script, brass celestial globe on tripod stand, and manuscript scroll bins.
    - Level boost scaling (`heightBoost = (lvl - 1) * 3`), foundation gold pips, and holiday dressings across all seasons.
  - `case "siege_workshop":` completely overhauled from a generic flat polygon box into a true heavy siege ordnance yard:
    - Heavy oak timber framing with iron joint straps, rafter canopy, and timber A-frame gantry crane with pulley wheel and hoist rope.
    - Master Engineer's drafting shelter with blue vellum blueprint draft (`0x0284c7`) and brass calipers.
    - Assembled heavy trebuchet: wheeled timber carriage on four spoked wooden wheels with iron rims, cross-braced A-frame trestles, bronze pivot axle, heavy tapered oak throwing arm angled skyward, iron-riveted counterweight box with steel rivets, and sling release hook.
    - Ordnance supplies: chained pyramid of carved granite siege boulders, smoldering forge hearth with glowing orange/yellow hot embers, iron anvil, and ball-peen hammer.
- **Scriptorium Lectern / Study Card (`packages/app`)**:
  - `ResearchBar.tsx`: Overhauled from two raw `<button>`s into an illuminated medieval study card (`sc-realm-card sc-research-lectern`).
  - Reads resource costs and requirements dynamically from `@second-crown/sim`'s exported `RESEARCH[id].cost` and `RESEARCH[id].needs`, never hardcoding values.
  - Displays resource cost chips with clear real-time affordability indicators (`canAfford`).
  - Features miniature pixel walker silhouettes from `UnitIcon` next to unit unlock badges (Cavalry & Knight for horse; Siege Engine for siege).
  - Clean state transitions: gilded seal when Mastered, animated progress bar with countdown when studying, and action button with disabled reason tooltips when not started.
- **Board Outpost Flags & Gather Expedition Compatibility Stub (`packages/render`)**:
  - `paintBoardProvinces`: Differentiates player home hold from player outposts (`p.occupantRealmId === "player" && p.id !== state.board.homeProvinceId`).
    - Player Home Hold retains the grand gilded royal frame with corner studs, golden crown emblem, and golden halo pulse.
    - Player Outposts (captured camps and field tiles) render a dedicated **Outpost / Flag Token**: royal blue & gold border trim (`0x2563eb` / `0xfacc15`), 4 corner brass pins, stone cairn anchor, tall wooden flagpole with brass ball finial, waving royal player swallowtail standard (`0x1e40af` with gold heraldic insignia), field bivouac tent, and bottom "OUTPOST" plaque.
  - `listGathersPresentation` and `paintBoardGathers`: Safely checks for gather expeditions without modifying sim. Stubs green foraging route trails and pack-cart gatherer pawns when gathers are present, gracefully skipping when Astra's lane is unmerged.
  - Exported pure helpers `isOutpostProvince` and `listGathersPresentation` for testing and UI modularity.
- **Automated Tests**:
  - Added unit test suite in `packages/render/src/index.test.ts` for `isOutpostProvince` and `listGathersPresentation`.
  - All 20/20 render tests pass; all 93/93 sim tests pass.
  - App production build clean (`npm run build -w @second-crown/app`).
- **Sim & Server Purity**:
  - `git diff main -- packages/sim server` is strictly empty. No combat math, march formulas, or server endpoints changed.
  - All existing features preserved: zoom/pan, inspect/scout, holidays, dim lanterns, pixel army icons.

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

