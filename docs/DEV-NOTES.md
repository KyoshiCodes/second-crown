# Dev notes

## 2026-09-28 — hud / keep-yard works on inspect card (wave/hud-yard)

- `keepYardWorks(state)` in `ProvinceInspect.tsx` is read-only: player buildings with `completesAtTick === null` and `keepBonus > 1`. Reuses the sim selector so the list cannot drift from the +10% economy rule. Scarred works (`completesAtTick` set) drop out naturally.
- Row sits after Rim ring inside the existing `home` block. CSS: `.sc-inspect-yard` + `.is-none` in `hud/inspect-card.css`.

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
