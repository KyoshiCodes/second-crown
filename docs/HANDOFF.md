# Handoff (2026-09-30)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Last docs+upkeep merge includes PRs through **#77**.

## Owner machine

Windows clone: `C:\Projects\second-crown-claude`
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.
Gemini doc branches often conflict; rebase onto `origin/main`, `--theirs` on the four doc files during rebase, `git push --force-with-lease`.

## Active wave (bakeoff/gemini-culture-keeps, not merged)

- Render only. On the isometric board, the player home keep reads as the culture they picked.
- Dedicated miniature keep silhouettes added in `packages/render/src/tokens.ts` (`drawMiniatureKeep`):
  - **Mist**: Low reed roof (wide low-pitched reed thatch `0xca8a04`/`0x92400e`, sod ridge `0x4d7c0f`), low wet-stone walls (`cy - 7`), peat smoke wisp, and living pale mist veil (`0xe2e8f0`/`0xf1f5f9` with alpha drift).
  - **Glen**: Stone quarry keep (cyclopean quarry plinth, rough-hewn granite blocks `0x78716c`/`0x57534e`, quarry courses) with a green turf slope (`0x4d7c0f`/`0x65a30d`/`0x365314`) hugging the southwest flank, and timber quarry crane with suspended stone block.
  - **Salt**: Timber yard keep (fortified squared timber log walls `0x854d0e`/`0x5c3818` with dovetail notches, stacked lumber logs flanking entry) with a steep grey salt-crusted shingle roof (`0xd6d3d1`/`0xa8a29e`, salt frost ridge `0xf1f5f9`).
  - **Fen**: Stilt cottage keep (heavy wooden pilings `0x292524` with cross-bracing, stilt cottage walls `0x6b7280`, mossy reed thatch `0x4d7c0f`) over a dark water pool (`0x090d16`/`0x0f172a` with animated ripples and wetland bulrushes), with warm amber lantern glowing over dark water.
  - **Peak**: Tall white keep (soaring dressed limestone walls `0xf8fafc`/`0xcbd5e1` reaching `cy - 16`) crowned with an alpine sculpted snow cap (`0xffffff`/`0xe0f2fe`), crystalline icicles hanging from corbels (`0xbae6fd`), and high alpine mast.
- Isometric hold grid keep (`packages/render/src/buildings.ts`) updated via `drawKeepPlayerCulture` to render the matching full-fidelity keep architecture.
- Western and older kits (`cedar`, `sand`, `steppe`, `islands`) strictly preserved.
- Non-negotiables: camera math, zoom, and tile click hit-testing untouched. Ranger, Banner, Outrider, Warden, and Lancer marches untouched. Zero changes to `packages/sim`, `server`, `packages/app/src/tabs/*`, or `theme.css`.
- Tests: 371 render tests pass (`packages/render/src/index.test.ts`), 274 sim tests pass, app builds cleanly.

## Active wave (wave/dawn-stores, not merged)

- Sim only. First-dawn gift in `tryAscend` (`packages/sim/src/actions/prestige.ts`): on the first legal ascend the new crown gets **+1 militia, +20 food, +10 wood** (starts at food 45 / wood 45 instead of 25 / 35).
- Guarded by `flags.dawn_gift` (set to 1 on first ascend, kept across later ascends), so a second dawn adds nothing extra.
- Note: the brief called the +1 militia "existing", but `origin/main` had none (a test pinned "no militia"). Owner chose to add it here alongside the stores.
- Raid math, culture yields, unit costs, ascend threshold/button rules untouched. App, render, server untouched.
- Tests: `packages/sim/src/actions/prestige.test.ts` ("First-dawn gift" block; keep/wipe test updated for the gift).

## Active wave (bakeoff/gemini-lancer, not merged)

- App HUD only. Added 28px lancer chip on the Lancer card on the Army tab:
  - **Living Lancer Chip** (`LancerChip`): 28px heavy shock cavalry chip (`packages/app/src/hud/LancerChip.tsx`) with mountain warhorse in charging gallop with steel chanfron armor, armored lancer knight in visored greathelm, heavy couched long lance with circular vamplate handguard disc and diamond-forged steel point with fluttering pennon, and a billowing peak-white cloak with alpine frost highlights and silver mountain peak brooch clasp.
  - **Living Reactive States**:
    - **Unlocked/Open** (`open = true`): Gleaming peak-white mantle highlights (`#f8fafc` / `#cbd5e1`), shining steel lance point, and subtle peak-frost silver aura drop-shadow (`rgba(226, 232, 240, 0.55)`).
    - **Locked** (`open = false`): Muted dusk tones (`grayscale(0.4)`, `opacity: 0.65`) indicating the lancer awaits Horse lore study.
  - **Card Integration**: Mounted directly on the Lancer card in `UnitCard.tsx` via `<LancerChip size={28} open={open} />`. Additionally, `UnitIcon.tsx`'s `case "lancer":` renders dedicated mountain warhorse, armored lancer knight, heavy long lance, and peak-white cloak art.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on wrapper, SVG, and all child elements guarantees zero interference with card clicking, training, or tooltips.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/lancer-chip.css`; `theme.css` strictly untouched (0 diff against `origin/main`).
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new unit stats. 266 sim tests pass, 354 render tests pass, app builds cleanly.
  - Files: `packages/app/src/hud/LancerChip.tsx`, `packages/app/src/hud/lancer-chip.css`, `packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/render/src/index.test.ts`.

## Active wave (bakeoff/gemini-warden, not merged)

- App HUD only. Added 28px warden chip on the Warden card on the Army tab:
  - **Living Warden Chip** (`WardenChip`): 28px hold guard chip (`packages/app/src/hud/WardenChip.tsx`) with sturdy short spear (marsh-wood shaft, leaf-shaped forged steel head, and golden reed bindings), wicker-reed woven round boss shield with reinforced iron rim on off-arm, layered fen-reed cloak with rush frills and carved bone toggle clasp, and conical iron kettle helm.
  - **Living Reactive States**:
    - **Unlocked/Open** (`open = true`): Radiant fen-reed moss green and golden reed tassels (`#65a30d` / `#84cc16` / `#eab308`), gleaming spear point, and subtle fen-reed aura drop-shadow (`rgba(101, 163, 13, 0.45)`).
    - **Locked** (`open = false`): Muted cold marsh dusk tones (`grayscale(0.4)`, `opacity: 0.65`) indicating the warden awaits Screening study.
  - **Card Integration**: Mounted directly on the Warden card in `UnitCard.tsx` via `<WardenChip size={28} open={open} />`. Additionally, `UnitIcon.tsx`'s `case "warden":` renders dedicated hold guard, short spear, round shield, and fen-reed cloak art.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on wrapper, SVG, and all child elements guarantees zero interference with card clicking, training, or tooltips.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/warden-chip.css`; `theme.css` strictly untouched (0 diff against `origin/main`).
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new unit stats. 260 sim tests pass, 349 render tests pass, app builds cleanly.
  - Files: `packages/app/src/hud/WardenChip.tsx`, `packages/app/src/hud/warden-chip.css`, `packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/render/src/index.test.ts`.

## Active wave (wave/culture-unit-5, not merged)

- Sim only. One new culture (**peak**, "Peak Holds") and one new unit (**lancer**). Mist, ranger, glen, banner, salt, outrider, fen, and warden are unchanged.
- Peak builds the same as western. Its one difference: once the keep is finished, hold vision is +1 (`keepVisionCultureBonus` in `visionRange`). A new game can pick it through `setPlayerCulture(s, "peak")`. Saves with no culture flag stay western. NPCs are never seeded peak.
- Lancer: same cost as knight, power 6, `trainTicks` 60 (6s). It unlocks with **Horse lore**, the same study as knight. Knight is not replaced.
- No app files changed. Lancer has no dedicated icon or crest yet.

## Active wave (wave/culture-unit-4, not merged)

- Sim only. One new culture (**fen**, "Fen Steads") and one new unit (**warden**). Mist, ranger, glen, banner, salt, and outrider are unchanged.
- Fen builds the same as western. Its one difference: each finished cottage holds +1 citizen (`cottageCultureBonus` in `housingCap`). A new game can pick it through `setPlayerCulture(s, "fen")`. Saves with no culture flag stay western. NPCs are never seeded fen.
- Warden: same cost as skirmisher, power 3, `trainTicks` 30 (3s). Skirmisher had no study, so a new **Screening** study unlocks warden. Skirmisher is not replaced and stays open.
- No app files changed. Warden has no dedicated icon or crest yet.

## Active wave (bakeoff/gemini-outrider, not merged)

- App HUD only. Added 28px outrider chip on the Outrider card on the Army tab:
  - **Living Outrider Chip** (`OutriderChip`): 28px scout cavalry chip (`packages/app/src/hud/OutriderChip.tsx`) with an agile scout horse in charging gallop, salt-frosted mane and streaming tail, short couched scout lance with forged leaf point and pennon, and a billowing salt-grey cloak with sea-mist highlights pinned by a salt-silver brooch clasp, with conical iron scout helm.
  - **Living Reactive States**:
    - **Unlocked/Open** (`open = true`): Radiant salt-grey mantle highlights (`#cbd5e1` / `#94a3b8`), gleaming lance point, and subtle salt-silver aura drop-shadow (`rgba(148, 163, 184, 0.5)`).
    - **Locked** (`open = false`): Muted dusk tones (`grayscale(0.4)`, `opacity: 0.65`) indicating the outrider awaits Horse lore study.
  - **Card Integration**: Mounted directly on the Outrider card in `UnitCard.tsx` via `<OutriderChip size={28} open={open} />`. Additionally, `UnitIcon.tsx`'s `case "outrider":` renders dedicated scout steed, short couched lance, and salt-grey cloak art.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on wrapper, SVG, and all child elements guarantees zero interference with card clicking, training, or tooltips.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/outrider-chip.css`; `theme.css` strictly untouched (0 diff against `origin/main`).
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new unit stats. 254 sim tests pass, 344 render tests pass, app builds cleanly.
  - Files: `packages/app/src/hud/OutriderChip.tsx`, `packages/app/src/hud/outrider-chip.css`, `packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/render/src/index.test.ts`.

## Active wave (wave/culture-unit-3, not merged)

- Sim only. One new culture (**salt**, "Salt Reaches") and one new unit (**outrider**). Mist, ranger, glen, and banner are unchanged.
- Salt builds the same as western. Its one difference: each finished lumber camp gives a flat +1 wood per tick, added after multipliers (`woodCultureBonus`). A new game can pick it through `setPlayerCulture(s, "salt")`. Saves with no culture flag stay western. NPCs are never seeded salt.
- Outrider: same cost as cavalry, power 5, `trainTicks` 50 (5s). It unlocks from the existing **Horse lore** study, alongside cavalry and knights. Cavalry is not replaced.
- No app files changed. Outrider has no dedicated icon or crest yet.

## Active wave (bakeoff/gemini-banner, not merged)

- App HUD only. Added 28px banner chip on the Banner card on the Army tab:
  - **Living Banner Chip** (`BannerChip`): 28px heraldic unit chip (`packages/app/src/hud/BannerChip.tsx`) with tall ash wood spear, leaf-shaped forged steel spearhead, flying swallowtail heraldic pennant, billowing glen-green cloak fastened with a stone/bronze ring brooch clasp, iron nasal kettle helm, and highland targe buckler shield.
  - **Living Reactive States**:
    - **Unlocked/Open** (`open = true`): Vibrant glen-green cloak (`#4d7c0f` / `#65a30d`), bright golden swallowtail pennant with scarlet stripe, and subtle glen-green drop-shadow aura.
    - **Locked** (`open = false`): Muted stony-glen dusk tones (`#475569` / `#52525b`) indicating the banner warrior is in drill preparation awaiting Drill study.
  - **Card Integration**: Mounted directly on the Banner card in `UnitCard.tsx` via `<BannerChip size={28} open={open} />`. Additionally, `UnitIcon.tsx`'s `case "banner":` renders dedicated spear, small pennant, and glen-green cloak art.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on wrapper, SVG, and all child elements guarantees zero interference with card clicking, training, or tooltips.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/banner-chip.css`; `theme.css` strictly untouched (0 diff against `origin/main`).
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new unit stats. 254 sim tests pass, 339 render tests pass, app builds cleanly.
  - Files: `packages/app/src/hud/BannerChip.tsx`, `packages/app/src/hud/banner-chip.css`, `packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/render/src/index.test.ts`.

## Active wave (wave/culture-unit-2, not merged)

- Sim only. One new culture (**glen**, "Glen Holds") and one new unit (**banner**). Mist and ranger are unchanged.
- Glen builds the same as western. Its one difference: each finished quarry gives a flat +1 stone per tick, added after multipliers (`quarryCultureBonus`). A new game can pick it through `setPlayerCulture(s, "glen")`. Saves with no culture flag stay western. NPCs are never seeded glen (`NPC_CULTURE_IDS` unchanged).
- Banner: same cost as a spearman, power 3, `trainTicks` 30 (3s). It unlocks from a new Crown study, **Drill** (needs a barracks or academy, no Keep minimum). Spearmen stay unlocked from the start, as before.
- No app files changed. Glen shows in `CulturePicker`, Drill in `ResearchBar`, and banner on the Army tab. Banner has no dedicated icon or crest yet.

## Active wave (bakeoff/gemini-ranger, not merged)

- App HUD only. Added 28px ranger chip on the Ranger card on the Army tab:
  - **Living Ranger Chip** (`RangerChip`): 28px heraldic unit chip (`packages/app/src/hud/RangerChip.tsx`) with cowl hood, peaked liripipe, shadowed face with keen gleaming eyes, recurve woodland composite longbow with taut string and nocked bodkin arrow, billowing mist-blue cloak with golden leaf brooch clasp, and swirling morning mist wisps.
  - **Living Reactive States**:
    - **Unlocked/Open** (`open = true`): Vibrant mist-blue cloak (`#0284c7` / `#38bdf8`), golden leaf brooch clasp, warm seasoned ash bow, and subtle mist-blue drop-shadow aura.
    - **Locked** (`open = false`): Muted dusk fog tones (`#475569` / `#64748b`) indicating the ranger is shrouded in cold morning mist awaiting Fieldcraft study.
  - **Card Integration**: Mounted directly on the Ranger card in `UnitCard.tsx` via `<RangerChip size={28} open={open} />`. Additionally, `UnitIcon.tsx`'s `typeId === "ranger"` has dedicated hood, bow, and mist-blue cloak art.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on wrapper, SVG, and all child elements guarantees zero interference with card clicking, training, or tooltips.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/ranger-chip.css`; `theme.css` strictly untouched (0 diff against `origin/main`).
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new unit stats. 248 sim tests pass, 334 render tests pass, app builds cleanly.
  - Files: `packages/app/src/hud/RangerChip.tsx`, `packages/app/src/hud/ranger-chip.css`, `packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/render/src/index.test.ts`.

## Active wave (wave/culture-unit-ui, not merged)

- App only. Finishes the UI side of wave/culture-unit. No sim, server, or theme.css changes.
- New Game: `CulturePicker` already maps `CULTURES`, so Mist Reach sits beside the other five picks and uses the same `setPlayerCulture` call. Western is unchanged.
- Army tab: Ranger is one more `UnitCard` with the same train button as Archer. While Fieldcraft isn't done, the card is locked and reads "Study Fieldcraft on Crown (Archery Range or Academy)." (`lockNote` in `ArmyTab.tsx`). The range discount line now says archers/rangers.
- `UnitIcon.tsx`: `ranger` uses the archer bow art (shared case label) instead of falling through to militia. Archer art is unchanged.

## Active wave (wave/culture-unit, not merged)

- Sim only. One new culture (**mist**, "Mist Reach") and one new unit (**ranger**).
- Mist builds the same as western. Its one difference: each finished farm gives a flat +1 food per tick, added after multipliers. A new game can pick it through `setPlayerCulture(s, "mist")`. Saves with no culture flag stay western. NPCs are never seeded mist (`NPC_CULTURE_IDS`), so old NPC seeds don't change.
- Ranger: same cost as an archer, power 4, `trainTicks` 40 (4s), and the archery range discount applies. It unlocks from a new Crown study, **Fieldcraft** (needs an archery range or academy, no Keep minimum). Archers stay unlocked from the start, as before.
- No app files changed. The app reads these from the sim, so mist shows in `CulturePicker`, Fieldcraft in `ResearchBar`, and ranger on the Army tab. Ranger has no dedicated icon or crest yet.

## Active wave (bakeoff/gemini-dawn-seal, not merged)

- App HUD only. Added 28px dawn seal pip on the Crown tab Second Dawn card (`DawnCard.tsx`):
  - **Living Dawn Seal Pip** (`DawnSealPip`): 28px stamped royal solar wax seal celebrating the Second Dawn. Dual hanging amber silk ribbons with swallowtail ends, organic scalloped poured wax disk, raised golden bezel ring, beaded milled matrix rim, and stamped sigil featuring the rising sun above the horizon line with morning rays, crowned by the Second Crown crest and morning star glint.
  - **Living Reactive States**:
    - **Risen/Active** (`dawned = true` / `ach_ascend` completed): Rich molten gold wax (`#d97706`), bright golden bezel (`#f59e0b`), celestial white dawn sun (`#ffffff`), glowing morning rays (`#fef08a`), and a soft radiant solar aura (`filter: drop-shadow(...)`).
    - **Dormant** (`dawned = false` / "not yet"): Antique dusk slate/bronze seal (`#334155` / `#475569`) with cool pewter horizon and dormant sun awaiting ascension.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on wrapper, SVG, and all child elements guarantees zero interference with card text, facts, or actions.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/dawn-seal.css`; `theme.css` strictly untouched (0 diff against `origin/main`).
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new actions. 239 sim tests pass, 329 render tests pass, app builds cleanly.
  - Files: `packages/app/src/hud/DawnSealPip.tsx`, `packages/app/src/hud/dawn-seal.css`, `packages/app/src/hud/DawnCard.tsx`, `packages/app/src/hud/dawn-card.css`, `packages/render/src/index.test.ts`.

## Active wave (bakeoff/gemini-keep-rooms, not merged)

- App HUD only. Added small living pips on the Hall, Wall, and Yard cards (bed, wall, anvil):
  - **Living Bed Pip** (`BedPip`): 16px timber cot with carved oak posts, straw mattress, bolster pillow, and wool quilt. Living reactive states: warm bedside candlelight flame when occupied or housing full (`pop >= cap`), red medical cross when wounded troops are resting on the cot. Mounted on Hall room tab and Hall fact cards (Keep, People housing beds, Plots), and Yard Beds/Healing cards.
  - **Living Wall Pip** (`WallPip`): 16px ashlar stone curtain wall with crenellated battlements, wall-walk terrace, central gate archway with portcullis bars, and emerald status jewel stud when ring is closed (amber warning when open). Mounted on Wall room tab and Wall fact cards (Walls, Ring, Gate).
  - **Living Anvil Pip** (`AnvilPip`): 16px blacksmith forged cast-steel anvil on an iron-banded oak stump with conical horn, flat striking table, and cross-peen hammer. Living reactive states: cherry-red glowing hot iron billet and flying forging spark glints when active. Mounted on Yard room tab and Yard Keep edge works card.
  - **Unified Component** (`KeepRoomPip`): Automatically maps room kind ("hall", "wall", "yard") or symbol ("bed", "wall", "anvil") to the appropriate living pip.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on all pips, wrappers, and SVGs ensures all card buttons, plot taps, and room tabs work unobstructed.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/keep-room-pips.css`; `theme.css` strictly untouched (0 diff).
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new rooms. 325 render tests pass; 239 sim tests pass; app builds cleanly.
  - Files: `packages/app/src/hud/BedPip.tsx`, `packages/app/src/hud/AnvilPip.tsx`, `packages/app/src/hud/KeepRoomPip.tsx`, `packages/app/src/hud/keep-room-pips.css`, `packages/app/src/KeepInterior.tsx`, `packages/render/src/index.test.ts`.

## Active wave (wave/keep-rooms, not merged)

- App only. Keep interior Hall / Wall / Yard facts and work lists are work cards (beds, heal seconds, wall ring, gate, plot slots). No new rooms, no heal math change.
  - Styles only in `packages/app/src/hud/keep-room.css`. `packages/sim`, `server`, `theme.css` untouched. 239 tests pass; app builds.
  - Branch was reset onto `origin/main` (its old two commits were already in main) and force-pushed.
  - Files: `packages/app/src/hud/keep-room.css`, `KeepInterior.tsx`.

## Active wave (bakeoff/gemini-faction-seals, not merged)

- App HUD only. Added 24px seal pips on the three faction cards (order, pact, guild) and a small wax seal on each Spoils craft card:
  - **Faction Seals** (`FactionSealPip`): 24px distinct heraldic wax seal component (`packages/app/src/hud/FactionSealPip.tsx`) with ribbon tails, molten wax pool, engraved metallic matrix bed, and faction-specific sigils:
    - **Order** (`Amber Compact`): Amber poured wax (`#d97706`), chivalric knightly cruciform sword, sunburst beaded ring, and side diamond studs.
    - **Pact** (`Salt Road Pact`): Carmine crimson wax (`#991b1b`), crossed treaty stilettos, faceted silver salt diamond covenant sigil, and crystalline gleam.
    - **Guild** (`Player Artisan Guild`): Emerald bronze wax (`#047857`), blacksmith master hammer, drafting compass/caliper legs, and central bullion coin boss.
    - **Sworn Member Insignia**: Radiant green laurel ring (`#4ade80`) and emerald jewel stud when the player is a sworn member (`isMember={mine}`).
    - **Auto-Resolution**: `resolveFactionKind(kind, faction)` correctly maps faction instances (`kind: "order" | "pact" | "guild"`, id, name) using word boundary checks.
  - **Spoils Craft Wax Seals** (`WaxSealPip`): Enhanced existing `WaxSealPip` with `craftId?: string` and mounted a small 16px wax seal (`<WaxSealPip size={16} active={owned} craftId={c.id} />`) beside each craft card title in Crown Tab Spoils (`CrownTab.tsx`).
  - **Strictly Non-Blocking**: `pointer-events: none !important` on all seal wrappers and SVG elements guarantees zero click disruption to card buttons, member toggles, or craft actions.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/faction-seals.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new factions or crafts. 239 sim tests pass; app builds cleanly.
  - Files: `packages/app/src/hud/FactionSealPip.tsx`, `packages/app/src/hud/faction-seals.css`, `packages/app/src/hud/WaxSealPip.tsx`, `packages/app/src/WorldPanel.tsx`, `packages/app/src/tabs/CrownTab.tsx`, `packages/render/src/index.test.ts`.

## Active wave (bakeoff/gemini-button-pips, not merged)

- App HUD only. Added 16px icon pips to leftover action buttons where an icon already exists elsewhere in the app (build, study, holiday):
  - **Build Pips** (`HallChip`): 16px isometric building chips mounted on Kingdom tab building picker buttons (`types.map`), the Cottage hint button, Raising works items (`works.map`), Improving upgrades items (`upgrades.map`), and Keep Interior building palette (`KeepInterior.tsx`).
  - **Study Pips** (`ScrollPip`): 16px parchment scroll pips with sepia script lines and wax seal mounted on study research buttons (`ResearchBar.tsx`), active studying progress rows (`status="ready"`), and mastered study rows (`status="claimed"`).
  - **Holiday Pips** (`HolidayPip`): 16px holiday emblem pips (`packages/app/src/hud/HolidayPip.tsx`) displaying the established holiday prop emblem (🎃 All Hallows, 🎄 Midwinter, 🪺 Dawn Feast, 🌕 Harvest Moon, ☀️ Midsummer, ⚔️ Common Days) mounted beside the Holiday selector in `ChromeDock.tsx` and `TesterBar.tsx`.
  - **Button-Safe Nesting**: Enhanced `HallChip` with `as?: "div" | "span"` (defaults to `"div"`), allowing clean inline phrasing content inside buttons without DOM nesting or hydration issues.
  - **Strictly Non-Blocking**: `pointer-events: none` on all pips and wrappers prevents any click disruption.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/button-pips.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). 311 render tests pass; 239 sim tests pass; app builds cleanly.
  - Files: `packages/app/src/hud/HolidayPip.tsx`, `packages/app/src/hud/button-pips.css`, `packages/app/src/hud/HallChip.tsx`, `packages/app/src/tabs/KingdomTab.tsx`, `packages/app/src/KeepInterior.tsx`, `packages/app/src/ResearchBar.tsx`, `packages/app/src/ChromeDock.tsx`, `packages/app/src/TesterBar.tsx`, `packages/render/src/index.test.ts`.

## Active wave (bakeoff/gemini-map-pips, not merged)

- App/render HUD only. On the kingdom map strip under the board, added small existing heraldic pips for facts already shown as plain text:
  - **Map strip**: Groups hold/season/people/plots, `WallLine`, and `VisionLine` into a single `.sc-work-card.sc-map-strip` row (`.sc-map-strip-row`) with shared hint drawer (`.sc-map-strip-hints`).
  - **Keep Crest Pip** (`RealmCrestPip`): 20px heraldic crest pip for player hold banner in the hold cell.
  - **Wall Pip** (`WallPip`): 20px crenellated ashlar stone wall with battlements, wall-walk terrace, central gate arch, and status stud (emerald green `#3fb950` when ring closed, warm amber `#d29922` when open).
  - **Vision Pip** (`VisionPip`): 20px stone watchtower spire with parapet walkway, iron brazier, dancing beacon flame, and radiant vision glints when vision extends past base range.
  - **Slot Pips**: Not added to the kingdom map strip because column slots are not part of the plain text facts on that strip (preserving the strict "No new facts" rule).
  - **Strictly Non-Blocking**: `pointer-events: none` on all pips and wrappers.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/map-strip.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). 302 render tests pass; 239 sim tests pass; app builds cleanly.
  - Files: `packages/app/src/hud/map-strip.css`, `packages/app/src/hud/WallPip.tsx`, `packages/app/src/hud/VisionPip.tsx`, `packages/app/src/WallLine.tsx`, `packages/app/src/VisionLine.tsx`, `packages/app/src/tabs/KingdomTab.tsx`, `packages/render/src/index.test.ts`.

## Active wave (bakeoff/gemini-world-crests, not merged)

- App/render HUD only. Added existing 28px `RealmCrestPip` across all World view components where realms are displayed:
  - **Player Banner** (`WorldPanel.tsx`): 28px `RealmCrestPip` for `realmId="player"`.
  - **Known Crowns** (`WorldPanel.tsx`): 28px `RealmCrestPip` for each kingdom (`r.id`) with dynamic stance (`realmStance(atWar, left, op)`: friendly/hostile/wary/war/truce).
  - **Factions** (`WorldPanel.tsx`): 28px `RealmCrestPip` for faction leaders (`f.leaderRealmId`) and member realms (`mId`).
  - **Watchtower Warning / Dust on the Road** (`WorldTab.tsx`): 28px `RealmCrestPip` with `stance="war"` for incoming hostile hosts (`seen.realmId`).
  - **Foreign War (Clash Header & Levy Action Buttons)** (`WorldTab.tsx`): 28px `RealmCrestPip` with `stance="war"` for both clashing crowns (`clash.a` and `clash.b`) in the header and on both dispatch levy action buttons.
  - **Holds on the Board** (`WorldTab.tsx`): 28px `RealmCrestPip` with dynamic stance for player and foreign hold keeps (unoccupied keeps display empty keep placeholder).
  - Strictly `pointer-events: none` on all crest wrappers and SVGs; non-blocking click-through on buttons and cards.
  - No new kingdoms.
  - Invariants: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). 298 render tests pass; 239 sim tests pass; app builds cleanly.
  - Files: `packages/app/src/WorldPanel.tsx`, `packages/app/src/tabs/WorldTab.tsx`, `packages/render/src/index.test.ts`.

## Active wave (bakeoff/gemini-stores, not merged)

- Render only: Distinct isometric chips for Granary, Mint, Sawmill, Mason Yard (the four cap buildings). Finished vs scaffolding.
  - **Finished presentation**:
    - **Granary**: Staddle stone piers with mushroom caps (`0x64748b`, `0x94a3b8`), elevated horizontal timber ventilation louvers (`0x854d0e`, `0x6e431f`), high thatched roof with dormer vent and golden wheat ear finial (`0xd4a359`, `0xfacc15`), overhanging gantry hoist with suspended flour sack (`0xfef08a`), and loading dock props (golden grain barrels, flour sack stacks, wooden grain crates).
    - **Mint**: Heavy rusticated granite ashlar plinth courses (`0x64748b`, `0x475569`), iron-studded security door with brass padlock (`0x1e293b`, `0xd4a359`), pedimented stone niche with gilded royal crown medallion (`0xfacc15`), sloped slate roof (`0x334155`), rotating flywheel screw press with active smelting crucible (`0xf97316`, `0xfef08a`), and treasury props (stacked gold bullion ingots, open brass coin chests, balance scale).
    - **Sawmill**: River timber millhouse with mossy shake roof (`0x78350f`, `0x451a03`), excavated millrace flume channel with rushing stream (`0x38bdf8`), active rotating waterwheel with foaming spray droplets (`0xe0f2fe`, `0xbae6fd`), log carriage track with timber log and spinning circular steel saw blade (`0xcbd5e1`), fresh golden sawdust mounds (`0xfef08a`), and stacked lumber cords.
    - **Mason Yard**: Stonecutter atelier with slate shed roof (`0x334155`), heavy banker workbench with half-dressed stone block, steel chisels and wooden mallets (`0x475569`, `0xcbd5e1`, `0x78350f`), high wooden tripod derrick shear-legs crane with hoist tackle lifting ashlar block (`0x78350f`, `0x94a3b8`), finished ashlar stone pallet stacks, displayed carved classical column (`0xf8fafc`), and marble urn (`0xe2e8f0`).
  - **Scaffolding presentation (`complete === false`)**:
    - **Granary Scaffolding**: Elevated staddle stone bases without superstructure, heavy sill framing with exposed floor joists, partial floor planking, scaffold standards with diagonal cross-braces, A-frame gantry hoist swinging hook rope, framing timber plank stack, and peg bucket.
    - **Mint Scaffolding**: Excavated foundation ditch trench, low stone masonry plinth courses with mortar scoring, wooden vault centering arch former, multi-tier scaffold platforms with ladders, timber derrick crane hoisting stone lintel block, and mortar mixing trough with lime and trowel.
    - **Sawmill Scaffolding**: Excavated millrace flume channel with shoring stakes, wheel bearing posts and axle spindle (waterwheel unmounted), open timber framing with exposed King-post roof trusses open to sky, saw carriage track under construction, carpenter sawhorses, and crosscut saw.
    - **Mason Yard Scaffolding**: Chalked ground grid layout with red corner boundary pegs, high wooden derrick tripod shear-legs crane with hoist tackle and rough boulder, partial stonecutter shed framing, raw unquarried stone boulders with steel splitting wedges, and mason sledgehammer.
  - **All Cultures Supported**: Western kits and all 4 culture kits (`cedar`, `sand`, `steppe`, `islands`) have distinct finished and scaffolding styles for all 4 stores.
  - **Untouched Buildings**: Farm, Cottage, Quarry, and Watchtower kits were left completely untouched.
  - **Strictly Non-Blocking**: `pointer-events: none` on all graphics layers.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). 295 render tests pass; 239 sim tests pass; app builds cleanly.
  - Files: `packages/render/src/buildings.ts`, `packages/render/src/index.test.ts`.

## Active wave (wave/hall-bonus, not merged)

- Each finished Hall room (player-owned, not under construction) grants one small bonus. Missing room, no bonus.
  - Yard (Barracks): treated wounded come back as militia in 40 ticks (4s) instead of 50. New sim rule; same food cost, no new units.
  - Lectern (Academy): the existing 20% shorter studies (`researchDuration`). Shown only, not retuned.
  - Gate (Gate): the existing gate HP in the wall soak (`gateHp` inside `wallHp`). Shown only, not retuned.
- Raid timing, train costs and train times are unchanged.
- Hall panel shows "Room bonus: ..." for the open room. Files: `packages/sim/src/systems/hallBonus.ts` (+test), `ward.ts`, `index.ts`, `packages/app/src/KeepHall.tsx`.

## Active wave (bakeoff/gemini-cottage-bunk, not merged)

- Render only: Cottages show a small bunk / bed pip.
  - **Free Bed (`pop < beds` or `hasFreeBed: true`)**: One empty bunk: tidy timber bed frame, clean white/cream linen mattress (`0xf8fafc`), plump empty pillow (`0xffffff`), folded sheet turn-down line, and a small green vacant bed pip (`0x4ade80`). Extra bedrolls and occupied quilt are suppressed.
  - **Full Hold (`pop === beds` / `pop >= beds` or `isFull: true` / `isPacked: true`)**: Cottages look packed with extra bedrolls: occupied deep crimson wool quilt (`0x991b1b`), indented pillow, Extra Bedroll 1 in deep emerald wool (`0x065f46`) with twin leather straps (`0xb45309`), Extra Bedroll 2 in rust terracotta wool (`0x9a3412`) with gold cord (`0xfacc15`), Extra Bedroll 3 in navy travel wool (`0x1e3a8a`), canvas duffle sack (`0x713f12`), and a small red full bed pip (`0xef4444`). Empty linen is suppressed.
- `isHoldFull(state?, options?, realmId = "player")` and `hasFreeBed(state?, options?, realmId = "player")` helper functions exported from `packages/render/src/buildings.ts`.
- Gated behind `complete === true` (unfinished scaffolding cottages suppress the bunk/bedrolls).
- Strictly `pointer-events: none` on all graphics layers.
- Supported across Western cottages and all 4 culture kits (`cedar`, `sand`, `steppe`, `islands`).
- Files: `packages/render/src/buildings.ts`, `packages/render/src/index.ts`, `packages/render/src/index.test.ts`. Zero changes to `packages/sim`, `server`, or `packages/app/src/theme.css`.

## Active wave (wave/slot-hint, not merged)

- When every column slot is busy, the province inspect card shows one line under its buttons: "Recall a column to free a slot (War tab)." War already lists Recall for scouts, gathers and garrisons.
- The card's "full" check now counts what the sim counts in `tryGather`: all player marches plus all player gathers, returning ones included (it used to skip returning gathers, so buttons could look enabled and then refuse). Send raid column is now also disabled when full.
- Files: `packages/app/src/ProvinceInspect.tsx` only. No sim, server or theme.css changes.

## Active wave (wave/keep-hall, not merged)

- Clicking your home hold on the board (the inspect card) now shows a **Hall** panel under the Hold facts with three rooms: **Yard**, **Lectern**, **Gate**. Room choice is local view state.
- Each room only calls actions that already exist: Yard = `tryTrain` (x1/x5/x10, unlocked units) and `tryTreatWounded` (same messages as Army); Lectern = the existing `ResearchBar` (same as the bar under the primer); Gate = `WallLine` plus `canSally`/`trySally` (same message as War).
- A room shows "Not built. Raise a <building> in the hold." until its building is finished: Yard needs Barracks, Lectern needs Academy, Gate needs Gate. The tabs still have every control, so nothing is lost before those are built.
- The keep interior modal (Hall / Wall / Yard) is unchanged and separate.
- Files: `packages/app/src/KeepHall.tsx` (new), `keep-hall.css` (new), `ProvinceInspect.tsx` (+import, +1 line). No sim, server or theme.css changes. No new rooms, costs or ticks.

## Active wave (wave/raid-mercy, not merged)

- Home raids are gentler. No rival column marches on the hold before tick 3000 (~5 game minutes), then at most one home raid per 1500 ticks across all rivals (was every 500 from tick 500).
- Home sieges now fight only the column that marched (its `force`), not the rival's whole realm. Before this, a "12-levy" raid actually fought the rival's entire army (60 to 170 units), so every raid breached. Column losses come off the rival's units; the rest of the realm stays home.
- Finished walls soak blows: `wallHp` is a damage pool the attacker must chew through before hits land on defending stacks. One rim wall (12) lets 20 militia hold a 12-levy that would beat them bare.
- Playtest (12000 ticks): first launch 3000, 7 columns (was 23), 6/6 sieges held (was 0/22). Mostly from the column fix; the bot keeps ~26 militia home, which holds even without walls.
- Files: `packages/sim/src/systems/raidMarch.ts`, `march.ts`, `combat.ts`, `resolver.ts`; tests `raidMarch.test.ts`, `raidMercy.test.ts` (new), `harness/playtestHarness.test.ts` (runs 3100 ticks now). No costs, primer, train math, server or theme.css changes.
- Balance watch: 6/6 held may be too merciful. Knobs: `HOME_RAID_FIRST_TICK`, `HOME_RAID_GAP` in `raidMarch.ts`; column size is `npcColumnForce` (up to 6 per unit type).

## Active wave (wave/primer-scout-copy, not merged)

- Primer scout step text now matches its advance check: reveal any tile 2+ steps from the hold (Watchtower, gather/march column vision, or Scout column all count). It no longer tells players to press a paid Scout column.
- Files: `packages/sim/src/systems/tutorial.ts` (text only), `tutorial.test.ts` (+2 tests). Advance check, costs, raids, server untouched.
- Follow-up (not done): the playtest harness note "scout step still completed without a scout" reads like a bug; that path is now intended.

## Active wave (wave/hint-quarry-tower, not merged)

- App-only hints for the two opening walls the playtest bot hit. Kingdom tab: when stone is short for Walls, one line says to build a Quarry (cost read from building data). Province inspect: when gold is short for Scout column, one line says a Watchtower produces gold.
- Files: `packages/app/src/buildHints.ts` (new), `tabs/KingdomTab.tsx`, `ProvinceInspect.tsx`. No sim, server or theme.css changes.

## Active wave (wave/playtest-harness, not merged)

- Sim-only bot playtest: `npm run playtest` plays a fresh game for 12,000 ticks and rewrites the marked block at the top of `docs/PLAYTEST.md`. `npm test` runs a shorter copy of it and never writes files.
- Latest run: 0 errors, 0 failed asserts, primer 7/9 (stuck on walls). Iron March marches on the hold every 500 ticks from tick 500 and the levy is lost each time. There is no gold for scouting and no stone for walls.
- Files: `packages/sim/src/harness/playtestHarness.ts` (+ `.test.ts`), `playtest.report.ts`, `packages/sim/vitest.playtest.config.ts`. No sim rule, server or UI changes.

## Active wave (wave/lofi-stable)

- Lofi dock: picking a track (list, ‹, ›) plays it and repeats it. Only an unpicked, cleanly finished track advances to the next.
- A failed file no longer skips down the whole list. It stops and the dock shows **Track not found. Pick another.** A blocked autoplay shows **Autoplay blocked. Click to play.** and the next click retries.
- The lofi `.ogg` files (03–33, `lofi-a`, `lofi-b`) are still untracked in git, so on the server every lofi track 404s and shows the not-found line until they are committed or copied over.
## Active Bakeoff (bakeoff/gemini-slot-pips)

- **App/Render HUD Only: N/max Column Slots as Stall/Post Pips on War (`packages/app/src/hud/SlotPip.tsx`, `packages/app/src/hud/slot-pip.css`, `packages/app/src/WarRoom.tsx`, `packages/app/src/AppShell.tsx`)**:
  - **Muster Post / Stall Pips**: Visualizes available vs deployed military column capacity using medieval hitching stall & muster post pips:
    - **Empty Stall/Post (`filled = false`)**: Column is at home in the hold yard; sturdy dormant timber post (`#3b2314`), horizontal stall hitching rail (`#4a2e1b`), cold iron tie ring (`#475569`), flat timber post cap, subdued opacity (0.42).
    - **Filled Stall/Post (`filled = true`, a column out)**: Column has departed and is actively deployed on the road; hoisted lance with fluttering swallowtail crimson-and-gold war pennant (`#dc2626`, `#facc15`), polished golden spearhead finial (`#facc15`), radiant warm beacon flame spark (`#fef08a`, `#f59e0b`), active tether strap, and warm amber timber highlights (`#f59e0b`).
  - **Dual Display on War**:
    - **War Tab Button (`AppShell.tsx`)**: Displays compact `N/max` and stall/post pips inline on the War tab button (`id === "war"`), giving an instant overview of active expeditions from any tab.
    - **War Screen Columns Section (`WarRoom.tsx`)**: Prominently mounted at the header of the Columns card next to `Columns` with `N/max` count and full-size stall/post pips.
  - **Calculations (`getFilledSlots`, `getMaxSlots`, `getColumnSlots`)**: Reads player active marches (`listMarches`) and gathers (`listGathers`), accurately capped against `maxMarches(state)`.
  - **Non-Negotiables**: Strictly `pointer-events: none` on all wrappers, text, and SVGs. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. 284 render tests pass, 229 sim tests pass, app builds clean.

## Active Bakeoff (bakeoff/gemini-keep-breach)

- **Render Only: Player Keep Intact vs Cracked Stone / Dark Windows / No Proud Banner When Breached (`packages/render/src/buildings.ts`, `packages/render/src/tokens.ts`, `packages/render/src/index.ts`)**:
  - **Breached Flag Resolution (`isHoldBreached`)**: Checks explicit overrides (`options.isBreached`, `options.breached`, `options.stands === false`), state flags (`state.flags.isBreached`, `state.flags.breached`, `state.flags.holdBreached`, `state.flags.stands === false`, `flags.hold === "breached"`, `flags.defense === "breached"`, `flags.last_siege === "breached"`), direct state properties, and `state.wars` siege battle outcomes where `defenderRealmId === "player"` and `status !== "defender_won"`.
  - **When Hold Stands (`isHoldBreached === false`)**:
    - Intact dressed ashlar granite stone tower and foundation.
    - Warm royal high window with flickering golden candlelight (`0xfef08a`).
    - Soaring proud royal standard waving on mast with golden finial ball (`0xfacc15`) and tabard/gold (`0xb91c1c`, `0xfacc15`).
    - Courtyard brazier with lively leaping fire (`0xf97316`, `0xfef08a`).
    - Warm golden chimney flue glow (`0xfef08a`) and lively billowing hearth smoke puffs.
  - **When Breached (`isHoldBreached === true`)**:
    - **Cracked stone**: Structural fracture fissure lines descending through left and right tower faces (`0x0f172a`, `0x09090b`), branching mortar cracks (`0x1e293b`), chipped masonry rubble divots (`0x1e293b`, `0x09090b`), foundation plinth fracture lines (`0x09090b`), chipped crenel fissure (`0x09090b`), and buckled portcullis bars (`0x475569`).
    - **Dark windows**: Zero warm candlelight (`0xfef08a`), dark shattered void (`0x09090b`), broken glass fractures (`0x334155`).
    - **No proud banner**: Snapped / splintered flagpole stump (`0x5c3818`, `0x78350f`), zero golden finial ball (`0xfacc15`), zero waving royal standard poly (`0xb91c1c`, `0xfacc15`). Charred slate heraldic shield above archway (`0x1e293b`) split by fracture fissure.
    - **Cold hearth**: Zero warm golden flue glow (`0xfef08a`), cold extinguished brazier (cold ash `0x1e293b`, zero `0xf97316` flame), faint dying spent soot wisp (`0x475569`, low alpha). Subdued stone level pips (`0x64748b`).
  - **All Culture Kits Supported**: Cedar Kin longhouse, Sand Banner courtyard keep, Wind Host felt ger, and Tide Clans pile-house keep all reflect cracked timbers/mudbrick/lattice/stilts, dark louvers/toono/vents with zero `0xfef08a` warm glow, extinguished braziers/cauldrons, and snapped mast stumps without proud standards.
  - **Miniature Keep Supported (`drawMiniatureKeep`)**: Overworld and band keeps reflect intact banner, window candle, and coronet crest when hold stands; wall fracture crack, dark window void, and snapped mast stump without banner/coronet when breached.
  - **Invariants**: Strictly non-blocking (`entitiesLayer.eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. No invented sim fields. Zero `<<<<<<<` conflict markers.

## Active Bakeoff (bakeoff/gemini-wall-gap)

- **Render Only: Missing Rim Wall Segments Faint Timber Stake / Gap Mark (`packages/render/src/tiles.ts`, `packages/render/src/index.ts`)**:
  - **Missing Rim Wall Segments**: Along the 48 hold perimeter rim tiles (`isRimTile(gx, gy)`), missing wall segments receive a faint timber stake / gap mark so an open ring is immediately obvious to the player.
  - **Finished Segments Stay As They Are**: Tiles with finished walls or gates (`completesAtTick === null`) remain completely untouched; no gap mark or stake is drawn over finished segments.
  - **Closed Wall Ring Detection**: When all 48 rim segments are finished (or the ring is closed), `listMissingRimSegments` returns `[]` and `paintMissingRimSegments` clears the layer, rendering zero gap marks.
  - **Visual Anatomy (`drawRimGapMark`)**:
    - **Foundation Trench Alignment Line**: Faint scored foundation trench notch (`0x52525b`, alpha 0.35) and mason's lime chalk alignment mark (`0xa8a29e`, alpha 0.42) tracing the perimeter wall footing between adjacent rim tiles.
    - **Soft Contact Shadow**: Soft elliptical contact shadow on the turf (`0x000000`, `0x271708`).
    - **Loam Turf Clods**: Small displaced loam soil clods at the base of the stake (`0x3f220c`, `0x2e1908`).
    - **Slender Timber Stake**: Aged oak/cedar peg (`0x78350f`) with sunlit highlight (`0xa16207`), chamfered heartwood top cut (`0xc29d62`), and vertical woodgrain split (`0x451a03`).
    - **Perimeter Cord Binding**: Weathered cord/chalk binding around the neck (`0xa8a29e`, knot `0x78716c`).
    - **Distinct from Courtyard Stakes**: No bright red ribbon and no gold hint glow. Faint and non-intrusive.
    - **Winter Frost Cap**: In winter / midwinter themes, a delicate frost dusting (`0xf1f5f9`) caps the top of the stake.
  - **Dedicated Layer**: `rimGapLayer = new Graphics()` added to `holdContainer` directly above `groundLayer` with `eventMode = "none"` (`pointer-events: none`).
  - **Helpers Exported**: `isMissingRimSegment`, `listMissingRimSegments`, `drawRimGapMark`, `paintMissingRimSegments`.
  - **Invariants**: Strictly non-blocking (`rimGapLayer.eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. No invented sim fields. Zero `<<<<<<<` conflict markers.

## Active Bakeoff (bakeoff/gemini-tower-unlit)

- **Render Only: Finished Watchtower Unlit / Cold Beacon When No Worker, Staffed Beacon On (`packages/render/src/buildings.ts`, `packages/render/src/tokens.ts`, `packages/render/src/index.ts`)**:
  - **Finished Watchtower With No Worker**: When a finished watchtower is unstaffed (no worker assigned to its tile), its beacon brazier is cold and unlit (`0x0f172a`, `0x334155`, `0x475569` charcoal & spent ash bed), with zero active fire flames, zero radiant glow halo, and zero gold glint.
  - **Staffed Watchtower**: When a worker/guard is assigned (`isBuildingStaffed(state, b)` is true, or `isStaffed: true`), the beacon burns bright with leaping animated fire tongues (`0xf97316`, `0xfacc15`, `0xffffff`), radiant warm glow halo (`0xfde047`), ember sparks, and gold glint diamond star.
  - **Culture Kits Supported**: Western stone tower, Cedar Kin lookout cage, Sand Banner minaret cupola, Wind Host nomad pylon, and Tide Clans lighthouse all reflect active beacon flames/cyan light/smoke when staffed, and cold unlit dark charcoal/lantern glass when unstaffed.
  - **Keep-Yard Annexes Supported**: Miniature watchtowers in keep-yard annexes also check staffing and extinguish to cold charcoal ash when unstaffed.
  - **Helper Exported**: `isBuildingStaffed(state, buildingOrCoords, gx, gy)`.
  - **Invariants**: Strictly non-blocking (`entitiesLayer.eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. No invented sim fields. Zero conflict markers.

## Active Bakeoff (bakeoff/gemini-hint-glow)

- **Render Only: Soft Gold Ground Ring Hint Glow on Empty Work Plots (`packages/render/src/tiles.ts`, `packages/render/src/index.ts`)**:
  - **App Hint Glow**: When the app passes a plot id (pointing to a free plot, e.g. `{ x, y }` or `"x,y"`), that empty plot receives a radiant **soft gold ground ring** (`drawPlotGlowRing`) rendered as an isometric 2:1 ground ellipse on the turf with ambient diffused gold light pool (`0xfde047`, `0xfacc15`), warm amber glow stroke (`0xf59e0b`), radiant core ring (`0xfef08a`), specular rim (`0xffffff`), breathing pulse animation, and shimmering cardinal nodal pips.
  - **Other Empty Stakes Stay Plain**: For all other empty plots, `glowAlpha = 0` so other empty stakes remain plain without gold rings.
  - **Low Opacity Fallback**: If the app does not pass a plot id (`hintPlot` is `null` or `undefined`), every empty hold plot glows at low opacity instead (`glowAlpha = 0.22`), inviting construction across the courtyard without overwhelming the diorama.
  - **Built Plots Stay Untouched**: Occupied plots (buildings, scaffolding, keep) render zero stakes and zero empty plot rings.
  - **API Additions**:
    - `parsePlotCoord(plot)`: parses `{ x, y }` or string coordinates (`"4,2"`, `"plot_4_2"`, `"4-2"`).
    - `drawPlotGlowRing(g, wx, wy, phase, alpha)`: renders the 2:1 isometric gold ground ring.
    - `drawPlotStake(..., glowAlpha)`: accepts optional `glowAlpha` parameter.
    - `paintEmptyPlotStakes(..., hintPlot)`: accepts optional `hintPlot` identifier.
    - `MapRenderer`: updated `sync(state, selectedProvinceId, hintPlot)` and added `setHintPlot(hintPlot)`, `getHintPlot()`, and `"sc-hint-plot-change"` window event listener.
  - **Invariants**: Strictly non-blocking (`plotStakesLayer.eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. No invented sim fields. Zero conflict markers.

## Active Bakeoff (bakeoff/gemini-plot-stake)

- **Render Only: Empty Work Plots on the Player Hold Get a Small Wooden Stake (`packages/render/src/tiles.ts`, `packages/render/src/index.ts`)**:
  - **Empty Work Plots Marked with Survey Stake**: Every open interior plot on the player hold (`!isRimTile` and `!ROAD_TILES.has(...)` without an existing building) displays an authentic medieval wooden surveyor's stake.
  - **Authentic Visual Details (`drawPlotStake`)**:
    - **Contact Shadow & Soil Indent**: Soft ground contact shadow (`0x000000`, `0x271708`) with dark recessed turf indent where the peg is hammered in.
    - **Displaced Loam Soil Clods**: Small fresh earthen soil turf clods (`0x3f220c`, `0x2e1908`) at the base.
    - **Chiseled Timber Stake**: Hand-carved hardwood stake shaft (`0x78350f`) with left sunlit wood grain highlight (`0xb45309`), chamfered mallet-struck heartwood top cut (`0xd97706`), and fine vertical wood grain slit (`0x451a03`).
    - **Hemp Twine Wrap**: Natural straw-colored hemp twine wrapping (`0xfef08a`) binding the upper neck.
    - **Fluttering Surveyor Marker Ribbon**: Bright vermilion red marker ribbon (`0xef4444`, `0xb91c1c`) with golden knot bead (`0xfacc15`) fluttering dynamically in the breeze with `phase`.
    - **Seasonal Adaptation**: Winter/midwinter decoration adds a soft pale snow/frost cap dusting (`0xf8fafc`) atop the stake.
  - **Built Plots Stay As They Are**: Occupied plots (buildings, scaffolding, keep, cottage, farm, quarry, lumber camp, etc.) display zero stakes; existing structures render untouched.
  - **Rim Forts & Cobblestone Streets Excluded**: Rim tiles (reserved for walls and gate) and cobblestone road network remain clean and unobstructed.
  - **Helpers Exported**: `isEmptyWorkPlot`, `listEmptyWorkPlots`, `drawPlotStake`, `paintEmptyPlotStakes`.
  - **Dedicated Layer**: `plotStakesLayer = new Graphics()` in `holdContainer` with `eventMode = "none"` (`pointer-events none`), ensuring 100% unimpeded tile click and hover interactions.
  - **Strictly Non-Blocking Invariant**: Camera math and projection (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. Zero conflict markers.

## Active Bakeoff (bakeoff/gemini-keep-hearth)

- **Render Only: Player Keep Chimney/Hearth Smoke When Hold Has People; Quieter If Empty (`packages/render/src/buildings.ts`, `packages/render/src/tokens.ts`, `packages/render/src/index.ts`)**:
  - **Hold Has People (`holdHasPeople(state)` is true)**:
    - **Western Keep**: Ashlar stone chimney stack on the hold roof (`0x64748b`, `0x475569`, `0x334155`) with dark flue opening (`0x09090b`), warm golden hearth glow (`0xfef08a`) at the chimney flue, and lively billowing hearth smoke plumes rising and expanding into the sky (`0xe2e8f0`, `0xf1f5f9`, `0xf8fafc`, `0xffffff`) with radii expanding from 2.4 to 5.0 and gentle wind drift.
    - **Culture Keeps**: All 4 culture kits (`cedar`, `sand`, `steppe`, `islands`) display active billowing hearth smoke with warm hearth glow at their flue, louvers, or toono crown.
    - **Miniature Home Keep**: Strategic board map home keep displays warm ember glint and miniature smoke puffs.
  - **Hold is Empty (`holdHasPeople(state)` is false)**:
    - **Quieter If Empty**: Chimney stack remains, but chimney smoke is noticeably quieter—a faint, thin, lazy wisp (`0xd1d5db`, `0xe5e7eb`) with small radius (<= 1.6) and low alpha (0.12–0.18), without bright warm hearth glow or large billowing clouds.
  - **Hold Population Detection (`holdHasPeople`)**: Reads `state.citizens` (populated if `c.realmId === realmId`), `sim.population(state, realmId)`, or stationed militia `state.units`, as well as explicit `hasPeople` draw option override.
  - **Strictly Non-Blocking Invariant**: `eventMode = "none"` (`pointer-events: none`). Camera math and hit testing (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. Zero conflict markers.

## Active Bakeoff (bakeoff/gemini-gate-lamp)

- **Render Only: Closed Home Gate Reads as Lit Lamp / Warm Slot; Open Gate is Dark / Raised (`packages/render/src/buildings.ts`)**:
  - **Closed Home Gate**: When the fortress perimeter ring is closed (`isRingClosed === true`), the gatehouse reads with cozy warmth and vigilance: an exterior sconce wall lantern with forged iron bracket arm, glowing amber glass (`0xfacc15`), white flame core (`0xffffff`), and a radiant ambient warm light halo (`0xfde047`, `0xf59e0b`); plus a horizontal viewing slot / arrow slit glowing with warm interior golden hearthlight (`0xfef08a`, `0xf59e0b`) casting a soft light spill beam (`0xfde047`, `0xfbbf24`) across the doorstep and cobblestone threshold.
  - **Open Home Gate**: When the perimeter ring is broken / open (`isRingClosed === false`), the gatehouse portal is deep dark shadow (`0x09090b`, `0x050507`), with cold unlit lantern glass (`0x3f3f46`, `0x52525b`, `0x44403c`, `0x334155`), zero warm light spill or glow, and the heavy portcullis is hoisted high into the archway vault with visible raised crossbars, vertical bars, and downward spiked arrow teeth hanging under the lintel.
  - Supported across Western and all 4 culture kits (`cedar`, `sand`, `steppe`, `islands`).
  - **Strictly Non-Blocking Invariant**: `eventMode = "none"` (`pointer-events: none`). Camera math and hit testing (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. Zero conflict markers.

## Active Bakeoff (bakeoff/gemini-quarry-yard)

- **Render Only: Finished Quarry Shows Cut Stone, Crane & Piles; Unfinished Stays Scaffolding (`packages/render/src/buildings.ts`, `packages/render/src/tokens.ts`, `packages/render/src/index.ts`)**:
  - **Finished Quarry**: Rendered with chiseled cut stone (neatly stacked ashlar blocks on pallets `0xcbd5e1`, `0x94a3b8`, `0xe2e8f0` with mortar seams), an A-frame timber hoisting crane derrick (`0x78350f`, `0x5c2b09`) with a brass pulley wheel (`0xf59e0b`), steel cable (`0xd1d5db`), and hoisted cut granite block dangling on the hook, piles on that tile (foreground pyramidal stone rubble mound `0x64748b`, `0x52525b`, rear terrace ledge cut stone piles, wooden wheelbarrow loaded with stone chunks, and steel mason pickaxe), and stepped granite quarry bedrock strata (`0x27272a`, `0x71717a`, `0x52525b`, `0x3f3f46`). Supported in hold diorama and keep-yard annex tokens.
  - **Unfinished Quarry**: Strictly preserves authentic timber construction scaffolding (`drawQuarryScaffolding`) featuring excavated pit footprint, turf spoils/dirt chips, corner upright scaffold standards, horizontal ledger beams, diagonal X-braces with joint lashings, work staging planks deck, and hoist tripod beam with suspended builder stone. Zero crane pulley, zero chiseled ashlar stacks, and excluded from cracked stone damage overlay.
  - **Strictly Non-Blocking Invariant**: All graphics use `eventMode = "none"` (`pointer-events: none`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. Zero conflict markers.

## Active Bakeoff (bakeoff/gemini-tower-beacon)

- **Render Only: Finished Watchtower Clear Beacon & Gold Glint (`packages/render/src/buildings.ts`, `packages/render/src/tokens.ts`, `packages/render/src/index.ts`)**:
  - **Finished Watchtower**: Rendered with an active, brilliant beacon fire (vibrant orange/yellow flame tongues `0xf97316`, `0xfacc15`, white-hot core `0xffffff`, radiant warm halo `0xfde047`, and rising ember sparks `0xfef08a`), and a gleaming 4-point diamond star **gold glint** (`0xfacc15`, `0xffffff`) atop the beacon spire finial. Supported across Western and all culture kits (`cedar`, `sand`, `steppe`, `islands`) and keep-yard annex tokens.
  - **Unfinished Watchtower**: Strictly preserves authentic timber construction scaffolding (`drawWatchtowerScaffolding`) with upright corner posts, ledger cross-beams, diagonal X-braces, staging deck, and suspended building block. Zero beacon flames, zero radiant glow, zero gold glints.
  - **Strictly Non-Blocking Invariant**: All graphics use `eventMode = "none"` (`pointer-events: none`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff main -- packages/sim server` strictly empty. No `theme.css` changes. Zero conflict markers.

## Active Bakeoff (bakeoff/gemini-season-wash)

- **Board-Only Seasonal Wash (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Pure board-level seasonal wash reading `currentSeason(state)` (and holiday overrides).
  - **Winter**: Light snow and frost wash (`0xbae6fd` / `0xe0f2fe`) applied to all board tiles, with crisp white frost rime along facets and subtle snow dusting crystals.
  - **Harvest**: Warm golden wash (`0xf59e0b` / `0xfde047`) applied strictly to farms (`p.node === "field"`) and plains (`p.terrain === "plain"`), with warm golden rim highlights and wheat glints. Non-farm/plain terrain remains un-tinted.
  - **Spring/Summer**: Untouched natural terrain look (zero wash / un-tinted).
  - **Strictly Non-Blocking Invariant**: `pointer-events: none` on all overlay elements. Hit-test and camera math (`camera.ts`) 100% untouched. March speed and farm yield untouched. `git diff main -- packages/sim server` strictly empty. No `theme.css` changes. Zero conflict markers.

## Active Bakeoff (bakeoff/gemini-rooms)

- **Distinct 2D Room Backdrops for Keep Interior (`packages/app/src/RoomBackdrop.tsx`, `packages/app/src/KeepInterior.tsx`, `packages/app/src/keep-interior.css`)**:
  - **Hall (Throne Dais)**: Elevated 3-tier stone dais steps, carved hardwood monarch throne with golden finials and tufted crimson velvet upholstery, Romanesque alcove arch, torch sconces with warm ambient radial glows, and hanging heraldic banners.
  - **Wall (Wall Walk)**: Dressed stone battlements with merlons and cruciform arrow slits, weathered timber sentry duckboards, iron tripod braziers with glowing coals and rising embers, leaning sentry kite shield, and crossed halberds overlooking a twilight sky.
  - **Yard (Muddy Yard)**: Churned muddy earth with deep wagon wheel ruts, standing rainwater puddles with sky reflections, weathered timber palisade fence, stacked barrels & crates, training quintain dummy, and trampled straw.
  - **Strictly Non-Blocking Invariant**: `pointer-events: none !important;` on all art layers and SVGs (`aria-hidden="true"`). Plot cells, buttons, cards, and facts receive 100% clean interactions. Hit-test and camera math (`camera.ts`) untouched, `git diff main -- packages/sim server` strictly empty, zero conflict markers.

## Active wave (wave/keep-rooms)

- The keep interior now has three rooms, picked by tabs under the header: **Hall** (the plot grid and build picker, unchanged), **Wall** (wall HP, rim walls, ring open/closed, gate up/down with HP, and the wall/gate works), **Yard** (finished works on the keep edge, same rule as the inspect card).
- Every number comes from existing sim helpers (`wallHp`, `edgeWallCount`, `hasClosedWallRing`, `gateOnRim`, `gateHp`, `keepBonus`). The room choice is React state only; switching rooms does not touch the sim or the save.
- Styles only in `keep-interior.css`. No theme.css, sim, render or server changes.

## Active wave (wave/hud-captains)

- Scout, gather and incoming-host force cards on the War tab now show a captain name (**Capt. Aldric** etc.) under the title.
- The name is picked in the app from the march/gather id with a stable hash (`packages/app/src/hud/captainName.ts`), so the same force always shows the same captain. Display only: no new sim fields, nothing saved.
- Garrison cards have no march id, so they show no captain. Recall and sally are unchanged. Styles only in `force-card.css`; no theme.css changes.

## Active wave (wave/save-lock)

- One live cloud save is no longer silently overwritten. If the cloud already holds a newer copy of the hold (higher tick or save version, or actions the upload is missing), `PUT /save` refuses with 409 `{ conflict: true, save }` and returns the cloud save.
- The Cloud panel then shows **Cloud has a newer hold.** with **Load cloud** (writes the cloud save locally and reloads) and **Keep this game** (asks first, then replaces the cloud hold; allowed only for a fresh game, as before).
- A fresh game no longer replaces the cloud hold by auto-push. It needs **Keep this game**.
- Same cloud session/token as before; no login changes. No sim, economy, combat or theme.css changes. Deploy: usual pull / test / build / `pm2 restart sc-cloud`.

## Active wave (wave/keep-interior)

- Selecting the home hold on the Kingdom tab now shows **Enter the keep** in the Hold section of the inspect card. It opens a courtyard view of the 16×10 hold drawn from `state.buildings` (rim, keep-yard bonus, raising, improving marked).
- Tapping a plot does exactly what tapping the hold on the map does: the canvas click handler moved into `tapHoldTile` in `useGameEngine.ts`, and both use it. No new build rules, no sim changes.
- The overworld board and hold canvas are unchanged. Close with **Leave the keep**, Escape, or a click outside.
- Styles only in `packages/app/src/keep-interior.css`. No theme.css changes.

## Active wave (wave/security-gate)

- The browser is treated as untrusted. `PUT /save` now goes through `server/savegate.mjs` before anything is written. A refused save gets a 4xx with a short reason; the stored save is left alone.
- The server still does not run the sim (DECISIONS: "Server never ticks the sim"). The owner chose this narrow gate over a server-authoritative rewrite.
- Other methods on `/save` get 405. Bad JSON no longer throws inside the request handler.
- The manual **Push save** button shows the server's reason. Auto-push still fails quietly and retries later.
- Deploy: the usual pull / test / build / `pm2 restart sc-cloud`. No new env vars. `users.json` records gain `saveAt`.

## Active wave (wave/lofi-radio)

- New **Music** select in the top chrome bar, between Holiday and Chrome: Off / Lofi / Realm. Saved in localStorage `sc-music`. Default Off.
- Realm = the existing seasonal / holiday score (synth bed + recorded holiday `.ogg`). Lofi = every lofi `.ogg` in `packages/app/public/audio/` (31 HoliznaCC0 tracks `03`–`33`, then `lofi-a.ogg`, `lofi-b.ogg`), filename order, looping. A 404 skips to the next track; if every file fails, Lofi plays a soft synth fallback. **The `.ogg` files are not committed in this change** (~114 MB); the server needs them copied into `packages/app/public/audio/` before building.
- In Lofi mode the bar also shows ‹ track-list › and "Now playing: <name>". Prev/next wrap; picking a row plays it. Off / Realm hide it.
- All in `packages/app/src/music.ts` (no second engine). `MusicDock.tsx` is the control; `audioManager.ts` listens for `sc-music-change`. No sim / combat / gold changes.

## Active wave (wave/primer-v3)

- Primer text rewritten to match the live UI (`packages/sim/src/systems/tutorial.ts`, `packages/app/src/TutorialBanner.tsx`).
- Same 9 step ids in the same order; advance checks untouched. Only `text`, two `tab` hints (march → board), and a new `"world"` PrimerTab / hint.
- Quests are not mentioned: `QuestPanel.tsx` exists but is not mounted anywhere.

## Active Bakeoff (bakeoff/gemini-supply)

- **Clearer Supply Cart with Draft Yoke, Timber Crates, and Load Silhouettes (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/app/src/hud/WarChip.tsx`, `packages/app/src/hud/ForceCard.tsx`, `packages/app/src/WarRoom.tsx`)**:
  - **Draft Yoke**: Forward arched seasoned hardwood yoke beam (`0x92400e`), under-neck iron yoke bow (`0x27272a`), forged brass hitch ring (`0xd4a359`), and dual timber trace shafts connecting to the cart bolster.
  - **Timber Supply Crates**: Sturdy crates with horizontal plank grooves, blackened iron corner straps (`0x27272a`), diagonal X-braces, and tied lashings.
  - **Stock & Cargo Awareness (`resolveGatherLoadInfo`)**:
    - **Loaded Haul**: Full carts with stacked crates, bulging burlap sacks with golden twine ties, hooped barrels, node-specific resource cargo (woodcut logs, quarry stone blocks, ruins gold coffers, farm wheat sheaves), tie-down ropes, and bright green/gold cargo badges (`0x22c55e`).
    - **Empty Return**: Open wagon bed with bare floorboard plank lines (`0x543007`), light open side stakes (`0x27272a`), folded drop cloth, and dim slate badge (`0x64748b`) with empty cart icon.
    - **WarChip & ForceCard Integration**: 24px cart SVG reflects draft yoke, crates, loaded haul vs light open return bed.
  - **Non-blocking Invariants**: Strictly `pointer-events: none !important;` on all chips, pawns layer `eventMode = "none"`, no camera or hit-test changes, `git diff main -- packages/sim server` strictly empty, zero conflict markers.

## Active Bakeoff (bakeoff/gemini-weather)

- **Seasonal Weather Particles (`packages/render/src/weather.ts`, `packages/render/src/index.ts`, `packages/app/src/seasons/WeatherOverlay.tsx`, `packages/app/src/theme.css`)**:
  - **Weather Classification (`resolveWeatherKind`, `resolveWeatherFromState`)**:
    - **Rain ("rain")**: Light rain in autumn-ish wet seasons (`"autumn"`, `"fall"`) and wet holidays (`"harvest"`, `"halloween"`).
    - **Snow ("snow")**: Light snow in winter seasons (`"winter"`) and winter holiday (`"midwinter"`).
    - **Clear ("clear")**: Clear sky otherwise (`"spring"`, `"summer"`, `"easter"`, `"midsummer"`, default). Zero precipitation particles rendered.
  - **PixiJS Map Precipitation Rendering (`paintWeatherParticles`, `createWeatherParticles`)**:
    - Light rain: slender slanted falling raindrops (`0x93c5fd`, alpha 0.6) with delicate ground splash ripples (`0x60a5fa`).
    - Light snow: soft crystalline snowflakes (`0xf8fafc`, alpha 0.85) with gentle cyan halo glow (`0xbae6fd`) and graceful flutter.
    - Clear: cleanly clears the graphics buffer, drawing zero precipitation particles.
    - Rendered in both camera bands: `holdContainer` (`particlesGraphic.eventMode = "none"`) and `boardContainer` (`boardWeatherGraphic.eventMode = "none"`).
  - **React DOM Overlay (`packages/app/src/seasons/WeatherOverlay.tsx`, `packages/app/src/theme.css`)**:
    - Renders matching HTML5 2D canvas precipitation (rain streaks with ripples, snow flakes with drift, clear empty sky).
    - Guaranteed non-interactive: `pointerEvents: "none"` inline style and `.sc-weather-container, .sc-weather-container * { pointer-events: none !important; user-select: none !important; }`.
  - **Strict Invariants**:
    - `packages/render/src/camera.ts` (hit-test and projection math) completely untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-dest)

- **Faint Ring for March Destination Tiles (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/app/src/OverworldAtlas.tsx`, `packages/app/src/theme.css`)**:
  - Tiles that are already a march destination display a faint, elegant ring around the tile perimeter:
    - **Player marches**: Warm luminous gold palette (`0xf59e0b` ring, `0xd97706` glow, `0xfde047` pips).
    - **Hostile marches**: Menacing danger red palette (`0xef4444` ring, `0xdc2626` glow, `0xfca5a5` pips).
  - **Atmospheric & Readable Geometry (`paintBoardDestinationRing`)**:
    - Faint ground ring at the tabletop base plane with soft atmospheric glow.
    - Faint elevated plateau ring on raised terrain facets with rear-facet sunlit shimmer.
    - Subtle cardinal corner bracket pips marking the tile vertices.
    - Gentle pulsing breath driven by phase and coordinates (`Math.sin(phase * 3 + p.x * 2 + p.y)`).
    - Covers both seen and unseen (fog/cloud) destination tiles so player scout routes remain readable.
    - Distinct from the thick, high-opacity gold player selection rim (`paintBoardSelectionRim`).
  - **March Classification (`buildMarchDestinationMap`, `getTileMarchDestination`)**:
    - Automatically maps destinations of all active marches in `listMarches(state)` and gathers in `listGathersPresentation(state)`.
    - Hostile enemy warbands and raids take combat alert priority if both forces target the same province.
  - **Kingdom Atlas SVG Integration (`packages/app/src/OverworldAtlas.tsx`, `packages/app/src/theme.css`)**:
    - Matching SVG destination rings rendered on the kingdom map with `.sc-atlas-dest-ring` and `pointer-events: none !important;` so map clicks fall cleanly through.
  - **Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-capitals)

- **Rival & Foreign Home Keeps Show Small Realm Crest Above Keep (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`, `packages/app/src/theme.css`)**:
  - Rival and foreign NPC home holds show a distinct heraldic escutcheon realm crest floating above their keep (`cx`, `cy - 23.5`).
  - **Player Home Unchanged**: The player home keep retains its sovereign golden coronet (`cx`, `cy - 23.5`) and gilded royal frame; it does NOT display a rival realm crest.
  - **Distinct Heraldic Escutcheon Crests (`drawRealmCrestAboveKeep`)**:
    - Ground drop shadow and escutcheon rim plaque with faction border.
    - Inner shield field filled with faction primary pennant color and accent rim.
    - Faction-specific heraldic charge / sigil:
      - Iron March (`rival`): Crossed white blades and crimson central rivet.
      - Silk Coast (`k_silk`): Golden anchor and nautical trident.
      - Ash Nomads (`k_ash`): Steppe nomad arrowhead with amber core.
      - Veil Theocracy (`k_veil`): Radiant dawn star with purple aura.
      - Glass Cities (`k_glass`): Cyan faceted prism diamond.
      - Frost Holds (`k_frost`): Six-pointed crystalline snowflake.
      - Tide Princes (`k_tide`): Twin ocean surf waves.
      - Ember Concord (`k_ember`): Rising flame comet.
      - Bronze League (`k_bronze`): Classical bronze arch & anvil.
      - Custom / other realms: Chevron with realm stud.
    - Finial crown stud atop the crest shield and subtle animated breathing glint.
  - **Kingdom Atlas SVG Integration (`MiniRealmCrest`)**:
    - Matching SVG mini-crest rendered above rival/foreign keeps with `.sc-atlas-realm-crest` and `pointer-events: none !important`.
  - **Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-season-tint)

- **Light Seasonal & Holiday Tint on Board Tiles (`packages/render/src/tokens.ts`, `packages/render/src/buildings.ts`, `packages/render/src/tiles.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Board tiles pick up a light seasonal tint wash from existing season/holiday state without hiding underlying terrain colors or terrain relief art.
  - **Seasonal & Holiday Color Mapping (`getThemeVisuals`, `resolveBoardThemeVisuals`, `resolveBoardSeasonTint`)**:
    - Spring: Light pastel spring green (`0x86efac`, alpha 0.10).
    - Summer: Warm sunbeam gold (`0xfef08a`, alpha 0.10).
    - Autumn: Rich autumn gold (`0xf59e0b`, alpha 0.14).
    - Winter: Crisp winter cool frost cyan (`0xbae6fd`, alpha 0.14).
    - Holiday packs (when selected or active):
      - Halloween: Spectral shadow purple (`0x581c87`, alpha 0.18).
      - Midwinter: Glacial ice cyan (`0x38bdf8`, alpha 0.16).
      - Easter: Dawn lilac violet (`0xc084fc`, alpha 0.12).
      - Harvest: Harvest gold (`0xf59e0b`, alpha 0.16).
      - Midsummer: Solar yellow (`0xfde047`, alpha 0.14).
  - **Non-Obscuring Visual Layering ("Do Not Hide Terrain")**:
    - On the tabletop board, the base terrain color (`pal.fill`) is drawn first, followed by the translucent tint glaze (`0.08` to `0.18` alpha).
    - All relief art (trees, knoll lines, wildflowers, grass tufts, mountain crags, fissures, waves, surf) is painted *after* the tint wash, ensuring full prominent visibility.
    - 3D cliff height faces (`paintTileHeightFace`) receive subtle matching glazes on the front-left (`alpha * 0.55`) and front-right (`alpha * 0.40`) facets.
  - **Kingdom Atlas Integration (`packages/app/src/OverworldAtlas.tsx`)**:
    - Seen provinces render matching seasonal tint overlays on top diamonds and cliff faces with `style={{ pointerEvents: "none" }}`.
  - **Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-eta)

- **Tiny Seconds Badge on Board March Meeples (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Each board march meeple that already has an arrival time (`m.arrivesTick` or `g.arrivesTick`) displays a tiny seconds badge floating above its head (e.g. `4s`, `18s`, `0s`).
  - **Deterministic Pixel Art Badge (`drawMarchEtaBadge`, `MARCH_ETA_GLYPHS_3X5`)**:
    - Compact rounded pill container with subtle drop shadow, dark translucent background (`0x090d16`), and crisp border matching the march faction or mission type:
      - Player war/raid march: Warm golden amber (`pal.accentColor`) with golden hourglass pip.
      - Scout column: Celestial recon cyan (`0x38bdf8`) with cyan hourglass pip.
      - Gather column / expedition: Emerald green (`0x22c55e`) with harvest hourglass pip.
      - Garrison column: Royal blue (`0x3b82f6`) with defensive hourglass pip.
      - Hostile incoming warband: Blood-red crimson (`0xef4444`, `0xdc2626`) with hazard skull pip.
    - 3x5 bitmap pixel font rendered via pure geometry rects, eliminating external DOM font dependencies and guaranteeing 100% determinism in headless tests and WebGL.
    - Floating height automatically tracks the marching meeple stride and head bob (`pawnY - 28 - bob`).
  - **Pointer-Events None Invariant**:
    - `boardPawnsLayer.eventMode = "none"` in Pixi stage setup.
    - Mini-map SVG `<g className="sc-atlas-march-eta-badge" style={{ pointerEvents: "none" }}>` with `.sc-atlas-march-eta-badge { pointer-events: none !important; }` in `theme.css`.
    - Clicks cleanly fall through to provinces, tiles, and pawns underneath.
  - **Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-fog)

- **Cloud Veil on Unseen Tiles & Clear Seen Tiles (`packages/render/src/tiles.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Unseen provinces render as an unmistakable volumetric cloud veil, while seen provinces stay 100% clear with their full terrain, 3D cliff height faces, resource piles, camps, and keeps.
  - **High-Distinction Cloud Mass (`paintFogHeightVeil`)**:
    - Floating aerial shadow on the tabletop plane (`0x000000`, `0x0f172a`), clearly separating the airborne cloud blanket from solid ground.
    - Translucent sky-mist base stratum with cool celestial azure undertone (`0x38bdf8`, `0xdbeafe`) and soft underside shading, distinctly different from rock ashlar or terrain cliffs.
    - Multi-tiered billowing cumulus lobes spanning the full tile with brilliant sunlit crests (`0xffffff`).
    - Dynamic windblown curving vapor wisps (`0xe0f2fe`, `0xffffff`) signaling living mist in motion.
    - Antique cartographer 8-point brass compass rose with center golden star glint (`0xd4a359`, `0xfef08a`), marking uncharted lands.
    - Continuous airy floating hover animation.
  - **Kingdom Atlas (`packages/app/src/OverworldAtlas.tsx`)**:
    - Uses `isProvinceSeen(state, p.id)`: unseen provinces render `<MiniCloudVeil>` with matching atmospheric styling, while seen provinces stay clear.
  - **Invariants**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-yard)

- **Finished Keep-Yard Annexes & Construction Scaffolding (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - The player's home tile keep renders finished adjacent hold buildings as miniature architectural annexes nestled around the keep, and unfinished buildings as authentic timber scaffolding.
  - **Adjacency Mapping (`listKeepYardBuildings`)**:
    - Discovers buildings sharing an edge with the player keep (`|dx| + |dy| === 1`) on the hold grid, consistent with `keepBonus` in sim economy.
    - Maps to 4 isometric yard positions: `west` (rear-left), `north` (rear-right), `south` (front-left), `east` (front-right).
    - Checks `completesAtTick` (`null` = finished, number = under construction).
  - **Finished Annexes**:
    - Solid masonry/timber walls with light/shaded facets, foundation plinth, and gabled roof or military crenellated wing.
    - Doorway with warm candle/hearth glow (`0xfef08a`).
    - Type-specific props (grain sacks, firewood piles, cut ashlar stone blocks, golden cross).
    - Full support for 5 culture palettes (Western, Cedar, Sand, Steppe, Islands).
  - **Unfinished Scaffolding**:
    - Timber upright corner posts, horizontal ledger beams, diagonal X-bracing, plank staging deck, builder's rope hoist with suspended stone block.
  - **Depth Layering**:
    - Rear annexes (`west`, `north`) draw behind the keep; front annexes (`south`, `east`) draw in front of the keep. Clustered around the keep perimeter rather than a flat vertical stack.
  - **Invariants**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-gate)

- **Hold Gatehouse Open vs Shut Doors (`packages/render/src/buildings.ts`, `packages/render/src/index.ts`)**:
  - The hold gatehouse dynamically reflects the fortification perimeter closure state using existing state:
    - **Closed Wall Ring (`isRingClosed === true` / `hasClosedWallRing(state)` is true)**:
      - Double doors meet flush and shut tight at the center portal seam.
      - Reinforced with horizontal blackened iron hinge straps and iron rivets.
      - Heavy iron drop bar / lock hasp spans the door center.
      - Iron lattice portcullis lowered above the doors.
      - Across all 5 culture kits: Western (oak + iron drop bar), Cedar (split-cedar + blackened iron straps & portcullis), Sand (brass-studded cedar + bronze lattice portcullis), Steppe (cross-braced timber gates + pylon bars), Islands (weathered driftwood double doors + bamboo portcullis).
    - **Open Wall Ring (`isRingClosed === false` / `hasClosedWallRing(state)` is false)**:
      - Double-door leaves are swung inward in perspective against the door jambs/reveals, showing door thickness and inner edges.
      - Gateway passage is open with visible cobblestone threshold pavers and stone road lines.
      - Warm golden amber lantern glow (`0xfbbf24` / `0xfacc15` / `0xea580c` / `0x06b6d4`) casts outward from the interior courtyard onto the threshold.
      - Portcullis is raised high into the vault ceiling lintel.
    - **Wall Ring Detection (`isWallRingClosed`)**:
      - Leverages canonical sim state evaluator `sim.hasClosedWallRing(state, realmId)` (checking `>= 8` edge walls and completed rim gate).
      - Supports explicit overrides for testing or state flags (`state.flags.isRingClosed` / `state.isRingClosed`).
      - Works seamlessly when `options.state` or `options.isRingClosed` is passed to `drawIsometricBuilding`.
  - **Invariants**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-wall-scar)

- **Damaged Rim Wall Art Presentation on Low wallHp (`packages/render/src/buildings.ts`, `packages/render/src/index.ts`)**:
  - When `wallHp` is present on `state` (or `state.flags`) and is low (`ratio < 0.60` or `cur <= 0`), the rim fort wall art now dynamically renders battle scars, impact fissures, and missing merlons:
    - **Straight Rim Wall Curtain Spans (`drawCurtainSpan`)**:
      - Structural jagged fissures and impact cracks descending down the vertical ashlar stone face with shadow crevice strokes, secondary branch fractures, and sunlight highlight catch edges.
      - Dislodged masonry rubble chips fallen at the plinth base.
      - Crenellated merlons dynamically break down based on deterministic PRNG per merlon: ~45% missing merlon gaps (revealing jagged crumbled mortar rubble stumps and open gaps in the battlements), ~25% shattered/chipped merlons at partial height, with remainder intact.
      - Terminal caps show cleaved stone notches.
    - **Corner Bastion Towers (`drawRimWallCurtain`)**:
      - Front-center merlon knocked out / sheared away, leaving a crumbled mortar stump.
      - Left merlon chipped down to partial height.
      - Vertical stress crack stroke descending across the tower facet with fallen stone chip at plinth base.
    - **Pilaster Wall Buttresses**: Stress fracture splitting across the central visible pilaster face.
    - **Gatehouse Curtain Wings (`drawGatehouseCurtainWings`)**: Adjacent connecting curtain wings display matching cracked stone and battlement gaps.
    - **Full HP Walls Stay As They Are**: When `wallHp` is at or near full HP (`ratio >= 0.60`) or when `wallHp` is not set on state (`undefined`), rim walls remain 100% intact with pristine merlons, clean stone faces, and zero cracks.
  - **Invariants**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-camps)

- **Player Camps and Outposts Clearer Tent + Flag (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Player camps and outposts on the board now display a high-fidelity pitched canvas tent and fluttering heraldic flag standard:
    - **Pitched Canvas Pavilion Tent**: Dual-tone 3D tent faces (shaded flank, sunlit roof pitch), timber ridgepole along apex, culture tabard valance trim along eaves, arched doorway flap, and cozy interior golden lantern / hearth amber glow. Steppe culture renders nomadic round yurt with felt dome and crown ring.
    - **Anchoring Guy Ropes & Stakes**: Angled tension guy ropes anchored into the ground with hardwood pegs, resting over soft ground contact shadows.
    - **Hardwood Flagpole & Flying Banner**: Grounded timber pole with iron base bracket, polished golden finial sphere (with culture-specific adornments: cedar huntsman plume, steppe horsehair tuft, islands sea pearl), and animated waving swallowtail heraldic flag with chevron charge.
    - **Camp Node Upgrade**: Neutral / unaligned wild camps on the board (`node === "camp"`) now draw a distinct weathered canvas tent with crimson camp pennant instead of the primitive red polygon.
    - **Overworld Atlas `<MiniCamp>`**: SVG mini tent + flag component on diamond for `p.node === "camp"` and player outposts (`style={{ pointerEvents: "none" }}`).
  - **Invariants**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.

## Active Bakeoff (bakeoff/gemini-node-piles)

- **Node Stock Piles on Diamond (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Provinces that already have node stock draw a small pile on the diamond: stacked timber logs on `woodcut`, burlap grain sacks on `field`, and ashlar stone blocks on `quarry`.
  - Empty nodes (`stock <= 0`) stay as they are without any pile drawn.
  - Implemented across both the Pixi tabletop diorama and the SVG Overworld Atlas.
  - Hit-test math and camera math remain 100% untouched.
  - Sim and server strictly empty diff. Zero conflict markers.

## Active Bakeoff (bakeoff/gemini-ledger)

- **Ledger Cards & 16–20px Quill/Ink Pip (`packages/app/src/hud/QuillPip.tsx`, `packages/app/src/hud/LedgerCard.tsx`, `packages/app/src/hud/ledger-card.css`, `packages/app/src/LedgerPanel.tsx`)**:
  - Each ledger card in `packages/app/src/hud` displays an authentic 16–20px quill & inkpot pip with goose feather plume, carved rachis, sharp writing nib, faceted inkpot, and wet ink droplet.
  - Scribe ink color dynamically reflects entry kind (war/defeat: rubrication crimson, victory/truce: royal gold, marshal: imperial indigo, default: azure iron-gall).
  - Pip CSS strictly in `ledger-card.css`; `theme.css` not edited. Strictly `pointer-events: none`.
  - Sim and server untouched. No conflict markers.

## Active Bakeoff (bakeoff/gemini-select-rim)

- **Selected Board Province Clear Gold Rim & Ground Ring (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/app/src/OverworldAtlas.tsx`, `packages/app/src/game/useGameEngine.ts`)**:
  - **Clear Gold Rim & Ground Ring (`paintBoardSelectionRim`)**:
    - **Tabletop Ground Ring (`wy`)**: Encircles the province footprint at ground level with a brilliant gold ring (`0xfacc15`, `0xb45309`, `0xfef08a`), inner shimmer line, and 4 cardinal corner bracket pips, clearly anchoring the tile to the tabletop.
    - **Vertical Cliff Struts**: For elevated tiles (`elev > 0`), corner struts descend along the vertical cliff edges connecting the ground ring to the top plateau with a front cliff ground rim.
    - **Top Gold Rim (`cy = wy - elev`)**: Surrounds the elevated plateau with a double gold rim (`0xfacc15`, `0xd97706`), sunlight facet glint, and 4 cardinal diamond corner glints.
  - **Synchronized Board & Atlas Selection**:
    - Board Pixi renderer introduces dedicated `boardSelectionLayer` and integrates `paintBoardSelectionRim` into `paintBoardHighlight` and `paintBoardProvinces`.
    - `MapRenderer` exposes `setSelectedProvince(provinceId: string | null)` and `getSelectedProvince()`, kept in sync with engine state in `useGameEngine.ts`.
    - `OverworldAtlas.tsx` renders matching `.sc-atlas-select-rim` with base ground ring and top gold rim (`pointerEvents="none"`).
  - **Strict Invariants Preserved**:
    - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% unchanged.
    - `git diff main -- packages/sim server` strictly empty. Zero conflict markers.

## Active wave (wave/hud-inspect)

- **Province inspect card (`packages/app/src/ProvinceInspect.tsx`, `packages/app/src/hud/inspect-card.css`)**: the clicked-province panel is now one `.sc-inspect-card`.
  - Head: name (your hold's name at home, the node label once scouted, "Unscouted province" in fog) plus Close.
  - Facts grid: Terrain, Owner, Tile (x,y), Gold.
  - Status lines (stock, camp threat, flag tithe, incoming, column, gather), then the existing action buttons in `.sc-inspect-actions`, the Column picker, and Send raid column.
  - All inline styles removed; styles live only in `inspect-card.css`. Click, march, scout, gather and garrison handlers are unchanged.

## Verify

```
npm test
npm run test -w @second-crown/render
npm run build -w @second-crown/app
```

## Invariants that still bite

- HUD chrome palette: `<html data-chrome>` via `ThemeDock.tsx`, key `sc-chrome`. Buttons default dark from `theme.css`.
- World atlas pans by drag. 6px slop keeps clicks working. Recenter resets.

- Sim is 10 Hz, deterministic, offline catch-up. No sim on `server/`.
- Column clashes use the column, not the home army.
- Presentation branches must leave `git diff main -- packages/sim server` empty.
- One study at a time. Academy only shortens *new* studies.
- Treat wounded is 4 food + 50 ticks → 1 militia.
- Wall HP already includes gate HP; do not add them twice in copy.
- Vision ≠ rim tower count. See DEV-NOTES.

## Docs map

| File | Who |
|---|---|
| USER-NOTES.md | playtesters |
| CHANGELOG.md | every merge crumb |
| DEV-NOTES.md | footguns |
| ROADMAP.md | next |
| PROGRESS.md | eras |
| INVARIANTS.md | law |
| CONCEPT-BIBLE.md | fantasy |
| obsidian/ | vault seed |
