# Dev notes

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
