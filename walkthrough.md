# Walkthrough — Gemini Culture Kits: Distinct Silhouettes for Cedar, Sand, Steppe, and Islands (`bakeoff/gemini-kits`)

## What Changed

Distinct silhouette modifications (not merely palette tints) for the 4 non-western culture kits across hold buildings, hold walkers, and unit icons. Western Crown Marches (`western`) remains 100% untouched in code, coordinates, and art.

### 1. Hold Buildings (`packages/render`)

`resolveCultureKit(cultureId)` maps both sim identifiers (`western`, `woodland`, `desert`, `steppe`, `tide`) and culture names (`cedar`, `sand`, `steppe`, `islands`) to canonical `CultureKit` keys.

In `drawIsometricBuilding`:
- **Keep**:
  - `western`: Preserves the existing ashlar stone keep with corner bartizans, plinth, and royal banner.
  - `cedar`: Timber longhouse keep on riverstone foundation with exposed log beams, pitched gables, carved ridgepole, and forest clan banner.
  - `sand`: Open-air quadrangle courtyard keep on sunbleached limestone plinth with flat roofs, crenellated sand bastions, interior courtyard opening, and sun banner.
  - `steppe`: Circular nomad great hall on low earth mound with conical felt tent roof, wooden door frame, smoke cowl crown, and horsehair standard.
  - `islands`: Stilt-house keep raised on timber pilings with driftwood ladder, reed-thatched pavilion roof, hanging sea lantern, and teal sea banner.
- **Cottage**:
  - `western`: Preserves reed thatch cottage with stone chimney and smoke plume.
  - `cedar`: Hewn timber log cabin with overhanging eaves and moss-lichen stone hearth.
  - `sand`: Flat-roof desert adobe dwelling with wooden shade awning and rooftop terrace parapet.
  - `steppe`: Circular felt yurt/ger with domed roof, felt ties, and low entrance frame.
  - `islands`: Stilthouse cabin raised on timber pilings with reed-thatch roof and rope rigging.
- **Farm**:
  - `western`: Preserves golden wheat furrow field with drystone perimeter boundary.
  - `cedar`: Forest clearing with split-rail log fences, dark loam soil, and leafy squash/vegetable mounds.
  - `sand`: Terrace irrigation garden with terraced mud bunds, central water channel, and date palm fronds.
  - `steppe`: Grazing meadow enclosure with rough-hewn hurdle pens, steppe rye grasses, and sheep hayrack.
  - `islands`: Raised shellfish & tidal crop paddy with drying racks, flooded basin lines, and bamboo fence.
- **Lumber**:
  - `western`: Preserves timber sawpit with upright trestle and hewn log stack.
  - `cedar`: Deep forest split-rail logging yard with stacked heavy timber logs, chopping stump, and wedge axe.
  - `sand`: Desert acacia pole yard with tied sun-drying lumber stacks, rope lashings, and desert woodpile.
  - `steppe`: Nomad wagon yard with heavy timber cart axles, wheelwright trestle, and lumber sled.
  - `islands`: Coastal timber slipway with net-drying racks, boat timbers, bamboo poles, and rope coils.

### 2. Hold Walkers (`packages/render`)

`drawCultureWalker` provides distinct silhouettes for non-western `villager` and `guard` hold walkers:
- `cedar`: Hooded woodland hunter cowl draped over shoulders, buckskin tunic, leaf-spear for guards, timber tool for villagers.
- `sand`: Wrapped desert turban with fluttering havelock veil behind, flowing linen robe, crimson waist sash, slender desert lance.
- `steppe`: Nomad pointed cap / conical steel helmet with horsehair plume, double-breasted caftan coat, horsehair-tasseled lance.
- `islands`: Woven reed war cap / broad sun hat, sailcloth vest and rope wraps, 3-pronged barbed fishing trident.

### 3. Unit Icons (`packages/app/src/UnitIcon.tsx`)

Added distinct silhouette variations for `spearman` and `militia` when non-western (`kit !== "western"`):
- **Spearman**:
  - `western`: Preserves steel kettle hat, royal blue tabard over mail, tall pike, and round brass-boss shield.
  - `cedar`: Pointed hunter cowl, fur shoulder mantle, buckskin tunic, broad leaf-blade spear, and cedar bark shield.
  - `sand`: Desert turban with fluttering havelock neck cloth, flowing linen tunic, crimson waist sash, slender lance with triangular red pennon, and polished brass sun buckler.
  - `steppe`: Conical spangenhelm with flowing red horsehair crest, nomad caftan coat with gold silk sash, horsehair collar lance, and studded rawhide buckler.
  - `islands`: Woven reed war cap with shell band, teal sailcloth vest, rope wrap kilt, 3-pronged barbed trident, and oval turtle-shell reef buckler.
- **Militia**:
  - `western`: Preserves homespun tunic, cloth coif, and wooden club.
  - `cedar`: Woodland hunter hood, buckskin tunic, and heavy carved cedar cudgel.
  - `sand`: Desert turban, flowing linen robe with hanging sash tails, and upright ironwood walking staff.
  - `steppe`: Conical felt cap with fur brim, belted nomad coat (deel), and spiked wooden cudgel.
  - `islands`: Broad-brim woven straw hat, frayed sailcloth tunic with rope belt, and carved boat oar.

### 4. Invariants & Preservations

- `git diff main -- packages/sim server` is strictly 100% empty.
- Crown Marches (`western`) visual assets and rendering contracts are completely unaltered.
- No combat formulas, tick rates, or server endpoints touched.

## Verification

- `npm test`: 38 test files, 119 tests pass across the workspace.
- `npm run test -w @second-crown/render`: 26 tests pass (including 2 new tests verifying culture kit alias resolution).
- `npm run build -w @second-crown/app`: `tsc -b && vite build` built in 4.23s without errors.
- `git diff main -- packages/sim server`: 100% empty.


