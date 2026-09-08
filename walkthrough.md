# Walkthrough — Gemini Leftover Kits: Hold Building Art, Gold Mine & Market Culture Silhouettes, Column Kits (`bakeoff/gemini-holdrest`)

This PR completes the Gemini leftover-kits lane:
1. Hold building art for all real IDs in `packages/sim/src/content/buildings.ts`.
2. Aliased `lumber` to `lumber_camp` in `drawIsometricBuilding`.
3. Dedicated hold art for `infirmary`.
4. Bespoke culture silhouettes for `gold_mine` across `cedar`, `sand`, `steppe`, `islands`, and `western`.
5. Bespoke culture silhouettes for `market` across `cedar`, `sand`, `steppe`, `islands`, and `western`.
6. Tabletop board march meeples and gather pack-carts adapt active culture kits.
7. Army roster unit icons propagate the realm's active culture.
8. Comprehensive render test coverage across all 21 IDs + `lumber` across all 5 kits.

---

## Changes Made

### 1. Hold Buildings & Cultural Silhouettes (`packages/render`)

- **Alias `lumber` to `lumber_camp`**:
  - `case "lumber": case "lumber_camp":` in `drawIsometricBuilding` ensures both canonical and alias IDs render identically across all 5 culture kits.
- **Dedicated Infirmary Art**:
  - `case "infirmary":` field hospital hospice hall on stone plinth foundation, half-timbered plaster walls, red cross healer emblem on the front gable, steep slate roof with glowing candlelit dormer, stone chimney with herbal hearth smoke, courtyard medicinal herb garden (lavender & red poppies), and herbalist washbasin bench.
- **Gold Mine Culture Silhouettes (`drawGoldMineCulture`)**:
  - **Cedar Kin (`cedar`)**: Forest river-panning flume, heavy cedar log headframe, gravel sluice box, and nugget wash pan.
  - **Sand Banner (`sand`)**: Desert sandstone canyon adit portal with sunshade canopy awning, rocker box dry winnower, and ore amphorae.
  - **Wind Host (`steppe`)**: Alluvial gravel trench with timber shoring, nomad felt windbreak screen, golden fleece sluice trough, and ironbound nugget chest.
  - **Tide Clans (`islands`)**: Coastal reef cave mine with elevated stilt flume on driftwood pilings, tidal paddle wheel, and woven black-sand gold baskets.
  - **Western Crown Marches (`western`)**: Classic crag portal, timber headframe, ore tracks, and gold ore cart untouched.
- **Market Culture Silhouettes (`drawMarketCulture`)**:
  - **Cedar Kin (`cedar`)**: Forest log trading post with cedar bark roof canopy, side shelter, buckskin & fur pelt racks, wild berry baskets, and amber lantern.
  - **Sand Banner (`sand`)**: Desert souk bazaar with mudbrick base, striped crimson & desert gold silk awnings, teal wing canopy, hanging brass lamp, spice sacks, and date baskets.
  - **Wind Host (`steppe`)**: Nomad caravan fair with trade yurt canopy, two-wheeled arba trade wagon, kumis flagons, and clan standard.
  - **Tide Clans (`islands`)**: Boardwalk pier market on driftwood pilings, thatched palm pavilion canopy, dried fish racks, and woven baskets of pearls and sea glass.
  - **Western Crown Marches (`western`)**: Classic three-canopy grand bazaar with fruit crates untouched.
- **Complete Building Type Coverage**:
  - All 21 IDs from `packages/sim/src/content/buildings.ts` (`farm`, `cottage`, `lumber_camp`, `quarry`, `gold_mine`, `granary`, `sawmill`, `mason`, `market`, `mint`, `barracks`, `stables`, `archery_range`, `academy`, `siege_workshop`, `watchtower`, `chapel`, `infirmary`, `walls`, `gate`, `keep`) plus `lumber` execute cleanly without throwing across all 5 culture kits.

### 2. Tabletop Board Column & Expedition Kits (`packages/render`)

- **March Columns (`paintBoardMarches`)**:
  - Friendly player march columns dynamically resolve `kit = resolveCultureKit(playerCultureId)`:
    - **Cedar**: Hunter cowl, buckskin tunic, leaf-blade hunting spear, round cedar bark shield.
    - **Sand**: Desert turban with fluttering havelock veil, crimson sash, slender lance with red pennon, polished brass sun buckler.
    - **Steppe**: Conical spangenhelm with horsehair crest, nomad caftan, horsehair collar lance, studded rawhide buckler.
    - **Islands**: Woven reed war cap, teal vest, 3-pronged barbed fishing trident, turtle-shell reef buckler.
    - **Western**: Kettle hat, royal blue tabard, spear, brass-boss round shield untouched.
    - Hostile Iron March columns strictly maintain their sinister red/iron heraldry.
- **Gather Pack-Carts (`paintBoardGathers`)**:
  - Gather pack-carts adapt cart timber, wheels, and cargo bundles based on player culture kit: split-cedar cart with foraging burlap sack (`cedar`), acacia cart with terracotta amphorae (`sand`), two-wheeled arba wagon with wool felt pack (`steppe`), coastal driftwood slip cart with reed baskets (`islands`), or classic timber cart (`western`).
- **Unit Palette Adaptation**:
  - `unitPalette(typeId, cultureId)`: Adapts tabard, armor, and accent colors for non-western cultures while preserving default western unit values.
  - Extended `CultureVisualPalette` with `accent` and `accentHex`.

### 3. Army Visual Roster Propagation (`packages/app`)

- **Unit Icons in Army Tab**:
  - In `packages/app/src/ArmyVisual.tsx`, imported `playerCultureId` and `cultureOfRealm` to derive `culture` and passed `culture={culture}` to both commander `UnitIcon` and squad formation `UnitIcon`s.
- **AppShell Culture Context**:
  - In `packages/app/src/AppShell.tsx`, unified `<CultureContext.Provider>` to wrap `ProvinceInspect` and tab panes cleanly.

---

## Verification & Invariants

1. **Test Suites**:
   - `npm test`: 38 test files, 119 tests pass across the workspace.
   - `npm run test -w @second-crown/render`: 37 tests pass (including comprehensive suite exercising all 21 building IDs + `lumber` across all 5 culture kits).
   - `npm run build -w @second-crown/app`: `tsc -b && vite build` built cleanly in 5.33s.
2. **Purity Invariant**:
   - `git diff main -- packages/sim server`: 100% empty (0 lines changed).
3. **Culture Visual Preservation**:
   - Western culture visual assets and rendering contracts remain 100% unaltered.



