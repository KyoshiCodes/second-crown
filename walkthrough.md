# Walkthrough — Gemini Remaining Silhouettes: Hold Buildings & Army Units (`bakeoff/gemini-remain`)

This PR completes the Gemini remaining-silhouettes lane:
1. **Hold Building Silhouettes (`packages/render`)**:
   - `walls` (both interior blocks and rim curtain walls + parapet merlons).
   - `gate` / gatehouse towers (both interior and rim configurations).
   - `chapel` (spirit groves, sun sanctuaries, sky altars, tide shrines).
   - `infirmary` (dropped the generic red cross for non-western kits: woodland herbalist, bimaristan apothecary, shaman yurt, reef apothecary).
   - `siege_workshop` (logging yard rams, desert mangonel arsenal, war arba wagon yards, shore catapult decks).
   - `watchtower` (trestle lookout, desert minaret, signal smoke pylon, stilt lighthouse).
   - `barracks` (warrior log lodge, shaded colonnade barracks, war yurt compound, coral stilt pavilion).
   - `stables` (boreal corral, Arabian horse pavilion, steppe herd paddock, coastal beast stilt pen).
   - `archery_range` (forest stump range, sunburst silk pavilion, mounted ring-target track, shoreline spear deck).
2. **Unit Silhouettes (`UnitIcon.tsx` in `packages/app`)**:
   - `archer` across `cedar`, `sand`, `steppe`, `islands`, and `western`.
   - `skirmisher` across `cedar`, `sand`, `steppe`, `islands`, and `western`.
   - `cavalry` across `cedar`, `sand`, `steppe`, `islands`, and `western`.
   - `knight` across `cedar`, `sand`, `steppe`, `islands`, and `western`.
   - `siege` across `cedar`, `sand`, `steppe`, `islands`, and `western`.
   - `champion` (including named heroes like Suki) across `cedar`, `sand`, `steppe`, `islands`, and `western`.
3. **Preservation & Invariants**:
   - Western Crown Marches stays 100% untouched.
   - `git diff main -- packages/sim server` is 100% empty.
   - `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` all pass cleanly.

---

## Changes Made

### 1. Hold Building Silhouettes (`packages/render/src/index.ts`)

- **Rim Curtain Walls & Gatehouse Wings (`drawRimWallCurtain`, `drawGatehouseCurtainWings`)**:
  - `cedar`: Heavy riverstone foundation plinth with cross-lapped cedar log palisade parapet, sharpened stake merlons, and bark-shingle gangway decking.
  - `sand`: Dressed sandstone rampart with stepped sawtooth merlons, terracotta crenel coping, and crimson fabric pennants.
  - `steppe`: Compacted rammed-earth rampart revetted with bound wattle hurdles, timber palisade stakes, and horsehair streamer posts.
  - `islands`: Coral-stone foundation block with mangrove and driftwood stilt palisade, bamboo cane merlons, and woven palm gangway.
  - `western`: Classic ashlar stone curtain with crenellated stone merlons untouched.

- **Hold Building Drawing Functions**:
  - `drawInteriorWallCulture`: Log stockade (`cedar`), sandstone rampart (`sand`), hurdle rampart (`steppe`), coral stilt wall (`islands`).
  - `drawGateCulture`: Heavy timber blockhouse with totem lintel (`cedar`), monumental sandstone portal with horseshoe arch and brass studding (`sand`), twin pylon gateway bound in boiled leather with horsehair standards (`steppe`), driftwood and bamboo gatehouse with suspended bamboo portcullis (`islands`).
  - `drawChapelCulture`: Spirit grove totem lodge with carved antler finials (`cedar`), open-air sandstone sun sanctuary with gold cupola dome (`sand`), open-sky stone cairn altar (Tengri shrine) with prayer ribbon posts (`steppe`), tidal stone shrine with giant clam shell baptismal font (`islands`).
  - `drawInfirmaryCulture`: Woodland herbalist lodge with hot soaking tub and leaf emblem (`cedar`), desert bimaristan courtyard hospital with cooling fountain and mortar emblem (`sand`), nomad shaman yurt with wormwood smoke braziers and sun-wheel emblem (`steppe`), slatted reef apothecary on stilts with nautilus shell emblem (`islands`). Dropped generic red cross for all non-western cultures.
  - `drawSiegeWorkshopCulture`: Woodland logging yard with heavy battering ram carriage and catapult framework (`cedar`), desert arsenal yard with traction mangonel and Greek fire pots (`sand`), nomad war arba wagon workshop with swivel ballista (`steppe`), shoreline outrigger shipyard with naval harpoon artillery (`islands`).
  - `drawWatchtowerCulture`: Heavy cedar trestle lookout tower with iron beacon brazier cage (`cedar`), slender sandstone minaret with openwork arched observation balcony (`sand`), four-legged timber beacon pylon with smoke signal platform (`steppe`), driftwood and bamboo elevated shore beacon / stilt lighthouse (`islands`).
  - `drawBarracksCulture`: Sturdy cedar log warrior lodge with crossed halberd crest (`cedar`), colonnaded sandstone barracks with sunshade canopy (`sand`), three-yurt circular military camp with clan battle standard (`steppe`), open slatted bamboo and coral stilt pavilion (`islands`).
  - `drawStablesCulture`: Split-rail cedar paddock with log shelter and hayrack (`cedar`), domed sandstone equestrian pavilion with silk shade awnings (`sand`), expansive steppe horse paddock with hitching rails (`steppe`), coastal coral and bamboo stilt pen with palm shade (`islands`).
  - `drawArcheryRangeCulture`: Forest shooting clearing with log firing benches and tree stump targets (`cedar`), desert shooting pavilion under crimson silk canopy with gold sunburst targets (`sand`), mounted nomad archery track with ring targets atop poles (`steppe`), beachside shooting deck over tide with woven reed fish-basket targets (`islands`).

### 2. Unit Silhouettes (`packages/app/src/UnitIcon.tsx`)

Added bespoke non-default culture branches for all 6 remaining units while keeping Western Crown Marches 100% untouched:
- **`archer`**:
  - `cedar`: Woodland marksman in dark green hooded cowl, buckskin tunic, recurved cedar flatbow, and birch bark quiver.
  - `sand`: Desert composite bowman in flowing turban havelock, linen kaftan, reflex horn bow with sinew wraps, and crimson sash quiver.
  - `steppe`: Nomad composite archer in conical felt cap with earflaps, double-breasted caftan, asymmetric steppe horn bow, and hip quiver.
  - `islands`: Island marksman in woven reed conical hat, sailcloth kilt, and asymmetrical bamboo longbow (daikyu style).
- **`skirmisher`**:
  - `cedar`: Forest stalker in fur hood and buckskin tunic, wielding a flint throwing axe / tomahawk and cedar hide buckler.
  - `sand`: Desert skirmisher in keffiyeh face wrap, throwing javelins with crimson tassels, and polished brass sun buckler.
  - `steppe`: Nomad outrider in felt skullcap, throwing darts with horsehair tufts, and painted boiled-leather buckler.
  - `islands`: Reef diver in shell headband, barbed fishing harpoon with braided cord, and woven reef buckler.
- **`cavalry`**:
  - `cedar`: Sturdy dark bay boreal charger with forest green barding, rider in fur mantle and hooded helm wielding a cedar boar lance with green swallowtail pennon.
  - `sand`: Swift cream Arabian desert courser with crimson saddle cloth and gold tassels, rider in turban and billowing robes with slender desert lance and banner.
  - `steppe`: Hardy dun steppe pony with hogged dark mane and high-cantle felt saddle, nomad rider in conical spangenhelm with horsehair streamer lance.
  - `islands`: Slate coastal tide mount with sea-grass and cowrie shell saddle pad, rider in sea-crested helm with barbed trident lance.
- **`knight`**:
  - `cedar`: Cedar Hearthguard in blackened steel and ironwood plate, bear-fur mantle, antler-browed nasal helm, heavy cedar kite shield with golden oak-leaf crest, and broadsword with emerald pommel.
  - `sand`: Mamluk Champion in gilded chahar-aina mirror armor over crimson mail, conical turban-helmet with steel spike and mail aventail, brass sunburst sipar shield, and curved shamshir.
  - `steppe`: Steppe Kheshig in lacquered steel and leather lamellar coat of plates, fluted spangenhelm with horsehair tail and cheek plates, teardrop cavalry shield with golden tamga, and curved kilij saber.
  - `islands`: Tide Sentinel in laminated pearl-shell and coconut-fiber cuirass, sea-crested helm with iridescent plumage, octagonal sea-oak shield with wave spiral, and shark-tooth broadsword (leiomano).
- **`siege`**:
  - `cedar`: Heavy peeled log carriage on rough wooden disc wheels, hemp-lashed cedar A-frame, log throwing arm with river-stone counterweight basket, and evergreen camouflage.
  - `sand`: Sun-bleached desert timber frame on bronze spoked wheels, horseshoe-arched strut tower, throwing arm with flaming Greek fire / pitch pot glowing orange.
  - `steppe`: Nomad war arba wagon chassis on high wooden spoked wheels, birch pylons with horsehair battle knot, and heavy traction throwing beam with sandbag counterweight.
  - `islands`: Bamboo and driftwood catamaran chassis on coral rollers, double-bamboo A-frame with sennit lashings, and mangrove throwing arm with flaming volcanic pumice stone.
- **`champion`**:
  - `cedar`: High Chieftain in verdigris bronze and ironwood plate, magnificent stag antler crown with glowing green emerald, bear-fur mantle, and radiant emerald-glowing ancestor blade.
  - `sand`: Desert Sultan / Sun Warden in gold-damascened mirror plate with sunburst star, turban-crown with ruby aigrette, royal crimson mantle with gold hem, and blazing sun-scimitar.
  - `steppe`: Great Khagan in blackened steel and imperial gold lamellar cuirass, winged falcon crown with crimson plume, flying Tengri sky-cape, and lightning-blue saber of the Khans.
  - `islands`: Tide Sovereign in shimmering mother-of-pearl scaled armor with coral gems, radiating golden ray crown of pearls and kingfisher feathers, foam-teal cloak, and luminous Tidestrike trident.

---

## Verification & Invariants

1. **Sim Purity**:
   - `git diff main -- packages/sim server`: 100% empty (0 lines changed).
2. **Tests & Build**:
   - `npm test`: 38 test files, 119 tests pass in `@second-crown/sim`.
   - `npm run test -w @second-crown/render`: 38 tests pass in `@second-crown/render` (including comprehensive suite exercising walls, gates, chapel, infirmary, siege_workshop, watchtower, barracks, stables, archery_range, and all unit types across all 5 kits).
   - `npm run build -w @second-crown/app`: `tsc -b && vite build` built cleanly in 4.5s.
3. **Western Preservation**:
   - Western Crown Marches hold buildings, curtain walls, and army unit icons remain 100% untouched.



