## 2026-10-03 — app / peak and lancer UI (wave/culture-unit-5-ui)

- No new code for the picker or the card: `CulturePicker` maps `CULTURES` and `ArmyTab` maps `listUnitTypes()`, both on the existing `.sc-plain-pick` / `.sc-unit-card` styles. No CSS changed.
- `UnitIcon` has `case "lancer"` falling through to `case "knight"`, the same pattern as warden→skirmisher. The knight branch itself is unchanged. Peak resolves to the western kit in `resolveCultureKit`, like Fen.
- Lancer has no dedicated chip or crest glyph yet; a bakeoff chip can slot into `UnitCard` like the others.

## 2026-10-03 — app / 28px warden chip on Warden card (bakeoff/gemini-warden)

- `packages/app/src/hud/warden-chip.css`:
  - Styles `.sc-warden-chip-wrapper`, `.sc-warden-chip`, and living aura states (`.is-open`, `.is-locked`).
  - Strictly enforces `pointer-events: none !important`, `flex-shrink: 0`, and `vertical-align: middle`.
  - Zero edits to `theme.css`.
- `packages/app/src/hud/WardenChip.tsx`:
  - 28px living unit chip component with hold guard defender, sturdy short spear (leaf-shaped steel head and reed bindings), wicker-reed woven round boss shield on off-arm, layered fen-reed cloak with rush frills and carved bone toggle clasp, and conical iron kettle helm.
  - Reactive states: `open = true` (unlocked) displays radiant fen-reed moss green and golden reed tassels, gleaming spear point, and drop-shadow halo; `open = false` (locked) displays desaturated cold marsh dusk tones.
  - `data-warden-chip`, `data-open`, `aria-hidden="true"`, `pointerEvents: "none"`.
- `packages/app/src/hud/UnitCard.tsx`:
  - Directly mounts `<WardenChip size={28} open={open} />` on the Warden card (`typeId === "warden"`).
- `packages/app/src/UnitIcon.tsx`:
  - Added dedicated `case "warden":` rendering hold guard, short spear, round reed shield, and fen-reed cloak.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-warden: 28px warden chip on Warden card (short spear, round shield, fen-reed cloak)")`.
- Invariants:
  - Zero changes to `packages/sim`, `server/`, or `packages/app/src/theme.css` (0 diff against `origin/main`).
  - No new unit stats.

## 2026-10-02 — app / 28px outrider chip on Outrider card (bakeoff/gemini-outrider)

- `packages/app/src/hud/outrider-chip.css`:
  - Styles `.sc-outrider-chip-wrapper`, `.sc-outrider-chip`, and living aura states (`.is-open`, `.is-locked`).
  - Strictly enforces `pointer-events: none !important`, `flex-shrink: 0`, and `vertical-align: middle`.
  - Zero edits to `theme.css`.
- `packages/app/src/hud/OutriderChip.tsx`:
  - 28px living unit chip component with agile scout horse in charging gallop, salt-frosted mane and streaming tail, short couched scout lance with forged leaf point and pennon, and billowing salt-grey cloak with sea-mist highlights pinned by a salt-silver brooch clasp, with conical iron scout helm.
  - Reactive states: `open = true` (unlocked) displays radiant salt-grey cloak highlights, gleaming lance point, and drop-shadow halo; `open = false` (locked) displays desaturated dusk tones.
  - `data-outrider-chip`, `data-open`, `aria-hidden="true"`, `pointerEvents: "none"`.
- `packages/app/src/hud/UnitCard.tsx`:
  - Directly mounts `<OutriderChip size={28} open={open} />` on the Outrider card (`typeId === "outrider"`).
- `packages/app/src/UnitIcon.tsx`:
  - Added dedicated `case "outrider":` rendering scout courser, short couched lance, and salt-grey cloak.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-outrider: 28px outrider chip on Outrider card (horse, short lance, salt-grey cloak)")`.
- Invariants:
  - Zero changes to `packages/sim`, `server/`, or `packages/app/src/theme.css` (0 diff against `origin/main`).
  - No new unit stats.

## 2026-10-03 — sim / peak culture and lancer (wave/culture-unit-5)

- **"A finished keep adds +1 vision" is a flat +1** once any player keep has `completesAtTick === null` (`keepLevel(state) > 0`). It does not scale with keep level. A new game has no keep, so peak and western start with the same vision.
- **Only the player's hold vision changes.** `visionRange` is player-only today. `keepVisionCultureBonus(state, realmId)` takes a realm id like the other culture bonuses, so NPC use stays possible later.
- **Lancer uses the existing Horse lore study** (keepMin 2), the same one as knight. No new study was needed, unlike warden and banner.
- **Lancer also gets the stables 10% discount**, so it always costs exactly what a knight costs.
- **Lancer stats** (attack 13, defense 10, hp 20, speed 6, shock, tier 3) sit between outrider and knight. The brief only fixed cost, power, and drill time.
- Follow-up for app: peak in `CulturePicker` needs no code. A lancer glyph in `crests.ts` and art in `UnitIcon.tsx` are still to do. Lancer is already listed under Horse lore's `unlocks`.

## 2026-10-02 — sim / fen culture and warden (wave/culture-unit-4)

- **Skirmishers had no lectern study.** The brief said to unlock warden "from the same Crown lectern path as skirmisher", but `unitUnlocked` never gated skirmishers. Following the fieldcraft and drill precedent, this wave added a new study, `screening` (180 ticks, food 20 / wood 12, needs `barracks` or `academy`, keepMin 0). It unlocks warden only. Owner: say if you'd rather gate it differently.
- **"+1 citizen per cottage" is per finished cottage, not per cottage level.** This matches the flat +1 per building used by mist, glen, and salt. Only `housingCap` changes; `workPlotCap` does not.
- **Warden also gets the archery-range 10% discount** in `trainCostMultiplier`, so it always costs exactly what a skirmisher costs.
- **Warden stats** (attack 5, defense 7, hp 12, speed 3, line, tier 2) are a defensive take on the skirmisher. The brief only fixed cost, power, and drill time.
- Follow-up for app: fen in `CulturePicker` needs no code. A warden glyph in `crests.ts`, art in `UnitIcon.tsx`, and the `screening` row in `ResearchBar` (check it lists from `RESEARCH`) are still to do.

## 2026-10-02 — sim / salt culture and outrider (wave/culture-unit-3)

- **"Woodcutters" means the `lumber_camp` building.** I didn't use the woodcutter citizen job (`labor.ts`) or the sawmill. This matches the mist (farm) and glen (quarry) pattern: a flat +1 added after multipliers, only for `lumber_camp`/`wood`. Owner: say if you meant posted woodcutter citizens instead.
- **Outrider uses the real cavalry path.** Unlike spearman and archer, cavalry already had a lectern study (`horse`: Horse lore, Keep II, barracks or academy). Outrider was added to `horse.unlocks`, and the effect text now names it. No new study.
- **Outrider stats copy cavalry** (attack 14, defense 8, hp 18, speed 7, shock, tier 3). The brief only fixed cost, power, and drill time.
- Follow-up for app: salt in `CulturePicker` needs no code. An outrider glyph in `crests.ts` and art in `UnitIcon.tsx` are still to do.

## 2026-10-02 — app / 28px banner chip on Banner card (bakeoff/gemini-banner)

- `packages/app/src/hud/banner-chip.css`:
  - Styles `.sc-banner-chip-wrapper`, `.sc-banner-chip`, and living aura states (`.is-open`, `.is-locked`).
  - Strictly enforces `pointer-events: none !important`, `flex-shrink: 0`, and `vertical-align: middle`.
  - Zero edits to `theme.css`.
- `packages/app/src/hud/BannerChip.tsx`:
  - 28px living unit chip component with tall ash wood spear, leaf-shaped forged steel spearhead, flying swallowtail heraldic pennant with scarlet stripe, billowing glen-green cloak fastened with a stone/bronze ring brooch clasp, iron kettle helm, and highland round targe shield.
  - Reactive states: `open = true` (unlocked) displays vibrant glen-green cloak, golden swallowtail pennant, and drop-shadow halo; `open = false` (locked) displays desaturated stony-glen dusk tones.
  - `data-banner-chip`, `data-open`, `aria-hidden="true"`, `pointerEvents: "none"`.
- `packages/app/src/hud/UnitCard.tsx`:
  - Directly mounts `<BannerChip size={28} open={open} />` on the Banner card (`typeId === "banner"`).
- `packages/app/src/UnitIcon.tsx`:
  - Added dedicated `case "banner":` rendering the warrior with spear, flying heraldic pennant, and glen-green cloak.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-banner: 28px banner chip on Banner card (spear, small pennant, glen-green cloak)")`.
- Invariants:
  - Zero changes to `packages/sim`, `server/`, or `packages/app/src/theme.css` (0 diff against `origin/main`).
  - No new unit stats.

## 2026-10-02 — sim / glen culture and banner (wave/culture-unit-2)

- **Spearmen had no lectern study either.** The brief said to unlock banner "from the same Crown lectern path as spearman", but `unitUnlocked` never gated spearmen. Following the fieldcraft precedent from wave/culture-unit, this wave added a new study, `drill` (180 ticks, food 20 / wood 12, needs `barracks` or `academy`, keepMin 0). It unlocks banner only. Owner: say if you'd rather gate it differently.
- **Glen quarry bonus is flat**, same pattern as mist: added after all multipliers, only for `quarry`/`stone`, so a glen quarry always out-cuts a western quarry by exactly 1 stone per tick. `quarryCultureBonus` only reads flags.
- **Banner stats copy spearman** (attack 8, defense 10, hp 16, speed 3, line, tier 2). The brief only fixed cost, power, and drill time.
- Follow-up for app: a banner glyph in `crests.ts` and art in `UnitIcon.tsx`.

## 2026-10-02 — app / 28px ranger chip on Ranger card (bakeoff/gemini-ranger)

- `packages/app/src/hud/ranger-chip.css`:
  - Styles `.sc-ranger-chip-wrapper`, `.sc-ranger-chip`, and living aura states (`.is-open`, `.is-locked`).
  - Strictly enforces `pointer-events: none !important`, `flex-shrink: 0`, and `vertical-align: middle`.
  - Zero edits to `theme.css`.
- `packages/app/src/hud/RangerChip.tsx`:
  - 28px living unit chip component with cowl hood, peaked liripipe, shadowed face with keen gleaming eyes, recurve woodland composite longbow with taut string and nocked bodkin arrow, billowing mist-blue cloak with golden leaf brooch clasp, and swirling morning mist wisps.
  - Reactive states: `open = true` (unlocked) displays vibrant mist-blue cloak, golden brooch, and drop-shadow halo; `open = false` (locked) displays desaturated cold morning fog tones.
  - `data-ranger-chip`, `data-open`, `aria-hidden="true"`, `pointerEvents: "none"`.
- `packages/app/src/hud/UnitCard.tsx`:
  - Directly mounts `<RangerChip size={28} open={open} />` on the Ranger card (`typeId === "ranger"`).
- `packages/app/src/UnitIcon.tsx`:
  - Added dedicated `case "ranger":` rendering the hooded, bow-wielding, mist-blue cloaked ranger silhouette.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-ranger: 28px ranger chip on Ranger card (hood, bow, mist-blue cloak)")`.
- Invariants:
  - Zero changes to `packages/sim`, `server/`, or `packages/app/src/theme.css` (0 diff against `origin/main`).
  - No new unit stats.

## 2026-10-02 — app / mist and ranger UI (wave/culture-unit-ui)

- There was no list to extend. `CulturePicker` and the Army unit grid both map sim data, so Mist and Ranger showed up as soon as the sim merged. This wave only fixes what the app had wrong: the ranger lock note (it was blank, so the card said just "Locked"), the ranger art (it fell through to the militia `default`), and the discount and footnote copy.
- No CSS added. Ranger uses the existing `.sc-unit-card` states and Mist uses `.sc-plain-pick`. A ranger glyph in `crests.ts` `UNIT_VIS` is still open. Only militia, spearman, archer, and knight have one there.

## 2026-10-02 — sim / mist culture and ranger (wave/culture-unit)

- **Archers had no lectern study.** The brief said to unlock ranger "from the same Crown lectern path as archers", but `unitUnlocked` never gated archers. The owner chose to add a new study, `fieldcraft` (180 ticks, food 20 / wood 12, needs `archery_range` or `academy`, keepMin 0). It unlocks ranger only.
- **Mist farm bonus is flat.** If the +1 were added to the base rate, the multipliers would scale it (+1.08 at game start, because of the season bonus). It is added after all multipliers, so a mist farm always out-feeds a western farm by exactly 1 food per tick. Only `farm`/`food` gets it.
- **`farmCultureBonus` only reads.** For NPC realms it reads `culture_<id>` without seeding it, so the economy tick never writes flags.
- **NPC seed pool is fixed** to `NPC_CULTURE_IDS`. Adding mist to `CULTURES` would otherwise change `% CULTURES.length` and reshuffle unseeded NPC cultures.
- **App picks these up on its own.** `CulturePicker` maps `CULTURES`, and `ResearchBar` maps `RESEARCH`. Follow-up: a ranger glyph in `crests.ts` and art in `UnitIcon.tsx`.

## 2026-10-02 — sim / dawn bonus (wave/dawn-bonus)

The brief asked for "+1 starting militia per dawn, capped at 1". A dawn bonus already exists, so this wave did not add militia. It only added tests to `prestige.test.ts`. The real bonus:

- **What it is:** `productionBonus()` in `packages/sim/src/systems/economy.ts` adds `prestige_level`, so each dawn is +1 production bonus. Income is multiplied by `1 + productionBonus × 0.04`, so each dawn adds +4% income.
- **It stacks:** dawn 1 gives +1 and dawn 2 gives +2, with no cap. That differs from the brief's "does not stack past 1". It is left as is and needs an owner call.
- **No militia:** `tryAscend` still removes every player unit, so a new crown starts with 0 player militia.
- **Cosmetic only:** `playerTitle()` in `content/world.ts` reads `prestige_level` for the title text (Crown-Claimant at 1 or more, High Sovereign at 3 or more). It has no gameplay effect.

## 2026-10-02 — sim / Second Dawn keep-wipe rules (wave/ascend-rules)

`tryAscend` (`packages/sim/src/actions/prestige.ts`) already existed, so this wave left it alone and only added `prestige.test.ts`. Its real behavior:

- **Gate:** `canAscend`, meaning all resources added together must reach `ascendThreshold` (30,000 + 25,000 × `prestige_level`). The gate is not the "Second Dawn" achievement (`ach_ascend`). That achievement's hint is "Ascend once", so gating on it would be circular.
- **Keeps:** every flag except the ones listed below. That covers culture (`flags.culture`), achievements (`flags.ach_*`), the primer (`tutorial_index`, `tutorial_done`), marches and gathers (`marches_json`, `gathers_json`), the doctrine pick, and spoils. It also keeps `factions` (the guild name), realms, characters, opinions, the board, citizens, fog and `meta.tick`.
- **Dawn count:** `prestige_level` and `prestige_total` each go up by 1.
- **Wipes:** resources become `{gold 0, food 25, wood 35, stone 0}`. This is not the new-game start, which is all zeros. Buildings become one finished farm and one finished lumber camp. Every unit whose `realmId` is not `"rival"` is removed, which also removes NPC kingdom units added by `seedWorldActors`. `wars` becomes `[]`, and the `peace_*` and `doctrine_lock` flags are deleted.
- **Gaps against the brief (not fixed; they need an owner call):**
  - Nothing ever calls `unlock(state, "ach_ascend")`, so the Second Dawn achievement can never be earned and the DawnCard seal stays dormant.
  - Marches and the primer are not reset.
  - Resources and buildings don't match the new-game start.
  - NPC kingdom units get removed.
## 2026-10-02 — app / 28px dawn seal pip on Second Dawn card (bakeoff/gemini-dawn-seal)

- `packages/app/src/hud/dawn-seal.css`:
  - Styles `.sc-dawn-seal-wrapper`, `.sc-dawn-seal`, and radiant aura filters (`is-risen`, `is-active`, `is-dormant`).
  - Enforces `pointer-events: none !important`, `flex-shrink: 0`, and `vertical-align: middle`.
  - Zero edits to `theme.css`.
- `packages/app/src/hud/DawnSealPip.tsx`:
  - 28px living royal solar wax seal SVG with swallowtail silk ribbons, scalloped poured wax pool, raised bezel, milled pearled rim, rising sun, sunburst rays, Second Crown crest, and morning star glint.
  - Reactive states: `active = true` (risen) renders molten gold wax, celestial white sun, glowing rays, and drop-shadow halo; `active = false` (dormant) renders antique slate/bronze with pewter horizon.
  - `data-dawn-seal`, `data-active`, `data-risen`, `aria-hidden="true"`, `pointerEvents: "none"`.
- `packages/app/src/hud/DawnCard.tsx` & `dawn-card.css`:
  - Mounts `<DawnSealPip active={dawned} size={28} />` within `.sc-dawn-title-group`.
  - `.sc-dawn-card .sc-work-head` aligns items center to frame the 28px seal beside "Second Dawn".
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-dawn-seal: 28px dawn seal pip on Second Dawn card")`.
- Invariants:
  - Zero changes to `packages/sim`, `server/`, or `packages/app/src/theme.css` (0 diff against `origin/main`).
  - Read-only card: no new actions.

## 2026-10-02 — app / living pips on keep room cards (bakeoff/gemini-keep-rooms)

- `packages/app/src/hud/keep-room-pips.css`:
  - Styles `.sc-room-pip-wrapper`, `.sc-bed-pip-wrapper`, `.sc-anvil-pip-wrapper`, and `.sc-wall-pip-wrapper`.
  - Enforces `pointer-events: none !important`, `flex-shrink: 0`, and `vertical-align: middle`.
  - Zero edits to `theme.css`.
- `packages/app/src/hud/BedPip.tsx`:
  - 16px living bed SVG with oak posts, bolster pillow, quilt, and reactive candlelight / medical cross states.
  - `data-bed-pip`, `data-active`, `data-full`, `data-wounded`, `aria-hidden="true"`, `pointerEvents: "none"`.
- `packages/app/src/hud/AnvilPip.tsx`:
  - 16px living anvil SVG with oak stump, forged steel face, horn, hammer, and reactive glowing hot billet with flying sparks.
  - `data-anvil-pip`, `data-active`, `data-count`, `aria-hidden="true"`, `pointerEvents: "none"`.
- `packages/app/src/hud/KeepRoomPip.tsx`:
  - Unifies resolution of `room` ("hall", "wall", "yard") or `kind` ("bed", "wall", "anvil").
  - Re-exports `BedPip`, `WallPip`, `AnvilPip`.
- `packages/app/src/KeepInterior.tsx`:
  - Mounted `<BedPip size={16} />`, `<WallPip size={16} />`, and `<AnvilPip size={16} />` directly on room tab buttons (`.sc-keepin-room`).
  - Added `pip?: React.ReactNode` to `FactCard` rendering in `.sc-work-title-group`.
  - Mounted `BedPip` on Hall cards (`Keep`, `People`, `Plots`) and Yard cards (`Beds`, `Healing`).
  - Mounted `WallPip` on Wall cards (`Walls`, `Ring`, `Gate`).
  - Mounted `AnvilPip` on Yard card (`Keep edge`).
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-keep-rooms: small living pips on Hall, Wall, and Yard cards (bed, wall, anvil)")`.
- Invariants:
  - Zero changes to `packages/sim`, `server/`, or `packages/app/src/theme.css` (0 diff against `origin/main`).

## 2026-10-01 — app / keep room cards (wave/keep-rooms)

- `packages/app/src/hud/keep-room.css` (imported by `KeepInterior.tsx`):
  - `.sc-keeproom-grid`: card grid (minmax 150px), `position: relative` so it sits above the room backdrop.
  - `.sc-work-card.sc-keeproom-card`: fact or work card; tones `is-good` (green), `is-warn` (gold), `is-bad` (red), `is-idle`; works use `is-staffed`, `is-empty`, `is-raising` (dashed).
- `KeepInterior.tsx`: new local `FactCard` and `HallCards`; `WallRoom`'s `<dl>` facts and `WorkList`'s `<ul>` became cards. Yard reads `woundedCount`, `infirmaryBeds`, `listHealing`, `healTicks`, `healTicksLeft` (same reads as `KeepHall` Yard room), divided by `TICKS_PER_SECOND`.
- `.sc-keepin-facts` / `.sc-keepin-list*` in `keep-interior.css` are now unused (left in place; brief kept styles to `keep-room.css`).
- Files: `packages/app/src/hud/keep-room.css`, `KeepInterior.tsx`.

## 2026-10-01 — app / 24px faction seal pips & spoils craft wax seals (bakeoff/gemini-faction-seals)

- `packages/app/src/hud/faction-seals.css`:
  - Dedicated stylesheet for `.sc-faction-seal-wrapper`, `.sc-faction-seal`, `.sc-faction-row`, and `.sc-craft-seal`.
  - Enforces `pointer-events: none !important`, `flex-shrink: 0`, and `vertical-align: middle`.
  - Zero edits to `theme.css`.
- `packages/app/src/hud/FactionSealPip.tsx`:
  - 24px SVG seal component resolving kind ("order", "pact", "guild") via `resolveFactionKind()`.
  - Hand-crafted SVG vectors:
    - Order: Amber silk ribbons, poured wax puddle, golden matrix bed, knightly sword cross sigil.
    - Pact: Crimson ribbons, blood-wax puddle, crossed stilettos, faceted silver salt diamond.
    - Guild: Verdigris bronze ribbons, emerald wax puddle, master hammer, drafting compass calipers, bullion coin boss.
    - Sworn Member: Green laurel ring (`#4ade80`) and apex emerald stud.
  - `data-faction-seal`, `data-kind`, `data-member`, `aria-hidden="true"`, `pointerEvents: "none"`.
- `packages/app/src/hud/WaxSealPip.tsx`:
  - Added optional `craftId?: string` prop and `data-craft` attribute.
  - Wrapped with `.sc-craft-seal` class and guaranteed `pointerEvents: "none"`.
- `packages/app/src/WorldPanel.tsx`:
  - Mounted `<FactionSealPip kind={f.kind} faction={f} isMember={mine} size={24} />` inside each faction card row.
- `packages/app/src/tabs/CrownTab.tsx`:
  - Mounted `<WaxSealPip size={16} active={owned} craftId={c.id} />` in `.sc-work-head` of each Spoils craft card.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-faction-seals: 24px faction seal pips (order, pact, guild) and spoils craft wax seals")`.
- Invariants:
  - Zero changes to `packages/sim`, `server/`, or `packages/app/src/theme.css` (0 diff against `origin/main`).

## 2026-10-01 — app / 16px pips on leftover buttons (bakeoff/gemini-button-pips)

- `packages/app/src/hud/button-pips.css`:
  - Styles `.sc-btn-pip`, `.sc-holiday-pip` (with `pointer-events: none !important`, `flex-shrink: 0`, `vertical-align: middle`), `.sc-btn-with-pip`, `.sc-study-btn`, and `.sc-study-row`.
  - Zero edits to `theme.css`.
- `packages/app/src/hud/HolidayPip.tsx`:
  - 16px holiday emblem pip rendering `meta.propEmoji` (🎃 All Hallows, 🎄 Midwinter, 🪺 Dawn Feast, 🌕 Harvest Moon, ☀️ Midsummer, ⚔️ Common Days) resolved via `detectCurrentHoliday()` and `getHolidayMeta()`.
  - Strictly `pointerEvents: "none"`, `aria-hidden="true"`, `data-holiday-pip`.
- `packages/app/src/hud/HallChip.tsx`:
  - Added `as?: "div" | "span"` (defaults to `"div"`), allowing clean inline button nesting without nested block DOM issues.
- `packages/app/src/hud/ScrollPip.tsx`:
  - Existing 24px scroll pip supports `size={16}` directly with `pointerEvents: "none"` and `aria-hidden="true"`.
- `packages/app/src/tabs/KingdomTab.tsx`:
  - Mounts `<HallChip typeId={t.id} size={16} as="span" />` on building picker buttons.
  - Mounts `<HallChip typeId="cottage" size={16} as="span" />` on Cottage hint button.
  - Mounts `<HallChip typeId={b.typeId} size={16} as="span" />` on Raising works rows.
  - Mounts `<HallChip typeId={b?.typeId ?? ""} size={16} as="span" />` on Improving upgrades rows.
- `packages/app/src/KeepInterior.tsx`:
  - Mounts `<HallChip typeId={t.id} size={16} as="span" />` on building palette buttons.
- `packages/app/src/ResearchBar.tsx`:
  - Mounts `<ScrollPip size={16} status="open" />` on study research buttons.
  - Mounts `<ScrollPip size={16} status="ready" />` on active studying rows.
  - Mounts `<ScrollPip size={16} status="claimed" />` on mastered study rows.
- `packages/app/src/ChromeDock.tsx` & `packages/app/src/TesterBar.tsx`:
  - Mount `<HolidayPip holiday={holiday} size={16} />` beside Holiday controls.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-button-pips: 16px pips on leftover buttons (build, study, holiday)")`.
- Invariants:
  - Zero changes to `packages/sim`, `server/`, or `packages/app/src/theme.css` (0 diff against `origin/main`).

## 2026-10-01 — app / map strip with small heraldic pips (bakeoff/gemini-map-pips)

- `packages/app/src/hud/map-strip.css`:
  - Styles `.sc-work-card.sc-map-strip` as a unified work card under the kingdom board.
  - `.sc-map-strip-row`, `.sc-map-strip-cell`, `.sc-map-strip-pip` (with `pointer-events: none !important`), `.sc-map-strip-hints`.
  - Zero edits to `theme.css`.
- `packages/app/src/hud/WallPip.tsx`:
  - 20px wall & gatehouse heraldic pip with ashlar stone flanks, wall-walk terrace, central gate arch, and ring status stud (green `#3fb950` closed, amber `#d29922` open).
  - Strictly `pointerEvents: "none"`, `aria-hidden="true"`.
- `packages/app/src/hud/VisionPip.tsx`:
  - 20px watchtower spire & beacon flame pip with projecting corbel parapet, iron brazier, and radiating vision glints.
  - Strictly `pointerEvents: "none"`, `aria-hidden="true"`.
- `packages/app/src/WallLine.tsx` & `packages/app/src/VisionLine.tsx`:
  - Mount `<WallPip />` and `<VisionPip />` directly inline before plain text facts.
- `packages/app/src/tabs/KingdomTab.tsx`:
  - Groups hold summary line, `WallLine`, and `VisionLine` into `.sc-map-strip`.
  - Mounts 20px `<RealmCrestPip realmId="player" size={20} />` in `.is-hold` cell.
  - Does not add slot pips to the kingdom map strip because column slots are not part of the plain text facts on that strip, respecting the "No new facts" rule.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-map-pips: Map strip under the board with small pips")`.
- Invariants:
  - Zero changes to `packages/sim`, `server/`, or `packages/app/src/theme.css` (0 diff against `origin/main`).

## 2026-10-01 — app / 28px RealmCrestPip across World view (bakeoff/gemini-world-crests)

- `packages/app/src/WorldPanel.tsx`:
  - Imported `RealmCrestPip` from `./hud/RealmCrestPip` and `realmStance` from `./hud/RealmCard`.
  - Replaced legacy `Crest` with `<RealmCrestPip realmId="player" size={28} />` in player banner.
  - Replaced legacy `Crest` in known crown cards with `<RealmCrestPip realmId={r.id} stance={stance} size={28} />` using dynamic stance computed via `realmStance(atWar, left, op)`.
  - Added `<RealmCrestPip realmId={f.leaderRealmId} size={28} />` for faction leaders and `<RealmCrestPip realmId={mId} size={28} />` for member realms.
- `packages/app/src/tabs/WorldTab.tsx`:
  - Imported `RealmCrestPip`, `realmStance`, `peaceTicksRemaining`, and `opinionOfPlayerFromRealm`.
  - Watchtower Warning / Dust on the Road: added `<RealmCrestPip realmId={seen.realmId} size={28} stance="war" />` next to warning text when incoming host is sighted.
  - Foreign War (Clash): added `<RealmCrestPip realmId={clash.a} size={28} stance="war" />` and `<RealmCrestPip realmId={clash.b} size={28} stance="war" />` in clash header, and directly on both `tryJoinClash` action buttons ("Send levy to ...").
  - Holds on the Board: replaced generic 10px dot with `<RealmCrestPip realmId={targetRealmId} stance={stance} size={28} />` for occupied holds, showing an empty keep placeholder only when unoccupied.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-world-crests: 28px RealmCrestPip across World view")`.
- Invariants:
  - No changes to `packages/sim`, `server`, or `packages/app/src/theme.css` (0 diff against `origin/main`).
  - No new kingdoms added.
  - Strictly `pointer-events: none` on all crest elements.

## 2026-10-01 — render / distinct store buildings chips (bakeoff/gemini-stores)

- `packages/render/src/buildings.ts`:
  - Implemented 4 dedicated scaffolding functions for the store buildings:
    - `export function drawGranaryScaffolding(g: Graphics, h: number, a: number, phase: number, kit: CultureKit, cult: CultureVisualPalette): void`: Staddle stone piers, sill framing with exposed joists, partial floor decking, scaffold poles and ledgers, A-frame gantry hoist with dangling hook rope, framing plank stack, and peg bucket.
    - `export function drawMintScaffolding(g: Graphics, h: number, a: number, phase: number, kit: CultureKit, cult: CultureVisualPalette): void`: Excavated foundation trench, low stone masonry plinth courses with course scoring, wooden vault centering arch former, scaffold standards/platforms with ladder rungs, timber derrick crane hoisting stone lintel block, mortar mixing trough with lime and trowel.
    - `export function drawSawmillScaffolding(g: Graphics, h: number, a: number, phase: number, kit: CultureKit, cult: CultureVisualPalette): void`: Excavated millrace flume channel with shoring stakes, wheel bearing posts and axle spindle (wheel unmounted), open timber framing with exposed King-post roof trusses open to sky, saw carriage track under construction, carpenter's sawhorses, and crosscut saw.
    - `export function drawMasonScaffolding(g: Graphics, h: number, a: number, phase: number, kit: CultureKit, cult: CultureVisualPalette): void`: Chalked ground grid layout with red corner boundary pegs, high wooden derrick tripod shear-legs crane with hoist tackle and rough boulder, partial stonecutter shed framing, raw unquarried stone boulders with steel splitting wedges, and mason sledgehammer.
  - Implemented 4 culture painters for the store buildings:
    - `drawGranaryCulture(g, h, a, phase, kit, cult)`: Cedar log crib with totem finial; Sand whitewashed mudbrick qasba with domed silo; Steppe spoked grain wagon with leather panniers; Islands stilt palafito with bamboo slats and salt barrels.
    - `drawMintCulture(g, h, a, phase, kit, cult)`: Cedar boulder vault with ironwood lintel; Sand horseshoe arch with turquoise frieze; Steppe armored cart-yurt with gold finials; Islands sunken coral vault with nautilus seal.
    - `drawSawmillCulture(g, h, a, phase, kit, cult)`: Cedar fir flume river mill; Sand sun canopy awning with donkey drive wheel; Steppe tripod log crane with broadaxes; Islands tidal paddlewheel with driftwood booms.
    - `drawMasonCulture(g, h, a, phase, kit, cult)`: Cedar megalithic stonehewer lodge; Sand open-air atelier with shade awning; Steppe balbal stele with stone cairns; Islands coral-stone quarry lodge with cyan finial.
  - Updated `drawIsometricBuilding`:
    - Updated `case "granary":`, `case "mint":`, `case "sawmill":`, `case "mason":` to branch on `if (!complete) { draw...Scaffolding(); break; }` and `if (kit !== "western") { draw...Culture(); break; }`.
    - Western finished implementations feature rich thematic storage and production props (staddle stones, wheat finials, flour sacks, Romanesque arches, gilded crown medallions, flywheel presses, bullion ingots, turning waterwheels with foam spray, spinning circular saw blades, sawdust mounds, banker workbenches, derrick cranes, ashlar pallets, carved columns, and marble urns).
    - Updated `isScaffolding` guard check before `drawCrackedStoneOverlay` to include `granary`, `mint`, `sawmill`, and `mason`, ensuring unfinished store buildings render authentic scaffolding without cracked stone rubble overlays.
  - Farm, Cottage, Quarry, and Watchtower implementations left completely untouched.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-stores: Distinct isometric chips for Granary, Mint, Sawmill, Mason Yard (Finished vs Scaffolding)")`.
  - Verifies finished Western chips, distinct scaffolding structures and props, all 4 culture kits across all 4 store types, exported scaffolding functions, and zero conflict markers.
- Invariants:
  - `packages/sim`, `server`, and `packages/app/src/theme.css` remain strictly untouched (0 diff against `origin/main`).

## 2026-10-01 — sim / hall bonus (wave/hall-bonus)

- `systems/hallBonus.ts`: `hallRoomBuilt(state, room, realmId = "player")` checks a finished building owned by that realm, the same rule as `hasBuilt` in `KeepHall.tsx` (not `countBuilding`, which counts every realm). `HALL_ROOM_NEEDS` mirrors KeepHall's `ROOMS`; if one changes, change both.
- `hallBonuses(state)` returns `{ room, on, text }[]` for yard / lectern / gate. It is read-only.
- The only new rule is in `ward.ts`: `healTicks(state)` is `YARD_HEAL_TICKS` (40) with a Yard room, else `HEAL_TICKS` (50). The duration is fixed when the treat is queued (`doneTick`), so building or losing a Barracks never moves jobs already queued. Deterministic: no RNG.
- Lectern `on` uses the player-only check, while `researchDuration` still uses `countBuilding` (any realm). Rivals do not build academies today, so they match. Left alone so the research timing stays the same.
- Gate text uses `gateHp(state, "player")`, which is 0 until a finished gate sits on the rim.
- `ArmyTab.tsx` treat copy still says 5s; the brief limits app changes to the Hall panel.

## 2026-10-01 — render / cottage bunk and bedrolls (bakeoff/gemini-cottage-bunk)

- `packages/render/src/buildings.ts`:
  - `export function isHoldFull(state?: GameState | null, options?: BuildingDrawOptions, realmId = "player"): boolean`:
    - Checks explicit overrides: `options?.isFull`, `options?.isHoldFull`, `options?.isPacked`, `options?.hasFreeBed === false`.
    - Checks explicit numeric overrides: `pop !== undefined && beds !== undefined && pop >= beds`.
    - Checks `state?.flags` booleans: `isFull`, `isHoldFull`, `isPacked`, `holdFull`, `hold_full`, `hasFreeBed === false`.
    - Calculates live capacity: `population(state, realmId) >= housingCap(state, realmId)`.
  - `export function hasFreeBed(state?: GameState | null, options?: BuildingDrawOptions, realmId = "player"): boolean`:
    - Inverse of `isHoldFull`.
  - `export function drawCottageBunk(g: Graphics, bx: number, by: number, a: number, isFull: boolean, kit: CultureKit = "western"): void`:
    - Renders timber bed frame with headboard, footboard, posts, finials, side rails, and ground shadow.
    - Culture kit alters timber post and finial palette (`cedar`, `sand`, `steppe`, `islands`, `western`).
    - Free bed (`!isFull`): Clean linen polygon (`0xf8fafc`), white pillow (`0xffffff`), turn-down crease (`0x94a3b8`), green indicator pip (`0x4ade80`).
    - Full hold (`isFull`): Occupied quilt polygon (`0x991b1b`), indented pillow (`0xd6d3d1`), extra emerald roll (`0x065f46`) with straps (`0xb45309`), extra rust roll (`0x9a3412`) with cord (`0xfacc15`), navy roll (`0x1e3a8a`), canvas duffle (`0x713f12`), red indicator pip (`0xef4444`).
    - Uses `g.rect` for rolls to stay compatible with unit test `MockGraphics`.
  - Wired into `drawIsometricBuilding` under `case "cottage":` and `drawCottageCulture` for all 4 cultures when `complete === true`.
- `packages/render/src/index.ts`:
  - Imported `isHoldFull` and `hasFreeBed` from `./buildings.js`.
  - Computed `isFull = isHoldFull(state)` and populated `buildingOptions` with `isFull`, `isHoldFull`, `isPacked`, `hasFreeBed`.
  - Computed per-realm `bIsFull = isHoldFull(state, buildingOptions, bRealm)` and passed in `bOptions`.
- `packages/render/src/index.test.ts`:
  - Unit tests verify helper functions, Western cottage free vs packed rendering, all 4 culture cottages free vs packed rendering, scaffolding suppression when `complete === false`, and `pointer-events: none` non-blocking guarantee.
- Invariants:
  - `packages/sim`, `server`, and `packages/app/src/theme.css` remain strictly untouched (0 diff against `origin/main`).

## 2026-09-30 — hud / stall/post column slot pips on War (bakeoff/gemini-slot-pips)

- `packages/app/src/hud/SlotPip.tsx` & `slot-pip.css`:
  - `SlotPip` (`StallSlotPip`): renders 16px SVG representing a muster post / stable stall:
    - `EmptyStallPostSvg` (`filled = false`): dormant timber frame (`#3b2314`), stall hitch rail (`#4a2e1b`), cold iron ring (`#475569`), flat timber cap, stone footing, `is-empty` (opacity: 0.42).
    - `FilledStallPostSvg` (`filled = true`): active column on the road; hoisted standard with swallowtail red/gold war pennant (`#dc2626`, `#facc15`), golden spearhead finial (`#facc15`), beacon flame spark (`#fef08a`), active tether, amber timber highlights (`#f59e0b`), `is-filled`.
    - Both states strictly enforce `pointerEvents: "none"` and `aria-hidden="true"`.
  - `SlotPips` (`ColumnSlotPips`): container rendering `N/max` label and row of individual stall/post pips.
    - Props: `state?: GameState`, `filled?: number`, `max?: number`, `compact?: boolean`, `size?: number`.
    - `getFilledSlots(state)`: derives `activeMarches + activeGathers` for player realm (`listMarches`, `listGathers`).
    - `getMaxSlots(state)`: derives `maxMarches(state)`.
    - `getColumnSlots(state)`: returns `{ filled, max }`.
- Mounted in:
  - `packages/app/src/AppShell.tsx`: on the War tab button (`id === "war"`), renders `<SlotPips state={state} compact />`.
  - `packages/app/src/WarRoom.tsx`: in the Columns card header alongside `<strong style={{ margin: 0 }}>Columns</strong>`, renders `<SlotPips state={state} />`.
- Invariants:
  - `packages/sim`, `server`, and `packages/app/src/theme.css` remain strictly untouched (0 diff against `origin/main`).
  - Unit tests in `packages/render/src/index.test.ts` verify component imports, slot calculations, SVG artwork structure, CSS classes, and mounting locations.

## 2026-09-30 — app / keep hall (wave/keep-hall)

- `packages/app/src/KeepHall.tsx`: `KeepHall({ state, act })`, rendered at the end of the `is-hold` section in `ProvinceInspect` (home province only). `ROOMS` maps `yard → barracks`, `lectern → academy`, `gate → gate`; `hasBuilt` checks a finished player building (not `countBuilding`, which counts every realm).
- Yard copies ArmyTab's train/treat handlers but keeps its own local `qty` (does not touch the engine's `trainQty`). Wounded uses `woundedCount` (what `tryTreatWounded` checks) and `infirmaryBeds`.
- Lectern is `<ResearchBar>` as-is. Gate is `<WallLine>` plus WarRoom's sally handler; the foe name is hidden behind `watchtowerWarning` like WarRoom.
- Styling in `keep-hall.css` (imported by the component), uses `--chrome-btn-border`. theme.css untouched.

## 2026-09-30 — sim / raid mercy (wave/raid-mercy)

- `systems/raidMarch.ts`: exported `HOME_RAID_FIRST_TICK` (3000), `HOME_RAID_GAP` (1500), `homeRaidAllowed(state, atTick)`. Gate uses `atTick` (the AI pulse tick, also correct under `advanceAnalytic`) and a numeric `flags.home_raid_last` set only on a successful launch. The gap is global across rivals, not per realm.
- `systems/combat.ts`: `resolveBattle(state, war, rng, opts?: BattleOptions)`. `BattleOptions = { wallSoak?: number; attackerForce?: Record<string, number> }`. With `attackerForce`, attacker stacks are `stacksFor` capped per type to the force (types missing from the realm drop out), Muster power is the column's unit power, the defender is written back with `writeStacks`, and attacker losses are subtracted from realm units (`writeColumnLosses`) instead of overwriting counts. Callers without opts (`actions/war.ts`, `battleHarness.ts`) behave exactly as before.
- `systems/resolver.ts`: `resolveRounds(atk, def, rng, wallSoak = 0)`. A wall pool absorbs damage on hits targeting the defender side; the remainder (if any) lands normally. No extra RNG draws, so determinism and existing seeds are unchanged when `wallSoak = 0`.
- `systems/march.ts`: home-hold arrival passes `wallSoak: wallHp(state, "player")` (finished walls only; read after `applySiegeBlow`, so a wall scarred by that blow does not soak) and `attackerForce: march.force ?? { militia: levy }`.
- Note: NPC columns never deducted units from the realm at launch (`npcColumnForce` is a view); that is unchanged.
- Tests: `raidMercy.test.ts` (wall soak flips 20 militia vs 6 militia + 6 spearman, seed 1; siege column-only losses), `raidMarch.test.ts` gap test, harness test 3000 → 3100 ticks.

## 2026-09-30 — render / player keep intact vs cracked stone / dark windows / no proud banner when breached (bakeoff/gemini-keep-breach)

- `packages/render/src/buildings.ts`:
  - `export function isHoldBreached(state?: GameState | null, options?: { isBreached?: boolean; breached?: boolean; stands?: boolean }, realmId = "player"): boolean`:
    - Safely determines breach status without mutating or requiring sim changes.
    - Evaluates explicit caller options: `options.isBreached`, `options.breached`, `options.stands === false`.
    - Evaluates `state.flags` booleans: `isBreached`, `breached`, `holdBreached`, `hold_breached`, `is_breached`, `stands === false`, `hold_stands === false`.
    - Evaluates direct state booleans: `isBreached`, `breached`, `holdBreached`, `hold_breached`, `stands === false`.
    - Evaluates string flags: `hold`, `hold_status`, `defense`, `last_siege` matching `"breached"` / `"fallen"`.
    - Evaluates `state.wars` siege outcome for the defender hold (`w_siege_...` non-active where `status !== "defender_won"`).
  - `export interface BuildingDrawOptions`:
    - Added `isBreached?: boolean; breached?: boolean; stands?: boolean;`.
  - `drawIsometricBuilding`:
    - Derived `const isBreached = Boolean(options?.isBreached ?? options?.breached ?? (options?.stands !== undefined ? !options.stands : undefined) ?? (options?.state ? isHoldBreached(options.state, options) : false))`.
    - `case "keep"`:
      - When `!isBreached`: intact dressed ashlar stone, warm flickering golden royal high window (`0xfef08a`), soaring royal standard with gold finial ball (`0xfacc15`) and tabard/gold (`0xb91c1c`, `0xfacc15`), leaping brazier flame (`0xf97316`), and golden hearth chimney flue glow (`0xfef08a`).
      - When `isBreached`: structural fracture fissures (`0x0f172a`, `0x09090b`, `0x1e293b`), rubble divots, cracked bartizans and crenel, buckled portcullis bars (`0x475569`), dark shattered window void (`0x09090b`) with broken glass fracture lines (`0x334155`), snapped splintered flagpole stump (`0x5c3818`, `0x78350f`) without banner or finial, charred slate heraldic shield (`0x1e293b`), cold brazier coals (`0x1e293b`), cold dead hearth flue without `0xfef08a` glow, and stone level pips (`0x64748b`).
    - `drawKeepCulture`: updated signature to accept `isBreached: boolean = false`, supporting cracked walls/timbers/lattice/stilts, dark louvers/toono/vents (no `0xfef08a` glow), cold cauldrons/braziers, and broken mast stumps across `cedar`, `sand`, `steppe`, and `islands`.
    - Suppressed seasonal/holiday porch dressing and glowing lanterns on breached keep.
- `packages/render/src/tokens.ts`:
  - `MiniatureKeepOptions`: added `isBreached?: boolean; breached?: boolean; stands?: boolean;`.
  - `drawMiniatureKeep`: derives `isBreached` via `isHoldBreached`. Renders masonry crack fissure, dark window void, snapped mast stump (no pennant, no gold finial), and suppresses player coronet crest when breached.
- `packages/render/src/index.ts`:
  - Exported `isHoldBreached`.
  - Wired `isHoldBreached` into `buildingOptions` and per-realm `bOptions` in `paintBuildings`.
- Invariants: Sim and server unchanged (`git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty). Non-blocking `pointer-events: none` (`eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — render / missing rim wall segments faint timber stake & gap mark (bakeoff/gemini-wall-gap)

- `packages/render/src/tiles.ts`:
  - `export function isMissingRimSegment(state: GameState | null | undefined, gx: number, gy: number, realmId = "player", requireEmpty = false): boolean`:
    - Validates grid bounds (`0 <= gx < GRID_W` and `0 <= gy < GRID_H`).
    - Checks `isRimTile(gx, gy)` (`gx === 0 || gy === 0 || gx === GRID_W - 1 || gy === GRID_H - 1`).
    - Checks whether a finished wall, gate, or other building for `realmId` occupies `(gx, gy)` (`completesAtTick === null || completesAtTick === undefined`).
    - Returns `false` for finished segments. Returns `true` for missing segments. If `requireEmpty = true`, also returns `false` if an unfinished building is present.
  - `export function listMissingRimSegments(state: GameState | null | undefined, realmId = "player", requireEmpty = false): Array<{ x: number; y: number }>`:
    - Iterates all 48 rim tiles in clockwise order (`getRimTileAt(0..47)`).
    - Returns an array of `{ x, y }` coordinates for all missing rim wall segments. Returns `[]` when the wall ring is closed.
  - `export function drawRimGapMark(g: Graphics, wx: number, wy: number, gx: number, gy: number, phase = 0, visuals?: ThemeVisuals): void`:
    - Renders faint foundation trench alignment notch (`0x52525b`, width 1.4, alpha 0.35) and mason's lime chalk alignment mark (`0xa8a29e`, width 0.7, alpha 0.42) tracing the wall footing between adjacent rim tiles.
    - Soft elliptical turf contact shadow (`0x000000`, `0x271708`).
    - Displaced dark loam soil clods at the peg base (`0x3f220c`, `0x2e1908`).
    - Slender aged timber stake (`0x78350f`) with sunlit highlight (`0xa16207`), chamfered heartwood top cut (`0xc29d62`), and vertical grain split (`0x451a03`).
    - Weathered neck cord binding (`0xa8a29e`, knot bead `0x78716c`).
    - Seasonal frost cap on stake head during winter/midwinter themes (`0xf1f5f9`).
  - `export function paintMissingRimSegments(g: Graphics, state: GameState | null | undefined, phase = 0, visuals?: ThemeVisuals, realmId = "player"): void`:
    - Clears graphics and iterates `listMissingRimSegments(state, realmId)`. Renders zero marks when the wall ring is closed.
- `packages/render/src/index.ts`:
  - Layer added to `holdContainer`: `rimGapLayer = new Graphics(); rimGapLayer.eventMode = "none"; holdContainer.addChild(rimGapLayer);` placed directly above `groundLayer` and below `entitiesLayer`.
  - Refreshes `rimGapLayer` in initial render, `sync()`, `setTheme()`, and the animation ticker loop (during `"hold"` camera band).
  - Exported `isMissingRimSegment`, `listMissingRimSegments`, `drawRimGapMark`, and `paintMissingRimSegments`.
- Invariants: Sim and server unchanged (`git diff origin/main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. No `theme.css` changes. Non-blocking `rimGapLayer.eventMode = "none"`. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — render / finished watchtower unlit beacon when no worker, staffed beacon on (bakeoff/gemini-tower-unlit)

- `packages/render/src/buildings.ts`:
  - `export function isBuildingStaffed(state?: GameState | null, buildingOrCoords?: ..., gx?: number, gy?: number): boolean`:
    - Checks whether a building has assigned workers or staff.
    - Inspects explicit building properties (`isStaffed`, `hasWorker`, `staffed`, `workers > 0`, `workerCount > 0`).
    - Checks `state.citizens` for any citizen assigned to `(x, y)` with a valid job (`c.job !== "unassigned"`).
    - Checks `sim.staffBonus(state, b) > 1` if available.
  - `export interface BuildingDrawOptions`:
    - Added `isStaffed?: boolean; hasWorker?: boolean; staffed?: boolean;`.
  - `drawIsometricBuilding`:
    - Derives `isStaffed = Boolean(options?.isStaffed ?? options?.hasWorker ?? options?.staffed ?? (options?.state ? isBuildingStaffed(options.state, { x: gx, y: gy, typeId }, gx, gy) : true));`.
    - Defaults to `true` when options are omitted (preserving legacy standalone tests without regressions).
    - In `case "watchtower":`:
      - Western watchtower: when `isStaffed === true`, renders active leaping flame tongues (`0xf97316`, `0xfacc15`, `0xffffff`), radiant warm beacon glow halo (`0xfde047`), ember spark, and gold glint star.
      - When `isStaffed === false` (no worker): beacon brazier displays cold charcoal bed and grey ash (`0x0f172a`, `0x334155`, `0x475569`), with zero flame tongues, zero radiant halo, and zero gold glint star.
      - Passes `isStaffed` to `drawWatchtowerCulture`.
  - `drawWatchtowerCulture`:
    - Added `isStaffed: boolean = true` parameter.
    - Updated all 4 culture kits (`cedar`, `sand`, `steppe`, `islands`) to render active beacon fire/cyan light/smoke and gold glint when staffed, and cold unlit dark charcoal/lantern glass with zero flames/smoke/glint when unstaffed.
- `packages/render/src/tokens.ts`:
  - `KeepYardBuildingInfo`: added `isStaffed?: boolean; hasWorker?: boolean;`.
  - `listKeepYardBuildings`: derives `isStaffed` and `hasWorker` via `isBuildingStaffed(state, b)`.
  - `drawKeepYardAnnex`: checks `info.isStaffed !== false && info.hasWorker !== false` for `"watchtower"`, rendering cold unlit charcoal ash when unstaffed.
- `packages/render/src/index.ts`:
  - `paintBuildings`: derives `bIsStaffed = isBuildingStaffed(state, b, gx, gy)` and passes `isStaffed` & `hasWorker` to `bOptions`.
- Invariants: Sim and server unchanged (`git diff origin/main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. Non-blocking `eventMode = "none"`. Zero `theme.css` changes. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — render / soft gold ground ring hint glow on empty work plots (bakeoff/gemini-hint-glow)

- `packages/render/src/tiles.ts`:
  - `export function parsePlotCoord(plot: string | { x: number; y: number } | null | undefined): { x: number; y: number } | null`:
    - Safely parses plot coordinate objects (`{ x: number, y: number }`) or coordinate strings (`"4,2"`, `"plot_4_2"`, `"4-2"`, `"4_2"`). Returns `null` if invalid, non-empty, or unparseable.
  - `export function drawPlotGlowRing(g: Graphics, wx: number, wy: number, phase: number = 0, alpha: number = 0.85): void`:
    - Renders a soft gold 2:1 isometric ground ring on the hold turf:
      - Diffused ambient gold light pool (`0xfde047`, `0xfacc15`) with subtle breathing pulse.
      - Outer warm amber glow ring stroke (`0xf59e0b`, width 2.6).
      - Radiant primary gold core ring (`0xfef08a`, width 1.4).
      - Crisp specular highlight rim arc (`0xffffff`, alpha 0.40) on the front curve.
      - Four shimmering cardinal nodal pips (`0xfffbeb`, `0xfde047`) at top, bottom, left, and right of the ellipse.
      - Early return guard if `alpha <= 0`.
  - `export function drawPlotStake(g: Graphics, wx: number, wy: number, phase: number = 0, visuals?: ThemeVisuals, glowAlpha: number = 0): void`:
    - Added optional `glowAlpha = 0` parameter. When `glowAlpha > 0`, invokes `drawPlotGlowRing(g, wx, wy, phase, glowAlpha)` directly beneath the surveyor stake.
  - `export function paintEmptyPlotStakes(g: Graphics, state: GameState | null | undefined, phase = 0, visuals?: ThemeVisuals, includeRoads = false, hintPlot?: string | { x: number; y: number } | null): void`:
    - Added optional `hintPlot` argument.
    - If `hintPlot` points to a valid empty plot `(x, y)`: renders `glowAlpha = 0.85` on that specific targeted plot, and `glowAlpha = 0` on all other empty plots (other empty stakes stay plain).
    - If `hintPlot` is not provided (`null` or `undefined`): renders low-opacity fallback glow `glowAlpha = 0.22` across every empty hold plot.
    - If `hintPlot` points to an occupied built plot: other empty plots stay plain (`glowAlpha = 0`), occupied plot gets no stake.
- `packages/render/src/index.ts`:
  - `MapRenderer` interface additions:
    - `sync(state: GameState, selectedProvinceId?: string | null, hintPlot?: string | { x: number; y: number } | null): void`
    - `setHintPlot(hintPlot: string | { x: number; y: number } | null): void`
    - `getHintPlot(): string | { x: number; y: number } | null`
  - Implementation:
    - Maintains `currentHintPlot: string | { x: number; y: number } | null = null`.
    - Listens to `"sc-hint-plot-change"` CustomEvent on `window` for app communication without direct coupling.
    - Re-renders `plotStakesLayer` on hint updates and during hold animation ticker with `currentHintPlot`.
    - Cleans up window listener in `destroy()`.
- Invariants: Sim and server unchanged (`git diff origin/main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. No `theme.css` changes. Non-blocking `eventMode = "none"`. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — render / empty work plots wooden survey stake (bakeoff/gemini-plot-stake)

- `packages/render/src/tiles.ts`:
  - `export function isEmptyWorkPlot(state: GameState | null | undefined, gx: number, gy: number, includeRoads = false): boolean`:
    - Checks bounds (`gx >= 0 && gy >= 0 && gx < GRID_W && gy < GRID_H`), excludes rim tiles (`isRimTile(gx, gy)`), excludes cobblestone roads (`ROAD_TILES.has(...)` unless `includeRoads`), and returns false if occupied by any building in `state.buildings`.
  - `export function listEmptyWorkPlots(state: GameState | null | undefined, includeRoads = false): Array<{ x: number; y: number }>`:
    - Iterates interior grid plots and collects all coordinates satisfying `isEmptyWorkPlot`.
  - `export function drawPlotStake(g: Graphics, wx: number, wy: number, phase: number = 0, visuals?: ThemeVisuals): void`:
    - Renders an authentic wooden surveyor's stake:
      - Soft elliptical turf contact shadow (`0x000000`, alpha 0.28) and dark soil indent (`0x271708`, alpha 0.45).
      - Displaced loam soil turf clods (`0x3f220c`, `0x2e1908`) around the base.
      - Chiseled hardwood timber stake shaft (`0x78350f`) with left sunlit wood grain highlight (`0xb45309`), chamfered mallet-struck heartwood top cut (`0xd97706`), and fine vertical wood grain split line (`0x451a03`).
      - Hemp twine neck wrapping (`0xfef08a`) binding the upper peg.
      - Fluttering surveyor marker ribbon in vermilion red (`0xef4444`, `0xb91c1c`) with golden tie knot bead (`0xfacc15`) animated with `phase`.
      - Seasonal winter frost cap (`0xf8fafc`) in winter/midwinter themes.
  - `export function paintEmptyPlotStakes(g: Graphics, state: GameState | null | undefined, phase = 0, visuals?: ThemeVisuals, includeRoads = false): void`:
    - Clears the graphics and iterates `listEmptyWorkPlots`, drawing a stake at `gridToWorld(x, y)` for each open plot.
- `packages/render/src/index.ts`:
  - Added `plotStakesLayer = new Graphics()` to `holdContainer` right after `groundLayer` and before `entitiesLayer`.
  - `plotStakesLayer.eventMode = "none"` strictly guarantees `pointer-events: none`, preserving 100% unimpeded tile hovering and clicking.
  - Integrated `paintEmptyPlotStakes(plotStakesLayer, ...)` in initial setup, `sync()`, `setTheme()`, and the animation ticker under `currentBand === "hold"`.
- Invariants: Sim and server unchanged (`git diff origin/main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. No `theme.css` changes. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — render / player keep chimney hearth smoke when hold has people, quieter if empty (bakeoff/gemini-keep-hearth)

- `packages/render/src/buildings.ts`:
  - `export function holdHasPeople(state?: GameState | null, realmId = "player"): boolean`:
    - Checks boolean flag `state.hasPeople`, number `state.population > 0`, citizens in realm `state.citizens.filter(c => c.realmId === realmId).length > 0`, `sim.population(state, realmId) > 0`, and armed units `state.units.filter(u => u.realmId === realmId && Number(u.count) > 0).length > 0`.
  - `export interface BuildingDrawOptions`:
    - Added optional `hasPeople?: boolean` property. In `drawIsometricBuilding`: resolved as `options?.hasPeople ?? (options?.state ? holdHasPeople(options.state) : true)`.
  - `case "keep":` in `drawIsometricBuilding`:
    - Western keep: Added Ashlar stone chimney stack on the hold roof terrace (`0x64748b`, `0x475569`, `0x334155`) with masonry course line and dark flue cavity (`0x09090b`).
    - When `complete` and `hasPeople`: draws golden hearth ember glow at the flue opening (`0xfef08a`, alpha up to 0.45), and 4 rising billowing smoke puffs (`0xe2e8f0`, `0xf1f5f9`, `0xf8fafc`, `0xffffff`) with radii expanding from 2.4 to 5.0 and wind drift.
    - When `complete` and `!hasPeople`: "quieter if empty" — draws faint, thin lazy wisp (`0xd1d5db`, `0xe5e7eb`, radius <= 1.6, alpha 0.12–0.18).
    - When `!complete`: construction scaffolding suppresses live hearth smoke.
  - `drawKeepCulture`:
    - Added `hasPeople = true` parameter. Updated all 4 kits (`cedar`, `sand`, `steppe`, `islands`) to draw active billowing hearth smoke with warm flue glow when `hasPeople` is true, and quieter faint wisps when `hasPeople` is false.
- `packages/render/src/tokens.ts`:
  - `drawMiniatureKeep`: added `hasPeople` check for player home keep (`isHome === true`), drawing warm ember glint and billowing miniature puffs when populated, and quieter faint wisp when empty. Added `hasPeople?: boolean` to `MiniatureKeepOptions`.
- `packages/render/src/index.ts`:
  - `paintBuildings`: derives `hasPeople = holdHasPeople(state)` and passes `hasPeople` to `buildingOptions` and per-building `bOptions`.
- Invariants: Sim and server unchanged (`git diff origin/main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. No `theme.css` changes. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — render / closed home gate lit lamp & warm slot, open gate dark & raised (bakeoff/gemini-gate-lamp)

- `packages/render/src/buildings.ts`:
  - `case "gate":` in `drawIsometricBuilding`:
    - Closed gate (`isRingClosed === true`): rendered with flush closed oak double doors, iron hinge straps, center drop bar, lowered portcullis teeth, a warm viewing slot (`0xfef08a`, `0xf59e0b`) casting golden light spill (`0xfde047`, `0xfbbf24`) across the cobblestone threshold, and an exterior wall lantern sconce on the bastion with glowing glass (`0xfacc15`), flame core (`0xffffff`), and radiant ambient warm halo (`0xfde047`, `0xf59e0b`).
    - Open gate (`isRingClosed === false`): rendered with deep dark passage shadow (`0x09090b`, `0x050507`), unlit cold lantern glass (`0x3f3f46`), zero warm light spill or glow, and a heavy portcullis hoisted high into the archway vault with horizontal crossbars (`0x475569`), vertical bars (`0x64748b`), spiked arrow teeth (`0x334155`), and hoist chains (`0x94a3b8`).
  - `drawGateCulture`:
    - Supported across all 4 culture kits (`cedar`, `sand`, `steppe`, `islands`), giving closed gates the warm slot and lit lantern with radiant halo, and giving open gates deep dark shadow passages with raised portcullis / timber gate teeth and unlit cold lantern frames.
- Invariants: Sim and server unchanged (`git diff origin/main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. No `theme.css` changes. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — render / finished quarry cut stone, crane & piles, unfinished scaffolding (bakeoff/gemini-quarry-yard)

- `packages/render/src/buildings.ts`:
  - `export function drawQuarryScaffolding`: renders timber scaffolding for unfinished quarries with ground pit footprint, turf spoils/dirt chips, corner upright scaffold standards, horizontal ledger beams, diagonal X-braces with joint lashings, work staging planks deck, and hoist tripod beam with suspended builder stone.
  - `case "quarry":` in `drawIsometricBuilding`:
    - Unfinished (`!complete`): routes directly to `drawQuarryScaffolding(g, heightBoost, a, phase, kit, cult)`.
    - Finished (`complete`): renders excavated granite bedrock floor (`0x27272a`), stepped rock strata (`0x71717a`, `0x52525b`, `0x3f3f46`), cut stone ashlar block stacks on pallets (`0xcbd5e1`, `0x94a3b8`, `0xe2e8f0`) with mortar seams, fresh pyramidal rubble rock piles (`0x64748b`, `0x52525b`, `0x71717a`), rear ledge stone block piles, wooden A-frame crane with brass pulley (`0xf59e0b`), steel cable line (`0xd1d5db`), hoisted granite block (`0xa1a1aa`), mason pickaxe (`0x451a03`, `0x94a3b8`), and wooden wheelbarrow (`0x854d0e`).
  - Cracked stone overlay check (~line 5982): added `&& typeId !== "quarry"` so unfinished quarries do not receive battle damage scars.
- `packages/render/src/tokens.ts`:
  - `drawKeepYardAnnex`: added bespoke silhouette for finished quarry (`typeId === "quarry"`) with excavated pit bedrock, stepped rock strata, cut stone ashlar stacks, rubble piles on that tile, wooden A-frame crane with brass pulley and hoisted block, and pickaxe. Updated `const isStone = typeId === "mason";` so finished quarry does not fall through to the cottage renderer. Unfinished keep-yard quarry preserves timber scaffolding.
- `packages/render/src/index.ts`:
  - `entitiesLayer.eventMode = "none"` and `g.eventMode = "none"` ensure all building graphics remain strictly non-blocking (`pointer-events: none`).
- Invariants: Sim and server unchanged (`git diff origin/main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. No `theme.css` changes. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — render / finished watchtower clear beacon & gold glint (bakeoff/gemini-tower-beacon)

- `packages/render/src/buildings.ts`:
  - `case "watchtower":` in `drawIsometricBuilding`:
    - Finished Western watchtower: enhanced with clear beacon fire (animated flame tongues `0xf97316`, `0xfacc15`, white-hot core `0xffffff`), warm radiant glow halo (`0xfde047`) on both rim and interior towers, rising ember sparks (`0xfef08a`, `0xffffff`), and a gleaming 4-point diamond star **gold glint** (`0xfacc15`, `0xffffff`) atop the beacon spire finial with brazier rim reflections.
    - `drawWatchtowerCulture`: culture watchtowers (`cedar`, `sand`, `steppe`, `islands`) now feature clear beacon flames/glow and 4-point diamond star gold glints atop their respective finials/masts while strictly preserving culture-specific color counts for rim assertions.
    - Unfinished watchtowers: strictly route through `drawWatchtowerScaffolding` across all kits, preserving timber construction standards, ledgers, X-braces, and builder's hoist, with zero beacon flames, zero radiant halos, and zero gold glints.
- `packages/render/src/tokens.ts`:
  - `drawKeepYardAnnex`: added bespoke finished watchtower silhouette with stone shaft, dark arrow loop slits (`0x0f172a`), battlements parapet, clear elevated beacon fire (`0xf97316`, `0xfde047`, `0xfacc15`), and animated gold glint star (`0xfacc15`, `0xffffff`). Unfinished keep-yard watchtowers retain timber scaffolding.
- `packages/render/src/index.ts`:
  - `entitiesLayer.eventMode = "none"` and `g.eventMode = "none"` set explicitly, strictly preventing any DOM pointer event capture.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. No `theme.css` changes. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — app / quarry and watchtower hints (wave/hint-quarry-tower)

- `buildHints.ts` reads all numbers from sim data. If the Quarry or Watchtower type goes away, or Watchtower stops producing gold, the hint returns `null` and nothing renders.
- Stone check compares raw `state.resources.stone` to ceil(cost × multiplier), matching `canAfford`. It ignores wood, so the line shows only when stone is the blocker (possibly alongside wood).
- Scout hint sits inside `.sc-inspect-actions` with `flexBasis: 100%` so it drops below the buttons.

## 2026-09-30 — sim / playtest harness (wave/playtest-harness)

- The bot calls only exported `try*` actions plus `TickEngine.tick()`, with the same starting state as the app's `freshState` (wood 40, food 50, starter farm + lumber camp) but without `setPlayerCulture` (browser-only pick).
- `try*` returns only a boolean, so each attempt runs a readable precheck first (`cannot afford`, `no free work plot`, `gold < 22`, `march slots full`). "sim said no (precheck passed)" means the precheck missed a rule.
- `playtestHarness.ts` does no I/O (INVARIANTS 6). Only `playtest.report.ts` touches `node:fs`, and it is excluded from `npm test`, so the server's `npm test` never dirties `docs/PLAYTEST.md` before a `git pull`.
- Soft asserts (per turn): tick advanced by exactly N, resources finite and ≥ 0, unit counts sane, population ≤ beds, `marches_json`/`gathers_json`/`fog_seen` parse. They are reported, not thrown.
- Known bot limits: one gather column at a time, one raid march, no trade/market, no keep. Extend `botTurn` for new goals.

## 2026-09-30 — render + app / board-only seasonal wash (bakeoff/gemini-season-wash)

- `resolveBoardSeasonWash(state, province?, visuals?)` in `packages/render/src/tokens.ts`:
  - Reads `currentSeason(state)` (and holiday overrides).
  - Winter (`season === "Winter"` or holiday `"midwinter"`): `hasWash: true, washColor: 0xbae6fd, washAlpha: 0.22, kind: "winter-frost"` for all tiles.
  - Harvest (`season === "Autumn"` or holiday `"harvest"`): `hasWash: true, washColor: 0xf59e0b, washAlpha: 0.22, kind: "harvest-gold"` only when `p.terrain === "plain" || p.node === "field"`. Other terrain receives `hasWash: false`.
  - Spring / Summer: `hasWash: false, washColor: null, washAlpha: 0, kind: "none"`.
- `paintBoardProvinces`: applies `resolveBoardSeasonWash`. Winter draws rear/front frost rime strokes and snow dusting flecks. Harvest draws golden rim highlight and wheat glints.
- `OverworldAtlas.tsx`: mounts SVG polygons/polylines matching `resolveBoardSeasonWash` with `pointerEvents: "none"`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. March speed and farm yield untouched. No `theme.css` changes. Zero conflict markers.

## 2026-09-30 — app / lofi dock stable (wave/lofi-stable)

- Lofi playback never changes `lofiIndex` on failure. Only the player (list, prev, next) or a clean `ended` on unpinned play moves it.
- `lofiPinned` becomes true on any `playLofiTrack` call and is applied as `el.loop` in `playLofi`. There is no unpin besides reload; add one if a "play through" toggle is wanted.
- Retrying a `missing` src needs `lofiSrc = null` (see `retryAfterFailure`), otherwise `playLofi` reuses the errored element and `play()` rejects without reloading.
- `main.tsx` calls `startMusicBed()` on every document click. It deliberately skips `playLofi` while `missing`, so clicks do not hammer a 404.
- In `runBed`, lofi `hush` includes `lofiStatus === "missing"`, so a failed file is silence, not the synth arpeggio.

## 2026-09-30 — app / keep rooms 2D backdrops (bakeoff/gemini-rooms)

- `RoomBackdrop.tsx`: exports `RoomBackdrop`, `ThroneDaisBackdrop`, `WallWalkBackdrop`, and `MuddyYardBackdrop`.
  - Hall: Throne dais (`sc-keepin-backdrop-throne-dais`) featuring 3-tier elevated stone dais platform (`daisStepGrad`), high-backed carved monarch throne with golden finials and royal crimson tufted cushion, overhead draped canopy (`canopyVelvet`), vaulted alcove arch, torch sconces with warm radial glows (`torchGlowLeft`, `torchGlowRight`), and heraldic tapestries.
  - Wall: Wall walk (`sc-keepin-backdrop-wall-walk`) featuring stone battlements (`wallStone`) with merlons and cruciform arrow slits, weathered timber duckboards (`walkwayTimber`), iron tripod braziers with burning coals and rising embers (`brazierGlowLeft`, `brazierGlowRight`), leaning sentry shield, and crossed halberds overlooking a twilight sky (`twilightSky`).
  - Yard: Muddy yard (`sc-keepin-backdrop-muddy-yard`) featuring heavy churned earth (`mudEarth`) with deep curved wheel ruts, standing rainwater puddles with sky reflections (`puddleReflect`), bailey palisade fence, stacked barrels (`barrelWood`) & crates, and soldier training quintain dummy.
- `KeepInterior.tsx`: mounts `<RoomBackdrop room={room} />` in each room tabpanel (`is-hall`, `is-wall`, `is-yard`).
- `keep-interior.css`: scoped styles for `.sc-keepin-backdrop-wrap`, `.sc-keepin-backdrop-art`, `.sc-keepin-backdrop-badge`. Strictly enforces `pointer-events: none !important;` so all plot clicks, facts, tabs, and buttons are unimpeded.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — app / keep rooms (wave/keep-rooms)

- Room is view state in `KeepInterior` (`useState<Room>("hall")`), reset to Hall each time the keep opens because the component unmounts on close. Not in `GameState`, not saved, never passed to the sim.
- Wall and Yard rooms read only: `wallHp`, `edgeWallCount(state, "player")`, `hasClosedWallRing`, `gateOnRim`, `gateHp`, `countBuilding(state, "walls")`, `keepBonus`. Yard rule matches `keepYardWorks` in `ProvinceInspect.tsx`; if one changes, change both.
- Wall room deliberately does not print the ring threshold (8 rim walls lives in `hasClosedWallRing`), so the UI cannot drift from the sim rule.
- Only the Hall room renders the plot grid; taps still go through `tapHoldTile`.

## 2026-09-30 — render + app / supply cart art & load silhouettes (bakeoff/gemini-supply)

- `resolveGatherLoadInfo(item, state?)` in `packages/render/src/tokens.ts`: inspects item and state presentation gathers to classify `stockCount`, `capacity`, `ratio`, `isLoaded`, and `isEmptyReturn`. When `stockCount <= 0` or returning with empty load, `isEmptyReturn` is set to true.
- `drawGatherColumnMeeple` in `packages/render/src/tokens.ts`:
  - Draft yoke: forward arched hardwood yoke beam (`0x92400e`), under-neck iron yoke bow (`0x27272a`), central brass hitch ring (`0xd4a359`), and dual timber draft trace shafts (`0x78350f` / `0x451a03`).
  - Crate stack & load: timber crates (`0xb45309`), iron corner straps (`0x27272a`), diagonal X-braces, bulging burlap sacks, barrels, node cargo (wood logs, stone blocks, gold coffers, grain sheaves), and tie-down ropes (`0xfef08a`).
  - Empty return: bare floorboard lines (`0x543007`), open timber side stakes (`0x27272a`), folded drop cloth (`0xa16207`), and slate empty badge (`0x64748b`).
- `WarChip.tsx` & `ForceCard.tsx`: `CartSvg` updated with forward draft yoke and loaded/empty variants; gather cards in `WarRoom.tsx` compute and pass `loaded` and `empty` props.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. All chips strictly `pointer-events: none !important;`. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — app / HUD captains (wave/hud-captains)

- `captainName(id)` in `packages/app/src/hud/captainName.ts` is pure and display-only: FNV-1a over the id string, `% CAPTAINS.length`. Not sim state, not saved; do not read it from the sim.
- Reordering or resizing `CAPTAINS` renames every force on screen. Append-only is not enough either (the modulus changes), so treat the list as fixed once players have seen it.
- Used for `March.id` (scout, hostile) and `Gather.id`. Garrisons have only `provinceId`, so no captain; add one only if garrisons gain a real id.

## 2026-09-30 — server + app / save lock (wave/save-lock)

- `gateSave(raw, prev, elapsedMs, replace = false)`. Conflict cases throw `SaveGateError(409, NEWER_HOLD, true)`: `prev.meta.version > next.meta.version`; `next.tick < prev.tick` unless `replace` and the tick fits the fresh-game window; input log shorter than or diverging from the stored one. Other 409s (faster than real time, back-dated, state change without time) stay `conflict: false`: those are cheat checks, not stale copies.
- `/save` handler: on `e.conflict`, returns `{ error, conflict: true, save: <stored file as string> }`. `replace` comes from the `?replace=1` query (no new CORS headers).
- Client: `pushSave` throws `CloudConflictError(message, save)`. `CloudPanel.push()` catches it and sets `newer`; **Load cloud** writes `newer` (or a fresh `pullSave`) to IndexedDB and reloads. **Keep this game** confirms and pushes with `replace`.
- Load cloud reloads right after the IndexedDB write; the pagehide auto-push then sends the cloud save back unchanged, which the gate accepts.

## 2026-09-30 — app / keep interior (wave/keep-interior)

- `useGameEngine.tapHoldTile(x, y)` is the single hold-tile action path (cancel build → cancel upgrade → upgrade → place `selectedBuildRef`). `map.onTileClick(tapHoldTile)`; `KeepInterior` gets it as `onTap`. Change build/tap behaviour there, not in the component.
- `KeepInterior.tsx` mirrors `HOLD_W = 16` / `HOLD_H = 10` from `packages/sim/src/actions/build.ts` (not exported). If the hold size changes, update both.
- Keep-yard highlight uses `keepBonus(state, b) > 1` (same test as the inspect card's "Keep yard" line). Chip staffed = `staffBonus > 1`, like `WorkCard`.
- Open state lives in `AppShell` (`keepOpen`), rendered only while `tab === "kingdom"`. Styles: `keep-interior.css`, classes `sc-keepin*` and `sc-inspect-enter-keep`.

## 2026-09-29 — server / save gate (wave/security-gate)

- The client cannot set resources. `server/savegate.mjs` `gateSave(raw, prevSave, elapsedMs)` runs on every `PUT /save` in `server/index.mjs`; throws `SaveGateError(status, message)`, and the handler returns that as `{ error }`. Nothing is written on a throw.
- `parseSave`: whole `GameState` shape required (all top-level objects/arrays), `meta.version` 1..`SAVE_VERSION`, integer `meta.tick`, resources and unit counts as number strings, input log entries with `tick <= meta.tick`.
- Against the previous accepted save: tick advance bounded by server wall time since the last accepted push (`saveAt` on the user record, file mtime for older records) at the fastest client speed plus a small clock slack; input log append-only and not back-dated; no resource/building/unit change at the same tick unless the input log grew; a lower tick is accepted only as a new game.
- Mirrored constants (`SAVE_VERSION`, `TICKS_PER_SECOND`, `MAX_SPEED`) are asserted against `packages/shared` and `HudControls.tsx` in `savegate.test.mjs`. If you add a faster speed button or bump the save version, update `savegate.mjs`.
- Some sim actions change resources without logging to `inputLog` (invariant 3 gap). A paused-game push after one of them is refused until time moves. Logging those actions would remove the false refusals.
- Run server tests: `cd server && node --test savegate.test.mjs ledger.test.mjs ledger-http.test.mjs` (root `npm test` only covers `packages/sim`).
- Full cost checking of each action would need the sim on the server, which DECISIONS.md rules out; changing that is an owner decision.

## 2026-09-29 — app / music mode + lofi (wave/lofi-radio)

- `packages/app/src/music.ts`: `mode: "off" | "lofi" | "bed"` (key `sc-music`, default `off`; old `sc-music-muted` is no longer read). Internal `muted` = mode off. `isMusicMuted()` now means "Realm bed silent" (mode !== bed) so `audioManager` pauses holiday/battle recordings in Lofi too.
- `setMusicMode` persists, clears timers, starts/stops lofi, reruns the bed and fires `window` event `sc-music-change`. `setMusicMuted(bool)` kept as a toggle between off and the last non-off mode.
- Lofi player: one `HTMLAudioElement`, `LOFI_TRACKS` = `LOFI_FILES` (hand-listed filenames, code-point order) mapped through `encodeURIComponent` (names have spaces, commas, parens). Holiday `.ogg`s excluded. Not looped per file; `ended` advances the index mod length. `error` skips to the next; after every file fails in a row it gives up and `runBed` plays the `LOFI` synth pattern (0.7s step, sine, no battle pulse). While a file is `playing`, the synth hushes.
- Change detection uses a private `lofiSrc` (not `el.src.endsWith`, which breaks on percent-encoded names).
- To add tracks: drop a CC0/CC-BY `.ogg` into `packages/app/public/audio/`, add its exact filename to `LOFI_FILES` in sorted position, credit it in `CREDITS.md`, rebuild. There is no directory scan at runtime. Note `19`/`23` (Clouds) and `20`/`21` (Busted Jazz) share titles but are different files.
- Track API in `music.ts`: `getLofiIndex`, `playLofiTrack(i)` (wraps, resets error count, plays only in lofi mode), `nextLofiTrack`, `prevLofiTrack`, `lofiTrackName(i)` (strips `NN HoliznaCC0 - ` and `.mp3`/`.ogg`). `playLofi` fires `window` event `sc-lofi-track` whenever the src changes (manual pick, ended, or 404 skip).
- `MusicDock.tsx` renders private `LofiDock` (hook `useLofiIndex`) after the mode select when mode is lofi. List rows are numbered because `19`/`23` and `20`/`21` share titles. Styles: `packages/app/src/lofi-dock.css` (chrome-btn tokens only, no theme.css edits).
- `MusicDock.tsx` (`MusicDock`, `useMusicMode`) mounted in `ChromeDock.tsx` before `<ThemeDock />`; `HudControls.tsx` reads the same hook.
- `audioManager.setMuted` now only calls `setMusicMuted`; the pause/resume body moved to private `applyMuted`, driven by the `sc-music-change` listener registered in `init()`.

## 2026-09-29 — sim / primer v3 text (wave/primer-v3)

- `TUTORIAL_STEPS` in `packages/sim/src/systems/tutorial.ts`: text rewritten only. Ids pinned by `tutorial.test.ts` kept. `tryAdvanceTutorial` untouched.
- `PrimerTab` gains `"world"`; `TAB_HINT` in `TutorialBanner.tsx` gains `world` and the board hint now says the inspect card lives on the Kingdom tab (it only renders there, see `AppShell.tsx`).
- `march` step tab moved army → board: the Column box and "Send raid column" live on the inspect card, not Army.
- Not covered: quests (`QuestPanel.tsx` unmounted), People as its own tab (it is a section of Kingdom), market stalls (MarketPanel says stalls are not live yet).

## 2026-09-30 — render / seasonal weather precipitation particles (bakeoff/gemini-weather)

- `resolveWeatherKind` & `resolveWeatherFromState` in `packages/render/src/weather.ts`:
  - Determines precipitation mode from state season and holiday:
    - `"rain"`: Autumn seasons (`"autumn"`, `"fall"`) and wet holidays (`"harvest"`, `"halloween"`).
    - `"snow"`: Winter season (`"winter"`) and winter holiday (`"midwinter"`).
    - `"clear"`: All other seasons/holidays (`"spring"`, `"summer"`, `"easter"`, `"midsummer"`, etc.).
  - Re-exported in `packages/render/src/index.ts`.
- `paintWeatherParticles` & `createWeatherParticles` in `packages/render/src/weather.ts`:
  - Rain: slanted falling streaks (`lineTo(p.x - 1.4, p.y + len)`), `0x93c5fd` at alpha 0.6, with subtle ground splash ripples (`0x60a5fa`) near the bottom of the viewport.
  - Snow: gentle downward drift with sinusoidal flutter (`Math.sin(t * 1.5 + p.phase) * 0.45`), crystalline white core (`0xf8fafc`) and cyan halo (`0xbae6fd`).
  - Clear: executes `g.clear()` and returns immediately without emitting draw calls.
  - Interactive safety: both `particlesGraphic.eventMode = "none"` (hold view) and `boardWeatherGraphic.eventMode = "none"` (board view) ensure Pixi pointer events are never captured.
- `packages/app/src/seasons/WeatherOverlay.tsx`:
  - Canvas 2D precipitation updated to use `resolveWeatherKind(season, holiday)`:
    - Rain in autumn-ish wet seasons, snow in winter, clear (count = 0) otherwise.
    - Inline style and `.sc-weather-container, .sc-weather-container * { pointer-events: none !important; user-select: none !important; }` in `packages/app/src/theme.css` ensure clicks always penetrate through to interactive UI and tiles.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-29 — render / tiles that are march destinations get faint ring (bakeoff/gemini-dest)

- `buildMarchDestinationMap` & `getTileMarchDestination` in `packages/render/src/tokens.ts`:
  - Scans active marches in `listMarches(state)` and gathers in `listGathersPresentation(state)`:
    - Hostile enemy columns (`realmId !== "player"` or `isIncomingMarch(m, state)`) mapping to `m.toId` are tagged `"hostile"`.
    - Player columns (`realmId === "player"`) mapping to `m.toId` are tagged `"player"`.
    - Outbound gathers map to `g.toId`; returning gathers map to home `fromId`.
    - Hostile enemy destinations take alert priority when both factions march toward the same province.
  - Exported and re-exported in `packages/render/src/index.ts`.
- `paintBoardDestinationRing` in `packages/render/src/tokens.ts`:
  - Renders a faint, animated ring around the perimeter of destination tiles:
    - Player gold palette: `0xf59e0b` (ring), `0xd97706` (glow), `0xfde047` (shimmer & pips).
    - Hostile red palette: `0xef4444` (ring), `0xdc2626` (glow), `0xfca5a5` (shimmer & pips).
    - Tabletop ground ring at `wy` with soft atmospheric glow (`alpha: 0.25 - 0.55`).
    - Elevated plateau ring at `cy` (`wy - elev`) with rear-facet sunlit shimmer.
    - Subtle cardinal corner bracket pips on the 4 diamond vertices.
    - Animated breathing pulse driven by `Math.sin(phase * 3 + p.x * 2 + p.y) * 0.12`.
    - Distinct from the thick, high-opacity gold player selection rim (`paintBoardSelectionRim`).
  - Exported and re-exported in `packages/render/src/index.ts`.
- `paintBoardProvinces` in `packages/render/src/tokens.ts`:
  - Builds `marchDestMap = buildMarchDestinationMap(state)` once per frame.
  - Renders `paintBoardDestinationRing` for both unseen (fog cloud veil) and seen tiles.
  - Rendered at step 6.5 after relief art and structures, immediately preceding step 7 selection rim.
- `OverworldAtlas` in `packages/app/src/OverworldAtlas.tsx` & `theme.css`:
  - Evaluates `destKind = getTileMarchDestination(state, p.id)` per province.
  - Renders `<g className="sc-atlas-dest-ring" pointerEvents="none">` with diamond ground/plateau strokes and corner pips.
  - Added `.sc-atlas-dest-ring` with `pointer-events: none !important;` in `theme.css`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-29 — render / rival home keeps show realm crest above keep (bakeoff/gemini-capitals)

- `drawRealmCrestAboveKeep` in `packages/render/src/tokens.ts`:
  - Implements a finely-rendered heraldic escutcheon shield floating above keep pinnacles (`cx`, `cy - 23.5`):
    - Ground drop shadow on keep / air (`0x050403`, alpha 0.65).
    - Escutcheon rim plaque (`pal.plaqueColor`, `pal.borderColor`).
    - Inner shield field filled with `pal.pennantColor` and subtle accent inner border (`pal.accentColor`, alpha 0.5).
    - Faction-specific heraldic charge / sigil:
      - `rival` (Iron March): Crossed blades (`0xf4f4f5`), crimson boss rivet (`0xef4444`), gold stud (`0xfef08a`).
      - `k_silk` (Silk Coast): Golden anchor (`0xf1c40f`, `0xfef08a`) with bezier nautical curve.
      - `k_ash` (Ash Nomads): Steppe arrowhead (`0xe67e22`, `0x7c2d12`, `0xfde047`).
      - `k_veil` (Veil Theocracy): Radiant 8-pointed star (`0xffffff`, `0xa78bfa`, `0x7c3aed`).
      - `k_glass` (Glass Cities): Faceted cyan prism diamond (`0x06b6d4`, `0x38bdf8`, `0xffffff`).
      - `k_frost` (Frost Holds): Six-pointed snowflake crystal (`0xffffff`, `0x7dd3fc`).
      - `k_tide` (Tide Princes): Twin bezier ocean surf waves (`0x2dd4bf`, `0x5eead4`).
      - `k_ember` (Ember Concord): Rising flame comet (`0xea580c`, `0xf97316`, `0xfef08a`).
      - `k_bronze` (Bronze League): Classical bronze arch & anvil (`0xfbbf24`, `0xfde68a`).
      - default: Chevron & realm stud (`pal.accentColor`, `pal.studColor`).
    - Finial crown stud atop the shield apex (`pal.studColor`, `pal.borderColor`, `0xffffff`).
    - Breathing glint at upper-left corner driven by `Math.sin(phase * 3 + cx)`.
  - Exported and re-exported in `packages/render/src/index.ts`.
- `drawMiniatureKeep` in `packages/render/src/tokens.ts`:
  - When `!isHome && realmPal && realmPal.realmId !== "player"`, calls `drawRealmCrestAboveKeep(g, cx, cy, realmPal, phase)`.
  - When `isHome === true`, renders the player's majestic sovereign golden coronet (`0xfacc15`, `0xfde047`) and gilded royal frame; `drawRealmCrestAboveKeep` is NOT called (player home is unchanged).
- `OverworldAtlas` in `packages/app/src/OverworldAtlas.tsx` & `theme.css`:
  - Added `<MiniRealmCrest>` SVG component with matching shield geometry, faction colors, and charges.
  - Passes `occupantRealmId={p.occupantRealmId}` to `MiniKeep`.
  - When `!home && occupantRealmId && occupantRealmId !== "player"`, renders `<MiniRealmCrest>` above the keep.
  - Wrapped with `.sc-atlas-realm-crest` and `pointer-events: none !important;` in `theme.css` so atlas clicks cleanly fall through.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-29 — render / light seasonal and holiday tint on board tiles (bakeoff/gemini-season-tint)

- `getThemeVisuals` in `packages/render/src/buildings.ts`:
  - Normalized case matching for season (`spring`, `summer`, `autumn`, `winter`) and holiday (`halloween`, `midwinter`, `easter`, `harvest`, `midsummer`).
  - Configured seasonal tints:
    - Spring: `0x86efac` (spring green, alpha 0.10)
    - Summer: `0xfef08a` (summer sunbeam, alpha 0.10)
    - Autumn: `0xf59e0b` (autumn gold, alpha 0.14)
    - Winter: `0xbae6fd` (winter cool frost cyan, alpha 0.14)
    - Holidays: Halloween (`0x581c87`, alpha 0.18), Midwinter (`0x38bdf8`, alpha 0.16), Easter (`0xc084fc`, alpha 0.12), Harvest (`0xf59e0b`, alpha 0.16), Midsummer (`0xfde047`, alpha 0.14).
- `resolveBoardThemeVisuals` & `resolveBoardSeasonTint` in `packages/render/src/tokens.ts`:
  - Exported helper functions for resolving `ThemeVisuals` and `BoardSeasonTint` from `state` (via `currentSeason` or `state.season`) and active flags/theme overrides.
  - Re-exported from `packages/render/src/index.ts`.
- `paintTileHeightFace` in `packages/render/src/tiles.ts`:
  - Accepts optional `theme?: ThemeVisuals | null`.
  - Glazes front-left cliff face (`theme.tintAlpha * 0.55`) and front-right cliff face (`theme.tintAlpha * 0.40`) with `theme.tintColor`.
- `paintBoardProvinces` in `packages/render/src/tokens.ts`:
  - Accepts optional `visuals?: ThemeVisuals | null`.
  - Passes `theme` to `paintTileHeightFace`.
  - Glazes `topDiamond` with `theme.tintColor` and `theme.tintAlpha` directly above base `pal.fill` and before drawing relief artwork, highlights, borders, and meeples, preserving full terrain visibility.
- `OverworldAtlas` in `packages/app/src/OverworldAtlas.tsx`:
  - Resolves `seasonTint` via `currentSeason(state)` and `detectCurrentHoliday()`.
  - Glazes seen tile cliffs and top diamond with `pointerEvents: "none"`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-29 — render / tiny seconds badge on board march meeples (bakeoff/gemini-eta)

- `drawMarchEtaBadge` in `packages/render/src/tokens.ts`:
  - Implements a compact floating seconds badge (`w = 10 + 4 * text.length`, `h = 9`) above board march meeples with drop shadow (`alpha: 0.45`), dark container pill (`0x090d16`), status pip (golden hourglass or hostile crimson skull), and 3x5 bitmap pixel font.
  - Pixel font defined via `MARCH_ETA_GLYPHS_3X5` (3-bit masks for digits 0-9 and 's'), eliminating DOM font dependencies and guaranteeing full determinism across headless tests and WebGL.
  - Dynamically offsets with the marching stride and head bob (`pawnY - 28 - bob`).
- `paintBoardMarches` in `packages/render/src/tokens.ts`:
  - Calculates `secs = Math.ceil(ticksLeft / 10)` when `typeof m.arrivesTick === "number"`.
  - Displays `drawMarchEtaBadge` for all active march types with arrival times: scout columns (`0x38bdf8`), gather columns (`0x22c55e`), garrison detachments (`0x3b82f6`), player war columns (`pal.accentColor`), and hostile warbands (`0xdc2626`).
- `drawRedWarbandMeeple` in `packages/render/src/tokens.ts`:
  - Accepts optional `secs?: number`. When provided, calls `drawMarchEtaBadge` with hostile hazard pip and crimson border; preserves fallback behavior when `secs` is omitted.
- `paintBoardGathers` in `packages/render/src/tokens.ts`:
  - When `typeof g.arrivesTick === "number"`, renders `drawMarchEtaBadge(pawnsG, pawnX, pawnY, secs, 0x22c55e, bob)`.
- `boardPawnsLayer.eventMode = "none"` in `packages/render/src/index.ts`:
  - Sets Pixi v8 `eventMode = "none"` on `boardPawnsLayer` to guarantee march meeples and badges are non-interactive and never block pointer events.
- `OverworldAtlas` in `packages/app/src/OverworldAtlas.tsx` & `theme.css`:
  - Renders SVG `<g className="sc-atlas-march-eta-badge" style={{ pointerEvents: "none" }}>` with `{secs}s`.
  - Added `.sc-atlas-march-eta-badge` with `pointer-events: none !important;` in `theme.css`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-29 — render / cloud veil on unseen tiles (bakeoff/gemini-fog)

- `paintFogHeightVeil` in `packages/render/src/tiles.ts`:
  - Rebuilt with multi-tiered volumetric cumulus lobes, diffused floating aerial shadow at `wy + 4`, cool celestial azure mist stratum (`0x38bdf8`, `0xdbeafe`), sunlit white crests (`0xffffff`), curving vapor wisps, and antique brass 8-point compass rose with golden star eye (`0xd4a359`, `0xfef08a`).
  - Distinguishes unseen tiles from peak rock facets and snowcaps through soft circular lobe geometry, floating elevation hover (`wy - 8 + bob`), and cyan-azure ethereal mist base.
- `paintBoardProvinces` in `packages/render/src/tokens.ts`:
  - Checks `isProvinceSeen(state, p.id)`: unseen tiles render `paintFogHeightVeil(g, b, p, phase)` and skip terrain/node rendering, while seen tiles stay clear.
- `OverworldAtlas` in `packages/app/src/OverworldAtlas.tsx`:
  - Added `<MiniCloudVeil>` component and evaluated `isProvinceSeen(state, p.id)`.
  - Unseen tiles render `<MiniCloudVeil>` over subtle click target, while seen tiles render full terrain, lift cliffs, and nodes.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — render / keep-yard annexes and scaffolding (bakeoff/gemini-yard)

- `listKeepYardBuildings(state?: GameState | null, realmId = "player"): KeepYardBuildingInfo[]`:
  - Exported from `packages/render/src/tokens.ts` and re-exported by `packages/render/src/index.ts`.
  - Finds the player keep (`typeId === "keep"`) and checks candidate buildings with Manhattan distance `|dx| + |dy| === 1`.
  - Maps to slots: `west` (dx = -1, dy = 0), `south` (dx = 0, dy = 1), `east` (dx = 1, dy = 0), `north` (dx = 0, dy = -1).
  - Fallback logic supports test mocks / flags (`keepYard`).
- `drawKeepYardAnnex(g: Graphics, cx: number, cy: number, info: KeepYardBuildingInfo, kit: CultureKit, phase: number)`:
  - Renders isometric annexes or timber scaffolding at appropriate slot offsets:
    - `south`: `cx - 11.5, cy + 2.8`
    - `east`: `cx + 11.5, cy + 2.8`
    - `west`: `cx - 11.5, cy - 3.8`
    - `north`: `cx + 11.5, cy - 3.8`
  - Unfinished: timber standards, ledger beams, diagonal X-braces, work platform, hoist with suspended block.
  - Finished: plinth, sunlit/shaded isometric facets, gabled roof / military parapet, warm hearth glow (`0xfef08a`), courtyard cargo props.
- `drawMiniatureKeep`:
  - Accepts optional `options?: MiniatureKeepOptions`.
  - Splits yard into `rearAnnexes` (`west`, `north`) and `frontAnnexes` (`south`, `east`).
  - Paints rear annexes before keep body and front annexes after keep body.
- `paintBoardProvinces`:
  - Passes `{ state }` to `drawMiniatureKeep` for player home province.
- `packages/app/src/OverworldAtlas.tsx`:
  - Added `MiniYardBuilding` and updated `MiniKeep` to render SVG annexes and scaffolding in rear/front depth.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — render / hold gatehouse open vs shut doors (bakeoff/gemini-gate)

- `isWallRingClosed(state?: GameState | null, realmId = "player"): boolean`:
  - Exported from `packages/render/src/buildings.ts` and re-exported by `packages/render/src/index.ts`.
  - Checks `state.flags.isRingClosed` / `state.isRingClosed` flag overrides if present.
  - Calls `sim.hasClosedWallRing(state, realmId)` (or fallback counts on mocks: `>= 8` edge walls and `gateOnRim`).
- `BuildingDrawOptions`:
  - Added optional property `isRingClosed?: boolean`.
- `drawIsometricBuilding`:
  - Evaluates `isRingClosed = Boolean(options?.isRingClosed ?? (options?.state ? isWallRingClosed(options.state) : false))`.
  - In `case "gate"`:
    - Passes `isRingClosed` to `drawGateCulture(..., isWallDamaged, isRingClosed)` for Cedar, Sand, Steppe, and Islands.
    - In Western gate branch: when `isRim && isRingClosed`, renders shut double doors with vertical plank seam, blackened iron hinge straps, rivets, heavy iron drop bar, and lowered portcullis. When `isRim && !isRingClosed`, renders open doorway with inward-swung door leaves against stone jambs, cobblestone threshold pavers, interior amber lantern glow (`0xfbbf24`), and raised portcullis.
- `paintBuildings` in `packages/render/src/index.ts`:
  - Computes `const isRingClosed = isWallRingClosed(state);` and passes it in `buildingOptions`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — render / damaged rim wall scars & missing merlons (bakeoff/gemini-wall-scar)

- `getWallHpStatus(state?: GameState | null)` & `isWallHpLow(state?: GameState | null)`:
  - Exported from `packages/render/src/buildings.ts` and `packages/render/src/index.ts`.
  - Inspects `state.wallHp` (supports number or `{ cur, max }` object), `state.wall_hp`, or `state.flags.wallHp` / `wall_hp` / `wallHpCur` / `wall_hp_cur`.
  - If `wallHp` is not found, returns `{ hasWallHp: false, cur: 100, max: 100, ratio: 1.0, isLow: false }`.
  - Determines nominal baseline (~96–146) from active rim walls / gates or explicit `maxHp`.
  - Threshold: `isLow = cur <= 0 || ratio < 0.60`.
- `drawCurtainSpan`:
  - Added `isDamaged: boolean = false, gx: number = 0, gy: number = 0`.
  - When `isDamaged`: renders deep dark fissure lines (`colors.arrowSlitCol`) down curtain face, branch stress cracks, sunlit coping catch edges (`colors.merlonCopingCol`), and fallen stone chips at plinth base.
  - Parapet crenellation merlons: deterministic PRNG based on `(gx * 17 + gy * 31 + i * 13)`. If `rand < 0.45`, merlon is missing (crumbled mortar stump at lip); if `0.45 <= rand < 0.70`, merlon is chipped to partial height; otherwise intact.
- `drawRimWallCurtain` & `drawGatehouseCurtainWings`:
  - Added `isDamaged: boolean = false`.
  - Corner bastions: shears front center merlon to mortar stump, chips left merlon, and draws vertical stress crack down the tower face with plinth rubble.
  - Pilaster buttresses: draws diagonal stress fracture across pilaster body.
  - Terminating / starting spans and gatehouse curtain wings pass `isDamaged` into `drawCurtainSpan`.
- `drawIsometricBuilding`:
  - Added optional 11th parameter `options?: BuildingDrawOptions` (`{ isWallLow?, isDamaged?, wallHpRatio?, state? }`).
  - Automatically computes `isWallDamaged` and passes to `drawRimWallCurtain` and `drawGateCulture` / `drawGatehouseCurtainWings`.
- `paintBuildings` in `packages/render/src/index.ts`:
  - Queries `getWallHpStatus(state)` once per pass and feeds `buildingOptions` to `drawIsometricBuilding`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — board / camps and outposts tent + flag (bakeoff/gemini-camps)

- `drawCampTentAndFlag(g, cx, cy, kit, cult, phase, isPlayer, options)` & `drawPlayerCampTentAndFlag(g, cx, cy, kit, cult, phase, options)`:
  - Tabletop board encampment renderer in `packages/render/src/tokens.ts`.
  - Dual ground contact shadows under tent footprint and flagpole base.
  - Left and right guy ropes with timber pegs (`0x78350f`) anchored into the turf.
  - Pitched pavilion ridge tent (or steppe felt yurt) with shaded/sunlit dual faces, apex ridgepole, faction valance trim, arched entrance flap, and warm multi-ring amber/white lantern glow (`0xf59e0b`, `0xfef08a`, `0xffffff`).
  - Elevated hardwood flagpole (`cx + 5.5`, from `cy + 5.5` to `cy - 15`) with iron base bracket, finial sphere (and culture plumes: cedar, steppe, islands), and animated waving swallowtail banner with chevron charge.
- `paintBoardProvinces`:
  - `case "camp":` calls `drawCampTentAndFlag(g, cx, cy, "western", undefined, phase, false, { flagColor: campPal?.pennantColor })` for non-player camps, replacing the old red triangle.
  - Player outposts (`p.occupantRealmId === "player"` and `!isHome`) call `drawPlayerCampTentAndFlag(g, cx, cy, kit, cult, phase, { node: p.node, flagColor: playerTabardCol })` when `!garrison.posted`, replacing the bare marker stake with the clear tent + flag.
- `OverworldAtlas.tsx`:
  - Adds `<MiniCamp cx={cx} cy={cy} isPlayer={...} flagColor={...} />` SVG component with `style={{ pointerEvents: "none" }}`.
  - Rendered on diamond for `p.node === "camp"` or `(occupant === "player" && p.id !== homeId)`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — board / node-piles on diamond (bakeoff/gemini-node-piles)

- `getNodeStockInfo`: Returns `{ stock, max, ratio, hasStock: stock > 0 }`. Detects whether a province has remaining node stock or is depleted/empty.
- `drawResourceNode`: Station landmark rendered on left (`cx - 5`), small stock pile drawn on right of the diamond (`cx + 5, cy + 1`) ONLY when `hasStock && ratio > 0`. Empty nodes (`stock <= 0`) draw only the station landmark, keeping the empty node as it is without a pile.
- `drawNodeStockPile`: Removed red flashing dot on depleted state; empty nodes retain clean ground footprint when inspected or drawn directly.
- `OverworldAtlas.tsx`: Renders `<MiniLogs>`, `<MiniSacks>`, and `<MiniBlocks>` SVG components directly on the diamond for provinces with positive stock (`nodeStock(state, p.id) > 0`). Empty or non-gather nodes remain as standard circular markers.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — hud-ledger / quill-pip & ledger cards (bakeoff/gemini-ledger)

- `QuillPip.tsx`: 16–20px vector pip (`size = 18`, `viewBox="0 0 20 20"`). Renders detailed feather quill (rachis spine, barb notches, calamus shaft, nib point, split line) and faceted stone inkpot with liquid ink and droplet.
- Dynamic ink coloring via `resolveInkColors(kind)`: maps `"war"`/`"defeat"` to `#dc2626`, `"victory"`/`"truce"` to `#d97706`, `"marshal"` to `#6366f1`, and default chronicle entries to `#0284c7`.
- Strict invariant: `pointer-events: none` on wrapper `span`, `<svg>`, and nested elements.
- `LedgerCard.tsx`: Dedicated card component in `packages/app/src/hud/`, mounted by `LedgerPanel.tsx`.
- Styles strictly in `packages/app/src/hud/ledger-card.css`. `theme.css` was NOT edited.
- Invariants: Sim unchanged; `listLedger` used as-is. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — hud-ledger / ledger cards

- `LedgerPanel.tsx`: list is `ul.sc-ledger-card-list` of `li.sc-ledger-card` with `.sc-ledger-card-time` and `.sc-ledger-card-text`; empty state `.sc-ledger-card-empty`.
- Class prefix is `sc-ledger-card-*` because `sc-ledger-cell/name/tag/amount/cap/rate` already belong to the resource HUD in `theme.css` / `resource-pip.css`.
- `listLedger` output and keys used as-is. Styles in `packages/app/src/hud/ledger-card.css`, imported from `LedgerPanel.tsx`; uses `--chrome-btn-*` tokens.

## 2026-09-27 — board / select-rim & ground-ring

- `paintBoardSelectionRim(g, bx, by, state, phase)`: Renders clearer gold rim and ground ring on board provinces:
  - Tabletop Ground Ring: At ground level `wy`, draws multi-layered gold diamond (`0xfacc15`, `0xb45309`, `0xfef08a`) with 4 cardinal corner bracket studs (`1.8px`).
  - Vertical Cliff Struts: For elevated tiles (`elev > 0`), corner cliff struts descend from `cy` to `wy` with bottom front rim.
  - Radiant Top Rim: Surrounds the top plateau at `cy` with a double gold rim (`2.2px` `0xfacc15`, `3px` `0xd97706`), sunlit facet glint, and 4 corner diamond bracket glints.
  - Subtle breathing animation pulse modulated with `phase`.
- Dedicated `boardSelectionLayer` in `boardContainer`: Placed above `boardProvincesLayer` and below routes/pawns.
- `MapRenderer`: Exposes `setSelectedProvince(provinceId: string | null)` and `getSelectedProvince()`. Synchronized via `useGameEngine.ts` `useEffect` on `selectedProvinceId` and passed in `sync(s, selectedId)`.
- `OverworldAtlas.tsx`: Renders `.sc-atlas-select-rim` with base ground ring at `cy + lift`, top gold rim, and corner bracket studs (`pointerEvents="none"`).
- Invariants: Hit-test math (`hitTestProvince` in `camera.ts`) and camera geometry (`boardGridToWorld`, `boardWorldToGrid`, `bandForZoom`, `ZOOM_THRESHOLD`) remain 100% untouched. Sim and server remain completely unchanged.

## 2026-09-27 — hud-events / omen-pip

- `OmenPip.tsx`: 24px omen pip (`size = 24`, `viewBox="0 0 24 24"`) with three medieval portent variants: `comet`, `raven`, `harvest`.
  - `comet`: layered blazing fire trails (`#ea580c`, `#f97316`, `#facc15`, `#fef08a`), drifting astral dust embers, hot core nucleus, and star cross glint.
  - `raven`: perched raven silhouette (`#0f172a`, `#1e293b`), sharp beak, piercing glowing eye (`#38bdf8`), and crest glint on a twilight perch.
  - `harvest`: bound golden wheat sheaf (`#ca8a04`), crimson tie ribbon (`#b91c1c`), alternating ripe grains (`#fde047`, `#facc15`), awn whiskers, and solar sparkle.
  - `resolveOmenVariant(eventId?: string, text?: string)` helper categorizes sim events (harvest/timber -> harvest, spoil/levy -> raven, tribute/celestial -> comet).
  - Wrapper (`.sc-omen-pip-wrapper`), SVG, and all child paths unconditionally enforce `pointer-events: none !important;` so that card clicks and choice buttons are never intercepted.
- `EventCard.tsx`: Mounts `OmenPip` at `size={24}` inside `.sc-event-title-group`. Displays event title, body text (parsed via `splitEventText`), tick badge (`tX`), and optional interactive choice buttons.
- Invariants: Sim unchanged; `WorldEvent`, `formatLetterSuffix`, and `miraRemark` used as-is. Styles isolated entirely to `packages/app/src/hud/event-card.css`; `theme.css` was NOT edited. Zero `<<<<<<<` conflict markers.

## 2026-09-27 — hud-quests / scroll-pip

- `ScrollPip.tsx`: 24px parchment mandate scroll pip (`size = 24`, `viewBox="0 0 24 24"`). Displays unrolled parchment sheet, wooden roller rod curls, sepia script lines, and a wax signet seal.
  - When `status === "ready"`: the pip is LIT! Applies radiant golden vellum (`#fffbeb`, `#fbbf24`), four-pointed star glint on the roller apex, amber signet sparkle, and gentle flame glow flicker (`@keyframes sc-scroll-lit-flame`).
  - When `status === "open"`: displays warm antique vellum (`#fef3c7`).
  - When `status === "claimed"`: displays archived silver-grey vellum (`#e2e8f0`).
  - Wrapper (`.sc-scroll-pip-wrapper`), SVG, and all child paths unconditionally enforce `pointer-events: none !important;` so that Claim buttons and card clicks are never intercepted.
- `QuestCard.tsx`: Mounts `ScrollPip` at `size={24}` inside `.sc-quest-title-group`. Displays hint, 0/1 progress bar, and a Claim button when complete and ready.
- Invariants: Sim unchanged; `listQuests` and `tryClaimQuest` used as-is. Styles isolated entirely to `packages/app/src/hud/quest-card.css`; `theme.css` was NOT edited. Zero conflict markers.

## 2026-09-27 — hud-diplo / realm-crest-pip

- `RealmCrestPip.tsx`: 28px realm crest pip integrating the existing heraldic `Crest` (`size = 28`, `width: 28px; height: 28px;`).
  - When `isColder` or `stance === "hostile" || stance === "war"`: the crest is colder, applying `saturate(0.5) hue-rotate(185deg) brightness(0.9)` with an icy cyan drop-shadow (`rgba(56, 189, 248, 0.75)`) and a subtle frost contour overlay (`.sc-realm-crest-frost`).
  - Peaceful / neutral stances show warm heraldic tones (emerald radiance for friendly, azure for truce, warm amber for wary).
  - Wrapper (`.sc-realm-crest-wrapper`), SVG, and all child paths unconditionally enforce `pointer-events: none !important;` so that Declare war and Gift gold buttons never get intercepted.
- `RealmCard.tsx`: Mounts `RealmCrestPip` at `size={28}` inside `.sc-realm-dip-title-group`. Displays stance badge (with truce countdown), opinion line (reads `opinionOfPlayerFromRealm`), and power comparison with favored/unfavored coloring.
- Invariants: Sim unchanged; `opinionOfPlayerFromRealm`, `peaceTicksRemaining`, `realmPower`, and `tryDeclareWar` used as-is. `git diff main -- packages/sim server` strictly empty.

## 2026-09-27 — hud-decrees / wax-seal-pip

- `WaxSealPip.tsx`: 24px stamped wax-seal pip (`size = 24`, `viewBox="0 0 24 24"`). Displays scalloped matrix pool, hanging ribbon tails, and stamped royal crown matrix sigil (with specialized emblems for "muster", "rite", "envoys" or default royal coronet).
  - When `active === true`, the seal is lit: applies warm molten gold tones (`#d97706`, `#f59e0b`, `#fbbf24`), four-pointed star glint on the crown peak, and living flame flicker (`@keyframes sc-wax-flame`).
  - When dormant, renders deep crimson pressed wax (`#991b1b` / `#7f1d1d`).
  - Wrapper (`.sc-wax-seal-pip-wrapper`), SVG, and all child paths unconditionally enforce `pointer-events: none !important;` so that card clicks and Issue actions are never obstructed.
- `DecreeCard.tsx`: Mounts `WaxSealPip` at `size={24}` within `.sc-decree-title-group`. Displays cost row using 16px `ResourcePip`s (`.sc-pip.sc-decree-pip`), active countdown (`Math.ceil(left / 10)}s left`), and Issue button ("Already active" when in effect).
- Invariants: Sim unchanged; `DECREES`, `tryDecree`, `decreeUntil`, and `decreeActive` used as-is. `git diff main -- packages/sim server` must be 100% empty.

## 2026-09-27 — hud-battle / clash-pip

- `ClashPip.tsx`: 28px clash pip renders `crossed_blades` (victory or general clash) or `broken_shield` (defeat when `story.loserId === "player"`). All wrappers, SVGs, and paths strictly enforce `pointer-events: none !important;` so that card clicks and details expansion never get blocked.
- `BattleCard.tsx`: Integrates `ClashPip` at `size={28}` in `.sc-battle-title-group`. Displays verdict (Victory, Defeat, or rival winner), field combat report, Butcher's bill phase when present, and folds detailed blow-by-blow events inside `<details>`.
- Invariants: Sim unchanged; `writeLastBattle` and `LastBattleStory` shape completely untouched.

## 2026-09-27 — hud-market / offer cards

- `OfferCard.tsx` renders from the `TradeOffer` shape (`give` / `get` records); `label` is no longer shown. Adding an offer to `MARKET_OFFERS` needs no UI change.
- Enabled state is `canTrade(state, id)` only, so UI and sim agree. The red "short" hint is display-only (Number compare), never gates the button.
- Reuses `ResourcePip` at 18px via `.sc-pip.sc-offer-pip`; non-pip resources fall back to text.

## 2026-09-24 — war-chips / force-cards

- `WarChip.tsx`: 24px tactical war chips (warband, cloak, cart, tent) must unconditionally enforce `pointer-events: none !important;` in SVG styles, wrapper elements (`.sc-war-chip-wrapper`), and CSS so that Sally, Recall, and atlas interaction clicks are never intercepted.
- `ForceCard.tsx`: Military force cards (`.sc-force-card`) mount `WarChip` inside `.sc-force-title-group`. Formats ETA as `"posted"` if ticks/seconds undefined, or `${seconds}s` if moving, matching existing time display conventions.
- Glow filters: `.sc-war-chip-warband` / `.sc-war-chip-hostile` applies red drop shadow (`rgba(239, 68, 68, 0.7)`), `.sc-war-chip-cloak` / `.sc-war-chip-scout` applies cyan drop shadow, `.sc-war-chip-cart` / `.sc-war-chip-gather` applies amber drop shadow, and `.sc-war-chip-tent` / `.sc-war-chip-garrison` applies emerald green drop shadow.

## 2026-09-24 — people-cards / walker role pips

- `WalkerPip.tsx`: 24px walker role pips (hoe, axe, pick, coin) must unconditionally set `pointer-events: none !important;` in SVG styles, wrapper styles, and CSS to guarantee worker assignment selects and "Idle" buttons on `JobCard` receive clicks without obstruction.
- Two-frame walking animation runs on CSS keyframes (`steps(1)`) cycling `.sc-walker-f0` and `.sc-walker-f1` over 0.7s, avoiding React re-render thrashing.
- Sitting idle pose (`.is-sitting`) displays `.sc-walker-sit` and hides walking frames, giving unassigned villagers a calm resting appearance on hay bales, pine logs, or ashlar blocks.

## 2026-09-24 — army-cards / culture-kit chips

- `UnitCard.tsx`: All culture-kit unit art and `.sc-unit-art-wrapper` elements unconditionally set `pointer-events: none !important;` so that training buttons, hover tooltips, and click events are never blocked by SVG art.
- Locked unit cards apply `.is-locked` with `filter: grayscale(1)`, `opacity: 0.55`, and disabled button state (`disabled={!open || !affordable}`), while still allowing hover inspection of lock requirements.

## 2026-09-24 — hud-works / hall-chips

- `HallChip.tsx`: Isometric 24px building chips must unconditionally set `pointer-events: none !important;` in SVG styles, wrapper styles, and CSS to guarantee Demolish and Repair buttons on `WorkCard` receive clicks without obstruction.
- `isScarred(b)`: Distinguishes siege scars from freshly queued building scaffolding. Fresh builds finish at `meta.tick + def.buildTicks`, whereas siege damage sets `completesAtTick` to `blowTick + 40`.

## 2026-09-24 — resource-strip / pips

- Resource pips (`ResourcePip.tsx`): All pips and container wrappers unconditionally set `pointer-events: none !important;` so that parent cell hover/tooltip (`title`) and click events are never intercepted.
- Discrete 3-frame looping uses CSS stepped keyframes (`step-end`) on `<g className="sc-pip-f0|1|2">`, avoiding React render thrashing.
- Empty food detection in the HUD uses `isFoodStoresEmptyOrLow(state)` from `@second-crown/render`, matching the exact logic that slumps militia meeples on the hold.
- Full store detection uses `line?.full` from `resourceLedger(state, r)`, switching the pip to `variant="stacked"` with `@keyframes sc-pip-stacked-glow`.

## 2026-09-24 — hud-chrome

- Chrome palette lives on `<html data-chrome>`, separate from the body `theme-<tab>` classes and the season/holiday packs. Add new chrome colors as `--chrome-*` vars in all three blocks of `theme.css`.
- The global `button` rule is element-only on purpose: any class or inline style overrides it. Inline `background` also overrides the disabled background, but the opacity still applies.
- Atlas drag only calls `setPointerCapture` after 6px of travel. Capturing on pointerdown would retarget the click to the `<svg>` and break province selection.
- Atlas SVG has `touch-action: none`, so on phones a swipe over the atlas pans it instead of scrolling the page.
- localStorage keys: `sc-chrome` (palette) is not `sc-chrome-open` (tools drawer).

## 2026-09-24

- Inhabited HUD overlays (`InhabitedOverlay`, `@keyframes sc-candle-flicker` pseudo-elements) must unconditionally set `pointer-events: none` and leave interior controls at `z-index: 1` or higher so mouse hit-testing and drag events are never blocked.
- Do not restyle global `input` or `select` elements to white or bright colors; preserve the dark HUD aesthetic.
- Docs audit branch adds ROADMAP, refreshes PROGRESS/HANDOFF/USER-NOTES, seeds `docs/obsidian/`.
- CHANGELOG still has old Gemini entries with stray `+` prefixes from conflicted merges. Do not spend a wave deleting history; prepend clean entries.
- Gemini + Claude both editing the four docs = rebase conflict every pair. Prefer Gemini skip docs or only touch USER-NOTES flavor.
- `tryTreatWounded` does not require an Infirmary building (tests cover treat without one). UI still tells you to raise a hall so beds exist.
- `trainCostMultiplier()` without `typeId` is barracks+global only. Stables/range/workshop apply only when `typeId` is passed.
- Repair button label "8 stone" is hardcoded in the app; cost lives in `ward.ts` `REPAIR_STONE`.
- Watchtowers: `rimWatchtowers` is rim-only. `visionRange` counts rim towers twice plus other finished towers plus survey research.
