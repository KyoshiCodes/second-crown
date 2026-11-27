## 2026-11-27 — app / living presentation for column status, march ETA & battle outcome notes

- **War column status expander (`packages/app/src/hud/ColumnStatusExpander.tsx`, `packages/app/src/WarRoom.tsx`):**
  - Exported pure `resolveColumnStatus(state)` wrapping `columnStatusSnapshot(state)` (`a6b0eec`, exact match — zero mismatch) and mounted collapsed `<details class="sc-col-status">` under `<WarLivingStrip>` listing owner, kind, destination coords, `~Ns (Tt)` ETA, power (`strength`), and threat/more notes.
- **Inspect march ETA note (`packages/app/src/hud/MarchEtaNote.tsx`, `packages/app/src/ProvinceInspect.tsx`):**
  - Exported pure `resolveMarchEta(state, provinceId)` wrapping `marchEtaSnapshot(state, provinceId)` (`a6b0eec`, exact match — zero mismatch) and mounted `{seen ? <MarchEtaNote ... /> : null}` under `<InspectDetailSection>` so fogged tiles never reveal hidden marches.
- **War battle outcome note (`packages/app/src/hud/BattleOutcomeNoteLine.tsx`, `packages/app/src/WarRoom.tsx`):**
  - Exported pure `resolveBattleOutcomeNote(state)` wrapping `battleOutcomeNoteSnapshot(state)` (`a6b0eec`, exact match — zero mismatch) and mounted `<BattleOutcomeNoteLine state={state} />` under `<WarLivingStrip>` rendering `snap.last.text`, tick, and `snap.suggestion`.
- **Dedicated CSS (`hud/column-status.css`, `hud/march-eta.css`, `hud/battle-outcome-note.css`):** Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;` on pips, calm reveal/breathe keyframes, and `@media (prefers-reduced-motion: reduce)`. Zero edits to sim/server math, `theme.css`, `inspect-card.css`, earlier CSS files, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/LivingSlice24Presentation.test.tsx`):** 4 tests passing (`npm test` -> sim **851**, app **1709**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — sim / Living Realm slice 24 (column status, march ETA, battle notes)

- **Where:** `columnStatusSnapshot`, `marchEtaSnapshot`, `battleOutcomeNoteSnapshot` in `systems/livingStatus.ts`. Constants (`COLUMN_STATUS_CAP`, `COLUMN_NOTE_*`, `MARCH_ETA_CAP`, `BATTLE_NOTE_*`, `BATTLE_SUGGEST_*`) in `content/livingRealm.ts`.
- **Columns = marches.** Every entry in `marches_json` (player and NPC, any purpose, scouts and garrisons too). `name` = owner realm name (`nameOf`), `destination` = province id (`toId`), `kind` = `March.kind`. `strength` is the same sum `resolveMarchArrival` uses: `forcePower(force)`, else `levy x militia power`. No fog filter in the sim, same as slice 21 inspect detail; the app should hide unseen ones if it cares.
- **March ETA:** incoming = `toId === provinceId`, outgoing = `fromId === provinceId` (player marches set out from home; NPC columns from their hold). Shared `byEta` sort: ticksLeft, then id.
- **Battle tick:** `last_battle_json` has no tick. Both writers (`combat.ts`, `engagement.ts`) call `recordCrown(state, "battle", ...)` in the same tick, so the tick is the newest `battle` entry in `world_log`. No entry, or older than `BATTLE_NOTE_RECENT_TICKS` (1800), returns null, so `last` is never null in a non-null result today; the type keeps `| null` to match the brief.
- **Switches:** `columnStatus`, `marchEta`, `battleNotes` in `LivingSwitches`.
- **Exports:** the three functions, types `ColumnStatusEntry`, `ColumnStatus`, `MarchEtaEntry`, `MarchEta`, `BattleOutcomeNote`, and the constants from `packages/sim`.
- **Left alone:** `march.ts` (pathfinding, travel time), `column.ts`, `combat.ts`, `engagement.ts`, `lastBattle.ts`, balance tables; app/render/server source. **Not yet in the app.**

## 2026-11-27 — app / living presentation for training progress, unit unlocks & relationship detail

- **Army training progress (`packages/app/src/hud/TrainingProgressLine.tsx`, `packages/app/src/tabs/ArmyTab.tsx`):**
  - Exported pure `resolveTrainingProgress(state)` wrapping `trainingProgressSnapshot(state)` (`1f487a8`, exact match — zero mismatch) and mounted `<TrainingProgressLine state={state} />` under `<TrainingPace>`. Displays progress bar, `~Ns (Tt)` countdown, `+N queued`, and `snap.note`; returns `null` when no Barracks is finished or `living_training_progress` is `false`.
- **Army unit unlocks expander (`packages/app/src/hud/UnitUnlockExpander.tsx`, `packages/app/src/tabs/ArmyTab.tsx`):**
  - Exported pure `resolveUnitUnlocks(state)` wrapping `unitUnlockSnapshot(state)` (`1f487a8`, exact match — zero mismatch) and mounted collapsed `<details class="sc-unit-unlocks">` under `<TrainingProgressLine>` splitting ready units vs locked units with `requires`.
- **World relationship detail note (`packages/app/src/hud/RealmRelationshipCard.tsx`):**
  - Exported pure `resolveRealmRelationshipDetail(state, realmId)` wrapping `relationshipDetailSnapshot(state, realmId)` (`1f487a8`, exact match — zero mismatch) and mounted `.sc-rel-detail-note` inside each realm row showing `lastGift` and `suggestion`.
- **Dedicated CSS (`hud/training-progress.css`, `hud/unit-unlocks.css`, `hud/relationship-detail.css`):** Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;` on pips/tracks, calm reveal/breathe transitions, and `@media (prefers-reduced-motion: reduce)`. Zero edits to sim/server math, `theme.css`, earlier CSS files, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/LivingSlice23Presentation.test.tsx`):** 4 tests passing (`npm test` -> sim **838**, app **1705**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — app / living presentation for job summary & staffing pressure

- **Job summary expander (`packages/app/src/hud/JobSummaryExpander.tsx`, `packages/app/src/PeoplePanel.tsx`):**
  - Exported pure `resolveJobSummary(state)` wrapping `jobSummarySnapshot(state)` (`6fb1b6b`, exact match — zero mismatch) and mounted `<JobSummaryExpander state={state} />` under `<h3>People</h3>`. Renders a collapsed-by-default `<details class="sc-job-summary">` with `Idle N`, per-job counts, and expandable building list; returns `null` when no player citizens exist or `living_job_summary` is `false`.
- **Staffing pressure sub-line (`packages/app/src/hud/StaffingPressureLine.tsx`, `packages/app/src/tabs/KingdomTab.tsx`):**
  - Exported pure `resolveStaffingPressure(state)` wrapping `staffingPressureSnapshot(state)` (`6fb1b6b`, exact match — zero mismatch) and mounted `<StaffingPressureLine state={state} />` under `<DecreeEffectSummaryLine>` so it surfaces even when `PeoplePanel` is hidden (`emptyBuildings > 0`, `idleVillagers === 0`). Returns `null` when balanced or `living_staffing_pressure` is `false`.
- **Dedicated CSS (`hud/job-summary.css`, `hud/staffing-pressure.css`):** Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;` on pips, calm reveal/breathe keyframes, and `@media (prefers-reduced-motion: reduce)`. Zero edits to sim/server math, `theme.css`, earlier CSS files, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/LivingSlice22Presentation.test.tsx`):** 3 tests passing (`npm test` -> sim **822**, app **1701**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — sim / Living Realm slice 23 (training progress, unit unlocks, relationship detail)

- **Where:** `trainingProgressSnapshot`, `unitUnlockSnapshot`, `relationshipDetailSnapshot` in `systems/livingStatus.ts`. Constants (`TRAINING_NOTE_*`, `UNIT_UNLOCK_CAP`, `UNIT_REQUIRES_FALLBACK`, `RELATIONSHIP_GIFT_*`, `RELATIONSHIP_WARM_OPINION`, `RELATIONSHIP_SUGGEST_*`) in `content/livingRealm.ts`.
- **Yard gate:** "yard" = the Hall's Yard room, i.e. a finished player Barracks (`hallRoomBuilt`). Training itself does not need a Barracks, so a crown training militia with no Barracks gets null. Drop the gate if the UI wants the queue anyway.
- **Training ids:** `active.id` / `queue[].id` are training job ids (`tr_N`, usable with `tryCancelTraining`), not unit type ids.
- **Unlocks:** `unitUnlocked` calls `researchDone`, which lazily writes `research_<id>` once a study's timer has passed, so it runs on `readCopy`. `requires` reads `RESEARCH[*].unlocks`; a test pins that finishing that study really opens each gated unit.
- **Stance:** the stance expression from `realmRelationshipSummary` moved into `stanceFrom` + exported `relationshipStanceWith`; the summary calls it, so the two can't drift.
- **lastGift:** scans `state.inputLog` for `type: "gift"` with `payload.to === realmId` (written by `tryGiftGold`). Gifts are not tracked per realm anywhere else.
- **Switches:** `trainingProgress`, `unitUnlocks`, `relationshipDetail` in `LivingSwitches`.
- **Exports:** the three functions, `relationshipStanceWith`, types `TrainingActive`, `TrainingQueued`, `TrainingProgress`, `UnitReady`, `UnitLocked`, `UnitUnlocks`, `RelationshipDetail`, and the constants from `packages/sim`.
- **Left alone:** `training.ts`, `actions/train.ts`, `research.ts`, `cultureUnits.ts`, `actions/diplomacy.ts`, balance tables; app/render/server source. **Not yet in the app.**

## 2026-11-27 — sim / Living Realm slice 22 (job summary, staffing pressure)

- **Where:** `jobSummarySnapshot` and `staffingPressureSnapshot` in `systems/livingStatus.ts`. Constants `JOB_SUMMARY_BUILDING_CAP`, `STAFFING_NOTE_ASSIGN`, `STAFFING_NOTE_SHORT`, `STAFFING_NOTE_SPARE` in `content/livingRealm.ts`.
- **Job summary:** walks `CITIZEN_JOBS` (insertion order) and skips `unassigned`. A job appears only if it has a player worker or a finished player work, so the UI never gets empty rows. "Idle" means job `unassigned`; a citizen with a job but no tile counts under that job, not as idle.
- **Staffing:** reuses `emptyStaffWorks` (`systems/staffHint.ts`) rather than its own scan, so the count always matches the existing staff hint. If the hint's SKIP list changes, this follows.
- **Switches:** `jobSummary`, `staffingPressure` in `LivingSwitches`.
- **Exports:** both functions, types `JobBuilding`, `JobSummaryEntry`, `JobSummary`, `StaffingPressure`, and the four constants from `packages/sim`.
- **Left alone:** `citizens.ts` (assignment, hiring), `staffBonus`, `staffHint.ts`, housing, balance tables; app/render/server source. **Not yet in the app.**

## 2026-11-27 — docs hygiene / shared inspect tile names

- `ProvinceInspect.tsx` now uses `INSPECT_NODE_NAMES` from `@second-crown/sim` (`content/livingRealm.ts`), the same table `inspectDetailSnapshot` uses for `name`. The two can no longer drift. Rename a node there, not in the app.
- **Remaining copies (not changed in this pass):** local node-name maps still live in `hud/AtlasProvinceCard.tsx` (`NODE`, identical), `hud/CampLivingRows.tsx` (`NODE_NAME`, identical), `hud/OutpostLivingCard.tsx` (`NODE_NAME`, no `hold` key) and `hud/NodeLivingCard.tsx` (`NODE_NAME`, gather nodes only, typed by `GATHER_NODES`). All strings match the sim table today. Fold them onto `INSPECT_NODE_NAMES` in a later UI pass.
- `ProvinceInspect`'s `TERRAIN` map has no sim twin (`inspectDetailSnapshot.terrain` is the raw id), so it stays in the app.
- HANDOFF: the "not merged" labels on old `wave/*` / `bakeoff/*` entries were all stale. Before calling a branch waiting, check `git merge-base --is-ancestor origin/<branch> origin/main`.

## 2026-11-27 — app / living presentation for decree-effect summaries & province inspect detail

- **Decree-effect summary line (`packages/app/src/hud/DecreeEffectSummaryLine.tsx`, `packages/app/src/tabs/KingdomTab.tsx`):**
  - Exported pure `resolveDecreeEffectSummary(state)` wrapping `decreeEffectSummarySnapshot(state)` (`7e4d28b`, exact match — zero mismatch) and mounted `<DecreeEffectSummaryLine state={state} />` under `<CourtDetailLine>`. Lists active decree effects (`d.name: d.effect`) plus `snap.suggestion`, returning `null` with no court or when `living_decree_effects` is `false`.
- **Inspect detail section (`packages/app/src/hud/InspectDetailSection.tsx`, `packages/app/src/ProvinceInspect.tsx`):**
  - Exported pure `resolveInspectDetail(state, provinceId)` wrapping `inspectDetailSnapshot(state, provinceId)` (`7e4d28b`, exact match — zero mismatch) and mounted `{seen ? <InspectDetailSection state={state} provinceId={selectedId} /> : null}` after the `is-owner` group so fogged tiles never leak stock/outpost/march data.
- **Dedicated CSS (`hud/decree-effect-summary.css`, `hud/inspect-detail.css`):** Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;` on pips and stock bars, calm breathe/fill transitions, and `@media (prefers-reduced-motion: reduce)`. Zero edits to sim/server math, `theme.css`, `inspect-card.css`, earlier CSS files, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/LivingSlice21Presentation.test.tsx`):** 3 tests passing (`npm test` -> sim **809**, app **1698**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — app / living presentation for research progress, study previews & academy feedback

- **Research progress detail bar (`packages/app/src/hud/ResearchProgressDetailBar.tsx`, `packages/app/src/tabs/KingdomTab.tsx`):**
  - Exported pure `resolveResearchProgressDetail(state)` wrapping `researchProgressDetailSnapshot(state)` (`36af5fb`, exact match — zero mismatch) and mounted `<ResearchProgressDetailBar state={state} />` under `<ResearchProgressLine>`. Renders `.sc-rpd-row` with thin track bar, `percent` (`0–100`), and `~Ns` ETA; returns `null` when idle or `living_research_progress` is `false`.
- **Optional study-effect previews (`packages/app/src/hud/ResearchDetailExpander.tsx`):**
  - Exported pure `resolveStudyEffectPreview(state, studyId)` wrapping `studyEffectPreviewSnapshot(state, studyId)` (`36af5fb`, exact match — zero mismatch) and attached calm `.sc-study-preview` notes plus `title` hover tooltips inside each `Next unlocks` item while keeping `<details>` collapsed by default.
- **Academy feedback line (`packages/app/src/hud/AcademyFeedbackLine.tsx`, `packages/app/src/tabs/KingdomTab.tsx`):**
  - Exported pure `resolveAcademyFeedback(state)` wrapping `academyFeedbackSnapshot(state)` (`36af5fb`, exact match — zero mismatch) and mounted `<AcademyFeedbackLine state={state} />` under `<ResearchProgressLine>`. Surfaces `building` / `staffed` / `bonus active` / `idle` status and `snap.note`, returning `null` when no Academy exists or `living_academy_feedback` is `false`.
- **Dedicated CSS (`hud/research-progress-detail.css`, `hud/study-effect-preview.css`, `hud/academy-feedback.css`):** Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;` on pips/tracks, calm breathe/fade transitions, and `@media (prefers-reduced-motion: reduce)`. Zero edits to sim/server math, `theme.css`, earlier CSS files, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/LivingSlice20Presentation.test.tsx`):** 4 tests passing (`npm test` -> sim **787**, app **1695**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — app / living presentation for research, court & board interaction detail

- **Research next-unlocks expander (`packages/app/src/hud/ResearchDetailExpander.tsx`, `packages/app/src/tabs/KingdomTab.tsx`):**
  - Exported pure `resolveResearchDetail(state)` wrapping `researchDetailSnapshot(state)` (`f60fbcd`, exact match — zero mismatch) and mounted `<ResearchDetailExpander state={state} />` directly under `<ResearchProgressLine>`. Renders a collapsed-by-default `<details class="sc-research-detail">` (`Next unlocks (N)`) showing `ready` or `needs ...` gates and hiding cleanly when `nextUnlocks` is empty or `living_research_detail` is `false`.
- **Court detail sub-line (`packages/app/src/hud/CourtDetailLine.tsx`, `packages/app/src/tabs/KingdomTab.tsx`):**
  - Exported pure `resolveCourtDetail(state)` wrapping `courtDetailSnapshot(state)` (`f60fbcd`, exact match — zero mismatch) and mounted `<CourtDetailLine state={state} />` directly under `<CourtStatusLine>`. Lists active decrees with `~Ns (Tt)` remaining plus `guidance` text, returning `null` with no court or when `living_court_detail` is `false`.
- **Board nearby-friendly overlay (`packages/app/src/hud/BoardInteractionDetailOverlay.tsx`, `packages/app/src/hud/BoardFeedbackLayer.tsx`):**
  - Exported pure `resolveBoardNearbyFriendly(state, view)` wrapping `boardInteractionDetailSnapshot(state, view)` (`f60fbcd`, exact match — zero mismatch) and mounted non-blocking `<BoardNearbyFriendlyMark>` inside `<BoardFeedbackLayer>` to render a quiet `Near: ...` SVG pill beneath a selected province when friendly realms occupy tiles within `BOARD_NEARBY_RADIUS` steps (`pointer-events: none`).
- **Dedicated CSS (`hud/research-detail.css`, `hud/court-detail.css`, `hud/board-interaction-detail.css`):** Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;` on pips and SVG overlay elements, calm reveal/breathe keyframes, and `@media (prefers-reduced-motion: reduce)`. Zero edits to sim/server math, `theme.css`, earlier CSS files, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/LivingSlice19Presentation.test.tsx`):** 4 tests passing (`npm test` -> sim **767**, app **1691**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — app / living presentation for yield breakdown & storage pressure detail

- **Yield breakdown expander (`packages/app/src/hud/EconomyYieldBreakdown.tsx`, `packages/app/src/tabs/KingdomTab.tsx`):**
  - Exported pure `resolveEconomyYieldBreakdown(state)` wrapping `economyYieldBreakdownSnapshot(state)` (`ac170e0`, exact match — zero mismatch) and mounted `<EconomyYieldBreakdown state={state} />` directly under `<EconomyYieldsLine>`. Renders a collapsed-by-default `<details class="sc-yield-breakdown">` (`Breakdown (N)`) grouping non-empty resources with per-source names and `+X/s` rates, returning `null` when all four lists are empty or `living_yield_breakdown` is `false`.
- **Storage pressure detail sub-line (`packages/app/src/hud/StoragePressureDetailLine.tsx`, `packages/app/src/tabs/KingdomTab.tsx`):**
  - Exported pure `resolveStoragePressureDetail(state)` wrapping `storagePressureDetailSnapshot(state)` (`ac170e0`, exact match — zero mismatch) and mounted `<StoragePressureDetailLine state={state} />` directly under `<EconomyPressureLine>`. Filters to `status !== "ok"` entries to render quiet percent-full and status notes (`low` / `ample` / `full`) without disturbing existing all-`ok` assertions on `EconomyPressureLine`, returning `null` when all stores are `ok` or `living_storage_detail` is `false`.
- **Dedicated CSS (`hud/economy-yield-breakdown.css`, `hud/storage-pressure-detail.css`):** Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;` on pips, calm reveal/breathe keyframes, and `@media (prefers-reduced-motion: reduce)`. Zero edits to sim/server math, `theme.css`, earlier CSS files, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/LivingSlice18Presentation.test.tsx`):** 5 tests passing (`npm test` -> sim **746**, app **1687**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — sim / Living Realm slice 21 (decree effects, inspect detail)

- **Decrees:** `decreeEffectSummarySnapshot` in `systems/livingStatus.ts`, same `decree_<id>_until > tick` scan as `courtDetailSnapshot`. Affordability reads `DECREES[i].cost` against `state.resources` with `D().gte` (the same check `tryDecree` makes; `tryDecree` itself untouched). `DECREE_EFFECTS` / `DECREE_SUGGESTIONS` / `DECREE_SUGGEST_SAVE` live in `content/livingRealm.ts`. **If a decree's effect changes (train.ts, economy.ts, diplomacy.ts), update `DECREE_EFFECTS`; the tests will fail until you do.** A decree id missing from the table falls back to its `blurb`.
- **Inspect:** `inspectDetailSnapshot` deliberately avoids `isProvinceSeen`, because `seenSet` writes `fog_seen` lazily. Fog stays an app concern. `listMarches` / `listGathers` / `nodeStock` / `listOutposts` / `settlementName` are pure reads. Outposts are collected per occupant realm via `listOutposts(state, realm)` then filtered by Manhattan distance <= `BOARD_NEARBY_RADIUS`. `INSPECT_NODE_NAMES` copies the `NODE` labels in `app/src/ProvinceInspect.tsx` (the app can switch to the sim table later).
- **Switches:** `decreeEffects`, `inspectDetail` in `LivingSwitches`.
- **Exports:** both functions, types `DecreeEffect`, `DecreeEffectSummary`, `InspectStock`, `InspectMarch`, `InspectDetail`, and the `DECREE_*` / `INSPECT_*` constants from `packages/sim`.
- **Left alone:** decree costs, lengths, math, `tryDecree`; pathfinding; fog; inspect card rules; balance tables; app/render/server source. **Not yet in the app.**

## 2026-11-27 — sim / Living Realm slice 20 (research progress, study preview, academy feedback)

- **Progress:** `researchProgressDetailSnapshot` in `systems/livingStatus.ts` uses a new private `openStudy(state)` (the same `studyKnown` + `research_<id>_until > tick` scan, first in table order; total falls back to the table length). No lazy flag writes.
- **Preview:** `studyEffectPreviewSnapshot` reads `STUDY_EFFECTS` (content/livingRealm.ts) by `RESEARCH` own-key check (so `"toString"` is null). The table is hand-written; `livingSlice20.test.ts` derives each number from the live helper (yield, wall bonus, storage cap, vision, scout discount, train mult) and checks unlock lines against `RESEARCH[id].unlocks` + `getUnitType().name` + `unitUnlocked`. **If a study's numbers change, update `STUDY_EFFECTS`; the tests will fail until you do.**
- **Academy:** `academyFeedbackSnapshot` filters player `academy` buildings; `bonusActive` calls `academyReady` (exported from `research.ts`, body unchanged; note it uses `countBuilding`, which ignores realm, as before). `staffed` uses `staffBonus` from `economy.ts`; `jobForBuildingType("academy")` is `unassigned`, so false until the Academy gets a job. Early note: open study `totalTicks === RESEARCH[id].ticks` with the bonus on.
- **Switches:** `researchProgress`, `studyPreview`, `academyFeedback` in `LivingSwitches`.
- **Exports:** the three functions, types `ResearchProgressDetail`, `StudyEffectPreview`, `AcademyFeedback`, constants `STUDY_EFFECT_CAP`, `STUDY_EFFECTS`, `ACADEMY_NOTE_BUILDING`, `ACADEMY_NOTE_IDLE`, `ACADEMY_NOTE_EARLY` from `packages/sim`.
- **Left alone:** research table and `effect` strings, pacing, costs, gates, Academy 20% math, staffing/citizen jobs, balance tables, app/render/server source. **Not yet in the app.**

## 2026-11-27 — sim / Living Realm slice 19 (research, court, board interaction detail)

- **Research:** `researchDetailSnapshot` in `systems/livingStatus.ts`. Same `studyKnown` (no lazy flag writes) and active-study loop as `researchProgressSnapshot`. New private `missingGates(state, id, keep)` returns the missing gates as labels (Keep as roman numeral, prerequisite by study name, `needsAny` building names joined with " or "). Candidates with `<= 1` gap, sorted by gap count then table index, sliced to `RESEARCH_NEXT_UNLOCKS_CAP`.
- **Court:** `courtDetailSnapshot` reads `decree_<id>_until > tick` per DECREES entry; `ticksLeft = until - tick`. Guidance strings live in `content/livingRealm.ts`.
- **Board:** `boardFeedbackSnapshot` body moved into private `boardFeedbackCore` (no switch) so both snapshots share it. `nearbyFriendly` scans `board.provinces` within `BOARD_NEARBY_RADIUS` of the selection and intersects with new exported `friendlyRealmIds(state, atTick?)` in `systems/livingRealm.ts` (the pact/peace/not-at-war rule, no cap, no switch). `friendlyPresenceSnapshot` now calls the same private `friendlyWith`.
- **Switches:** `researchDetail`, `courtDetail`, `boardDetail` added to `LivingSwitches`.
- **Exports:** the three functions, `friendlyRealmIds`, types `ResearchRef`, `ResearchUnlock`, `ResearchDetail`, `CourtActiveDecree`, `CourtDetail`, `BoardInteractionDetail`, constants `RESEARCH_NEXT_UNLOCKS_CAP`, `COURT_GUIDANCE_IDLE`, `COURT_GUIDANCE_FULL`, `BOARD_NEARBY_RADIUS`, `BOARD_NEARBY_FRIENDLY_CAP` from `packages/sim`.
- **Left alone:** research table, pacing, costs and start rules; decree costs/lengths/effects; presence rules; pathfinding and march math; balance tables; app/render/server source. **Not yet in the app.**

## 2026-11-27 — sim / Living Realm slice 18 (yield breakdown, storage pressure detail)

- **Sources:** new exported `incomeSourcesPerTick(state)` in `systems/economy.ts` walks the same pieces as `computeIncomePerSecond` (finished buildings via the private `rateFor`, routes × 0.15, outpost tithe, labor) but keeps them apart, keyed by `id|res`. `computeIncomePerSecond` itself is unchanged; the totals test pins the two together.
- **Breakdown:** `economyYieldBreakdownSnapshot` in `systems/livingStatus.ts` runs it on `readCopy` (research flag writes never land), converts to per second, drops `perSec <= 0` and non-store resources, sorts desc then by id, slices to `YIELD_BREAKDOWN_CAP` (4, `content/livingRealm.ts`). Off: `{ food: [], wood: [], stone: [], gold: [] }`.
- **Detail:** `storagePressureDetailSnapshot` uses new private `storeFill` + `pressureLevel`; `economyPressureSnapshot` now calls the same two, so status cannot drift. `netPerSec` comes from `netRates`, the helper behind `economyYieldsSnapshot`.
- **Switches:** `yieldBreakdown`, `storageDetail` added to `LivingSwitches`.
- **Exports:** both functions, `YieldSource`, `YieldBreakdown`, `StoragePressureDetail`, `YIELD_BREAKDOWN_CAP` from `packages/sim`.
- **Left alone:** yield, upkeep, storage and cap formulas; balance tables; app/render/server source. **Not yet in the app.**

## 2026-11-27 — app / living presentation for last-inspected tracking, relationship history & economy yields

- **Last-inspected tracking (`packages/app/src/game/useGameEngine.ts`, `packages/app/src/AppShell.tsx`):**
  - Exported pure `nextLastInspected(prevSelected, nextSelected, prevLastInspected)` and added `lastInspectedProvinceId` React state updated inside the `selectedProvinceId` effect and reset on `newGame`. Passed `lastInspectedId={lastInspectedProvinceId}` from `AppShell` into `<BoardLiving>`.
- **Relationship history expander (`packages/app/src/hud/RealmRelationshipCard.tsx`):**
  - Exported pure `listRealmRelationshipHistory(state, realmId)` wrapping `relationshipHistorySnapshot(state, realmId)` (`5178dc8`, exact match — zero mismatch); renders a collapsed-by-default `<details class="sc-rel-history">` (`Recent (N)`) under rows with history and omits it cleanly when empty or `living_relationship_history` is `false`.
- **Economy yields sub-line (`packages/app/src/hud/EconomyYieldsLine.tsx`, `packages/app/src/tabs/KingdomTab.tsx`):**
  - Exported `resolveEconomyYields(state)`, `formatEconomyYieldEntries(yields)`, and `<EconomyYieldsLine state={state} />` mounted under `<EconomyPressureLine>`, reading `economyYieldsSnapshot(state)` (exact match — zero mismatch) and hiding cleanly when all four rates are zero or `living_economy_yields` is `false`.
- **Dedicated CSS (`hud/relationship-history.css`, `hud/economy-yields-status.css`):** Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;` on pips, calm breathe keyframes, and `@media (prefers-reduced-motion: reduce)`. Zero edits to sim/server math, `theme.css`, `board-living.css`, earlier CSS files, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/LivingSlice17Presentation.test.tsx`):** 4 tests passing (`npm test` -> sim **734**, app **1682**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — sim / Living Realm slice 17 (relationship history, economy yields)

- **History:** `lastInteractionWith` in `systems/livingRealm.ts` became `interactionsWith` (collects every record, sorts tick desc → `INTERACTION_RANK` → source order news/log/wars) plus a one-line `lastInteractionWith` that takes entry 0. `relationshipHistorySnapshot` slices it to `RELATIONSHIP_HISTORY_CAP` (4, `content/livingRealm.ts`). One scan for both, so the summary's `lastInteraction` and history[0] cannot drift.
- **Bounded by the logs:** culture news and `world_log` are already capped where they are written (world log keeps 24), so history only goes back as far as those logs do. Wars are kept in `state.wars`. Fixed war lines are the only non-record text.
- **Yields:** new private `netRates(state)` in `systems/livingStatus.ts` (income on `readCopy`, food minus `upkeepPerTick * TICKS_PER_SECOND`). `economyPressureSnapshot` now calls it too; numbers identical to before. `economyYieldsSnapshot` returns it renamed.
- **Last inspected:** sim already ready (`BoardView.lastInspectedProvinceId`). App wiring still to do: `AppShell.tsx` passes only `selectedId` to `<BoardLiving>`; it needs a `lastInspectedId` state (e.g. set to the previous `selectedProvinceId` when selection changes) passed as the existing `lastInspectedId` prop.
- **Switches:** `relationshipHistory`, `economyYields` added to `LivingSwitches`.
- **Counts test:** three seeds × 600 `TickEngine` ticks, snapshots every 20 ticks vs both flags off: identical counts, resources, units, wars, flags.
- **Left alone:** economy, upkeep, storage, diplomacy, war, trade code; balance tables; app/render/server source. **Not yet in the app.**

## 2026-11-27 — app / living presentation for economy, research, court & board feedback

- **Kingdom status components (`hud/EconomyPressureLine.tsx`, `hud/ResearchProgressLine.tsx`, `hud/CourtStatusLine.tsx`, `tabs/KingdomTab.tsx`):**
  - Exported pure readers + components mounted cleanly under `.sc-map-strip` (preserving `Fold#kingdom-notes` and existing status-line ordering).
  - `EconomyPressureLine` hides when `economyPressureSnapshot` is `null` or all pressures are `"ok"`, `!bareFood`, and `fullStores.length === 0`.
  - `ResearchProgressLine` shows active study bar + `~Ns left` + `completedCount` or idle `nextAvailable`; `CourtStatusLine` shows active/open decree counts + `lastDecree`.
- **Board feedback layer (`hud/BoardFeedbackLayer.tsx`, `BoardLiving.tsx`):**
  - Extended `BoardLivingProps` with optional `lastInspectedId?: string | null` (default `null`) and mounted `<BoardFeedbackLayer>` right after `<BoardColumnRanks>`, reading `boardFeedbackSnapshot(state, view)` to draw non-blocking (`pointer-events: none !important;`) selected diamond + label, distinct last-inspected dashed diamond, and pending march trail + ETA pill.
- **Dedicated CSS (`hud/economy-pressure-status.css`, `hud/research-court-status.css`, `hud/board-feedback-status.css`):** Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;`, calm keyframes, and `@media (prefers-reduced-motion: reduce)`. Zero edits to sim/server math, `theme.css`, `board-living.css`, earlier CSS files, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/SystemStatusSnapshots.test.tsx`):** 5 tests passing (`npm test` -> sim **717**, app **1678**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — sim / Living Realm slice 16 (system status snapshots)

- **File:** new `systems/livingStatus.ts`; thresholds `ECONOMY_PRESSURE_HIGH_FILL` (0.25) and `ECONOMY_PRESSURE_LOW_FILL` (0.75) in `content/livingRealm.ts`. Four switches added to `LivingSwitches` (`economyStatus`, `researchStatus`, `courtStatus`, `boardFeedback`).
- **Purity trap:** `researchDone` / `researchTicksLeft` write `research_<id> = 1` when a study's finish tick has passed, and `computeIncomePerSecond` reaches them through the yield math. The economy snapshot calls income on `readCopy(state)` (same object, fresh `flags`). The research snapshot uses its own `studyKnown`, which never writes. A test proves the state is byte-identical after all four calls with an overdue study.
- **bareFood:** `isBareFood` copies render's `isFoodStoresEmptyOrLow` rule (the sim cannot import render). If one changes, change both.
- **Court null:** "no court" = no character with `realmId === "player"`. lastDecree is derived from `decree_<id>_until - ticks` (tryDecree logs nothing); ties go to DECREES order.
- **Board:** the sim has no selection; `useGameEngine` holds `selectedProvinceId` in React state. The snapshot takes a `BoardView` argument. There is no last-inspected state in the app yet; the app would need to track it to pass it.
- **Counts test:** three seeds × 600 real `TickEngine` ticks with starter buildings, snapshots called every 20 ticks on one state, all four flags off on the other: identical `livingCounts`, resources, units, buildings, wars and flags (apart from the switches).
- **Left alone:** economy, storage, research, decree, march and selection code; balance tables; app/render/server source. **Not yet in the app.**

## 2026-11-27 — app / living presentation for board friendly routes

- **Board routes layer (`packages/app/src/hud/BoardFriendlyRoutes.tsx`, `BoardLiving.tsx`):**
  - Exported `BoardFriendlyRouteItem`, pure `listBoardFriendlyRoutes(state)` (partial-state guard + `isProvinceSeen` check on both holds, `7px` endpoint trim + alternating quadratic curve bow), and `<BoardFriendlyRoutes state={state} />` mounted inside `BoardLiving.tsx` directly before `<BoardFriendlyPresence>` so routes stay cleanly beneath hold pips, formations, and column standards.
  - Reads `friendlyRoutesSnapshot(state)` (`4ff15ac`, exact match — zero mismatch) to render culture-kit SVG `<linearGradient>` arcs scaled by `strength` (`1`: faint dashed `0.72` stroke; `2`: medium `1.05` stroke + midpoint waymarker; `3`: `1.35` stroke + `.sc-froute-glow` + gold diamond waymarker). Strict `pointer-events: none !important;`, zero blood/gore.
- **Dedicated CSS (`packages/app/src/hud/friendly-routes.css`):** Imported from `BoardFriendlyRoutes.tsx`. Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;`, calm drift/breathe keyframes (`sc-froute-drift`, `sc-froute-mote-breathe`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to pathfinding/trade math, `theme.css`, `board-living.css`, `friendly-presence-standard.css`, `relationship-summary.css`, `column-marks.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/BoardFriendlyRoutes.test.tsx`):** 3 tests passing (`npm test` -> sim **697**, app **1673**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — sim / Living Realm slice 15 (friendly routes)

- **Snapshot:** `friendlyRoutesSnapshot(state, atTick = tick)` in `systems/livingRealm.ts`, types `FriendlyRoute`, `FriendlyRouteKind`; cap `FRIENDLY_ROUTES_CAP` (8) in `content/livingRealm.ts`. Ends = `friendlyPresenceSnapshot(state, atTick)` realm ids (so it inherits presence's cap of 6, its order and its `living_board_presence` switch). Walks pairs i < j, stops at the cap.
- **Trade (`tradesBetween`, private):** gather crew of either realm on a province the other occupies (`rawGathers`), or a `caravan` culture-news item between them either way within `FRIENDLY_TRADE_WINDOW_TICKS`. NPC↔NPC caravans go to culture news, not the world log, so this differs from `tradesWithPlayer` on purpose.
- **Pact:** `playerPactAllies(state).has(a) || .has(b)`. "Both are allies" can never hold: `joinableWars` requires the player to have no active war, so at most one ally exists. The ally's partner is always a friend of the player because both ends come from presence.
- **Peace:** `peaceLockedAt(state, a, b, atTick)`. Pairs at war (`atWarWith`) are skipped first.
- **Strength:** `1 + trade + pact`, typed `1 | 2 | 3`. Peace adds nothing over the base.
- **Switch:** `friendlyRoutes` / `living_friendly_routes` added to `LivingSwitches`.
- **Counts test:** three seeds × 300 pulses with a joined war and all other NPCs befriended, every snapshot called each pulse, flag on vs off: identical trace, `livingCounts`, resources, wars and flags (apart from the switch itself).
- **Left alone:** trade, diplomacy, peace-lock writes, pathfinding, gather, combat, phase timing, balance tables, app/render/server source. **Not yet in the app.**

## 2026-11-27 — app / living presentation for World tab relationship summary

- **World tab component (`packages/app/src/hud/RealmRelationshipCard.tsx`, `tabs/WorldTab.tsx`):**
  - Exported `RELATIONSHIP_STANCE_LABEL`, pure `listRealmRelationships(state)` (partial-state guard), and `<RealmRelationshipCard state={state} />` mounted directly under `Fold#world-culture-whispers`.
  - Reads `realmRelationshipSummary(state)` (`62fe177`, exact match — zero mismatch) to render one compact row per known NPC realm (name, `formatWhisperCultureTag` display culture, color-coded stance pill, `Last: ...`, `Next: ...`), returning `null` when the list is empty or `living_relationship_summary` is `false`.
- **Dedicated CSS (`packages/app/src/hud/relationship-summary.css`):** Imported from `RealmRelationshipCard.tsx`. Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;` on decorative pips, calm pip pulse keyframe (`sc-rel-pip-pulse`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to diplomacy/war math, `CultureWhispersCard.tsx`, `theme.css`, `board-living.css`, `last-whisper-summary.css`, `friendly-presence-standard.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/RealmRelationshipCard.test.tsx`):** 3 tests passing (`npm test` -> sim **679**, app **1670**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — sim / Living Realm slice 14 (relationship summary)

- **Summary:** `realmRelationshipSummary(state, atTick = tick)` in `systems/livingRealm.ts`, types `RealmRelationship`, `RelationshipStance`, `RelationshipInteraction`, `RelationshipNext`; cap `RELATIONSHIP_SUMMARY_CAP` (8) in `content/livingRealm.ts`. Walks `state.realms` (skips player), stops at the cap.
- **Known:** stance not neutral, or a last interaction exists, or one of the realm's provinces is in `fog_seen`. `fog_seen` is read raw (`rawSeenProvinces`) because `fog.ts` `seenSet` writes the flag when missing, and the live vision radius is not counted (the app can filter further with `isProvinceSeen`).
- **Stance:** war = active war with both the player and the realm as sides (NPC wars ignored); pact = `playerPactAllies` (new private helper, also used by `friendlyPresenceSnapshot`, same output); peace = `peaceLockedAt`.
- **Last interaction (`lastInteractionWith`, private):** culture news (whisper realm→player, reply either way), world-log `trade` entries with the slice 13 caravan text prefix, `state.wars` player wars. Joined wars keep the NPC war's `startedTick`, so the join tick is read from the `war_join_<tick>_` id (`playerWarStartTick`). Events after `atTick` ignored. Same-tick tie order: peace made, war ended, war started, pact made, trade, reply, whisper. Culture news and world log are capped, so old events fall off naturally.
- **Next possible:** war → `warFightOpen` ? can fight : fight locked; else `replyableWhispers` has the realm → can reply; peace → peace locked; pact → riding together; neutral → can declare when `activeWarFor(player)` is empty (mirrors `tryDeclareWar`'s gates; peace lock is already its own stance), else null.
- **Switch:** `relationshipSummary` / `living_relationship_summary` added to `LivingSwitches`.
- **Counts test:** three seeds × 300 pulses of caravans, whispers, correspondence and NPC settles with a joined war, all three snapshots called each pulse, flag on vs off: identical trace, `livingCounts`, resources and wars.
- **Left alone:** diplomacy, peace-lock writes, war declare / peace actions, trade and gather math, combat, phase timing, balance tables, app/render/server source.

## 2026-11-27 — app / living presentation for friendly board presence & column standard strength

- **Friendly board presence (`packages/app/src/hud/BoardFriendlyPresence.tsx`, `BoardLiving.tsx`):**
  - Exported `BoardFriendlyPresenceItem`, `listBoardFriendlyPresence(state)` (partial-state & `isProvinceSeen` fog guards), and `<BoardFriendlyPresence>` mounted inside `BoardLiving.tsx` right before `<BoardJoinedFormations>`.
  - Reads `friendlyPresenceSnapshot(state)` (`2181b07`, exact match — zero mismatch) to place calm culture-kit marks on the upper-left flank of seen friendly holds (`peace` halo pip, `pact` companion standard, `trade` rotated diamond pip, and gentle quadratic routes for `pact`/`trade` only). Strict `pointer-events: none !important;`, zero blood/gore.
- **Column standard strength scaling (`packages/app/src/hud/BoardColumnMarks.tsx`):**
  - Reads `columnMarkSnapshot(state).standardStrength` (`1 | 2 | 3`, exact match — zero mismatch): scales masts/pennants upward (`poleTop` `-6.5` / `-7.6` / `-8.6`) via `standardMetrics(strength)`, adds pole finials (`2`/`3`) and `.sc-colmark-standard-halo` (`3`), and exposes `data-standard-strength` + `is-strength-1|2|3` with zero overlap against formations, column badges, or unit ranks.
- **Dedicated CSS (`packages/app/src/hud/friendly-presence-standard.css`):** Imported from `BoardFriendlyPresence.tsx` and `BoardColumnMarks.tsx`. Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;`, calm keyframes (`sc-friendly-route-drift`, `sc-friendly-breathe`, `sc-colmark-halo-gleam`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to diplomacy/combat math, `theme.css`, `board-living.css`, `column-marks.css`, `column-ranks-whisper-hint.css`, `voice-rank-accents.css`, `realm-tag-ranks-note.css`, `last-whisper-summary.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/FriendlyPresenceStandard.test.tsx`):** 4 tests passing (`npm test` -> sim **660**, app **1667**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-27 — sim / Living Realm slice 13 (friendly board presence, column standard strength)

- **Presence:** `friendlyPresenceSnapshot(state, atTick = tick)` in `systems/livingRealm.ts`. Walks `state.realms` (skips player and any realm `atWarWith` the player), stops at `FRIENDLY_PRESENCE_CAP`. Pact set = `allyRealmId` of active wars where the player is a side (joinSide). Peace = `peaceLockedAt(state, r, "player", atTick)`. Culture via `peekCultureOfRealm` (never seeds the flag). Kind priority: trade > pact > peace.
- **Trade check (`tradesWithPlayer`, private):** gather crews read raw from `flags.gathers_json` (importing `gather.ts` would cycle via march → ledger → livingRealm); a crew counts if player→realm-held province or realm→player-held province. Caravans: `getWorldLog` entries with `id === "trade"` and text prefix `"<realm name> trades caravans with "` within `FRIENDLY_TRADE_WINDOW_TICKS`. The player's own `trade_routes` count is global (no partner realm), so it is not used.
- **Strength:** `STANDARD_STRENGTH` in `content/livingRealm.ts`, `standardStrength(phase)`; equals `columnRanks(phase)` for every phase (tested). On `ColumnMark` as `standardStrength`, forced to 1 when the switch is off.
- **Switch:** `boardPresence` / `living_board_presence` added to `LivingSwitches`.
- **Counts test:** three seeds × 300 pulses of caravans, whispers and correspondence with both snapshots called each pulse, flag on vs off: identical trace, `livingCounts` and resources.
- **Left alone:** diplomacy, peace-lock writes, war declare / peace actions, `maybeNpcTrade`, `tryOpenRoute`, gather math, combat, phase timing, balance tables, app/render/server source.

## 2026-11-26 — app / living presentation for last-whisper summary line

- **World tab component (`packages/app/src/hud/LastWhisperSummaryLine.tsx`, `tabs/WorldTab.tsx`):**
  - Exported pure `resolveLastWhisperSummary(state)` (partial-state guard) and `<LastWhisperSummaryLine state={state} />` mounted directly below `<NextWhisperHintLine>` inside `Fold#world-culture-whispers`.
  - Reads `lastWhisperSummary(state)` (`ee1351d`, exact match — zero mismatch) and reuses `formatWhisperSenderTag(fromName, fromCulture)` to render `"Last whisper from <realm> (<culture>)"` on a single compact pill (`white-space: nowrap; text-overflow: ellipsis;`, realm + culture only, omitting `summary.text`), returning `null` cleanly when no whisper to `"player"` is in culture news.
- **Dedicated CSS (`packages/app/src/hud/last-whisper-summary.css`):** Imported from `LastWhisperSummaryLine.tsx`. Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;`, calm pip keyframe (`sc-last-whisper-breathe`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `CultureWhispersCard.tsx`, sim reply tables, `theme.css`, `board-living.css`, `column-ranks-whisper-hint.css`, `voice-rank-accents.css`, `realm-tag-ranks-note.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/LastWhisperSummaryLine.test.tsx`):** 3 tests passing (`npm test` -> sim **643**, app **1663**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-26 — sim / Living Realm slice 12 (player-only reply voice, last-whisper summary)

- **Tables:** `PLAYER_REPLIES_NPC_ONLY = { ...PLAYER_REPLIES_PLAIN, ...PLAYER_REPLIES_NPC_VOICE }` is the old slice 11 `PLAYER_REPLIES`. `PLAYER_REPLIES = { ...PLAYER_REPLIES_NPC_ONLY, ...PLAYER_REPLIES_PLAYER_ONLY_VOICE }` (private const, five player-only cultures). Key order unchanged. `playerReplyLinesFor(culture, voiced = true, playerOnlyVoiced = true)`: `voiced` false → plain; else `playerOnlyVoiced` false → NPC_ONLY; else full. The private `playerLines` passes both switches (`playerReplyVoice`, new `playerOnlyVoice` / flag `living_player_only_voice`).
- **Summary:** `lastWhisperSummary(state)` in `systems/livingRealm.ts` scans `getCultureNews` newest first for `kind === "whisper" && toRealmId === "player"`. `fromName` via `nameOf` (realm id if the realm is gone), `fromCulture` via `peekCultureOfRealm` (never seeds the culture flag), `text` is the stored news text. Ignores switches. Bounded by `CULTURE_NEWS_CAP` (8): an old whisper pushed out of news is no longer the "last". Type `LastWhisperSummary` exported from the sim index.
- **Cadence test:** runs `maybeWhisper` + `tickCorrespondence` 400 pulses on three seeds with the flag on vs off and compares the send trace and `livingCounts` (identical).
- **Left alone:** `replyToWhisper`, reply eligibility, one-reply rule, bots never replying, NPC culture player lines, `WHISPERS` / `WHISPER_REPLIES`, whisper send/storage, hint math, combat, balance tables, app/render/server source.

## 2026-11-26 — app / living presentation for whisper realm tag & richer column rank note

- **World tab hint realm tag (`packages/app/src/hud/NextWhisperHintLine.tsx`):**
  - Exported `formatWhisperSenderTag(fromName, fromCulture)` reading `nextWhisperHint(state).fromName` + `fromCulture` (`73c784c`, exact match — zero mismatch) and `getCulture(fromCulture).name`. Renders `· from <realm> (<culture>)` when both are non-null, falls back cleanly when either is `null`, and preserves hide-on-null `from`-tag and hide-on-null `hint` behavior.
- **Board richer unit ranks & `ranksNote` (`packages/app/src/hud/BoardColumnRanks.tsx`):**
  - Reads `columnMarkSnapshot(state).ranksNote` (exact match — zero mismatch): extends `BoardColumnRanksView` with `ranksNote`, adds crisp lead bevels (`.sc-colrank-bevel`) and heraldic trim pips (`.sc-colrank-pip`) beside both column rank stacks, and renders `<ranksLabel> · <ranksNote>` inside `.sc-colrank-note` at `(midX, midY + 38)` cleanly below `BoardJoinedFormations` (`midY + 14`) and `BoardColumnMarks` (`midY + 27`). Strict `pointer-events: none !important;`, zero blood/gore.
- **Dedicated CSS (`packages/app/src/hud/realm-tag-ranks-note.css`):** Imported from `NextWhisperHintLine.tsx` and `BoardColumnRanks.tsx`. Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;`, calm keyframe (`sc-colrank-bevel-gleam`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `CultureWhispersCard.tsx`, sim line tables, hint math, `theme.css`, `board-living.css`, `column-marks.css`, `column-ranks-whisper-hint.css`, `voice-rank-accents.css`, `player-reply-formation.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/RealmTagRanksNote.test.tsx`):** 4 tests passing (`npm test` -> sim **630**, app **1660**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-26 — sim / Living Realm slice 11 (player reply voice, fromName contract, ranks note)

- **Tables:** `PLAYER_REPLIES` is now `{ ...PLAYER_REPLIES_PLAIN, ...PLAYER_REPLIES_NPC_VOICE }` — the five NPC cultures voiced, the five player-only cultures identical to plain (same key order as before). `PLAYER_REPLIES_PLAIN` is the slice 7–10 text. `playerReplyLinesFor(culture, voiced = true)`; unknown cultures fall back to `western` in both. The private `playerLines` in `systems/livingRealm.ts` passes `livingSwitches(state).playerReplyVoice` (flag `living_player_reply_voice`), so `replyableWhispers` and `replyToWhisper` both follow it. Line index semantics unchanged (player picks 0–3).
- **fromName:** `whisperSenderAt` returns `{ id, name }` from the `state.realms` entry, and `nextWhisperHint` sets `fromName = from ? from.name : null` alongside `fromRealmId`, so the two are null together. No field added; tests over six seeds plus the no-listener case.
- **Ranks note:** `RANKS_NOTE: Record<WarPhaseId, string>` in content, `ranksNote(phase)` in livingRealm, `ColumnMark.ranksNote` set in `columnMarkSnapshot`. Keyed by phase (not column id) so it reads "skirmish"/"clash" rather than "skirmish-line"/"clash-line".
- **App test tweak:** `PlayerReplyFormation.test.tsx` matched raw reply text against `renderToStaticMarkup`; the new lines contain `'`, which React escapes to `&#x27;`. The test now escapes `& ' "` before `toContain`. No app source change.
- **Left alone:** `replyToWhisper` logic, reply eligibility (correspondence id, not at war, not peace-locked), one-reply rule, bots never replying, `WHISPERS` / `WHISPER_REPLIES`, hint math, combat, phase timing, balance tables, app/render/server source.

## 2026-11-26 — app / living presentation for whisper culture tag & stronger column ranks

- **World tab hint tag (`packages/app/src/hud/NextWhisperHintLine.tsx`):**
  - Exported `formatWhisperCultureTag(fromCulture)` reading `nextWhisperHint(state).fromCulture` (`b868b24`, exact match — zero mismatch) and `getCulture(fromCulture).name`. Appends `· from <culture>` inside `.sc-next-whisper-from` when non-null while preserving hide-on-null-`fromCulture` and hide-on-null-`hint` behavior.
- **Board stronger unit ranks & note (`packages/app/src/hud/BoardColumnRanks.tsx`):**
  - Reads `columnMarkSnapshot(state).ranksLabel` (exact match — zero mismatch): adds `buildRankBars` dark backing plates (`.sc-colrank-plate`) framing `6.8x1.9` rank bars (`.sc-colrank-mark.is-strong`, clash lead gold rim) beside both column standards plus a quiet `.sc-colrank-note` pill at `(midX, midY + 38)` cleanly below `BoardJoinedFormations` (`midY + 14`) and `BoardColumnMarks` (`midY + 27`). Strict `pointer-events: none !important;`, zero blood/gore.
- **Dedicated CSS (`packages/app/src/hud/voice-rank-accents.css`):** Imported from `NextWhisperHintLine.tsx` and `BoardColumnRanks.tsx`. Dusk/Night/Parchment chrome tokens, `pointer-events: none !important;`, calm keyframe (`sc-colrank-strong-breathe`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `CultureWhispersCard.tsx`, sim line tables, hint math, `theme.css`, `board-living.css`, `column-marks.css`, `column-ranks-whisper-hint.css`, `player-reply-formation.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/VoiceRankAccents.test.tsx`):** 3 tests passing (`npm test` -> sim **618**, app **1656**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-26 — sim / Living Realm slice 10 (culture voice, hint sender tag, rank note)

- **Tables:** `WHISPERS` and `WHISPER_REPLIES` are now the voiced tables; the slice 1–9 text lives on as `WHISPERS_PLAIN` / `WHISPER_REPLIES_PLAIN`. `whisperLinesFor(culture, voiced = true)` and `whisperReplyLinesFor(culture, voiced = true)` pick the set; player-only cultures still fall back to `western` in both. `maybeWhisper` and `tickCorrespondence` pass `livingSwitches(state).cultureVoice` (flag `living_culture_voice`).
- **Why sizes stayed at 4:** the line index (`whisperLineIndex`, reply `(dueTick/100 + salt) % n`) and the `living_whisper_lines_seen` bitmask (`WHISPER_LINE_BASE`, 20 bits) both depend on n. Same n means the voice switch only swaps text; the test compares kind, tick, from, to and line index for on vs off across three seeds.
- **Hint sender:** private `whisperSenderAt(state, atTick)` repeats maybeWhisper's sender pick (`npcs[(round + seed) % npcs]`) and listener filter (war, plus peace lock when correspondence is on) at `nextPulseTick`, against current state. A war or peace lock that starts before the pulse can still silence it; the hint is a forecast. `fromCulture` uses new `peekCultureOfRealm` (culture.ts), which does not seed `culture_<id>`, so the hint stays a pure read.
- **Rank note:** `RANKS_LABEL` in content, `ranksLabel(ranks)` in livingRealm, `ColumnMark.ranksLabel` set in `columnMarkSnapshot`. No phase timing or combat touched.
- **Left alone:** `PLAYER_REPLIES`, sender and listener choice, fair rotation, line-cycling formula, `WHISPER_PULSES`, whisper count, reply delay, combat, phase timing, balance tables, app/render/server. The app still shows only "Next whisper in ~Ns" and rank bars; showing `fromName` and `ranksLabel` is the next app slice.

## 2026-11-26 — app / living presentation for column unit ranks & next-whisper hint

- **Board column unit ranks (`packages/app/src/hud/BoardColumnRanks.tsx`, `BoardLiving.tsx`):**
  - Exported `BoardColumnRanksView`, pure `resolveBoardColumnRanks(state)` (partial-state guard), and `<BoardColumnRanks>` (`pointer-events: none !important;`).
  - Reads `columnMarkSnapshot(state)` (exact match with `6193e06` `columnRanks` / `.ranks`: `1 | 2 | 3`) to draw 1, 2, or 3 culture-kit horizontal rank bars below/beside each opposing column standard (`ourY + 9.5` / `theirY + 9.5`, gold lead rim on `clash-line`, hushed static bars on `falling-back`, zero blood/gore), coexisting cleanly with `BoardJoinedFormations` and `BoardColumnMarks`.
- **World tab next-whisper hint (`packages/app/src/hud/NextWhisperHintLine.tsx`, `tabs/WorldTab.tsx`):**
  - Exported `resolveNextWhisperHint(state)` and `<NextWhisperHintLine>` mounted above `<CultureWhispersCard>` inside `Fold#world-culture-whispers`, reading `nextWhisperHint(state)` (exact match) to show `Next whisper in ~Ns` and return `null` when the hint is `null`.
- **Dedicated CSS (`packages/app/src/hud/column-ranks-whisper-hint.css`):** Imported from `BoardColumnRanks.tsx` and `NextWhisperHintLine.tsx`. Dusk/Night/Parchment chrome tokens, strict `pointer-events: none !important;`, calm keyframes (`sc-colrank-breathe`, `sc-next-whisper-pulse`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `CultureWhispersCard.tsx` (whisper picker), sim line tables, `theme.css`, `board-living.css`, `column-marks.css`, `player-reply-formation.css`, `living-realm-ui.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/ColumnRanksWhisperHint.test.tsx`):** 4 tests passing (`npm test` -> sim **604**, app **1653**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-26 — app / living presentation for joined-war column marks

- **Board column marks (`packages/app/src/hud/BoardColumnMarks.tsx`, `BoardLiving.tsx`):**
  - Exported `COLUMN_MARK_LABEL`, `BoardColumnMarkView`, pure `resolveBoardColumnMark(state)` (guards `!state?.board?.provinces || !state.flags || !state.meta || !Array.isArray(state.wars)`), and `<BoardColumnMarks>` (`pointer-events: none !important;`).
  - Reads `columnMarkSnapshot(state)` from `@second-crown/sim` (`d536270`, exact match — zero mismatch): anchors opposing culture-kit column standards + 3 trailing rank dots at 28% / 72% along the road line between holds (`ourDir` / `theirDir` flip on `"falling-back"`), and places the compact phase pill at `(midX, midY + 27)` cleanly below `BoardJoinedFormations` (`midY + 14`) so both layers stay distinct and non-overlapping. Zero blood or gore.
- **Dedicated CSS (`packages/app/src/hud/column-marks.css`):** Imported from `BoardColumnMarks.tsx`. Dusk/Night/Parchment chrome tokens, strict `pointer-events: none !important;`, calm keyframes (`sc-colmark-road-flow`, `sc-colmark-stride`, `sc-colmark-pulse`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to the whisper picker (`CultureWhispersCard.tsx`, `WorldTab.tsx`), `theme.css`, `board-living.css`, `player-reply-formation.css`, `war-join-imagery.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/ColumnMarks.test.tsx`):** 3 tests passing (`npm test` -> sim **585**, app **1649**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-26 — sim / Living Realm slice 9 (whisper variety, column ranks, next-whisper hint)

- **Why lines repeated:** the old line index was `(round + salt) % n`. A sender only speaks on rounds `≡ c (mod npcs)`, so per turn the index moves by `npcs mod n`. With n = 4: 4 NPCs → 0 (one line forever), 6 NPCs → 2 (two lines), 5 NPCs → 1 (cycles). A world has 4–6 NPCs by seed (`rival` + `extraArchetypes`: 3–5), so worlds with 4 or 6 NPCs repeated. The progression seed (5 NPCs) already cycled, which is why the playtest count is 16 either way.
- **Fix (`whisperLineIndex(turn, salt, n)`, flag `living_whisper_variety`, on by default):** `(turn + floor(turn / n) + salt) % n`, with `turn = floor((round + seed) / npcs)` from slice 8. Blocks of n turns hold each line once. The `floor(turn / n)` shift moves each block on by one line, so with listeners = n (5 realms, fair rotation) a given listener hears a new line from that sender each cycle (tested: `fourNpcs`). With n >= 3 no two successive whispers from one sender repeat. At a block edge a line can come back two whispers later (e.g. 2,3 | 1,2); "all lines before a repeat" holds inside aligned blocks.
- **Counter:** `markWhisperLine` sets bit `WHISPER_LINE_BASE[table] + lineIdx` in `living_whisper_lines_seen` (5 tables × 4 lines = 20 bits; bits ≥ 30 are skipped). Player-only cultures fall back to the `western` table, same as `whisperLinesFor`. `distinctWhisperLines(state)` is the popcount. `LivingReport.distinctWhisperLines`; `livingText` now 11 lines.
- **Ranks:** `COLUMN_RANKS: Record<ColumnMarkId, 1|2|3>`, `columnRanks(phase)`, field `ColumnMark.ranks`. Pure. `ColumnRanks` type exported.
- **Hint:** `nextWhisperHint(state)` reads only `state.meta.tick`, the `whispers` switch and whether any NPC realm exists. `nextPulseTick = (floor(tick / 300) + 1) * 300` (strictly after, so at tick 20400 it says 20700). It does not depend on `living_whisper_variety`. It does not predict whether that pulse's sender has a listener.
- **Left alone:** sender choice, listener choice / fair rotation, `WHISPER_PULSES`, whisper count, NPC reply line picker (`tickCorrespondence`), `replyToWhisper`, `formationSnapshot`, phase timing, combat formulas, balance tables, app/render/server. No app UI reads `ranks` or `nextWhisperHint` yet.

## 2026-11-26 — sim / Living Realm slice 8 (fair whisper rotation, column-mark snapshot)

- **Why some seeds never whispered to the player:** sender = `npcs[(round + seed) % npcs]`, so a given sender only speaks on rounds `≡ c (mod npcs)`. The old listener index was `(round + salt) % L`. With 6 realms, `L = npcs = 5`, so that index never changed for a given sender: each NPC always whispered to the same realm. If none of them landed on the player, the player heard nothing, ever (16 of seeds 1–40).
- **Fix (`maybeWhisper`, flag `living_whisper_fair`, on by default):** `turn = floor((round + seed) / npcs.length)` (how many times this sender has spoken; +1 per turn), listener index `(turn + salt) % listeners.length`. Over `L` turns a sender visits every listener once. Sender choice, the `pulse % WHISPER_PULSES` gate, the war filter and the peace-lock filter are unchanged, so whisper count and timing match the old picker tick for tick (tested). If a war or lock shrinks the listener list the rotation keeps going over what is left; the blocked realm is skipped, not forced.
- **Counter:** `living_whispers_to_player` bumped when `to.id === "player"`; `livingCounts().playerWhispers`; `LivingReport.playerWhispers`; `livingText` line `Player whispers received: N.` (now 10 lines).
- **Column marks:** content `COLUMN_MARK_IDS = ["column", "skirmish-line", "clash-line", "falling-back"]`, type `ColumnMarkId`. `columnMarkSnapshot(state, atTick = tick)` → `ColumnMark | null`; takes `formationSnapshot` rows, picks the newest `active` one, else the newest (aftermath) one, and maps phase → column id. Pure read. Exported from `index.ts` with `ColumnMark`, `COLUMN_MARK_IDS`, `ColumnMarkId`.
- **Left alone:** whisper line choice (`lines[(round + salt) % lines.length]`, which also repeats per sender), cadence, `WHISPER_PULSES`, NPC replies and `tickCorrespondence`, `replyToWhisper`, `formationSnapshot`, `joinSide`, `settleNpcWars`, combat formulas, phase timing, balance tables, app/render/server. No app UI reads `columnMarkSnapshot` yet.
- **Note:** the slice 7 seed note (some seeds never pick the player) is fixed by this slice.

## 2026-11-26 — app / living presentation for player whisper replies & joined-war formations

- **Culture whisper replies (`packages/app/src/hud/CultureWhispersCard.tsx`, `tabs/WorldTab.tsx`):**
  - Exported `listReplyableWhispers(state)` (partial-state guard) and wired optional `act` prop from `WorldTab.tsx` into `<CultureWhispersCard state={state} act={act} />`.
  - **Shape mismatch note:** `@second-crown/sim` (`42a7826`) shipped `replyableWhispers` + `PLAYER_REPLIES` rather than `playerReplyLines`, alongside `replyToWhisper` (exact match). Renders 4 fixed culture-line buttons inside `.sc-reply-picker` for each answerable whisper (zero `<input>`/`<textarea>`); once answered, `replyToWhisper` appends `{ kind: "reply", fromRealmId: "player", replyTo }`, which `pairCultureCorrespondence` pairs automatically.
- **Joined-war board formations (`packages/app/src/hud/BoardJoinedFormations.tsx`, `BoardLiving.tsx`):**
  - Exported `FORMATION_LABEL`, `BoardJoinedFormationPoint`, pure `listBoardJoinedFormations(state)` (reads `formationSnapshot`, exact match, capped at 3), and `<BoardJoinedFormations>` (`pointer-events: none !important;`). Renders left/right culture standards (player + companion ally vs foe), geometric phase emblems, and formation pills (`Muster`, `Skirmish`, `Clash`, `Fall-back`) with zero blood or gore.
- **Dedicated CSS (`packages/app/src/hud/player-reply-formation.css`):** Imported from `CultureWhispersCard.tsx` and `BoardJoinedFormations.tsx`. Dusk/Night/Parchment tokens, strict `pointer-events: none !important;`, calm keyframes (`sc-formation-sway`, `sc-formation-breathe`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `living-realm-ui.css`, `correspondence-outcome.css`, `board-living.css`, `war-join-imagery.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/PlayerReplyFormation.test.tsx`):** 4 tests passing (`npm test` -> sim **570**, app **1646**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-26 — sim / Living Realm slice 7 (player reply, joined-war formation snapshot)

- **Content (`content/livingRealm.ts`):** `PLAYER_REPLIES` (4 lines per culture for all 10 cultures in `CULTURES`, `{to}` = the whisperer), `playerReplyLinesFor(culture)` (western fallback), `FORMATION_IDS = ["muster", "skirmish", "clash", "fall-back"]`, type `FormationId`.
- **Reply flow:** `replyableWhispers(state, atTick = tick)` walks `getCultureNews` newest → oldest and keeps `kind: "whisper"`, `toRealmId: "player"`, with an `id` (so only whispers sent while `living_correspondence` was on), no existing `kind: "reply"` with that `replyTo`, sender still in `state.realms`, not `atWarWith` and not `peaceLockedAt` the player. Returns `{ whisper, lines }`, lines = player culture table with `{to}` filled. `replyToWhisper(state, whisperId, lineIndex)` uses that list, checks `Number.isInteger(lineIndex)` and range, pushes `{ tick: meta.tick, kind: "reply", fromRealmId: "player", toRealmId: whisperer, text: "<You> answers <Them>: \"<line>\"", replyTo: whisperId }`, bumps `living_player_replies`, logs `{ type: "reply_whisper", payload: { whisperId, lineIndex } }`. "Answered" is read from the news list itself: a whisper always drops off the capped list before its reply, so no extra flag is needed. Whispers to the player still queue no NPC-side reply (`maybeWhisper` unchanged).
- **Formation:** `formationSnapshot(state, atTick = tick)` → `JoinedWarFormation[]` for every war with `joinedWarId` whose `warPhase` is non-null (active, or aftermath window). `ours.realmIds = ["player", allyRealmId]`, `theirs.realmIds = [foe]`, `phase` from `warPhase`, `formation` from a fixed map, `active = status === "active"`. Pure read.
- **Switch:** `LIVING_SWITCH_FLAGS.playerReply` = `living_player_reply`.
- **Seed note:** the existing whisper picker never chooses the player as listener on some seeds (e.g. 20261126 with 7 realms). Slice 7 tests use seed 1. Not changed here; worth a look if playtesters never see a whisper.
- **Left alone:** whisper cadence and lines, NPC reply timing and table, `tickCorrespondence`, `joinSide`, `settleNpcWars`, combat formulas, phase timing, balance tables, app/render/server. No app UI for the reply list or formation yet.

## 2026-11-26 — app / living presentation for culture correspondence & joined-war outcomes

- **Culture correspondence (`packages/app/src/hud/CultureWhispersCard.tsx`):**
  - Exported `CultureCorrespondenceEntry` and `pairCultureCorrespondence(state)` (with defensive `!state?.flags || !Array.isArray(state.realms)` guard in `summarizeCultureNews`).
  - **Shape mismatch note:** `@second-crown/sim` (`b30ddb0`) shipped `id` / `replyTo` / `kind: "reply"` inside `getCultureNews(state)` instead of a separate `correspondenceNews` helper. `pairCultureCorrespondence` matches replies to whispers by `replyTo === whisper.id`, ordering paired threads and standalone items newest-first while preserving zero `<input>`/`<textarea>` controls.
- **Joined-war outcomes (`packages/app/src/hud/JoinedWarOutcomeCue.tsx`, `WarRoom.tsx`, `BoardLiving.tsx`):**
  - Exported `JoinedOutcomeTone`, `BoardJoinedOutcomePoint`, pure `resolveJoinedOutcomeTone`, `resolveLatestJoinedOutcome`, `resolveBoardJoinedOutcome`, `<JoinedWarOutcomeLine>`, and `<BoardJoinedOutcome>` (`pointer-events: none !important;`).
  - Reads `latestJoinedWarOutcome(state)` (`joinedWarOutcome`, exact match): War tab displays the calm tone badge (`Field held` / `Foe held` / `White peace`), `outcome.line`, and settled NPC war summary; `BoardLiving` displays a short-lived (`WAR_AFTERMATH_TICKS`) aftermath pill near the player hold.
- **Dedicated CSS (`packages/app/src/hud/correspondence-outcome.css`):** Imported from `CultureWhispersCard.tsx` and `JoinedWarOutcomeCue.tsx`. Dusk/Night/Parchment tokens, strict `pointer-events: none !important;` on map overlays and badges, calm keyframes (`sc-corr-pip-breathe`, `sc-outcome-breathe`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `living-realm-ui.css`, `board-living.css`, `living-realm-board.css`, `war-join-imagery.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/CorrespondenceOutcome.test.tsx`):** 4 tests passing (`npm test` -> sim **557**, app **1642**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-26 — sim / Living Realm slice 6 (culture correspondence, joined-war outcome)

- **Content (`content/livingRealm.ts`):** `WHISPER_REPLY_DELAY_TICKS` 300, `WHISPER_REPLY_QUEUE_CAP` 8, `WHISPER_REPLIES` (4 lines per NPC culture, `{to}` = realm being answered), `whisperReplyLinesFor(culture)` (falls back to western like `whisperLinesFor`).
- **News shape:** `CultureNews { tick, kind: "whisper" | "caravan" | "reply", fromRealmId, toRealmId, text, id?, replyTo? }`. `id` = `wh_<tick>` on whispers while the switch is on (one whisper per pulse at most, so unique). Reply: `{ tick: dueTick, kind: "reply", fromRealmId: <listener>, toRealmId: <whisperer>, text: "<From> answers <To>: \"<line>\"", replyTo: <whisper id> }`. Same `flags.culture_news` list (cap 8), so the Ledger and `CultureWhispersCard` pick replies up with no new reader.
- **Flow:** `maybeWhisper` (switch on) adds a `PendingReply { whisperId, fromRealmId, toRealmId, dueTick: tick + 300 }` to `flags.culture_pending_replies` unless the listener is the player; `queueReply` refuses a duplicate `whisperId`. `tickCorrespondence(state, atTick)` runs in `rival.ts tickAi` **before** `maybeWhisper`, removes every entry with `dueTick <= atTick`, and sends it only if both realms exist, are not `atWarWith`, and not `peaceLockedAt(atTick)`. Whispers land on multiples of 100, so due ticks are exact pulses and the delay is exactly 300 in replay and in analytic advance. Line index = `(floor(dueTick / 100) + realmSalt(replier)) % 4`.
- **Peace-lock filter on whispers:** with the switch on, `maybeWhisper` listeners also exclude `peaceLockedAt(from, r, atTick)`. Switch off: old war-only filter, no ids, no queue writes, no reply sends (a queue left from before stays and waits). Harness whisper counts did not move (no peace-locked listener was ever picked in either run).
- **Joined-war outcome:** `joinedWarOutcome(state, warId)` → null unless the war exists, has `joinedWarId`, and is not active. Shape `JoinedWarOutcome { warId, joinedWarId, allyRealmId, allyName, foeRealmId, foeName, endedTick, status, heldField: "player" | "foe" | null, heldFieldRealmId, heldFieldName, whitePeace, npcWar: { status, heldFieldRealmId, whitePeace } | null, playerTookNpcLossShare: false, line }`. `npcWar` is null while the joined NPC war is still active. `line` ends with `Your side took no NPC war losses.` `latestJoinedWarOutcome(state)` = last finished joined war in `state.wars`. Pure reads.
- **Switch:** `LIVING_SWITCH_FLAGS.correspondence` = `living_correspondence`. Counter `flags.living_replies_sent`, `livingCounts().replies`, `LivingReport.replies`; `livingText` is nine lines.
- **App:** `CultureWhispersCard` tag text `Reply` for `kind: "reply"`; `.is-reply` shares the whisper tag colors in `living-realm-ui.css`. Nothing else in app/render/server.
- **Left alone:** whisper cadence and lines, caravans, `settleNpcWars`, `joinSide`, `tryResolveWar` / `tryWhitePeace`, NPC war loss numbers, phase timing, balance tables. No player reply action (no chat input; the brief asked for fixed lines only). No app view of the outcome yet.

## 2026-11-26 — app / living presentation for joining NPC wars & board war imagery

- **War tab Join card (`packages/app/src/hud/JoinableWarsCard.tsx`, `WarRoom.tsx`):**
  - Exported pure `listJoinableNpcWars(state)` (guards `!state?.wars || !state.flags || !state.meta`) and `<JoinableWarsCard state={state} act={act} />`.
  - **List/action mismatch note:** `@second-crown/sim` (`5d54edb`) shipped `joinableWars` + `joinSide` rather than `listJoinableWars`. The card renders one `Join <Realm>` button per side calling `joinSide(st, warId, side)` directly, disabling peace-locked sides and hiding automatically once the player enters a war.
- **Board war imagery (`packages/app/src/hud/BoardWarImagery.tsx`, `BoardLiving.tsx`):**
  - Exported `BoardWarImageryItem`, pure `listBoardWarImagery(state)` (prioritizes player wars, caps at 4, respects fog for NPC-vs-NPC wars, trims banners at 48 chars), and `<BoardWarImagery>` (`pointer-events: none !important;`). Reads `warImagerySnapshot(state)` (exact name match) to draw opposing culture-kit swallowtail standards (`LIVING_CULTURE_PALETTE` via `resolveLivingCultureKit`), a companion ally pennant on joined wars (`allyRealmId`), a phase-styled front curve + crest (`columns`, `skirmish`, `clash`, `aftermath`), and a calm banner pill (zero blood/gore).
- **Dedicated CSS (`packages/app/src/hud/war-join-imagery.css`):** Imported from `JoinableWarsCard.tsx` and `BoardWarImagery.tsx`. Dusk/Night/Parchment chrome tokens, strict `pointer-events: none !important;` on `.sc-war-imagery-layer` and badges, calm keyframes (`sc-war-img-front-flow`, `sc-war-img-clash-pulse`, `sc-war-img-banner-flutter`, `sc-war-img-crest-breathe`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `board-living.css`, `living-realm-board.css`, `living-realm-ui.css`, `npc-board-clash.css`, `flag-contest-accents.css`, `war-loss-raid-accents.css`, `war-phase.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/WarJoinImagery.test.tsx`):** 4 tests passing (`npm test` -> sim **542**, app **1638**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-26 — sim / Living Realm slice 5 (join an NPC war, war imagery)

- **Model:** joining does not turn the NPC war into a three-party war. `joinSide(state, warId, side)` pushes a separate player war `{ id: war_join_<tick>_<n>, attackerRealmId: "player", defenderRealmId: foe, startedTick: npcWar.startedTick, joinedWarId, allyRealmId }`. Copying `startedTick` keeps the player in the same phase as the war they joined, so `warPhase`, `warFightOpen`, `tryResolveWar`, `tryWhitePeace`, `activeWarFor` and `tickWarPhases` work unchanged. `isNpcWar` is false for it, so `settleNpcWars` / `applyNpcWarLoss` never touch it (and `applyNpcWarLoss` refuses `"player"` anyway). The NPC war keeps running and settles at its clash between the two NPCs; the player's war goes on against the foe until Fight or White Peace.
- **Gate:** `joinSide` only accepts what `joinableWars(state)` lists with that side open: switch on, `!atWar(state, "player")`, war active and NPC-vs-NPC, and no peace lock between the player and the foe at `meta.tick`. Calls `noteWar` (same achievement as declaring), logs `join_npc_war { warId, side }`, bumps `flags.living_npc_wars_joined`, writes one world-log `declare` line.
- **Shared:** optional `WarInstance.joinedWarId?: string | null`, `allyRealmId?: string | null`. No save migration needed.
- **Imagery:** `warImagerySnapshot(state, atTick?)` walks `state.wars` in order, skips `w_siege_*`, keeps any war `warPhase` returns non-null for (active, or finished within `WAR_AFTERMATH_TICKS`). Entry `{ warId, attackerRealmId, attackerName, defenderRealmId, defenderName, phase, active, player, allyRealmId, banner }`. Banner verbs agree with one side or two (`A musters` / `Player and Ally muster`). Aftermath banner by status: attacker won `D falls back from A`, defender won `A falls back from D`, white peace `A and D fall back`.
- **Switch:** `LIVING_SWITCH_FLAGS.joinNpcWar` = `living_join_npc_war`.
- **Harness:** `LivingReport.joinableWarsSeen` = distinct war ids in `joinableWars` across bot looks; the bot never joins. `livingText` is now eight lines. Both runs read 0 because the bot sits in its rival war the whole run.
- **Left alone:** combat (`resolveBattle`, `realmPower`), phase timing (`WAR_PHASE_START`, aftermath length), NPC war settle rule and loss numbers, `maybeNpcWar` / `maybeDeclare`, raid and flag-contest code, balance tables, app/render/server.

## 2026-11-26 — app / living presentation for NPC war losses & home-raid timing

- **Board overlay (`packages/app/src/hud/BoardWarLossAndRaid.tsx`, `BoardLiving.tsx`):**
  - Exported `BoardNpcWarLossPoint`, `BoardHomeRaidAccent`, pure `listBoardNpcWarLosses(state)`, `resolveBoardHomeRaid(state)`, and `<BoardWarLossAndRaid>` (`pointer-events: none !important;`). Guards `!state?.board?.provinces || !state.flags || !state.meta` for partial test fixtures.
  - **Snapshot mismatch note:** `@second-crown/sim` (`ec46828`) shipped `homeRaidSnapshot` directly (exact match), whereas NPC war losses shipped as `getNpcWarLosses` / `npcWarLossesFor` + `isNpcWar` + `warPhase` (`aftermath`, `WAR_AFTERMATH_TICKS = 300`) instead of `npcWarLossSnapshot`. `listBoardNpcWarLosses` joins settled NPC wars in `aftermath` with `npcWarLossesFor`, respects fog on the losing hold, caps at 6, and uses dipped culture-kit standards + ash hush (zero blood/gore). `resolveBoardHomeRaid` checks `snap.inbound` before `snap.cooldownUntil` (since `homeRaidSnapshot` exposes `cooldownUntil` while a column is still inbound).
- **Dedicated CSS (`packages/app/src/hud/war-loss-raid-accents.css`):** Imported from `BoardWarLossAndRaid.tsx`. Dusk/Night/Parchment chrome tokens, strict `pointer-events: none !important;`, calm keyframes (`sc-war-loss-hush-breathe`, `sc-war-loss-standard-sway`, `sc-war-loss-wisp-drift`, `sc-home-raid-ring-pulse`, `sc-home-raid-trail-flow`, `sc-home-raid-chevron-stride`, `sc-home-raid-rest-breathe`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `board-living.css`, `living-realm-board.css`, `npc-board-clash.css`, `flag-contest-accents.css`, `raid-payoff-accents.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/WarLossRaidAccents.test.tsx`):** 4 tests passing (`npm test` -> sim **521**, app **1634**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-26 — sim / Living Realm slice 4 (NPC war losses, home-raid timing)

- **Constants (`content/livingRealm.ts`):** `NPC_WAR_LOSS_SHARE` 0.12, `NPC_WAR_LOSS_CAP` 20, `HOME_RAID_IN_FLIGHT` 1, `HOME_RAID_COOLDOWN_TICKS` 750. Exported from `@second-crown/sim`.
- **NPC war losses (`systems/livingRealm.ts`):** `applyNpcWarLoss(state, realmId)` walks `state.units` in order, takes `floor(count * share)` per stack until the cap is spent, refuses `"player"`. Committed force = the realm's whole standing force (NPC wars have no columns; NPC raid columns do not remove units either). Floor of 12% never empties a stack, so repeated wars bottom out at 8 per stack. `settleNpcWars` sets the status first (power read before loss), then applies losses and writes `{ warId, attacker, defender }` to `flags.npc_war_losses_json` (last 8) and bumps `flags.living_npc_war_losses_units`. `aftermathLine` appends the count for NPC wars with a record, so the world-log line and the aftermath phase line match.
- **Home-raid timing (`systems/raidMarch.ts`):** `homeRaidAllowed` = first tick + launch gap (unchanged), then while `living_home_raid_cooldown` is on: no more than `HOME_RAID_IN_FLIGHT` columns in `incomingOnHome`, and `atTick >= cooldownUntil` from `flags.home_raid_json` (`HomeRaidRecord { realmId, marchId, sinceTick, untilTick, cooldownUntil }`). `untilTick = max(atTick, march.arrivesTick)` because `tryNpcMarch` stamps arrival from `state.meta.tick`, which can lag the pulse tick during analytic advance. `maybeNpcRaid` bumps `living_home_raids` either way. The old `incomingOnHome` guard in `maybeNpcRaid` stays, so with the switch off raids launch exactly as before (only the `living_home_raids` counter is new).
- **Snapshot:** `homeRaidSnapshot(state, atTick?)` → `{ tick, limited, inbound: { realmId, realmName, marchId, sinceTick, arrivesTick } | null, cooldownUntil: number | null, nextStartTick: number | null }`. `nextStartTick` = first multiple of `NPC_RAID_PULSE_TICKS` at or after max(now, `HOME_RAID_FIRST_TICK`, last launch + `homeRaidGap`, cooldown end); null while a raid is inbound. Timing only: a shield, weak rival or busy column can still delay it.
- **Switches:** `LIVING_SWITCH_FLAGS.npcWarLosses` = `living_npc_war_losses`, `.homeRaidCooldown` = `living_home_raid_cooldown`.
- **Harness:** `LivingReport.npcWarLosses`, `.homeRaids`; `livingText` is now seven lines.
- **Left alone:** player wars, `resolveBattle`, raid strength (`homeRaidPerType`), siege resolution, `homeRaidGap` / breach respite, flag contests, app/render/server.

## 2026-11-26 — app / living presentation for contested flags

- **Board overlay (`packages/app/src/hud/BoardFlagContests.tsx`, `BoardLiving.tsx`):**
  - Exported `BoardFlagContestPoint`, `BoardFlagCooldownPoint`, pure `listBoardFlagContests(state)`, `listBoardFlagCooldowns(state)`, and `<BoardFlagContests>` (`pointer-events: none !important;`). Guards `!state?.board?.provinces || !state.flags || !state.meta` for partial test fixtures, reads `flagContestSnapshot(state)` from `@second-crown/sim` (`145c9e5`, exact name match — zero mismatch), deduplicates and caps at 8 entries per list, respects fog (`occupantRealmId === "player"`, home province, or `isProvinceSeen`), and prioritizes active contests over cooldown rings on the same province.
  - Reuses `LIVING_CULTURE_PALETTE` and `resolveLivingCultureKit` from `BoardLivingRealm.tsx` so contesting columns tint the pulsing ring, diamond aura, and wax seal chevron in the challenging culture's palette (including Iron March `"iron"` for `rival`).
- **Dedicated CSS (`packages/app/src/hud/flag-contest-accents.css`):** Imported from `BoardFlagContests.tsx`. Dusk/Night/Parchment chrome tokens, strict `pointer-events: none !important;` on all layer elements, calm keyframes (`sc-flag-contest-aura-breathe`, `sc-flag-contest-ring-pulse`, `sc-flag-contest-seal-bob`, `sc-flag-cooldown-breathe`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `board-living.css`, `living-realm-board.css`, `npc-board-clash.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/FlagContestAccents.test.tsx`):** 4 tests passing (`npm test` -> sim **502**, app **1630**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-26 — sim / Living Realm slice 3 (flag contest timing, clash lock in the action)

- **Rule (`systems/flagContest.ts`):** a contest = an NPC column queued by `maybeContestFlag` at a player flag. It runs from launch to the column's `arrivesTick`; the flag then rests until `arrivesTick + FLAG_CONTEST_COOLDOWN_TICKS` (500). NPCs act only on the 100-tick pulse, so the next contest lands on the first pulse at or after that tick. `flagContestOpen(state, provinceId, atTick)` checks live columns (< `FLAG_CONTEST_COLUMNS_PER_FLAG`, march still in `marches_json`) and the cooldown. If a column dies early (e.g. `pairClashingMarches`), the cooldown still runs from its planned arrival tick, so a flag never gets less rest.
- **Targeting:** `maybeContestFlag` now picks the first player flag (same filter: not home, not a hold) that is `flagContestOpen`; with the switch off every flag is open, so it is the old first-flag pick. `noteFlagContest` records `{ provinceId, realmId, marchId, sinceTick, untilTick, cooldownUntil }` in `flags.flag_contests_json` (removed when empty) and bumps `living_flag_contests` (in both modes). `tickAi` calls `pruneFlagContests` before the realm loop. Order in `tickAi` unchanged.
- **Snapshot:** `FlagContestSnapshot = { tick, limited, contests: FlagContestEntry[], cooldowns: FlagCooldownEntry[] }`; `FlagContestEntry = { provinceId, x, y, realmId, realmName, marchId, sinceTick, untilTick }`; `FlagCooldownEntry = { provinceId, x, y, untilTick }` (untilTick = cooldown end). Pure read; `limited` is false when `living_flag_cooldown` is off (no records then).
- **Clash lock:** `warFightOpen(state, war, atTick?)` (active, and `w_siege_*` or phase `clash`); `playerFightOpen` now delegates to it. `tryResolveWar` returns `{ ok: false }` before the clash for both the default war and an explicit `warId`. `actions/war.ts` ↔ `systems/livingRealm.ts` is now a two-way import; both sides only use hoisted functions at call time. `battleHarness.ts` calls `resolveBattle` directly and is unaffected.
- **Switches:** `LIVING_SWITCH_FLAGS.flagCooldown = "living_flag_cooldown"`. `livingCounts` adds `flagContests`. New exports from `index.ts`: `flagContestSnapshot`, `flagContestOpen`, `getFlagContests`, `warFightOpen`, the snapshot types, `FLAG_CONTEST_COLUMNS_PER_FLAG`, `FLAG_CONTEST_COOLDOWN_TICKS`.
- **Left alone:** contest outcome (`resolveOutpostAssault`), NPC column size (flat 6/type), `maybeNpcRaid`, `maybeDeclare`, every balance table, the app (no UI reads `flagContestSnapshot` yet; War tab already locked Fight), `npcBoardSnapshot` (still excludes contest columns).
- **Verification:** sim **502**, app **1626**, server **158** (1 skipped on Windows), app build clean. `npm run playtest` changed only the living intro line and the new `Flag contests fired: 0.` lines.

## 2026-11-26 — app / living presentation for NPC board activity & clash lock

- **Board overlay (`packages/app/src/hud/BoardNpcActivity.tsx`, `BoardLiving.tsx`):**
  - Exported `BoardNpcAccentPoint`, pure `listBoardNpcAccents(state)` (guards `!state?.board?.provinces || !state.flags` for partial mock fixtures, reads `npcBoardSnapshot`, respects fog per province/origin, interpolates transit positions along quadratic paths by `(tick - sinceTick) / (untilTick - sinceTick)`, caps at 6 per kind), and `<BoardNpcActivity>` (`pointer-events: none !important;`). Reuses `LIVING_CULTURE_PALETTE` and `resolveLivingCultureKit` from `BoardLivingRealm.tsx`.
  - All snapshot kinds (`claim`, `camp`, `gather`) and phases (`planted`, `marching`, `outbound`, `gathering`, `returning`) match `packages/sim/src/systems/npcBoard.ts` directly (zero mismatch).
- **War tab clash lock (`packages/app/src/WarRoom.tsx`):**
  - Fight button keeps literal `>Fight</button>` text and existing `data-fight-locked="true"` (preserving `FightLock.test.tsx`), gaining `.sc-fight-btn.is-clash-locked` while waiting; `.sc-fight-locked` gains `data-clash-lock="waiting"` and a phrasing-only `<span class="sc-fight-lock-badge">` ahead of `FIGHT_LOCKED_LINE`. White Peace remains untouched.
- **Dedicated CSS (`packages/app/src/hud/npc-board-clash.css`):** Imported from `BoardNpcActivity.tsx` and `WarRoom.tsx`. Dusk/Night/Parchment tokens, `pointer-events: none !important;`, keyframes (`sc-npc-claim-breathe`, `sc-npc-claim-gleam`, `sc-npc-camp-drift`, `sc-npc-camp-stride`, `sc-npc-gather-flow`, `sc-npc-gather-bob`, `sc-fight-lock-breathe`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `board-living.css`, `war-phase.css`, `living-realm-board.css`, `living-realm-ui.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/NpcBoardClash.test.tsx`):** 4 tests passing (`npm test` -> sim **490**, app **1626**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-26 — sim + app / Living Realm slice 2 (NPC board activity, clash lock)

- **Gate fix:** `tickAi` runs at multiples of 100, so the old `(atTick + salt) % 200|300` gates needed `salt % 100 === 0`. New `onCadence`: `pulse > 0 && (pulse + realmSalt) % N === 0`, N = `NPC_CLAIM_PULSES` 4 / `NPC_CAMP_PULSES` 6 / `NPC_GATHER_PULSES` 3 (`content/livingRealm.ts`, not a balance table). Order in `tickAi` is unchanged: claim, camp march, contest flag, gather, trade, NPC war, raid, declare.
- **Ring rule (`pickNpcTarget`):** candidates minus player-held tiles, the player's home and the NPC's own hold; sort by Manhattan distance to the NPC hold, then board index. Outside `NPC_PLAYER_RING` (2) first; ring tiles only when `atTick >= NPC_BOARD_GRACE_TICKS` (3000) and nothing outside qualifies.
- **Claims:** node `none` and unoccupied only, so claims never block gathers (`tryGather` refuses NPC-occupied nodes) or camp raids. Cap `NPC_CLAIM_CAP` 3 per realm (`claimMarkers` counts occupied `none` tiles). Recent claims in `flags.npc_claims` (JSON, cap 8). Note: a player march onto an NPC-claimed tile resolves as `resolveHoldStorm` (existing rule for NPC-occupied tiles, left alone).
- **Camp marches:** free camps (node `camp`, unoccupied, no NPC column already headed there). `campMarchBlocksRaid`: skip when `atTick % 500 === 0` or `atTick + travelTicks(dist) >= next 500-multiple`. NPCs have one column (`tryNpcMarch`), and without this a camp march took the slot `maybeNpcRaid` needs. `NPC_RAID_PULSE_TICKS` (500) now replaces the literal in `rival.ts`. `travelTicks` is exported from `march.ts`.
- **Gathering:** `tryNpcGather(state, realmId, destId?)`; with `destId` the crew goes there. New helpers `npcGatherable`, `nodeBusy`, `playerGatherCount`. No world-log line for crews (would flood the 24-line log); claims and camp marches still log.
- **Slot bug:** `enqueueMarch`, `tryMarch`, `tryMarchWith` (`march.ts`) and `scoutColumn.ts` used `listGathers(state).length`, counting NPC crews against the player's slots. Latent until NPC gathers ran; it made the playtest bot's first march fail 80 times. Now `playerGatherCount`.
- **Snapshot shape:** `NpcBoardSnapshot = { tick, activities: NpcBoardActivity[], counts: Record<"claim"|"camp"|"gather", n> }`; `NpcBoardActivity = { id, realmId, realmName, kind: "claim"|"camp"|"gather", phase: "planted"|"marching"|"outbound"|"gathering"|"returning", provinceId, x, y, fromId, sinceTick, untilTick }`. Claim id `claim_<realm>_<province>_<tick>`, shown for `NPC_CLAIM_SHOW_TICKS` (300) while the tile is still theirs; camp entries are NPC `kind: "camp"` marches with no purpose at a tile the player does not hold (contest-flag columns excluded); crews are every non-player gather. Pure read.
- **Clash lock:** `playerFightOpen(state, atTick?)` = active player war whose `warPhase` is `clash` (`w_siege_*` always open). `WarRoom` disables Fight, adds `data-fight-locked`, a title and one `.sc-fight-locked` line (`FIGHT_LOCKED_LINE`), and the click handler re-checks. `tryResolveWar` is **not** gated, so harnesses and tests that fight early are unchanged; gate there too if the owner wants the rule in the sim.
- **Switches:** `LIVING_SWITCH_FLAGS` maps all six keys to flags; `livingCounts` adds `npcClaims`, `npcCampMarches`, `npcGathers` (`flags.living_npc_claims|living_npc_camp_marches|living_npc_gathers`).
- **Left alone:** `maybeContestFlag` (runs every pulse for every NPC with no cadence; all NPCs pile on one player flag), `maybeNpcRaid`, combat and camp formulas, the board render (nothing draws `npcBoardSnapshot` yet).
- **Verification:** sim **490**, app **1622**, server **158** (1 skipped on Windows), app build clean; `npm run playtest` changes only the new "NPC board" lines.

## 2026-11-25 — app / living presentation for Living Realm (slice 1)

- **Board overlay (`packages/app/src/hud/BoardLivingRealm.tsx`, `BoardLiving.tsx`):**
  - Exported `LivingCultureKit` (`western | woodland | desert | steppe | tide | iron`), `LIVING_CULTURE_PALETTE`, `resolveLivingCultureKit` (pure state read with player fallback; avoids mutating `state.flags` when an unseeded id appears), `CARAVAN_BOARD_WINDOW_TICKS = 600`, `listBoardWorkerFigures`, `listBoardUnitTasks`, `listBoardWarPhaseArcs`, `listBoardCaravanTrails`, and `<BoardLivingRealm>`.
  - Guards partial mock `GameState` test fixtures (`!state?.board?.provinces || !state.flags` plus `Array.isArray(state.citizens|units|wars)`) so legacy unit tests in `BoardBanners.test.tsx` stay green.
  - Note on prompt vs shipped names: sim shipped war phase ID `"columns"` (`"Columns forming"`) rather than `"forming"`, so selectors and data attributes target `columns | skirmish | clash | aftermath`. Trade caravans are read from `getCultureNews` (`kind === "caravan"`) and `getWorldLog` (`id === "trade"`) within `CARAVAN_BOARD_WINDOW_TICKS`.
- **UI components (`packages/app/src/hud/CultureWhispersCard.tsx`, `hud/WarPhaseLine.tsx`, `tabs/WorldTab.tsx`):**
  - `CultureWhispersCard` exports `summarizeCultureNews(state)` and a read-only `<ul class="sc-culture-whisper-list">` using `<CultureCrestPip>` (`sc-culture-crest`) with zero `<input>`/`<textarea>`. Mounted inside `Fold#world-culture-whispers` in `WorldTab.tsx`.
  - `WarPhaseLine.tsx` imports `living-realm-ui.css` after `war-phase.css` and adds a non-blocking `.sc-war-phase-pip` while preserving existing `data-phase` attributes and exact text checked by `WarPhaseLine.test.tsx`.
- **Dedicated CSS (`living-realm-board.css` & `living-realm-ui.css`):** Full Dusk/Night/Parchment tokens, `pointer-events: none !important;`, task/phase/caravan animations, and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `board-living.css`, `war-phase.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/LivingRealmAccents.test.tsx`):** 7 tests passing (`npm test` -> sim **468**, app **1619**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — sim + app / Living Realm wave, first slice

- **Why the gate change:** `rival.ts` `maybeTrade` / `maybeNpcWar` used `(atTick + salt) % 300|400 === 0` with `atTick` a multiple of 100, so they needed `salt % 100 === 0`; no realm qualified. New gates use the pulse number: `(pulse + salt) % N === 0`. **Still dead with the same bug (left alone, out of scope):** `maybeClaim` (`% 200`), `maybeCampMarch` (`% 300`), `maybeGather` (`% 200`) in `rival.ts`. Switching those on changes the board for the player; raise as its own item.
- **Files:** `content/livingRealm.ts` (cadences, phase timings, whisper lines; not a balance table), `systems/livingRealm.ts` (switches, culture news, caravans, whispers, NPC wars + settle, war phases), `systems/boardActivity.ts` (worker snapshot, unit activity). `rival.ts` `tickAi` calls `maybeNpcTrade` / `maybeNpcWar` per realm, then `maybeWhisper`, `settleNpcWars`, `tickWarPhases`, then `tickWorldClash`.
- **Determinism:** every pick is `pulse + realmSalt` (+ seed for the whisper speaker). No RNG stream is touched. All helpers take `atTick` because `RivalSystem.advanceAnalytic` runs with `state.meta.tick` still at the batch start. `livingRealm.test.ts` checks two 9000-tick runs serialize identically; settleMatch tests still pass.
- **NPC war end:** timed settle at `WAR_PHASE_START.clash` (300 ticks): `realmPower` compare, `NPC_WAR_WIN_EDGE` 0.1, `peace_<a>_<b>` = end + 900. No `resolveBattle` call, so no casualties, loot, ledger crown or opinion change. A realm is in at most one NPC war; the player can still declare on an NPC that is in one. `maybeDeclare` now skips an NPC already at war (consistent with `tryDeclareWar`).
- **War phases:** pure from `startedTick` / `endedTick` / `status`. `tickWarPhases` logs only player wars and skips `w_siege_*` (instant raid sieges); last logged phase in `flags.war_phase_<warId>`, cleared after the aftermath. Fight is **not** gated by phase (no player-rule change without the owner); gating Fight until `clash` is a one-line follow-up in `tryResolveWar` if wanted.
- **Switches:** `flags.living_npc_trade` / `living_whispers` / `living_npc_wars` set to `false` turn a feature off (`setLivingSwitch`). Counters: `flags.living_trades`, `living_player_trades`, `living_whispers_sent`, `living_npc_wars_started` (`livingCounts`).
- **Worker snapshot shape:** `{ tick, posts: WorkerPost[], counts: Record<tag, n>, posted }`; `WorkerPost = { id, kind: "citizen"|"crew", tag: "farm"|"quarry"|"yard"|"idle"|"march", job, tile, buildingId, provinceId, heads }`. Citizen posted iff `job !== "unassigned" && tile != null` (same rule `labor.ts` pays). Crews: gathering -> node tag (field farm, quarry quarry, woodcut yard), outbound/returning -> march. `unitActivity` = `{ id, doing, label, provinceId, fromId, arrivesTick, force, men, power }[]`.
- **Harness finding:** in the progression run the rival declares on the player at ~10 s (the fresh realm has no troops) and that war stays active for the whole run because the builder bot never fights or makes peace. That is existing `maybeDeclare` behaviour, now visible in the report. 2 h attentive run: ~900 caravans, 252 whispers, 101 NPC wars.
- **Verification:** sim **468**, app **1612**, server **158** (1 skipped on Windows), app build clean.

## 2026-11-25 — app / living shared-realm seal (`ChromeDock` & `AppShell`)

- **Seam choices (no guessed flags):** Uses only the two existing shared-realm signals in `packages/app`:
  1. `sharedRealmId(state)` in `packages/app/src/game/settleOnLoad.ts` (which returns `null` today in Phases 1–3 until shared saves turn on).
  2. `holdWatch` (`subscribeHoldView` / `getHoldViewSnapshot` in `packages/app/src/hud/holdWatch.ts`), published live by `JoinHoldCard` whenever an opt-in shared hold is joined.
- **Component (`packages/app/src/hud/SharedRealmSeal.tsx`):** Exported `SharedRealmScope` (`"shared-realm" | "shared-hold"`), `SharedRealmInfo`, `cleanSharedRealmName`, `resolveSharedRealmInfo`, and phrasing-only `<SharedRealmSeal>` (`<span>` + `<svg>`, `role="status"`). `resolveSharedRealmInfo` checks `sharedRealmIdFn ?? sharedRealmId` first (`"Shared"`), then falls back to `holdView` when `includeHoldWatch !== false` (`"Shared hold"`), returning `null` in solo play.
- **Wiring:** `ChromeDock.tsx` renders `<SharedRealmSeal />` right after the Hold/Board button; `AppShell.tsx` renders `<SharedRealmSeal state={state} includeHoldWatch={false} compact />` inside `.sc-map-controls` right after `<BandToggle band={cameraBand} onToggle={toggleCameraBand} />` (preserving `HoldDensity.test.tsx`'s exact `BandToggle` and `HoldFocusTag` checks).
- **Dedicated CSS (`packages/app/src/hud/shared-realm-seal.css`):** Dusk/Night/Parchment celestial-teal tokens, `pointer-events: none !important;`, keyframes (`sc-shared-seal-breathe`, `sc-shared-pip-pulse`, `sc-shared-ring-breathe`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `hold-density.css`, `board-focus.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/SharedRealmSeal.test.tsx`):** 6 tests passing (`npm test` -> sim **446**, app **1604**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — sim + app / realm-scope audit (Codex medium)

- **Scope of the audit:** saves (load, Import, cloud pull), offline catch-up, marches (send, recall, scout, garrison, gather, sally), home raids and incoming reads, wars, refunds/payments from `state.resources`, and app reads of those. "Realm" here means both the per-realm entities inside one `GameState` (`player`, `rival`, `k_*`) and the shared-realm path (`sharedRealmId`, always `null` for now).
- **Fixed — Import skipped the shared-realm rule.** `importSaveFile` called `applyOfflineProgress` directly. It now calls `settleOnLoad(st)` and uses `settled` only in solo mode, so every catch-up in the app goes through one gate. Locked by `game/realmScope.test.ts` (source check: no `applyOfflineProgress` in `useGameEngine.ts`; Import uses `settleOnLoad`). `settleOnLoad.test.ts` already locks solo vs shared behaviour.
- **Fixed — "first active war" reads.** `state.wars` can hold wars between two NPCs (`rival.ts` `maybeNpcWar`, ids `war_npc_*`), and those never end (nothing resolves them). Every player-facing read used `wars.find(status === "active")`, so an NPC war would have shown as the player's war, been ended by White peace (logged as the player), fought by Fight, flagged both NPCs "At war" with the player, and blocked `tryDeclareWar` forever. Now `activeWarFor(state, realmId = "player")` is the one read. `tryResolveWar(state, rng, warId)` also refuses a `warId` the player is not in. Locked by `systems/realmScope.test.ts` (war block) and `game/realmScope.test.ts` (stance, Mira, and a source check that the six app files no longer use the old pattern).
- **Declare rule change (small):** was "no active war anywhere". Now: the attacker must not be in an active war, and if the defender is `player` the player must not be in one. Player behaviour is unchanged while no NPC wars exist.
- **Latent, not live:** `maybeNpcWar` fires only when `(atTick + salt(realmId)) % 400 === 0`, and `atTick` is always a multiple of 100, so it needs `salt % 100 === 0`. No current realm id qualifies (rival 96, k_silk 27, k_ash 10, k_veil 5, k_glass 10, k_frost 48, k_tide 28, k_ember 92, k_bronze 55). `maybeTrade` has the same gate with `% 300`. So NPC wars and NPC caravans never happen in real play today. **Left alone on purpose:** switching them on is a design/balance call (and NPC wars would also need an end condition). Raise it as its own item.
- **Fixed (latent) — refund/pay guards.** `tryUpgrade`, `tryCancelBuild`, `tryDemolish`, `tryCancelTraining` pay from or refund to `state.resources` (the player's stores) but accepted any id. They now require `realmId === "player"`, matching `tryRecallGather` and `ward.ts`. NPCs own no buildings or queued orders today, so no live path changes. Locked by `systems/realmScope.test.ts` (refund block).
- **Checked, left alone (already scoped):** `activePlayerMarch`/`tryRecallMarch`/`tryRecallScout` filter `realmId === "player"`; `tryRecallGather` checks the realm; `incomingOnHome` and `BoardStatus` show only non-player or seen columns; garrisons and outposts are player-only lists; `trySally` only hits columns on the home province; upkeep and starvation are player-only. Server `/save` is keyed by the signed-in user; `/realm/:id/*` and the hold are unchanged (ADR-011). `tryBuild`/`tryTrain` take a `realmId` but always charge the player's stores; nothing calls them with another realm, so this stays as API shape. `enqueueTraining` starts a job after the last job of any realm (only the player queues today).
- **Verification:** `npm test` → sim 446, app 1598, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean.

## 2026-11-25 — app / living starvation accents (Food cell & Army)

- **Helpers & components (`packages/app/src/hud/StarvationCue.tsx`):** Exported `resolveUnitStarveRisk(starveState, typeId, homeCount)` (checks `starveState !== null && isTrainedUnit(typeId) && homeCount > 0`), phrasing-only `<UnitStarvePip state />` (`At risk` / `Shedding`, `<span>` + 9x9 `<svg>`, safe inside `<button>`), and `<ArmyStarvationNotice state noteOverride />` reading `starvationNote` (`projection.ts`).
- **HUD, Army & Upkeep wiring:**
  - `ResourceHud.tsx`: Imports `starvation-accents.css` after `blocker-deficit.css`, computes `starvationNote(props.state, rates)` (plus optional `starvationOverride`), adds `is-starve-${state}` + `data-starve-cell` + `.sc-starve-cell-glow` + `.sc-starve-tag` on the Food cell only when active (non-starving class strings stay byte-identical for `EconomyPressure`, `IncomeBracket`, and `BlockerDeficitAccents` tests).
  - `UnitCard.tsx`: Accepts optional `starveRisk?: StarvationState | null`, renders `.sc-unit-starve-rim` and `<UnitStarvePip>` inside `<button>` when set, and preserves exact root `<button>` class strings checked by `EliteTierAccent.test.tsx` when unset.
  - `ArmyTab.tsx`, `UpkeepLine.tsx`, `CostProjection.tsx`: Mounts `<ArmyStarvationNotice>` above `.sc-unit-grid` and passes `resolveUnitStarveRisk(starve?.state ?? null, u.id, post?.home ?? 0)` to each `UnitCard`; `UpkeepLine` adds `is-starve-${state}` + `.sc-upkeep-starve-row`; `CostProjection` styles `.sc-starve-note[data-starve]`.
- **Dedicated CSS (`packages/app/src/hud/starvation-accents.css`):** Defines Dusk/Night/Parchment `--sc-starve-imminent-*` and `--sc-starve-active-*` tokens (high-contrast legible amber/coral text against Parchment's dark umber chrome), `pointer-events: none !important;`, keyframes, and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `cost-projection.css`, `blocker-deficit.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/StarvationAccents.test.tsx`):** 8 tests passing (`npm test` -> sim **437**, app **1593**, server **158** (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — sim + app / starvation for trained troops

- **Where:** all in `applyUpkeep` (`systems/upkeep.ts`). Starving = `food < need` for this step, the same branch that already took militia. The counter (`flags.starve_ticks`) is written only when it changes, so fed saves stay byte-identical.
- **Pulses:** `pulsesBetween(before, after)` counts thresholds 600, 1200, 1800... crossed by the counter, so a multi-tick `applyUpkeep` applies each pulse it crosses. In practice it never crosses one: `nextEventTick` stops batches on the pulse tick, which matters because a food-pinned batch restores unit counts in `TickEngine.batch`.
- **Who:** `isTrainedUnit` = not militia, not champion. Rival units are untouched (upkeep is player-only, as before). Troops away in a column are not in `state.units` and neither eat nor starve.
- **Balance knobs:** `STARVE_GRACE_TICKS`, `STARVE_PULSE_TICKS`, `STARVE_SHED_FRACTION` at the top of `upkeep.ts`. With no income, 2%/min halves a trained army in about 35 minutes; any food income stops losses once the army fits it.
- **UI:** `starvationNote(state, rates)` in `projection.ts` (pure, reads `starveTicks`, `ticksToNextStarveLoss`, `foodDeficit`). Rendered by `BottleneckLine` with `data-starve="starving" | "imminent"`, reusing `.sc-food-deficit` styling.
- **Tests lock:** no loss while fed; nothing in the grace minute; 2%/min-1 shed on each pulse; reset and fresh grace when fed; militia/champion rules; tick-by-tick equals `settleTicks`. Verification: `npm test` → sim 437, app 1585, server 158 (+1 skip); app build clean.

## 2026-11-25 — app / living raid pressure & elite payoff accents

- **Raid pressure cue (`packages/app/src/hud/RaidPressureCue.tsx`, `WarRoom.tsx`):** Exported `RaidPressureTone`, `RaidPressureSummary`, `summarizeRaidPressure(state)` (reads `raidStage`, `breachRun`, `homeRaidGap`, `homeRaidPerType`, `incomingOnHome`, `isShielded`, plus `HOME_RAID_FIRST_TICK = 3000`), and `<RaidPressureCue state={state} />`. Mounted on `.sc-home-front` in `WarRoom.tsx`, applying `.is-raid-recovering` (sage green) when `breachRun > 0` and `.is-raid-elevated` (amber) when inbound/due (staying calm early or while shielded).
- **Elite payoff pips (`packages/app/src/hud/ElitePayoffPip.tsx`, `hud/UnitCard.tsx`):** Exported `ElitePayoffKind` (`"shock" | "heavy" | "wall-ignore" | "vanguard"`), `ElitePayoffShape`, `resolveElitePayoffBadge(typeId)`, and phrasing-only `<ElitePayoffPip>` (`Shock` lance, `Heavy` shield, `Wall-breaker` ram, `Elite` star, static when locked). Mounted inside `UnitCard`'s `.sc-unit-payoff` `<span>` without touching `<button>` root classes checked by `EliteTierAccent.test.tsx`.
- **Dedicated CSS (`packages/app/src/hud/raid-payoff-accents.css`):** Imported from `RaidPressureCue.tsx` and `ElitePayoffPip.tsx`. Defines Dusk/Night/Parchment RGB tokens, `pointer-events: none !important;`, keyframes (`sc-raid-elevated-glow`, `sc-raid-recover-glow`, `sc-raid-pip-breathe`, `sc-payoff-pip-breathe`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `unit-payoff.css`, `horizon-elite-tier.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/RaidPayoffAccents.test.tsx`):** 8 tests passing (`npm test` -> sim 431, app 1581, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — sim + app / progression harness, raid pressure, elite payoff

- **Harness bot policy (`harness/progressionHarness.ts`):** fixed priority per turn: cottage when plots are full, then 3 farms, 2 lumber camps, 2 quarries, then militia (16 + 4 per Keep level, batches of 4), then 1 rim wall and 1 watchtower, then the next study in `STUDY_ORDER` if the lectern is free (never blocks), then the Keep, gold mine, barracks, then the Keep upgrade (it builds a cap building first if a cost is over the warehouse), then producer upgrades. A step that cannot be paid returns a `Wait` and stops the walk, so cheaper steps do not eat its stores; those waits are what `bottlenecks` sums. The bot is a measuring stick, not optimal play. Change its policy only on purpose and say so in the changelog, because every reported time moves with it. It reuses `freeSlot`, `allOfType`, `playerUnitCount`, `queuedCount`, now exported from `playtestHarness.ts`. It is not exported from `index.ts`, so test-only code stays out of the app bundle.
- **Raid stages read live state:** `raidStage` reads the finished Keep level and finished walls each time. Losing your only wall drops the stage. `homeRaidAllowed` checks the *current* stage gap and breach run against `home_raid_last` (launch tick), so a Keep upgrade landing mid-gap lengthens the wait right away.
- **The breach run is only written by the home-siege branch** in `march.ts` (after `resolveBattle`). Outpost assaults, flag contests and declared wars do not touch it. A hold with no player units always falls (`resolveRounds` gives the attacker the win at round 0), so recovery for an idle hold comes from the respite, not the fight.
- **`tryNpcMarch(state, realmId, destId, perType = 6)`:** the per-type cap is now a parameter. Only `maybeNpcRaid` passes a non-default value. The 8-militia fallback for a realm with no units is unchanged.
- **Payoff notes:** `roleMatchupNote` reads `matchupRow(role)` (new read-only view of the matchup table), so editing a multiplier updates the card text with no copy change. The clauses in `PAYOFF_EXTRA` (cavalry, knight, siege) are claims about fights; each has a case in `systems/elitePayoff.test.ts`. If a combat change breaks one, fix the clause, not the test threshold. Unit speed does not affect march time (`travelTicks` ignores it), which is why no note says horse are fast.
- **Files:** new `content/raids.ts`, `content/unitPayoff.ts`, `systems/raidPressure.ts`, `harness/progressionHarness.ts` and tests; edited `systems/march.ts`, `systems/raidMarch.ts`, `content/matchup.ts`, `index.ts`, `harness/playtestHarness.ts` (exports only), `harness/playtest.report.ts`; app `hud/UnitCard.tsx`, new `hud/unit-payoff.css`, `hud/UnitPayoff.test.tsx`.

## 2026-11-25 — app / living mixed-unit chips on War Room force cards

- **Helper & component (`packages/app/src/hud/ForceMixChips.tsx`):** Exported `ForceMixPart`, `summarizeForceMix(force)` (filters `count > 0`, reads role via `getUnitType(id)?.role ?? "line"`, maps readable short labels including `spearman -> "spears"`, `siege -> "siege"`, sorts descending by count then id), `isMixedForce(force)`, and `<ForceMixChips force returning compact />` (returns `null` when fewer than 2 unit types exist; displays up to 3 chips + `+N` overflow).
- **Wiring (`packages/app/src/hud/ForceCard.tsx`, `WarRoom.tsx`):** Added optional `force` and `returning` props to `ForceCard` rendering `<ForceMixChips>` right after `<ForceLedger>`; wired into `WarRoom` columns (`compact`, `returning={m.purpose === "garrison_home"}`), Scouts, Gathers (`returning={g.phase === "returning"}`), Garrisons, and watchtower-seen Incoming hosts (`seen ? m.force : undefined`).
- **Dedicated CSS (`packages/app/src/hud/force-mix-chips.css`):** Imported from `ForceMixChips.tsx`. Defines Dusk/Night/Parchment role-pip RGB tokens (`role-line`, `role-ranged`, `role-shock`, `role-skirmish`, `role-siege`, `role-support`), `is-returning` pulse, `pointer-events: none !important;`, and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `force-card.css`, `force-ledger.css`, `force-status.css`, `camp-living.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/ForceMixChips.test.tsx`):** 7 tests passing (`npm test` -> sim 403, app 1570, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — sim / Bandit camp return fixes

- **Contract relied on:** `resolveColumnClash` writes the survivors back to `attacker.force` / `attacker.levy`, and `resolveCampRaid` receives the `march` object itself. So after `resolveCampRaid`, `march.force` is the column that came out: the whole column for a lean-to (no clash), the survivors by type for camp and stockade. A march with no `force` (legacy levy-only) still gets a militia `force` from the clash; for a levy-only lean-to win the `returnLevy(levy)` fallback stays.
- **Win:** the three-way branch (stockade `march.force` / lean-to `sentForce` / camp `returnLevy(levy)`) is now `if (march.force) returnForce(march.force, 1) else returnLevy(levy)`. `sentForce` is gone; `hadSiege` reads `march.force` before the raid.
- **Loss:** dropped `absorbWounded(state, 2)` + `returnLevy(state, levy - 2)`. The 40% return lives only in `resolveCampRaid` (shared with stockade). `absorbWounded` import removed from `march.ts`. `CampTier.lossDead` is still read only as the "Safe" flag (`lossDead === 0`); the number 2 is no longer applied anywhere.
- **Side effect worth knowing:** a sure win (5+ levy) where the clash itself went badly now brings home only clash survivors, not the full levy. At live numbers a 4+ column always beats the 3-militia guard, so this barely shows.
- **Why the pinned test:** at live numbers only a 2-unit column loses to an ordinary camp (probed 400 seeds: 3 militia, 3–4 archers, mixed 4s, siege 4s never lose). For 2 units `levy - 2 = 0` and `floor(≤2 × 0.4) = 0`, so the double count can't be seen. `campReturn.test.ts` `vi.mock`s `resolveCampRaid` with a stand-in that keeps its loss contract (set survivors, `returnForce(…, 0.4)`) to check the march branch directly.
- **Files:** `packages/sim/src/systems/march.ts`, `systems/camp.test.ts`, new `systems/campReturn.test.ts`. Replaces the "Pre-existing quirks left alone (Fair camp)" note in the camp tiers entry below.

## 2026-11-25 — app / living camp tier accents (board & inspect)

- **Board overlay (`packages/app/src/hud/BoardCampTierAccents.tsx`, `BoardLiving.tsx`):** Exported `BoardCampTierPoint` and pure `listBoardCampTierAccents(state)` (skips unseen or flagged camps, reads `campTierId` + `isProvinceSeen`). Mounted `<BoardCampTierAccents>` in `BoardLiving.tsx` right after `<BoardBanners>` (`pointer-events: none !important;`, isometric aura diamond + crest SVG per tier: `lean_to` sage leaf chevron, `camp` warm ochre triangle, `stockade` ember diamond + pulsing ring & spark). Camera & hit-testing untouched.
- **Tier pips & cards (`packages/app/src/hud/CampTierPip.tsx`, `ProvinceInspect.tsx`, `hud/AtlasProvinceCard.tsx`):** Derived `CampTierId` from `campTierId` (`CAMP_TIER_VISUAL`), rendering phrasing-only `<CampTierPip>` (`Safe` leaf, `Fair` tent, `Hard` palisade). `ProvinceInspect` adds `is-camp-tier-${id}`, `data-camp-tier`, compact site badge pip, and tier line badge while keeping exact label copy intact for `campTierLabels.test.tsx`; `AtlasProvinceCard` adds `is-camp-tier-${id}` and compact name-row pip without mutating `atlasProvinceRows`.
- **Dedicated CSS (`packages/app/src/hud/camp-tier-accents.css`):** Imported from `CampTierPip.tsx` and `BoardCampTierAccents.tsx`. Defines Dusk/Night/Parchment `--sc-camp-*-rgb` tokens, breathing keyframes (`sc-camp-safe-breathe`, `sc-camp-fair-breathe`, `sc-camp-hard-breathe`, `sc-camp-hard-ring`, `sc-camp-hard-spark`, `sc-camp-inspect-hard-glow`), `pointer-events: none !important;`, and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `inspect-card.css`, `atlas-living.css`, `board-living.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/CampTierAccents.test.tsx`):** 7 tests passing (`npm test` -> sim 398, app 1563, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — sim + app / camp tiers (lean-to, stockade)

- **Why ranking, not threat:** `campThreat` (5–9 by hash) does not guarantee a low or high camp on every seed. Ranking by Manhattan distance from `homeProvinceId` does, with ~7 camps on a 12x8 board. `campThreat` is kept (still sizes the Fair camp guard).
- **Stability:** the stockade ranking counts camps in `respawn_json` so breaking it does not hand the title to another camp mid-respawn. The lean-to ranking counts only live camps on purpose: flag one and the next nearest becomes the starter. Tier is read in `resolveMarchArrival` **before** the raid resolves, because the raid changes the board.
- **Rivals** raid through the same `resolveCampRaid`, so they also auto-win lean-tos at 3+ and fight the stockade.
- **Pre-existing quirks (Fair camp), fixed 2026-11-25 (see "Bandit camp return fixes" above):** a win returned `levy` as militia, and a loss returned 40% of survivors *and* `levy - 2` militia.
- **Tests that push fake camps** off-board (e.g. `p_9_9`) now become the farthest camp, i.e. the stockade. Pick a real province with `campTierId(...) === "camp"` instead.
- **Files:** `packages/sim/src/content/camps.ts`, `systems/camp.ts`, `systems/engagement.ts` (`resolveCampRaid`, `wallSoak` param), `systems/march.ts` (camp branch), `index.ts` exports; app `ProvinceInspect.tsx` (`CampTierLines`), `ProvinceStatusStack.tsx`, `hud/AtlasProvinceCard.tsx`; tests `camp.test.ts`, `march.test.ts`, `campTierLabels.test.tsx`. `npm test` → sim 398, app 1556, server 158; app build clean.

## 2026-11-25 — app / living return dispatch ("While you were away")

- **Return seal (`packages/app/src/hud/AwayReturnSeal.tsx`):** Exported `AwaySpanTier` (`"brief" | "hours" | "days"`), `resolveAwaySpanTier(elapsed)`, and `<AwayReturnSeal elapsed={s.elapsed} />`. Renders a non-blocking hourglass wax-seal SVG (`sc-away-seal is-*`, `data-away-seal`), concentric ring (`sc-away-seal-ring`), and sand mote (`sc-away-seal-grain`) with `aria-hidden="true"` and `pointer-events: none !important;`.
- **Banner wiring (`packages/app/src/hud/AwaySummary.tsx`):** Imports `away-dispatch.css` after `away-summary.css`, attaches `.sc-away-dispatch.is-span-*` and `data-away-span`, prepends `<span className="sc-away-dispatch-sheen" />`, and mounts `<AwayReturnSeal>` + `.sc-away-dispatch-kicker` ("Dispatch") inside `.sc-away-head` while keeping existing row/dismiss attributes (`data-away-elapsed`, `data-away-row`, `Dismiss away summary`) intact.
- **Dedicated CSS (`packages/app/src/hud/away-dispatch.css`):** Theme tokens for Dusk, Night, and Parchment dark-sepia chrome (`--sc-away-surface-top/bottom`, `--sc-away-accent-rgb`, `--sc-away-seal-rgb`, `--sc-away-ink`, `--sc-away-muted`), keyframes (`sc-away-dispatch-enter`, `sc-away-seal-pulse`, `sc-away-grain-breathe`), `@media (prefers-reduced-motion: reduce)` guards, and zero edits to `theme.css`, `away-summary.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/AwayDispatch.test.tsx`):** 7 tests passing (`npm test` -> sim 390, app 1553, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — app / "While you were away" summary

- **`packages/app/src/game/awaySummary.ts`:** `snapshotForAway(state)` captures tick, stores, player buildings (level, finished), finished studies, player war statuses and player troop total. It must be a pure read: it mirrors `researchDone` without writing `research_<id>=1`. `buildAwaySummary(before, after, settledTicks)` diffs that against the settled state. `awayNextStep(state, rates?)` picks one line. `AWAY_MIN_TICKS = 600`.
- **Data sources:** works = `BuildingInstance.completesAtTick` null-transition or `level` increase (only buildings present in the snapshot); studies = `research_<id>` / `research_<id>_until` flags; events = player troop delta (net, so offline training can mask losses), `state.wars` status changes for player wars, `getWorldLog` entries with `tick > before.tick` and kind in raid/battle/march/loot/declare/levy (declare/levy only if text names "Your Crown"; "keep" skipped since Works covers it). The world log keeps only 24 entries, so a very long absence can lose older lines. Stores = `state.resources` delta and `realmRates(after).cap`. Next = `incomingOnHome`, `foodDeficitText`, `nextResearch` + `projectCost`, `bottlenecks()[0]` + `bottleneckPhrase`.
- **Wiring (`game/useGameEngine.ts`, `AppShell.tsx`):** `offlineNote` string replaced by `awaySummary` + `dismissAway`. Snapshot taken after `loadSaved` and before `settleOnLoad`; shared-realm mode settles 0 ticks so shows nothing. `importSaveFile` uses the same path; `newGame` clears it.
- **Verification:** `game/awaySummary.test.tsx` (7: pure snapshot, real 2h `applyOfflineProgress`, log filter/order/cap, full stores + war + troop loss, deficit next step, banner rows, null render). `npm test` → sim 390, app 1546, server 158; app build clean.

## 2026-11-25 — app / living food deficit & blocker accents

- **Pure helpers (`packages/app/src/hud/blockerAccents.ts`):** Exported `LivingBlockerKind` (`"warehouse" | "prereq" | "busy"`), `LIVING_BLOCKER_META`, `resolveLivingBlockers(reasons)` (explicitly ignores `"stores"` so `SavingPip` remains distinct), `hasWarehouseBlocker(p)`, `projectPartialCost(cost, rates)`, and `isFoodInDeficit(netFood)`.
- **Food deficit cell accents (`hud/ResourceHud.tsx`, `hud/blocker-deficit.css`):** `ResourceHud` accepts optional `foodDeficitOverride`, appends `.is-food-deficit` + `data-food-deficit-cell="true"`, adds a child `<span className="sc-food-deficit-glow">` (no store pseudo-elements, `pointer-events: none !important;`), appends net food rate to the cell tooltip, and mounts `<span className="sc-deficit-pip">` inside `.sc-resource-living-row.is-net`. CSS dims `.sc-income-bracket-glow` under `.is-food-deficit` and dims `.sc-food-deficit-glow` under `.is-empty` so alerts never fight.
- **Blocker pips & row wiring (`hud/BlockerPip.tsx`, `CostProjection.tsx`, `hud/RaiseImproveFold.tsx`, `hud/WorkCard.tsx`):** `<BlockerPip>` renders strictly phrasing SVG + label spans (`warehouse` copper cap, `prereq` violet diamond, `busy` cerulean hourglass). `BlockedLine` displays living pips and quiet row borders; over-cap `StudyProjection`, `RaiseImproveFold` picker chips (compact pip), and `WorkCard` upgrade footers show `warehouse` blockers instead of `<SavingPip>` when storage cap is exceeded.
- **Dedicated CSS (`packages/app/src/hud/blocker-deficit.css`):** Imported after `income-bracket.css` in `ResourceHud.tsx` and from `BlockerPip.tsx`. Supports Dusk/Night/Parchment tokens and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `cost-projection.css`, `economy-pressure.css`, `hud-micro-feedback.css`, `income-bracket.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/BlockerDeficitAccents.test.tsx`):** 13 tests passing (`npm test` -> sim 390, app 1539, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — app / actionable economy cues (Codex P1)

- **Pure helpers (`packages/app/src/projection.ts`):** `ticksToSeconds` (shared `TICKS_PER_SECOND`), `formatSignedRate` (U+2212 minus, 1 dp under 10), `foodDeficit(rates)` / `foodDeficitText(rates)` (net food from `realmRates`, already upkeep-adjusted; null when ≥ 0), `blockReasons(projection, gates)` → ordered `BlockReason[]` (`prereq`, `keep`, `hall`, `busy`, `warehouse`, `stores`). Gates are read by callers from existing sim helpers (`researchPrereqReady`, `researchKeepReady`, `countBuilding`, `researchTicksLeft`); nothing new in `packages/sim`.
- **`CostProjection.tsx`:** `projectionText(p, { finishSeconds? })` — ready-to-pay vs finish tail; a negative food rate reads as a deficit instead of "No food income". `StudyProjection` takes optional `finishSeconds` and `gates` and renders `BlockedLine` (`.sc-blocked-line`, `data-blocked`) above the time line; still renders nothing for paid studies. `BottleneckEntry` gained `rate`, `finishSeconds`, `gates`; `bottleneckPhrase` → `"Keep II: stone short, ready to pay in ~4m · finishes in ~2m after you start"`; entries joined with `"; "`. `BottleneckLine` is now a `<div>` with visible `Deficit` / `Limiter` labels (`.sc-blocked-label`) and shows even with no limiter when food is in deficit.
- **`ResearchBar.tsx`:** passes `finishSeconds={seconds}` and gates (prereq / Keep / hall names / `busyWith`).
- **`hud/ResourceHud.tsx`:** visible `.sc-ledger-tag.is-limiter` (`data-limiter-tag`) with `.sc-visually-hidden` targets; food cell adds `.is-net` row (`data-food-deficit`) when `foodDeficit < 0`. The cell `title` is kept.
- **`AcademyPace.tsx`:** `secs` uses `TICKS_PER_SECOND`. Many other app files still divide by literal `10` (decree/diplo/march timers); left for a separate sweep.
- **CSS:** `cost-projection.css` only.
- **Verification:** `npm test` → sim 390, app 1526; `npm run build -w @second-crown/app` clean.

## 2026-11-25 — app / P1 hygiene: Logistics label & default-folded sample chat

- **Study label fix (`packages/app/src/StudyLine.tsx`):** Exported `STUDY_YIELD_LABELS`; changed `logistics` to `"+15% gold, +50 store, +1 column"`. `StudyLine.test.tsx` (2 tests) verifies live yield/storage/discount deltas against `computeIncomePerSecond`, `storageCap`, `trainCostMultiplier`, and `RESEARCH` (all other study labels already match).
- **Default-folded sample chat (`packages/app/src/hud/Fold.tsx`, `chat/GlobalChatPanel.tsx`):**
  - `initialFoldOpen(id, noisy, defaultOpen = true)` falls back to `defaultOpen` only after explicit `sc-fold:<id>`, `sc-compact`, and `noisy && seen` checks.
  - `GlobalChatPanel` exports `hasRealChatMessages(messages)` (true when any message id is outside `SEED_CHAT`) and passes `defaultOpen={props.defaultOpen ?? hasRealChatMessages(messages)}` to `<Fold id="global-chat" noisy ...>`. Keeps `sc-fold:global-chat` and `sc-fold-seen:global-chat` keys unchanged.
- **Zero edits** to `packages/sim`, `packages/render`, `server/`, or `theme.css`.
- **Verification:** `npm test` -> sim 390, app 1521, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean.

## 2026-11-25 — sim / catch-up boundaries and study cancel refunds

- **Why:** Codex audit at `572164f`. `settleTicks` batches at the rate read at the batch's first tick; only building completions, upgrades, and the 100-tick rival pulse split a stretch. A study finish or decree expiry mid-stretch was missed (Keep III fixture: Crop Rotation 463.125 live vs 405 catch-up; Harvest Rite the other way).
- **Fix:** `systems/timedEffects.ts` `TimedEffectsSystem` (first in `SYSTEMS`): `nextEventTick` = earliest unfinished `research_<id>_until` or `decree_<id>_until` after now; `processEventsAt` calls `researchDone` for every study with an `_until` (latches `research_<id>` = 1, which `storageCap`'s Logistics bonus reads); `advanceAnalytic` is a no-op because batches stop one tick short. Runs in live `tick()` too, so both paths latch the same flags. Seasons change on multiples of 2000, already split by the rival pulse.
- **Refund:** `research_<id>_paid` (object, like `upgrades_json` jobs' `paid`) is set at start and deleted on cancel. `researchPaid(state, id)` → `{ paid, total }`: snapshot if present; else `_total` missing or equal to `PRE_PACING[id].ticks` / `ceil(ticks × 0.8)` → pre-pacing cost (the sets do not overlap with current lengths); else current `RESEARCH` cost. No save migration; nothing rewrites `_until`/`_total`.
- **Tests:** `settleMatch.test.ts` "catch-up splits where income changes mid-stretch" (crop rotation, Harvest Rite, Keep upgrade, Logistics cap with full stores, all combined); crop rotation, Harvest Rite and Logistics fail without `TimedEffectsSystem` in `SYSTEMS`. `research.test.ts` "cancel refunds what was paid, not today's price" (6).
- **Verification:** `npm test` → sim 390, app 1516, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean.

## 2026-11-25 — app / living mid & late income bracket accents

- **Helpers & wiring (`packages/app/src/hud/incomeBracket.ts`, `ResourceHud.tsx`):**
  - Exported `BASE_INCOME_PER_SECOND = 10`, `INCOME_MID_MULT = 3`, `INCOME_LATE_MULT = 15`, `IncomeBracket`, `resolveIncomeBracket`, and `incomeBracketLabel`.
  - `ResourceHud` accepts optional `incomeBracketOverride`, appends `is-income-mid` / `is-income-late` + `data-income-bracket` and tooltip labels, and renders child `.sc-income-bracket-glow` + rate `.sc-income-bracket-pip` (`sc-income-bracket-pip-ring` for late, `pointer-events: none !important;`) without touching base-income renders or existing spacing.
- **Dedicated CSS (`packages/app/src/hud/income-bracket.css`):**
  - Imported after `economy-pressure.css` in `ResourceHud.tsx`. Defines Dusk/Night/Parchment RGB tokens (`--sc-income-mid-rgb`, `--sc-income-late-rgb`), softens `.sc-income-bracket-glow` when paired with `.is-bottleneck` / `.is-empty`, avoids `.sc-ledger-cell` pseudo-elements, and includes `@media (prefers-reduced-motion: reduce)`.
  - Zero edits to `theme.css`, `hud-micro-feedback.css`, `economy-pressure.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/IncomeBracket.test.tsx`):** 8 tests passing (`npm test` -> sim 379, app 1516, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — sim / income pass

- **Data (`packages/sim/src/content/pacing.ts`):** `LEVEL_YIELD_MULT` {1:1, 2:2, 3:3.5, 4:5, 5:8}, `KEEP_INCOME_MULT` {0:1, 1:1, 2:1.25, 3:1.5, 4:2.5, 5:3.5}; clamped helpers `levelYieldMult(level)`, `keepIncomeMult(keep)`.
- **Wiring (`systems/economy.ts` `rateFor`):** `.mul(Math.max(1, level))` → `.mul(levelYieldMult(level)).mul(keepIncomeMult(keepLevel(state, building.realmId)))`. Multiplicative with staff/adjacency/pair/keep-yard bonuses; culture flat bonuses still added after. Only building production scales: `laborPerTick`, route gold and outpost tithe are untouched.
- **Studies (`systems/research.ts` `researchYield`):** tier II yields 0.1 → 0.25; logistics gold 0.08 → 0.15.
- **Determinism:** plain number tables, no clocks or RNG. Batch catch-up and tick-by-tick go through the same `rateFor`.
- **Tuning:** to retune the curve, edit only the two tables; `income.test.ts` asserts Keep I unchanged, Keep II–III in 3–8×, Keep IV–V in 15–40× for a single farm.
- **Verification:** `npm test` → sim 379, app 1508, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean.

## 2026-11-25 — app / living economy pressure accents

- **Helpers & components (`packages/app/src/hud/economyPressure.ts`, `SavingPip.tsx`, `ResourceHud.tsx`):**
  - Exported `SAVING_MIN_SECONDS = 600`, `isSavingCost(p)`, `isCostSaving(cost, rates)`, and `bottleneckResourceMap(state)`.
  - `ResourceHud` accepts optional `bottleneckOverride` for SSR tests, emits `.is-bottleneck`, `data-economy-bottleneck="true"`, `.sc-econ-bottleneck-glow`, and `.sc-econ-bottleneck-pip` (`pointer-events: none !important;`), and preserves existing `ResourceHud.test.tsx` / `HudMicroFeedback.test.tsx` output when `state` is omitted.
  - `StudyProjection` (`CostProjection.tsx`), `RaiseImproveFold.tsx` (`compact` phrasing-only pip inside `.sc-plain-pick`), and `WorkCard.tsx` (fed precomputed `rates` from `KingdomTab.tsx`, preserving no `sc-work-level`) render `<SavingPip>` + `.is-saving-cost` when `>= 600s` of income is still short.
- **Dedicated CSS (`packages/app/src/hud/economy-pressure.css`):**
  - Imported from `ResourceHud.tsx` and `SavingPip.tsx`. Defines Dusk/Night/Parchment RGB tokens (`--sc-econ-bottleneck-rgb`, `--sc-econ-saving-rgb`), keyframes (`sc-econ-bottleneck-pulse`, `sc-econ-pip-breathe`, `sc-econ-saving-dot`, `sc-econ-saving-glow`), zero `.sc-ledger-cell` pseudo-elements, `pointer-events: none !important;`, and `@media (prefers-reduced-motion: reduce)`.
  - Zero edits to `theme.css`, `cost-projection.css`, `hud-micro-feedback.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/EconomyPressure.test.tsx`):** 9 tests passing (`npm test` -> sim 374, app 1508, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — app / cost projections & limiter note

- **`packages/app/src/projection.ts`:** `RealmRates { rate, have, cap }`; `projectCost(cost, rates)` returns per-resource `short`, `productionSeconds = need/rate`, `waitSeconds = short/rate` (Infinity when rate ≤ 0 or `need > cap`), `overCap`, plus the overall max and a `limiter` (ranked: over cap > no income > longest wait > longest production; table order breaks ties). `projectionWorthShowing` gates on `PROJECTION_MIN_SECONDS = 300`, no-income shortfall, or over cap. `realmRates(state)` = `computeIncomePerSecond` with `upkeepPerTick × TICKS_PER_SECOND` subtracted from food, stores from `state.resources`, caps from `storageCap`.
- **`CostProjection.tsx`:** `projectionText`, `StudyProjection` (hidden for known/studying), `bottlenecks(state)` (next study via `ResearchHint.nextResearch`, next Keep level via `upgradeCost` unless an upgrade job is running), `BottleneckLine`. CSS in `cost-projection.css`.
- **Wiring:** `ResearchBar` computes `realmRates` once and passes `rates` to each `Row` (falls back to computing its own when `ResearchCard` is used alone). `KingdomTab` renders `<BottleneckLine>` right after `<PaceLine>`.
- **Limits:** income is the instantaneous rate; it ignores staffing changes, season swings, tithe timing and market trades. Only food has upkeep subtracted. No `packages/sim`, `packages/render` or `server/` change.
- **Verification:** `projection.test.tsx` 9 tests; `npm test` → sim 374, app 1499, server 158 (+1 Windows skip); app build clean.

## 2026-11-25 — app / quiet elite unit tier glow & multi-day badge pulse

- **Helpers & components (`packages/app/src/horizon/horizon.ts`, `hud/UnitCard.tsx`, `horizon/LongProjectBadge.tsx`):**
  - Exported `isEliteUnitTier(tier)` (`tier !== undefined && unitTierRank(tier) >= 4`).
  - `UnitCard` appends `is-elite-tier is-tier-4|5` + `data-elite-tier` and renders a phrasing-only `<span class="sc-unit-elite-rim">` (`pointer-events: none !important;`) for Tier IV/V only; Tiers I–III keep exact previous markup.
  - `LongProjectBadge` imports `horizon-elite-tier.css` after `horizon-pacing.css` to sharpen the `.is-days.is-multi-day` breathing cadence.
- **Dedicated CSS (`packages/app/src/horizon/horizon-elite-tier.css`):**
  - Defines Dusk/Night/Parchment RGB tokens (`--sc-elite-tier4-rgb`, `--sc-elite-tier5-rgb`, `--sc-multiday-breathe-rgb`), keyframes (`sc-unit-elite-glow-4`, `sc-unit-elite-glow-5`, `sc-unit-elite-rim-pulse`, `sc-long-project-multiday-breathe`, `sc-long-project-multiday-pip`), static locked fallback, `pointer-events: none !important;`, and `@media (prefers-reduced-motion: reduce)`.
  - Zero edits to `theme.css`, `horizon.css`, `horizon-living.css`, `horizon-pacing.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/horizon/EliteTierAccent.test.tsx`):** 8 tests passing (`npm test` -> sim 374, app 1490, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — sim+app / batch warning retune + light NPC pressure

- **App:** `COST_BRACKET_COSTLY = 500`, `COST_BRACKET_STEEP = 2000` in `horizon/horizon.ts` (closes the follow-up noted under pacing pass 1).
- **Sim knob:** `NPC_START_ARMY_MULT` (1.25) + `npcStartCount()` in `content/pacing.ts`, applied in `content/world.ts` `seedWorldActors` only when a realm is first seeded (or units are back-filled). Existing saves keep their current NPC armies. The rival's starting units are literals in `state/createGameState.ts` (15 militia / 5 spearmen); the migration fallback in `save/serialize.ts` is unchanged.
- **Camps:** `campThreat` base is 5 (camp) / 7 (ruins) + `hash % 5`. `resolveCampRaid` caps defenders at `min(3, threat-2)`, so every camp now has 3 militia. The `incoming >= 5` auto-win in `engagement.ts` is untouched, so the early-game guarantee holds. To push camps harder, that cap is the next lever, but it is a formula change.
- **Test gotcha:** with more NPC units on the board, `s.units.find(u => u.typeId === X)` can hit an NPC stack. Filter by `realmId === "player"` (fixed in `siege.test.ts`).
- **Verification:** `npm test` → sim 374, app 1482, server 158 (+1 Windows skip); app build clean.

## 2026-11-25 — app / "Long project" pacing badge & tooltips

- **Helpers & components (`packages/app/src/horizon/`):**
  - `horizon.ts` exports `LONG_PROJECT_SECONDS = 14_400` (`4 * HOUR`), `PacingTier`, `isLongProject(seconds)`, `pacingTier(seconds)`, and `pacingTooltip(seconds)` (always retains `exactSeconds(seconds)` so `horizon.test.tsx` assertions keep passing).
  - `LongProjectBadge.tsx` renders `<span class="sc-long-project-badge is-<bracket>[ is-multi-day]">` with `<span class="sc-long-project-pip">` when `isLongProject(seconds)` is true; mounted right after `<HorizonBadge>` in `ResearchBar.tsx` and `RaiseImproveFold.tsx` without mutating existing `.sc-study-living-card` or `.sc-horizon-study` class lists.
  - `HorizonTime.tsx` updates `HorizonTime` and `HorizonBadge` `title` attributes to use `pacingTooltip(seconds)` and re-exports `LongProjectBadge`.
- **Dedicated CSS (`packages/app/src/horizon/horizon-pacing.css`):**
  - Imported from `LongProjectBadge.tsx`. Defines Dusk/Night/Parchment tokens (`--sc-pacing-long-rgb`, `--sc-pacing-multiday-rgb`), pill breathing (`sc-long-project-breathe`, `sc-long-project-breathe-days`), pip pulse (`sc-long-project-pip-pulse`, `pointer-events: none !important;`), and `@media (prefers-reduced-motion: reduce)`. Zero edits to `theme.css`, `horizon.css`, `horizon-living.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/horizon/LongProjectBadge.test.tsx`):** 10 tests passing (`npm test` -> sim 374, app 1482, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — sim / pacing pass 1

- **Where the numbers live:** `packages/sim/src/content/pacing.ts`. Upgrade curves are indexed by *from-level* (1–4). Unit curves are indexed by `UnitType.tier`. Research ticks and costs are literal values in the `RESEARCH` table (comment at its head gives the bands). Tick math: 600 = 1m, 36,000 = 1h, 864,000 = 1d.
- **Units:** `BASE_UNIT_TYPES` holds the old hand-tuned stats; `UNIT_TYPES` is built from it once at module load by `paceUnit` (cost ceil, trainTicks ceil, power round). Champion is in `UNPACED_UNITS`. Tests that compare two units (`ranger` vs `archer`, etc.) still hold because pairs share a tier.
- **Storage coupling:** each upgrade step's cost must fit under `storageCap` at the lowest Keep that allows that step (a from-level-L upgrade needs Keep ≥ L). That is why `KEEP_GATES.storeMult` went up with this pass. If you raise `UPGRADE_COST_MULT` or research costs, check gold first: it has the smallest cap (100 base, +150 per Mint).
- **Not changed:** first-time `buildTicks` / building `cost`, production rates, rival / camp strength, combat formulas (only `power` inputs grew for Tier II+). Rival and camp balance against stronger Tier III–IV units is not playtested yet.
- **App follow-up (not done here, app was out of scope):** `horizon.ts` cost brackets (`COST_BRACKET_COSTLY = 50`, `COST_BRACKET_STEEP = 200`) now flag almost every non-militia batch. Retune them to the new costs.
- **Verification:** `npm test` → sim 374, app 1472, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean.

## 2026-11-25 — app / living progression accents

- **Helpers & components (`packages/app/src/horizon/`):**
  - `horizon.ts` exports `UnitTierRank`, `UnitTierShape`, `unitTierRank`, `unitTierShape`, and `isPaceBreathing(stage)`.
  - `HorizonTime.tsx` exports `<UnitTierPip>` (inline `10×10` SVG per tier rank inside `.sc-horizon-tier`), updates `PaceLine` with `.is-pace-breathing` + `data-pace-breathing="true"` in `mid`/`late`, and keeps all elements inside `UnitCard` strictly phrasing-only (`span`/`svg`).
  - `RaiseImproveFold.tsx` (`sc-raise-work`) and `ResearchBar.tsx` (`sc-study-living-card` while `studying`, plus `.sc-horizon-study`) attach `.is-long-horizon.is-horizon-hours` / `.is-horizon-days` and `data-long-horizon` whenever `isLongHorizon(...)` is true.
- **Dedicated CSS (`packages/app/src/horizon/horizon-living.css`):**
  - Imported after `horizon.css` in `HorizonTime.tsx`. Defines Dusk/Night/Parchment RGB tokens (`--sc-horizon-hours-rgb`, `--sc-horizon-days-rgb`, `--sc-tier-1..5-rgb`, `--sc-pace-mid/late-rgb`), `box-shadow` glow pulses for hours/days waits (avoiding pseudo-element collisions), tier crest animations, and `mid`/`late` pace breathing with `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)`.
  - Zero edits to `theme.css`, `horizon.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/horizon/HorizonLivingAccents.test.tsx`):** 12 tests passing (`npm test` -> sim 362, app 1472, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — app / progression horizon displays

- **Module (`packages/app/src/horizon/`):** `horizon.ts` (pure: `formatHorizon`, `formatTicksHorizon`, `horizonBracket`, `isLongHorizon`, `exactSeconds`, `unitTierLabel`, `batchCostTotal`, `costBracket` with `COST_BRACKET_COSTLY = 50` / `COST_BRACKET_STEEP = 200`, `unitBracketNote`, `paceStage`), `HorizonTime.tsx` (`HorizonTime`, `HorizonBadge`, `UnitTierNote`, `summarizePace`, `PaceLine`), `horizon.css`, `horizon.test.tsx`.
- **Format contract:** under 60s output is identical to the old `${n}s`, so existing short-timer tests are unchanged. Use `formatHorizon` for any new duration text instead of `Math.ceil(t / 10) + "s"`.
- **Call sites:** `ResearchAdvanced.studyProgressText`, `StudyLedger`, `ResearchTreeMap` (ready line), `ResearchBar` (horizon line per card, Study button, lectern header), `RaiseImproveFold` work rows, `UnitStatus` cost row, `UnitCard` (`tier`, `qty` props; ArmyTab passes `u.tier`, `trainQty`), `KingdomTab` (`<PaceLine>` before `<SeasonClaimLine>`).
- **Pace rule:** late if `keep >= 4` or known/total ≥ ⅔; early if `keep <= 1` and share < ⅓; else mid. Reads `keepLevel` + `researchDone` only.
- **Untouched:** `packages/sim`, `packages/render`, `server/`, `theme.css`. Cost brackets are placeholders until unit costs are scaled.
- **Verification:** `npm test` → sim 362, app 1460, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean.

## 2026-11-25 — app / living Admin / Moderation panel accents

- **Component (`packages/app/src/admin/AdminPanel.tsx`):**
  - Exported `AdminPlayerStatus` (`"online" | "muted" | "kicked" | "banned"`), `ADMIN_ACTION_FLASH_MS = 1400`, `ADMIN_ACTION_CONFIRM_LABEL`, `resolveAdminPlayerStatus`, `detectFlaggedMessage`, and `isMessageFlagged`, plus optional `marksOverride`, `flaggedIdsOverride`, `actionFlashOverride`, and `armedBanOverride` props for deterministic SSR testing.
  - Preserved all `AdminPanel.test.tsx` invariants (`class="sc-admin-row"` exact match on unflagged non-flashing rows, `Mute`/`Kick`/`Ban` counts, `disabled=""` count = 3, `"Seen in chat: Wren, Ilse"`, and zero `fetch(` calls outside `*`-comments).
- **Dedicated CSS (`packages/app/src/admin/admin-living.css`):**
  - Imported after `admin-panel.css`. Styles `.sc-admin-status-pip` (`status-online` / `status-muted` / `status-kicked` / `status-banned`), `.sc-admin-player-list` / `.sc-admin-player-row`, hover/focus/armed warning pulses on `.act-mute` / `.act-kick` / `.act-ban`, `.is-flagged` message highlighting, and `1400ms` `.is-action-flash` + `::after` sweep + `.sc-admin-confirm-pill` across Dusk/Night/Parchment with `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)`.
  - Zero edits to `theme.css`, `admin-panel.css`, `staff.ts`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/admin/AdminLivingAccents.test.tsx`):** 12 tests passing (`npm test` -> sim 362, app 1445, server 158 (+1 Windows skip); `npm run build -w @second-crown/app` clean).

## 2026-11-25 — app / staff Admin / Moderation panel foundation

- **Files:** `packages/app/src/admin/staff.ts` (gate + stubs), `admin/AdminPanel.tsx` (UI), `admin/admin-panel.css`, `admin/AdminPanel.test.tsx` (11 tests), `chat/chatFeed.ts` (read-only chat mirror). `<AdminPanel />` is the last child of `.sc-shell` in `AppShell.tsx`, right after `<GlobalChatPanel />`.
- **Gate:** `STAFF_KEY = "sc-staff"`; `readStaffFlag()` is true only for `"1"`. `useStaffFlag()` applies `parseStaffQuery(location.search)` once on mount (`?staff=1` saves, `?staff=0` removes) and listens for `sc-staff-change` (dispatched by `setStaffFlag`). `AdminPanel` returns `null` when off, so no DOM for normal players. The flag is client-side and forgeable: when real endpoints land, the server must check staff on the session (Discord login) and ignore this flag entirely.
- **Stubs (all in `staff.ts`):** `moderatePlayer(action: "mute"|"kick"|"ban", player, reason?) -> Promise<false>`, `fetchPlayerList() -> Promise<null>`, `fetchServerStatus() -> Promise<null>`. Each only `console.info`s. Intended endpoints are in comments: `POST /api/admin/{mute,kick,ban}`, `GET /api/admin/players`, `GET /api/admin/status`. A test asserts no `fetch(` outside comments in `staff.ts` / `AdminPanel.tsx`. Wire them there only.
- **Panel state (local, not persisted):** `toast` (auto-clears after `ADMIN_TOAST_MS = 2600`), `marks` (author -> last action, shown as a pill), `armedBan` (message id awaiting "Confirm ban"). Moderation targets the message author. Own messages (`isOwnMessage`) have actions disabled. Pure helpers `recentForModeration(list, limit = 8)` and `playersSeenInChat(list, author)`.
- **Chat feed:** `chatFeed.ts` holds a module-level list (starts as `SEED_CHAT`), `publishChatFeed` / `getChatFeed` / `subscribeChatFeed`, and `useChatFeed()` via `useSyncExternalStore`. `GlobalChatPanel` calls `publishChatFeed(messages)` in a `useEffect`; nothing else in chat changed and `sendToServer` is still its only server seam.
- **Placement:** `.sc-admin-float` mirrors `.sc-chat-float` on the left (`position: fixed; left/bottom: 12px; z-index: 110; pointer-events: none`, fold gets `pointer-events: auto`). Body scrolls at `min(60vh, 460px)`. On very narrow screens the two floats can overlap when both are open; staff tooling is desktop-first. `Fold` is `noisy` and follows Compact like the others.
- **Verification:** `npm test` -> sim 362, app 1433, server 158 (1 skip); `npm run build -w @second-crown/app` clean. Not yet opened in a browser.

## 2026-11-25 — app / Global Chat living identity, just-sent & ready-send accents

- **Component (`packages/app/src/chat/GlobalChatPanel.tsx`):**
  - Exported `CHAT_JUST_SENT_MS = 2800`, `ChatSenderCrestKind` (`"self" | "herald" | "peer"`), and `resolveChatSenderCrest(msg, author)` plus optional `justSentOverrideId` and `initialDraft` props for deterministic SSR tests.
  - Preserved `ChatPolish.test.tsx` & `GlobalChatPanel.test.tsx` invariants (`is-own` once per own row, exact `sc-chat-msg` count, single `sendToServer(` call site, zero `fetch(` calls).
- **Dedicated CSS (`packages/app/src/chat/chat-identity.css`):**
  - Styles `.sc-chat-sender-pip` (`sender-self` / `sender-herald` / `sender-peer`), settling `2800ms` `.is-just-sent` / `.sc-chat-just-sent-pill` (`sc-chat-just-sent-settle`, `sc-chat-sent-pill-fade`), and `.sc-chat-send.is-ready:not(:disabled)` (`sc-chat-send-breathe`) across Dusk/Night/Parchment with `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)`.
  - Zero edits to `theme.css`, `global-chat.css`, `chat-living.css`, `chat-polish.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/chat/ChatIdentity.test.tsx`):** 3 tests passing (`npm test` -> sim 362, app 1422, server 158; `npm run build -w @second-crown/app` clean).

## 2026-11-25 — app / Global Chat polish

- **Helpers (`packages/app/src/chat/globalChat.ts`):** `formatChatRelative(at, now)` (pure; pass `now`), `formatChatStamp(at)` for the `<time title>`, `isOwnMessage(msg, author)` (`local === true || author === author`, so own lines stay styled once a server echo drops the `local` flag), `CHAT_CLOCK_TICK_MS = 30_000`. `formatChatTime` kept (used by `formatChatStamp`).
- **Panel (`chat/GlobalChatPanel.tsx`):** new optional `now` prop freezes the clock for SSR tests; otherwise a 30s `setInterval` ticks a `clock` state (also bumped on Send so a fresh line reads `now`). Rows add `.is-own` and `data-chat-own`; `.is-local` is unchanged (and still adds the `only you` tag). The list has `aria-live="polite"`. Empty list renders one `li.sc-chat-empty` with `Restore sample messages` (resets to `SEED_CHAT`). Footer `.sc-chat-foot` holds the note and the `Clear` button (`setMessages([])`). Nothing persists, so Clear has no storage to wipe.
- **Arrival glow after Clear:** `prevLastIdRef` now stores a sentinel (`EMPTY_AFTER_MOUNT`) instead of `null` when the list is empty after mount, so the first message sent after Clear still triggers the arrival glow. `detectNewChatMessageId` itself is unchanged.
- **Server seam:** `sendToServer()` remains the only call site (a test asserts one call and no `fetch(` in the panel). When the endpoint lands, fill it in `globalChat.ts` only.
- **CSS (`chat/chat-polish.css`):** loaded after `global-chat.css` and `chat-living.css`. Own-colour token `--sc-chat-own-rgb` per `data-chrome` (dusk gold, night steel blue, parchment amber). `.is-own` rule is more specific than the old `.sc-chat-msg.is-local` left-border rule, so it wins without editing `global-chat.css`. `theme.css` untouched.
- **Verification:** `chat/ChatPolish.test.tsx` 8 tests. `npm test` -> sim 362, app 1419, server 158 (1 skip); `npm run build -w @second-crown/app` clean. Not yet opened in a browser.

## 2026-11-25 — app / living Global Chat accents pass

- **Component (`packages/app/src/chat/GlobalChatPanel.tsx`):**
  - Exported `CHAT_ARRIVAL_MS = 900` and `detectNewChatMessageId(prevLastId, messages)` plus optional `arrivalOverrideId` prop for SSR render tests.
  - Tracks `initialIdsRef` and `prevLastIdRef` so initial `SEED_CHAT` rows stay calm, while newly appended messages trigger `has-new-message` / `data-chat-arrival="true"` for `900ms` and `.is-entering` on the new `<li>` without altering `"sc-chat-msg"` class count (`GlobalChatPanel.test.tsx`).
- **Dedicated CSS (`packages/app/src/chat/chat-living.css`):**
  - Renders `.sc-chat-presence-pip` (`sc-chat-presence-breathe` + concentric `sc-chat-presence-ring` halo on `::after`), `.sc-chat-fold.has-new-message > .sc-fold-head` glow + `::after` sheen (`900ms`, leaving `::before` untouched for `hud-micro-feedback.css`), and `.sc-chat-msg.is-entering` glide + glow, with Dusk/Night/Parchment tokens and `@media (prefers-reduced-motion: reduce)` guards.
  - Zero edits to `theme.css`, `global-chat.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/chat/ChatLivingAccents.test.tsx`):** 3 tests passing (`npm test` -> sim 362, app 1411, server 158; `npm run build -w @second-crown/app` clean).

## 2026-11-25 — app / Global Chat panel (local only)

- **Files:** `packages/app/src/chat/globalChat.ts` (data + helpers), `chat/GlobalChatPanel.tsx` (UI), `chat/global-chat.css`, `chat/GlobalChatPanel.test.tsx` (7 tests). Mounted as `<GlobalChatPanel />` as the last child of `.sc-shell` in `AppShell.tsx`, so it is outside the tab Suspense and the `CultureContext` provider.
- **Data:** `ChatMessage = { id, author, text, at (epoch ms), local? }`. `SEED_CHAT` (3), `CHAT_MAX_LEN = 240`, `CHAT_MAX_MESSAGES = 50`. Helpers: `cleanChatText` (collapse whitespace, trim, clamp), `appendChat` (pure, caps length), `makeLocalMessage(author, raw, now)` (null on blank), `formatChatTime` (HH:MM local), `chatSummary`.
- **Send flow:** form `onSubmit` → `makeLocalMessage("You", draft)` → `setMessages(appendChat(...))` → clear input → `void sendToServer(msg)`. State is component-local `useState`; not persisted, not in the save.
- **Server seam:** `sendToServer(msg): Promise<boolean>` in `globalChat.ts` is a no-op returning `false`, with the intended `fetch("/api/chat", { method: "POST", ... })` shape in its comment. When wiring it: add the endpoint in `server/index.mjs`, fill in `sendToServer`, and add a poll/stream that replaces local messages with the server list (drop `local` on echo). Chat must stay out of `packages/sim`.
- **Placement:** `.sc-chat-float` is `position: fixed; right/bottom: 12px; z-index: 110; pointer-events: none`, with `pointer-events: auto` on the fold itself so the transparent wrapper never eats board clicks. The fold uses `noisy` so returning players don't get the board covered.
- **Keys:** the only global key handlers (KeepInterior, MusicPanel) listen for Escape, so typing in the chat input does not trigger game shortcuts.

## 2026-11-24 — app / living news polish & server readiness

- **Unread tracking (`packages/app/src/news/newsState.ts`, `NewsUnreadBadge.tsx`, `AppShell.tsx`):**
  - Exported `NEWS_SEEN_KEY` (`"sc-news-seen-id"`), `NEWS_SEEN_EVENT` (`"sc-news-seen-change"`), `latestNewsId`, `readLastSeenNewsId`, `countUnreadNews`, `hasUnreadNews`, `markNewsSeen`, and `useUnreadNews`.
  - Mounted `<NewsUnreadBadge />` inside the Crown tab button in `AppShell.tsx`; `GameNewsPanel` invokes `markNewsSeen` on mount when rendering the live feed (`!props.news`).
- **Card accents & dedicated CSS (`packages/app/src/news/GameNewsPanel.tsx`, `news-living.css`):**
  - Added `.sc-news-pip` and `.sc-news-date-seal` (plus `::after` corner sheen and `-1px` hover lift) without introducing `"sc-news-card"` inside child class names (`GameNewsPanel.test.tsx` counts `sc-news-card` occurrences). Strict `pointer-events: none !important;` and Dusk/Night/Parchment + `@media (prefers-reduced-motion: reduce)` guards. Zero edits to `theme.css`, `game-news.css`, `packages/sim`, `packages/render`, or `server/`.
- **Server-feed placeholder (`packages/app/src/news/gameNews.ts`):**
  - Added `NEWS_ENDPOINT_PLACEHOLDER = null` and `getActiveNewsFeed()` returning `GAME_NEWS` synchronously (zero `fetch()` calls).
- **Verification (`packages/app/src/news/NewsLivingPolish.test.tsx`):** 4 tests passing (`npm test` -> sim 362, app 1401, server 158; `npm run build -w @second-crown/app` clean).

## 2026-11-24 — app / Game News panel

- **Where the news lives:** `packages/app/src/news/gameNews.ts` exports `GAME_NEWS: readonly NewsEntry[]` (`{ id, date: "YYYY-MM-DD", kind: "major" | "minor", title, body: string[] }`). To post news, add an entry at the top of the array; keep `body` to 2–4 lines (the test enforces 2–4 and unique ids). No server, no fetch, nothing in the save.
- **Helpers:** `sortedNews` (date desc, stable on ties), `newsSummary` (`"N updates · <newest title>"` / `"No news yet"`), `formatNewsDate` (parses the ISO string by hand, so no timezone drift).
- **Component:** `news/GameNewsPanel.tsx` renders `<Fold id="crown-news">` with an `<ol class="sc-news-list">` of `.sc-work-card.sc-news-card.is-<kind>` items (`<time dateTime>`). Optional `news` prop for tests. Mounted as the first child of `CrownTab` (above `crown-events`).
- **CSS:** `news/game-news.css` only (`theme.css` untouched). Compact tightens card padding via `:root.sc-compact`.
- **Not touched:** `packages/sim`, `packages/render`, `server/`, `AppShell` tab list (it is a section under Crown, not a sixth tab).
- **Verification:** `news/GameNewsPanel.test.tsx` (7). `npm test` → sim 362, app 1397, server 158 (+1 skip); `npm run build -w @second-crown/app` clean. Not yet opened in a browser.
- **Later:** if news should update without a deploy, move `GAME_NEWS` to a JSON served by `server/index.mjs` and keep the same shape.

## 2026-11-24 — app / living HUD micro-feedback pass

- **ResourceHud (`packages/app/src/hud/ResourceHud.tsx`):**
  - Exported `HUD_PULSE_MS = 680`, `parseResourceNumeric`, `detectResourceMicroPulse`, and types (`ResourceMicroPulseKey`, `ResourceMicroPulseKind`, `ResourceCellSnapshot`), plus optional `pulseOverride` prop for deterministic SSR tests.
  - Compares per-resource snapshots (`income`, `full`, `empty`) in `useEffect` (skipped on initial mount, SSR, and `prefers-reduced-motion: reduce`), rendering `.sc-hud-cell-flash.is-*` overlays (`pointer-events: none`) rather than touching `.sc-ledger-cell::before` (`theme.css`) or `::after` (`music-reactive.css`).
- **Fold (`packages/app/src/hud/Fold.tsx`):**
  - Imported `./hud-micro-feedback.css`, exported `FOLD_HEAD_PULSE_MS = 320`, and tracks transient `headMotion` (`expanded` / `collapsed` on `data-fold-motion`) cleanly alongside `closing` in the `[open]` effect. Storage keys (`sc-fold:*`, `sc-fold-seen:*`, `sc-compact`) untouched.
- **Dedicated CSS (`packages/app/src/hud/hud-micro-feedback.css`):**
  - Theme tokens across Dusk, Night, Parchment; resource flash/glow keyframes; `.sc-fold-head::before` sweep; `.sc-tabs-bar .sc-tab.active::before` sheen (`::after` left to `theme.css`); strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)`.
  - Zero edits to `theme.css`, `packages/sim`, `packages/render`, or `server/`.
- **Verification (`packages/app/src/hud/HudMicroFeedback.test.tsx`):** 3 tests passing (`npm test` -> sim 362, app 1390, server 158; `npm run build -w @second-crown/app` clean).

## 2026-11-24 — app / Hold view density pass

- **`hud/HoldDensity.tsx`:** imports `./hold-density.css`. `BandToggle({ band, onToggle })` replaces the inline-styled toggle button in `AppShell`'s `.sc-map-controls`; it renders one `<button class="sc-band-toggle" data-band>` with two `aria-hidden` `.sc-band-seg` spans (`is-hold` / `is-board`, live one gets `is-on`) and an `aria-label` naming the current mode and the switch target. `HoldFocusTag({ visible })` returns null off Hold; on Hold it renders `.sc-hold-focus-tag` (absolute, z 4, same spot as `.sc-board-focus-tag`). Mounted next to `BoardFocusFrame`.
- **`hud/hold-density.css`:** all rules scoped to `.sc-band-hold` (or the new classes). Mirrors the Board-band chrome trims from `board-focus.css` / `layout-priority.css` so the header height is close to the same in both bands. Stores strip: `.sc-resource-living-rows` switches to `flex-direction: row; flex-wrap: wrap`, name row `flex: 1 0 100%`, amount + income share line 2; glyph and labels `display: none`. It never sets `display` on `.is-income`, so Compact's hide rule in `layout-priority.css` still wins. No rule touches `.sc-map-canvas-container` size or `aspect-ratio`; only the canvas `border-color` on Hold (green, `!important` to beat the inline pack colour, same as Board does in gold).
- **Not touched:** `packages/render` (camera, bands, hit-testing), `useGameEngine.ts`, `theme.css`, Fold/Compact code, sim, server.
- **Verification:** `hud/HoldDensity.test.tsx` (4). `npm test` → sim 362, app 1387, server 158 (+1 skip); `npm run build -w @second-crown/app` clean. The ~80px saving is summed from the CSS (ledger margins 12, cell padding 7, glyph strip ~27, merged income line ~18, shell padding 8, title ~3, tabs ~6), not measured.

## 2026-11-24 — app / living board accents & tactile province selection

- **Components (`packages/app/src/hud/BoardLivingAccents.tsx`, `BoardLiving.tsx`):**
  - Exported `BoardLivingAccents`, `listKeepAccents`, `listTerrainAccents`, `resolveAccentMusicTint`, `resolveProvinceSelectionFeedback`, `readAccentDayPhase`, and supporting types from `hud/BoardLivingAccents.tsx`, re-exported from `BoardLiving.tsx` and mounted right after the terrain pulse layer.
  - Uses deterministic coordinate math (`boardTerrainElevation` from `./BoardRoads`, standalone `readAccentDayPhase` + `dayPhase` prop to avoid circular imports with `BoardLiving.tsx`), hard caps (`<= 8` keep accents, `<= 10` terrain accents), and `useNowPlaying()` (`../nowPlaying`) so accents remain quiet and deterministic.
- **Dedicated CSS (`packages/app/src/hud/board-living-accents.css`):**
  - Houses ambient keep/terrain animations (`sc-accent-hearth-breathe`, `sc-accent-mote-rise`, `sc-accent-terrain-drift`, `sc-accent-glint-twinkle`), one-shot selection settle ripple (`sc-select-ripple-out`), lifted bevel & corner tick pulses (`sc-select-edge-pulse`, `sc-select-corner-breathe`), subtle `.sc-atlas-card:hover` lift, strict `pointer-events: none !important;`, and `@media (prefers-reduced-motion: reduce)` guards.
  - Zero edits to `packages/render/`, `theme.css`, `packages/sim`, or `server/`.
- **Verification (`packages/app/src/hud/BoardLivingAccents.test.tsx`):** 3 tests passing (`npm test` -> sim 362, app 1383, server 158; `npm run build -w @second-crown/app` clean).

## 2026-11-24 — app / board presence pass

- **`hud/BoardFocus.tsx`:** `BoardFocusFrame({ visible })` returns null off Board; on Board it renders `.sc-board-focus-edge` (absolute inset 0, z 3) and `.sc-board-focus-tag` (z 4; map controls stay at z 5). Imports `./board-focus.css`. Rendered in `AppShell` inside the board frame, after `BoardStatus`. It uses its own elements, not `::before`/`::after` on the frame, because `board-music-lighting.css` and `music-reactive.css` already use those pseudo-elements.
- **`AppShell.tsx`:** the inner board div is `className="sc-board-frame"` (the inline `maxWidth: 900` moved to CSS). Everything below the board (inspect card, study tree Fold, Suspense tab body) is wrapped in `<div className="sc-below-board">`.
- **`hud/board-focus.css`:** sizing is a CSS var `--sc-board-w` on `.sc-band-board .sc-map-canvas-container`, using `width` plus symmetric negative `margin-left/right` (the percentages resolve against the panel width in both). `100vw - 56px` leaves room for a desktop scrollbar so it doesn't scroll sideways. `(100vh - 150px) × 14/9` keeps the board plus the sticky chrome on one screen. Never set `aspect-ratio` or a height here: the Pixi canvas is 560×360 and `getCanvasCoords` scales X and Y separately, so a changed aspect would stretch the picture (the test checks this).
- **Scroll anchoring:** `.sc-below-board { overflow-anchor: none }` takes the content below out of anchor selection, so Chrome/Firefox anchor on the board instead. Safari ignores `overflow-anchor`; the `45vh` min-height still covers the scroll-clamp case there.
- **Verification:** `BoardFocus.test.tsx` (4 tests). `npm test` → sim 362, app 1380, server 158; app build clean. Not opened in a browser yet.

## 2026-11-24 — app / collapsible Fold visual polish & Compact board focus

- **Components (`packages/app/src/hud/Fold.tsx`):**
  - Imported `./fold-polish.css`, exported `FOLD_CLOSE_MS = 180`, and added a visual-only `closing` transition state (`prevOpenRef`) so closing panels play `.sc-fold-reveal.is-closing` for `180ms` (skipped under SSR or `prefers-reduced-motion: reduce`) before unmounting children. Closed initial/SSR renders still omit `.sc-fold-reveal` / `.sc-fold-body`.
  - Preserved all `initialFoldOpen` rules, `FOLD_ALL_EVENT`, `COMPACT_EVENT`, and `localStorage` keys (`sc-fold:<id>`, `sc-fold-seen:<id>`, `sc-compact`).
- **Dedicated CSS (`packages/app/src/hud/fold-polish.css`):**
  - Grid-row expand/collapse animations (`@keyframes sc-fold-open`, `@keyframes sc-fold-close`, `sc-fold-body-in`, `sc-fold-body-out`), Dusk/Night/Parchment summary accent tokens (`--sc-fold-gold`, `--sc-fold-summary-text`, `--sc-compact-glow-rgb`), and Compact focus overlays (`:root.sc-compact .sc-shell::after`, `:root.sc-compact .sc-map-canvas-container::before`, `:root.sc-compact .sc-map-canvas`) using `pointer-events: none !important;` and leaving `.sc-map-canvas-container > div::before`/`::after` untouched.
  - Zero edits to `theme.css`, `layout-priority.css`, `packages/sim`, or `server/`.
- **Verification (`packages/app/src/hud/FoldPolish.test.tsx`):** 2 tests passing (`npm test` -> sim 362, app 1376, server 158; `npm run build -w @second-crown/app` clean).

## 2026-11-24 — app / Kingdom tab flow pass

- **`hud/RaiseImproveFold.tsx`:** `<RaiseImproveFold state act selectedBuild setSelectedBuild>` replaces the picker blurb, `.sc-plain-grid` picker and the `Raising` / `Improving` `<h3>` grids in `KingdomTab.tsx` (same position: after keep gate / banners / incoming lines, before Standing works). `Fold id="kingdom-raise"`, not noisy (it is the main action). Exports `worksInProgress(state)` (raises = `listWorksInProgress` minus `isScarred`, then `listUpgrades`; seconds = `ceil(ticks/10)` as before) and `raiseImproveSummary(pickedName, works, affordable)`. Cancel calls `tryCancelBuild` / `tryCancelUpgrade` with the same messages as before. KingdomTab drops the now-unused sim imports.
- **CSS:** new `kingdom-flow.css` (imported by the fold). `.sc-raise-grid` overrides the grid to `minmax(112px,1fr)` / gap 4; chip padding 3/6; `.sc-work-status` is visually hidden (clip) except on `.is-picked`; a `::before` dot on `.sc-work-name` carries afford state. `.sc-raise-works` grid `minmax(230px,1fr)` of flex rows.
- **`SeasonClaimLine`:** builds the court text once (`court`) and adds a `title` with the full line; markup and test strings unchanged. `season-claim-line.css`: `nowrap`, text ellipsis, padding 2/4/2/8, margin 4, 12px font, button min-height 32 → 26 (30 under 560px).
- **Space estimate (CSS math, 900px, one raise + one upgrade):** claim 58 → 40px; picker 5 rows × ~53px (~303) → 3 rows × ~26px (~86); works 2 headed grids (~310) → one ~31px row; fold head adds ~53. Total ~670 → ~210 open / ~85 folded. Everything in the Kingdom tab body already renders below the board (since the layout priority pass), so this moves the lower panels up rather than the board itself. Not yet opened in a browser.
- **Tests:** `hud/RaiseImproveFold.test.tsx` 5 (summary, works read, render in one fold with all picks, closed fold keeps summary, CSS isolation). sim 362, app 1374, server 158; build clean.

## 2026-11-24 — app / Ledger of Crowns fold

- **`LedgerPanel.tsx`:** the old `<h3>Ledger of Crowns</h3>` fragment is now `<Fold id="crown-ledger" noisy title="Ledger of Crowns" summary={ledgerSummary(rows)}>`. `ledgerSummary(rows)` (exported) relies on `listLedgerWithSaveAudit` being newest-first: `"No entries yet"` / `"1 entry · …"` / `"N entries · …"`, preview cut at 48 chars with `…`. Body (list / empty line) unmounts when closed, so `LedgerCard` living effects stop while folded.
- **CSS:** `layout-priority.css` zeroes the list / empty-line margins inside `.sc-fold[data-fold="crown-ledger"]`. `ledger-card.css`, `ledger-living.css`, `theme.css` unchanged.
- **Tests:** `LedgerPanel.test.tsx` (summary text, open/closed render, noisy fold after seen). `save.test.tsx` still finds "Ledger of Crowns" (Fold title always renders). sim 362, app 1369, server 158; build clean.

## 2026-11-24 — app / layout priority pass (board first, Fold, Compact)

- **`hud/Fold.tsx`:** `<Fold id title summary? noisy? className?>`. Renders `section.sc-fold[data-fold=id]` with a `button.sc-fold-head[aria-expanded]`; the body is **unmounted** when closed (children's effects stop while folded). `initialFoldOpen(id, noisy)`: saved `sc-fold:<id>` wins; else `sc-compact=1` → closed; else noisy + `sc-fold-seen:<id>` → closed; else open. The seen flag is written on mount. All storage access is guarded, so node-env tests (no `localStorage`) render folds open and existing `KingdomTab` render tests still see every line.
- **Compact:** `setCompact(on)` writes `sc-compact`, toggles `html.sc-compact`, and fires `sc-fold-all` (`{ open: !on }`, every mounted fold follows and saves) and `sc-compact-change` (`useCompact()`). `main.tsx` calls `applyCompactClass(loadCompact())` at boot. Folds mounted later (other tabs) pick up compact via `initialFoldOpen` only when they have no saved choice; `sc-fold-all` saves a choice for mounted ones only.
- **`AppShell.tsx` order:** `.sc-head-row` (h1 + `SpeedControls`) → subtitle → offline note → `ResourceHud` → `TutorialBanner` (primer only now) → status → tabs → board → `ProvinceInspect` (kingdom) → `Fold#study-tree > ResearchBar` → tab body. Shell gains `sc-band-${cameraBand}`. `KeepInterior` is a fixed overlay, position in the tree does not matter.
- **`TutorialBanner.tsx`:** returns `null` with no step; wraps the banner in `Fold#primer` (summary = step text). No longer renders `ResearchBar`. The Keep hall lectern room still mounts its own `ResearchBar`.
- **Tabs:** Kingdom wraps `SeasonEffectLine` … pairing paragraph in `Fold#kingdom-notes` (`SeasonClaimLine` stays outside: it has a claim button), plus `kingdom-standing`, `kingdom-flags`, `kingdom-people` (PeoplePanel's own h3 hidden by CSS), `kingdom-market`. `BalanceNotes` is already a `<details>`, left as is. World: `world-holds`, `world-market` (MarketPanel + AuctionPanel). Crown: `crown-events`, `crown-achievements`. The build picker, works in progress, Army and War tabs are not folded.
- **CSS:** `layout-priority.css` (imported by `Fold.tsx`). `.sc-band-board` and `:root.sc-compact` hide `.sc-resource-living-row.is-income`, labels, glyph and underlay in the stores strip; the `music-reactive.css` `::after` rings on `.sc-resource-bar` are untouched. `ChromeDock` row has class `sc-chrome-row` (gap 6, padding 4/10).
- **Verification:** `hud/Fold.test.tsx` 7 tests (initial state rules, closed render drops body, AppShell order, CSS isolation). sim 362, app 1366, server 158; app build clean. Not yet opened in a browser.

## 2026-11-24 — app / source-based board music lighting & light weather response

- **Board lighting (`packages/app/src/hud/BoardMusicLighting.tsx`, `BoardLiving.tsx`):**
  - Exported `BoardMusicLighting`, `resolveBoardMusicLighting`, `readBoardMusicSeason`, `type BoardMusicLightingDescriptor`, and `type BoardMusicLightingProps`, re-exported from `BoardLiving.tsx` and mounted right after `<BoardDayNight />`.
  - Consumes `useNowPlaying()` (`../nowPlaying`) + `normalizeBoardSeason(currentSeason(state))` to map `travis` (warmer gold), `lofi` (cooler dusk), and `realm` (4 seasonal palettes) into a `pointer-events: none` ambient gradient + halo SVG group (`is-playing` / `is-idle`).
- **Dedicated CSS (`packages/app/src/hud/board-music-lighting.css`):**
  - Uses `html[data-music-playing="true"][data-music-source="travis|lofi|realm"]` (written by `nowPlaying.ts`) + `.sc-shell.season-*` overrides to drive both `.sc-board-music-lighting` and `.sc-map-canvas-container > div::before` (intentionally using `::before` so `music-reactive.css`'s `::after` ring remains untouched; `z-index: 1` stays below `.sc-map-controls` at `z-index: 5`).
  - Zero edits to `theme.css`, `MusicPanel.tsx`, `music-panel.css`, `ThemeDock.tsx`, `packages/sim`, or `server/`.
- **Weather response (`packages/app/src/seasons/WeatherOverlay.tsx`):**
  - Exported `resolveMusicWeatherResponse` and extended `WeatherOverlay` (plus optional `nowPlayingOverride` prop for deterministic tests) to add a gentle `1.25×` count / `1.12×` alpha boost for rain/snow or `14` soft source-tinted drifting motes on clear skies while playing, skipped under `prefers-reduced-motion: reduce`.
- **Verification (`packages/app/src/hud/BoardMusicLighting.test.tsx`):** 4 tests passing (`npm test` -> sim 362, app 1359, server 158; `npm run build -w @second-crown/app` clean).

## 2026-11-24 — app / music panel + now-playing hooks

- Three sources, each keeps its engine: `travisMusic.ts` (own lazy `HTMLAudioElement`), `music.ts` lofi `<audio>` (mode `lofi`) and `music.ts` synth (mode `bed`, shown as "Realm"). `audioManager` holiday / battle tracks still follow `isMusicMuted()`.
- `nowPlaying.ts` is the single facade. `MUSIC_LIBRARY` ids: `travis-N`, `realm`, `lofi-N`. `getNowPlaying()` picks the live source (Travis playing > mode bed > mode lofi), else the last chosen id. `playTrack(id)` / `toggleMusic()` / `pauseMusic()` / `stepTrack(±1)` (skips realm) / `setMusicVolume(0..1)`. Call play actions from click handlers (autoplay rules).
- Lofi resume: when mode isn't lofi, `playTrack` calls `pickLofiTrack(i)` (sets index only, no load) then `setMusicMode("lofi")`, so re-playing the same track continues from where it paused. A pick while already in lofi reloads (existing behaviour; a picked lofi track still loops via `lofiPinned`).
- `installNowPlaying()` (called once in `main.tsx`) listens to `sc-music-change`, `sc-lofi-track`, `sc-lofi-status`, `sc-travis-change`; on each it writes `document.documentElement.dataset.musicPlaying` / `musicTrackId` / `musicSource`, saves the playing id to `sc-music-last-track`, and fires `sc-now-playing` (detail = snapshot) only when id or playing changes.
- Volume: `sc-music-volume` (was `sc-travis-volume`, never shipped). `music.ts` gained `setLofiVolume`; the lofi element and `pickLofiTrack` use it instead of 0.38 / 0.7. Realm synth gain unchanged.
- `MusicReactiveLayer.readCurrentMusicReactiveState` now goes through `getNowPlaying()` for Travis (profile from title via `resolveMusicTrackProfile`) and subscribes to `sc-travis-change` + `sc-now-playing`. Lofi / Realm path unchanged.
- CSS: `music-panel.css` only. Every selector is prefixed `.music-panel …` and hover rules use `:hover:not(:disabled)` so they beat the global `button:hover:not(:disabled)` in `theme.css` (that rule loads later and would otherwise repaint them). Own `--mp-*` tokens; dark umber + gold on every chrome theme. Reduced motion stops the equalizer.
- Removed: `MusicDock`/`LofiDock` components (file keeps `useMusicMode` for `HudControls`), `lofi-dock.css`, missing `lofi-a.ogg` / `lofi-b.ogg` entries. `nextLofiTrack` / `prevLofiTrack` in `music.ts` are now unused.
- Not yet opened in a browser.

## 2026-11-24 — app / living culture banner on culture line & home keep (bakeoff/gemini-culture-line)

- **Components (`packages/app/src/hud/LivingCultureBanner.tsx`, `CultureLine.tsx`, `CultureCrestPip.tsx`, `BoardLiving.tsx`):**
  - Exported `LivingCultureBanner`, `HomeKeepCultureBanner`, `resolveCultureBannerDescriptor`, `readCultureBannerState`, `type LivingCultureBannerProps`, `type HomeKeepCultureBannerProps`, `type CultureBannerDescriptor`, and `type CultureBannerPattern` from `hud/LivingCultureBanner.tsx`, re-exported from `BoardLiving.tsx`.
  - Reads `playerCultureId(state)` and `getCulture(id)` from `@second-crown/sim` with defensive guards for partial test states (zero culture rule duplication).
  - Mounted `<LivingCultureBanner />` inside the `<span>` of `CultureLine.tsx` (preserving `<p>`'s 3-child structure for `CultureLine.test.tsx`), imported `living-culture-banner.css` in `CultureCrestPip.tsx` to animate `.sc-culture-status-line .sc-culture-status-icon`, and mounted `<HomeKeepCultureBanner state={state} />` on `state.board.homeProvinceId` in `BoardLiving.tsx`.
- **Styling (`packages/app/src/hud/living-culture-banner.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-culture-banner-glow`, `sc-culture-banner-flutter`, `sc-culture-banner-shimmer`) with `pointer-events: none !important;`, `user-select: none;`, and `@media (prefers-reduced-motion: reduce)` guards; registered in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, `server/`, `CultureStatusLine.tsx`, `KingdomTab.tsx`, or `ProvinceInspect.tsx`.
- **Verification (`packages/app/src/hud/LivingCultureBanner.test.tsx`):**
  - 5 tests covering all 10 culture descriptors/patterns, `LivingCultureBanner`, `CultureLine` integration, `HomeKeepCultureBanner` & `BoardLiving` integration, `pointer-events: none`, and CSS isolation.

## 2026-11-22 — app / living age seal on age line & home keep (bakeoff/gemini-age-line)

- **Components (`packages/app/src/hud/LivingAgeSeal.tsx`, `AgeLine.tsx`, `PrestigeLine.tsx`, `BoardLiving.tsx`):**
  - Exported `LivingAgeSeal`, `HomeKeepAgeSeal`, `resolveAgeSealDescriptor`, `readAgeSealState`, `type LivingAgeSealProps`, `type HomeKeepAgeSealProps`, `type AgeSealDescriptor`, and `type AgeSealTier` from `hud/LivingAgeSeal.tsx`, re-exported from `BoardLiving.tsx` (`LivingAgeSeal` and `resolveAgeSealDescriptor` also re-exported from `AgeLine.tsx`).
  - Reads `flags.prestige_level`, `canAscend(state)` from `@second-crown/sim`, and `sharedRealmId(state)` with defensive guards for partial test states (zero age rule duplication).
  - Mounted `<LivingAgeSeal />` in `AgeLine.tsx` and `PrestigeLine.tsx`, and mounted `<HomeKeepAgeSeal state={state} />` on `state.board.homeProvinceId` in `BoardLiving.tsx`.
- **Styling (`packages/app/src/hud/living-age-seal.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-age-seal-glow`, `sc-age-seal-shift`, `sc-age-seal-twinkle`) and tier cadence rules (plus `.sc-age-status-line .sc-age-status-icon` tier rules) with `pointer-events: none !important;`, `user-select: none;`, and `@media (prefers-reduced-motion: reduce)` guards; registered in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, `server/`, `KingdomTab.tsx`, or `ProvinceInspect.tsx`.
- **Verification (`packages/app/src/hud/LivingAgeSeal.test.tsx`):**
  - 5 tests covering progressive age descriptors, `LivingAgeSeal`, `AgeLine` / `PrestigeLine` integration, `HomeKeepAgeSeal` & `BoardLiving` integration, `pointer-events: none`, and CSS isolation.

## 2026-11-21 — app / living lectern pip on research line & home keep (bakeoff/gemini-research-line)

- **Components (`packages/app/src/hud/LivingLecternPip.tsx`, `StudyLine.tsx`, `ResearchBar.tsx`, `ScrollPip.tsx`, `BoardLiving.tsx`):**
  - Exported `LivingLecternPip`, `HomeKeepLecternPip`, `summarizeActiveStudy`, `type LivingLecternPipProps`, `type HomeKeepLecternPipProps`, and `type ActiveStudySummary` from `hud/LivingLecternPip.tsx`, re-exported from `BoardLiving.tsx`.
  - Reads `RESEARCH`, `researchTicksLeft`, and `researchDone` from `@second-crown/sim` with defensive guards for partial test states (zero research rule duplication). Uses `data-study-id` rather than `data-study` so `ResearchTree.test.tsx`'s card-slicing helper stays untouched.
  - Mounted `<LivingLecternPip />` in `StudyLine.tsx` and `ResearchBar.tsx`, imported `living-lectern-pip.css` in `ScrollPip.tsx` to animate `.sc-research-status-line.is-active .sc-research-status-icon`, and mounted `<HomeKeepLecternPip state={state} />` on `state.board.homeProvinceId` in `BoardLiving.tsx`.
- **Styling (`packages/app/src/hud/living-lectern-pip.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-lectern-pip-aura`, `sc-lectern-pip-glow`, `sc-lectern-page-turn`, `sc-lectern-spark-glint`) with `pointer-events: none !important;`, `user-select: none;`, and `@media (prefers-reduced-motion: reduce)` guards; registered in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, `server/`, `KingdomTab.tsx`, or `ProvinceInspect.tsx`.
- **Verification (`packages/app/src/hud/LivingLecternPip.test.tsx`):**
  - 5 tests covering `summarizeActiveStudy`, idle vs. active pip states, `StudyLine` / `ResearchBar` integration, `HomeKeepLecternPip` & `BoardLiving` integration, `pointer-events: none`, and CSS isolation.

## 2026-11-19 — app / living scroll pip on quests line & home keep (bakeoff/gemini-quests-line)

- **Components (`packages/app/src/hud/LivingQuestScrollPip.tsx`, `ScrollPip.tsx`, `QuestPanel.tsx`, `BoardLiving.tsx`):**
  - Exported `LivingQuestScrollPip`, `HomeKeepQuestScrollPip`, `summarizeActiveQuests`, `type LivingQuestScrollPipProps`, `type HomeKeepQuestScrollPipProps`, and `type ActiveQuestsSummary` from `hud/LivingQuestScrollPip.tsx`, re-exported from `BoardLiving.tsx`.
  - Reads `listQuests(state)` and `getProvince(state, homeId)` from `@second-crown/sim` (zero quest rule duplication).
  - Mounted `<LivingQuestScrollPip />` on the `Quests` header in `QuestPanel.tsx`, imported `living-quest-scroll-pip.css` and added conditional `.sc-scroll-pip-aura` inside `ScrollPip.tsx` to animate `ScrollPip` and `.sc-quests-status-line.is-active .sc-quests-status-icon`, and mounted `<HomeKeepQuestScrollPip state={state} />` on `state.board.homeProvinceId` in `BoardLiving.tsx`.
- **Styling (`packages/app/src/hud/living-quest-scroll-pip.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-quest-scroll-aura`, `sc-quest-scroll-unroll`, `sc-quest-scroll-roller`, `sc-quest-scroll-glint`) with `pointer-events: none !important;`, `user-select: none;`, and `@media (prefers-reduced-motion: reduce)` guards; registered in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, `server/`, `KingdomTab.tsx`, or `ProvinceInspect.tsx`.
- **Verification (`packages/app/src/hud/LivingQuestScrollPip.test.tsx`):**
  - 5 tests covering `summarizeActiveQuests`, idle vs. open vs. ready pip states, `QuestPanel` / `ScrollPip` integration, `HomeKeepQuestScrollPip` & `BoardLiving` integration, `pointer-events: none`, and CSS isolation.

## 2026-11-19 — app / living omen pip on events line & home keep (bakeoff/gemini-events-line)

- **Components (`packages/app/src/hud/LivingEventOmenPip.tsx`, `OmenPip.tsx`, `EventAdvanced.tsx`, `EventPanel.tsx`, `BoardLiving.tsx`):**
  - Exported `LivingEventOmenPip`, `HomeKeepOmenPip`, `activePeriodEvent`, `resolveActiveOmenPalette`, `type LivingEventOmenPipProps`, `type HomeKeepOmenPipProps`, and `type ActiveOmenPalette` from `hud/LivingEventOmenPip.tsx`, re-exported from `BoardLiving.tsx`.
  - Reads `EVENT_PERIOD` and `getEventLog` from `@second-crown/sim` (`last_event` / `last_event_tick` fallback) and `resolveOmenVariant` / `resolveSpecificEventType` from `OmenPip.tsx` (zero event math added).
  - Mounted `<LivingEventOmenPip />` on `EventNextCard` (`EventAdvanced.tsx`) and `EventPanel` (`EventPanel.tsx`), imported `living-omen-pip.css` in `OmenPip.tsx` to animate `.sc-events-status-line.is-active .sc-events-status-icon`, and mounted `<HomeKeepOmenPip state={state} />` on `state.board.homeProvinceId` in `BoardLiving.tsx`.
- **Styling (`packages/app/src/hud/living-omen-pip.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-event-omen-aura`, `sc-event-omen-shift`, `sc-event-omen-shimmer`) with `pointer-events: none !important;`, `user-select: none;`, and `@media (prefers-reduced-motion: reduce)` guards; registered in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, `server/`, `KingdomTab.tsx`, or `ProvinceInspect.tsx`.
- **Verification (`packages/app/src/hud/LivingEventOmenPip.test.tsx`):**
  - 5 tests covering `activePeriodEvent`, `resolveActiveOmenPalette`, idle vs. active rendering, `EventNextCard` / `EventPanel` integration, `HomeKeepOmenPip` & `BoardLiving` integration, `pointer-events: none`, and CSS isolation.

## 2026-11-17 — app / living decree seal pip on decrees line & home keep (bakeoff/gemini-decrees-line)

- **Components (`packages/app/src/hud/LivingDecreePip.tsx`, `WaxSealPip.tsx`, `DecreeHint.tsx`, `DecreesPanel.tsx`, `BoardLiving.tsx`):**
  - Exported `LivingDecreePip`, `HomeKeepDecreePip`, `countActiveDecrees`, `firstActiveDecreeId`, `type LivingDecreePipProps`, and `type HomeKeepDecreePipProps` from `hud/LivingDecreePip.tsx`, re-exported from `BoardLiving.tsx`.
  - Reads `DECREES` and `decreeActive(state, d.id)` from `@second-crown/sim` (zero rule duplication).
  - Mounted `<LivingDecreePip />` on `DecreeHint.tsx` and the `Royal decrees` header in `DecreesPanel.tsx`, added `.sc-wax-seal-aura` + glow/flicker styling to `WaxSealPip.tsx` when `active`, and mounted `<HomeKeepDecreePip state={state} />` on `state.board.homeProvinceId` in `BoardLiving.tsx`.
- **Styling (`packages/app/src/hud/living-decree-pip.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-decree-pip-aura`, `sc-decree-pip-pulse`, `sc-decree-pip-flicker`) with `pointer-events: none !important;`, `user-select: none;`, and `@media (prefers-reduced-motion: reduce)` guards; registered in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **Verification (`packages/app/src/hud/LivingDecreePip.test.tsx`):**
  - 5 tests covering `countActiveDecrees` / `firstActiveDecreeId`, idle vs. active pip states, `DecreeHint` / `DecreesPanel` / `WaxSealPip` integration, `HomeKeepDecreePip` & `BoardLiving` integration, `pointer-events: none`, and CSS isolation.

## 2026-11-15 — app / living stamp pip on stamps line & home keep (bakeoff/gemini-stamps)

- **Components (`packages/app/src/hud/LivingStampPip.tsx`, `HoldStatusStack.tsx`, `JoinHoldCard.tsx`, `BoardLiving.tsx`):**
  - Exported `LivingStampPip`, `HomeKeepStampPip`, `countActiveStamps`, `type LivingStampPipProps`, and `type HomeKeepStampPipProps` from `hud/LivingStampPip.tsx`, re-exported from `BoardLiving.tsx`.
  - Mounted `<LivingStampPip />` on the `stamps` row in `HoldStatusStack.tsx` and the `Stamps` heading in `JoinHoldCard.tsx`, and mounted `<HomeKeepStampPip state={state} />` on `state.board.homeProvinceId` in `BoardLiving.tsx`.
- **Styling (`packages/app/src/hud/living-stamp-pip.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-stamp-pip-aura`, `sc-stamp-pip-pulse`) with `pointer-events: none !important;`, `user-select: none;`, and `@media (prefers-reduced-motion: reduce)` guards; registered in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **Verification (`packages/app/src/hud/LivingStampPip.test.tsx`):**
  - 5 tests covering `countActiveStamps`, idle vs. active pip states, `HoldStatusStack` & `JoinHoldCard` integration, `HomeKeepStampPip` & `BoardLiving` integration, and CSS isolation.

## 2026-11-15 — app / living culture crest pip on culture line & home keep (bakeoff/gemini-culture)

- **Components (`packages/app/src/hud/CultureCrestPip.tsx`, `CultureLine.tsx`, `BoardLiving.tsx`):**
  - Exported `HomeKeepCultureCrest` alongside `CultureCrestPip` from `hud/CultureCrestPip.tsx` and re-exported both from `BoardLiving.tsx`.
  - Reads `playerCultureId(state)` and `getCulture(cultureId).palette.tabard` to shift shield aura, border, and field colors, and mounts `<HomeKeepCultureCrest state={state} />` on `state.board.homeProvinceId`.
- **Styling (`packages/app/src/hud/culture-crest-pip.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-culture-crest-aura-breathe`, `sc-culture-crest-pulse`, `sc-culture-crest-shimmer`) with `pointer-events: none !important;`, `user-select: none;`, and `@media (prefers-reduced-motion: reduce)` guards; registered in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **Verification (`packages/app/src/hud/CultureCrestPip.test.tsx`):**
  - 5 tests covering all 10 cultures, `CultureLine` integration, `HomeKeepCultureCrest` & `BoardLiving` integration, `pointer-events: none`, and CSS isolation.

## 2026-11-15 — app / living prestige crown pip on prestige line & home keep (bakeoff/gemini-prestige)

- **Components (`packages/app/src/hud/PrestigeCrownPip.tsx`, `AgeLine.tsx`, `BoardLiving.tsx`):**
  - Exported `PrestigeCrownPip`, `HomeKeepCrownPip`, `resolvePrestigeCrownDescriptor`, `type PrestigeCrownDescriptor`, and `type PrestigeTier` from `hud/PrestigeCrownPip.tsx`, re-exported from `AgeLine.tsx` and `BoardLiving.tsx`.
  - `resolvePrestigeCrownDescriptor(prestige)` maps `flags.prestige_level` into tiers `0`–`4`, monotonically increasing `glowOpacity` (`0.18` to `0.95`) and decreasing `pulseDurationSec` (`5.5s` to `2.0s`).
  - Mounted `<PrestigeCrownPip />` in `AgeLine.tsx` and `<HomeKeepCrownPip />` in `BoardLiving.tsx` above `state.board.homeProvinceId`.
- **Styling (`packages/app/src/hud/prestige-crown-pip.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-prestige-crown-pulse`, `sc-prestige-crown-glow`, `sc-prestige-gem-twinkle`) with `pointer-events: none !important;`, `user-select: none;`, and `@media (prefers-reduced-motion: reduce)` guards; registered in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **Verification (`packages/app/src/hud/PrestigeCrownPip.test.tsx`):**
  - 5 tests covering prestige tier scaling, `pointer-events: none`, `AgeLine` integration, `HomeKeepCrownPip` & `BoardLiving` integration, and CSS isolation.

## 2026-11-14 — app / study tree map on the lectern (wave/research-tree, not merged)

- **Component (`packages/app/src/ResearchTreeMap.tsx`):**
  - Exports `ResearchTreeMap`, `studyTreeNode`, `studyTreeBranches`, `studyTreeSummary`, `type StudyNodeState`, `type StudyTreeNode`, `type StudyBranch`.
  - `studyTreeNode(state, id)` makes the same reads as the card `Row` in `ResearchBar.tsx` (`researchDone`, `researchTicksLeft`, `researchKeepReady`, `researchPrereqReady`, `countBuilding`, `researchDuration`, the `research_<id>_total` flag) and reuses `studyStatus`, `studyNeeds`, `studyProgressText` and `studyCostParts`. It splits the card's `open` status in two: `ready` (stores cover the cost and the lectern is free) and `waiting` (stores short, or another study is on the lectern).
  - `studyTreeBranches(state)` builds the tree from `researchRequires` through `studyLeadsTo`. A new tier II study in the sim table shows up with no change here. A first study with two deeper studies stacks them on the right. A tier III study (a study that requires a tier II one) would not be drawn: branches are one level deep, like `researchTier`.
  - Display only. No call to `tryStartResearch` or `tryCancelResearch`.
- **Jump to card:** A node is a `<button>`. Its click handler finds the card with `closest(".sc-research-lectern").querySelector('[data-study="<id>"]')`, calls `scrollIntoView` (not smooth under `prefers-reduced-motion`), and adds the class `sc-research-map-target` for 1600 ms. No element ids are used, because `ResearchBar` can be on the page twice (`TutorialBanner` and the Keep hall Lectern room). Nodes carry `data-map-node`, not `data-study`, so existing tests that slice cards by `data-study` still find the card first.
- **Mount:** one line in `ResearchBar.tsx`, after `AcademyLecternLivingGlyph` and before the tier sections. `Row` is untouched.
- **Styling (`packages/app/src/research-tree-map.css`):** every selector contains `.sc-research-map`. No keyframes, no animation. Decorative layers (link, bars, marks, meter) have `pointer-events: none`. Node buttons use `.sc-research-map .sc-research-map-node` so they win over the plain `button` rule in `theme.css` without editing it. Narrow layout uses `@container (max-width: 400px)` on the map itself. Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **Verification (`packages/app/src/ResearchTreeMap.test.tsx`):** 12 tests. `npm test` (sim 362, app 1148, server 158) and `npm run build -w @second-crown/app` pass.
- **Not verified:** not opened in a browser. Check the node button look against the theme, the 400px elbow layout, and the jump scroll inside the inspect card.
- **Possible follow-up (not done):** the lectern still lists all sixteen full cards under the map. A later slice could show only the card for the node that is clicked. That changes what many card tests expect, so it needs its own brief.

## 2026-11-13 — app / weather status line (wave/weather)

- **Component (`packages/app/src/hud/WeatherLine.tsx`):**
  - Exports `WeatherLine`, `weatherStatus`, `currentWeather`, `keepSightReach`, `WEATHER_ODDS`, `WEATHER_SEASON_TICKS`, `WEATHER_MARCH_SPEED`, `WEATHER_GATHER_YIELD`, `WEATHER_FOG_THICKNESS`, `WEATHER_NAMES`, `type WeatherKind`, and `type WeatherStatus`.
  - The sim does not export `weatherFor`, `marchSpeedFactor`, `gatherYieldFactor` or `fogThickness` from `packages/sim/src/index.ts`, and this slice may not edit the sim. So `currentWeather` repeats the roll (`createRngStreams(seed + floor(tick / 2000)).event()` against the season's odds table) and the three factor tables are copies. All are display-only.
  - Sight reach uses the sim's exported `visionRange` and the same comparison as `isProvinceSeen` (`d * thickness <= range`).
  - Left off the line: a storm also halves the rebuild timer a siege blow puts on a building (`buildingDamageFactor`). It is not vision, movement or yields.
- **Mounts:** `tabs/KingdomTab.tsx` under `DayNightLine`; `ProvinceInspect.tsx` under `DayNightLine`, gated on `seen`.
- **Styling (`packages/app/src/hud/weather-line.css`):** All selectors start with `.sc-weather-line`. No animation. Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **Verification (`packages/app/src/hud/WeatherLine.test.tsx`):** 19 tests. The test file imports `../../../sim/src/systems/weather` by relative path (test only) to pin the copies: roll equality over 300 seeds and 10 ticks, factor equality for all four skies, and sight reach against `isProvinceSeen` for every province with 0 to 6 watchtowers.
- **Render gap found, not fixed:** `resolveAtmosphereWeather` (`packages/render/src/atmosphere.ts`) probes the sim module for `weatherFor`. It is not exported, so the board, atlas and banners draw a season-guessed sky (for example always snow in Winter, tick-based rain in Spring) that can disagree with the rules' sky.
- **Possible follow-up (needs a sim edit, not done):** export `weatherFor` and the factor functions from `packages/sim/src/index.ts`. That lets this component drop its copies and makes the drawn sky match the rules with no render change.

## 2026-11-13 — app / living day-night wash & night building lanterns (bakeoff/gemini-day-night)

- **Components (`packages/app/src/hud/BoardDayNight.tsx`, `BoardLiving.tsx`):**
  - Exported `BoardDayNight`, `resolveDayNightDescriptor`, `listFinishedBuildingLanterns`, `type BoardDayNightPhase`, `type BuildingLanternPoint`, and `type DayNightWashDescriptor` from `hud/BoardDayNight.tsx` and re-exported from `BoardLiving.tsx`.
  - Uses `dayPhase(state)` and `isProvinceSeen(state, p.id)` from `@second-crown/sim` to tint seen isometric tiles and apply a full-board wash shifting from warm `dawn`/`day`/`dusk` to cool `night`, and renders `.sc-board-day-night-lantern` blooms + cores for finished buildings (`completesAtTick === null`) at night.
- **Styling (`packages/app/src/hud/board-day-night.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-day-night-wash-breathe`, `sc-day-night-lantern-bloom`, `sc-day-night-lantern-flicker`) with `pointer-events: none !important;`, `user-select: none;`, and `@media (prefers-reduced-motion: reduce)` guards; registered in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **Verification (`packages/app/src/hud/BoardDayNight.test.tsx`):**
  - 5 tests covering day-night phase descriptors, finished-building lantern filtering, day vs. night rendering, `BoardLiving` integration, and CSS isolation.

## 2026-11-13 — app / living season wash over isometric board (bakeoff/gemini-season-wash)

- **Components (`packages/app/src/hud/BoardSeasonWash.tsx`, `BoardLiving.tsx`):**
  - Exported `BoardSeasonWash`, `normalizeBoardSeason`, `resolveSeasonWashDescriptor`, `type BoardSeasonKey`, and `type SeasonWashDescriptor` from `hud/BoardSeasonWash.tsx` and re-exported from `BoardLiving.tsx`.
  - Uses `currentSeason(state)` and `isProvinceSeen(state, p.id)` from `@second-crown/sim` to tint seen isometric province diamonds (`.sc-board-season-wash-tile`), apply a subtle ambient gradient (`.sc-board-season-wash-ambient`), and soften unseen fog clusters (`.sc-board-season-wash-fog`) for `spring` (`#4ade80`), `summer` (`#fde047`), `autumn` (`#f59e0b`), and `winter` (`#bae6fd`).
- **Styling (`packages/app/src/hud/board-season-wash.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-season-wash-breathe`, `sc-season-tile-pulse`, `sc-season-fog-soften`) with `pointer-events: none !important;`, `user-select: none;`, and `@media (prefers-reduced-motion: reduce)` guards; registered in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **Verification (`packages/app/src/hud/BoardSeasonWash.test.tsx`):**
  - 5 tests covering season normalization, 4-season color resolution, tile tint & fog veil rendering with `pointer-events: none`, `BoardLiving` integration, and CSS isolation.

## 2026-11-13 — app / living keep banners & outpost flags with realm colors (bakeoff/gemini-keep-banners)

- **Components (`packages/app/src/hud/BoardBanners.tsx`, `BoardLiving.tsx`, `OverworldAtlas.tsx`):**
  - Exported `BoardBanners`, `BoardKeepBanners`, `resolveBannerRealmColors`, and `type BannerRealmColors` from `hud/BoardBanners.tsx` and re-exported from `BoardLiving.tsx`.
  - `resolveBannerRealmColors(realmId, isPlayer)` resolves canonical heraldic `pennant`, `accent`, `border`, `stud`, and `pole` colors from `realmTokenPalette` in `@second-crown/render` (with royal blue `#1d4ed8` / gold `#fbbf24` for player).
  - `BoardBanners` renders `.sc-board-keep-banner` on seen holds and `.sc-board-outpost-flag` on seen outposts/camps, including `.sc-board-banner-cloth`, `.sc-board-banner-ribbon`, `.sc-board-flag-cloth`, `.sc-board-flag-ribbon`, and `.sc-board-banner-finial-glint`.
  - Weather integration via `resolveAtmosphereWeather(state)` sets `is-storm`, `is-windy`, or `is-calm` on `.sc-board-living-banners`. Garrisoned player outposts (`getPostedGarrison`) display a golden honor streamer ribbon (`is-posted`).
  - Upgraded `MiniKeep` and `MiniCamp` in `OverworldAtlas.tsx` to use `resolveBannerRealmColors` and pass `occupantRealmId` to `MiniCamp`.
- **Styling (`packages/app/src/hud/board-banners.css`, `atlas-keeps.css`, `atlas-camps.css`, `living-glyph-soften.css`):**
  - Isolated keyframes (`sc-board-banner-flutter`, `sc-board-banner-storm`, `sc-board-flag-flutter`, `sc-board-ribbon-wave`, `sc-board-finial-glint`, `sc-atlas-keep-ribbon-wave`, `sc-atlas-flag-ribbon-wave`) anchored with `transform-box: fill-box; transform-origin: 0% 50%;`.
  - Strictly `pointer-events: none !important;` and `user-select: none;` on all decorative layers, registered in `living-glyph-soften.css`, with full `@media (prefers-reduced-motion: reduce)` guards.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **Verification (`packages/app/src/hud/BoardBanners.test.tsx`):**
  - 6 tests covering realm palette resolution, fog gating, storm wind state, `BoardLiving` integration, `OverworldAtlas` realm heraldry, and CSS isolation.

## 2026-11-12 — app / CSS & SVG hygiene audit pass 2 (bakeoff/gemini-css-hygiene-2)

- **Audit & Cleanup Scope (`packages/app`):**
  - Audited 137 CSS files against JSX/TSX usages and vitest assertions.
  - Removed dead/orphaned CSS rules and markers:
    - `packages/app/src/hud/atlas-effects.css`: removed `.sc-atlas-status-effect`, `.sc-atlas-status-weather-spark`.
    - `packages/app/src/hud/atlas-units.css`: removed `.sc-atlas-unit-glow`.
    - `packages/app/src/hud/button-pips.css`: removed `.sc-study-row`.
    - `packages/app/src/hud/copy-flash.css`: removed `.sc-copy-flash-group`.
    - `packages/app/src/hud/faction-seals.css`: removed `.sc-faction-row`.
    - `packages/app/src/hud/force-card.css`: removed `.sc-force-detail`, `.sc-force-captain`.
    - `packages/app/src/hud/hold-action-pip.css` & `hold-actions.css`: removed `.sc-hold-action-card .sc-leave-confirm`.
    - `packages/app/src/hud/inspect-card.css`: removed `.sc-inspect-stock-badge`.
    - `packages/app/src/hud/offer-card.css`: removed unused `.sc-offer-row`, `.sc-offer-tag`, `.sc-offer-side`, `.sc-offer-amt`, `.sc-offer-pip`.
    - `packages/app/src/keep-interior.css`: removed unused `.sc-keepin-facts`, `.sc-keepin-list`, `.sc-keepin-list-name`, `.sc-keepin-list-meta`.
    - Deleted unimported orphan file `packages/app/src/hud/leave-confirm.css`.
    - `packages/app/src/hud/living-glyph-soften.css`: purged dead/phantom selectors (`.sc-study-ink-pip`, `.sc-people-living-glow`, `.sc-people-living-footpath`, `.sc-people-living-pulse`).
- **Pointer-events Remediation:**
  - Resolved click-blocking risks by removing interactive containers `.sc-prestige-line` (which houses Ascend buttons) and `.sc-season-status-line` from `living-glyph-soften.css` blanket pointer-events disabling.
  - Enforced `pointer-events: none;` on decorative pips, dots, meters, bars, fills, and marks across 28 stylesheets:
    - `atlas-living.css`: `.sc-atlas-card-pip`
    - `roads-line.css`: `.sc-roads-pip`, `.sc-roads-mark`
    - `gift-line.css`: `.sc-gift-line-dot`
    - `season-claim-line.css`: `.sc-season-claim-dot`
    - `board-status.css`: `.sc-board-chip`, `.sc-board-chip-pip`
    - `academy-living.css`: `.sc-study-ledger-bar`, `.sc-study-ledger-fill`
    - `camp-living.css`: `.sc-camp-pip`
    - `decree-living-rows.css`: `.sc-decree-living-chip`, `.sc-decree-living-meter`, `.sc-decree-living-meter-fill`
    - `diplo-living-rows.css`: `.sc-diplo-living-chip`, `.sc-diplo-living-meter`, `.sc-diplo-living-meter-fill`
    - `event-advanced.css`: `.sc-event-next-meter`, `.sc-event-next-fill`
    - `event-living-rows.css`: `.sc-event-living-chip`, `.sc-event-living-meter`, `.sc-event-living-meter-fill`
    - `flag-living.css`: `.sc-flag-meter`, `.sc-flag-meter-fill`
    - `force-ledger.css`: `.sc-force-ledger-bar`, `.sc-force-ledger-fill`
    - `force-status.css`: `.sc-force-row-pip`, `.sc-force-row-bar`, `.sc-force-row-fill`
    - `hold-status-stack.css`: `.sc-holdstat-pip`
    - `job-status-stack.css`: `.sc-jobstat-pip`
    - `node-living.css`: `.sc-node-card-pip`
    - `outpost-living.css`: `.sc-outpost-card-pip`
    - `quest-living-rows.css`: `.sc-quest-living-chip`, `.sc-quest-living-meter`, `.sc-quest-living-meter-fill`
    - `stall-status.css`: `.sc-stall-row-pip`, `.sc-stall-row-bar`, `.sc-stall-row-fill`
    - `study-living-rows.css`: `.sc-study-living-chip`, `.sc-study-living-meter`, `.sc-study-living-meter-fill`
    - `unit-status.css`: `.sc-unit-row-pip`, `.sc-unit-row-bar`, `.sc-unit-row-fill`
    - `vault-living.css`: `.sc-vault-card-pip`
    - `work-status.css`: `.sc-workstat-pip`, `.sc-workstat-bar`, `.sc-workstat-fill`
    - `province-status-stack.css`: `.sc-provstat-pip`, `.sc-provstat-bar`, `.sc-provstat-bar-fill`
    - `research-tree.css`: `.sc-research-tree-link-mark`, `.sc-research-tree-numeral`
    - `research-advanced.css`: `.sc-research-adv-mark`, `.sc-research-adv-leads-mark`
    - `prestige-line.css` / `living-glyph-soften.css`: `.sc-prestige-bar`, `.sc-prestige-bar-fill`
- **Verification:**
  - `git diff origin/main -- packages/sim server packages/app/src/theme.css` verified empty (0 lines changed).
  - All unit test suites passing: sim 362, app 1043, server 158.
  - Production build clean (`tsc -b && vite build`).

## 2026-11-12 — app / living research glyphs showing locked, available, and completed states (bakeoff/gemini-research-advanced)

- **Components (`packages/app/src/hud/ResearchGlyphAdvanced.tsx` & `AcademyLivingGlyph.tsx`):**
  - Exports `ResearchGlyphAdvanced`, `ResearchAdvancedGlyph`, `LivingResearchGlyph`, `ResearchStateSvgLayer`, `resolveResearchGlyphState`, and `type ResearchGlyphState`.
  - State resolution:
    - `resolveResearchGlyphState({ status, state, progress, done })`: maps sim values to canonical `"locked" | "available" | "studying" | "completed"`.
  - SVG vector layers & animated elements:
    - Ambient breathing aura (`.sc-research-advanced-aura`) styled by state.
    - Locked: arched iron padlock shackle (`.sc-research-lock-shackle`), reinforced lock casing (`.sc-research-lock-casing`), keyhole rim and stem. Keyframes: `sc-research-adv-lock-breathe`, `sc-research-adv-lock-rattle`.
    - Available: radiant 4-point discovery diamond spark (`.sc-research-available-spark`), expanding beacon ripple ring (`.sc-research-available-beacon`), and white core dot. Keyframes: `sc-research-adv-avail-aura`, `sc-research-adv-beacon-wave`, `sc-research-adv-spark-twinkle`.
    - Studying: radial ink progress ring (`.sc-research-ink-progress-ring`), flickering scholar lamp flame (`.sc-research-studying-flame`). Keyframes: `sc-research-adv-study-aura`, `sc-research-adv-flame-flicker`, `sc-research-adv-ring-pulse`.
    - Completed: master scholar laurel wreath arc (`.sc-research-completed-wreath`), laurel leaf cluster dots (`.sc-research-wreath-leaf`), celestial triumph star (`.sc-research-completed-star`). Keyframes: `sc-research-adv-complete-aura`, `sc-research-adv-triumph-star`, `sc-research-adv-wreath-breathe`.
- **Styling (`packages/app/src/hud/research-glyph-advanced.css` & `living-glyph-soften.css`):**
  - Scoped strictly to `.sc-research-glyph-advanced`, `.sc-research-advanced-aura`, `.sc-research-state-layer`, `.sc-research-lock-*`, `.sc-research-available-*`, `.sc-research-studying-*`, `.sc-research-completed-*`.
  - All decorative wrappers, SVGs, and paths enforce `pointer-events: none !important;` and `user-select: none;`.
  - Added `.sc-shell .sc-research-glyph-advanced`, `.sc-shell .sc-research-state-layer` to Section 1 pointer-events reset and reduced-motion block in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **UI Integration (`packages/app/src/hud/AcademyLivingGlyph.tsx` & `ResearchBar.tsx`):**
  - `StudyLivingGlyph` and `StudyLivingUnderlay` render `<ResearchStateSvgLayer status={status} state={glyphState} progress={progress} />`.
  - Added `data-study-state` to research cards in `ResearchBar.tsx`.
- **Tests (`packages/app/src/hud/ResearchGlyphAdvanced.test.tsx`):**
  - 10 tests verifying state resolution, vector heraldry across all states, `StudyLivingGlyph` / `StudyLivingUnderlay` integration, `ResearchBar` mounting, and CSS isolation.
  - Full suite passing: sim 362, app 1024, server 158. App build clean.

## 2026-11-12 — app / living omen pips changing with event type and progress (bakeoff/gemini-events-advanced)

- **Components (`packages/app/src/hud/OmenPip.tsx`):**
  - Exports `OmenPip`, `LivingOmenPip`, `EventOmenPip`, `OmenLivingPip`, `resolveOmenVariant`, `resolveSpecificEventType`, `type OmenVariant`, and `type SpecificEventType`.
  - Resolution helpers:
    - `resolveOmenVariant(eventId, text)`: maps strings to canonical `"comet" | "raven" | "harvest"`.
    - `resolveSpecificEventType(eventId, text)`: maps strings to specialized `"harvest" | "timber" | "spoil" | "levy" | "tribute" | "other"`.
  - SVG vector layers & animated elements:
    - Dynamic atmospheric aura (`.sc-omen-aura`) with portented color themes.
    - Comet: diffuse tail (`.sc-omen-comet-tail-diffuse`), pulsing flame core (`.sc-omen-comet-core-flame`), 3 drifting star dust sparks, and twinkling 4-point head starburst (`.sc-omen-comet-head-gleam`). Tribute coin charm (`.sc-omen-tribute-coin-charm`).
    - Raven: stone perch, talons, descending tail feathers, folded wing bulk with breathing heave (`.sc-omen-raven-wing-fold`), feather ruffling (`.sc-omen-raven-feather-ruffle`), hackles, and blinking eye (`.sc-omen-raven-eye-gleam`). Spoilage miasma spore particles (`.sc-omen-spoil-miasma-mote`) and levy spear banner flutter (`.sc-omen-levy-banner-flutter`).
    - Harvest: crimson straw ribbon wrapper, descending stems, swaying center and fanning ears (`.sc-omen-harvest-sheaf-sway`, `.sc-omen-harvest-sheaf-sway-alt`), and golden sparkles (`.sc-omen-harvest-sparkle-1`, `2`). Timber windfall oak leaf and acorn charm (`.sc-omen-timber-leaf-flutter`).
    - Perimeter progress arc ring (`.sc-omen-progress-ring-fill`) with radius 10.8, SVG dash offset calculations from normalized `progress` (0.0 to 1.0), and tone classes (`is-pending`, `is-done`, `is-loss`, `is-latest`).
- **Styling (`packages/app/src/hud/omen-pip.css` & `living-glyph-soften.css`):**
  - Scoped strictly to `.sc-omen-pip-wrapper`, `.sc-omen-pip`, `.sc-omen-aura`, `.sc-omen-progress-ring-fill`, `.sc-omen-comet-*`, `.sc-omen-raven-*`, `.sc-omen-harvest-*`.
  - All decorative wrappers, SVGs, and paths enforce `pointer-events: none !important;` and `user-select: none;`.
  - Keyframe animations: `sc-omen-aura-breathe`, `sc-omen-tail-flicker`, `sc-omen-core-pulse`, `sc-omen-spark-drift`, `sc-omen-spark-drift-alt`, `sc-omen-gleam-twinkle`, `sc-omen-wing-heave`, `sc-omen-eye-blink`, `sc-omen-feather-quiver`, `sc-omen-ear-sway`, `sc-omen-ear-sway-alt`, `sc-omen-glint-pop`, `sc-omen-leaf-flutter`, `sc-omen-miasma-rise`, `sc-omen-pennant-wave`, `sc-omen-pending-ring-pulse`, `sc-omen-latest-ring-glow`.
  - Added `.sc-shell .sc-omen-pip-wrapper`, `.sc-shell .sc-omen-pip` to Section 1 pointer-events reset and reduced-motion block in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **UI Integration (`packages/app/src/hud/EventCard.tsx`):**
  - Passed `eventId`, `text`, `progress`, and `state` to `OmenPip` in `EventCard.tsx`.
- **Tests (`packages/app/src/hud/OmenPip.test.tsx`):**
  - 11 tests verifying variant resolution, specific event type mapping, progress rings, specialized charms, drop-in aliases, and CSS isolation.
  - Full suite passing: sim 362, app 1004, server 158. App build clean.

## 2026-11-11 — app / living road/trail glyphs and animated path marks on isometric board (bakeoff/gemini-board-roads)

- **Components (`packages/app/src/hud/BoardRoads.tsx`):**
  - Exports `BoardRoads`, `BoardRoadLiving`, `BoardRoutes`, `listBoardConnectedRoads`, `listBoardRoadJunctions`, `boardTerrainElevation`, `boardTileTop`, `pointsToSvgPath`, `type BoardConnectedRoad`, `type BoardRoadKind`, `type BoardRoadJunction`.
  - Isometric math & 3D polyline generation:
    - Pure `boardTerrainElevation(terrain)` returning accurate vertical face steps (`peak: 14, hill: 9, waste: 7, wood: 5, plain: 4, shore: 1`).
    - Pure `boardTileTop(x, y, terrain)` computing top surface vertices based on board origin `(236, 56)` and tile half dimensions `(22, 11)`.
    - Pure `pointsToSvgPath(points)` interpolating tile centers and shared edge midpoints into smooth isometric road paths.
  - Multi-tier road classifier:
    - Identifies non-duplicate grid neighbors (`[dx, dy]` in `[1, 0]` and `[0, 1]`).
    - Differentiates `highway` (both provinces visible and non-peak), `mountain-trail` (visible route traversing peaks), `fog-trail` (visible province reaching fog of war), and `shrouded` (unexplored).
    - Detects connected routes (`isConnectedToSelected`) when either endpoint matches `selectedId`, and flags active troop movements via `hasActiveMarch` (reading `listMarches(state)`).
  - SVG vector layers:
    - Base underlay ink bed (`.sc-board-road-underlay`).
    - Roadbed with warm packed-earth stroke (`.sc-board-road-bed`).
    - Mountain trails with dashed stroke (`.sc-board-path-dash`).
    - Pale road crown centerline (`.sc-board-road-crown`).
    - Fog edge wisps with subtle breathing opacity (`.sc-board-trail-fog-wisp`).
    - Connected route radiant aura (`.sc-board-route-glow`), animated directional flow dashes (`.sc-board-route-flow`), and pulsating beacons (`.sc-board-route-waymarker`).
    - March shimmer pulsing waves (`.sc-board-route-march-pulse`).
    - Moving caravan dots (`.sc-board-road-traveler`) and trailing dust puffs (`.sc-board-road-dust`).
    - Carved milestone junction markers (`.sc-board-road-junction`).
- **Styling (`packages/app/src/hud/board-roads.css` & `living-glyph-soften.css`):**
  - Scoped strictly to `.sc-board-living-roads`, `.sc-board-road`, `.sc-board-route-glow`, `.sc-board-route-flow`, `.sc-board-route-waymarker`, `.sc-board-road-traveler`, `.sc-board-road-dust`, `.sc-board-trail-fog-wisp`, `.sc-board-road-junction`.
  - All decorative wrappers, paths, and SVGs enforce `pointer-events: none !important;` and `user-select: none;`.
  - Keyframe animations: `sc-board-route-pulse`, `sc-board-route-dash-flow`, `sc-board-route-march-dash`, `sc-board-route-waymarker-pulse`, `sc-board-road-traffic-flow`, `sc-board-road-dust-puff`, `sc-board-trail-fog-breathe`.
  - Added `.sc-shell .sc-board-living-roads`, `.sc-shell .sc-board-road`, `.sc-shell .sc-board-road *`, `.sc-shell .sc-board-road-traffic-group`, `.sc-shell .sc-board-road-junction` to Section 1 pointer-events reset.
  - Added `.sc-shell .sc-board-route-glow`, `.sc-shell .sc-board-route-flow`, `.sc-shell .sc-board-route-waymarker`, `.sc-shell .sc-board-route-march-pulse`, `.sc-shell .sc-board-road-traveler`, `.sc-shell .sc-board-road-dust`, `.sc-shell .sc-board-trail-fog-wisp` to the reduced-motion block.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **UI Integration (`packages/app/src/BoardLiving.tsx`):**
  - Mounted `<BoardRoads state={state} selectedId={selectedId} />` at layer 0.8 (above terrain shading and beneath structures, keeps, and status tether).
  - Exported road helpers and components for board consumers.
- **Tests (`packages/app/src/hud/BoardRoads.test.tsx`):**
  - 17 tests verifying elevation maths, SVG paths, adjacency connectivity, fog boundaries, connected route selection, march detection, junction milestones, and CSS isolation.
  - Full suite passing: sim 362, app 969, server 158. App build clean.

## 2026-11-11 — app / living prestige crest or age seal pip on prestige status line (bakeoff/gemini-prestige-line)

- **Components (`packages/app/src/hud/PrestigePip.tsx`):**
  - Exports `PrestigePip`, `PrestigeCrestPip`, `AgeSealPip`, `LivingPrestigePip`, `PrestigeGlyphPip`, `PrestigeStatusLine`, `PrestigeLine`, `PrestigeTier` (0..4), `PrestigeEpoch` (`"mortal" | "second-dawn" | "ascendant" | "imperial" | "celestial" | "shared"`), `resolvePrestigeTier`, `resolvePrestigeEpoch`, and `resolvePrestigeTitle`.
  - Pure resolution helpers:
    - `resolvePrestigeTier(dawn)`: maps numerical dawn to 0..4 tier clamped with `Number.isFinite` guard against `NaN`.
    - `resolvePrestigeEpoch(dawn, shared)`: maps dawn and shared state to semantic epoch strings.
    - `resolvePrestigeTitle(dawn, ready, shared)`: produces accessible human-readable titles (e.g. `Prestige 2 · Age of Crowns · Ready to Ascend`).
  - Phrasing wrapper `<span className="sc-prestige-pip-wrapper">` with `aria-hidden="true"`, `data-prestige-pip="true"`, `data-prestige-tier={tier}`, `data-dawn={dawn}`, `data-epoch={epoch}`, `data-ready={ready}`.
  - SVG vector heraldry (24×24 viewBox):
    - Ambient aura glow (`.sc-prestige-aura` and `.sc-prestige-glow-layer`).
    - Ready shockwave ring (`.sc-prestige-ready-ring`, pulsing with `sc-prestige-ready-pulse`).
    - Tier-specific heraldic bodies:
      - Tier 0: rustic ashlar masonry arch and morning crescent (`.sc-prestige-horizon`).
      - Tier 1: solar disc and arching laurel wreath (`.sc-prestige-laurel`) with apex star (`.sc-prestige-star-1`).
      - Tier 2: dual coronet with twin heraldic stars (`.sc-prestige-star-1`, `.sc-prestige-star-2`).
      - Tier 3: imperial crown diadem with triple constellation stars (`.sc-prestige-star-1`, `.sc-prestige-star-2`, `.sc-prestige-star-3`).
      - Tier 4: celestial crown with diamond heart and quad constellation stars (`.sc-prestige-star-1`..`4`).
      - Shared: enduring sapphire monolith (`.sc-prestige-shared-group`).
    - Cardinal solar rays and starburst (`.sc-prestige-rays-group`).
  - `PrestigeStatusLine`: drop-in paragraph component combining `PrestigePip` with current dawn, resource threshold, and ascension notice.
- **Styling (`packages/app/src/hud/prestige-pip.css` & `living-glyph-soften.css`):**
  - Scoped strictly to `.sc-prestige-pip-wrapper`, `.sc-prestige-line`, `.sc-prestige-svg`, `.sc-prestige-aura`, `.sc-prestige-ready-ring`.
  - All decorative wrappers, SVGs, and rings enforce `pointer-events: none !important;` and `user-select: none;`.
  - Keyframe animations: `sc-prestige-breathe`, `sc-prestige-ready-pulse`, `sc-prestige-star-twinkle`, `sc-prestige-solar-flare`, `sc-prestige-rays-shimmer`.
  - Added `.sc-shell .sc-prestige-pip-wrapper`, `.sc-shell .sc-prestige-line`, `.sc-shell .sc-prestige-svg`, `.sc-shell .sc-prestige-aura`, `.sc-shell .sc-prestige-ready-ring` to Section 1 pointer-events reset and reduced-motion block in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **UI Integration (`packages/app/src/AgeLine.tsx`):**
  - Enriched `AgeLine` with `.sc-prestige-line`, `data-prestige={dawn}`, `data-prestige-tier={tier}`.
  - Enhanced `AgeGlyphPip` to add dynamic prestige crest star elements (`.sc-prestige-pip-tier-star`) while strictly maintaining all existing attributes (`data-age-glyph`, `is-waiting`, `is-ready`, `style`, etc.) expected by existing tests.
  - Exported drop-in aliases: `PrestigeLine`, `PrestigeStatusLine`, `PrestigeCrestPip`, `AgeSealPip`, `LivingPrestigePip`.
- **Tests (`packages/app/src/hud/PrestigePip.test.tsx`):**
  - 16 tests covering tier resolution, epoch resolution, SVG layers across tiers 0..4+, readiness rings, shared holds, `PrestigeStatusLine` integration with GameState, and CSS isolation.

## 2026-11-11 — app / fix: restore ResearchCostRow on living study cards (main)

- **Cause:** `3b9516d` (living research glyphs) was built on a `ResearchBar.tsx` from before `ba9acb7`, so merging it removed the `ResearchCostRow` import and mount, the `busyWith` prop on `Row`, and the short Study label. `ResearchCost.tsx` and its test stayed, so 3 tests in `ResearchCost.test.tsx` failed (`data-study-cost`, "Stores cover it. Ready to study.", "Paid.").
- **Fix in `ResearchBar.tsx`:** `Row` takes optional `busyWith` again (name of a different open study, passed from `ResearchBar`); `ResearchCostRow` is mounted after `StudyLivingGlyph`, right above the Study button; label is `Study <name> (<seconds>s)`; the unused `gate` string is gone. The ink pip badge, `progress` maths, `data-progress`, and `progress` props on the living glyphs are untouched.
- **Docs note:** the same commit had also overwritten the Cost row entries in these four docs; see git history (`ba9acb7`) for the full original write-up of `ResearchCost.tsx`.
- **Tests:** sim 362, app 936, server 158 (1 skipped: symlink permission on Windows). `npm run build -w @second-crown/app` clean.
- **Not verified:** not opened in a browser; static-markup tests only.

## 2026-11-11 — app / living research glyphs and ink pips changing with research progress (bakeoff/gemini-research-tree)

- **Components (`packages/app/src/hud/ResearchInkPip.tsx`):**
  - Exports `ResearchInkPip`, `StudyInkPip` alias, `InkPip` alias, `ResearchProgressPip` alias, `ResearchInkDroplets`, `calcResearchProgress`, `resolveInkStage`, `formatInkStatus`, and `InkStage` type (`"locked" | "open" | "stage-1" | "stage-2" | "stage-3" | "stage-4" | "known"`).
  - Pure calculation helpers:
    - `calcResearchProgress({ done, ticksLeft, ticksTotal, duration })`: computes normalized 0.0..1.0 progress clamped.
    - `resolveInkStage(progress, status)`: maps progress percentage and status to ink stages.
    - `formatInkStatus(progress, status)`: returns accessible summary text.
  - Phrasing wrapper `<span className="sc-research-ink-pip sc-ink-pip-wrapper">` with `aria-hidden="true"`, `data-ink-pip="true"`, `data-ink-stage={stage}`, `data-progress={pct}`, `data-status={status}`.
  - Multi-layer SVG vector artwork (24×24):
    - `.sc-ink-pot-hull`, `.sc-ink-pot-rim`, `.sc-ink-pot-opening`: stoneware inkpot with lip rim and internal well.
    - `.sc-ink-fluid-rect`: dynamic ink level calculated via `fluidHeight = progress * reservoirMaxHeight` and clipped to internal well shape.
    - `.sc-ink-surface-ripple`: gentle animated ripple curve across ink meniscus.
    - `.sc-ink-quill`: angled goose quill dipped in ink; animates with transcription bobbing motion (`sc-ink-quill-dip`) when studying.
    - `.sc-ink-drift-layer`: rising scriptorium ink vapor motes (`sc-ink-mote-rise`).
    - `.sc-ink-star-glint`: 4-point scholar star twinkle when study is mastered/codified.
    - `.sc-ink-cap-seal`: stone capped seal when locked.
  - `ResearchInkDroplets`: 4-bead mini ink droplet track with states `empty`, `active`, and `filled` tracking 25% increments.
- **Styling (`packages/app/src/hud/research-ink-pip.css` & `living-glyph-soften.css`):**
  - All decorative wrappers, SVGs, tracks, and layers enforce `pointer-events: none !important;` and `user-select: none;`.
  - Added `.sc-shell .sc-research-ink-pip`, `.sc-shell .sc-study-ink-pip`, `.sc-shell .sc-ink-pip-wrapper`, `.sc-shell .sc-study-ink-badge`, `.sc-shell .sc-ink-pot-container`, `.sc-shell .sc-ink-droplet-track` to Section 1 pointer-events reset and reduced-motion block in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **UI Integration:**
  - `packages/app/src/ResearchBar.tsx`:
    - Evaluates `progress = done ? 1 : left > 0 ? Math.min(1, Math.max(0, 1 - left / effectiveTotal)) : 0`.
    - Mounts `.sc-study-ink-badge` in top-right corner of each study card with `<ResearchInkPip size={18} showDrops={status === "studying"} />`.
    - Passes `progress` to `StudyLivingUnderlay` and `StudyLivingGlyph`.
    - Sets `data-progress` on `.sc-study-living-card`.
  - `packages/app/src/hud/AcademyLivingGlyph.tsx`:
    - `resolveStudyLiving`: accepts `progress?: number`; when studying and progress is defined, outputs `scribes ink (N%)` (preserving `"scribes ink"` substring match).
    - `StudyLivingGlyph`: renders `.sc-research-ink-progress-ring` around discipline emblem when studying with dynamic stroke dashoffset.
- **Tests:**
  - `packages/app/src/hud/ResearchInkPip.test.tsx` (9 tests) covering pure helpers, SVG markup, ink stages, 4-bead droplets, `ResearchBar` integration, and CSS isolation.
  - Full test suite passing: sim 362, app 927, server 158. App build clean.

## 2026-11-11 — app / living seasonal crest or weather pip on season status line (bakeoff/gemini-season-claim)

- **Components (`packages/app/src/hud/SeasonPip.tsx`):**
  - Exports `SeasonPip`, `SeasonalCrestPip` alias, `SeasonWeatherPip` alias, `SeasonStatusLine`, `SeasonName` type (`"spring" | "summer" | "autumn" | "winter"`), `SEASONS`, `SEASON_COLORS`, `SEASON_WEATHER`, `normalizeSeason(raw?: string): SeasonName`.
  - Props: `season?: string` (normalized via `normalizeSeason`), `claimed?: boolean`, `ready?: boolean`, `size?: number` (default 24), `className?: string`, `style?: React.CSSProperties`, `showReadyRing?: boolean`, `ariaLabel?: string`.
  - Phrasing wrapper `<span className="sc-season-pip-wrapper">` with `aria-hidden="true"`, `data-season-pip="true"`, `data-season={s}`, `data-claimed={claimed ? "true" : undefined}`, `data-ready={isReady ? "true" : undefined}`.
  - Multi-layer SVG vector artwork (24×24):
    - `.sc-season-glow-layer`: breathing atmospheric aura glow matching seasonal palette (spring green `#4ade80`, summer gold `#facc15`, autumn copper `#fb923c`, winter cyan `#38bdf8`).
    - `.sc-season-ready-ring`: expanding radial pulse ripple when `isReady` (e.g. season claim ready).
    - `.sc-season-drift-layer`: season-specific motes (pollen particles for spring, solar heat shimmer for summer, swirling gale motes for autumn, snow flurries for winter).
    - `.sc-season-emblem-base`: vernal sprout & 5-petal flower (spring), solar disc with cardinal rays and flame arcs (summer), lobed leaf with veins and twin acorns (autumn), 6-fold barbed crystalline snowflake with faceted diamond core (winter).
    - `.sc-season-glint-layer`: 4-point dewdrop/flare/star/crystal glints.
  - `SeasonStatusLine` component: `<span className="sc-season-status-line">` combining `SeasonPip` with status text or custom children, supporting `ready`, `claimed`, and custom pip sizing.
- **Styling (`packages/app/src/hud/season-pip.css` & `living-glyph-soften.css`):**
  - All decorative wrappers, SVGs, rings, and layers enforce `pointer-events: none !important;` and `user-select: none;`.
  - Keyframes: `sc-season-glow-pulse`, `sc-season-ready-ring`, `sc-season-mote-float`, `sc-season-wind-swirl`, `sc-season-glint-flare`.
  - Added `.sc-shell .sc-season-pip-wrapper` and `.sc-shell .sc-season-status-line` to Section 1 pointer-events reset and reduced-motion block in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **UI Integration:**
  - `packages/app/src/tabs/CrownTab.tsx`: mounted `SeasonPip` inside `.sc-work-head` of Season Court card; upgraded `.sc-work-status` to use `SeasonStatusLine`.
  - `packages/app/src/ProvinceInspect.tsx`: mounted `SeasonPip` inline with `seasonNote` and in `.sc-inspect-season` tile stats grid cell.
  - `packages/app/src/tabs/KingdomTab.tsx`: mounted inline `SeasonPip` beside `{season}` in the hold summary strip.
- **Tests:**
  - `packages/app/src/hud/SeasonPip.test.tsx` (13 tests) covers season normalization, multi-layer SVG elements, aura glows, ready/claimed states, sizing, aria-hidden, CrownTab/ProvinceInspect/KingdomTab integration, and CSS safety.
  - Full test suite (sim 362, app 907, server 158) passing cleanly. App build clean.

## 2026-11-11 — app / fix: restore `gift?: GiftOffer` on RealmCard and the GiftLine on WorldPanel

- **Cause:** the gift pip slice overwrote `hud/RealmCard.tsx` and `WorldPanel.tsx` from before the gift offer slice, losing the `gift` prop, `GiftLine`, the `sc-gift-btn` class, and `disabled={!gift.ok}`. `WarRoom.tsx` kept passing `gift={giftOffer(state, r.id)}`, so `tsc` failed.
- **`RealmCard`:** `gift?: GiftOffer` prop. Renders `<GiftLine offer={gift} />` before `.sc-realm-dip-actions` when `gift` and `onGift` are both set. Gift button carries both `sc-realm-gift-btn` and `sc-gift-btn`, is `disabled` when `gift` is given and not ok, and labels itself with `giftButtonLabel(gift)`. `resolveGiftStatus` gets `giftAvailable: props.giftAvailable ?? gift?.ok`, so the pip agrees with the sim offer (including the opinion cap).
- **`WorldPanel`:** computes `giftOffer(state, r.id)` per crown card; same line, gate, and `giftAvailable: gift.ok`; button text uses `gift.cost`.
- **Lesson:** when two slices touch the same file, merge rather than replace the file (see AGENTS.md, "Do not run two agents on the same files without a merge plan").

## 2026-11-11 — app / living gift and tribute pips on diplomacy realm cards (bakeoff/gemini-diplomacy-gifts)

- **Components (`packages/app/src/hud/GiftPip.tsx`):**
  - Exports `GiftPip`, `TributePip` alias, `GiftStatus` (`"available" | "just-sent" | "unaffordable"`), `GIFT_GOLD_COST` (15), `GIFT_JUST_SENT_TICKS` (40 ticks / 4s).
  - Pure evaluation helpers:
    - `isGiftAvailable(state?: GameState, cost?: number): boolean`: checks `Number(state.resources.gold) >= cost`.
    - `giftJustSentTicksAgo(state?: GameState, realmId?: string, windowTicks?: number): number | null`: queries `state.inputLog` in reverse for `entry.type === "gift"` targeting the realm within `windowTicks`.
    - `isGiftJustSent(state?: GameState, realmId?: string, windowTicks?: number): boolean`.
    - `resolveGiftStatus(options)`: returns `"just-sent"`, `"available"`, `"unaffordable"`, or `null`.
  - Phrasing wrapper `<span className="sc-gift-pip-wrapper">` with `aria-hidden="true"`, `data-gift-pip="true"`, `data-gift-status={status}`.
  - Multi-layer SVG vector artwork (24×24):
    - `.sc-gift-glow-layer`: breathing gold aura glow.
    - `.sc-gift-sent-ping`: expanding radial ripple shockwave ring when `status === "just-sent"`.
    - `.sc-gift-drift-layer`: corner coin sparkles (`.sc-gift-sparkle`) and ascending gold motes (`.sc-gift-mote`).
    - `.sc-gift-chest-base`: domed coffer lid, casket body, gilded iron straps, lock plate, keyhole, and hanging swallowtail ribbon seal.
    - `.sc-gift-pulse-layer`: 4-point royal star glint on the lock clasp (`.sc-gift-glint-star`).
- **Styling (`packages/app/src/hud/gift-pip.css` & `living-glyph-soften.css`):**
  - All decorative wrappers, SVGs, badges, and layers enforce `pointer-events: none !important;` and `user-select: none;`.
  - Keyframes: `sc-gift-glow-breathe`, `sc-gift-sparkle-pulse`, `sc-gift-sent-ping`, `sc-gift-motes-drift`, `sc-gift-glint-flare`, `sc-realm-gift-badge-pulse`.
  - Added `.sc-shell .sc-gift-pip-wrapper` and `.sc-shell .sc-realm-gift-badge` to Section 1 pointer-events reset and reduced-motion overrides in `living-glyph-soften.css`.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **UI Mounting:**
  - `packages/app/src/hud/RealmCard.tsx`: accepts `state?: GameState`, `giftStatus?: GiftStatus`, `giftAvailable?: boolean`, `giftJustSent?: boolean`. Mounts `.sc-realm-gift-badge` in top-right corner when a gift is available or just sent, and embeds `GiftPip` inside `.sc-realm-gift-btn`.
  - `packages/app/src/WarRoom.tsx`: passes `state={state}` to `RealmCard`.
  - `packages/app/src/WorldPanel.tsx`: mounts `.sc-realm-gift-badge` and embeds `GiftPip` inside the "Send 15 Gold Tribute" button for Known Crowns cards.
- **Tests:**
  - `packages/app/src/hud/GiftPip.test.tsx` (12 tests) covers pure state helpers, SVG sizing, aria-hidden, data attributes, `RealmCard` and `WorldPanel` integration, and CSS isolation.
  - Sim 356, app 885, server 158 pass. App build clean.

## 2026-11-11 — app / distinct 28px living chips for each culture's unique unit (bakeoff/gemini-culture-units)

- **Components (`packages/app/src/hud/CultureUnitChip.tsx`):**
  - Exports `CultureUnitChip`, `CultureUnitChipProps`, `CULTURE_UNIQUE_UNITS`, `UNIT_TO_CULTURE`, `isCultureUniqueUnit`, `cultureForUniqueUnit`.
  - Props: `cultureId?: CultureId`, `unitId?: string`, `size?: number` (default 28), `open?: boolean` (default true), `className?: string`, `style?: React.CSSProperties`, `title?: string`.
  - Phrasing wrapper `<span className="sc-culture-unit-chip-container">` with `aria-hidden="true"`, `data-culture-unit-chip="true"`, `data-unit-culture={resolvedCultureId}`, `data-unit={resolvedUnitId}`, `data-open={open}`.
  - Returns `null` if the culture has no unique unit (`western`, `woodland`, `desert`, `steppe`, `tide`).
  - Uses `data-unit-culture` rather than `data-culture` to avoid colliding with `CultureCrestPip` selectors in `CultureCrestPip.test.tsx`.
- **Living chip upgrades:**
  - Upgraded `RangerChip.tsx`, `BannerChip.tsx`, `OutriderChip.tsx`, `WardenChip.tsx`, `LancerChip.tsx` with dedicated SVG viewBox (28×28), crisp geometry, and three distinct animated layers:
    - `.sc-*-glow-layer`: breathing colored aura behind the heraldic emblem (mist blue, highland emerald, salt silver, fen moss, alpine frost cyan).
    - `.sc-*-drift-layer` / `.sc-*-sway-layer`: subtle thematic particle/sway motion (fog motes, pennant flutter, dust drift, reed sway, frost motes).
    - `.sc-*-pulse-layer` / `.sc-*-glint-layer`: periodic twinkle glint on weapon tips, helm stars, and keen eye targets.
  - Preserved all historical class names (`sc-ranger-cloak`, `sc-banner-spear`, `sc-outrider-horse`, `sc-warden-spear`, `sc-lancer-lance`, `is-open`, etc.) to maintain 100% backwards compatibility with existing render tests in `packages/render/src/index.test.ts`.
- **Styling (`packages/app/src/hud/culture-unit-chip.css`, `ranger-chip.css`, `banner-chip.css`, `outrider-chip.css`, `warden-chip.css`, `lancer-chip.css`, `living-glyph-soften.css`):**
  - All chips and containers enforce `pointer-events: none !important;` and `user-select: none;`.
  - Keyframes: `sc-ranger-glow-breathe`, `sc-ranger-mist-drift`, `sc-ranger-glint-pulse`, `sc-banner-glow-breathe`, `sc-banner-pennant-flutter`, `sc-banner-glint-pulse`, `sc-banner-mote-drift`, `sc-outrider-glow-breathe`, `sc-outrider-dust-drift`, `sc-outrider-glint-pulse`, `sc-warden-glow-breathe`, `sc-warden-reed-sway`, `sc-warden-glint-pulse`, `sc-lancer-glow-breathe`, `sc-lancer-frost-drift`, `sc-lancer-glint-pulse`.
  - Added `.sc-shell .sc-culture-unit-chip-container` and all unit chip wrappers to Section 1 pointer-events reset in `living-glyph-soften.css`.
  - `@media (prefers-reduced-motion: reduce)` disables all animations and transitions.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **UI Mounting:**
  - `packages/app/src/CulturePicker.tsx`: In `.sc-culture-line`, when `line.unit` is present, renders `<CultureUnitChip cultureId={c.id} size={28} open={true} />` adjacent to the unit name.
  - `packages/app/src/BalanceNotes.tsx`: In the culture breakdown table, renders `<CultureUnitChip cultureId={c.id} size={18} open={true} />` in the unique unit cell.
  - Kept `packages/app/src/CultureLine.tsx` child structure strictly unchanged to prevent breaking `CultureLine.test.tsx` (which expects button at `el.props.children[2]`).
- **Tests:**
  - New test suite `packages/app/src/hud/CultureUnitChip.test.tsx` (10 tests) covers all cultures, sizing, open prop, aria-hidden, data attributes, and CSS safety.
  - Sim 340, app 872, server 158 pass. App build clean.

## 2026-11-11 — app / living heal glow and bandage pips for wounded unit chips (bakeoff/gemini-infirmary)

- **Components (`packages/app/src/hud/BandagePip.tsx`):**
  - Exports `BandagePip`, `WoundedChip`, and `WoundedUnitChip` (phrasing-only `<span>` + `<svg>`).
  - Props: `size?: number`, `active?: boolean`, `wounded?: boolean`, `className?: string`, `style?: React.CSSProperties`, `title?: string`.
  - Markup attaches `aria-hidden="true"`, `data-bandage-pip`, `data-healing={isHealing}`, `data-wounded={wounded}`, and classes `.is-healing` or `.is-calm`.
  - Visual layers: `.sc-heal-glow-layer` (emerald breath glow), `.sc-heal-aura-ring` (dashed spinning ring), `.sc-heal-drift-layer` (rising motes), `.sc-heal-bandage-base` (diagonal linen bandages with stitch lines), `.sc-heal-pulse-layer` (center restorative cross: emerald #86efac when healing, red #fca5a5 when calm).
- **UnitCard & Tabs wiring:**
  - `packages/app/src/hud/UnitCard.tsx`: added `wounded?: number` and `healing?: boolean` to `UnitCardProps`. When `wounded > 0`, `.sc-unit-art` gains `.has-wounded` (relative position) and `.is-healing` (soft emerald drop-shadow and keyframe pulse), rendering `.sc-unit-chip-bandage-badge` with a 12px `BandagePip`.
  - `packages/app/src/tabs/ArmyTab.tsx`: checks `autoHealActive(state)` and manual `listHealing(state).length > 0`. Passes `wounded` and `healing` to Militia `UnitCard` (since wounded return as militia), and renders a 20px `BandagePip` inside `.sc-work-head` of the Wounded card.
  - `packages/app/src/hud/BedPip.tsx` & `packages/app/src/KeepInterior.tsx`: `BedPipProps` accepts `healing?: boolean`. In `YardRoom`, active auto-healing or manual treat renders emerald cross `.sc-bed-cross.is-healing`.
- **Styling (`packages/app/src/hud/infirmary-heal-living.css` & `living-glyph-soften.css`):**
  - All decorative elements have `pointer-events: none !important;` and `user-select: none;`.
  - Keyframe animations: `sc-heal-glow-breathe` (2.6s), `sc-heal-aura-spin` (10s), `sc-heal-mote-rise` (3.4s), `sc-heal-cross-pulse` (2.2s), `sc-heal-chip-pulse` (2.8s).
  - Softening rules under `.sc-shell` prevent contrast degradation against card text and buttons.
  - `@media (prefers-reduced-motion: reduce)` disables all animations and transitions.
  - Zero edits to `theme.css`, `packages/sim`, or `server/`.
- **Tests:** `packages/app/src/hud/BandagePip.test.tsx` (7 tests) validates static HTML rendering, active/calm data attributes, glow layers, UnitCard integration, pointer-events, and reduced motion CSS guards. Sim 340, app 862, server 158 pass. App build clean.

## 2026-11-11 — sim + app / Infirmary auto-heal tick (wave/infirmary-heal, not merged)

- **Rule.** `autoHealTick(state, tick)` in `packages/sim/src/systems/ward.ts`: if `tick % AUTO_HEAL_EVERY === 0` and `autoHealActive(state)`, move `autoHealAmount(wounded)` from `flags.wounded_player` to player militia. `AUTO_HEAL_EVERY = 100`, `AUTO_HEAL_SHARE = 10`, amount = `ceil(wounded / 10)`. Free, no `inputLog` entry (it is not a player input).
- **Staffed** = `infirmaryStaffed(state)`: a player `infirmary` with `completesAtTick === null` and a player citizen whose job is the Infirmary job (`scholar`) standing on its tile. Same tile match as the staff bonus in `economy.ts`. A scarred Infirmary has a non-null `completesAtTick`, so it does not heal.
- **Footgun: it is an event, not a per-tick step.** `WardSystem.tick()` and `advanceAnalytic()` are still empty. Healing runs from `processEventsAt`, and `nextEventTick` returns the next multiple of 100 while healing is active, so `settleTicks` fine-ticks across it. Do not move the heal into `tick()`: a batch would skip it and offline would stop matching online (invariant 2). The test "settles a batch the same as tick by tick" guards this.
- **Footgun: integer share.** The share is a divisor, not `wounded * 0.1`. `30 * 0.1` is `3.0000000000000004` in floats and would round up to 4.
- **Cadence is global.** Heal ticks sit on world ticks 100, 200, ... rather than "100 ticks after the wound", so nothing new is stored in the save. The first heal after a battle can come sooner than 10s.
- **No save change.** No new flags. `clearRunJobs` on Second Dawn already clears `wounded_player`.
- **`countBuilding(state, "infirmary")` counts every realm**; `infirmaryStaffed` filters to the player on purpose.
- **App.** `packages/app/src/InfirmaryHealLine.tsx` exports `infirmaryHeal(state)` (pure read: `healing` / `unstaffed` / null) and `InfirmaryHealLine`, mounted in the Wounded card in `tabs/ArmyTab.tsx` under the status line. Styles in `infirmary-heal.css` (pulse dot honours reduced motion). The Keep Hall Yard room does not show the line yet.
- **Not changed.** The Infirmary blurb in `content/buildings.ts` does not mention auto-heal yet. `UpkeepPace` "next change" still only looks at training and manual treat jobs, not the next heal tick.
- **Tests.** `ward.test.ts` (8 new), `InfirmaryHealLine.test.tsx` (4). Sim 340, app 855, server 158. `packages/render` has 3 failures in `index.test.ts` (DecreeCard / QuestCard / EventCard pips) that are already on `origin/main`.

## 2026-11-11 — app / living glyphs and visual flair for research tree tier II (bakeoff/gemini-research-tree)

- **Components:** `packages/app/src/hud/AcademyLivingGlyph.tsx` exports `isTierTwoStudy`, `TIER_TWO_TOPICS`, and keeps `TIER_TWO_EMBLEM` for reference. `TopicEmblemSvg` now implements bespoke SVG paths for all 16 topics (6 tier II + 10 tier I), eliminating the tier I emblem fallback.
- **Bespoke artwork:**
  - `crop_rotation` (agronomy): four-quadrant fallow cycle with clover bloom, barley ear, furrow polylines, turning plow curve, and seasonal orbital motes.
  - `timber_framing` (agronomy): king-post truss with tie beam, rafters, king post, diagonal braces, dowel peg circles, and plumb bob weight.
  - `fortification` (masonry): crenellated bastion parapet, battered wall base, machicolation corbels, crosslet arrow slit, and watchfire star.
  - `supply_trains` (cartography): Conestoga wagon bonnet, bed, hitch tongue, spoked wheels, and tail lantern.
  - `cartography` (cartography): folded map sheet with creases, coastline contour, rhumb line, astrolabe sight, and 8-point compass rose.
  - `quartermastery` (tactics): beam balance scale, ration and taler pans, chevron insignia, equilibrium pointer, and weighed coin motes.
- **Tier II markup & CSS:**
  - `StudyLivingUnderlay` and `StudyLivingGlyph` attach `data-study-tier="2"` and `is-tier-2` on tier II topics.
  - `hud/academy-glyph-living.css`: added `.sc-research-living-underlay.is-tier-2` (amber drop shadow, opacity 0.24 studying), `.sc-research-topic-glyph.is-tier-2` icon drop-shadow, and `@keyframes sc-research-link-glow` animating `.sc-research-tree-link.is-met .sc-research-tree-link-mark`.
  - `hud/living-glyph-soften.css`: capped `.sc-shell .sc-research-living-underlay.is-tier-2` at opacity 0.13 (0.16 active/studying), svg at 0.30.
  - Reduced-motion support in `academy-glyph-living.css` covers all new keyframes and link glows.
  - `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `AcademyLivingGlyph.test.tsx` (13 tests) checks all 16 distinct SVG emblems (`new Set(svgs).size === 16`), `is-tier-2` and `data-study-tier="2"` markup, tier II descriptors, and CSS isolation. Full test suite (332 sim, 852 app, 158 server) passing.

## 2026-11-10 — sim + app / research tree, six tier II lectern studies (wave/research-tree, not merged)

- **Spec.** Tier II = a `RESEARCH` entry with `requires: <tier I id>`. Tier I entries have no `requires`. Ticks below are table values; `researchDuration` still applies the Academy x0.8.

| Study | Builds on | Needs | Cost | Time | Effect |
|---|---|---|---|---|---|
| Crop rotation (`crop_rotation`) | Husbandry | granary or academy, Keep II | 60 food, 30 wood, 20 gold | 28s | another +10% food from farms and granaries (22% with Husbandry) |
| Timber framing (`timber_framing`) | Forestry | sawmill or academy, Keep II | 60 wood, 30 food, 20 gold | 28s | another +10% wood from lumber camps and sawmills (22% with Forestry) |
| Fortification (`fortification`) | Masonry | mason or academy, Keep III | 70 stone, 40 wood, 30 gold | 32s | another +10% stone; finished walls hold another +24 HP (40 with Masonry) |
| Supply trains (`supply_trains`) | Logistics | market or academy, Keep III | 60 gold, 50 wood, 40 food | 34s | +100 warehouse space; one more column, still limited by the Keep |
| Cartography (`cartography`) | Surveying | watchtower or academy, Keep III | 50 gold, 30 wood | 30s | hold vision +1 tile (2 with Surveying); scouting costs 4 gold less |
| Quartermastery (`quartermastery`) | Drill | barracks or academy, Keep II | 50 food, 45 gold, 30 wood | 30s | training costs 8% less |

- **Table (`packages/sim/src/systems/research.ts`).** Six entries appended after `siege`, so `Object.keys(RESEARCH)` keeps tier I first (the hint, pace and academy lines walk the table in order). IDs are snake_case and permanent (invariant 8). `unlocks` is `[]` on all six, so `ResearchPace.nextUnlock` ignores them.
- **Helpers (same file).** `researchRequires(id): ResearchId | null`, `researchTier(id): 1 | 2`, `researchPrereqReady(state, id)` are exported from `@second-crown/sim` along with the `ResearchId` type. Internal to the sim: `cartographyScoutDiscount` (4), `supplyTrainsColumnBonus` (1), `quartermasteryTrainMult` (0.92).
- **Gate.** `tryStartResearch` returns false when `researchPrereqReady` is false, before any cost is taken. Cancel and refund are unchanged and work for tier II.
- **Effect wiring.**
  - `researchYield`: food / wood / stone add 0.10 on top of the tier I 0.12 (additive, 0.22 total). Gold is unchanged.
  - `masonryWallBonus`: 16 + 24 with Fortification (read by `fortificationPower` and `defenseBonus` in `combat.ts`).
  - `surveyingVisionBonus`: 1 + 1 with Cartography (read by `fog.visionRange`).
  - `fog.scoutCost`: `max(12, 22 - 2 * watchtowers) - cartographyScoutDiscount`, so the floor drops from 12 to 8.
  - `labor.maxMarches`: `+ supplyTrainsColumnBonus`, still clamped by `currentKeepGate(state).marchCap`.
  - `storage.storageCap`: `+ supplyTrainsBonus` (100). `storage.ts` cannot import `research.ts` without a cycle, so it reads `flags.research_supply_trains` and also `research_supply_trains_until <= tick`. That makes the cap correct from the finish tick without anyone calling `researchDone` first.
  - `train.trainCostMultiplier`: `m *= quartermasteryTrainMult` before the existing 0.45 floor.
- **Known quirk left alone.** The older `logisticsBonus` in `storage.ts` reads only `flags.research_logistics`, which is set lazily by `researchDone` / `researchTicksLeft`. The +50 therefore appears on the first read after the finish tick rather than exactly on it. Not changed in this slice.
- **UI (`packages/app/src/ResearchBar.tsx`).** Rows are grouped with `researchTier` into `<section class="sc-research-tree-tier" data-research-tier="1|2">` with a heading and known count. `Row` reads `researchRequires` / `researchPrereqReady`, adds `data-tier`, the `sc-research-tree-link` "Builds on" line, and disables Study when the prerequisite is missing. `ResearchCard` / `ResearchLivingCard` aliases unchanged.
- **Ledger (`hud/StudyLedger.tsx`).** `studyStatus` takes optional `prereqOk` (false → `locked`); `studyLedgerRows` takes optional `prereq` / `prereqOk` and puts "needs <study>" first in the name row's sub line. Both default to the old behaviour.
- **Other app files.** `ResearchHint.nextResearch` adds the prerequisite to its ready check and to the "needs" text. `StudyLine` has boost text for the six. `hud/AcademyLivingGlyph.tsx` adds folio labels, discipline cases and `TIER_TWO_EMBLEM` (a tier II card draws its tier I emblem, so there are still 10 distinct emblems for 16 topics).
- **CSS.** New `packages/app/src/research-tree.css`, every selector under `.sc-research-tree-*` (asserted by test). `theme.css` untouched.
- **Balance.** All six sets of numbers are first-pass and untested in play. Costs stay under the base warehouse caps (gold 100, wood / stone 150, food 200) so each is affordable without storage buildings.
- **Tests.** `systems/research.test.ts` "tier II studies" (9 tests): prerequisite and Keep gates, refund, stacking yields, wall HP, vision and scout fee, storage and columns, finish-tick storage, training multiplier. `ResearchTree.test.tsx` (9 tests): tier sections and counts, sealed vs open card, Cancel kept, hint order, ledger rows, emblem groups, CSS scope. Full suite: sim 332, app 849, server 158; app build clean.

## 2026-11-10 — app / richer lighting and atmosphere pass on the isometric board (bakeoff/gemini-board-light)

- **Components & helpers:** `packages/app/src/BoardLiving.tsx` exports `BoardLight` (alias to `BoardLiving`), `resolveBoardLightPhase`, `resolveBoardLight`, and types `BoardLightPhase`, `BoardLightDescriptor`.
- **Lighting layers (`BoardLiving.tsx`):**
  - **Sky & celestial illumination (`.sc-board-living-sky-light`):** Renders radial sky gradients (`#sc-board-sky-dawn`, `#sc-board-sky-day`, `#sc-board-sky-dusk`, `#sc-board-sky-night`), a horizon glow ellipse (`.sc-board-sky-horizon-glow`), and directional sun/moon light beams (`.sc-board-celestial-beam`) tied to resolved phase (`dawn`, `day`, `dusk`, `night`) or explicit `state.dayPhase` / `flags.dayPhase`.
  - **Terrain facet shading (`.sc-board-living-terrain-shading`):** Adds sunward specular rim polylines (`.sc-board-tile-sun-rim`) along northern edges and leeward bevel shadow polylines (`.sc-board-tile-bevel-shadow`) along southern facets for visible, non-fogged diamond tiles.
  - **Structure & node foundation light (`.sc-board-living-structure-light`):** Renders ground contact shadows (`.sc-board-bldg-ground-shadow`, `.sc-board-node-ground-shadow`) using radial `#sc-board-bldg-shadow-grad`, keep window lantern gleams (`.sc-board-keep-window-lantern`, active during dusk/night), and field camp lantern blooms (`.sc-board-camp-lantern-bloom`).
- **Scoping & readability (`board-living.css`, `hud/living-glyph-soften.css`):** Scoped under `.sc-board-living` with `pointer-events: none !important;` on all decorative SVGs, ellipses, paths, and polygons. Opacities strictly capped (`0.08..0.28`). Keyframe animations (`sc-board-sky-breathe`, `sc-board-beam-shimmer`, `sc-board-rim-gleam`, `sc-board-lantern-glow`, `sc-board-lantern-bloom-pulse`) and softening rules in `living-glyph-soften.css` Section 4 with `@media (prefers-reduced-motion: reduce)` fallbacks. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/BoardLiving.test.tsx` (24 tests) covers `BoardLight` alias, time-of-day phase and descriptor resolution, sky horizon glow and directional beams, terrain facet rims and bevel shadows, structure ground shadows and keep lanterns, and CSS isolation. Full test suite (323 sim, 835 app, 158 server) passing.

## 2026-11-10 — app / living scroll glyphs under quest cards (bakeoff/gemini-quest-living)

- **Components:** `packages/app/src/hud/EventsLivingGlyph.tsx` exports `QuestScrollLivingGlyph`, `QuestLivingGlyph`, `QuestScrollUnderlay`, `QuestScrollLivingUnderlay`, `QuestLivingUnderlay`, `getQuestSealMotif`, `resolveScrollLiving`, and type `ScrollLivingDescriptor`. `QuestCard.tsx` exports `QuestLivingCard` alias and marks each card with `is-living sc-quest-living-card`.
- **Integration (`hud/QuestCard.tsx`):** `QuestCard` mounts `<QuestScrollUnderlay ... />` (`QuestLivingUnderlay`) at `z-index: 0` inside `.sc-quest-card.is-living.sc-quest-living-card`, head rows (`QuestLivingRows`) at `z-index: 1`, and `<QuestScrollLivingGlyph ... />` (`z-index: 1`) beneath the rows.
- **Scoping & readability (`events-glyph-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-quest-card.is-living` and `.sc-quest-living-card` with `overflow: hidden; position: relative;`, foreground children at `z-index: 1`, and `.sc-quest-living-underlay` / `.sc-scroll-living-underlay` confined to `right: -2px; bottom: -2px; width: 32px; height: 32px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.07..0.15`, and underlay SVG opacity `0.28`. Covered `.sc-events-glow-layer` (drop-shadow filter, opacity 0.38), `.sc-events-drift-layer` (scroll drift, opacity 0.52), and `.sc-events-pulse-layer` (seal lit alert breathe, opacity 0.48) with strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards in both `events-glyph-living.css` and `living-glyph-soften.css`. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/EventsLivingGlyph.test.tsx` (11 tests) covers scroll motif and descriptor resolution across open/ready/claimed, 3 distinct scroll SVGs with glow/drift/pulse layers, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` asserts events and quest underlay and glow layer coverage. Full test suite (323 sim, 828 app, 158 server) passing.

## 2026-11-10 — app / richer living Quest cards (wave/quest-living)

- **Component:** new `packages/app/src/hud/QuestLivingRows.tsx` exports `QuestLivingRows`, `orderQuestRows(rows)`, `QUEST_LIVING_KINDS` (`name`, `progress`, `reward`) and `QuestLivingKind`. It takes the `EventsLedgerRow[]` from `questLedgerRows()` unchanged (kinds keep their names); the name row's `lead` (ScrollPip) moves into the chip and each row's `slot` (Claim button) renders in place.
- **Tag:** name tag is `${motif} · ${statusWord}` from `getQuestSealMotif(id)` and quest status (open→unsealed / ready→seal lit / claimed→sealed, matching `resolveScrollLiving()` flair). Read-only; no new math.
- **Wiring:** `QuestCard` renders `<QuestLivingRows>` in place of `<EventsLedger>`; `QuestScrollUnderlay`, `QuestScrollLivingGlyph` and `onClaim` are unchanged. `EventsLedger` / `questLedgerRows` stay exported and tested.
- **CSS:** new `hud/quest-living-rows.css`; selectors under `.sc-quest-living-head`, `.sc-quest-living-chip`, `.sc-quest-living-row*`, `.sc-quest-living-meter*`. Status tint via `--sc-quest-status-tone`. Labels hidden below 520px; animations and meter transition off under `prefers-reduced-motion`.
- **Tests:** new `hud/QuestLivingRows.test.tsx` (7 tests); quest-card order check in `EventsLivingGlyph.test.tsx` now looks for `sc-quest-living-head`. Full suite green (323 sim, 828 app + render/server).

## 2026-11-10 — app / living omen glyphs under event cards (bakeoff/gemini-event-living)

- **Components:** `packages/app/src/hud/EventsLivingGlyph.tsx` exports `EventOmenLivingGlyph`, `EventLivingGlyph`, `EventOmenUnderlay`, `EventOmenLivingUnderlay`, `EventLivingUnderlay`, `QuestScrollLivingGlyph`, `QuestScrollUnderlay`, `resolveOmenLiving`, `resolveScrollLiving`, and types `OmenLivingDescriptor`, `ScrollLivingDescriptor`. `EventCard.tsx` exports `EventLivingCard` alias and marks each card with `is-living sc-event-living-card`.
- **Integration (`hud/EventCard.tsx`):** `EventCard` mounts `<EventOmenUnderlay ... />` (`EventLivingUnderlay`) at `z-index: 0` inside `.sc-event-card.is-living.sc-event-living-card`, head rows (`EventLivingRows`) at `z-index: 1`, `<EventOmenLivingGlyph ... />` (`z-index: 1`) beneath the rows, followed by `.sc-event-choices`.
- **Scoping & readability (`events-glyph-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-event-card.is-living` and `.sc-event-living-card` with `overflow: hidden; position: relative;`, foreground children at `z-index: 1`, and `.sc-events-living-underlay` / `.sc-event-living-underlay` / `.sc-omen-living-underlay` confined to `right: -2px; bottom: -2px; width: 32px; height: 32px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.13..0.23`, and underlay SVG opacity `0.28`. Covered `.sc-events-glow-layer` (drop-shadow filter, opacity 0.38), `.sc-events-drift-layer` (celestial drift, opacity 0.52), and `.sc-events-pulse-layer` (alert/portent breathe, opacity 0.48) with strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards in both `events-glyph-living.css` and `living-glyph-soften.css`. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/EventsLivingGlyph.test.tsx` (10 tests) covers omen and scroll descriptor resolution across states, 3 distinct omen SVGs with glow/drift/pulse layers, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` asserts events underlay and glow layer coverage. Full test suite (323 sim, 822 app, 158 server) passing.

## 2026-11-09 — app / living crest glyphs under realm cards (bakeoff/gemini-diplo-living)

- **Components:** `packages/app/src/hud/DiploLivingGlyph.tsx` exports `RealmCrestLivingGlyph`, `DiploLivingGlyph`, `RealmCrestLivingUnderlay`, `DiploLivingUnderlay`, `PactSealLivingGlyph`, `PactSealLivingUnderlay`, `RealmLivingGlyph`, `RealmLivingUnderlay`, `resolveRealmLiving`, `resolvePactLiving`, and types `RealmLivingDescriptor`, `PactLivingDescriptor`. `RealmCard.tsx` exports `RealmLivingCard` and `DiploLivingCard` aliases and marks each card with `sc-realm-living-card sc-diplo-living-card`.
- **Integration (`hud/RealmCard.tsx`):** `RealmCard` mounts `<RealmLivingUnderlay ... />` (`RealmCrestLivingUnderlay`) at `z-index: 0` inside `.sc-realm-dip.is-living.sc-realm-living-card`, head rows (`DiploLivingRows`) at `z-index: 1`, `<RealmLivingGlyph ... />` (`z-index: 1`) beneath the rows, followed by `.sc-realm-dip-actions`.
- **Scoping & readability (`diplo-glyph-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-realm-dip.is-living` and `.sc-realm-living-card` with `overflow: hidden; position: relative;`, foreground children at `z-index: 1`, and `.sc-diplo-living-underlay` / `.sc-realm-living-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.08..0.14`, and underlay SVG opacity `0.26`. Added `.sc-diplo-glow-layer` (drop-shadow filter, opacity 0.38), `.sc-diplo-drift-layer` (vertical drift, opacity 0.52), and `.sc-diplo-pulse-layer` (scale breathe, opacity 0.48) with strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards in both `diplo-glyph-living.css` and `living-glyph-soften.css`. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/DiploLivingGlyph.test.tsx` (13 tests) covers realm and pact descriptor resolution across stances, 7 distinct realm heraldic SVGs, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` asserts diplo underlay and glow layer coverage. Full test suite (323 sim, 807 app, 661 render, 158 server) passing.

## 2026-11-10 — app / richer living Event cards (wave/event-living)

- **Component:** new `packages/app/src/hud/EventLivingRows.tsx` exports `EventLivingRows`, `orderEventRows(rows)`, `EVENT_LIVING_KINDS` (`name`, `omen`, `duration`) and `EventLivingKind`. It takes the `EventsLedgerRow[]` from `eventLedgerRows()` unchanged and relabels them: `name` → Name, `reward` → Omen, `progress` → Duration. The name row's `lead` (OmenPip) moves into the chip.
- **Tag:** name tag is `${omen} · ${stateWord}` from `resolveOmenVariant()` and `resolveOmenLiving().state` (latest / pending→awaiting / loss→blighted / settled). Read-only; no new math.
- **Wiring:** `EventCard` renders `<EventLivingRows>` in place of `<EventsLedger>`; `EventOmenUnderlay`, `EventOmenLivingGlyph` and `sc-event-choices` are unchanged. `QuestCard` still uses `EventsLedger` / `questLedgerRows`.
- **CSS:** new `hud/event-living-rows.css`; selectors under `.sc-event-living-head`, `.sc-event-living-chip`, `.sc-event-living-row*`, `.sc-event-living-meter*`. Omen tint via `--sc-event-omen-tone`. Labels hidden below 520px; animations and meter transition off under `prefers-reduced-motion`.
- **Tests:** new `hud/EventLivingRows.test.tsx`; event-card order checks in `EventsLedger.test.tsx` / `EventsLivingGlyph.test.tsx` now look for `is-omen` / `is-duration` and `sc-event-living-head`.

## 2026-11-09 — app / richer living Diplomacy realm cards (wave/diplo-living)

- **Component:** new `packages/app/src/hud/DiploLivingRows.tsx` exports `DiploLivingRows`, `orderDiploRows(rows, pact)`, `pactLivingRow(pact)`, `realmPactOf(factions, realmId)`, `DIPLO_LIVING_KINDS` (`name`, `stance`, `pact`, `power`) and `RealmPact`. It takes the `DiploLedgerRow[]` from `realmLedgerRows()` (values unchanged) and inserts a Pact row; the name row's `lead` (crest pip) moves into the chip.
- **Pact source:** `realmPactOf` filters `state.factions` by `memberRealmIds.includes(realmId)`, takes the first, and reports `leads` (`leaderRealmId === realmId`), `withYou` (`memberRealmIds` has `"player"`), `sworn` (member count) and `more` (other factions). Read-only; no new math.
- **Wiring:** `RealmCard` takes an optional `pact` prop and renders `<DiploLivingRows>` in place of `<DiploLedger>`; `WarRoom` passes `realmPactOf(state?.factions, r.id)`; `WorldPanel` Known Crowns renders `<DiploLivingRows>` directly. Pact (faction) cards still use `DiploLedger` / `pactLedgerRows`.
- **CSS:** new `hud/diplo-living-rows.css`; selectors under `.sc-diplo-living-head`, `.sc-diplo-living-chip`, `.sc-diplo-living-row*`, `.sc-diplo-living-meter*`. Stance tint via `--sc-diplo-stance-tone`. Labels hidden below 520px; animations and meter transition off under `prefers-reduced-motion`.
- **Tests:** new `hud/DiploLivingRows.test.tsx`; realm-card order checks in `DiploLedger.test.tsx` / `DiploLivingGlyph.test.tsx` now look for `sc-diplo-living-head`.

## 2026-11-09 — app / living decree glyphs under decree cards (bakeoff/gemini-decree-living)

- **Components:** `packages/app/src/hud/DecreeLivingGlyph.tsx` exports `DecreeSealLivingGlyph`, `DecreeLivingSealGlyph`, `DecreeSealLivingUnderlay`, `DecreeLivingGlyph`, `DecreeLivingUnderlay`, `getDecreeSealKind`, `resolveDecreeLiving`, and types `DecreeSealKind`, `DecreeLivingDescriptor`. `DecreeCard.tsx` exports `DecreeLivingCard` alias and marks each card with `sc-decree-living-card`.
- **Integration (`hud/DecreeCard.tsx`):** `DecreeCard` mounts `<DecreeLivingUnderlay ... />` (`DecreeSealLivingUnderlay`) at `z-index: 0` inside `.sc-decree-card.is-living.sc-decree-living-card`, head rows (`DecreeLivingRows`) at `z-index: 1`, `<DecreeLivingGlyph ... />` (`z-index: 1`) beneath the rows, followed by `.sc-decree-cost` and the Issue button.
- **Scoping & readability (`decree-glyph-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-decree-card.is-living` and `.sc-decree-living-card` with `overflow: hidden; position: relative;`, foreground children at `z-index: 1`, and `.sc-decree-living-underlay` / `.sc-decree-seal-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.12..0.22`, and underlay SVG opacity `0.28`. Added `.sc-decree-glow-layer` (drop-shadow filter, opacity 0.38), `.sc-decree-drift-layer` (vertical drift, opacity 0.52), and `.sc-decree-pulse-layer` (scale breathe, opacity 0.48) with strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards in both `decree-glyph-living.css` and `living-glyph-soften.css`. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/DecreeLivingGlyph.test.tsx` (13 tests) covers seal kind resolution, active/ready/short/idle descriptor resolution, 3 distinct decree SVGs, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` asserts decree underlay and glow layer coverage. Full test suite (323 sim, 803 app, 661 render, 158 server) passing.

## 2026-11-09 — app / richer living Decree cards (wave/decree-living)

- **Component:** new `packages/app/src/hud/DecreeLivingRows.tsx` exports `DecreeLivingRows`, `orderDecreeRows(rows)` and `DECREE_LIVING_KINDS` (`name`, `duration`, `effect`). It takes the `DecreeLedgerRow[]` that `DecreeCard` already builds with `decreeLedgerRows()`; the ledger's `time` row is shown as **Duration** (values unchanged). The name row's `lead` (wax seal pip) moves into the chip.
- **Wiring:** `DecreeCard` renders `<DecreeLivingRows decreeId status rows />` in place of `<DecreeLedger rows />`. `DecreeLedger` is kept (still exported and tested) but no longer mounted by `DecreeCard`.
- **Sources:** unchanged — `decreeLedgerRows()` / `decreeStatus()` output and the existing `getDecreeSealKind()` in `DecreeLivingGlyph.tsx` for the tag and tint (muster / rite / envoys / crown). Status words: active → "in force", ready, short, idle → "waiting". No new math.
- **CSS:** new `hud/decree-living-rows.css`; selectors under `.sc-decree-living-head`, `.sc-decree-living-chip`, `.sc-decree-living-row*`, `.sc-decree-living-meter*`. Seal tints via `--sc-decree-seal-tone`. Labels hidden below 520px; chip glow, duration breathe, effect glow and meter transition off under `prefers-reduced-motion`.
- **Tests:** new `hud/DecreeLivingRows.test.tsx`; order checks in `DecreeLedger.test.tsx` / `DecreeLivingGlyph.test.tsx` now look for `sc-decree-living-head`.

## 2026-11-09 — app / living research glyphs under research cards (bakeoff/gemini-research-living)

- **Components:** `packages/app/src/hud/AcademyLivingGlyph.tsx` exports `ResearchLivingGlyph`, `ResearchLivingUnderlay`, `ResearchTopicLivingGlyph`, `ResearchLecternLivingGlyph`, `resolveResearchLiving`, `resolveResearchGlyphDescriptor`, `ResearchLivingDescriptor`, `ResearchDisciplineKind` alongside existing `StudyLivingGlyph`, `StudyLivingUnderlay`, `AcademyLecternLivingGlyph`. `ResearchBar.tsx` exports `ResearchCard` and `ResearchLivingCard` aliases and marks each card with `sc-research-living-card`.
- **Integration (`ResearchBar.tsx`):** `ResearchBar` mounts `<StudyLivingUnderlay ... />` (`ResearchLivingUnderlay`) at `z-index: 0` inside `.sc-study-living-card.is-${status}.sc-research-living-card`, head rows (`StudyLivingRows`) at `z-index: 1`, and `<StudyLivingGlyph ... />` (`ResearchLivingGlyph`) (`z-index: 1`) beneath the rows and above the Study action button.
- **Scoping & readability (`academy-glyph-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-study-living-card` and `.sc-research-living-card` with `overflow: hidden; position: relative;`, foreground children at `z-index: 1`, and `.sc-academy-living-underlay` / `.sc-research-living-underlay` confined to `right: -2px; bottom: -2px; width: 30px; height: 30px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.06..0.15`, and underlay SVG opacity `0.28`. Added `.sc-research-glow-layer` (drop-shadow filter, opacity 0.38), `.sc-research-drift-layer` (float drift, opacity 0.52), and `.sc-research-pulse-layer` (scale breathe, opacity 0.48) with strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards in both `academy-glyph-living.css` and `living-glyph-soften.css`. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/AcademyLivingGlyph.test.tsx` (11 tests) covers descriptor resolution across studying/open/known/locked states, 6 scholarly disciplines, 10 research topic SVGs, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` updated to assert research glow layer and underlay coverage. Full test suite (323 sim, 793 app, 661 render, 158 server) passing.

## 2026-11-09 — app / richer living Research cards (wave/research-living)

- **Component:** new `packages/app/src/hud/StudyLivingRows.tsx` exports `StudyLivingRows`, `orderStudyRows(rows)` and `STUDY_LIVING_KINDS` (`name`, `progress`, `bonus`). It takes the `StudyLedgerRow[]` that `ResearchBar` already builds with `studyLedgerRows()`; the name row's `lead` (scroll pip) moves into `.sc-study-living-chip`, and any row `slot` (Cancel) renders inside `.sc-study-living-slot`.
- **Wiring:** `ResearchBar` `Row` renders `<StudyLivingRows topicId status rows />` in place of `<StudyLedger rows />`. `StudyLedger` itself is kept (still exported and tested) but no longer mounted by `ResearchBar`.
- **Sources:** unchanged — `studyLedgerRows()` / `studyStatus()` output and the existing `getResearchDiscipline()` in `AcademyLivingGlyph.tsx` for the tag and tint. Status words map `locked` → "sealed"; nothing else is derived. No new math.
- **CSS:** new `hud/study-living-rows.css`; selectors under `.sc-study-living-head`, `.sc-study-living-chip`, `.sc-study-living-row*`, `.sc-study-living-meter*`. Discipline tints via `--sc-study-discipline-tone`. Labels hidden below 520px; chip glow, progress breathe, bonus glow, run stroke and meter transition off under `prefers-reduced-motion`. `academy-living.css` still provides the card frame.
- **Tests:** new `hud/StudyLivingRows.test.tsx`; `hud/AcademyLivingGlyph.test.tsx` glyph-order check now looks for `sc-study-living-head`.

## 2026-11-09 — app / living building glyphs under building cards (bakeoff/gemini-building-living)

- **Components:** `packages/app/src/hud/WorkLivingGlyph.tsx` exports `BuildingLivingGlyph`, `BuildingLivingUnderlay`, `resolveBuildingGlyphDescriptor`, `getBuildingDomain`, and types `BuildingDomain`, `BuildingMood`, `BuildingGlyphDescriptor` alongside existing `WorkLivingGlyph` and `WorkLivingUnderlay` exports. `WorkCard.tsx` exports `BuildingCard` and `BuildingLivingCard` aliases and marks each card with `sc-building-card`.
- **Integration (`hud/WorkCard.tsx`):** `WorkCard` mounts `<WorkLivingUnderlay ... />` at `z-index: 0` inside `.sc-work-card.sc-building-card`, head rows (`WorkLivingRows`) and status rows (`WorkStatus`) at `z-index: 1`, and `<WorkLivingGlyph ... />` (`z-index: 1`) beneath the rows.
- **Scoping & readability (`works-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-work-card:has(.sc-works-living-underlay)` and `.sc-building-card:has(...)` with `overflow: hidden; position: relative;`, foreground children at `z-index: 1`, and `.sc-works-living-underlay` / `.sc-building-living-underlay` confined to `right: 2px; bottom: 24px; width: 32px; height: 32px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.14..0.18`, and underlay SVG opacity `0.28`. Added `.sc-building-glow-layer` (drop-shadow filter, opacity 0.38), `.sc-building-drift-layer` (vertical drift, opacity 0.52), and `.sc-building-pulse-layer` (scale breathe, opacity 0.48) with strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards in both `works-living.css` and `living-glyph-soften.css`. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/WorkLivingGlyph.test.tsx` (14 tests) covers descriptor resolution across working/standing/idle/scarred states, 5 architectural domains, 14×14 living glyph layers, 32×32 underlay watermark, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` updated to assert building glow layer and underlay coverage. Full test suite (323 sim, 766 app, 661 render, 158 server) passing.

## 2026-11-09 — app / richer living Building cards (wave/building-living)

- **Component:** new `packages/app/src/hud/WorkLivingRows.tsx` exports `WorkLivingRows`, `splitWorkRows(rows)` and `WORK_LIVING_HEAD_KINDS` (`level`, `staffed`). `splitWorkRows` moves those rows into the head and leaves the rest (`bonuses`) for `WorkStatus`.
- **Wiring:** `WorkCard` adds `sc-work-living-head` to `.sc-work-head` and renders `WorkLivingRows` beside `HallChip` (Name row keeps `.sc-work-name` so theme.css styling still applies); `WorkStatus` gets only the remaining rows. Inline `.sc-work-level` is omitted on this card (other `.sc-work-card` panels unaffected).
- **Sources:** unchanged — `workStatusRows()` output and the existing `getHallDomain()` in `WorkLivingGlyph.tsx`. Meter widths are the existing `fill` values. No new math.
- **CSS:** new `hud/work-living-rows.css`; every selector under `.sc-work-living*` (plus `.sc-work-head.sc-work-living-head`). Labels/notes hidden below 520px; breathe/blink and meter transition off under `prefers-reduced-motion`.
- **Tests:** new `hud/WorkLivingRows.test.tsx`; `WorkStatus.test.tsx` scarred-card assertion now checks `sc-work-living-row is-staffed tone-danger`. `npm test` and app build pass.

## 2026-11-09 — app / living unit glyphs under unit cards (bakeoff/gemini-unit-living)

- **Components:** `packages/app/src/hud/UnitLivingGlyph.tsx` exports `UnitLivingGlyph`, `UnitLivingUnderlay`, `resolveUnitGlyphDescriptor`, `getUnitFamily`, and types `UnitFamily`, `UnitMood`, `UnitGlyphDescriptor`.
- **Integration (`hud/UnitCard.tsx`):** `UnitCard` mounts `<UnitLivingUnderlay ... />` at `z-index: 0` inside `.sc-unit-card.is-living`, head rows (`UnitLivingRows`) and status rows (`UnitStatus`) at `z-index: 1`, and `<UnitLivingGlyph ... />` (`z-index: 1`) beneath the rows.
- **Scoping & readability (`unit-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-unit-card.is-living` with `overflow: hidden; position: relative;`, foreground children at `z-index: 1`, and `.sc-unit-living-underlay` confined to `right: -4px; bottom: -4px; width: 38px; height: 38px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.10..0.18`, and underlay SVG opacity `0.26`. Added `.sc-unit-glow-layer` (drop-shadow filter, opacity 0.38), `.sc-unit-drift-layer` (float drift, opacity 0.52), and `.sc-unit-pulse-layer` (scale breathe, opacity 0.48) with strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards in both `unit-living.css` and `living-glyph-soften.css`. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/UnitLivingGlyph.test.tsx` (11 tests) covers descriptor resolution across locked/drilling/ready/short states, infantry/ranged/cavalry/command families, 14×14 living glyph layers, 38×38 underlay watermark, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` updated to assert unit glow layer and underlay coverage. Full test suite (323 sim, 762 app, 661 render, 158 server) passing.

## 2026-11-09 — app / richer living Unit cards (wave/unit-living)

- **Component:** new `packages/app/src/hud/UnitLivingRows.tsx` exports `UnitLivingRows`, `splitUnitRows(rows)` and `LIVING_HEAD_KINDS` (`power`, `cost`). `splitUnitRows` moves those rows into the head and leaves the rest (`ready`) for `UnitStatus`.
- **Wiring:** `UnitCard` with non-empty `status` adds `sc-unit-living-head` to `.sc-unit-head` and renders `UnitLivingRows` (Name row keeps `.sc-unit-name` so theme.css locked-card styling still applies); `UnitStatus` gets only the remaining rows. Inline `.sc-unit-power` is omitted in that mode. Without `status`, the legacy head/cost/lock markup is unchanged.
- **Sources:** unchanged — `unitStatusRows()` output from `ArmyTab` and the existing `getUnitFamily()` in `UnitLivingGlyph.tsx`. Meter width is the existing `fill` (power / powerMax). No new math.
- **CSS:** new `hud/unit-living-rows.css`; every selector under `.sc-unit-living*` (plus `.sc-unit-head.sc-unit-living-head` / `.sc-unit-card.is-short` scoping). Labels hidden below 520px; cost-rule breathe and meter transition off under `prefers-reduced-motion`. Spans only (card is a `<button>`).
- **Tests:** new `hud/UnitLivingRows.test.tsx`. Existing `UnitStatus.test.tsx` still passes (row kinds still present in the card markup).

## 2026-11-08 — app / living resource glyphs under resource cards (bakeoff/gemini-resource-living)

- **Components:** `packages/app/src/hud/ResourceLivingGlyph.tsx` exports `ResourceLivingGlyph`, `ResourceLivingUnderlay`, `resolveResourceGlyphDescriptor`, `resolveResourceGlyphDescriptorByValues`, and types `ResourceKind`, `ResourceMood`, `ResourceGlyphTone`, `ResourceGlyphDescriptor`.
- **Integration (`hud/ResourceHud.tsx`):** `ResourceHud` mounts `<ResourceLivingUnderlay resource={r} mood={desc.mood} />` at `z-index: 0` inside `.sc-ledger-cell.sc-resource-living`, `.sc-resource-living-rows` at `z-index: 1`, and `<ResourceLivingGlyph resource={r} have={have} income={income} state={props.state} />` (`z-index: 1`) beneath the rows.
- **Scoping & readability (`resource-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-resource-living` with `overflow: hidden; position: relative;`, foreground children at `z-index: 1`, and `.sc-resource-living-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.10..0.18`, and underlay SVG opacity `0.28`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/ResourceLivingGlyph.test.tsx` (6 tests) covers descriptor resolution across food/wood/stone/gold and empty/full/earning/idle moods, 14×14 living glyph layers, 34×34 underlay watermark, ResourceHud integration, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` updated to assert resource underlay and glow layer coverage.

## 2026-11-08 — app / richer living Resource strip cards (wave/resource-living)

- **Component:** `ResourceHud` in `packages/app/src/hud/ResourceHud.tsx` now renders each `.sc-ledger-cell` with extra classes `sc-resource-living is-<resource>` and a `.sc-resource-living-rows` stack: `is-name` (existing `.sc-ledger-name`), `is-amount` (label + existing `.sc-ledger-amount` + optional `.sc-resource-living-meter`), `is-income` (label + `.sc-ledger-rate`, `is-earning` / `is-idle`). The income row now always renders (`idle` text) instead of disappearing.
- **Sources:** unchanged — `resources`, `income`, `resourceLedger(state, r)`, `isFoodStoresEmptyOrLow`. New local `meterPct(have, cap)` is display-only (clamped 0..100, `null` when cap is missing/infinite).
- **CSS:** new `hud/resource-living.css`; every selector under `.sc-resource-living*`. Existing `.sc-ledger-*` rules in `theme.css` still apply (untouched). Meter transition/breathe off under `prefers-reduced-motion`; labels hidden below 520px.
- **Tests:** new `hud/ResourceHud.test.tsx` (stateless render: four cards x three rows, income vs idle, no meter without state/cap).

## 2026-11-08 — app / living flag/camp glyphs under flag cards (bakeoff/gemini-flag-living)

- **Components:** `packages/app/src/hud/FlagLivingGlyph.tsx` exports `FlagLivingGlyph`, `FlagLivingUnderlay`, `resolveFlagGlyphDescriptor`, `resolveFlagGlyphDescriptorByValues`, and types `FlagGlyphDescriptor`, `FlagMood`, `FlagGlyphTone`. `OutpostLivingCard.tsx` also exports `FlagLivingCard` as an alias.
- **Integration (`hud/OutpostLivingCard.tsx`):** `OutpostLivingCard` mounts `<FlagLivingUnderlay mood={rawMood} node={province.node} />` at `z-index: 0` inside `.sc-outpost-card.sc-flag-living`, 4 rows and meter at `z-index: 1`, and `<FlagLivingGlyph state={state} province={province} nameOf={nameOf} />` (`z-index: 1`) beneath the rows.
- **Scoping & readability (`flag-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-flag-living` with foreground children at `z-index: 1` and `.sc-flag-living-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.10..0.16`, and underlay SVG opacity `0.28`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/FlagLivingGlyph.test.tsx` (13 tests) covers descriptor resolution across threatened/guarded/bare moods, full/dry stock, 14×14 living glyph layers, 34×34 underlay watermark, 4-row card integration with meter, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` updated to assert flag underlay and glow layer coverage.

## 2026-11-08 — app / richer living Flags cards (wave/flag-living)

- **Component:** `outpostRows(state, tile, nameOf?)` in `packages/app/src/hud/OutpostLivingCard.tsx` now returns four rows: `name`, `camp`, `flag`, `resources`. `OutpostRow` gained optional `fill` (0..1, stock left / max), set only on gather nodes.
- **Sources:** adds `nodeStock`, `nodeStockMax`, `GATHER_NODES` to the existing `garrisonAt` / `garrisonPower` / `incomingOnProvince`. Tone: danger at 0, warn below `max / 4`, else safe; calm for non-gather nodes. No tithe math copied (same reason as `CampLivingRows`).
- **Render:** `<section>` gets an extra trailing class `sc-flag-living` (kept after `is-living` so existing `"sc-outpost-card is-living"` assertions still match). Resources row renders `.sc-flag-meter > .sc-flag-meter-fill` with inline width.
- **CSS:** new `hud/flag-living.css`, every selector under `.sc-flag-living` or `.sc-flag-meter*`; `outpost-living.css` and `theme.css` untouched. Meter transition and breathe disabled under `prefers-reduced-motion`.
- **Tests:** `hud/OutpostLivingCard.test.tsx` updated for four rows; new tests for full/low/dry stock, no pile, meter in markup and CSS file presence.

## 2026-11-08 — app / living camp/flag glyphs under camp cards (bakeoff/gemini-camp-living)

- **Components:** `packages/app/src/hud/CampLivingGlyph.tsx` exports `CampLivingGlyph`, `CampLivingUnderlay`, `resolveCampGlyphDescriptor`, `resolveCampGlyphDescriptorByValues`, and types `CampGlyphDescriptor`, `CampMood`, `CampGlyphTone`. `CampLivingRows.tsx` also exports `CampLivingCard` as an alias.
- **Integration (`hud/CampLivingRows.tsx`):** `CampLivingRows` mounts `<CampLivingUnderlay mood={mood} node={node} />` at `z-index: 0` inside `.sc-camp-card.is-living`, rows at `z-index: 1`, and `<CampLivingGlyph state={state} provinceId={provinceId} nameOf={nameOf} />` (`z-index: 1`) beneath the rows.
- **Scoping & readability (`camp-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-camp-card.is-living` with foreground children at `z-index: 1` and `.sc-camp-living-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.12..0.18`, and underlay SVG opacity `0.28`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/CampLivingGlyph.test.tsx` (10 tests) covers descriptor resolution across threatened/flying/struck moods, full/depleted stock, 14×14 living glyph layers, 34×34 underlay watermark, ForceCard integration, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` updated to assert camp underlay and glow layer coverage.

## 2026-11-08 — app / War Room living camp rows (wave/camp-living)

- **Component:** `packages/app/src/hud/CampLivingRows.tsx` exports `campRows(state, provinceId, nameOf?)` → `CampRow[]` (`name`, `flag`, `resources`; empty for unknown tile) and `<CampLivingRows state provinceId nameOf? />` (a `<dl class="sc-camp-rows is-<node>">`).
- **Sources:** `getProvince`, `incomingOnProvince`, `nodeStock`, `nodeStockMax`, `GATHER_NODES`. Flag reads `occupantRealmId === "player"` for Flying vs Struck. Stock tone is warn below `max / 4`. No tithe math copied (per-tile tithe would duplicate `outpostTithePerTick` constants).
- **Integration:** `ForceCard` gained an optional `living?: React.ReactNode` rendered between `ForceLedger` and `ForceStatus`. `WarRoom.tsx` passes `CampLivingRows` on `tone="garrison"` cards only, reusing its `nameOf`.
- **CSS:** `hud/camp-living.css`, `sc-camp-*` classes only; `theme.css` untouched. Danger pip pulse disabled under `prefers-reduced-motion`.
- **Tests:** `hud/CampLivingRows.test.tsx` covers row order, name/coords, Flying, full stock, Dry, unknown tile, and render inside ForceCard with Recall kept.

## 2026-11-08 — app / living camp/flag glyphs under outpost cards (bakeoff/gemini-outpost-living)

- **Components:** `packages/app/src/hud/OutpostLivingGlyph.tsx` exports `OutpostLivingGlyph`, `OutpostLivingUnderlay`, `resolveOutpostGlyphDescriptor`, `resolveOutpostGlyphDescriptorByValues`, and types `OutpostGlyphDescriptor`, `OutpostMood`, `OutpostGlyphTone`.
- **Integration (`hud/OutpostLivingCard.tsx`):** `OutpostLivingCard` mounts `<OutpostLivingUnderlay mood={rawMood} />` at `z-index: 0` inside `.sc-outpost-card.is-living`, rows at `z-index: 1`, and `<OutpostLivingGlyph state={state} province={province} nameOf={nameOf} />` (`z-index: 1`) beneath the rows.
- **Scoping & readability (`outpost-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-outpost-card.is-living` with foreground children at `z-index: 1` and `.sc-outpost-living-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.10..0.16`, and underlay SVG opacity `0.28`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/OutpostLivingGlyph.test.tsx` (9 tests) covers descriptor resolution across threatened/guarded/bare states, 14×14 living glyph layers, 34×34 underlay watermark, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` updated to assert outpost underlay and glow layer coverage.


## 2026-11-08 — app / Kingdom tab living outpost cards (wave/outpost-living)

- **Files:** new `packages/app/src/hud/OutpostLivingCard.tsx` (exports `OutpostLivingCard`, `outpostRows(state, tile, nameOf?)`, types `OutpostRow`, `OutpostRowKind`, `OutpostRowTone`, `OutpostTile`), new `hud/outpost-living.css`, new test `hud/OutpostLivingCard.test.tsx`. `tabs/KingdomTab.tsx` renders `<OutpostLivingCard state province nameOf>` inside each Flags `.sc-work-card.sc-plain-card` where the `.sc-work-head` and `.sc-work-status` were; it dropped the now-unused `power`/`eta` locals and the `garrisonPower` import.
- **Markup:** `<section class="sc-outpost-card is-living is-<node> is-guarded|is-bare|is-threatened">` → `<dl class="sc-outpost-card-rows">` with `.sc-outpost-card-row.is-name|is-camp|is-flag.tone-<tone>`.
- **Reads:** province `node`/`x`/`y`, `garrisonAt` (soldier count = sum of positive `force` values, display only), `garrisonPower`, `incomingOnProvince` (ETA via `TICKS_PER_SECOND`, same as the old `/10`). The realm name goes through the tab's `nameOf`, so fog still shows "Unknown host" without a watchtower. Pure; a test asserts state is byte-identical after render.
- **Controls:** Abandon button and the outer card's `is-warn`/`is-done` border are untouched.
- **CSS:** scoped to `.sc-outpost-card`, mirrors `node-living.css` (row grid, tone pips, pulse on warn/danger). Reduced motion turns off the pip pulse. `theme.css`, `plain-buttons.css` untouched.

## 2026-11-08 — app / living node pile glyphs under node cards (bakeoff/gemini-node-living)

- **Components:** `packages/app/src/hud/NodePileLivingGlyph.tsx` exports `NodePileLivingGlyph`, `NodePileUnderlay`, `resolveNodePileDescriptor`, `resolveNodePileDescriptorByValues`, and types `NodePileDescriptor`, `GatherNodeKind`, `NodePileStatus`, `NodePileTone`.
- **Integration (`hud/NodeLivingCard.tsx`):** `NodeLivingCard` mounts `<NodePileUnderlay node have max />` at `z-index: 0` inside `.sc-node-card.is-living`, rows and meter at `z-index: 1`, and `<NodePileLivingGlyph state provinceId node />` (`z-index: 1`) beneath the meter.
- **Scoping & readability (`node-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-node-card.is-living` with foreground children at `z-index: 1` and `.sc-node-pile-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.11..0.16`, and underlay SVG opacity `0.28`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/NodePileLivingGlyph.test.tsx` (11 tests) covers descriptor resolution across woodcut/quarry/field, dry/draining/full/untouched states, 14×14 living glyph layers, 34×34 underlay watermark, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` updated to assert node underlay and glow layer coverage.

## 2026-11-08 — app / ProvinceInspect living node card (wave/node-living)

- **Files:** new `packages/app/src/hud/NodeLivingCard.tsx` (exports `NodeLivingCard`, `nodeRows(state, provinceId)`, types `NodeRow`, `NodeRowKind`, `NodeRowTone`), new `hud/node-living.css`, new test `hud/NodeLivingCard.test.tsx`. `ProvinceInspect.tsx` renders `<NodeLivingCard>` where the node stock line and `.sc-inspect-stock-badge` span were; it dropped its now-unused `stockMax`/`badge` locals and the `NODE_REGEN_PERIOD`/`nodeStockMax`/`stockBadge` imports.
- **Markup:** `<section class="sc-node-card is-living is-<node> is-full|is-draining|is-dry">` → `<dl class="sc-node-card-rows">` with `.sc-node-card-row.is-name|is-stock|is-pile.tone-<tone>`, then `.sc-node-card-meter > .sc-node-card-meter-fill` (width = have/max, display only).
- **Reads:** `nodeStock`, `nodeStockMax`, `storedNodeStock` (null → "Untouched"), `GATHER_NODES[node].resource`, `NODE_REGEN_PERIOD`, `stockBadge`. `nodeRows` returns null for unseen or non-gather tiles. Pure; a test asserts state is byte-identical after render.
- **Controls:** Gather here / Tile is dry button, force picker, recall, and the `<res> left` fact are untouched.
- **CSS:** scoped to `.sc-node-card`, mirrors `vault-living.css` (row grid, tone pips, pulse on warn/danger). Label opacity 0.72, sub 0.68. Reduced motion turns off the pip pulse and meter transition. `theme.css`, `inspect-card.css` untouched.

## 2026-11-08 — app / living quill glyphs under ledger cards (bakeoff/gemini-ledger-living)

- **Components:** `packages/app/src/hud/QuillLivingGlyph.tsx` exports `QuillLivingGlyph`, `QuillLivingUnderlay`, `resolveQuillDescriptor`, and types `QuillDescriptor`, `QuillDescriptorTone`.
- **Integration (`hud/LedgerCard.tsx`):** `LedgerCard` mounts `<QuillLivingUnderlay kind />` at `z-index: 0` inside `.sc-ledger-card.is-living`, rows inside `.sc-ledger-card-body` at `z-index: 1`, and `<QuillLivingGlyph kind tick />` (`z-index: 1`) beneath the rows.
- **Scoping & readability (`ledger-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-ledger-card.is-living` with foreground children at `z-index: 1` and `.sc-quill-living-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.11..0.15`, and underlay SVG opacity `0.28`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/QuillLivingGlyph.test.tsx` (11 tests) covers descriptor resolution across war/victory/crown/save/calm, 14×14 living glyph layers, 34×34 underlay watermark, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` updated to assert quill underlay and glow layer coverage.

## 2026-11-08 — app / living vault seal glyphs under vault cards (bakeoff/gemini-vault-living)

- **Components:** `packages/app/src/hud/VaultSealLivingGlyph.tsx` exports `VaultSealLivingGlyph`, `VaultSealUnderlay`, `resolveVaultSealDescriptor`, and types `VaultSealDescriptor`, `VaultSealStatus`.
- **Integration (`hud/VaultLivingCard.tsx`):** `VaultLivingCard` mounts `<VaultSealUnderlay state res />` at `z-index: 0` inside `.sc-vault-card`, rows at `z-index: 1`, and `<VaultSealLivingGlyph state res />` (`z-index: 1`) beneath the rows.
- **Scoping & readability (`vault-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-vault-card.is-living` with foreground children at `z-index: 1` and `.sc-vault-seal-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.11..0.18`, and underlay SVG opacity `0.28`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/VaultSealLivingGlyph.test.tsx` (10 tests) covers descriptor resolution across food/wood/stone/gold, safe/exposed/full states, 14×14 living glyph layers, 34×34 underlay watermark, phrasing-only markup, and CSS isolation. `LivingGlyphSoften.test.ts` updated to assert vault underlay and glow layer coverage.

## 2026-11-08 — app / Ledger of Crowns living status rows (wave/ledger-living)

- **Files:** `packages/app/src/hud/LedgerCard.tsx` (now also exports `ledgerRows(tick, text, kind?)`, `ledgerKindLabel(kind?)`, types `LedgerRow`, `LedgerRowKind`), new `hud/ledger-living.css`, new test `hud/LedgerCard.test.tsx`.
- **Markup:** `<li class="sc-ledger-card is-living" data-kind>` → QuillPip + `<dl class="sc-ledger-card-rows">` with `.sc-ledger-card-row.is-time` and `.is-text`. The row values keep the old `.sc-ledger-card-time` / `.sc-ledger-card-text` span hooks, so `save.test.tsx` and any external selectors still match. Kind tag is `.sc-ledger-card-sub` (underscores/hyphens → spaces; omitted when kind is empty).
- **Props unchanged:** `entry` | `tick`/`text`/`kind`, `variant`, `pipSize`, `className`, `style`. `LedgerPanel.tsx` untouched.
- **CSS:** `ledger-living.css` is imported by `LedgerCard.tsx` after `ledger-card.css` and is scoped to `.sc-ledger-card.is-living`. Per-kind tone via `--sc-ledger-tone`, mirroring the existing border-left accent rules. Rows collapse to one column under 420px. Label opacity 0.6 (readability floor). `theme.css` untouched.

## 2026-11-08 — app / Kingdom tab living vault cards (wave/vault-living)

- **Files:** `packages/app/src/hud/VaultLivingCard.tsx` (exports `vaultRows`, `VaultLivingCard`, `VaultLivingCards`, `VAULT_RESOURCES`, types `VaultRow`, `VaultRowKind`, `VaultRowTone`, `VaultResource`), `hud/vault-living.css`, test `hud/VaultLivingCard.test.tsx`.
- **Integration (`tabs/KingdomTab.tsx`):** one import and `{state ? <VaultLivingCards state={state} /> : null}` directly after the existing vault ledger `<p>`. The ledger line and its hint text are unchanged.
- **Reads only:** `resourceLedger(state, res)` → `have`, `cap`, `vault`, `exposed`, `full`. Safety tone is `safe` when `exposed <= 0`, else `warn`; Stock tone is `danger` when `full`. `cap` can be `Infinity` (uncapped store), in which case the "/ cap" sub is omitted. Numbers are floored for display and passed through `formatLetterSuffix`.
- **CSS:** `vault-living.css` is imported by `VaultLivingCard.tsx`. Per-resource accent via `.is-food/.is-wood/.is-stone/.is-gold`; warn/danger pips pulse, disabled under `prefers-reduced-motion`. `theme.css` untouched (a test checks it holds no `sc-vault-card` rules).

## 2026-11-08 — app / living terrain glyphs under atlas province cards (bakeoff/gemini-atlas-living)

- **Components:** `packages/app/src/hud/AtlasTerrainLivingGlyph.tsx` exports `AtlasTerrainLivingGlyph`, `AtlasTerrainUnderlay`, `resolveAtlasTerrainLiving`, and types `AtlasTerrainDescriptor`, `AtlasTerrainKind`.
- **Integration (`hud/AtlasProvinceCard.tsx`):** `AtlasProvinceCard` mounts `<AtlasTerrainUnderlay terrain node seen isHome />` at `z-index: 0` inside `.sc-atlas-card`, header and rows at `z-index: 1`, and `<AtlasTerrainLivingGlyph terrain node seen isHome />` (`z-index: 1`) beneath the rows.
- **Scoping & readability (`atlas-living.css`, `living-glyph-soften.css`):** Scoped via `.sc-atlas-card.is-living` with foreground children at `z-index: 1` and `.sc-atlas-terrain-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.13`, and underlay SVG opacity `0.28`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/AtlasTerrainLivingGlyph.test.tsx` (9 tests) covers terrain & fog state resolution, distinct SVG geometries across all biomes, phrasing-only markup, `AtlasProvinceCard` visual stack order, corner watermark opacity ceilings, and CSS isolation.

## 2026-11-08 — app / Overworld Atlas living province cards (wave/atlas-living)

- **Files:** `packages/app/src/hud/AtlasProvinceCard.tsx` (exports `atlasProvinceRows`, `AtlasProvinceCard`, `AtlasProvinceCards`, types `AtlasProvinceRow`, `AtlasRowKind`, `AtlasRowTone`, `AtlasCardRole`), `hud/atlas-living.css`, test `hud/AtlasProvinceCard.test.tsx`.
- **Integration (`OverworldAtlas.tsx`):** one import and `<AtlasProvinceCards state selectedId hoveredId />` after the `</svg>`. Uses the atlas's existing `hoveredId` state; header, pan, select, and Recenter untouched.
- **Reads only:** `getProvince`, `isProvinceSeen`, `board.homeProvinceId`, `province.node/terrain/occupantRealmId/x/y`, realm names. Owner logic matches `ProvinceStatusStack`; node names match `ProvinceInspect`; coords label matches the War Room's `provinceLabel`.
- **Province has no name field**, so the Name row is node label + `x,y`. If provinces ever get names, swap the value in `atlasProvinceRows`.
- **CSS:** `atlas-living.css` is imported by `AtlasProvinceCard.tsx`. `theme.css` untouched (a test checks it holds no `sc-atlas-card` rules).

## 2026-11-08 — app / softened living glyphs and underlays (bakeoff/gemini-readability-polish)

- **File:** `packages/app/src/hud/living-glyph-soften.css`, imported in `main.tsx` after `hud/living-readability.css` and `theme.css`. Per-tab living stylesheets and `theme.css` remain untouched.
- **Scoping & cascade:** Scoped under `.sc-shell` (set on `body` by `applyTheme`), winning specificity over base single-class rules without disrupting layout or button styling.
- **Watermark underlay opacity ceiling:** Capped all corner underlays across 10 card domains (`.sc-market-living-underlay`, `.sc-works-living-underlay`, `.sc-hold-card-underlay`, `.sc-people-living-underlay`, `.sc-unit-living-underlay`, `.sc-war-living-underlay`, `.sc-events-living-underlay`, `.sc-academy-living-underlay`, `.sc-decree-living-underlay`, `.sc-diplo-living-underlay`) to 0.07..0.18 on wrappers and 0.26..0.30 on child SVGs.
- **Glow & pulse clamp:** Standardized `.sc-*-glow-layer` to `filter: drop-shadow(0 0 1px currentColor)` at `opacity: 0.38` (down from `0.70..0.95`). Standardized `.sc-*-pulse-layer` to 0.48 and `.sc-*-drift-layer` to 0.52. Softened inline pace auras to <= 0.25 and board atmospheric layers (`.sc-board-terrain-aura`, `.sc-board-keep-hearth-glow`, `.sc-board-fog-cloud`) to 0.14..0.26.
- **Invariants & tests:** Strict `pointer-events: none !important;` on all decorative selectors. Verified by `packages/app/src/hud/LivingGlyphSoften.test.ts` (9 tests) checking underlay wrapper ceilings, glow clamp, pointer-events, import order in `main.tsx`, and theme isolation.

## 2026-11-08 — app / living card readability polish (wave/readability-polish)

- **File:** `packages/app/src/hud/living-readability.css`, imported in `main.tsx` after `theme.css` and `seasons/themeStage.css`. Per-tab files (`decree-living.css`, `diplo-living.css`, `events-living.css`, `academy-living.css`, `force-ledger.css`, `*-glyph-living.css`, `market/works/unit/war/people/hold-living.css`) are untouched.
- **Cascade:** Tab chunks (`KingdomTab`, `ArmyTab`, `WarTab`, `CrownTab`) load their CSS lazily, after `index.css`, so this file cannot rely on load order. Every selector is prefixed `.sc-shell` (set on `body` by `applyTheme` in `main.tsx`) for a +1 class edge. Originals with equal or higher specificity that still win (`.is-name.tone-off` subs, force `.is-name` sub, events `state-latest` flair) already sit at opacity 0.84 or higher.
- **Row tint:** A shared `--sc-living-row-tone` var is mapped from each family's tone var (`--sc-decree-tone`, `--sc-diplo-tone`, `--sc-events-tone`, `--sc-study-tone`, `--sc-force-ledger-tone`). The background is `color-mix(in srgb, tone 8%, transparent)`. The force `is-action.state-none` row stays transparent. Existing `border-left` breathe/glow animations are unaffected.
- **Guard rails:** `LivingReadability.test.ts` strips comments and checks that no selector mentions `button` or `-btn`, that every `opacity:` is 0.6 or more, that all five ledger row families are covered, and that the import order in `main.tsx` holds.

## 2026-11-08 — app / living crest glyphs under realm and pact cards (bakeoff/gemini-diplo-living)

- **Components:** `packages/app/src/hud/DiploLivingGlyph.tsx` exports `RealmLivingGlyph`, `RealmLivingUnderlay`, `PactLivingGlyph`, `PactLivingUnderlay`, `resolveRealmLiving`, `resolvePactLiving`, and types `RealmLivingDescriptor`, `PactLivingDescriptor`, `FactionLike`.
- **Integration (`hud/RealmCard.tsx`, `WorldPanel.tsx`):** `RealmCard` mounts `<RealmLivingUnderlay realmId stance />` at `z-index: 0` inside `.sc-realm-dip`, `<DiploLedger />` at `z-index: 1`, and `<RealmLivingGlyph />` directly beneath `<DiploLedger />` (above `.sc-realm-dip-actions`). `WorldPanel` Known Crowns mounts `<RealmLivingUnderlay />` + `<RealmLivingGlyph />` before details/actions. `WorldPanel` Factions mounts `<PactLivingUnderlay faction isMember />` and `<PactLivingGlyph faction isMember />` before `.sc-work-foot`. Declare war, Gift, Scout, Join, and Leave action handlers remain untouched.
- **Scoping & readability (`diplo-glyph-living.css`):** Scoped via `.sc-realm-dip.is-living` and `.sc-faction-card.is-living` with foreground children at `z-index: 1` and `.sc-diplo-living-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.12..0.22`, and watermark keyframe opacity `<= 0.25`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `diplo-living.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/DiploLivingGlyph.test.tsx` (9 tests) covers realm & pact state resolution, distinct SVG geometries across all realm charges and faction kinds, phrasing-only markup, `RealmCard` and `WorldPanel` visual stack order, corner watermark opacity ceilings, and CSS isolation.

## 2026-11-08 — app / Diplomacy realm and pact ledger rows (wave/diplo-living)

- **Files:** `packages/app/src/hud/DiploLedger.tsx` (exports `DiploLedger`, `realmLedgerRows`, `pactLedgerRows`, types `DiploLedgerKind`, `DiploLedgerTone`, `DiploLedgerRow`), `hud/diplo-living.css`, test `hud/DiploLedger.test.tsx`.
- **Integration (`hud/RealmCard.tsx`):** `RealmCardHead` and the opinion/power lines are replaced by `<DiploLedger>` with `RealmCrestPip` (24px) as the name row's `lead`, `matchup: { mine, theirs }`. Declare/Gift buttons untouched. Card gains `is-living`. `RealmCardHead` stays exported but is no longer used in-repo.
- **Integration (`WorldPanel.tsx`):** Known Crowns cards use `realmLedgerRows` with `power`/`scouted` (no match-up); the crest charge, era, lifestyle line, Scout line, blurb, taunt, and buttons remain. Faction cards replace `sc-work-head`/`sc-work-status` with `pactLedgerRows` and a 20px `FactionSealPip` lead; `sc-work-foot` and Join/Leave untouched.
- **Display math only:** truce seconds = `Math.ceil(peaceLeft / 10)`; share = `round(mine / (mine + theirs) * 100)` (50 when both 0), same as the old line; cold = `stance < -10`, same as the Join button.
- **CSS:** `diplo-living.css` is imported by `DiploLedger.tsx`. War stance row pulses, truce stance edge breathes; both off under `prefers-reduced-motion`. `theme.css` untouched.

## 2026-11-08 — app / living decree seal glyphs under royal decree cards (bakeoff/gemini-decrees-living)

- **Components:** `packages/app/src/hud/DecreeLivingGlyph.tsx` exports `DecreeLivingGlyph`, `DecreeLivingUnderlay`, `getDecreeSealKind`, `resolveDecreeLiving`, and types `DecreeSealKind`, `DecreeLivingDescriptor`.
- **Integration (`hud/DecreeCard.tsx`):** Renders `<DecreeLivingUnderlay decreeId status left ticks />` (`z-index: 0`) at the card top, `<DecreeLedger>` (`z-index: 1`), and `<DecreeLivingGlyph decreeId status left ticks />` (`z-index: 1`, directly beneath `<DecreeLedger />` and above `.sc-decree-cost`). Cost line, `sc-decree-btn`, and `tryDecree` handler remain untouched.
- **Scoping & readability (`decree-glyph-living.css`):** Scoped via `.sc-decree-card.is-living` with foreground children at `z-index: 1` and `.sc-decree-living-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` with radial vignette `mask-image`, wrapper opacity `0.12..0.22`, and watermark keyframe opacity `<= 0.25`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `decree-living.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/DecreeLivingGlyph.test.tsx` (9 tests) covers decree seal kind mapping, active/ready/short/idle descriptor resolution, phrasing-only SVG markup, `DecreeCard` visual stack order, corner watermark opacity ceilings, and CSS isolation.

## 2026-11-08 — app / royal decree card ledger rows (wave/decrees-living)

- **Files:** `packages/app/src/hud/DecreeLedger.tsx` (exports `DecreeLedger`, `decreeLedgerRows`, `decreeStatus`, types `DecreeLedgerKind`, `DecreeLedgerTone`, `DecreeStatus`, `DecreeLedgerRow`), `hud/decree-living.css`, test `hud/DecreeLedger.test.tsx`.
- **Integration (`hud/DecreeCard.tsx`):** The old head (seal, name, "Ns left") and blurb are replaced by `<DecreeLedger>`; the `WaxSealPip` is passed as the name row's `lead`. `decreeStatus` uses the card's existing `left` and `affordable`. Cost line, `sc-decree-btn`, and `tryDecree` handler untouched. Card gains `is-living` class.
- **Display math only:** seconds = `Math.ceil(ticks / 10)` (same as before); bar = `left / decree.ticks`, clamped 0..1.
- **CSS:** `decree-living.css` is imported after `decree-card.css`. `.sc-decree-grid:has(> .sc-decree-card.is-living)` raises the column minimum to 210px. Breathing time edge and effect glow are off under `prefers-reduced-motion`. `theme.css` untouched.

## 2026-11-07 — app / living research glyphs under Academy and Study cards (bakeoff/gemini-academy-living)

- **Components:** `packages/app/src/hud/AcademyLivingGlyph.tsx` exports `AcademyLecternLivingGlyph`, `StudyLivingGlyph`, `StudyLivingUnderlay`, `getResearchDiscipline`, `resolveStudyLiving`, `resolveAcademyLecternLiving`, and types `ResearchDiscipline`, `LecternLivingMode`, `StudyLivingDescriptor`, `LecternLivingDescriptor`.
- **Integration (`ResearchBar.tsx`):** Renders `<AcademyLecternLivingGlyph activeName knownCount totalCount academyCount />` directly beneath the Academy Lectern `<p>` summary, and renders `<StudyLivingUnderlay />` (`z-index: 0`) plus `<StudyLivingGlyph />` (`z-index: 1`, directly beneath `<StudyLedger />` and above `.sc-study-btn`) inside `.sc-study-living-card`. `tryStartResearch` and `tryCancelResearch` handlers remain untouched.
- **Scoping & readability (`academy-glyph-living.css`):** Scoped via `.sc-study-living-card:has(> .sc-academy-living-underlay)` with foreground children at `z-index: 1` and `.sc-academy-living-underlay` confined to `right: -2px; bottom: -2px; width: 30px; height: 30px; z-index: 0` inside the `32px` right-side pocket reserved by `.sc-academy-topic-glyph` (`padding: 1px 32px 1px 1px`), with radial `mask-image`, wrapper opacity `0.12..0.22`, and watermark keyframe opacity `0.34..0.50`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `academy-living.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/AcademyLivingGlyph.test.tsx` (8 tests) covers all 10 `RESEARCH` disciplines and distinct SVG geometries, lectern/study state resolution, phrasing-only markup, `ResearchBar` integration (`GameState` immutability), corner watermark opacity ceilings, and CSS isolation.

## 2026-11-07 — app / Academy study card ledger rows (wave/academy-living)

- **Files:** `packages/app/src/hud/StudyLedger.tsx` (exports `StudyLedger`, `studyLedgerRows`, `studyStatus`, types `StudyLedgerKind`, `StudyLedgerTone`, `StudyStatus`, `StudyLedgerRow`), `hud/academy-living.css`, test `hud/StudyLedger.test.tsx`.
- **Integration:** `ResearchBar.tsx` `Row` now always renders `<div class="sc-study-living-card is-<known|studying|open|locked>" data-study=id>` with `<StudyLedger>` first. The existing `.sc-study-btn` Study button follows unchanged when the study is neither known nor running. Cancel is passed as the Progress row `slot`. `ResearchBar` props and the lectern header paragraph unchanged. The `.sc-study-row` class is no longer emitted (its rule in `button-pips.css` is unused, left in place). The unused `.sc-study-card` rules in `theme.css` were not touched.
- **Inputs:** only what `Row` already read (`researchDone`, `researchTicksLeft`, `researchDuration`, `researchKeepReady`, `researchKeepMin`, hall `countBuilding`, `RESEARCH[id].effect`) plus `state.flags.research_<id>_total` (written by `tryStartResearch`) for the active fill. Fill = `1 - left/total`, clamped; display only. Missing total → `fill: "run"` (indeterminate, aria-hidden).
- **Markup:** `<dl class="sc-study-ledger">` → `<div class="sc-study-ledger-row is-<name|progress|bonus> tone-<calm|busy|ready|done|locked>">`, optional `.sc-study-ledger-bar` (role=progressbar, or `.is-run`).
- **CSS:** `.sc-study-living-card`, `.sc-study-ledger-*`, tone via `--sc-study-tone`. `prefers-reduced-motion` disables animations. `theme.css` untouched.

## 2026-11-07 — app / living omen and scroll glyphs under Event and Quest cards (bakeoff/gemini-events-living)

- **Components:** `packages/app/src/hud/EventsLivingGlyph.tsx` exports `EventOmenLivingGlyph`, `EventOmenUnderlay`, `QuestScrollLivingGlyph`, `QuestScrollUnderlay`, `resolveOmenLiving`, `resolveScrollLiving`, `getQuestSealMotif`, and types `OmenLivingState`, `ScrollSealMotif`, `OmenLivingDescriptor`, `ScrollLivingDescriptor`.
- **Integration (`EventCard.tsx`, `QuestCard.tsx`):** `EventCard` renders `<EventOmenUnderlay />` at `z-index: 0` and `<EventOmenLivingGlyph />` directly beneath `<EventsLedger />` (before `.sc-event-choices`). `QuestCard` renders `<QuestScrollUnderlay />` at `z-index: 0` and `<QuestScrollLivingGlyph />` directly beneath `<EventsLedger />`. Event choice buttons and quest `Claim` button remain untouched.
- **Scoping & readability (`events-glyph-living.css`):** Scoped via `.sc-event-card:has(> .sc-events-living-underlay)` and `.sc-quest-card:has(> .sc-events-living-underlay)` with foreground children at `z-index: 1` and `.sc-events-living-underlay` confined to `right: -2px; bottom: -2px; width: 32px; height: 32px; z-index: 0` inside the `34px` right-side pocket reserved by `.sc-events-status-glyph` (`padding: 2px 34px 1px 1px`), with radial `mask-image`, wrapper opacity `0.13..0.23`, and watermark keyframe opacity `0.34..0.52`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `events-living.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/EventsLivingGlyph.test.tsx` (9 tests) covers omen & scroll state resolution, distinct SVG geometries across all 3 omen variants and 3 scroll states, phrasing-only markup, `EventCard` / `QuestCard` / `EventPanel` / `QuestPanel` integration (`GameState` immutability), corner watermark opacity ceilings, and CSS isolation.

## 2026-11-07 — app / living war glyphs under War Room force cards (bakeoff/gemini-war-living)

- **Components:** `packages/app/src/hud/WarLivingGlyph.tsx` exports `WarLivingGlyph` (`14×14` force emblem + flair strip), `WarLivingUnderlay` (`34×34` bottom-right pocket watermark), `getWarForceEmblem`, `resolveWarForceLiving`, and types `WarForceEmblem` (`"warband" | "cloak" | "cart" | "tent"`), `WarLivingDescriptor`, `WarLivingGlyphProps`.
- **Integration (`ForceCard.tsx`):** Renders `<WarLivingUnderlay tone riskTone moving loaded empty />` at `z-index: 0` inside `.sc-force-card`, `<ForceLedger>` (with `24px` `WarChip`) and `<ForceStatus>` at `z-index: 1`, and `<WarLivingGlyph tone riskTone moving loaded empty />` directly beneath `<ForceStatus />`. `Recall` and `Sally` button handlers remain untouched.
- **Scoping & readability (`war-living.css`):** Scoped via `.sc-force-card:has(> .sc-war-living-underlay)` with foreground children at `z-index: 1` and `.sc-war-living-underlay` confined to `right: -2px; bottom: -2px; width: 34px; height: 34px; z-index: 0` inside the `36px` right-side pocket reserved by `.sc-war-status-glyph` (`padding: 3px 36px 1px 1px`), with radial `mask-image`, wrapper opacity `0.14..0.25`, and watermark keyframe opacity `0.34..0.52`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `force-ledger.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/WarLivingGlyph.test.tsx` (9 tests) covers all 4 force emblems (`warband`, `cloak`, `cart`, `tent`), laden vs empty cart geometry, phrasing-only markup, `ForceCard` + `ForceLedger` + `WarRoom` integration (`GameState` immutability), corner watermark opacity ceilings, and CSS isolation.

## 2026-11-07 — app / Events and Quests ledger rows (wave/events-living)

- **Files:** `packages/app/src/hud/EventsLedger.tsx` (exports `EventsLedger`, `eventLedgerRows`, `questLedgerRows`, `eventRewardTone`, types `EventsLedgerKind`, `EventsLedgerTone`, `EventsLedgerRow`), `hud/events-living.css`, test `hud/EventsLedger.test.tsx`.
- **Integration:** `EventCard.tsx` replaces `.sc-event-head` / `.sc-event-body` with `<EventsLedger>` (omen pip as the name row `lead`; `splitEventText` body becomes the Reward value). `.sc-event-choices` stays below. `QuestCard.tsx` replaces `.sc-quest-head` / `.sc-quest-hint` / `.sc-quest-progress` / `.sc-quest-foot` with the ledger; the `.sc-quest-btn` Claim button is passed as the Reward row `slot`. Card props unchanged, so the panels are untouched. Old `.sc-event-*` / `.sc-quest-*` rules for removed spans are now unused but left in place.
- **Inputs:** only existing card props. No sim imports beyond the existing `formatLetterSuffix`; no new math.
- **Markup:** `<dl class="sc-events-ledger">` → `<div class="sc-events-ledger-row is-<name|progress|reward> tone-<calm|busy|ready|done|loss>">`, optional `.sc-events-ledger-bar` (role=progressbar).
- **CSS:** `.sc-events-ledger-*`, tone via `--sc-events-tone`. `prefers-reduced-motion` disables the animations. `theme.css` untouched.

## 2026-11-07 — app / War Room force card ledger rows (wave/war-living)

- **Files:** `packages/app/src/hud/ForceLedger.tsx` (exports `ForceLedger`, `ledgerEta`, `ledgerActionState`, types `ForceLedgerKind`, `ForceLedgerAction`, `ForceLedgerProps`), `packages/app/src/hud/force-ledger.css`, test `hud/ForceLedger.test.tsx`.
- **Integration (`ForceCard.tsx`):** the old `.sc-force-head` / `.sc-force-captain` / `.sc-force-dest` / `.sc-force-detail` spans and the standalone `.sc-force-btn` are replaced by `<ForceLedger>`. ForceCard pulls the `eta` row out of `status` and hands it to the ledger (for its note and `fill`); `ForceStatus` now gets only the power and risk rows. Props of `ForceCard` are unchanged, so `WarRoom.tsx` is untouched.
- **Inputs:** only the existing ForceCard props (`name`, `captain`, `dest`, `detail`, `seconds`, `action`, `status`). No sim imports, no state reads, no new math.
- **Markup:** `<dl class="sc-force-ledger">` with `<div class="sc-force-ledger-row is-<name|dest|eta|action>">`; ETA row adds `is-moving` / `is-posted`; action row adds `state-ready` / `state-locked` / `state-none`. The button keeps class `sc-force-btn` and the name span keeps `sc-force-name` so old theme.css rules still apply.
- **CSS:** `.sc-force-ledger-*`, tone via `--sc-force-ledger-tone`. `prefers-reduced-motion` disables the edge and shimmer animations. `theme.css` untouched.

## 2026-11-07 — app / living walker glyphs under People/Job cards (bakeoff/gemini-people-living)

- **Components:** `packages/app/src/hud/PeopleLivingGlyph.tsx` exports `PeopleLivingGlyph` (`15×15` walker/idle pose badge + flair strip), `PeopleLivingUnderlay` (`28×28` bottom-right corner watermark), `getPeopleCraft`, `resolvePeopleLiving`, and types `PeopleCraft`, `PeoplePose`, `PeopleLivingState`, `PeopleLivingInput`, `PeopleLivingDescriptor`.
- **Integration (`JobCard.tsx`):** Renders `<PeopleLivingGlyph role={effectiveRole} idle={idle} count={workers.length} siteCount={sites.size} postCount={posts.length} />` directly beneath `<JobStatusStack />` (before `.sc-job-row`), and `<PeopleLivingUnderlay ... />` as the trailing child inside `.sc-job-card`. `tryAssignCitizen` and `tryIdleCitizen` handlers remain untouched.
- **Scoping & readability (`people-living.css`):** Card clipping is scoped via `.sc-job-card:has(> .sc-people-living-underlay)` with foreground children at `z-index: 1` and `.sc-people-living-underlay` at `z-index: 0` (`right: 0; bottom: 0; width: 28px; height: 28px;`), radial `mask-image`, wrapper opacity `0.13..0.22`, and watermark keyframe opacity `0.30..0.48`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `job-status-stack.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/PeopleLivingGlyph.test.tsx` (9 tests) covers all 7 `CITIZEN_JOBS` crafts/idle mappings, walker vs idle pose SVG layers, distinct badge & watermark geometries, `JobCard` and `PeoplePanel` integration (`GameState` immutability), opacity ceilings, and CSS isolation.

## 2026-11-07 — app / People card status rows (wave/people-living)

- **Files:** `packages/app/src/hud/JobStatusStack.tsx` (exports `JobStatusStack`, `jobStatusRows`, types `JobStatusRow`, `JobStatusKind`, `JobStatusTone`, `JobStatusInput`), `packages/app/src/hud/job-status-stack.css`, test `hud/JobStatusStack.test.tsx`. `JobCard.tsx` renders `<JobStatusStack name idle count sites postCount kingdomIdle />` between `.sc-job-where` and the worker rows; new optional prop `kingdomIdle` (default 0). `PeoplePanel.tsx` computes `kingdomIdle = groups.get("unassigned")?.length ?? 0` and passes it to every card.
- **Inputs:** values JobCard already had (`name`, `idle`, `workers.length`, its `sites` map of label → hands, `posts.length`) plus the existing Idle group size. No sim imports in the stack, no state reads. `jobStatusRows` is pure; a test asserts the input is unchanged.
- **Markup:** `<dl class="sc-jobstat" aria-label="<name> living status">` with `<div class="sc-jobstat-row is-<kind> tone-<tone>">` rows (kinds `job`, `post`, `idle`; tones `busy`, `warn`, `calm`, `none`); pip inside `<dt>`, `aria-hidden`.
- **CSS:** `.sc-jobstat-*`, tone via `--sc-jobstat-tone`; a compact sibling of `.sc-holdstat` sized for the narrow job grid (44px label column, 11px text). `prefers-reduced-motion` disables entry and pip animation. `theme.css` untouched.

## 2026-11-07 — app / living hold glyphs under hold status cards (bakeoff/gemini-hold-living)

- **Components:** `packages/app/src/hud/HoldLivingGlyph.tsx` exports `HoldLivingStrip` (4-domain living strip for `works`, `stores`, `stamps`, `key`), `HoldCardUnderlay` (`24×24` bottom-right corner watermark), `resolveHoldLivingItems` (pure state resolver), and types `HoldLivingDomain`, `HoldLivingState`, `HoldLivingItem`, `HoldLivingInput`.
- **Integration (`JoinHoldCard.tsx`):** Renders `<HoldLivingStrip view={view} madeKey={madeKey} copied={copied} />` immediately after `<HoldStatusStack />` (before `.sc-hold-actions`), and appends `<HoldCardUnderlay ... />` as the trailing child inside `.sc-hold-key-card`, `.sc-hold-store-card`, `.sc-hold-work-card`, and `.sc-hold-stamp-card` so existing contiguous sibling spans (`name` -> `amount`, `name` -> `count` -> `status`, `tick` -> `by`) and card class attributes remain untouched.
- **Privacy & purity:** `resolveHoldLivingItems` reads only `HoldView` (`militia`, `training`, `farms`, `cottages`, `lumberCamps`, `stores`, `stamps`) plus `madeKey !== null` / `copied` booleans; `madeKey` secret text is never interpolated into any flair or attribute.
- **Scoping & readability (`hold-living.css`):** Card clipping is scoped via `:has(> .sc-hold-living-underlay)` with top-right pips at `z-index: 2`, foreground text/buttons at `z-index: 1`, and `.sc-hold-living-underlay` at `z-index: 0` (`right: -1px; bottom: -1px; width: 24px; height: 24px;`), radial `mask-image`, wrapper opacity `0.13..0.24`, and watermark keyframe opacity `0.34..0.50`. Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guards. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/hud/HoldLivingGlyph.test.tsx` (11 tests) covers all 4 domains, state transitions, secret-key non-leakage, `HoldView` immutability, phrasing-only markup, `JoinHoldCard` integration, opacity ceilings, and CSS isolation.

## 2026-11-07 — app / hold panel status rows (wave/hold-living)

- **Files:** `packages/app/src/hud/HoldStatusStack.tsx` (exports `HoldStatusStack`, `holdStatusRows`, `wholeUnits`, types `HoldStatusRow`, `HoldStatusKind`, `HoldStatusTone`, `HoldStatusInput`), `packages/app/src/hud/hold-status-stack.css`, test `hud/HoldStatusStack.test.tsx`. `JoinHoldCard.tsx` imports it, renders `<HoldStatusStack view madeKey copied confirmLeave />` between `.sc-hold-status` and `.sc-hold-actions`, and its local `whole()` now aliases `wholeUnits` (same body, moved).
- **Inputs:** `HoldView` fields only (`militia`, `training`, `farms`, `cottages`, `lumberCamps`, `stores`, `stamps`) plus card UI state (`madeKey`, `copied`, `confirmLeave`). No sim imports, no fetches. `holdStatusRows` is pure; a test asserts the view is unchanged after a call.
- **Display arithmetic only:** stores floored via `wholeUnits`; "all empty" = every store below 1 (tone only).
- **Markup:** `<dl class="sc-holdstat" aria-label="Hold living status">` with `<div class="sc-holdstat-row is-<kind> tone-<tone>">` rows; pip inside `<dt>`. Tones: `you`, `busy`, `warn`, `calm`, `none`.
- **CSS:** `.sc-holdstat-*`, tone via `--sc-holdstat-tone`; mirrors `.sc-provstat` sizing. Values wrap (`overflow-wrap: anywhere`) instead of ellipsis since Works/Stores run long. `prefers-reduced-motion` disables entry and pip animation. `theme.css` untouched.

## 2026-11-07 — app / living terrain and structure glyphs on the isometric board (bakeoff/gemini-board-living)

- **Surfaces:** Extends `packages/app/src/BoardLiving.tsx` + `packages/app/src/board-living.css` (main isometric board living overlay) and `packages/app/src/OverworldAtlas.tsx` + new `packages/app/src/hud/atlas-terrain-glyphs.css` (World tab isometric Kingdom Atlas).
- **Inputs & fog gating:** Reads `isProvinceSeen` (with `homeProvinceId` always seen), `p.terrain`, `p.node`, `p.occupantRealmId`, `GATHER_NODES`, `nodeStock`, and `nodeStockMax`. Unseen provinces emit zero terrain or structure glyphs. `BoardLiving` and `OverworldAtlas` are pure over `GameState`.
- **Readability & motion:** Terrain (`peak`, `wood`, `shore`) and structure (`camp`, `woodcut`/`field`/`quarry` node pile) keyframes cap individual opacity/stroke-opacity at `<= 0.55` inside muted group layers (`0.72` / `0.76`), staggered per tile via deterministic `(x * 3 + y * 5) % 7` animation delays. Depleted gather tiles (`stock <= 0`) render a calm static `.sc-board-node-dry` ring. `@media (prefers-reduced-motion: reduce)` disables all animations.
- **Hit-testing & camera:** `pointer-events: none !important;` on all decorative layers and children; `packages/render` camera/hit-test math and `OverworldAtlas` pan wrapper + ground click handlers remain untouched. `theme.css`, `packages/sim`, and `server/` untouched.
- **Tests:** `packages/app/src/BoardLiving.test.tsx` (17 tests) covers seen vs unseen fog gating, player vs hostile camp differentiation, stocked vs dry gather node differentiation, `OverworldAtlas` terrain/structure glyphs, opacity ceilings, reduced-motion guards, and CSS isolation.

## 2026-11-07 — app / ProvinceInspect status rows (wave/board-living)

- **Files:** `packages/app/src/ProvinceStatusStack.tsx` (exports `ProvinceStatusStack`, `provinceStatusRows`, types `ProvinceStatusRow`, `ProvinceStatusKind`, `ProvinceStatusTone`), `packages/app/src/province-status-stack.css`, test `ProvinceStatusStack.test.tsx`. `ProvinceInspect.tsx` gains one import and one `<ProvinceStatusStack state={state} provinceId={selectedId} />` after `.sc-inspect-head`.
- **Inputs:** `getProvince`, `isProvinceSeen` (home always counts as seen), `p.terrain`, `p.node`, `p.occupantRealmId`, `GATHER_NODES`, `nodeStock`, `nodeStockMax`, `garrisonAt`, `garrisonPower`, realm names. Outpost reading mirrors `listOutposts` (occupied, not home, not `hold`) and the head's `siteOf`. `provinceStatusRows` is pure; a test asserts state is byte-identical after calling it on every province.
- **Display arithmetic only:** stock bar = `have / max` clamped 0..1; garrison men = sum of `g.force` values (same as `BoardStatus`).
- **Markup:** `<dl class="sc-provstat">` with `<div class="sc-provstat-row is-<kind> tone-<tone>">` children; pip lives inside the `<dt>` so the `dl` stays valid. Terrain row carries `data-terrain`.
- **CSS:** classes `.sc-provstat-*`, tone via `--sc-provstat-tone`; terrain colours match `TERRAIN_PULSE_COLORS` in `BoardLiving`. `prefers-reduced-motion` disables the pip, entry and bar animations. `theme.css` untouched.
- **Atlas:** no changes to `OverworldAtlas`, render camera, or hit-testing.

## 2026-11-07 — app / living hall glyphs under Kingdom work cards (bakeoff/gemini-works-living)

- **Components:** `packages/app/src/hud/WorkLivingGlyph.tsx` exports `WorkLivingUnderlay` (`32×32` pocket watermark), `WorkLivingGlyph` (`14×14` hall domain badge + flair strip), `getHallDomain`, and `HallDomain` (`"hearth" | "craft" | "mint" | "martial" | "sanctum"`).
- **Integration (`WorkCard.tsx`):** Renders `WorkLivingUnderlay` at `z-index: 0` inside `.sc-work-card` and `WorkLivingGlyph` directly beneath `<WorkStatus rows={rows} />` (above `.sc-work-foot`). Reuses the exact flags `WorkCard` already computes: `scarred`, `crewed = jobForBuildingType(b.typeId) !== "unassigned"`, `staffed = staff > 0`, and `lifted = cluster + pair + keep > 0`. `tryDemolish` / `tryRepair` untouched.
- **Scoping & readability (`works-living.css`):** Scoped via `.sc-work-card:has(.sc-works-living-underlay)` so `.sc-work-card` panels elsewhere in the HUD (`BalanceNotes`, `CrownTab`, `CloudPanel`, etc.) are unaffected. `.sc-works-living-underlay` sits at `right: 2px; bottom: 24px; width: 32px; height: 32px;` above the opaque footer button and inside the `36px` right-side pocket reserved by `.sc-works-status-glyph` (`padding: 3px 36px 1px 0`), with a radial `mask-image` fade, wrapper opacity `0.15..0.29`, and dedicated low-opacity keyframes (`sc-works-underlay-drift` `0.34 -> 0.50`, `sc-works-underlay-pulse` `0.38 -> 0.55`).
- **Isolation & motion:** Styles isolated in `packages/app/src/hud/works-living.css` (`theme.css` and `work-status.css` untouched). Strict `pointer-events: none !important;` on all decorative layers and children; `@media (prefers-reduced-motion: reduce)` disables all keyframe loops.
- **Tests:** `packages/app/src/hud/WorkLivingGlyph.test.tsx` (10 tests) covers hall domain mapping across all 18 `BUILDING_TYPES`, distinct SVG geometries, state & bonus flairs, phrasing-only markup, `WorkCard` integration (`createCitizen` + `tryAssignCitizen`), `:has()` scoping, opacity ceilings, and CSS isolation.

## 2026-11-07 — app / Standing works status rows (wave/works-living)

- **Files:** `packages/app/src/hud/WorkStatus.tsx` (exports `WorkStatus`, `workStatusRows`, types `WorkStatusRow`, `WorkStatusInput`, `WorkBonusChip`), `packages/app/src/hud/work-status.css`, test `hud/WorkStatus.test.tsx`. `hud/WorkCard.tsx` now renders `<WorkStatus>` instead of `.sc-work-status` / `.sc-work-perks`; those rules in `theme.css` stay (still used by other cards).
- **Inputs:** `b.level`, `maxLevelFor(state, typeId, realmId)`, `jobForBuildingType(typeId) !== "unassigned"`, and the whole percents WorkCard already computed from `staffBonus` / `adjacencyBonus` / `pairBonus` / `keepBonus`. `workStatusRows` is pure and takes plain numbers, so it is easy to test.
- **Display-only constant:** `STAFF_BAR_FULL = 40` scales the staffed bar. It mirrors the current staff cap in `economy.ts` for display; if that cap changes, the bar just clamps. Never fed back into the sim.
- **CSS:** classes are `.sc-workstat-*`, tones via `--sc-workstat-tone`. `.sc-work-grid:has(.sc-workstat)` widens columns to `minmax(190px, 1fr)` without touching `theme.css`.

## 2026-11-07 — app / living goods glyphs under Market stall cards (bakeoff/gemini-market-living)

- **Components:** `packages/app/src/hud/MarketLivingGlyph.tsx` exports `MarketLivingUnderlay` (`34×34` bottom-right corner watermark), `MarketLivingGlyph` (`14×14` commodity badge + lot flair strip), `getOfferGoodsKind`, and `GoodsKind` (`"food" | "wood" | "stone" | "gold"`).
- **Integration (`OfferCard.tsx`):** Renders `MarketLivingUnderlay` at `z-index: 0` inside `.sc-offer-card` and `MarketLivingGlyph` directly beneath `<StallStatus rows={rows} />` (above `<button className="sc-offer-btn">Trade</button>`). State flags derive strictly from existing values: `hasMarket = countBuilding(state, "market") > 0`, `open = canTrade(state, offer.id)`, and `lastLot = stockRow?.tone === "warn"`. `canTrade` / `tryTrade` untouched.
- **Contrast & corner confinement (`market-living.css`):** `.sc-market-living-underlay` sits at `right: -2px; bottom: -2px; width: 34px; height: 34px;` opposite the left-aligned `Trade` button with a radial `mask-image` fade, wrapper opacity `0.12..0.30`, and dedicated low-opacity keyframes (`sc-market-underlay-drift` `0.34 -> 0.50`, `sc-market-underlay-pulse` `0.38 -> 0.55`) so right-aligned `Give` / `Get` / `Stock` values are never overlapped or obscured. `.sc-market-status-glyph` is left-aligned with `padding: 3px 36px 1px 0`.
- **Isolation & motion:** Styles isolated in `packages/app/src/hud/market-living.css` (`theme.css` and `offer-card.css` untouched). Strict `pointer-events: none !important;` on all decorative layers and children; `@media (prefers-reduced-motion: reduce)` disables all keyframe loops.
- **Tests:** `packages/app/src/hud/MarketLivingGlyph.test.tsx` (10 tests) covers commodity classification across all 9 `MARKET_OFFERS`, distinct SVG geometries, state flairs, phrasing-only markup, `OfferCard` integration, opacity ceilings, corner bounds, and CSS isolation.

## 2026-11-07 — app / Market stall status rows (wave/market-living)

- **Files:** `packages/app/src/hud/StallStatus.tsx` (exports `StallStatus`, `stallStatusRows`, `shortCount`, types `StallStatusRow`, `StallStatusInput`, `StallAmount`), `packages/app/src/hud/stall-status.css`, test `hud/StallStatus.test.tsx`. `hud/OfferCard.tsx` now renders `<StallStatus>` instead of its local `Side` rows; `offer-card.css` is untouched (its `.sc-offer-row/-tag/-side/-amt` rules are now unused).
- **Inputs:** offer `give`/`get` from `MARKET_OFFERS`, `state.resources`, and `countBuilding(state, "market") > 0`. Nothing else.
- **Display arithmetic only:** give bar = min over give resources of `have / need` (clamped 0..1); stock = min over give resources of `floor(have / need)`, capped at `x999+`. `Number()` on resource strings, same as the old `Side`; non-finite stores read as full. A test asserts "in hand" agrees with `canTrade` for every offer across several store levels. `tryTrade` still decides.
- **Tones:** give `danger` when any give resource is short; stock `warn` at exactly one run, `danger` at zero; all rows `fog` with no Market or no state.
- **CSS:** `--sc-stall-row-tone` per tone class. Stock pip breathes when live, faster when short; `prefers-reduced-motion` disables. `.sc-offer-grid:has(.sc-stall-status)` widens the grid min column to 170px from this file so `offer-card.css` and `theme.css` stay untouched.

## 2026-11-07 — app / softened Army unit glyph contrast (bakeoff/gemini-army-glyph-contrast)

- **Why:** `.sc-unit-living-underlay svg` previously shared `@keyframes sc-unit-idle-breath` and `sc-unit-drilling-pulse` (`opacity: 0.85..1`) with the footer badge icon, overriding its static `opacity: 0.13`/`0.22` rule and placing a full-opacity `64×64` SVG behind right-aligned `Cost` and `Ready` values.
- **Fix (`unit-living.css`, `UnitLivingGlyph.tsx`):**
  - Confined `.sc-unit-living-underlay` from `inset: 0` (`64×64`) to a `34px × 34px` bottom-right corner pocket (`right: -2px; bottom: -2px`) with a radial vignette `mask-image` fade.
  - Capped wrapper opacity (`0.26` ready, `0.32` drilling, `0.22` short, `0.14` locked) and moved underlay SVG animation to dedicated `sc-unit-underlay-breath` (`0.35 -> 0.52`) and `sc-unit-underlay-pulse` (`0.40 -> 0.58`), keeping composite screen alpha strictly `<= 0.19`.
  - Left-aligned `.sc-unit-status-glyph` with `padding: 3px 36px 1px 0`, shrunk its icon from `18px` to `14px`, and softened `sc-unit-idle-breath` / `sc-unit-drilling-pulse` icon glow and flair opacity (`0.56`).
- **Guards:** Added CSS regression tests in `packages/app/src/hud/UnitLivingGlyph.test.tsx` (10 tests total) asserting corner bounds, radial mask, wrapper opacity `<= 0.35`, and underlay keyframe opacity `< 0.6`. Zero edits to `packages/sim`, `server/`, or `theme.css`; `pointer-events: none !important;` preserved.

## 2026-11-07 — app / living unit glyphs under Army unit cards (bakeoff/gemini-army-living)

- **Components:** `packages/app/src/hud/UnitLivingGlyph.tsx` exports `UnitLivingUnderlay` (ambient SVG watermark backdrop beneath card contents), `UnitLivingGlyph` (heraldic badge and flair under status rows), and `getUnitFamily`.
- **Integration:** Mounted inside `packages/app/src/hud/UnitCard.tsx`. `UnitLivingUnderlay` sits at `z-index: 0` (`position: absolute; inset: 0; pointer-events: none !important; opacity: 0.08..0.22`), while readable elements and existing culture chips sit at `z-index: 1`. When `status` is present, `UnitLivingGlyph` renders under the `UnitStatus` rows.
- **Button Semantics:** Because `UnitCard` is a `<button>`, all rendered nodes use `<span>` and `<svg>` elements only (no `div`/`dl`/`p`). Tests explicitly verify no block elements are introduced.
- **Heraldry & Motion:**
  - `infantry`: Crossed spears, spearhead polygon tips, center boss, and `sc-unit-idle-breath`.
  - `ranged`: Recurve bow arc, notched arrow, cardinal sighting reticle, and target glow.
  - `cavalry`: Heavy horseshoe arc with stud points, charging star, and swift drift.
  - `command`: Swallowtail pennant standard with solar crown and rallying aura.
  - States: `.is-ready` (calm emerald glow), `.is-drilling` (golden training pulse via `sc-unit-drilling-pulse`), `.is-short` (amber idle breath), `.is-locked` (static muted slate).
- **Styling:** Dedicated `packages/app/src/hud/unit-living.css`. Strict `pointer-events: none !important;` on all layers and children. Zero alterations to `theme.css`. Full reduced-motion guard disabling all keyframe loops.
- **Tests:** `packages/app/src/hud/UnitLivingGlyph.test.tsx` (8 unit tests) covers unit classification, state classes, phrasing content guarantees, DOM visibility, theme isolation, and reduced-motion compliance.

## 2026-11-07 — app / Army unit status rows (wave/army-living)

- **Files:** `packages/app/src/hud/UnitStatus.tsx` (exports `UnitStatus`, `unitStatusRows`, `jobProgress`, types `UnitStatusRow`, `UnitStatusInput`), `packages/app/src/hud/unit-status.css`, test `hud/UnitStatus.test.tsx`. `UnitCard` gained optional `status?: UnitStatusRow[]`; when given it replaces the `sc-unit-cost` / `sc-unit-lock` line. Cards without `status` render exactly as before.
- **Markup:** rows are `<span>`s, not `dl`/`div`, because `UnitCard` is a `<button>` (phrasing content only). Test asserts no block tags.
- **Inputs (ArmyTab.tsx):** power = `u.power`, `powerMax` = max power over `listUnitTypes()` (bar fill is a relative display only); home/away from `listTroopPosts` (away = marching + gathering); cost text = same per-unit string the card already showed; ticks = existing `trainDurationTicks` for `trainQty`; `affordable` = `canAffordTrain`; `queueFull` = `listTraining(...).length >= trainingQueueCap` (the train handler now reuses this const); drilling = sum of queued `count` for the type; progress = `jobProgress(tick, startedTick, doneTick)` of the first queued job (undefined while waiting).
- **Ready precedence:** locked → drilling → queue full → short of stores → ready. Labels only; `tryTrain` still decides.
- **CSS:** tone classes `tone-calm|warn|danger|fog` set `--sc-unit-row-tone`. Ready pip breathes on `.is-ready` cards (faster on danger/drilling); drilling fill shimmers; `prefers-reduced-motion` disables both. No `theme.css` changes.

## 2026-11-07 — app / living war glyphs under War Room status cards (bakeoff/gemini-war-living)

- **Components:** `packages/app/src/hud/WarLivingGlyph.tsx` exports `WarLivingUnderlay` (ambient SVG watermark backdrop beneath card contents) and `WarLivingGlyph` (heraldic badge and flair under status rows).
- **Integration:** Mounted inside `packages/app/src/hud/ForceCard.tsx`. `WarLivingUnderlay` sits at `z-index: 0` (`position: absolute; inset: 0; pointer-events: none !important; opacity: 0.12..0.22`), while readable elements and buttons sit at `z-index: 1`. When `status` is present, `WarLivingGlyph` renders under the `ForceStatus` rows.
- **Heraldry & Motion:**
  - `hostile`: Crossed broadswords, crossguards, clash spark star (`.sc-war-glyph-sparkle`), and danger pulse (`sc-war-danger-pulse` / `sc-war-underlay-danger`).
  - `scout`: Outrider compass rose, horizon aperture, and reconnaissance drift (`sc-war-drift` / `sc-war-underlay-drift`).
  - `gather`: Cart wheel with spoked hubs, tied harvest sheaf, golden dust motes, and flair reflecting load state (`Harvest laden`, `Empty haul`, `Supply party`).
  - `garrison`: Crenellated stone battlement, heater shield contour, and ward pulse (`sc-war-pulse`), transitioning to `Ward breach alert` on danger tone.
- **Styling:** Dedicated `packages/app/src/hud/war-living.css`. Strict `pointer-events: none !important;` on all layers and children. Zero alterations to `theme.css`. Full reduced-motion guard disabling all keyframe loops.
- **Tests:** `packages/app/src/hud/WarLivingGlyph.test.tsx` (11 unit tests) covers all tones, danger and movement states, load states, DOM visibility, theme isolation, and reduced-motion compliance.

## 2026-11-07 — app / War Room force status rows (wave/war-living)

- **Files:** `packages/app/src/hud/ForceStatus.tsx` (exports `ForceStatus`, `forceStatusRows`, `tripProgress`, types `ForceStatusRow`, `ForceStatusInput`), `packages/app/src/hud/force-status.css`, test `hud/ForceStatus.test.tsx`. `ForceCard` gained optional `status?: ForceStatusRow[]`, rendered after `detail`, before the button. Cards without `status` render exactly as before.
- **Inputs (WarRoom.tsx):** power = `forcePower(m.force)` or `m.levy` when a column carries no force; gathers `forcePower(g.force)`; garrisons `garrisonPower`. Hostile power is hidden (`?`, tone fog) unless `watchtowerWarning` is set, same rule as the host name. `powerMax` = biggest visible power, so bar fill is a relative display only.
- **ETA:** seconds via the existing `etaOf`. Progress bar only for gathers (`tripProgress(tick, arrivesTick, travelTicks)`); marches store no depart tick, so they show seconds only. Gathering phase shows `gathering · Ns`. Garrisons show `Posted`.
- **Risk (labels, not math):** scout = recall open (same check as the Recall button) or Committed; gather = Empty haul / Host on target / laden / recall open; garrison = Column inbound if any `incomingOnHome`/`incomingOnPlayerFlags` column targets it, else Quiet; hostile = Unknown (no watch), else High/Held comparing column power to `realmPower` (home) or `garrisonPower` (flag), shown as `vs N`. Combat still rolls; this is a read-out.
- **CSS:** tone classes `tone-calm|warn|danger|fog` set `--sc-force-row-tone`. Risk pip breathes; ETA fill shimmers; `prefers-reduced-motion` disables both. No `theme.css` changes.

## 2026-11-06 — app / living board animations (bakeoff/gemini-board-living)

- **BoardLiving component:** Implemented in `packages/app/src/BoardLiving.tsx` and mounted in `AppShell.tsx` between the canvas and `BoardStatus` (`z-index: 2`, under status overlay `z-index: 4`).
- **Layers:**
  - `terrain pulse`: Biome-colored diamond contour (`.sc-board-terrain-diamond`), breathing aura (`.sc-board-terrain-aura`), and dashed resonance ring (`.sc-board-terrain-ring`) on the selected province.
  - `keep glow`: Radial gradient hearth glow (`.sc-board-keep-hearth-glow`), flickering core (`.sc-board-keep-light`), and beacon flare (`.sc-board-keep-beacon-ray`) for player and visible rival holds.
  - `soft fog drift`: Organic drifting mist puffs (`.sc-board-fog-cloud`, `.sc-board-fog-puff`) with dual sinusoidal drifting keyframes (`sc-board-fog-drift`, `sc-board-fog-drift-alt`).
  - `status tether`: Connection underlay (`.sc-board-status-tether`) bridging the tile center to the `BoardStatus` stack anchor.
- **Styling:** Authored in `packages/app/src/board-living.css`. Strict `pointer-events: none !important;` on all decorative layers and children. Zero modifications to `theme.css`. Full reduced-motion overrides.
- **Tests:** Added `packages/app/src/BoardLiving.test.tsx` (13 tests) verifying visibility gates, coordinate projection, terrain colors, keep detection, fog clouds, status tether, pointer-events, CSS keyframes, and theme isolation.

## 2026-11-06 — app / board status chips (wave/board-status)

- **Files:** `packages/app/src/BoardStatus.tsx` (exports `BoardStatus`, `boardStatusChips`, `boardStatusAnchor`), `packages/app/src/board-status.css`, test `BoardStatus.test.tsx`. Mounted in `AppShell.tsx` right after the map `<canvas>`, with `visible={cameraBand === "board"}`.
- **Chips:** `owner` (home id / `occupantRealmId`, fog → Unknown), `stock` (seen gather tiles: `nodeStock`/`nodeStockMax` + `GATHER_NODES[node].resource`), `garrison` (`garrisonAt` force sum + `garrisonPower`; unseen → Unseen), `event` (earliest `listMarches` entry with `toId` = tile and `arrivesTick > tick`; rival columns only if seen; seconds via `TICKS_PER_SECOND`). 3 or 4 chips.
- **Anchor:** `boardStatusAnchor` uses the iso layout (`x - y` across, `x + y` down) over `board.width`/`board.height` to choose the left/right canvas edge and a top % clamped to 6–78. It does not read camera pan/zoom (the renderer exposes no projection). If exact tile tracking is wanted later, add a `projectProvince(id)` getter to `MapRenderer` in `packages/render` and swap the anchor.
- **CSS:** `.sc-board-status` absolute, z-index 4 (zoom controls are 5), `pointer-events: none`. Tone classes `tone-you|rival|warn|calm|fog` colour a breathing pip. `prefers-reduced-motion` disables animation. Narrow screens tighten the gutter. No `theme.css` changes.

## 2026-11-06 — app / living research pace glyph (bakeoff/gemini-research-pace)

- **ResearchPaceGlyphPip component:** Implemented in `packages/app/src/ResearchPace.tsx`. Inlined directly inside `.sc-research-pace-glyph-wrap` with `aria-hidden="true"` and dataset attributes (`data-pace`, `data-active`, `data-all-unlocked`, `data-unlock-id`).
- **Glyph design:**
  - `fast`: 16px SVG celestial armillary sphere with speed cardinal ticks, inclined cyan knowledge ring, golden rim, and breathing aura (`.sc-research-pace-aura`).
  - `base`: Pewter outer ring with brass meridian and coordinate pips.
  - `active`: Central study beacon star (`.sc-research-pace-star`) with tuned 1700ms twinkle cadence.
  - `allUnlocked`: Master astrolabe laurel wreath with 8-point stellar compass.
- **Styling:** Authored in `packages/app/src/research-pace.css`. `.sc-research-pace-glyph-wrap` and all children enforce `pointer-events: none !important;`. No modifications to `theme.css`. Full `prefers-reduced-motion` support.
- **Tests:** `packages/app/src/ResearchPace.test.tsx` (10 tests) validating DOM structure, SVG element composition across states, non-interactivity, CSS keyframe declarations, and reduced-motion overrides.

## 2026-11-06 — app / living market pace glyph (bakeoff/gemini-market-pace)

- **MarketPaceGlyphPip component:** Implemented in `packages/app/src/MarketPace.tsx`. Inlined directly inside `.sc-market-pace-glyph-wrap` with `aria-hidden="true"`.
- **Glyph design:**
  - `rising`: 16px SVG canopy awning (`#d4af37` stripes) over trade post, center trade spark (first market) or expansion balance (upgrade), apex diamond star, and `.sc-market-pace-aura` pulsing subtle amber radial aura.
  - `steady`: Balanced scale with brass beam, dual pans carrying coin dots, and pivot point.
  - `closed`: Slate shuttered facade with cross planks and padlock.
- **Styling:** Authored in `packages/app/src/market-pace.css`. `.sc-market-pace-glyph-wrap` and all children enforce `pointer-events: none !important;`. No modifications to `theme.css`.
- **Tests:** Added comprehensive test suite in `packages/app/src/MarketPace.test.tsx` validating DOM structure, SVG element composition across states, non-interactivity, CSS keyframe declarations, and reduced-motion overrides.

## 2026-11-06 — app / market pace on the Kingdom tab (wave/market-pace)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `MarketPace.tsx` exports `MarketPace`, `marketRate(state)`, and `nextMarketChange(state)`. It reads only `countBuilding`, `canTrade`, `MARKET_OFFERS`, `listWorksInProgress`, `buildTicksLeft`, and `TICKS_PER_SECOND`.
- "Market rate": the sim has no variable exchange rate. `MARKET_OFFERS` is a fixed table and `canTrade` only checks for a Market plus stores. So the line shows the count of offers open now, not a price.
- Next change: earliest player `market` under construction. Labelled "first" when no Market is finished yet (opens trading), else "another". A second Market does not change trades; it only adds Market production. Seconds use `Math.ceil(ticks / 10)`.
- Not shown: when stores will cross an offer's give amount (would need an income forecast, which is game math).
- Verification: `MarketPace.test.tsx` (5 tests). `npm test` (sim 323, app 391, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-06 — app / living wall pace glyph next to the wall pace line (bakeoff/gemini-wall-pace)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Living Wall Pace Glyph Design:
  - `WallPaceGlyphPip` in `packages/app/src/WallPace.tsx`: 16px living SVG stone rampart positioned on `.sc-wall-pace-glyph-wrap` immediately preceding the wall pace text on the Kingdom tab.
  - State illumination:
    - `rising` (`next !== null`): fortified golden stone rampart with crenellated merlons, mortar courses, source charge (curtain wall merlons vs arched gatehouse with portcullis), radiant apex fortification star (`.sc-wall-pace-star`), and breathing amber aura (`.sc-wall-pace-aura`).
    - `steady` (`next === null`): quiet slate curtain wall with calm merlons, mortar joints, and center anchor pip.
  - Motion & Aesthetics:
    - `.sc-wall-pace-breathe`: gentle 2.4s pulsating ambient amber aura when wall fortification is scheduled to complete.
    - `.sc-wall-pace-float`: subtle vertical hover (1px) keeping the rampart alive, with slightly faster rhythm when rising.
    - `.sc-wall-pace-twinkle`: delicate brightness and scale cycle on the fortification apex star.
- Safety & Invariants:
  - All styles isolated in `packages/app/src/wall-pace.css`.
  - `.sc-wall-pace-glyph-wrap, `.sc-wall-pace-glyph-wrap *` enforces `pointer-events: none !important;` so clicks or text selections are never blocked.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations, stops floating, and sets steady opacity.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/WallPace.test.tsx` (9 tests) verifies steady/rising/gate glyph renderings, SVG structure, `aria-hidden` attribute, `pointer-events: none` CSS enforcement, keyframes presence, motion guard, and absence of `theme.css` leakage.
  - Full suite passes: `npm test` (323 sim, 386 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-06 — app / wall pace on the Kingdom tab (wave/wall-pace)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `WallPace.tsx` exports `WallPace` and `nextWallChange(state)`. It reads only `wallHp`, `listWorksInProgress`, `buildTicksLeft`, and `TICKS_PER_SECOND`.
- Next change: earliest player `walls` or `gate` under construction. Ties go walls, then gate. Seconds use `Math.ceil(ticks / 10)`.
- Deliberately does not show the post-change HP (rim vs inner wall, ring close bonus, gate on rim; repeating that is game math). Masonry is not listed: `masonryWallBonus` feeds `defenseBonus`/`fortificationPower`, not `wallHp`.
- Quirk noticed, not changed: `wallHp` counts inner walls with `countBuilding(state, "walls")`, which does not filter by realm. The line only lists the player's own works.
- Verification: `WallPace.test.tsx` (4 tests). `npm test` (sim 323, app 381, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-06 — app / living vision pace glyph next to the vision pace line (bakeoff/gemini-vision-pace)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Living Vision Pace Glyph Design:
  - `VisionPaceGlyphPip` in `packages/app/src/VisionPace.tsx`: 16px living SVG horizon aperture positioned on `.sc-vision-pace-glyph-wrap` immediately preceding the vision pace text on the Kingdom tab.
  - State illumination:
    - `rising` (`next !== null`): radiant horizon aperture with glowing pupil iris, source charge (watchtower battlements, surveying compass cross, keep coronet), radiant apex beacon star (`.sc-vision-pace-star`), and breathing cyan aura (`.sc-vision-pace-aura`).
    - `steady` (`next === null`): quiet slate horizon eye with calm pupil iris, lateral reference line, and vertical alignment pips.
  - Motion & Aesthetics:
    - `.sc-vision-pace-breathe`: gentle 2.4s pulsating ambient cyan/azure aura when vision expansion is scheduled to complete.
    - `.sc-vision-pace-float`: subtle vertical hover (1px) keeping the horizon aperture alive, with slightly faster rhythm when rising.
    - `.sc-vision-pace-twinkle`: delicate brightness and scale cycle on the beacon apex star.
- Safety & Invariants:
  - All styles isolated in `packages/app/src/vision-pace.css`.
  - `.sc-vision-pace-glyph-wrap, `.sc-vision-pace-glyph-wrap *` enforces `pointer-events: none !important;` so clicks or text selections are never blocked.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations, stops floating, and sets steady opacity.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/VisionPace.test.tsx` (10 tests) verifies steady/rising/source glyph renderings, SVG structure, `aria-hidden` attribute, `pointer-events: none` CSS enforcement, keyframes presence, motion guard, and absence of `theme.css` leakage.
  - Full suite passes: `npm test` (323 sim, 377 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-06 — app / vision pace on the Kingdom tab (wave/vision-pace)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `VisionPace.tsx` exports `VisionPace` and `nextVisionChange(state)`. It reads only `visionRange`, `listWorksInProgress`, `buildTicksLeft`, `researchTicksLeft`, `keepLevel`, `keepVisionCultureBonus`, and `TICKS_PER_SECOND`.
- Next change: earliest of player watchtowers under construction, `researchTicksLeft(state, "surveying")`, and (only when `keepLevel === 0` and `keepVisionCultureBonus > 0`) a player keep under construction. Ties go watchtower, surveying, keep. Seconds use `Math.ceil(ticks / 10)`.
- Deliberately does not show the post-change range (a rim tower adds 2, an inner tower 1; repeating that is game math). Weather fog is not shown: `weatherFor` and `fogThickness` are not exported from `packages/sim`, and exporting them would be a sim change.
- Quirk noticed, not changed: `visionRange` uses `countBuilding(state, "watchtower")`, which does not filter by realm. The line only lists the player's own towers.
- Verification: `VisionPace.test.tsx` (5 tests). `npm test` (sim 323, app 372, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-05 — app / living upkeep pace glyph next to the upkeep pace line (bakeoff/gemini-upkeep-pace)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Living Upkeep Pace Glyph Design:
  - `UpkeepPaceGlyphPip` in `packages/app/src/UpkeepPace.tsx`: 16px living SVG sustenance grain sheaf positioned on `.sc-upkeep-pace-glyph-wrap` immediately preceding the upkeep pace text on the Army tab.
  - State illumination:
    - `rising` (`next !== null`): golden sustenance harvest sheaf with gilded grain heads, tied ribbon (tinted `#34d399` for infirmary healing, `#f59e0b` for barracks training), radiant apex harvest star (`.sc-upkeep-pace-star`), lateral grain ears, and breathing amber-gold aura (`.sc-upkeep-pace-aura`).
    - `steady` (`next === null`): quiet slate granary sickle and steady grain ear with cool bronze handle and granary pivot boss.
  - Motion & Aesthetics:
    - `.sc-upkeep-pace-breathe`: gentle 2.4s pulsating ambient amber/gold aura when upkeep is scheduled to rise.
    - `.sc-upkeep-pace-float`: subtle vertical hover (1px) keeping the sheaf alive, with slightly faster rhythm when rising.
    - `.sc-upkeep-pace-twinkle`: delicate brightness and scale cycle on the harvest apex star.
- Safety & Invariants:
  - All styles isolated in `packages/app/src/upkeep-pace.css`.
  - `.sc-upkeep-pace-glyph-wrap, `.sc-upkeep-pace-glyph-wrap *` enforces `pointer-events: none !important;` so clicks or text selections are never blocked.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations, stops floating, and sets steady opacity.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/UpkeepPace.test.tsx` (10 tests) verifies steady/rising/healing glyph renderings, SVG structure, `aria-hidden` attribute, `pointer-events: none` CSS enforcement, keyframes presence, motion guard, and absence of `theme.css` leakage.
  - Full suite passes: `npm test` (323 sim, 367 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-05 — app / upkeep pace on the Army tab (wave/upkeep-pace)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `UpkeepPace.tsx` exports `UpkeepPace` and `nextUpkeepChange(state)`. It reads only `upkeepPerTick`, `armyMouths`, `listTraining`, `listHealing`, and `TICKS_PER_SECOND`.
- Next change: earliest `doneTick` among player training jobs (champion filtered out, matching `armyMouths`) and heal jobs. Training adds `job.count` of `job.typeId`; a heal adds 1 militia (`deliverMilitia`). Ties go to training. Seconds use `Math.ceil(ticks / 10)`, same as the barracks queue.
- Deliberately does not show the post-change rate: that would mean repeating the `0.02` food-per-mouth constant from `systems/upkeep.ts` in the app. Losses (battle, starvation) are not predictable from state, so they are not shown.
- Verification: `UpkeepPace.test.tsx` (5 tests). `npm test` (sim 323, app 362, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-05 — app / living training pace glyph next to the training pace line (bakeoff/gemini-training-pace)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Living Training Pace Glyph Design:
  - `TrainingPaceGlyphPip` in `packages/app/src/TrainingPace.tsx`: 16px living SVG crossed training blades positioned on `.sc-training-pace-glyph-wrap` immediately preceding the training pace text on the Army tab.
  - State illumination:
    - `fast` (`now < base`): crossed steel drill blades with gold pommels and crossguards, outer emerald drill ring, 4 cardinal speed ticks, radiant apex clash diamond star (`.sc-training-pace-star`), and breathing emerald-gold martial aura (`.sc-training-pace-aura`).
    - `base` (`now >= base`): quiet slate drill ring with crossed practice foils, bronze pommels, and center practice boss.
    - `allUnlocked` (`!next`): master martial laurel wreath with gilded victory blades and triumphant emerald star.
  - Motion & Aesthetics:
    - `.sc-training-pace-breathe`: gentle 2.4s pulsating ambient emerald/gold aura when training at an accelerated pace.
    - `.sc-training-pace-float`: subtle vertical hover (1px) keeping the blades alive, with slightly faster rhythm when fast.
    - `.sc-training-pace-twinkle`: delicate brightness and scale cycle on the clash apex star.
- Safety & Invariants:
  - All styles isolated in `packages/app/src/training-pace.css`.
  - `.sc-training-pace-glyph-wrap, .sc-training-pace-glyph-wrap *` enforces `pointer-events: none !important;` so clicks or text selections are never blocked.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations, stops floating, and sets steady opacity.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/TrainingPace.test.tsx` (10 tests) verifies base/fast/all-unlocked heraldic glyph renderings, SVG structure, `aria-hidden` attribute, `pointer-events: none` CSS enforcement, keyframes presence, motion guard, and absence of `theme.css` leakage.
  - Full suite passes: `npm test` (323 sim, 357 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-05 — app / training pace on the Army tab (wave/training-pace)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `TrainingPace.tsx` exports `trainingPace(state)`, `nextUnitUnlock(state)`, `lockNote(id)`, `PACE_UNIT` (`militia`), `PACE_COUNT` (10). They read only `listUnitTypes`, `trainDurationTicks`, `unitUnlocked`.
- Rate: `trainDurationTicks(state, "militia", 10)` against `trainTicks * 10`. Faster when barracks or the keep gate `trainSpeed` apply; the line then shows both times. A batch of 10 keeps the `Math.ceil(ticks / 10)` seconds from rounding the difference away.
- Next unit: first entry of `listUnitTypes()` (roster order) where `unitUnlocked` is false. The study text comes from `lockNote`, now living in `TrainingPace.tsx` (was private in `ArmyTab.tsx`); `ArmyTab` imports it, so there is still one copy.
- Verification: `TrainingPace.test.tsx` (5 tests). `npm test` (sim 323, app 352, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-04 — app / living academy pace glyph next to the academy pace line (bakeoff/gemini-academy-pace)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Living Academy Pace Glyph Design:
  - `AcademyPaceGlyphPip` in `packages/app/src/AcademyPace.tsx`: 16px living SVG academy colonnade positioned on `.sc-academy-pace-glyph-wrap` immediately preceding the academy pace text on the Kingdom tab.
  - State illumination:
    - `on` (`academyRateOn(state)` true): classical amethyst colonnade and pediment with illuminated sanctuary arch, wisdom spire, twinkling apex beacon star (`.sc-academy-pace-star`), speed pips, and breathing lavender-violet aura (`.sc-academy-pace-aura`).
    - `off` (`academyRateOn(state)` false): quiet slate and pewter foundation with unbuilt architectural framework awaiting academy construction.
    - `allKnown` (`!nextAcademyUnlock(state)`): master academy laurel wreath with triumphant amethyst star.
  - Motion & Aesthetics:
    - `.sc-academy-pace-breathe`: gentle 2.4s pulsating ambient lavender/amethyst aura when running with an active Academy.
    - `.sc-academy-pace-float`: subtle vertical hover (1px) keeping the colonnade alive, with slightly faster rhythm when active.
    - `.sc-academy-pace-twinkle`: delicate brightness and scale cycle on the wisdom beacon star.
- Safety & Invariants:
  - All styles isolated in `packages/app/src/academy-pace.css`.
  - `.sc-academy-pace-glyph-wrap, .sc-academy-pace-glyph-wrap *` enforces `pointer-events: none !important;` so clicks or text selections are never blocked.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations, stops floating, and sets steady opacity.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/AcademyPace.test.tsx` (10 tests) verifies off/on/all-known heraldic glyph renderings, SVG structure, `aria-hidden` attribute, `pointer-events: none` CSS enforcement, keyframes presence, motion guard, and absence of `theme.css` leakage.
  - Full suite passes: `npm test` (323 sim, 342 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-04 — app / academy pace on the Kingdom tab (wave/academy-pace)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `AcademyPace.tsx` exports `academyRateOn(state)`, `academyRateText()`, `nextAcademyUnlock(state)`. They read only `RESEARCH`, `LECTERN_STUDY_MULT`, `researchDuration`, `researchDone`, `researchKeepMin`, `researchKeepReady`.
- Rate on/off: `researchDuration(state, firstId) < RESEARCH[firstId].ticks`, same test as `ResearchPace.fastPace`. It follows the sim's `countBuilding` check, not the realm-filtered `hallRoomBuilt`. The label reuses the keep hall lectern wording (`Math.round((1 - LECTERN_STUDY_MULT) * 100)`% shorter).
- Next academy unlock: first `RESEARCH` entry in table order whose `needsAny` includes `"academy"` and is not `researchDone`. Siege craft never qualifies (needs a siege workshop). Keep gate shown as "needs Keep II" etc. when `researchKeepReady` is false.
- Seconds use `Math.ceil(ticks / 10)`, same as `StudyLine`.
- Verification: `AcademyPace.test.tsx` (5 tests). `npm test` (sim 323, app 342, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-04 — app / living research pace glyph next to the research pace line (bakeoff/gemini-research-pace)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Living Research Pace Glyph Design:
  - `ResearchPaceGlyphPip` in `packages/app/src/ResearchPace.tsx`: 16px living SVG celestial scholar astrolabe positioned on `.sc-research-pace-glyph-wrap` immediately preceding the research pace text on the Kingdom tab.
  - State illumination:
    - `fast` (`fastPace(state)` true): outer golden armillary ring, inclined celestial cyan orbit, inner meridian arc, 4 cardinal speed ticks indicating rapid academy cadence, breathing golden-cyan aura (`.sc-research-pace-aura`), and twinkling center scholar star (`.sc-research-pace-star`).
    - `base` (`fastPace(state)` false): dignified slate outer ring, inclined brass meridian ellipse, and 4 subtle coordinate pips.
    - `active` (`activeStudy(state)` non-null): center radiant diamond star with sapphire/gold core beacon pip while a study is underway on the lectern.
    - `allUnlocked` (`!nextUnlock(state)`): triumphant laurel wreath with 8-point stellar compass and sapphire core.
  - Motion & Aesthetics:
    - `.sc-research-pace-breathe`: gentle 2.4s pulsating ambient gold/cyan aura when running at Academy pace.
    - `.sc-research-pace-float`: subtle vertical hover (1px) keeping the astrolabe alive, with slightly faster rhythm on Academy pace.
    - `.sc-research-pace-twinkle`: delicate brightness and scale cycle on the scholar star.
- Safety & Invariants:
  - All styles isolated in `packages/app/src/research-pace.css`.
  - `.sc-research-pace-glyph-wrap, .sc-research-pace-glyph-wrap *` enforces `pointer-events: none !important;` so clicks or text selections are never blocked.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations, stops floating, and sets steady opacity.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/ResearchPace.test.tsx` (10 tests) verifies base/fast/active/all-unlocked heraldic glyph renderings, SVG structure, `aria-hidden` attribute, `pointer-events: none` CSS enforcement, keyframes presence, motion guard, and absence of `theme.css` leakage.
  - Full suite passes: `npm test` (323 sim, 332 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-04 — app / research pace on the Kingdom tab (wave/research-pace)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `ResearchPace.tsx` exports `fastPace(state)`, `activeStudy(state)`, `nextUnlock(state)`. They read only `RESEARCH`, `UNIT_TYPES`, `researchDuration`, `researchTicksLeft`, `researchDone`.
- Pace: `researchDuration(state, firstId) < RESEARCH[firstId].ticks` means Academy pace. No hardcoded 20%, so it follows the sim if the Academy factor changes.
- Next unlock: first `RESEARCH` entry in table order with `unlocks.length > 0` and not `researchDone`. Its length is `researchDuration`, omitted when that study is the one running (seconds left is already shown).
- Seconds use `Math.ceil(ticks / 10)`, same as `StudyLine`.
- Verification: `ResearchPace.test.tsx` (5 tests). `npm test` (sim 323, app 332, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-04 — app / living market glyph on the market hint line (bakeoff/gemini-market-hint)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Living Market Glyph Design:
  - `MarketGlyphPip` in `packages/app/src/MarketHint.tsx`: 16px living SVG merchant market glyph positioned on `.sc-market-glyph-wrap` immediately preceding the market hint text on the Kingdom tab.
  - Heraldic illumination states:
    - `ready` (`canTrade` is true): striped red/gold awning canopy, central brass scales pillar, gently swaying balance beam (`.sc-market-glyph-scale`), left and right suspended commodity pans, breathing golden-sapphire aura (`.sc-market-glyph-aura`), and twinkling apex coin star glint (`.sc-market-glyph-star`).
    - `waiting` (`!ready && !isClosed`, insufficient stores): quiet terracotta canopy with steady tilted balance beam awaiting resources.
    - `isClosed` (no market built): shuttered timber framework with locked padlock indicating trade is unavailable.
  - Motion & Aesthetics:
    - `.sc-market-glyph-breathe`: gentle 2.4s pulsating ambient gold/sapphire prosperity glow when ready to trade.
    - `.sc-market-glyph-float`: subtle vertical hover (1px) keeping the stall alive.
    - `.sc-market-glyph-balance`: delicate ±3° swaying motion on the balance scale beam.
    - `.sc-market-glyph-twinkle`: delicate brightness and scale cycle on the apex coin glint.
- Safety & Invariants:
  - All styles isolated in `packages/app/src/market-hint.css`.
  - `.sc-market-glyph-wrap, .sc-market-glyph-wrap *` enforces `pointer-events: none !important;` so clicks or selections are never blocked.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations, stops floating/swaying, and sets steady opacity.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/MarketHint.test.tsx` (10 tests) verifies ready/waiting/closed heraldic glyph renderings, SVG structure, `aria-hidden` attribute, `pointer-events: none` CSS enforcement, keyframes presence, motion guard, and absence of `theme.css` leakage.
  - Full suite passes: `npm test` (323 sim, 327 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-04 — app / market hint on the Kingdom tab (wave/market-hint)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `MarketHint.tsx` exports `nextTrade(state)` and `tradeCostText(offer)`. Both read only the sim `MARKET_OFFERS` table, `canTrade`, and `countBuilding`.
- Selection: null with no finished Market. Otherwise the first offer in `MARKET_OFFERS` order where `canTrade` is true; if none, `MARKET_OFFERS[0]` with `ready: false`. Uses `canTrade` directly, so it stays in step with `hud/OfferCard.tsx` and the sim.
- Display: the offer's own `label` plus its `give` side as the cost (`"<n> <res>"` join, same as `DecreeHint`).
- Verification: `MarketHint.test.tsx` (6 tests). `npm test` (sim 323, app 323, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-04 — app / living decree seal on the decree hint line (bakeoff/gemini-decree-hint)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Living Decree Seal Design:
  - `DecreeSealPip` in `packages/app/src/DecreeHint.tsx`: 16px living SVG wax seal positioned on `.sc-decree-seal-wrap` immediately preceding the decree hint text on the Kingdom tab.
  - Heraldic illumination states:
    - `ready` (stores can cover decree): molten vermilion/golden wax seal disc with dual hanging ribbon tails, milled beaded matrix depression, breathing aura (`.sc-decree-seal-aura`), tailored vector signet charges (crossed blades for `muster`, wheat sheaf for `rite`, parchment treaty scroll for `envoys`), and twinkling apex wax glint star (`.sc-decree-seal-star`).
    - `locked` (`!ready`, insufficient stores): deep carmine stamped wax seal with indented matrix and steady burgundy ribbon tails.
    - `isDone` (all decrees sworn): imperial triumph crown seal with golden ribbons and apex crown gem.
  - Motion & Aesthetics:
    - `.sc-decree-seal-breathe`: gentle 2.4s pulsating ambient gold glow when ready to swear.
    - `.sc-decree-seal-float`: subtle vertical hover (1px) keeping the seal alive.
    - `.sc-decree-seal-twinkle`: delicate brightness and scale cycle on the wax glint.
- Safety & Invariants:
  - All styles isolated in `packages/app/src/decree-hint.css`.
  - `.sc-decree-seal-wrap, .sc-decree-seal-wrap *` enforces `pointer-events: none !important;` so clicks or selections are never blocked.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations, stops floating, and sets steady opacity.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/DecreeHint.test.tsx` (10 tests) verifies ready/locked/done heraldic seal renderings, decree charges, SVG structure, `aria-hidden` attribute, `pointer-events: none` CSS enforcement, keyframes presence, motion guard, and absence of `theme.css` leakage.
  - Full suite passes: `npm test` (323 sim, 317 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-04 — app / decree hint on the Kingdom tab (wave/decree-hint)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `DecreeHint.tsx` exports `nextDecree(state)` and `decreeCostText(decree)`. Both read only the sim `DECREES` table and `decreeActive`.
- Selection: first decree in `DECREES` order that is not active; one the stores can cover wins over an earlier one they cannot. The stock check is the same `Number(resources) >= Number(cost)` compare `hud/DecreeCard.tsx` uses for its short marker; keep the two in step.
- Cost text uses the `"<n> <res>"` join, same as `ResearchHint`. The line points to the Crown tab, where `DecreesPanel` lives.
- Verification: `DecreeHint.test.tsx` (5 tests). `npm test` (sim 323, app 312, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-04 — app / living age glyph on the age line (bakeoff/gemini-age)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Living Age Glyph Design:
  - `AgeGlyphPip` in `packages/app/src/AgeLine.tsx`: 16px living SVG age glyph positioned on `.sc-age-glyph-wrap` immediately preceding the age line text on the Kingdom tab.
  - Heraldic illumination states:
    - `ready` (`canAscend(state)` is true): radiant golden ascending sunburst with breathing aura (`.sc-age-glyph-aura`), pulsing solar rays (`.sc-age-glyph-rays`), mountain horizon ridge, and twinkling 4-point solar diamond apex star (`.sc-age-glyph-star`).
    - `waiting` (`!ready && !shared`): calm morning horizon with warm amber rising sun disc, morning rays, and golden core dot.
    - `shared`: enduring realm foundation base and carved stone monolith with celestial sapphire disc and silver epoch star pip.
  - Motion & Aesthetics:
    - `.sc-age-glyph-breathe`: gentle 2.4s pulsating ambient gold glow when ready to ascend.
    - `.sc-age-glyph-float`: subtle vertical hover (1px) keeping the glyph alive.
    - `.sc-age-glyph-twinkle`: delicate brightness and scale cycle on the gold apex star.
    - `.sc-age-glyph-rays`: breathing ray expansion and stroke-width emphasis.
- Safety & Invariants:
  - All styles isolated in `packages/app/src/age-line.css`.
  - `.sc-age-glyph-wrap, .sc-age-glyph-wrap *` enforces `pointer-events: none !important;` so clicks or selections are never blocked.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations, stops floating, and sets steady opacity.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/AgeLine.test.tsx` (8 tests) verifies ready/waiting/shared heraldic glyph renderings, SVG structure, `aria-hidden` attribute, `pointer-events: none` CSS enforcement, keyframes presence, motion guard, and absence of `theme.css` leakage.
  - Full suite passes: `npm test` (323 sim, 307 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-04 — app / age line on the Kingdom tab (wave/age-line)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- "Age" here is the prestige level (`flags.prestige_level`), labelled "Dawn N" to match `hud/DawnCard.tsx`. Requirement is `ascendThreshold(state)` formatted with `formatLetterSuffix`; ready state is `canAscend(state)`. If the sim's ascend rule changes, this line follows automatically.
- Shared-hold check uses `sharedRealmId` from `game/settleOnLoad`, same as `DawnCard`.
- Class names: `sc-age-line` (+ `is-ready`) in `age-line.css`. Data attributes `data-dawn` / `data-ready` for tests.
- Verification: `AgeLine.test.tsx` (3 tests). `npm test` (sim 323, app 302, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-04 — app / culture line on the Kingdom tab (wave/culture-picker)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `CultureLine.tsx` exports `nextCultureId(state)` (index of `playerCultureId` in `CULTURES`, +1, mod length) and `CultureLine`.
- Switch goes through `act((s) => setPlayerCulture(s, id))` plus `rememberCulture(id)` from `CulturePicker.tsx`, matching the Crown tab picker's message text. If the picker's onClick changes, keep the two in step.
- Class names are `sc-culture-line-row` / `sc-culture-line-btn` in `culture-line.css`; they do not clash with the picker's `sc-culture-line` / `sc-culture-line-key` in `hud/culture-picker.css`.
- Branch: the old `wave/culture-picker` (tip `e3c74df`) was an ancestor of `origin/main`; it was fast-forwarded, not reset, before this commit.
- Verification: `CultureLine.test.tsx` (4 tests). `npm test` (sim 323, app 299, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-04 — app / living research glyph on research hint line (bakeoff/gemini-research-hint)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Living Research Glyph Design:
  - `ResearchGlyphPip` in `packages/app/src/ResearchHint.tsx`: 16px living SVG codex glyph positioned on `.sc-research-glyph-wrap` immediately preceding the research hint text.
  - Heraldic illumination states:
    - `ready` (study can start immediately): illuminated open codex with curved vellum pages, carved wooden lectern stand, emerald ribbon bookmark, rubrication lines, 4-point gold beacon star (`.sc-research-glyph-star`), and warm breathing aura (`.sc-research-glyph-aura`).
    - `locked` (`!ready`, hall or Keep requirement unmet): antique study codex in muted slate and parchment with centered guidance pip.
    - `isDone` (all studies mastered): golden laurel wreath arc embracing a bound grand tome and apex triumph star.
  - Motion & Aesthetics:
    - `.sc-research-glyph-breathe`: gentle 3.2s pulsating ambient glow for ready studies.
    - `.sc-research-glyph-float`: subtle vertical hover (1px) keeping the codex alive without distracting the eye.
    - `.sc-research-glyph-twinkle`: delicate brightness cycle on the gold apex star.
- Safety & Invariants:
  - All styles isolated in `packages/app/src/research-hint.css`.
  - `.sc-research-glyph-wrap, .sc-research-glyph-wrap *` enforces `pointer-events: none !important;` so text selection or surrounding clicks are never blocked.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations, stops floating, and sets steady opacity.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/ResearchHint.test.tsx` (9 tests) verifies ready/locked/done heraldic glyph renderings, SVG structure, `aria-hidden` attribute, `pointer-events: none` CSS enforcement, keyframes presence, motion guard, and absence of `theme.css` leakage.
  - Full suite passes: `npm test` (323 sim, 295 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-04 — app / research hint on the Kingdom tab (wave/research-hint)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `ResearchHint.tsx` exports `nextResearch(state)` and `researchCostText(id)`. Both read only the sim `RESEARCH` table and existing helpers (`researchDone`, `researchTicksLeft`, `researchKeepReady`, `researchKeepMin`, `countBuilding`).
- Selection: first id in `RESEARCH` key order that is not done and not underway; a ready one (hall built and Keep gate met) wins over an earlier locked one. Hall list logic mirrors `needList` in `ResearchBar.tsx`; keep the two in step if the research def shape changes.
- Cost text uses the same `"<n> <res>"` join as `ResearchBar`. No duration shown, to keep the line short.
- Note: `researchDone` / `researchTicksLeft` may set the `research_<id>` flag when a study has finished. That is existing behavior, same as `StudyLine` and `ResearchBar`.
- Verification: `ResearchHint.test.tsx` (5 tests). `npm test` (sim 323, app 291, server 158) and `npm run build -w @second-crown/app` pass.

## 2026-11-04 — app / living action sound glyph and acoustic pulse (bakeoff/gemini-sound)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed. No audio assets.
- Living Sound Glyph & Acoustic Pulse Design:
  - `ActionSoundPip` in `packages/app/src/hud/ActionFlash.tsx`: 14px living SVG sound glyph positioned on `.sc-action-sound-wrap` after the confirmation text label.
  - Heraldic acoustic motifs:
    - `build`: forge chime cone / acoustic bell emitting dual golden resonance arcs.
    - `train`: clarion war-horn emitter with ruby/steel wavefront arcs.
    - `trade`: coin bell chime emitter with sapphire & gold resonance arcs.
  - Motion & Acoustic Sync:
    - `sc-action-sound-vibe`: subtle acoustic recoil/tilt timed with Web Audio attack.
    - `sc-action-sound-wave-inner` / `sc-action-sound-wave-outer`: concentric wave arcs expanding outward with staggered delays (18% and 28%).
    - `sc-action-sound-pulse`: expanding circular acoustic ring centered on the sound glyph, blooming from scale 0.6 to 3.0 before dissipating into the background.
- Safety & Invariants:
  - All styles isolated in `packages/app/src/hud/action-flash.css`.
  - `.sc-action-flash, .sc-action-flash *` enforces `pointer-events: none !important;` so UI clicks are never intercepted.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations, hides acoustic pulse rings, and shows static sound glyph without movement.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/hud/ActionFlash.test.tsx` (17 tests) verifies empty initial state, chip labels, brief timing, distinct spark and sound SVG charges per kind, living halo/shimmer/motes/sound-pulse DOM structure, CSS keyframes, pointer-events safety, and absence of `theme.css` leakage.
  - `packages/app/src/actionSound.test.ts` (5 tests) verifies Web Audio tone mapping and `flashAction` single-fire.
  - Full suite passes: `npm test` (323 sim, 286 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-04 — app / action confirmation sound (wave/action-sound)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math. No audio assets.
- Hook point: `flashAction()` in `hud/ActionFlash.tsx` is already called only on success at every build/train/trade site, so the tone rides on it: dispatch the flash event, then `playActionSound(kind)`. One call site to keep correct instead of eight.
- `playActionSound` lives in `sfx.ts` and maps kind → `sfx.build` / `sfx.train` / `sfx.trade`. `ActionSoundKind` mirrors `ActionFlashKind`; extend both together.
- Do not call `sfx.train()` next to `flashAction("train")` any more — that double-plays. The three old pairs were collapsed.
- Like the other stingers, these ignore the Music toggle (that only mutes the music bed). Browsers start `AudioContext` suspended until a user gesture; actions are always user clicks, so that is fine. Without Web Audio (`new AudioContext` throws) `tone()` returns silently.

## 2026-11-04 — app / living action confirmation flash and spark treatment (bakeoff/gemini-flash)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Living Spark & Flash Design:
  - `ActionSparkPip` in `packages/app/src/hud/ActionFlash.tsx`: 15px living SVG spark starburst positioned on the corner of `.sc-action-flash-glyph-wrap`.
  - Action-specific heraldic motifs:
    - `build`: 4-point forge diamond spark with 4 diagonal micro-rays and warm ember aura.
    - `train`: elongated blade glint star with crossed clash diagonals and martial ruby-red stroke.
    - `trade`: 8-point faceted coin spark with sapphire rim and specular white center.
  - Chip atmospheric layering:
    - Base pill `.sc-action-flash-chip` with high-contrast text (`#fef9c3`), gold leaf border, and action-tinted shadow.
    - Radial atmospheric halo `.sc-action-flash-halo.is-${kind}` blooming outward behind the pill (`sc-action-flash-halo-pulse`).
    - Diagonal specular light sweep `.sc-action-flash-shimmer` traversing the pill surface (`sc-action-flash-shimmer-sweep`).
    - Orbiting micro spark motes `.sc-action-flash-spark-mote` (`is-top`, `is-bottom`, `is-trail`) drifting outward during entry (`sc-action-flash-mote-*`).
- Safety & Invariants:
  - All styles isolated in `packages/app/src/hud/action-flash.css`.
  - `.sc-action-flash, .sc-action-flash *` enforces `pointer-events: none !important;` so UI clicks are never intercepted.
  - `@media (prefers-reduced-motion: reduce)` disables keyframe animations and hides decorative particle motes while preserving readable static confirmation.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/hud/ActionFlash.test.tsx` (13 tests) verifies empty initial state, chip labels, brief timing, distinct vector charges per kind, living halo/shimmer/motes DOM structure, CSS keyframes, pointer-events safety, and absence of `theme.css` leakage.
  - Full suite passes: `npm test` (323 sim, 277 app, 158 server) and `npm run build -w @second-crown/app`.

## 2026-11-04 — app / action confirmation flash (wave/action-flash)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- Transport: `flashAction(kind)` dispatches a `window` `CustomEvent("sc-action-flash")` (same pattern as `sc-holiday-change`). `<ActionFlash />` in `AppShell` listens and shows one chip; a repeat flash bumps a key so the CSS animation replays, and resets the 900 ms hide timer. Timer is cleared on unmount.
- Why an event and not a prop: success is known deep inside `act(...)` callbacks across many components; threading a setter through `ActFn` would change its signature everywhere.
- Call `flashAction` only after the `try*` returned true (or the hold server accepted). Do not call it for upgrades, cancels, or refusals. To add another kind, extend `ActionFlashKind` plus `LABEL`/`GLYPH`, and a colour class in `action-flash.css`.
- Accessibility: chip is `aria-hidden`; the existing status line already announces the result.

## 2026-11-04 — app / living culture emblem on balance notes (bakeoff/gemini-balance)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. No game math or balance rules changed.
- Component integration:
  - `BalanceNotes` in `packages/app/src/BalanceNotes.tsx` reuses `CultureCrestPip` from `packages/app/src/hud/CultureCrestPip.tsx` at `size={15}` to sit harmoniously beside the culture name in `.sc-balance-culture-cell` without shifting line heights or table layout.
  - Player culture detection: `BalanceNotes` takes `props?: BalanceNotesProps` (`{ state?: GameState; playerCulture?: string }`). If `props.playerCulture` is provided it uses that; otherwise if `props.state` is provided it calls `playerCultureId(props.state)` from `packages/sim`; otherwise falls back to `rememberedCulture()`. This allows zero-prop usage in isolated previews while illuminating the active culture when rendered in `KingdomTab.tsx` (`<BalanceNotes state={state} />`).
  - Active culture visual state: the active row receives `.is-active-culture`, and its emblem receives `isSelected={true}`, activating its breathing golden aura and apex sparkle.
- Style isolation & Safety:
  - All emblem styling is isolated in `packages/app/src/hud/balance-notes.css`.
  - Strict `pointer-events: none !important;` applied across `.sc-balance-culture-cell .sc-culture-crest`, `svg`, `path`, aura, and glint elements.
  - Accessibility: `@media (prefers-reduced-motion: reduce)` disables crest float, pulse, and glint animations.
  - Zero changes to `packages/app/src/theme.css`.
- Verification:
  - `packages/app/src/BalanceNotes.test.tsx` covers base cost rendering, all 10 cultures' emblem presence with `data-culture`, active row selection styling, `pointer-events: none`, keyframes, and reduced-motion handling.
  - All tests pass: `npm test -w @second-crown/app` (61 test files, 264 tests), `npm run test -w @second-crown/render` (671 tests), sim (323 tests), and server (158 tests). `npm run build -w @second-crown/app` succeeds.

## 2026-11-04 — app / balance notes panel on the Kingdom tab (wave/balance-notes)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`. No new game math.
- `BalanceNotes` takes no props and no `GameState`: it reads static content only (`CULTURES`, `getUnitType`, `cultureLine`). So it shows **base** cost, not the live `trainCostMultiplier(state, id)` price. If a later slice wants live prices, pass `state` and call `trainCostMultiplier` (already exported) — do not re-derive the discounts in the app.
- Culture → unit mapping still lives only in `cultureLines.ts` (`UNIT_OF`); `cultureUnitId` exposes it so the panel does not duplicate it.
- Rendered as a native `<details>` so it stays closed and out of the way by default.

## 2026-11-03 — render & app / living hover treatment on diamond board (bakeoff/gemini-hover)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order on the Pixi board: backdrop, static tiles (cached), roads, road traffic, provinces/tokens, fog edge, weather, routes, keeps, pawns, node piles, outpost marks, selection rim, **hover highlight (living hover rim)**, status marks, almanac, unit labels, hover tooltip (top).
- Design & Non-Interference:
  - Previously, `paintBoardHighlight` called `paintBoardSelectionRim`, drawing a duplicate bold gold selection rim with outer glow and target pips whenever hovering any tile, causing visual confusion with the actual selected province rim.
  - New `paintBoardLivingHoverRim` introduces a dedicated visual identity:
    - Cool silver-pearl living breathing perimeter line (`BOARD_HOVER_RIM_PALE = 0xf8fafc`) with soft breathing sinusoidal modulation.
    - Soft translucent ground wash (`0xffffff` at living breathing alpha 0.04–0.09) giving immediate cursor focus without hiding roads, node piles, camps, or terrain contours.
    - Steady dark ink underlay (`BOARD_HOVER_RIM_INK = 0x0b0f17`, width 2.0px) for crisp contrast on bright snow, pale desert sand, and dark swamp tiles.
    - Corner focus ticks (4 on plateau, 4 on elevated base ring) providing tactile target precision without competing with the selection rim's cardinal pips.
  - Harmonization with selection:
    - If hovering an unselected province: draws the silver-pearl living hover rim.
    - If hovering the currently selected province: `boardSelectionLayer` already draws the prestigious gold rim; `boardHighlightLayer` avoids duplicate or clashing lines, adding a subtle living gold halo boost and corner sparkle that elevates selection.
  - Unscouted / fog tiles: renders an ethereal mist perimeter (`BOARD_HOVER_RIM_FOG = 0x94a3b8`), respecting fog mystery.
- SVG Kingdom Atlas (`OverworldAtlas.tsx` & `atlas-hover.css`):
  - Adds interactive hover tracking (`hoveredId`) on province polygon groups.
  - Renders `.sc-atlas-hover-rim` with translucent living wash (`.sc-atlas-hover-wash`), dark ink underlay (`.sc-atlas-hover-ink`), silver-pearl perimeter halo (`.sc-atlas-hover-halo`), and corner ticks (`.sc-atlas-hover-tick`).
  - Selected tile hover glint (`.sc-atlas-hover-glint`) for harmonious response.
  - Isolated stylesheet with strict `pointer-events: none !important;` on all decorative overlays and `@media (prefers-reduced-motion: reduce)` accessibility guard.
  - Zero modifications to `theme.css`.
- Verification:
  - Added unit test suite `packages/app/src/hud/atlasHover.test.tsx` and render tests in `packages/render/src/index.test.ts`.
  - All tests pass: `npm test`, `npm run test -w @second-crown/render` (671 tests), and `npm run build -w @second-crown/app`.

## 2026-11-03 — render / clearer province hover tooltip on diamond board (wave/board-hover)

- Slice constraints: Render only. Zero changes to `packages/sim`, `server/`, or `theme.css`.
- Layer order on the Pixi board: backdrop, static tiles (cached), roads, road traffic, provinces/tokens, fog edge, weather, routes, keeps, pawns, node piles, outpost marks, selection rim, hover highlight, status marks, almanac, unit labels, **hover tooltip (new, top)**.
- New file `hover.ts` (not `tokens.ts`, already 11k lines). It imports from `tokens.ts`, `camera.ts` and `tiles.ts`; nothing imports it except `index.ts`, so the graph stays acyclic.
- `resolveBoardHoverTooltip(state, bx, by)` is pure and deterministic (layout + rows); `paintBoardHoverTooltip` only draws. Stock uses `getNodeStockInfo` / `formatStockBadgeText` (same numbers as the stock badge). Status reuses `hasProvinceClash`, `hasProvinceIncoming`, `hasProvinceGather`, `getPostedGarrison` and `listMarches`; owner reads `occupantRealmId` + `state.realms[].name`.
- Fog: `resolveBoardHoverStatus` returns `unscouted` first for unseen tiles, and the rows become `?` — no stock / owner leak.
- Font: own 3x5 A–Z, 0–9, `/ - ? .` table (`BOARD_HOVER_GLYPHS_3X5`), same bit layout as `MARCH_ETA_GLYPHS_3X5`. `toHoverText` uppercases, drops unknown chars and cuts to 14.
- Placement: plate bottom 26px above the tile centre (terrain lift applied). If that would sit above the board's top tile, it flips 14px under the tile. X is clamped to the board's corner-tile extents.
- `paintBoardHighlight` (rim + text-less bottom plaque) is left as is; a later slice may drop the plaque now that the card carries the text.

## 2026-11-03 — app / living culture crest on the culture picker (bakeoff/gemini-culture)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Component design:
  - `CultureCrestPip.tsx` renders a 26x26px heraldic shield/cartouche with drop-shadow, dark ink backer `#0b0f17`, inner culture tabard field, and tailored vector charge for each of the 10 cultures:
    - `western` (Crown Marches): heater shield, royal coronet, cruciform steel sword.
    - `woodland` (Cedar Kin): sacred cedar pine, lobed leaf, antler glint.
    - `desert` (Sand Banner): radiant sunburst, desert crescent.
    - `steppe` (Wind Host): composite recurve bow, crimson horsehair plume.
    - `tide` (Tide Clans): curled breaker wave, triton fork, sea pearl.
    - `mist` (Mist Reach): swirling mist shroud, ranger arrow, brooch.
    - `glen` (Glen Holds): stone crag hold, chivalric triangular standard.
    - `salt` (Salt Reaches): faceted salt diamond, outrider couched lance.
    - `fen` (Fen Steads): water-reed marsh sheaf, warden spearhead, lily bloom.
    - `peak` (Peak Holds): snow pinnacle, watchtower beacon fire.
- Living motion & selection dynamics:
  - When `isSelected={true}`: activates `.sc-culture-crest-aura` (radiant breathing halo pulsing between 0.35 and 0.90 opacity using the culture's tabard gradient) and `.sc-culture-crest-glint` (golden diamond star sparkling atop the crest apex).
  - When idle: subtle floating translation (`translateY(-1.5px)`) at 4s cycle for soft ambient life.
- CSS isolation & pointer hygiene:
  - All styling located in `packages/app/src/hud/culture-picker.css`.
  - Every decorative element, aura, SVG path, and glint explicitly carries `pointer-events: none !important;`.
  - No collision with card selection tests: crest wrapper uses `.is-selected` (avoiding `.is-picked` collision with button state assertions in `cultureLines.test.tsx`).
  - Accessibility: Full `@media (prefers-reduced-motion: reduce)` rule resets transform, animations, and opacity to static readable defaults.
  - Zero touches to `theme.css`.
- Verification:
  - Added unit test suite `packages/app/src/hud/CultureCrestPip.test.tsx` (10 unique charges, selection aura/glint, integration in CulturePicker, pointer-events: none, no theme.css drift).
  - `npm test` and `npm run build -w @second-crown/app` pass.

## 2026-11-03 — app / clearer culture line in the culture picker (wave/culture-picker)

- Slice constraints: App only. Zero changes to `packages/sim`, `server/`, or `theme.css`.
- `cultureLine(id)` in `packages/app/src/cultureLines.ts` maps a culture to `{ unit, difference }`. The culture→unit pairing is UI copy only: the sim does **not** lock rangers, banners, outriders, wardens, or lancers to a culture (`unitUnlocked` checks studies only). The card says "Unit:", not "unique unit", for that reason. If the sim ever adds culture-locked units, move this map into `content/cultures.ts`.
- Numbers come from `MIST_FARM_BONUS` … `PEAK_KEEP_VISION_BONUS` and names from `getUnitType`, so a balance change shows up in the picker without a UI edit.
- Selection is unchanged: `setPlayerCulture` + `rememberCulture` on click; `is-picked` and "Your style" on the current card.
- Styles in `packages/app/src/hud/culture-picker.css` (`.sc-culture-lines`, `.sc-culture-line`, `-key`, `-val`, `.is-plain`).

## 2026-11-03 — render & app / living weather treatment on diamond board (bakeoff/gemini-weather)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order on the Pixi board: backdrop, static tiles (cached), roads, road traffic, provinces/tokens, fog edge, **weather (living rain, storm, snow, leaves)**, routes, keeps, pawns, node piles, outpost marks, selection rim, hover highlight, status marks, almanac, unit labels (top).
- Visual depth and readability:
  - Weather particles (rain streaks, snowflakes, fluttering leaves) draw on `boardWeatherGraphic` at layer index 6, so they fall naturally over the landscape and roads, but stay strictly underneath keeps, marching columns, meeples, camps, node piles, status markers, the almanac, and the selected province rim.
  - Steady dark ink underlays (`BOARD_WEATHER_INK = 0x0f172a`, `BOARD_WEATHER_INK_ALPHA = 0.34`) are laid beneath every droplet, snowflake, and leaf, providing high-contrast readability across bright desert, pale snow, and dark marsh tiles without obscuring any tokens above.
  - Rain features dynamic splash rings and delicate mist motes upon tile impact; snow features sinusoidal lateral flutter and soft settling ground flecks; autumn leaves feature sinusoidal wind sway, tumbling angular rotation, and ground tile landing settlement.
- SVG Kingdom Atlas (`OverworldAtlas.tsx` & `atlas-weather.css`):
  - Renders live animated rain streaks (`.sc-atlas-weather-drops`), fluttering snowflakes (`.sc-atlas-weather-flakes`), and fluttering autumn leaves (`.sc-atlas-weather-leaves`).
  - Mini weather glyph features weather-appropriate bounce, snow bob, and leaf sway animations.
- Strict isolation: `pointer-events: none !important;` on all decorative weather overlays; `@media (prefers-reduced-motion: reduce)` disables animations. Zero alterations to `theme.css`.
- Verification: Root `npm test` does not run render suite. Run `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app`.

## 2026-11-03 — render / clearer weather and season markers on diamond board (wave/board-weather)

- Slice constraints: Render only (`packages/render`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order on the Pixi board: backdrop, static tiles (cached), roads, road traffic, provinces/tokens, fog edge, weather, routes, keeps, pawns, node piles, outpost marks, selection rim, hover highlight, status marks, **almanac (new)**, unit labels (top).
- Why its own layer: the corner weather glyph used to draw inside `drawBoardWeather` on `boardWeatherGraphic`, which sits under routes, keeps, pawns, piles, camps, the rim and the status marks. It also drew nothing in clear weather and never showed the season. `boardAlmanacLayer` fixes all three.
- New file `almanac.ts` (not `atmosphere.ts`) because it needs `drawSeasonMark` from `tokens.ts`, and `tokens.ts` already imports `atmosphere.ts`. This keeps the import graph acyclic.
- `resolveBoardAlmanac(state, phase)` is the single source: `resolveAtmosphereWeather`, `resolveBoardSeasonMark`, `resolveDayPhase`. No sim math. Null state paints nothing (only `clear()`).
- Plaque box reuses the old glyph corner (`BOARD_WEATHER_GLYPH_X/Y/W`) but is two 20px slots tall (`BOARD_ALMANAC_H = 40`). A test checks all four corners are off the diamond and left of the sun/moon path.
- Ink is steady (`BOARD_ALMANAC_INK` at `BOARD_ALMANAC_INK_ALPHA`); only the emblems move (drop bob, sun ray spin, summer pulse).
- `paintBoardAlmanac` runs inside `updateBoardWeather`, so every place that repaints the board weather repaints the plaque. The band switch now calls `updateBoardWeather` instead of `drawBoardWeather` directly.
- The home-tile season pip on the status layer is unchanged.
- Verification: root `npm test` does not run the render suite. Run `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app`.

## 2026-11-03 — render & app / living effect and status treatment on diamond board (bakeoff/gemini-effects)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order on the Pixi board: backdrop, static tiles (cached), roads, road traffic, provinces/tokens, fog edge, weather, routes, keeps, pawns, node piles, outpost marks, selection rim, hover highlight, status marks (with living effects & sparks), unit labels (top).
- Visual depth and readability:
  - Living effect animations (`drawBoardStatusLivingEffect`) run atop the steady status plinths without modifying `BOARD_STATUS_INK` or plinth dimensions, ensuring existing plinth invariants hold while breathing martial sparks, threat beacons, and weather-tied glints animate smoothly at 60 FPS.
  - Weather integration: `fogEdge` marks dynamically react to `resolveAtmosphereWeather`, glittering with frost crystals in snow and electric mist particles in rain and storm.
  - Non-interference: All effect marks sit on `boardStatusMarksLayer` with `eventMode = "none"`, below unit labels so troop count and arrival time plates remain perfectly legible.
- Determinism: `drawBoardStatusLivingEffect` is a pure deterministic function of `phase`, mark coordinates, and atmospheric weather.
- SVG Kingdom Atlas (`OverworldAtlas.tsx` & `atlas-effects.css`): Living clash sparks (`.sc-atlas-status-clash`), threat beacons (`.sc-atlas-status-incoming`), and trail waypoints (`.sc-atlas-status-trail`).
- Strict isolation: `pointer-events: none !important;` on all decorative effect styles; `@media (prefers-reduced-motion: reduce)` disables animations. Zero alterations to `theme.css`.
- Verification: Root `npm test` does not run render suite. Run `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app`.

## 2026-11-03 — render / clearer effect and status markers on diamond board (wave/board-effects)

- Slice constraints: Render only (`packages/render`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order on the Pixi board: backdrop, static tiles (cached), roads, road traffic, provinces/tokens, fog edge, weather, routes, keeps, pawns, node piles, outpost marks, selection rim, hover highlight, **status marks (new)**, unit labels (top).
- Why its own layer: the status marks used to draw inside `paintProvinceDynamicToken` on `boardProvincesLayer`. That is under the fog edge, weather, routes, keeps, meeples, piles, camps and the select rim, so all of those could cover or wash out a mark. Same fix pattern as piles (`pilesOnOwnLayer`), outpost marks (`outpostMarksOnOwnLayer`) and keeps (`keepsOnOwnLayer`).
- `listBoardStatusMarks(state)` is the single source of what goes on the layer. It walks provinces in board depth order, skips unseen tiles, and uses the same `has*` / `resolve*` checks and offsets (`BOARD_STATUS_OFFSETS`) as the inline path. It is pure and does not use phase.
- `paintBoardStatusMarks` groups marks by tile. It draws every plinth for a tile first, then the emblems, so overlapping plinths (for example staffed next to fog edge) never cover a mark. Plinths are steady: `BOARD_STATUS_INK` at `BOARD_STATUS_INK_ALPHA` and a rim from `BOARD_STATUS_RIM_COLORS`. Clash and incoming get bigger plinths (`BOARD_STATUS_PLINTH_R_BY_KIND`).
- The emblem art itself is unchanged (`drawClashMark`, `drawIncomingMark`, and the rest). `drawBoardStatusEmblem` only dispatches to them.
- The destination ring (`paintBoardDestinationRing`) stays on the token layer. It is a tile-wide ring, not a mark.
- Unit labels stay the top board layer, so a count or ETA tag can still sit over a mark.
- Verification: root `npm test` does not run the render suite. Run `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app`.

## 2026-11-03 — render & app / living unit and march treatment on diamond board (bakeoff/gemini-units)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order on Pixi canvas: backdrop, static tiles (cached), roads, road traffic, provinces/tokens, fog edge, weather, routes (with trailing wake), keeps, pawns (with living status aura), node piles, outpost marks, selection, hover highlight, unit labels (top).
- Visual depth and readability:
  - The living status aura (`drawMarchMeepleAura`) sits directly under each marching meeple on `boardPawnsLayer`, expanding with a gentle breathing pulse (`BOARD_MARCH_ROLE_COLORS`). It grounds the meeple in the diamond grid and remains crisp and vibrant across dark night, white snow, pouring rain, and thick fog.
  - The living wake motes (`drawMarchWakeTrail`) sit on `boardRoutesLayer` trailing behind the advancing column progress, creating a sense of forward momentum along the march trail.
  - Stationed garrisons (`drawPostedGarrisonAura`) breathe with a calm defensive sentry ward beneath the tent and armament rack.
  - Steady unit tags on `boardUnitLabelsLayer` remain on the very top of the stack, untouched by meeple breathing or walk bob.
- Determinism: `drawMarchMeepleAura` and `drawMarchWakeTrail` are pure deterministic functions of `phase` and the unit index.
- SVG Kingdom Atlas (`OverworldAtlas.tsx` & `atlas-units.css`): Layered living status aura (`.sc-atlas-unit-pulse-glow`), trailing wake motes (`.sc-atlas-march-wake`), and sentry ward pulse (`.sc-atlas-unit-sentry`).
- Strict isolation: `pointer-events: none !important;` on all unit and march overlay styles; `@media (prefers-reduced-motion: reduce)` disables animations. Zero alterations to `theme.css`.
- Verification: Root `npm test` does not run render suite. Run `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app`.

## 2026-11-03 — render / clearer unit and march labels on diamond board (wave/board-units)

- Slice constraints: Render only (`packages/render`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order on Pixi canvas: backdrop, static tiles (cached), roads, road traffic, provinces/tokens, fog edge, weather, routes, keeps, pawns, node piles, outpost marks, selection, hover highlight, **unit labels** (top).
- Why on top: the old ETA pill lived on the pawns layer, so piles, camps, the select rim and hover could cover it, and it bobbed with the walk frame. A small plate on the top layer covers only a few pixels of the rim or hover. Readability: the pale halo works on dark ground (night, storm, wood, peak), the dark plate on pale ground (snow, fog veil, sun glow).
- Single source: `listBoardUnitLabels` is pure (state in, labels out) and redoes the same march position maths as `paintBoardMarches` (`calculateMarchProgress`, Manhattan distance) and the gather `progress` fallback (`0.5`). If either painter changes how it places a meeple, change the label list too, or the pointer drifts off the unit.
- Gathers: `paintBoardMarches` calls `paintBoardGathers` without `renderedGatherIds`, so a gather can be drawn twice (once as a march, once from `listGathersPresentation`). Labels follow what is drawn, so such a gather gets two labels. Fixing that dedupe is a separate change.
- Fog: posted-garrison labels need `isProvinceSeen`. March labels follow the meeples, which `paintBoardMarches` draws for every listed march.
- Old ETA pills: `paintBoardMarches(…, { etaBadges: false })`, `paintBoardGathers(…, undefined, { etaBadges: false })`, `drawRedWarbandMeeple(…, secs, false)`. `index.ts` passes `BOARD_MARCH_PAINT` (`{ etaBadges: false }`) at all four call sites. The layer-order test fails if any call site goes back to the old form.
- Found on `main` while doing this: `index.test.ts` had `<<<<<<<` / `=======` / `>>>>>>>` lines from the living-roads merge, so `npm run test -w @second-crown/render` loaded no tests. Root `npm test` does not run the render suite, which is why it stayed green. Also, `updateBand` in `index.ts` calls `paintBoardRoadTraffic` twice in a row (harmless, left as is).

## 2026-11-03 — render & app / living road treatment on diamond board (bakeoff/gemini-roads)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order on Pixi canvas: backdrop, static tiles (cached), **roads (bed)**, **roads (traffic/dust)**, provinces/tokens, fog edge, weather, routes, keeps, pawns, node piles, outpost marks, selection, hover highlight.
- Why roads and road traffic sit below tokens/weather/keeps/marches: status marks and pips sit near tile centers where roads cross. Roads and traffic below tokens/keeps/meeples ensure roads read naturally as running up to and into keeps, beneath march lines, node piles, and camps.
- Living motion: roads feature continuous deterministic traveler cart and trailing dust motion (`drawBoardRoadTraffic` / `paintBoardRoadTraffic`) on `boardRoadsTrafficLayer`. Mountain paths have solitary wanderers with light dust; trails into fog have subtle drifting edge dust puffs.
- SVG Kingdom Atlas (`OverworldAtlas.tsx` & `atlas-roads.css`): Layered ink underlay, packed-earth bed, pale crown, and living keyframe animated traffic (`.sc-atlas-road-traffic`), dust (`.sc-atlas-road-dust`), and dashed mountain paths (`.sc-atlas-path-dash`).
- Strict isolation: `pointer-events: none !important;` on all road overlays; `@media (prefers-reduced-motion: reduce)` motion guard. Zero alterations to `theme.css`.
- Root `npm test` does not run the render suite. Always run `npm run test -w @second-crown/render` and `npm run build -w @second-crown/app`.

## 2026-11-03 — render & app / living selected province treatment on diamond board (bakeoff/gemini-select)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order on Pixi canvas: backdrop, static tiles (cached), provinces/tokens, fog edge, weather, routes, keeps, pawns, node piles, outpost marks, **selection**, hover highlight. Selection rim remains readable and unobscured above weather, fog, routes, keeps, meeples, piles, and camps.
- Stroke order in `paintBoardSelectionRim`: pale halo (`SELECT_RIM_HALO`) -> ink underlay -> gold rim (steady alpha 1) -> amber glow (breathes) -> pips -> corner brackets (ink, then gold).
- SVG Kingdom Atlas (`OverworldAtlas.tsx` & `atlas-select-rim.css`): Mirrors the Pixi selection treatment with layered pale halo, dark ink underlay, breathing amber glow, gold core, and living corner brackets (`sc-atlas-bracket-shimmer`).
- Strict isolation: `pointer-events: none !important;` on all decorative selection overlays; `@media (prefers-reduced-motion: reduce)` disables animations. Zero alterations to `theme.css`.
- Root `npm test` does not run render suite. Always run `npm run test -w @second-crown/render` and `npm run build -w @second-crown/app`.

## 2026-11-02 — render & app / living keep treatment on diamond board (bakeoff/gemini-keeps)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order in `boardContainer` (bottom to top): backdrop, static tiles (cached), provinces/tokens, fog edge, weather, routes, **keeps**, pawns, node piles, outpost marks, selection, hover highlight. Keeps sit above route lines (a route now ends under its target keep) but below meeples, so a column leaving or reaching a hold stays visible.
- Keep pick logic (culture kit for the player, realm palette and kit for rival / `k_silk` / `k_ash` / `k_tide`) lives in `drawBoardKeep`. Plinth is steady.
- SVG Atlas (`packages/app/src/OverworldAtlas.tsx`): `MiniKeep` renders with steady dark ink plinth underlay with owner-colored rim (`.sc-atlas-keep-plinth`), living warm hearth doorway glow (`.sc-atlas-keep-light`), living watchfire beacon on home keep roof (`.sc-atlas-keep-beacon`), and fluttering heraldic banner standard atop roof (`.sc-atlas-keep-banner`). Isolated stylesheet in `packages/app/src/hud/atlas-keeps.css` with strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guard.
- Root `npm test` does not run the render suite. Run `npm run test -w @second-crown/render` too.

## 2026-11-02 — render & app / living march treatment on diamond board (bakeoff/gemini-marches)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order in `boardContainer` (bottom to top): backdrop, static tiles (terrain + fog veil, cached), provinces/tokens, fog edge, weather, **routes, pawns**, node piles, outpost marks, selection, hover highlight. Marches sit above fog edge and weather so precipitation and fog boundaries never obscure marching columns; keep them below piles, camps, rim and hover.
- The new Pixi path marks are steady (ink underlay, role color, direction chevrons), while meeples continue their animated step cadence and dotted trails on top.
- `boardMarchRole` mirrors the branch order in `paintBoardMarches` (scout > gather > garrison > player/hostile). Chevrons skip short hops (`< 1.5 x spacing`).
- SVG Atlas (`packages/app/src/OverworldAtlas.tsx`): marches render with high-contrast dark ink underlay, solid role/realm base line, animated marching trail (`.sc-atlas-march-trail`), trailing dust puffs (`.sc-atlas-march-dust`), and fluttering banner standard (`.sc-atlas-march-banner`). Isolated stylesheet in `packages/app/src/hud/atlas-marches.css` with strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` guard.
- Root `npm test` does not run the render suite. Run `npm run test -w @second-crown/render` too.

## 2026-11-02 — render & app / living fog treatment on diamond board (bakeoff/gemini-fog)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order in `boardContainer` (bottom to top): backdrop, static tiles (terrain + fog veil, cached), provinces/tokens, routes, pawns, **fog edge**, weather, node piles, outpost marks, selection, hover highlight. Keep the fog edge below weather and everything after it, or it will cover piles, camps and the rim.
- Edge geometry follows `boardGridToWorld`: neighbour `(x, y-1)` shares the top→right side (`ne`), `(x+1, y)` right→bottom (`se`), `(x, y+1)` bottom→left (`sw`), `(x-1, y)` left→top (`nw`). The edge is drawn at the tabletop plane (no elevation), on the unseen tile's side.
- The fog edge on Pixi is static: `updateBoardStatic` compares `computeBoardStaticCacheKey(state, "board")` to the last painted key, so it costs nothing per frame. Theme/season changes do not repaint it (colors are fixed, not themed).
- SVG Atlas (`packages/app/src/OverworldAtlas.tsx`): `MiniCloudVeil` includes `.sc-atlas-fog-drift`, `.sc-atlas-fog-puff`, and `.sc-atlas-fog-tendril` with isolated stylesheet `packages/app/src/hud/atlas-fog.css`. Unseen tiles have `.sc-atlas-fog-edge` (slate `#334155`) and `.sc-atlas-fog-mist` (pale `#e2e8f0`). Strict `pointer-events: none !important;` and `@media (prefers-reduced-motion: reduce)` motion guard.
- Root `npm test` does not run the render suite. Run `npm run test -w @second-crown/render` too.

## 2026-11-02 — render & app / living weather treatment on diamond board (bakeoff/gemini-weather)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order in `boardContainer` (bottom to top): backdrop, static tiles (terrain + fog veil, cached), provinces/tokens, routes, pawns, **weather**, node piles, outpost marks, selection, hover highlight.
- `drawBoardWeather` calls `drawAtmosphere` with `{ ink: true }`: rain, storm and snow marks lay a thin dark ink stroke/halo (`BOARD_WEATHER_INK` `0x0f172a`, alpha `0.34`) before the colored mark, lifting the particle off snow/fog without obscuring tiles.
- `paintBoardWeatherGlyph`: small 30x20 bronze plaque at `x=34, y=32` (empty top-left canvas corner, off the diamond) displaying animated cloud + rain/storm/snow drops.
- SVG Kingdom Atlas (`OverworldAtlas.tsx`): `MiniWeatherGlyph` renders corner weather badge, and seen tiles carry ink-backed animated precipitation streaks (`sc-atlas-weather-drops`, `sc-atlas-weather-flakes`) sitting underneath tokens and selection rims, styled via isolated `atlas-weather.css` (`pointer-events: none !important`, reduced-motion guard).

## 2026-11-02 — render & app / living outpost and camp treatment on diamond board (bakeoff/gemini-camps)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order in `boardContainer` (bottom to top): backdrop, static tiles (terrain + fog veil, cached), provinces/tokens, routes, pawns, weather, node piles, **outpost marks**, selection, hover highlight.
- `paintBoardOutpostMarks(g, state, phase)` clears, then for each seen tile with an outpost or camp (and not a hold) calls `drawBoardOutpostMark` at `cx + OUTPOST_MARK_DX, cy + OUTPOST_MARK_DY` (`-7, 4`). Unseen tiles get nothing.
- `drawBoardOutpostMark`: draws `drawOutpostMarkPlinth` (circle r `6.6`, `OUTPOST_MARK_INK` `0x0e0906` at fixed `0.68`, kind-coloured rim `OUTPOST_MARK_RIM_OUTPOST` `0x86efac` or `OUTPOST_MARK_RIM_CAMP` `0xfda4af` at `0.72`), then the existing `drawOutpostMark` (fluttering flag for outpost, pitched tent with apex pip for camp).
- `paintProvinceDynamicToken` gained an `outpostMarksOnOwnLayer` flag (passed `true` by `paintBoardDynamicTokens`, `false` by `paintBoardProvinces`).
- SVG Kingdom Atlas (`OverworldAtlas.tsx`): `MiniCamp` carries steady dark ink plinth underlay (`#0e0906`, opacity 0.68) with emerald (`#86efac`) or rose (`#fda4af`) rim (opacity 0.72), fluttering flag pennant (`sc-atlas-flag-flutter`), and flickering hearth lantern (`sc-atlas-lantern-flicker`) via isolated `atlas-camps.css` (`pointer-events: none !important`, reduced-motion guard).

## 2026-11-02 — render & app / living node pile treatment on diamond board (bakeoff/gemini-node-piles)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim`, `server/`, or `theme.css`. Game rules unchanged.
- Layer order in `boardContainer` (bottom to top): backdrop, static tiles (terrain + fog veil, cached), provinces/tokens, routes, pawns, weather, **node piles**, selection, hover highlight.
- `paintBoardNodePiles(g, state, phase)` clears, then for each seen woodcut / quarry / field tile (not a hold) calls `drawBoardNodePile` at the same anchor as before (`cx + 5, cy + 1`, `cy` = tile centre minus terrain elevation). Unseen tiles get nothing.
- `drawBoardNodePile`: when stocked, `drawNodePileInkPlinth` (ellipse `9.5 x 4.4`, `NODE_PILE_INK` `0x1c1208` at fixed `0.62`, rim `0xfde68a` at `0.38`), then the existing `drawNodeStockPile`; always the stock badge. Empty nodes still get no pile, only the `0/N` badge.
- `paintProvinceDynamicToken` gained a trailing `pilesOnOwnLayer` flag. `paintBoardDynamicTokens` passes `true`; `paintBoardProvinces` keeps the default `false` and draws piles inline. Ruins still go through `drawResourceNode` unchanged.
- Side effect: piles now draw above routes, pawns and the fog-edge pip at `cx + 5, cy - 3`, which overlaps the top of a full pile. If that reads badly, nudge the fog-edge pip rather than moving the pile layer down.
- SVG Kingdom Atlas (`OverworldAtlas.tsx`): `MiniLogs`, `MiniSacks`, and `MiniBlocks` carry steady dark ink plinth underlays (`#1c1208`, opacity 0.62) with warm rims (`#fde68a`, opacity 0.38) and subtle breathing motion via isolated `atlas-node-piles.css` (`pointer-events: none !important`, reduced-motion guard).
- `index.test.ts` on `origin/main` had unresolved conflict markers (around the select-rim ink test) so the render suite could not compile. Kept the HEAD side.

## 2026-11-02 — render & app / living selected-province rim treatment on diamond board (bakeoff/gemini-select-rim)

- Slice constraints: Render and App (`packages/render`, `packages/app`). Zero changes to `packages/sim` or `server`. Zero changes to `theme.css`. Game rules unchanged.
- Layer order in `boardContainer` (`packages/render/src/index.ts`):
  - `boardSelectionLayer` is moved above `boardWeatherGraphic` (and static fog veil, below hover `boardHighlightLayer`). Rain, snow, storm clouds, and sun/moon glow no longer wash out the selection rim.
- Living selection rim on diamond board (`packages/render/src/tokens.ts`):
  - `paintBoardSelectionRim` step 0: steady dark ink contrast underlay (`SELECT_RIM_INK = 0x1c1208`, `SELECT_RIM_INK_ALPHA = 0.72`, `SELECT_RIM_INK_WIDTH = 4.5`) drawn under ground ring, elevated plateau, and corner cliff struts before gold strokes. Does not pulse with gold to maintain contrast on snow, pale fog, and sun/moon glow.
  - Step 1 & 3: Living pulse and soft glow (`glowAlpha = 0.45 + breath * 0.12`), brilliant gold core rim (`0xfacc15`), sunlit rear facet highlights (`0xffffff`), elevated corner struts, and cardinal reticle corner bracket gems.
- Atlas diamond board treatment (`packages/app/src/OverworldAtlas.tsx`, `packages/app/src/hud/atlas-select-rim.css`):
  - Renders layered selection rim with dark ink underlay, glowing amber aura, and compositor-only living pulse on the Kingdom Atlas diamond board.
  - Strict `pointer-events: none` on `.sc-atlas-select-rim` and all children. Styles isolated in `hud/atlas-select-rim.css` with `@media (prefers-reduced-motion: reduce)` guard, leaving `theme.css` untouched.
- Verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-11-02 — app / living log pips inside hold log cards (bakeoff/gemini-hold-log-pips)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `HoldLogPip` & CSS isolation (`packages/app/src/hud/HoldLogPip.tsx`, `packages/app/src/hud/hold-log-pip.css`):
  - Renders 16px (`viewBox="0 0 16 16"`) living SVG log pips depicting an illuminated chronicle parchment folio with calligraphic ink entries and heraldic emblems tailored to logged intents (`train`, `farm`, `cottage`, `lumber`, `stamp`, `default`).
  - Strictly enforces `pointer-events: none` inline and in stylesheet on `.sc-hold-log-pip-wrapper, .sc-hold-log-pip-wrapper *, .sc-hold-log-pip`.
  - Gentle living rhythm (`@keyframes sc-hold-log-pip-breathe`) animates only compositor-safe `transform` and `opacity` on `.sc-hold-log-pip-glyph`, staggered with delays (`0s`, `-1.2s`, `-2.4s`) across cards, disabled under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - In `.sc-hold-log-list`, renders `<HoldLogPip intent={c.text} />` inside each `.sc-hold-log-card` ahead of `.sc-hold-log-tick` and `.sc-hold-log-text`.
  - Preserves adjacent sibling placement between `.sc-hold-log-tick` and `.sc-hold-log-text` for existing test matchers in `hud/IntentPip.test.tsx`.
  - Card layout and grid styles (`.sc-hold-log-list`, `.sc-hold-log-card`, `.sc-hold-log-tick`, `.sc-hold-log-text`) are carried in `hold-log-pip.css` and `hold-log.css`, harmonizing with parallel branches without modifying `theme.css`.
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-11-02 — app / living work pips inside hold work cards (bakeoff/gemini-hold-work-pips)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `HoldWorkPip` & CSS isolation (`packages/app/src/hud/HoldWorkPip.tsx`, `packages/app/src/hud/hold-work-pip.css`):
  - Renders 16px (`viewBox="0 0 16 16"`) living SVG work pips for `militia` (conical nasal helm with golden brow band), `farms` (reaping sickle with golden wheat ear), `cottages` (thatched cottage with glowing hearth and chimney smoke plume), and `lumberCamps` (felling axe in timber stump).
  - Strictly enforces `pointer-events: none` inline and in stylesheet on `.sc-hold-work-pip-wrapper, .sc-hold-work-pip-wrapper *, .sc-hold-work-pip`.
  - Gentle living rhythm (`@keyframes sc-hold-work-pip-breathe`) animates only compositor-safe `transform` and `opacity` on `.sc-hold-work-pip-glyph`, staggered with offsets (`0s`, `-0.9s`, `-1.8s`, `-2.7s`) across the 4 work types, disabled under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - In `.sc-hold-works`, renders `<HoldWorkPip work={w.id} />` in each `.sc-hold-work-card` ahead of `.sc-hold-work-name`.
  - Preserves adjacent sibling placement between `.sc-hold-work-name` and `.sc-hold-work-count`, satisfying parallel test matchers.
  - Card layout and grid styles (`.sc-hold-works`, `.sc-hold-work-card`, `.sc-hold-work-name`, `.sc-hold-work-count`, `.sc-hold-work-status`) are carried in `hold-work-pip.css`, harmonizing with parallel branches without modifying `theme.css`.
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-11-02 — app / living key pip inside hold key card (bakeoff/gemini-hold-key-pip)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `HoldKeyPip` & CSS isolation (`packages/app/src/hud/HoldKeyPip.tsx`, `packages/app/src/hud/hold-key-pip.css`):
  - Renders a 16px (`viewBox="0 0 16 16"`) living SVG key pip depicting an antique golden royal skeleton key with trefoil bow and bit teeth.
  - Strictly enforces `pointer-events: none` inline and in stylesheet on `.sc-hold-key-pip-wrapper, .sc-hold-key-pip-wrapper *, .sc-hold-key-pip`.
  - Gentle living rhythm (`@keyframes sc-hold-key-pip-breathe`) animates only compositor-safe `transform` and `opacity` on `.sc-hold-key-pip-glyph`, disabled under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - In `.sc-hold-key-card`, renders `<HoldKeyPip />` directly inside the key card when `madeKey !== null`.
  - Card styles (`.sc-hold-key-card`, `.sc-hold-key-title`, `.sc-hold-key-row`, `.sc-hold-key-value`, `.sc-hold-key-copy`, `.sc-hold-key-note`, `.sc-hold-key-warning`) are carried in `hold-key-pip.css`, seamlessly harmonizing with parallel branches without touching `theme.css`.
  - Card positioning adjustments (`position: relative; padding-right: 26px;`) give room for the top-right pip while preserving key/seal/button indices tested in `hud/KeySealPip.test.tsx` and `hud/CopyFlashPip.test.tsx`.
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-11-02 — app / living leave pip inside hold leave card (bakeoff/gemini-hold-leave-pip)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `HoldLeavePip` & CSS isolation (`packages/app/src/hud/HoldLeavePip.tsx`, `packages/app/src/hud/hold-leave-pip.css`):
  - Renders a 16px (`viewBox="0 0 16 16"`) living SVG leave pip depicting an open postern archway with morning horizon.
  - Strictly enforces `pointer-events: none` inline and in stylesheet on `.sc-hold-leave-pip-wrapper, .sc-hold-leave-pip-wrapper *, .sc-hold-leave-pip`.
  - Gentle living rhythm (`@keyframes sc-hold-leave-pip-breathe`) animates only compositor-safe `transform` and `opacity` on `.sc-hold-leave-pip-glyph`, disabled under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - In `.sc-hold-leave-card`, renders `<HoldLeavePip />` directly inside the card when `confirmLeave` is true.
  - Sibling structure preserves `/Leave hold <code>([^<]+)<\/code>\?/` and button matchers in `hud/leaveConfirm.test.tsx`.
  - Card positioning adjustments (`position: relative; padding-right: 26px;`) are carried in `hold-leave-pip.css`, giving clean room for the top-right pip without touching `theme.css`.
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-11-02 — app / hold leave card (wave/hud-hold-leave)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `JoinHoldCard.tsx`: when `confirmLeave` is true, the Leave action card renders `.sc-hold-leave-card` (`.sc-hold-leave-title`, `.sc-hold-leave-warning`, `.sc-hold-leave-buttons`). Confirm leave calls the same `leave()`; Cancel sets `confirmLeave` false. State, `confirmLeaveSeq`, and the `LeaveSealPip` pulse are unchanged; the seal now sits before Confirm leave.
- `hud/hold-leave.css` is imported directly by `JoinHoldCard.tsx` so it actually loads. Note: `hud/leave-confirm.css` (and `hold-stamps.css`, `hold-status.css`, `hold-stores.css`, `hold-actions.css`) are not imported by any module; the live `.sc-leave-confirm` rules were in `hold-action-pip.css`. Those `.sc-leave-confirm` selectors are now dead. Not cleaned up here.
- The warning text is new copy: "The hold keeps running. To join again you need the realm id and its key." It matches current behavior (leaving does not stop the hold; rejoining needs the key).
- Tests: `hud/leaveConfirm.test.tsx`: card hidden until opened, title + warning + Confirm leave / Cancel when open, exactly one plain Leave button, no card when unjoined, CSS file present. Other leave tests switched from `Leave`/`Stay` to `Confirm leave`/`Cancel`.

## 2026-11-02 — app / living stamp pip inside hold stamp cards (bakeoff/gemini-hold-stamp-pip)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `HoldStampPip` & CSS isolation (`packages/app/src/hud/HoldStampPip.tsx`, `packages/app/src/hud/hold-stamp-pip.css`):
  - Renders a 16px (`viewBox="0 0 16 16"`) living SVG wax-seal pip stamped with royal signet crown emblem.
  - Strictly enforces `pointer-events: none` inline and in stylesheet on `.sc-hold-stamp-pip-wrapper, .sc-hold-stamp-pip-wrapper *, .sc-hold-stamp-pip`.
  - Gentle living rhythm (`@keyframes sc-hold-stamp-pip-breathe`) animates only compositor-safe `transform` and `opacity` on `.sc-hold-stamp-pip-glyph`, disabled under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - In `.sc-hold-stamps`, renders `.sc-hold-stamp-card` cards inside `.sc-hold-stamps-list` under a **Stamps** heading (newest first up to 5, "No stamps yet." when empty).
  - Each card contains `<HoldStampPip />` followed by `<span className="sc-hold-stamp-tick">Tick {s.tick}</span><span className="sc-hold-stamp-by">{s.by}</span>`, preserving adjacent regex matcher `/sc-hold-stamp-tick">Tick (?:<!-- -->)?(\d+)<\/span><span class="sc-hold-stamp-by">([^<]+)/`.
  - Card styles (`.sc-hold-stamps`, `.sc-hold-stamps-heading`, `.sc-hold-stamps-empty`, `.sc-hold-stamps-list`, `.sc-hold-stamp-card`, etc.) are carried in `hold-stamp-pip.css`, avoiding missing stylesheet build failures while staying harmoniously compatible with parallel branches.
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-11-02 — app / living status pip inside hold status card (bakeoff/gemini-hold-status-pip)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `HoldStatusPip` & CSS isolation (`packages/app/src/hud/HoldStatusPip.tsx`, `packages/app/src/hud/hold-status-pip.css`):
  - Renders a 16px (`viewBox="0 0 16 16"`) living SVG royal status crown pip with live emerald heartbeat jewel (or warm amber when pending intents are in flight).
  - Strictly enforces `pointer-events: none` inline and in stylesheet on `.sc-hold-status-pip-wrapper, .sc-hold-status-pip-wrapper *, .sc-hold-status-pip`.
  - Gentle living rhythm (`@keyframes sc-hold-status-pip-breathe`) animates only compositor-safe `transform` and `opacity` on `.sc-hold-status-pip-glyph` (accelerating softly when pending), disabled under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - In `.sc-hold-status`, renders `<HoldStatusPip pending={view.pending > 0} />` alongside Realm, Tick, and Pending fields. Direct field order and structure preserves any `/sc-hold-status-label">([^<]+)<\/span><(?:code|span) class="sc-hold-status-value/` regex matchers.
  - Status card styles (`.sc-hold-status`, `.sc-hold-status-field`, `.sc-hold-status-label`, `.sc-hold-status-value`, etc.) are carried in `hold-status-pip.css`, avoiding missing stylesheet build failures while staying harmoniously compatible with parallel branches.
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-11-02 — app / living action pips inside hold action cards (bakeoff/gemini-hold-action-pips)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `HoldActionPip` & CSS isolation (`packages/app/src/hud/HoldActionPip.tsx`, `packages/app/src/hud/hold-action-pip.css`):
  - Renders a 16px (`viewBox="0 0 16 16"`) living SVG action pip for each action kind (`train`, `build`, `stamp`, `leave`): broadsword & spear for Train, craftsman mallet & trowel for Build, turned brass signet stamp on crimson wax for Stamp, and sunlit postern archway for Leave.
  - Strictly enforces `pointer-events: none` inline and in stylesheet on `.sc-hold-action-pip-wrapper, .sc-hold-action-pip-wrapper *, .sc-hold-action-pip`.
  - Gentle living rhythm (`@keyframes sc-hold-action-pip-breathe`) animates only compositor-safe `transform` and `opacity` on `.sc-hold-action-pip-glyph` with staggered delays per action (`0s`, `-0.9s`, `-1.8s`, `-2.7s`), disabled under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - In `.sc-hold-actions`, groups the action buttons into four `.sc-hold-action-card` cards (Train, Build, Stamp, Leave), rendering `<HoldActionPip action={act} />` alongside the label and buttons. The leave confirmation sits inside the Leave card.
  - Action card styles (`.sc-hold-actions`, `.sc-hold-action-card`, `.sc-hold-action-card-build`, `.sc-hold-action-label`) are carried in `hold-action-pip.css`, avoiding missing stylesheet build failures while staying harmoniously compatible with parallel branches.
  - `leaveConfirm.test.tsx` updated to count `<button>Leave</button>` matches rather than bare `>Leave<` which appears in the card label.
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-30 — app / living resource pips inside hold store cards (bakeoff/gemini-hold-pips)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `HoldStorePip` & CSS isolation (`packages/app/src/hud/HoldStorePip.tsx`, `packages/app/src/hud/hold-store-pip.css`):
  - Renders a 16px (`viewBox="0 0 16 16"`) living SVG resource pip for each resource kind (`food`, `wood`, `stone`, `gold`): golden wheat sheaf for food, stacked bark-and-ring timber logs for wood, beveled dressed ashlar block for stone, and stamped crown coin for gold.
  - Strictly enforces `pointer-events: none` inline and in stylesheet on `.sc-hold-store-pip-wrapper, .sc-hold-store-pip-wrapper *, .sc-hold-store-pip`.
  - Gentle living rhythm (`@keyframes sc-hold-pip-breathe`) animates only compositor-safe `transform` and `opacity` on `.sc-hold-store-pip-glyph` with staggered delays per resource (`0s`, `-0.9s`, `-1.8s`, `-2.7s`), disabled under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - In `.sc-hold-stores`, maps `HOLD_STORES` into four `.sc-hold-store-card` cards, rendering `<HoldStorePip resource={id} />` alongside the store name and amount. Direct sibling order preserves any `/sc-hold-store-name">([^<]+)<\/span><span class="sc-hold-store-amount">/` matchers.
  - Card styles (`.sc-hold-stores`, `.sc-hold-store-card`, `.sc-hold-store-name`, `.sc-hold-store-amount`) are carried in `hold-store-pip.css`, avoiding missing stylesheet build failures while staying harmoniously compatible with parallel branches.
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-30 — app / living wax-seal pip on Leave confirmation (bakeoff/gemini-leave-seal)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `LeaveSealPip` & CSS isolation (`packages/app/src/hud/LeaveSealPip.tsx`, `packages/app/src/hud/leave-seal.css`):
  - Renders a 16px (`viewBox="0 0 16 16"`) crimson-gold royal wax-seal SVG stamped with a postern arch and parting chevron signet, enforcing inline `pointerEvents: "none"` and stylesheet `.sc-leave-seal-pip-wrapper, .sc-leave-seal-pip-wrapper * { pointer-events: none; }` (`aria-hidden="true"`).
  - One-shot pulse (`animation: sc-leave-seal-pulse 480ms cubic-bezier(0.22, 1, 0.36, 1) 1`) animates only compositor-safe `opacity` and `transform` (`scale`) on `.sc-leave-seal-pip-glyph`, keyed by `confirmLeaveSeq` so opening the confirmation replays the single pulse cleanly, and disables animation under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - Matches `wave/hud-hold-leave`'s `confirmLeave` / `initialConfirmLeave` state and `aria-label="Confirm leave"` structure, placing `<LeaveSealPip pulse pulseKey={confirmLeaveSeq} />` inside `.sc-leave-seal-group` next to the confirm `Leave` button strictly while `confirmLeave` is `true` (and `view !== null`).
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-30 — app / living confirmation flash next to hold Copy button (bakeoff/gemini-copy-flash)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `CopyFlashPip` & CSS isolation (`packages/app/src/hud/CopyFlashPip.tsx`, `packages/app/src/hud/copy-flash.css`):
  - Renders a 16px (`viewBox="0 0 16 16"`) golden starburst and emerald check roundel SVG pip, enforcing inline and stylesheet `pointer-events: none` and `user-select: none` (`aria-hidden="true"`).
  - One-shot animation (`@keyframes sc-copy-flash-pop`) animates only compositor-safe `opacity` and `transform` (`scale`) on `.sc-copy-flash-pip-glyph` (keyed by `flashKey` so repeated copies replay cleanly) and disables animation under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - Keeps `copyFlash` separate from persistent `copied` button state: after `navigator.clipboard.writeText(madeKey)` succeeds, `copyFlash` turns `true` for `COPY_FLASH_MS` (`1400ms`) via `startCopyFlashTimer` and then unmounts `CopyFlashPip` (`setCopyFlash(false)`).
  - Failed clipboard writes never set `copyFlash`, and `join()`, `leave()`, and unmount cancel any pending timer; when `view === null` (no hold joined), `CopyFlashPip` is never rendered.
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-30 — app / leave hint on the hold card (wave/hold-leave-hint)

- Slice constraints: App only (`packages/app/src/JoinHoldCard.tsx`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- The hint is a plain `<div>` with inline style (`fontSize: 12, marginTop: 4, opacity: 0.75`) placed right after the `.sc-plain-inline` row that holds the Leave button, inside the joined-hold branch, so it only shows while `view` is set. No new CSS file, no new class.
- `join`, `leave`, `stamp`, and the intent helpers are untouched.
- Footgun from #290: it merged `KeySealPip.tsx` and its test but not the `JoinHoldCard` wiring, so `origin/main` failed `npm test` and `tsc -b`. This branch adds `initialView` / `initialMadeKey` (default `null`, used only as `useState` seeds for `renderToStaticMarkup` tests) and renders `KeySealPip` inside `.sc-key-seal-group` before the key. Lesson: run `npm run build -w @second-crown/app` on the merge result, not only the branch.

## 2026-10-30 — app / living seal next to hold key (bakeoff/gemini-key-seal)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `KeySealPip` & CSS isolation (`packages/app/src/hud/KeySealPip.tsx`, `packages/app/src/hud/key-seal.css`):
  - Renders a 16px (`viewBox="0 0 16 16"`) crimson-gold royal wax-seal SVG stamped with a key signet, enforcing inline and stylesheet `pointer-events: none` and `user-select: none` (`aria-hidden="true"`).
  - One-shot pulse (`animation: sc-key-seal-pulse 480ms cubic-bezier(0.22, 1, 0.36, 1) 1`) animates only `transform` (`scale`) and `opacity` on `.sc-key-seal-pip-glyph`, keyed by `madeKey` so it pulses once when the key is first shown (without re-pulsing on 1-second `readHold` polls or `Copy key` toggles), and disables animation under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - Renders `<KeySealPip pulse pulseKey={madeKey} />` inside `.sc-key-seal-group` strictly inside `{madeKey !== null ? (...) : null}`, guaranteeing zero `KeySealPip` DOM nodes when the key is not visible (`view === null` or `madeKey === null`).
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-29 — app / living pip next to shared-hold intent log (bakeoff/gemini-intent-pip)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Game rules unchanged.
- `IntentPip` & CSS isolation (`packages/app/src/hud/IntentPip.tsx`, `packages/app/src/hud/intent-pip.css`):
  - Renders a 16px (`viewBox="0 0 16 16"`) stamped royal wax-seal / quill SVG pip with inline and stylesheet `pointer-events: none` (`aria-hidden="true"`).
  - One-shot pulse (`animation: sc-intent-pip-pulse 460ms cubic-bezier(0.22, 1, 0.36, 1) 1`) animates only `transform` (`scale`) and `opacity` on `.sc-intent-pip-glyph`, keyed by `pulseKey` so each newly added intent replays a single pulse without timers, and disables animation under `@media (prefers-reduced-motion: reduce)`.
- Hold card wiring (`packages/app/src/JoinHoldCard.tsx`):
  - `HoldIntentLog` returns `null` when `lines.length === 0`, guaranteeing zero `IntentPip` DOM nodes when there are no intent log lines.
  - `resolveHoldIntentLines` delegates to `recentIntents(realmId, 3)` on `net/hold` when exported (compatible with `wave/intent-log`) and falls back to bounded per-hold local card entries (`LOCAL_INTENT_CAP = 8`, newest 3 shown) on accepted intents (`stamp`, `train`, `build`, `cottage`, `lumber`).
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-29 — app / save and load audit log in Ledger of Crowns (bakeoff/gemini-save-audit)

- Slice constraints: App only (`packages/app`). Zero changes to `packages/sim`, `packages/render`, `server/`, or `theme.css`. Save format and game rules unchanged.
- Why client-memory instead of `GameState.flags.world_log`: Mutating `GameState` on save/load would alter `serializeState` output and violate `server/gate.mjs` ("state cannot change without time or a recorded action"). Keeping the bounded 24-entry store in `packages/app/src/save/audit.ts` (re-exported via `packages/app/src/save.ts`) leaves `serializeState(state)` byte-for-byte identical.
- Audit coverage & upload peek:
  - `saveToIndexedDb`, `downloadSave`, `pushSave`, and pulled/shared cache writes call `recordSaveWritten` (`"Save written · tick <N>"`).
  - `loadFromIndexedDb`, `pickSaveFile`, `startSave`, and shared-server `loadSaved` call `recordSaveLoaded` (`"Save loaded · tick <N>"`).
  - `CloudPanel` uses `peekFromIndexedDb` when reading local bytes solely to upload them to cloud (`Push save`, `autoPush`, `keepLocal`, `Share watch link`), avoiding false `"Save loaded"` entries during uploads.
  - `newGame` calls `clearSaveAudit()` before persisting the fresh crown at tick 0.
- React 18 external store integration: `LedgerPanel.tsx` subscribes via `React.useSyncExternalStore(subscribeSaveAudit, getSaveAuditSnapshot, getSaveAuditSnapshot)` with a cached frozen snapshot reference (preventing infinite snapshot loops and supporting `renderToStaticMarkup` in Node tests) and merges entries newest-first via `listLedgerWithSaveAudit`.
- Verification: `git diff origin/main -- packages/sim packages/render server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-29 — render / static board tile cache and dynamic frame layer (bakeoff/gemini-board-cache)

- Slice constraints: Render only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Two-layer board split (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`):
  - `boardStaticTilesLayer` (`Graphics` managed by `createBoardStaticLayerCache` / `paintBoardStaticTiles`): caches static tile drop shadows, 3D cliff height faces (`paintTileHeightFace`), raised diamond plateaus, terrain relief (`plain`, `wood`, `hill`, `waste`, `shore`, `peak`), and unseen province fog veils (`paintFogHeightVeil`).
  - `computeBoardStaticCacheKey(state, band)` keys strictly on camera `band` and each province's coordinates/terrain + `seen`/`unseen` status (`isProvinceSeen`). In `"hold"` band, `boardStaticCache.update` skips board painting altogether; in `"board"` band, `boardStaticTilesLayer` only repaints when entering `"board"` band or when the `seen`/`unseen` set changes (plus explicit `invalidate()` on season/holiday theme switch).
  - `boardProvincesLayer` (`paintBoardDynamicTokens`), `boardRoutesLayer` / `boardPawnsLayer` (`paintBoardMarches`), `boardSelectionLayer`, and `boardWeatherGraphic` (`drawAtmosphere` for weather + sun/moon) stay on separate layers above `boardStaticTilesLayer` and redraw every frame in `"board"` band.
  - Standalone `paintBoardProvinces` continues to run both per-province passes in depth order for direct unit-test callers.
- Hit-testing & fog: All board layers enforce `eventMode = "none"` (`pointer-events: none`). Unseen tiles stay fog (`paintFogHeightVeil`), and `hitTestProvince` / camera math / zoom remain untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-29 — render / moving sun/moon, tile-plane weather, and night variants (bakeoff/gemini-sun-moon)

- Slice constraints: Render only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- No full-canvas washes: `drawAtmosphere` in `packages/render/src/atmosphere.ts` emits zero `g.rect` calls and never tints the full board.
- Sun/moon arc & local lighting: `resolveSunMoonPosition(state, animPhase)` checks explicit state/flag overrides first, then dynamically calls `(sim as Record<string, any>)["sunMoonPosition"](state)` when exported by `@second-crown/sim` (automatically adopting `DAY_CYCLE_TICKS` from `sim` when `wave/day-cycle-slow` merges), and falls back to the half-sine sky arc (`elevation = Math.sin(Math.PI * x)`). `celestialScreenPoint` maps `pos` across the top of the board clear of the `(516, 44)` compass rose and projects a small local lighting ellipse (`rx <= 42, ry <= 19`) onto the isometric tile plane directly beneath the sun (warm gold/amber) or moon (cool blue). At night, moonlight halo circles (`r <= 21`) stay strictly near the moon sprite.
- Tile-plane precipitation: `weatherDropTarget` maps deterministic Coprime/Golden-Ratio points onto `boardGridToWorld(bx, by)` inside the 12x8 board (`16` rain streaks, `24` storm streaks + localized sky-to-board lightning bolt, `16` snow dots) starting above the board's top diamond edge and terminating on the tile surface with small droplet ripples or settling snow flecks.
- Night variants: When `resolveDayPhase(state, phase) === "night"`, unbreached keeps (`drawMiniatureKeep`, `drawIsometricBuilding`), cottages, farms, academies, and infirmaries darken their daytime windows to `0x1e293b` and draw warm amber lanterns (`0xf59e0b` halo, `0xd97706` brass cage, `0xfef08a` core), while marching player army, garrison, and gather columns draw `drawNightMarchLantern`. Sprites without windows/lanterns (`quarry`, `lumber_camp`, `walls`, `archery_range`, scouts, etc.) skip cleanly.
- Hit-testing & fog: All overlay Graphics enforce `eventMode = "none"` (`pointer-events: none`). Unseen tiles stay fog (`paintFogHeightVeil`), and `hitTestProvince` / camera math / zoom remain untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-29 — render / day/night visual cycle and deeper weather atmosphere (bakeoff/gemini-day-night)

- Slice constraints: Render only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Day phase & weather resolution: `resolveDayPhase(state, animPhase)` checks explicit state/flag overrides first, then dynamically calls `(sim as Record<string, any>)["dayPhase"](state)` if exported by `@second-crown/sim`, and falls back to the 120-tick cycle (`0..19` dawn, `20..69` day, `70..89` dusk, `90..119` night). `resolveAtmosphereWeather(state)` likewise checks explicit overrides, then `sim["weatherFor"]`, then season fallback.
- Visual layers:
  - Dawn: warm gold rising wash (`0xfbbf24`) + eastern sunrise horizon glow (`0xf59e0b`, `0xfef08a`).
  - Day: clear warm daylight wash (`0xfef08a`).
  - Dusk: amber sunset wash (`0xd97706`) + western amber-copper horizon glow (`0xf59e0b`, `0xb45309`).
  - Night: lower-brightness darkening veil (`0x0f172a`, alpha `0.22`) + cool nocturnal blue moonlight wash (`0x1e3a8a`, alpha `0.12`).
  - Weather overlays preserved across all day phases: Clear gold glaze, Rain cool blue + drifting streaks, Storm dark blue + heavier streaks + lightning flash, Snow pale grey + drifting snow dots.
  - Shadows: ground contact shadows under keeps (`drawMiniatureKeep`, `drawIsometricBuilding`) and walls/gates (`drawIsometricBuilding`) darken in both `night` and `storm` (and deepest in `night + storm`).
  - Wind sway: trees (`drawWoodTile`, `lumber_camp` pines, Sand `farm` palm fronds) and banners (`drawMiniatureKeep` pennants) sway with `phase` and scale amplitude via `resolveWindStrength(weather)`.
  - Thicker fog edge marks: `drawFogEdgeMark` adds a billowing outer mist halo, denser rolling vapor banks, and elevated opacity when weather is `"storm"` or `"snow"`.
- Hit-testing & fog: All overlay Graphics enforce `eventMode = "none"` (`pointer-events: none`). Unseen tiles stay fog (`paintFogHeightVeil`), and `hitTestProvince` / camera math / zoom remain untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-29 — render / living atmosphere effects on isometric board (bakeoff/gemini-atmosphere)

- Slice constraints: Render only. Living board atmosphere only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Weather detection & fallback: `resolveAtmosphereWeather(state)` / `weatherForState(state)` dynamically queries `weatherFor(state)` from `@second-crown/sim` if present (e.g. from `wave/weather` when merged), else falls back cleanly to `flags.weather` or `currentSeason(state)` (`"winter"` -> snow, `"autumn"` -> rain, `"summer"` -> clear, `"spring"` -> clear). Zero sim modifications required.
- Visual layers:
  - Day/Night cycle: subtle ambient tint calculated by `resolveDayNightCycle(state, phase)` fading from warm daylight (`0xfef08a`) to cool midnight slate (`0x0f172a`).
  - Precipitation overlay: Clear (warm sunbeam glaze), Rain (translucent blue wash + 64 animated drifting rain streaks), Storm (dense deep-navy atmospheric veil + 96 driving rain streaks + intermittent thunderous lightning flash), Snow (pale frost glaze + 72 drifting snow flakes).
  - Ground shadows: keeps and walls in `tokens.ts` (`drawMiniatureKeep`) and `buildings.ts` (`drawIsometricBuilding`) darken their contact ambient occlusion shadows when `resolveAtmosphereWeather(state) === "storm"`.
  - Wind sway: pine tree boughs in `drawWoodTile` sway with phase and coordinate-based phase offsets. Keep banners already possessed wind wave math.
- Hit-testing & fog: Rendered onto dedicated weather overlay graphics container with `eventMode = "none"` (`pointer-events: none`). Camera math, zoom, and tile click hit-testing (`hitTestProvince`) are untouched. Unseen tiles stay fogged.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-29 — render / tile at edge of vision shows fog edge mark on diamond (bakeoff/gemini-fog-edge-mark)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Fog edge detection: `hasProvinceFogEdge(state, provinceId)` reads only existing vision and adjacency helpers (`isProvinceSeen`, `neighbors`) with zero new sim math. Returns `false` if the tile is unseen (so unseen tiles stay fog). Returns `true` when a seen province has at least one unseen neighbor (`!isProvinceSeen(state, n.id)`). Fully surrounded seen tiles (all neighbors seen) get no mark.
- Visual design: `drawFogEdgeMark(g, cx, cy, phase)` paints a compact slate mist pip (`0x131d2e` dark slate-fog roundel with `0x64748b` slate mist rim, `0x1e293b` deep twilight disk, `0x64748b` & `0x94a3b8` swirling mist banks, `0xcfdbe8` drifting cloud puffs, `0xe2e8f0` cresting mist wisp, and `0xf8fafc` vapor condensation glint). Uses `0x131d2e` for the roundel backing so it does not collide with `0x0c2718` (staffed mark), `0x1f1610` (building mark), `0x251a06` (hold mark), `0x141419` (owner mark), `0x211508` (gather mark), `0x071e2e` (scout mark), `0x062c1e` (garrison mark), `0x042619` (outpost mark), `0x2a0808` (camp mark), `0x0d1520` (season mark), `0x19160d` (trail mark), `0x1c1206` (incoming mark), `0x1a0b0e` (clash mark), or `0x090d16` (stock badge).
- Integrated into `paintBoardProvinces` at `(cx + 5, cy - 3)` right after `drawStaffedMark`, preserving terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, hold marks, building marks, staffed marks, piles, ruins, camps, and keeps. Centered at the upper-right flank on the isometric diamond, forming a symmetrical pair with staffed mark at `(cx - 5, cy - 3)` with at least 5.8px clearance from all surrounding marks.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-29 — render / tile with staffed building shows staffed mark on diamond (bakeoff/gemini-staffed-mark)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Staffed detection: `hasProvinceStaffed(state, provinceId)` reads only existing building, citizen, and visibility helpers (`isProvinceSeen`, `state.board.homeProvinceId`, `state.buildings`, `state.citizens`, `isBuildingStaffed`) with zero new sim math. Returns `false` if the tile is unseen (so unseen tiles stay fog). Returns `true` when a finished player building (`completesAtTick === null`) on the tile has at least one worker posted (`isBuildingStaffed(state, b)` or `staffBonus(state, b) > 1`). Empty buildings and under-construction buildings get no mark.
- Visual design: `drawStaffedMark(g, cx, cy, phase)` paints a compact green worker pip (`0x0c2718` dark moss-forest roundel with `0x22c55e` fresh leaf green rim, `0x144026` deep-spruce disk, `0x7ec27a` / `0x4ade80` soft green worker tunic, `0x2b1810` / `0xd97706` dark belt and brass buckle, `0xfde68a` worker head with `0x22c55e` green cap, `0xb45309` timber tool handle with `0xe2e8f0` steel tool head and `0xfef08a` glint). Uses `0x0c2718` for the roundel backing so it does not collide with `0x1f1610` (building mark), `0x251a06` (hold mark), `0x141419` (owner mark), `0x211508` (gather mark), `0x071e2e` (scout mark), `0x062c1e` (garrison mark), `0x042619` (outpost mark), `0x2a0808` (camp mark), `0x0d1520` (season mark), `0x19160d` (trail mark), `0x1c1206` (incoming mark), `0x1a0b0e` (clash mark), or `0x090d16` (stock badge).
- Integrated into `paintBoardProvinces` at `(cx - 5, cy - 3)` right after `drawBuildingMark`, preserving terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, hold marks, building marks, piles, ruins, camps, and keeps. Centered at the upper-left flank on the isometric diamond with at least 5.8px clearance from all surrounding marks.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-25 — render / tile with finished building shows building mark on diamond (bakeoff/gemini-building-mark)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Building detection: `hasProvinceBuilding(state, provinceId)` reads only existing building and visibility helpers (`isProvinceSeen`, `state.board.homeProvinceId`, `state.buildings`) with zero new sim math. Returns `false` if the tile is unseen (so unseen tiles stay fog). Returns `true` when a player building on the tile has finished (`completesAtTick === null`, matching `countBuilding`). Under-construction buildings (`completesAtTick !== null`) get no mark.
- Visual design: `drawBuildingMark(g, cx, cy, phase)` paints a compact cream building pip (`0x1f1610` dark timber-stone roundel with `0xd4a373` warm sandstone rim, `0x3a281c` deep-walnut disk, `0xf3e9d2` cream masonry facade, `0xdeb887` gabled timber roof, `0xfff8ee` roof highlights, `0x2b1810` dark arched timber door, and `0xd97706` / `0xfef3c7` chimney with hearth warmth). Uses `0x1f1610` for the roundel backing so it does not collide with `0x251a06` (hold mark), `0x141419` (owner mark), `0x211508` (gather mark), `0x071e2e` (scout mark), `0x062c1e` (garrison mark), `0x042619` (outpost mark), `0x2a0808` (camp mark), `0x0d1520` (season mark), `0x19160d` (trail mark), `0x1c1206` (incoming mark), `0x1a0b0e` (clash mark), or `0x090d16` (stock badge), and avoids `0xfacc15`.
- Integrated into `paintBoardProvinces` at `(cx, cy - 9)` right after `drawHoldMark`, preserving terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, hold marks, piles, ruins, camps, and keeps. Centered at the upper apex between Trail `(-8, -8)` and Incoming `(+8, -8)` on the isometric diamond.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-24 — render / tile that is part of player hold shows hold mark on diamond (bakeoff/gemini-hold-mark)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Hold detection: `hasProvinceHold(state, provinceId)` reads only existing hold, building, and visibility helpers (`isProvinceSeen`, `state.board.homeProvinceId`, `state.buildings`) with zero new sim math. Returns `false` if the tile is unseen (so unseen tiles stay fog). Returns `true` when `provinceId === state.board.homeProvinceId` or when any player building in `state.buildings` resides on or targets `provinceId`.
- Visual design: `drawHoldMark(g, cx, cy, phase)` paints a compact gold crown pip (`0x251a06` dark imperial gold roundel with `0xd97706` warm amber rim, `0x422d08` deep-bronze disk, `0xf59e0b` crown base band, `0xfbbf24` 3-pointed gold crown peaks, `0xfef08a` peak finial pips, and `0xef4444` headband ruby glint). Uses `0x251a06` for the roundel backing so it does not collide with `0x141419` (owner mark), `0x211508` (gather mark), `0x071e2e` (scout mark), `0x062c1e` (garrison mark), `0x042619` (outpost mark), `0x2a0808` (camp mark), `0x0d1520` (season mark), `0x19160d` (trail mark), `0x1c1206` (incoming mark), `0x1a0b0e` (clash mark), or `0x090d16` (stock badge), and avoids `0xfacc15` and `0xd4a373`.
- Integrated into `paintBoardProvinces` at `(cx - 7, cy + 4)` right after `drawOwnerMark`, preserving terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, piles, ruins, camps, and keeps. On the player's home tile, this location is open (as outpost mark is excluded from home tile) and balances the season mark at `(cx + 7, cy + 4)`.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Rival owner detection: `resolveProvinceOwnerMark(state, provinceId)` and `hasProvinceOwner(state, provinceId)` read only existing province ownership and visibility helpers (`isProvinceSeen`, `p.occupantRealmId`) with zero new sim math. Returns `null` if the tile is unseen (so unseen tiles stay fog), unowned, or held by the player (`p.occupantRealmId === "player"`, player-owned tiles get no mark). Returns the rival `realmId` string when `p.occupantRealmId` is a rival realm.
- Visual design: `drawOwnerMark(g, cx, cy, realmIdOrPal, phase)` paints a compact realm crest or banner pip (`0x141419` dark iron-slate roundel with `pal.borderColor` rim, `pal.rimColor` inner disk, `pal.studColor` vertical flagpole, `pal.pennantColor` fluttering swallowtail banner, and `pal.accentColor` crest finial pip). Uses `0x141419` for the roundel backing so it does not collide with `0x211508` (gather mark), `0x071e2e` (scout mark), `0x062c1e` (garrison mark), `0x042619` (outpost mark), `0x2a0808` (camp mark), `0x0d1520` (season mark), `0x19160d` (trail mark), `0x1c1206` (incoming mark), `0x1a0b0e` (clash mark), or `0x090d16` (stock badge), and avoids `0xfacc15` and `0xd4a373`.
- Integrated into `paintBoardProvinces` at `(cx + 7, cy + 4)` right after `drawGatherMark`, preserving terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, piles, ruins, camps, and keeps. On rival-owned tiles, this location is open (as season mark is only on player home keep) and balances the camp mark at `(cx - 7, cy + 4)`.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-24 — render / tile with gather shows gather mark on diamond (bakeoff/gemini-gather-mark)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Gather detection: `hasProvinceGather(state, provinceId)` reads only existing gather, march, and visibility helpers (`isProvinceSeen`, `listGathers`, `listMarches`) with zero new sim math. Returns `false` if the tile is unseen (so unseen tiles stay fog) or if a gather has `phase === "returning"` (already left the tile). Returns `true` when any player gather in `listGathers(state)` has `toId === provinceId` and `phase === "gathering"` or `phase === "outbound"`, or when an explicit player gather march (`purpose === "gather"`) targets `provinceId`.
- Visual design: `drawGatherMark(g, cx, cy, phase)` paints a compact amber cart and sack pip (`0x211508` dark amber-chestnut roundel with `0xb45309` rim, `0x45270d` deep-ochre disk, `0xd97706` handcart bed, `0xf59e0b` plump amber gather sack, `0xfbbf24` tied sack crown & wheel rim, and `0xfef3c7` wheel hub pip). Uses `0x211508` for the roundel backing so it does not collide with `0x071e2e` (scout mark), `0x062c1e` (garrison mark), `0x042619` (outpost mark), `0x2a0808` (camp mark), `0x0d1520` (season mark), `0x19160d` (trail mark), `0x1c1206` (incoming mark), `0x1a0b0e` (clash mark), or `0x090d16` (stock badge), and avoids `0xfacc15` and `0xd4a373`.
- Integrated into `paintBoardProvinces` at `(cx - 11, cy - 1)` right after `drawScoutMark`, preserving terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, piles, ruins, camps, and keeps.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-24 — render / tile with scout shows scout mark on diamond (bakeoff/gemini-scout-mark)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Scout detection: `hasProvinceScout(state, provinceId)` reads only existing march, scout, and visibility helpers (`isProvinceSeen`, `listMarches`, `isScoutMarch`) with zero new sim math. Returns `false` if the tile is unseen (so unseen tiles stay fog). Returns `true` when any player scout march (`m.realmId === "player" && isScoutMarch(m)`) has `m.toId === provinceId` (covering both inbound and arrived scouts).
- Visual design: `drawScoutMark(g, cx, cy, phase)` paints a compact sky cloak and spyglass pip (`0x071e2e` dark sky-slate roundel with `0x0284c7` rim, `0x0c4a6e` deep-sky disk, `0x0ea5e9` / `0x38bdf8` swept sky-blue cloak & hood, and `0x7dd3fc` / `0xe0f2fe` spyglass barrel & gleaming objective lens). Uses `0x071e2e` for the roundel backing so it does not collide with `0x062c1e` (garrison mark), `0x042619` (outpost mark), `0x2a0808` (camp mark), `0x0d1520` (season mark), `0x19160d` (trail mark), `0x1c1206` (incoming mark), `0x1a0b0e` (clash mark), or `0x090d16` (stock badge), and avoids `0xfacc15` and `0xd4a373`.
- Integrated into `paintBoardProvinces` at `(cx + 11, cy - 1)` right after `drawGarrisonMark`, preserving terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, piles, ruins, camps, and keeps.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-24 — render / tile with posted garrison shows garrison mark on diamond (bakeoff/gemini-garrison-mark)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Garrison detection: `hasProvinceGarrison(state, provinceId)` reads only existing garrison and visibility helpers (`isProvinceSeen`, `garrisonAt`) with zero new sim math. Returns `false` if the tile is unseen (so unseen tiles stay fog). Returns `true` when `garrisonAt(state, provinceId)` is truthy.
- Visual design: `drawGarrisonMark(g, cx, cy, phase)` paints a compact emerald heater-shield and tent pip (`0x062c1e` dark emerald-iron roundel with `0x047857` rim, `0x059669` / `0x10b981` emerald shield body with `0x6ee7b7` bevel rim, and `0xd1fae5` / `0x064e3b` / `0xa7f3d0` pitched garrison tent emblem). Uses `0x062c1e` for the roundel backing so it does not collide with `0x042619` (outpost mark), `0x2a0808` (camp mark), `0x0d1520` (season mark), `0x19160d` (trail mark), `0x1c1206` (incoming mark), `0x1a0b0e` (clash mark), or `0x090d16` (stock badge), and avoids `0xfacc15` and `0xd4a373`.
- Integrated into `paintBoardProvinces` at `(cx, cy + 6)` right after `drawSeasonMark`, preserving terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, piles, ruins, camps, and keeps.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-23 — render / season mark on diamond (bakeoff/gemini-season)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Season detection: `resolveBoardSeasonMark(stateOrSeason)` and `resolveProvinceSeasonMark(state, provinceId)` read only existing season and visibility helpers (`getSeasonFromState` / `currentSeason(state)`, `isProvinceSeen`) with zero new sim math. `resolveProvinceSeasonMark` returns `null` if the tile is unseen (so unseen tiles stay fog) or is not `state.board.homeProvinceId`, and returns `"spring"`, `"summer"`, `"autumn"`, or `"winter"` on the seen home tile.
- Visual design: `drawSeasonMark(g, cx, cy, seasonOrState, phase)` paints a compact season pip (`0x0d1520` outer roundel backing) with four distinct seasonal emblems:
  - `"spring"`: soft green leaf (`0x132a1c` inner disk, `0x15803d` rim, `0x4ade80` / `0x16a34a` leaf blade, `0xbbf7d0` vein & dewdrop). Avoids `0x86efac` (`8843180`) and `0x34d399` so existing Spring terrain/wash negative color assertions remain untouched.
  - `"summer"`: gold sun (`0x2b1f07` inner disk, `0xca8a04` rim, `0xfbbf24` 8-point starburst rays, `0xfacc15` sun disk, `0xfef08a` core).
  - `"autumn"`: amber leaf (`0x2c1608` inner disk, `0x9a3412` rim, `0xf59e0b` / `0xd97706` lobed leaf, `0xfcd34d` vein & tip).
  - `"winter"`: pale blue flake (`0x0c2233` inner disk, `0x0284c7` rim, `0x7dd3fc` crystal diamond core, `0xbae6fd` 6-point snowflake arms, `0xe0f2fe` crystal tips).
- Integrated into `paintBoardProvinces` at `(cx + 7, cy + 4)` on the seen home tile right after `drawOutpostMark`, preserving terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, piles, ruins, camps, and keeps.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-23 — render / player outpost and rival camp show status marks on diamond (bakeoff/gemini-outpost-mark)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Outpost & camp detection: `resolveProvinceOutpostMark(state, provinceId)` reads only existing board and outpost helpers (`isProvinceSeen`, `getProvince`, `listOutposts`) with zero new sim math. Returns `null` if the tile is unseen (so unseen tiles stay fog) or is the player's home keep (`homeProvinceId`). Returns `"outpost"` when the tile is a player outpost (`listOutposts`) and `"camp"` when `p.node === "camp" && p.occupantRealmId !== "player"`.
- Visual design: `drawOutpostMark(g, cx, cy, kind, phase)` paints a compact emerald flag pip (`0x042619` dark emerald roundel with `0x047857` rim, `0x059669` emerald disk, `0xe2e8f0` flagpole mast, and `0x10b981` / `0x6ee7b7` / `0xa7f3d0` swallowtail emerald flag) for `"outpost"`, and a compact deep-red camp pip (`0x2a0808` dark garnet roundel with `0x7f1d1d` rim, `0x991b1b` deep-red disk, and `0xb91c1c` / `0xdc2626` / `0x450a0a` / `0xfca5a5` pitched war-camp tent) for `"camp"`. Uses `0x042619` and `0x2a0808` for the roundel backings so they do not collide with `0x19160d` (trail mark), `0x1c1206` (incoming mark), `0x1a0b0e` (clash mark), `0x18181b` (basalt crag fissures), or `0x090d16` (stock badge pill), and avoids `0xfacc15` and `0xd4a373`.
- Integrated into `paintBoardProvinces` at `(cx - 7, cy + 4)` right after `drawTrailMark`, preserving terrain, stock badges, clash marks, incoming marks, trail marks, piles, ruins, and keeps.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-19 — render / tile with your column on or heading to it shows trail mark on diamond (bakeoff/gemini-trail)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Player march detection: `hasProvinceTrail(state, provinceId)` reads only existing board and march helpers (`isProvinceSeen`, `listMarches`) with zero new sim math. Returns `false` if the tile is unseen (so unseen tiles stay fog). Returns `true` when any player march (`m.realmId === "player"`) is on or heading to `provinceId`.
- Visual design: `drawTrailMark(g, cx, cy, phase)` paints a compact soft-gold footprint and trail pip emblem (`0x19160d` dark bronze-charcoal roundel with `0x85682a` / `0xa68438` rim, `0xc49e48` / `0xd4b062` / `0xe6c87a` stepping boot footprints, and `0xf5e6b3` trailing breadcrumb pips). Uses `0x19160d` for the roundel backing so it does not collide with `0x1c1206` (incoming mark roundel), `0x1a0b0e` (clash mark roundel), `0x18181b` (basalt crag fissures), or `0x090d16` (stock badge pill), and avoids `0xfacc15` and `0xd4a373`.
- Integrated into `paintBoardProvinces` at `(cx - 8, cy - 8)` right after `drawIncomingMark`, so a tile with a player column, a hostile column, and an active clash displays all three marks cleanly without overlapping, and terrain, stock badges, clash marks, incoming marks, piles, ruins, camps, outposts, and keeps stay as they are.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-19 — render / tile with hostile column inbound shows incoming mark on diamond (bakeoff/gemini-incoming-mark)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Hostile march detection: `hasProvinceIncoming(state, provinceId)` reads only existing board and march helpers (`isProvinceSeen`, `incomingOnProvince`, `listMarches`) with zero new sim math. Returns `false` if the tile is unseen (so unseen tiles stay fog). Returns `true` when any non-player march (`m.realmId !== "player"`) is heading to `provinceId`.
- Visual design: `drawIncomingMark(g, cx, cy, phase)` paints a compact amber arrow and threat pip emblem (`0x1c1206` dark amber-obsidian roundel with `0x92400e` rim, `0xb45309` / `0x78350f` amber threat diamond, `0xd97706` / `0xf59e0b` / `0xfbbf24` downward amber chevron arrow and shaft, and `0xfef3c7` threat pip core glint). Uses `0x1c1206` for the roundel backing so it does not collide with `0x1a0b0e` (clash mark roundel), `0x18181b` (basalt crag fissures), or `0x090d16` (stock badge pill), and avoids `0xfacc15` and `0xd4a373`.
- Integrated into `paintBoardProvinces` at `(cx + 8, cy - 8)` right after `drawClashMark`, so a tile with both a hostile column inbound and an active clash displays both marks cleanly without overlapping, and terrain, stock badges, clash marks, piles, ruins, camps, outposts, and keeps stay as they are.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-19 — render / fighting tile shows clash mark on diamond (bakeoff/gemini-clash)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Engagement detection: `hasProvinceClash(state, provinceId)` reads only existing board and march helpers (`isProvinceSeen`, `listMarches`, `incomingOnProvince`, `garrisonAt`, `getProvince`) with zero new sim math. Returns `false` if the tile is unseen (so unseen tiles stay fog). Returns `true` when columns of two or more realms target the tile (column clash), when a rival column targets a player-held tile or garrisoned outpost, or when a non-scout column targets a tile occupied by another realm.
- Visual design: `drawClashMark(g, cx, cy, phase)` paints a compact crossed-swords and impact burst emblem (`0x1a0b0e` dark blood-iron roundel with `0x991b1b` crimson rim, `0xdc2626` / `0xf97316` 8-point starburst, `0xcbd5e1` / `0xe2e8f0` crossed steel broadswords with `0xd97706` brass crossguards/pommels and `0x78350f` leather grips, and a `0xfef08a` / `0xffffff` central clash spark). Uses `0x1a0b0e` for the roundel backing so it does not collide with `0x18181b` (used in basalt crag fissures) or `0x090d16` (used in stock badges), and avoids `0xfacc15` and `0xd4a373`.
- Integrated into `paintBoardProvinces` after `paintBoardDestinationRing`, preserving terrain, stock badges, piles, ruins, camps, outposts, and keeps.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-19 — render / seen gather tile shows stock number badge on diamond (bakeoff/gemini-stock-badge)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Visual design: `drawStockBadge(g, cx, cy, stock, stockMax)` paints a compact dark pill (`0x090d16` fill, `0x000000` alpha 0.42 drop shadow, `0x475569` border when stocked or `0x3f3f46` when dry) tucked beside the existing resource pile (`pillX = Math.round(cx + 5 - pillW / 2)`, `pillY = Math.round(cy + 4)`, `pillH = 7`). Uses a 3x5 pixel bitmap glyph table (`STOCK_BADGE_GLYPHS_3X5`) to render the ratio `stock/stockMax` (e.g. `12/40`) in crisp light text (`0xf8fafc`, alpha 0.96) when `stock > 0`, and `0/N` in muted grey (`0x94a3b8`, alpha 0.85) when dry (`stock <= 0`). Returns immediately with zero drawing calls when `stockMax <= 0`. Uses `g.rect` rather than `roundRect` so lightweight mock graphics objects across all test suites work seamlessly, and avoids reserved terrain/structure test colors (`0xfacc15`, `0xd4a373`, `0x34d399`, `0x140e0a`, `0xe7e5e4`).
- Integrated into `paintBoardProvinces` right after `drawResourceNode` when `p.node === "woodcut" || p.node === "quarry" || p.node === "field"`, ensuring unseen tiles stay fog (`paintFogHeightVeil`) and peaks, hills, wastes, woods, plains, shores, ruins, camps, outposts, and keeps stay as they are.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-19 — render / plain tile shows pastoral meadow on diamond (bakeoff/gemini-plain)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Visual design: `drawPlainMeadow(g, cx, cy, hw, hh, phase, options)` (and alias `drawPlainTile`) paints a low pastoral green meadow on the plain diamond plateau (`hw = 16`, `hh = 8`). Features a gentle shadow (`0x000000` alpha 0.24 contact shadow cast southeast and `0x14532d` alpha 0.42 base shadow), soft grass swells and rolling knoll contours (`0x365314`, `0x3f6212`, `0x4d7c0f`, `0x65a30d`, `0x84cc16`, `0xa3e635`), and 5 low clustered grass tufts with gentle tuft shadows (`0x1a2e05`), fanning grass blades (`0x84cc16`, `0xbef264`), and meadow clover/dew specks (`0xd9f99d`, `0xecfccb`). Deliberately avoids `0xfacc15` (flag gold), `0xd4a373` (tent rope), `0x34d399` (wood needle crest), `0x334155` (peak arête), `0xe7e5e4` (hill crown rim), and `0x140e0a` (waste ash bed) to preserve all existing bakeoff test invariants. No keep, no flag, no tent.
- Integrated into `paintBoardProvinces` under `case "plain"`, ensuring peaks, hills, wastes, woods, shores, ruins, camps, outposts, resource piles, and keeps stay as they are. Unseen tiles continue to stay fog (`paintFogHeightVeil`).
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-19 — render / waste tile shows scorched basalt crag on diamond (bakeoff/gemini-waste)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Visual design: `drawWasteCrag(g, cx, cy, hw, hh, phase, options)` (and alias `drawWasteTile`) paints a low scorched basalt rise on the waste diamond plateau (`hw = 16`, `hh = 8`). Features a soft contact shadow (`0x000000` alpha 0.36) and scorched ash caldera bed (`0x140e0a`, `0x1c1917`), cracked ash crust plates and grey ash drifts (`0x44403c`, `0x57534e`, `0x78716c`, `0xa8a29e`), a lower fractured basalt shelf and angular jagged upper basalt crags (`0x09090b`, `0x18181b`, `0x27272a`, `0x292524`, `0x3f3f46`, `0x52525b`, `0x71717a`), and a faint subterranean heat glow with ember fissures (`0x7f1d1d`, `0x991b1b`, `0xea580c`, `0xef4444`, `0xf97316`, `0xfdba74`, `0xfef08a`). Deliberately avoids `0xfacc15` (flag gold) and `0xd4a373` (tent rope) to preserve strict `bakeoff/gemini-ruins` test invariants when a ruins node sits on waste terrain. No keep, no flag, no tent.
- Integrated into `paintBoardProvinces` under `case "waste"`, ensuring peaks, hills, woods, shores, ruins, camps, outposts, resource piles, and keeps stay as they are. Unseen tiles continue to stay fog (`paintFogHeightVeil`).
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-19 — render / hill tile shows stepped rise on diamond (bakeoff/gemini-hill)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim`, `server/`, or `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Visual design: `drawHillRise(g, cx, cy, hw, hh, phase, options)` (and alias `drawHillTile`) paints a low stepped plateau on the hill diamond plateau (`hw = 16`, `hh = 8`). Features a soft shadow (`0x000000` alpha 0.34 contact ellipse cast southeast; `0x292524` alpha 0.45 base shadow), three stepped tiers of warm ochre (`0xb45309`, `0x92400e` on Tier 1; `0xd97706` on Tier 2; `0xca8a04`, `0xf59e0b` on Tier 3) and stone (`0x78716c`, `0x44403c` risers on Tier 1; `0xa8a29e`, `0x57534e` risers on Tier 2; `0xd6d3d1`, `0x78716c` risers on Tier 3; contour rims `0xa8a29e`, `0xd6d3d1`, `0xe7e5e4`), and weathered stone outcrops (`0x78716c`, `0x57534e`, `0x92400e`). No keep, no flag, no tent.
- Integrated into `paintBoardProvinces` under `case "hill"`, ensuring peaks, woods, shores, ruins, camps, outposts, resource piles, and keeps stay as they are. Unseen tiles continue to stay fog (`paintFogHeightVeil`).
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test`, `npm run test -w @second-crown/render`, and `npm run build -w @second-crown/app` pass.

## 2026-10-14 — server / audio MIME (wave/audio-mime)

- Root cause: `MIME` in `server/static.mjs` had no audio types, so `.ogg` / `.mp3` / `.wav` fell through to `application/octet-stream`. Some browsers refuse to decode an `<audio>` source with that type; Vite's dev server sends the right type, so it only broke live.
- Fix is three map entries. `staticPath` and the symlink check are untouched, so the gate tests still cover every escape.
- Determinism: no sim change. Server display path only.

## 2026-10-14 — app / peak line (wave/hud-peak)

- Peak is a `TerrainId` (`packages/shared`), like shore and wood, so the line keys off `p.terrain`.
- `peakLine(seen, terrain)` (pure, `hud/peakLine.ts`) mirrors `woodLine` so it can be unit tested. `seen` is the card's existing `isProvinceSeen`, so fog keeps the line hidden.
- Determinism: no sim change. Display only.

## 2026-10-14 — app / wood line (wave/hud-wood)

- Wood is a `TerrainId` (`packages/shared`), like shore, so the line keys off `p.terrain`. Not to be confused with the `woodcut` node ("Timber stand") or the wood resource; this line is terrain only.
- `woodLine(seen, terrain)` (pure, `hud/woodLine.ts`) mirrors `shoreLine` so it can be unit tested. `seen` is the card's existing `isProvinceSeen`, so fog keeps the line hidden.
- Determinism: no sim change. Display only.

## 2026-10-14 — app / shore line (wave/hud-shore)

- Shore is a `TerrainId` (`packages/shared`), not a node, so the line keys off `p.terrain`, not `p.node`. The Terrain fact already read "Shore"; the extra line says what it means (water edge) the same way the ruins line does.
- The condition lives in `shoreLine(seen, terrain)` (pure, `hud/shoreLine.ts`), mirroring `ruinsLine`, so it can be unit tested; the app has no React render tests. `seen` is the same `isProvinceSeen` the card already uses, so fog keeps the line hidden.
- Determinism: no sim change. Display only.

## 2026-10-14 — render / ruins tile shows broken keep on diamond (bakeoff/gemini-ruins)

- Slice constraints: Render only. Board tile only. Zero changes to `packages/sim` or `server/`. No changes to `theme.css`. Camera math, zoom, and tile click hit-testing unchanged.
- Visual design: `drawRuinedKeep(g, cx, cy, phase, options)` creates a miniature broken keep silhouette sized proportionally for the isometric diamond tile (radius ~11px base). Crumbled foundation plinth/talus (`0x292524`, border `0x1c1917`), standing left wall stub with battlements sheared off (`0x78716c`), lower crumbled right stub (`0x44403c`), exposed inner rubble core along jagged breaklines (`0xa8a29e`), deep structural fissures (`0x18181b`), fractured arched doorway opening with wedged fallen lintel stone (`0x57534e`), loose ashlar blocks and tumbled stones strewn across the talus (`0xd6d3d1`, `0xa8a29e`, `0x78716c`), and wild creeping moss/lichen highlights (`0x3f6212`, `0x4d7c0f`). Explicitly no banner, flag, or cloth tent canvas.
- Integrated into `drawResourceNode` under `case "ruins"`, preserving stock pile rendering (`drawNodeStockPile`) when stock exists on the province.
- In `paintBoardProvinces`, player outposts and NPC territory overlays are guarded with `if (p.node !== "ruins")` so claiming a ruins node retains the ruined keep rather than overriding it with a camp tent or faction flag.
- Hit-testing: Rendered onto the board graphics layer with `pointer-events: none` semantics; diamond click math via `hitTestProvince` is untouched.
- Determinism & verification: `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty. `npm test` and `npm run test -w @second-crown/render` pass.

## 2026-10-14 — server / static gate (wave/static-gate)

- Root cause: `tryStatic` checked `path.normalize(path.join(DIST, rel)).startsWith(path.normalize(DIST))`. A string prefix, not a folder check: `/..%2fdist-secret/x` resolves to a sibling `.../app/dist-secret/x`, which starts with `.../app/dist` and was served. On Windows `%5c` (`\`) is a separator, so `..%5c` also climbed. `new URL()` already folds literal and `%2e%2e` dot segments, but not encoded slashes, which is why the decode-then-join path was open.
- Fix: `server/static.mjs`. `staticPath` works on the decoded path with string checks only: must start with `/`; no NUL; the rest must not be absolute under posix or win32 (or start with a drive letter); no segment equal to `..` split on `/` and `\`; then `path.relative(root, path.resolve(root, rel))` must not start with `..` or be absolute. The server refuses before `existsSync`, so a refused path never touches disk. For an existing file, `realpathSync(file)` must be inside `realpathSync(root)` (symlinks).
- 403 + JSON `OUTSIDE_APP` instead of the old silent `return false` (which gave 404). A missing file inside dist still falls back to `index.html` for client routes.
- `fs` is injectable (`createStaticServer({ dist, fs })`) only so the test can record every path passed to `existsSync`, `statSync`, `readFileSync`, `realpathSync`.
- Escape order unchanged: `/health`, `/board`, `/auction`, `/save`, `/realm/...`, etc. are still matched first; the static server is the last `GET` step before 404.
- Determinism: no sim change. No route other than static changed.

## 2026-10-14 — server / save gate (wave/save-gate)

- Brief: "the server accepts only an intent; a full state body leaves the stored save as is." Audit of every write route: `/join` and `/realm/:id/intent` already reject anything but an exact one-key body (`parseJoin`, `parseIntent`, before any `sync`, so nothing settles or writes). `readBody(req, 1024)` rejects larger bodies and `req.destroy()`s the socket, so the client sees a closed connection, not a 400. Left as is (changing `readBody` would also touch `PUT /save` 413 handling). `keep.mjs` loads only `kind: "shared-hold"` records with a matching `realmId`, written only by the server.
- `PUT /save` is the one route that takes a whole state. Asked the owner: gating it to intents would end solo Push save, since INVARIANTS §17 forbids running the sim for solo. Owner chose "gate shared paths only". It stays on `gateSave`; a hold record fails `parseSave` (no `meta`, arrays), and solo ids (`guest_`, `discord_`) never collide with `join-*.json`.
- Intent-before-key order was not changed: `joinable.intent` checks the key first, then `parseIntent`. Moving the state check ahead of the key would change wrong-key counting, which is out of scope (hold keys).
- Test note: a stamp sits in `pending` until the next tick boundary, so the test counts `stamps.length + pending`.
- Determinism: no sim change.

## 2026-10-14 — sim / sim clock (wave/sim-clock)

- Root cause: Invariant 2 forbids wall-clock reads in sim logic, but three sim entry points defaulted `now = Date.now()`: `applyOfflineProgress`, the daily court (`utcDay`, `dailyClaimed`, `dailyMsLeft`, `tryClaimDaily`), and `createGameState` (`options.now ?? Date.now()`). A caller that forgot the clock got the local machine's time silently, so `meta.lastRealTime`, `flags.daily_claim_day`, and the `daily_claim` input-log payload could differ between two machines replaying the same actions.
- Fix: no defaults. `now: number` is required in the type, and `requireClock` throws at runtime for `undefined`/`NaN`/non-number (JS callers, `server/` via Vite SSR). `createGameState` keeps `now` optional because ~all tests and the server call it without; it stamps 0. Every app caller passes `Date.now()`, so a new game still gets a real stamp and no 30-day catch-up.
- `settleOnLoad` keeps its `SettleDeps.applyOfflineProgress: (state) => number` shape; the default dep closes over `Date.now()`. So existing mocks and the catch-up match are untouched. The import path now calls `applyOfflineProgress(st, Date.now())` and drops the redundant `lastRealTime = Date.now()` line (the function already sets it to `now`).
- The tick loop's `meta.lastRealTime = Date.now()` in `useGameEngine` stays: it is app code stamping the save, not sim logic.
- `createGameState` still uses `Math.random()` for a missing seed. Out of scope (not a clock); every determinism test passes a seed.
- Guard test: `clock.test.ts` scans `packages/sim/src/**/*.ts` (not `*.test.ts`) for `Date.now(`, `new Date(`, `performance.now(`.
- Server: no change. `hold.mjs` already passes `now: 0`; it calls no daily or offline function.

## 2026-10-09 — server / shared-hold sim load (wave/sim-load)

- Reported cause: "Vite 8 does not export `runnerImport`." Not reproduced. `node_modules/vite` is 8.3.0 and exports it (`dist/node/index.d.ts`, `src/node/ssr/runnerImport.d.ts`), and so does the 8.3.4 tarball (`npm pack vite@8.3.4`). On `main`, all 144 server tests passed, including the 13 files that call `loadSimFromSource()`. `runnerImport` is marked experimental and only arrived in Vite 6.1. `package-lock.json` is untracked, so the deploy box resolves `^8.3.0` (or an older leftover tree) on its own.
- Fix: feature-detect. `typeof v.runnerImport === "function"` keeps the old path. Otherwise `createServer({ configFile: false, logLevel: "silent", appType: "custom", server: { middlewareMode: true, hmr: false, ws: false } })`, then `ssrLoadModule(entry)` and `close()` in `finally`. `ssrLoadModule` is deprecated in 6+ but still present in 8.3.x. `createServerModuleRunner` was not used because it needs `server.environments` (6+), which the fallback is meant to cover.
- The loaded module outlives the closed server. The hold keeps the module object, not the server.
- Injectable `vite` parameter for tests only. `createHolds` default `loadSim = loadSimFromSource` is unchanged (called with no args).
- `hold.test.mjs` "copies no rules" regex still passes: no `fs`, `Decimal`, or combat names added.
- Determinism: no sim change. Same source file, transformed by the same Vite either way.

## 2026-10-09 — tooling / server checks in npm test (wave/server-check)

- Root cause: root `test` ran only `-w @second-crown/sim` and `-w @second-crown/app`. `server/` is not a workspace (`workspaces: packages/*`) and its `package.json` has no `test` script, so `npm test` and the deploy line never ran `server/*.test.mjs`. The HANDOFF Verify `node --test` line had to be extended by hand each wave.
- Fix: `server/test.mjs` reads the directory and passes explicit file paths to `node --test`. Not a shell glob (npm runs scripts under cmd.exe on Windows, which does not expand `*`) and not a node `--test` glob (needs Node 21+; `engines` allows 20.19). `--test-reporter=spec` is set so the output names each test, not only a TAP stream under CI. `spawnSync(process.execPath, ...)` with `cwd` at the repo root, as the hand-typed line ran.
- Order: sim, app, then server; `&&` stops at the first failing suite. Server run is about 3 s.
- Checked: a throwaway failing `server/*.test.mjs` made `npm run test:server` exit 1.
- Determinism: no sim change.

## 2026-10-09 — server / guest ids never repeat (wave/guest-id)

- Root cause: `/guest` used `guest_${newCode()}` (`crypto.randomBytes(3)`, 2^24 ids) and assigned `users[id] = {...}` unconditionally. Birthday odds pass 1% near 600 guests. A repeat replaced the stored token, so `userFromToken` gave the new guest the old id and `saves/<id>.json`; the old token stopped working.
- Fix: `server/guestid.mjs`. `newGuestId(draw)` is `guest_` + `randomBytes(16)` hex (the `guest_` prefix keeps hold files, `join-*.json`, apart from account saves; see `keep.mjs`). `claimGuestId(isTaken, draw)` tries 3 draws and returns null if all are taken; `index.mjs` passes `Object.hasOwn(users, id) || existsSync(saves/id.json)` and answers 503 on null. An orphan save file with no user record is also never inherited.
- `newCode()` is still 3 bytes and still used for watch codes; out of scope here.
- Old 6-hex guest ids stay valid; ids are opaque everywhere (`/profile`, ledger `readSave` regex `[a-zA-Z0-9_-]+`).
- Determinism: no sim change.
- Tests: `guestid.test.mjs` spawns `index.mjs` with a pre-seeded `users.json` and two old saves, like `cap.test.mjs`. The guest cap (10/address/day) bounds the live part to 5 new guests; uniqueness at scale is the unit test.

## 2026-10-09 — app / Pull save waits for reload (wave/pull-hold)

- Root cause: `CloudPanel` Pull save called `saveToIndexedDb(raw)`, the same `autosave` key the running `TickEngine` persists to every 50 ticks and on every action. The pulled copy raced the live crown; a reload could load either.
- Fix: a separate `pulled` key in the same object store (no DB version bump; keys are free-form). `pullCloudCopy` parses before it writes, so a garbled copy is never parked. `startSave` runs once at engine start: pulled copy -> `writeLocal` -> `clearPulled` (a failed clear only means the same copy loads again). Then `loadSaved` / `settleOnLoad` run as before, so a pulled crown is solo and joins nothing.
- The conflict "Load cloud" path now also writes `pulled` then reloads, so a persist between the write and the reload cannot clobber it.
- Determinism: no sim change.
- Tests: `pullCloud.test.ts`, deps injected (no IndexedDB in vitest).

## 2026-10-09 — sim / Second Dawn clears unfinished jobs (wave/dawn-clear)

- Root cause: run jobs live in `flags` (`training_json`, `heal_json`, `upgrades_json`, `marches_json`, `gathers_json`, `garrisons_json`), and `tryAscend` only reset `resources`, `buildings`, `units`, `wars` and `peace_*`. The tick systems kept delivering: `TrainingSystem` / `WardSystem` push units, march and gather returns call `returnLevy` / `returnForce`, a fallen garrison returns 40%. Upgrade jobs key on `buildingId`, and the dawn reuses fixed ids (`b_prestige_farm`, `b_prestige_lumber`), so a job from one crown landed on the next.
- Fix: `clearRunJobs(state)` after the peace wipe and before the first-dawn gift. Player-only filters on `realmId` for training, marches and gathers; heals and upgrades are player-only queues today, so they are emptied; garrisons have no `realmId`, so they are filtered by `occupantRealmId === "player"` on the board. No refund: the dawn already zeroes stores. `respawn_json` (node regrowth) and `scar_json` are untouched.
- Determinism: pure function of state; no rng, no clock.
- Shared hold: `DawnCard` hides Ascend when `sharedRealmId(state) !== null` (always null today). The server never calls `tryAscend`.
- Tests: `prestige.test.ts` (three of the new tests fail with `clearRunJobs` removed), `settleOnLoad.test.ts`.

## 2026-10-09 — sim / reload keeps an empty army (wave/reload-empty)

- Root cause: `ensureWorldStubs` treated "empty" as "missing". It defaulted `units` / `citizens` to `[]`, then refilled on emptiness: `u_rival_migrated` (15 militia) when the rival had no units, `seedWorldActors` NPC troops when a `k_*` realm had none, and `seedCitizensFromBuildings` (returns early only on `citizens.length > 0`). `createGameState({ withStarterBuildings })` leaves `citizens` empty with a finished farm, so any round trip (hold restart, and every `commit` draft since wave/hold-write) hired a farmer.
- Fix: capture `unitsMissing = !Array.isArray(state.units)` and `citizensMissing` before defaulting; gate the rival fill and `seedCitizensFromBuildings` on them. `seedWorldActors` takes `{ fillUnits }` and adds troops only to a realm it creates in this call or, with `fillUnits`, to any troop-less realm. `createGameState` creates all `k_*` realms in that call, so new games are unchanged.
- Behaviour change for a save that has a `units` array but no rival units (never written by current code): it no longer gets `u_rival_migrated`. Same for a `k_*` realm whose army was destroyed: it stays empty.
- Determinism: load is still a pure function of the save; a round trip is now idempotent for empty lists.
- Tests: `serialize.test.ts`, `server/reload.test.mjs`. Both server tests fail on main.

## 2026-10-09 — server / hold writes before it spends (wave/hold-write)

- Root cause: `intent()` mutated `hold.state` (via `tryTrain` / `tryBuild` / `pending.push`) and then called `keep(..., true)`. A throw from `store.save` left memory spent and disk unspent; the next intent spent again, and a restart rolled the extra spends back. `claim()` had the same shape for `keyHash`, which could leave a hold locked with a key no one was given.
- Fix: `commit(realmId, hold, act)`. The draft is `deserializeState(serializeState(hold.state))` (the same round trip a restart does, so no new copy rule), `pending.slice()`, and `keyHash`. `act` runs the sim on the draft and throws `HoldError` on a refusal. The draft is serialized and saved, then `hold.state`, `hold.engine` (new `TickEngine(draft.state)`; the engine only holds the state and seed-derived rng, same as a restart), `pending`, `keyHash`, `savedTick`, `savedAt` are swapped in. A `store.save` throw is mapped to 503 `NOT_SAVED`; without a store the draft is published directly.
- `freeTile(sim, state, typeId)` now takes the draft state, so the tile scan sees the copy.
- `keep(force=false)` swallows a save error and leaves `savedTick` / `savedAt` as they were, so the throttle retries on the next read. Without this, a new hold (`savedAt: -Infinity`) threw from `sync` before the claim could answer `NOT_SAVED`. `keep(force=true)` (only `dropIdle`) still throws, so a hold is never dropped unwritten.
- Cost: one extra serialize + deserialize per intent. Reads are unchanged.
- Tests: `server/write.test.mjs`, with a store whose `save` throws while `broken` is set. Added to the node:test run in `HANDOFF.md` Verify.
- Not done: no retry or alert on a failing disk; settled ticks lost to a failed write are counted again from `savedAt` on load, as before.

## 2026-10-09 — sim + app / repair only fixes damage (wave/repair-scar)

- Root cause: "scarred" was never stored. A siege blow (`damageHoldBuilding`) just put a finished building back on a 40-tick timer, so a scar and a build looked the same (`completesAtTick !== null`). `listScarred` / `tryRepair` keyed on that alone; the app's `isScarred` tried to tell them apart by parsing `b_<tick>_<n>` ids against `buildTicks`, which failed for the starter camp (`b2`) and for anything else with a non-standard id.
- Fix: a mark in `flags.scar_json` (JSON array of ids, same pattern as `heal_json`). Chose a flag over a new `BuildingInstance` field so `packages/shared` and old saves need no migration. `markScarred` prunes ids no longer on a timer before adding, so marks left by a scar that healed on its own timer do not pile up; `isScarred` also requires `completesAtTick !== null`, so a stale mark is never read as a scar.
- `tryRepair` does not call `hireCitizenForBuilding`; the building already had its citizen from first completion. Natural healing still goes through `EconomySystem.processEventsAt`, which hires on every completion, scar or not; that is unchanged here.
- Determinism: the mark is ordinary state, written only by sim code at a sim tick; the `repair` input record carries `buildingId`.
- Tests: `packages/sim/src/systems/repair.test.ts`. Existing `ward.test.ts` "repairs a scarred building" still passes through `applySiegeBlow`.
- Not done: a migration for saves scarred before this branch (they heal on their timer); the double hire on natural healing.

## 2026-10-08 — sim / catch-up matches ticks (wave/settle-match)

- Root cause: `advanceAnalytic` is linear, but two rules are not. `applyUpkeep` zeroes food and removes at most **one** militia per call, so a batch of N starving ticks took 1 militia instead of N. `addCapped` clips once per call, so a full store took `min(cap, v + p*N) - u*N` instead of tick-by-tick's steady `cap - u`.
- Fix stays in `TickEngine` (no rule change in any system). `settleStretch` asks `safeTicks` how far one batch is still linear, from `economyGain(state, 1)` per tick: `floor((cap - v) / g)` for each unpinned capped store with gain, `floor(food / (upkeep - foodGain))` while upkeep outruns food. Fewer than 5 safe ticks -> one `fineTick` and ask again.
- Pinning: `StoreWatch` tracks, per store, whether the last fine tick left it unchanged (`still`, `STEADY_TICKS` = 1) or at its cap (`full`), and whether unit counts held still. Pinned stores are restored after `batch`; that is exact while rates are flat inside a stretch, the same assumption the analytic step already makes. Food is only pinned with a still roster, and then `batch` restores every unit count it held (units added by the batch are kept). After a batch, unpinned stores reset their watch.
- Without pinning, a full wood store (the starter state) would fine-tick all 30 days (~260 s). With it, 30 days from the starter state is ~25 s vs ~20 s before; the extra is fine ticks across each fill.
- `economyGain` includes the outpost tithe by default; `advanceAnalytic` calls it with `tithe = false` and still calls `applyOutpostTithe` separately, so the store order is as before.
- A stretch of 4 or fewer ticks is now always fine-ticked (the last stretch used to batch even at 1-4).
- Not done: other conditional spenders (if a system ever spends a capped store only when it can) are only covered by pinning; `safeTicks` reads economy gain only.

## 2026-10-08 — server / crash guard (wave/realtime-guard)

- Root cause: `http.createServer(async (req, res) => ...)`. Node ignores the returned promise, so any throw inside (here `decodeURIComponent` on `/profile/%` or a static path) was an unhandled rejection, which ends the process on Node 15+. pm2 would restart it, but every open hold in memory was lost to its last write.
- Fix in two layers: `safeDecode` at the two decode sites (400, expected bad input), and `guardRoute` around the whole handler (500, unexpected bugs). `guardRoute` also catches a synchronous throw from a non-async route. It writes its own 500 body (no CORS header) so it does not depend on `json()`.
- After headers are sent, `guardRoute` calls `res.destroy()`; the client sees an aborted response rather than a hang.
- `tryStatic` decodes before `fs.existsSync(DIST)` so the answer to a bad escape does not depend on whether the app is built.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/cap.test.mjs server/guard.test.mjs`. `guard.test.mjs` spawns `index.mjs` with a temp `APP_DIST` holding a one-line `index.html`, and sends raw paths with `http.request` (fetch would re-encode them).
- Not done: a `process.on("unhandledRejection")` net for timers or event handlers outside a request; `/watch/:code` and the ledger routes were already safe (no decode).

## 2026-10-08 — server + app / hold-table cap (wave/realtime-cap)

- Clocks: only `hold.mjs` `sync` calls `clocks.tick` (creates). The public route calls `peek` (never creates, 0 for none). The Phase 1 client (`net/realmClock.ts`) already accepts 0. `cap.test.mjs` asserts `index.mjs` never calls `realmClocks.tick(`.
- Eviction lives in `hold.mjs` `dropIdle()`, used by both `holdFor` (holds map full) and `join.mjs` `markJoined` (joined set full); both caps are `maxJoins` (default `MAX_HOLDS` = 100). It picks the smallest `usedAt` older than `idleMs`, `advance`s to `clocks.tick(id)`, `keep(..., true)`, deletes the hold and its clock, then `onDrop` clears `joined` and `keys`. Reopen goes through the normal path: `keyHashOf` reads the file hash, `holdFor` loads it, `clocks.resume` adds `downTicks(savedAt, now)`. Because it is settled before the write, the dropped time is not lost. No store -> never drops (it would lose the hold).
- In-flight safety: every caller uses the hold synchronously after `sync` returns, so a drop cannot pull it out from under an intent. A hold mid-first-join is not in the map yet and cannot be dropped.
- Address caps (`cap.mjs`): fixed window, memory only, reset by a restart. Address is `req.socket.remoteAddress`; the server listens directly on 8787, so `X-Forwarded-For` is ignored on purpose. If a proxy is put in front, every player shares one address and the caps must move to the proxy's header. The hold cap is taken after `markJoined` succeeds, so a full server does not burn a count; `joined` is rolled back on refusal. Only `had === undefined` (no hold in memory or on disk) counts; a pre-key claim does not.
- Status codes: guest cap 429 `GUEST_CAP`; hold cap 429 `HOLD_CAP` (the client tells it apart from `TOO_MANY_TRIES` by the `Too many new holds` prefix); full 503 `FULL`.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/cap.test.mjs`. `cap.test.mjs` spawns `index.mjs` like `ledger-http.test.mjs`.
- Not done: deleting old hold files, a cap on hold files on disk, persisting address counts, a per-account hold cap.

## 2026-10-05 — server + app / login nonce (wave/realtime-nonce)

- Two checks. Server: Discord OAuth `state` = nonce, bound to the browser by an HttpOnly cookie (`sc_login`, `Path=/auth/discord`, `SameSite=Lax` so it rides the top-level redirect back from discord.com, `Max-Age=600`, no `Secure` because the playtest is plain HTTP). Callback compares with `timingSafeEqual` and always sends `Max-Age=0`. Client: `sessionStorage` `sc-login-nonce`, compared with `cloud_nonce` in the hash. The client check is what stops a pasted `#cloud_token=` link, since that never touches the server.
- `NONCE_RE` (`/^[A-Za-z0-9_-]{22,64}$/`) lives in both `server/nonce.mjs` and `packages/app/src/net/login.ts`; `nonce.test.mjs` fails if they drift. Client nonces are 32 characters.
- `sessionStorage` is per tab: a Discord login must come back to the tab that started it (it does, it is a same-tab redirect). A link opened in a new tab has no nonce and is refused.
- Guest: the nonce is started and taken around one fetch. It only rejects an answer when another login started in between; there is no URL for a guest result to come in through.
- `restoreToken` (typed recovery code) is not nonce-gated: the player pastes it on purpose into the panel.
- `absorbHashSession` return type changed from `boolean` to `"none" | "signed-in" | "refused"`; only `CloudPanel.tsx` calls it. The refused path writes nothing to `localStorage` and makes no request; `autoPush` keeps using the existing token.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/nonce.test.mjs`; app `src/net/login.test.ts` in `npm test`.
- Not done: nonce for the typed restore code, `Secure` cookie once the site has HTTPS.

## 2026-10-04 — server + app / shared hold key (wave/realtime-key)

- Gate lives in `join.mjs` `createJoinableHolds`: `join(body, key, session)`, `read(id, key, session)`, `intent(id, by, body, key, session)`. Ids starting `join-` go through `unlock`; others fall through to `holds.read/intent` unchanged (owner-marked realms, none today). The raw `holds` table is still returned for tests; `index.mjs` never calls it directly (asserted in `key.test.mjs`).
- `unlock` compares `sha256(key)` with the kept hash via `timingSafeEqual`. The hash comes from a `keys` Map (set synchronously when a first join claims, so a racing keyless join is refused) or `holds.keyHashOf(id)` (memory hold, else `store.load`, no sim). `undefined` (no hold), `null` (pre-key file), and a mismatch all give the same 403. A right key adds the id to `joined`, so a keyed read after a restart opens the kept hold with no join.
- First join: `markJoined`, `newKey()`, `keys.set`, then `holds.claim(id, hash)`, which syncs or creates the hold, refuses one that already has a hash, sets `hold.keyHash`, and force-writes. On failure the key and `joined` entry are rolled back. The key is returned only in that response.
- Try cap: `fails` Map, session → count, `MAX_KEY_TRIES` = 5, memory only and never reset by a right key. Session is the account id, so a new guest account gets a fresh count; with 96-bit keys that does not make guessing practical. A missing key counts as a try.
- `index.mjs` reads `X-Hold-Key` (trimmed). `GET /realm/:id/hold` now looks up the bearer; a `join-*` read without one is 401. Bad JSON on an intent is still 400 before the key check (no existence leak, nothing spent).
- Older server tests use `server/testkeys.mjs` `keyedJoin(join, ring, session)`; `keep` and `lumber` keep the ring on the `wall` object so it survives a simulated restart.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/keep.test.mjs server/realmclock.test.mjs server/hold.test.mjs server/join.test.mjs server/play.test.mjs server/build.test.mjs server/cottage.test.mjs server/lumber.test.mjs`.
- Not done: rotating or revoking a key, a key per player, persisting the try count, deleting old hold files.

## 2026-10-04 — server + app / shared hold Build lumber camp (wave/realtime-lumber)

- `parseIntent` accepts exactly `{ type: "stamp" | "train" | "build" | "cottage" | "lumber" }`. The build branch is now a `BUILDS` table (intent type → `[typeId, noTile, cannot]`) checked with `Object.hasOwn`; `lumber` → `["lumber_camp", NO_LUMBER_TILE, CANNOT_LUMBER]`. Same `freeTile` + `sim.tryBuild` + `keep(..., true)` path as farm and cottage. Cost, build time, and the work-plot cap stay in the sim (`lumber_camp` is in `WORK_PLOTS`).
- The intent name is `lumber`, not `lumber_camp`; `{ type: "lumber_camp" }` is a 400 (tested), so no sim type id is taken from the client.
- `view()` adds `lumberCamps` = count of player `lumber_camp` buildings including scaffolding. A fresh hold reads 1 (starter `b2`).
- `lumber.test.mjs` uses the real sim: join, 10 s, cottage, 10 s (cottage finished, cap 4), then lumber. The cannot-afford case seeds one finished cottage in a test-only wrapper (as `build.test.mjs` does), because at 0 wood a plain fresh hold is refused for no tile first. The restart case uses a real `createHoldStore` in a temp dir.
- App: `sendIntent` union adds `"lumber"`; `sendLumber()`; `parseHold` defaults `lumberCamps` to 0.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs server/keep.test.mjs server/realmclock.test.mjs server/hold.test.mjs server/join.test.mjs server/play.test.mjs server/build.test.mjs server/cottage.test.mjs server/lumber.test.mjs`.
- Not done: keep intent, other buildings, choosing a tile, showing the hold on the map, push instead of polling, deleting old hold files.

## 2026-10-04 — server / shared hold keep (wave/realtime-keep)

- Store: `server/keep.mjs` `createHoldStore(SAVES)`. File `<SAVES>/<realmId>.json`, written via `<file>.tmp` + rename. Account saves are `guest_*` / `discord_*`, joined holds `join-*`, so they never share a file. `buildBoard`, `/save`, `/profile`, and the ledger only read account ids. `load` returns null for a missing file or one whose `kind`/`realmId` does not match; corrupt JSON throws (the join answers 500 rather than overwriting it with a new game).
- `hold.mjs` has no `node:fs`; the store is injected (`createHolds({ store, now })`, passed through `createJoinableHolds`). Without a store a hold is memory-only, as before (all older server tests).
- When it writes: `keep(realmId, hold, force)`. `force` after `tryTrain` / `tryBuild` succeed and after a stamp is queued (pending is kept too). From `sync` only when the tick moved and `SETTLE_SAVE_MS` (5 s) passed since the last write. A lost unwritten stretch is harmless: on load the clock re-counts from `savedAt`.
- Load: `holdFor` checks the store before `createGameState`. `sim.deserializeState(kept.state)`, then `clocks.resume(realmId, state.meta.tick + downTicks(savedAt, now()))`. `resume` builds a clock started at `now - tick * TICK_MS`; it never moves an already-higher clock back. `downTicks` caps at `MAX_OFFLINE_MS`, a server mirror of `packages/shared` (drift test in `keep.test.mjs`, like `savegate.mjs` mirrors). A 30-day gap settles ~26M ticks on that first read, same cost as a solo catch-up.
- A hold is still only loaded on `POST /join` (or a read of an already-joined id). After a restart `GET /realm/join-x/hold` is 404 until someone joins x again, as before.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs server/keep.test.mjs server/realmclock.test.mjs server/hold.test.mjs server/join.test.mjs server/play.test.mjs server/build.test.mjs server/cottage.test.mjs`.
- Not done: keep intent, other buildings, choosing a tile, showing the hold on the map, push instead of polling, deleting old hold files.

## 2026-10-04 — server + app / shared hold Build cottage (wave/realtime-cottage)

- `parseIntent` accepts exactly `{ type: "stamp" | "train" | "build" | "cottage" }`. `cottage` runs at once after the clock sync, like `build`. `freeFarmTile` became `freeTile(hold, typeId)`; the build branch picks `["farm", NO_TILE, CANNOT_BUILD]` or `["cottage", NO_COTTAGE_TILE, CANNOT_COTTAGE]` and calls `sim.tryBuild(state, { typeId, x, y })`. Cost, build time, and the plot rule all stay in the sim (`content/buildings.ts`, `actions/build.ts`, `systems/housing.ts`).
- The sim counts plots only from **finished** cottages (`levelsOf` → `finishedOf`, `completesAtTick === null`), so a farm stays `NO_TILE` until `TickEngine` completes the cottage on a later read. `cottage.test.mjs` checks both sides.
- `view()` adds `cottages` = count of player `cottage` buildings including scaffolding (same shape as `farms`).
- `cottage.test.mjs` uses the real sim with no wrapper: a fresh hold has 0 wood, and 100 ticks (10 s) of the starter camp and farm pay for a cottage.
- App: `sendIntent` union adds `"cottage"`; `sendCottage()`; `parseHold` defaults `cottages` to 0. `JoinHoldCard` still keeps the view in React state only.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs server/hold.test.mjs server/join.test.mjs server/play.test.mjs server/build.test.mjs server/cottage.test.mjs`.
- Not done: keep, other buildings, choosing a tile, showing the hold on the map, persisting holds, push instead of polling.

## 2026-10-04 — server + app / shared hold Build farm (wave/realtime-build)

- `parseIntent` accepts exactly `{ type: "stamp" | "train" | "build" }`. `build` runs at once after the clock sync (like `train`, not queued like a stamp): `freeFarmTile()` scans `y, x` in `0..TILE_SCAN-1` (64, only a loop bound) and returns the first tile where `sim.canPlaceType(state, "farm", x, y)` holds; the sim owns the grid size, occupancy, and the work-plot cap. Then `sim.tryBuild(state, { typeId: "farm", x, y })`. `HoldError(409, NO_TILE)` or `HoldError(409, CANNOT_BUILD)`; `tryBuild` checks cost before it spends, so a refusal changes nothing. Issuer is the hold (`player`).
- `view()` adds `farms` = count of player `farm` buildings including scaffolding.
- Fresh-hold catch: starter buildings fill both work plots (`workPlotCap` = 2 with no cottage or keep), so a live Build farm returns `NO_TILE` today. Solo has the same rule but can build a cottage. A cottage (or keep) intent is the next step if the owner wants farms to work in a fresh hold. `build.test.mjs` wraps the real sim so its new game has one finished cottage, for the success cases only.
- App: `sendIntent` type union adds `"build"`; `sendBuild()`; `parseHold` defaults `farms` to 0. `JoinHoldCard` still keeps the view in React state only.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs server/hold.test.mjs server/join.test.mjs server/play.test.mjs server/build.test.mjs`; root `npm test` covers `net/hold.test.ts` and `settleOnLoad.test.ts`.
- Not done: other buildings (cottage, keep), choosing a tile, showing the hold on the map, persisting holds, push instead of polling.

## 2026-10-04 — server + app / playable shared hold (wave/realtime-play)

- `hold.mjs` new-hold state now passes `withStarterBuildings: true`, matching the app's New Game (`useGameEngine.ts`), so the farm and lumber camp make stores. Still seeded by `seedForRealm(id)`, never from a save.
- `view()` reads only: `stores` = `state.resources[food|wood|stone|gold]` as the sim's strings (no Decimal in `server/`; the app floors for display), `militia` = sum of `count` of player `militia` units, `training` = sum of `count` over `sim.listTraining(state, "player")` militia jobs. Both readers get identical strings because one state backs them.
- Train intent: `parseIntent` accepts exactly `{ type: "stamp" | "train" }`. `intent()` syncs to the clock, then for `train` calls `sim.tryTrain(state, { typeId: "militia", count: 1 })` right away (not queued like a stamp) so it can answer `HoldError(409, CANNOT_TRAIN)` when the sim refuses. The train lands in the input log at the settled tick; units arrive when the sim's training queue finishes (~15 ticks at keep 0). Issuer is the hold (`player`), not the account.
- App: `parseHold` defaults missing `stores`/`militia`/`training` to zero; `sendIntent` throws the server's `error` text on a non-2xx. `JoinHoldCard` keeps the view in React state only; it does not import `persist`, `loadSaved`, or IndexedDB.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs server/hold.test.mjs server/join.test.mjs server/play.test.mjs`; root `npm test` covers `net/hold.test.ts` and `settleOnLoad.test.ts`.
- Not done: other units, building in the hold, showing the hold on the map, persisting holds, push instead of polling.

## 2026-10-04 — server + app / opt-in join, real-time (wave/realtime-join)

- `server/join.mjs`: `createJoinableHolds({ clocks, isShared, loadSim, maxJoins })` → `{ holds, join(body), isJoined(id) }`. It builds the Phase 3 `createHolds` with `isShared = id => isShared(id) || joined.has(id)`, so all hold logic (tick boundary, intents, sim load) stays in `hold.mjs`. A failed first read un-joins the id.
- Ids: `joinRealmId(code)` trims, lowercases, checks `JOIN_CODE_RE` (`[a-z0-9-]{1,24}`), returns `join-<code>` or null. The `join-` prefix means a join can never name an account id (`guest_…`, `discord_…`) or an owner-marked realm. `parseJoin` accepts exactly `{ realm: string }`; otherwise `HoldError(400, JOIN_ONLY)`.
- Route: `POST /join` (401 without a token, 1 KB body) → hold view. The view's `realmId` (`join-<code>`) is what the client uses for `GET /realm/:id/hold` and `POST /realm/:id/intent`. A `join-` id nobody joined is still 404.
- App: `net/hold.ts` `cleanJoinCode` (mirrors `JOIN_CODE_RE`) and `joinRealm(code)`; null with no fetch for a blank id. `JoinHoldCard.tsx`, mounted at the bottom of `CloudPanel`, keeps the view in React state only, polls `readHold` every 1 s while joined, and `Leave` just drops the view. It never calls `loadSaved`, `settleOnLoad`, `persist`, or IndexedDB, so the solo crown and its offline catch-up are untouched.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs server/hold.test.mjs server/join.test.mjs`; root `npm test` covers `net/hold.test.ts` and `settleOnLoad.test.ts`.
- Not done: putting the hold's realm into the game view (it shows tick and stamps only), any intent besides a stamp, persisting holds, push instead of polling.

## 2026-10-04 — server + sim + app / shared hold, real-time Phase 3 (wave/realtime-hold)

- Rule: ADR-011 / INVARIANTS §17. `server/` may call `packages/sim` for a **shared** hold only. Never copy a rule into `server/`; `hold.test.mjs` greps `hold.mjs` for `resolveBattle`, `realmPower`, `matchup`, `Decimal`, `break_infinity`, `node:fs`, `saves`.
- How the server loads TS: `loadSimFromSource()` does `await import("vite")` then `runnerImport(packages/sim/src/index.ts, { configFile: false })` (about 0.4 s, once). Node's own type stripping cannot load the sim (`.js` specifiers pointing at `.ts` files, `constructor(private ...)`). Needs `vite` in root `node_modules` (it is, via the app workspace; plain `npm install` on Oracle keeps dev deps). Lazy: never imported unless a shared hold is touched.
- `createHolds({ clocks, isShared, loadSim })` returns `{ read(id), intent(id, by, body), size }`. Both return `null` when `isShared(id)` is not true or the id fails `REALM_ID_RE`; no sim load, no hold made. Pass the same `realmClocks` instance as `GET /realm/:id/tick` so the hold and the tick route agree.
- Hold state: `createGameState({ seed: seedForRealm(id), now: 0 })` (FNV-1a of the id) plus a `TickEngine`. Not seeded from any save (Phase 3 brief: never read the solo save). A pm2 restart forgets every hold.
- Tick boundary: `intent` syncs the hold to the clock, then queues `{ type: "stamp", by }` (max 64 pending). The next `read` or `intent` whose clock tick is past the hold's tick does `settleTicks(1)`, applies every pending stamp with `tryStamp` (so the stamp's tick is that boundary), then `settleTicks` to the clock. A read in the same tick shows `pending: 1` and no stamp yet.
- `parseIntent` accepts only an object with exactly one key, `type: "stamp"`. A save, `{ type, state }`, other types, arrays, strings: `HoldError(400, INTENT_ONLY)`.
- Routes: `GET /realm/:id/hold` returns `{ realmId, tick, stamps: [{ tick, by }], pending }`; `POST /realm/:id/intent` returns the same view, with `by` = the authenticated account id (401 without a token). Both 404 `not a shared realm` today (`SHARED_REALMS` empty).
- App: `net/hold.ts` `readHold` / `sendStamp`; `settleOnLoad` has a `joinHold` dep, called only on the shared path; the `Settled` shared variant gains `hold: HoldView | null`. Nothing calls `sendStamp` yet.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs server/hold.test.mjs` (the hold test loads the real sim through Vite); root `npm test` covers `stamp.test.ts`, `net/hold.test.ts`, `settleOnLoad.test.ts`.
- Not done: marking any realm shared, pushing hold state to browsers, a UI to stamp, any intent besides a stamp, persisting a hold.

## 2026-10-04 — server + app / realm save, real-time Phase 2 (wave/realtime-save)

- `server/savegate.mjs`: fifth argument `shared` on `gateSave`. When true it throws `SaveGateError(409, SHARED_REALM, conflict=true)` right after `parseSave`, before any prev/time/log check, so no upload can replace a shared save (tampered, `replace=1`, gate-valid, or first upload with no server copy). Bad JSON still gets its 400.
- `server/index.mjs`: `SHARED_SAVES = new Set()` of account ids; `PUT /save` passes `SHARED_SAVES.has(u.id)`. The existing conflict branch returns `{ conflict: true, save: <server copy or null> }`, which `CloudPanel` already offers to load. `GET /save` is unchanged. Adding an id is an owner decision; how a shared save is first seeded is not built (Phase 3 writes it).
- `packages/app/src/game/loadSaved.ts`: `loadSaved(local, deps?)` → `{ state, source: "local" | "server" | "cache" }`. `sharedRealmId(local) === null` → returns `local` itself (solo path identical). Shared → `pullServerSave(realmId)` (default `pullSave()`; Phase 2 keeps the realm in its owner's `/save`, so the id is not sent), `deserializeState`, then `writeCache(raw)` (IndexedDB). Pull or parse failure → the local cache, not a fresh realm. A cache-write failure is ignored.
- `useGameEngine.ts`: autosave load is `loadSaved(deserializeState(saved))` then `settleOnLoad` as before. `importSaveFile`, the tick loop and `persist` are unchanged; on a shared realm an imported or edited file only lives in that browser until reload, and `pushSave` gets the 409.
- Tests: `node --test server/clock.test.mjs server/savegate.test.mjs`; app vitest `src/game/loadSaved.test.ts` runs under root `npm test`.
- Not done: marking any realm shared, a realm-keyed server save, Phase 3 shared hold.

## 2026-10-04 — server + app / realm clock wire, real-time Phase 1 (wave/realtime-wire)

- `server/realmclock.mjs`: `createRealmClocks(now = Date.now)` → `{ tick(realmId), size }`. A `Map` of `createClock` instances, memory only (a pm2 restart resets every realm to 0). First `tick(id)` starts the clock and returns 0; later calls return the clock's high-water tick. `null` for an id not matching `REALM_ID_RE` or once `MAX_REALM_CLOCKS` (10,000) exist.
- `server/index.mjs`: `GET /realm/:id/tick` → `{ realmId, tick }` or 400. Unauthenticated; it never reads or writes `saves/` and does not import `packages/sim`.
- `packages/app/src/net/realmClock.ts`: `fetchRealmTick(realmId)` against `cloudUrl()`; rejects a non-integer or negative tick.
- `packages/app/src/game/settleOnLoad.ts`: `sharedRealmId(state)` (always null for now: do not mark a realm shared without the owner) and `settleOnLoad(state, deps?)`. Solo → `applyOfflineProgress`. Shared → `fetchRealmTick`, no catch-up; a failed read gives `serverTick: null` instead of throwing, so `useGameEngine`'s load `catch` never swaps in a fresh realm. Phase 1 only reads the count; nothing applies it to state yet.
- `useGameEngine.ts`: only the autosave load calls `settleOnLoad`. The 100 ms tick loop and `importSaveFile` (still `applyOfflineProgress`) are unchanged.
- Root `npm test` = sim vitest then app vitest. `packages/app/vitest.config.ts` keeps vitest 2 off the app's Vite 8 / plugin-react config.
- Run server tests: `node --test server/clock.test.mjs server/realmclock.test.mjs` (plus `savegate`, `ledger`, `ledger-http` from `server/`).
- Not done: applying the server tick to a shared realm, marking any realm shared, Phase 2 save, Phase 3 shared hold.

## 2026-10-04 — server / clock, real-time Phase 1 (wave/realtime-clock)

- `server/clock.mjs` (`docs/REALTIME.md` Phase 1 only). `TICK_MS = 1000 / TICKS_PER_SECOND` (100), imported from `savegate.mjs` so the existing mirror test covers it.
- `ticksBetween(startMs, nowMs)`: `floor((now - start) / TICK_MS)`, 0 when `now <= start` or either input is not finite.
- `createClock(now = Date.now)`: `start(atMs?)`, `started`, `tick(atMs?)`. Unstarted → 0. `tick` keeps a high-water mark, so a wall clock stepping back never lowers the count.
- Does not import `packages/sim`, does not touch saves, and is not called from `index.mjs`. The client does not use it. `Date.now` stays out of the sim (INVARIANTS §1); this only produces a tick count for later phases.
- Run: `cd server && node --test clock.test.mjs savegate.test.mjs ledger.test.mjs ledger-http.test.mjs` (root `npm test` still covers `packages/sim` only).
- Not done: Phase 2 save, Phase 3 shared hold.

## 2026-10-04 — docs / real-time spec (wave/realtime-spec)

- No code changed. `docs/REALTIME.md` is the spec for three phases, in order: Clock, Save, Shared hold. Read it before any real-time work.
- Clock: ticks stay the unit of time; a server clock would only produce the tick count. No `Date.now()` in tick math (`INVARIANTS.md` §1). Shared realms do not fast-forward on tab close; solo crowns keep offline catch-up.
- Save: server save is the source of truth; local save is a cache.
- Shared hold: browsers send intents, server applies them on a tick boundary. This requires running `packages/sim` on the server, which breaks the current "no sim on the server" rule. Owner decision plus `INVARIANTS.md` / `DECISIONS.md` update before any code.
- Rebase recipe in `HANDOFF.md` changed to the owner's steps: `git checkout --theirs` on the four doc files. Note: during a rebase, `--theirs` is the commit being replayed (your branch's copy), so check afterwards that main's newer entries are still in those files.

## 2026-10-04 — docs / current handoff (wave/docs-current)

- No code changed. `HANDOFF.md` is now a single current snapshot, not a log; per-wave detail lives in `CHANGELOG.md` and `DEV-NOTES.md` only.
- When a wave merges, delete its "not merged" text from `HANDOFF.md` in that same change (see the slice rule in `AGENTS.md`).
- Rebase footgun: during `git rebase`, `--ours` is `origin/main` and `--theirs` is your branch. The old recipe said `--theirs`, which keeps your copy and can drop main's newer entries.

## 2026-10-04 — render / culture marches (bakeoff/gemini-culture-marches)

- `packages/render/src/tokens.ts`:
  - `primaryUnitTypeForMarch`: added `lancer: 8, outrider: 7, ranger: 6, warden: 4, banner: 4` into `tierPriority` table. When marches have counts where these units are plurality or majority, it resolves directly to the matching unit type string.
  - `UnitVisualPalette`: extended `weaponKind` to support `"shortbow" | "pennant" | "shortlance" | "roundshield" | "longlance"`, and `helmKind` to include `"hood"`.
  - `unitPalette`: added dedicated entries for `"ranger"`, `"banner"`, `"outrider"`, `"warden"`, and `"lancer"` providing distinct weaponKind, helmKind, mount flags, and culture tabard/accent colors.
  - Added and exported 5 dedicated unit meeple drawer functions:
    - `drawRangerMeeple`: Hooded cowl (`0x475569`/`0x1e293b`), shadowed face with cyan scout eye glint (`0x38bdf8`), back quiver with bodkin arrows, and compact hunting recurve short bow (`0xca8a04`) with taut string (`0xf8fafc`) and nocked arrow (`0xd4a359`/`0xffffff`).
    - `drawBannerMeeple`: Disciplined marching stride, glen-green cloak (`0x4d7c0f`/`0x365314`), granite kettle helm (`0x78716c`), tall upright spear shaft (`0x5c3818`) with steel leaf head (`0xffffff`), and small waving swallowtail pennant (`0xa3e635`/`0xfacc15`).
    - `drawOutriderMeeple`: Fast galloping scout horse in dun/salt coat (`0x78716c`), salt-white mane and bridle, rider with billowing salt-grey cloak (`0xa8a29e`/`0x57534e`), and couched compact short lance (`0xd4a359`) with sharp steel tip (`0xf1f5f9`).
    - `drawWardenMeeple`: Heavy marsh guard boots, fen-reed cloak (`0x3f6212`/`0x1a2e05`) with bone toggle clasp (`0xfef08a`), conical iron kettle helm (`0x4b5563`), prominent round wicker-reed boss shield (`0x292524` rim, `0x65a30d` reed face, `0xd1d5db` iron boss), and sturdy marsh-wood thrusting spear (`0x5c3818`/`0xf8fafc`).
    - `drawLancerMeeple`: Heavy mountain warhorse (`0x334155`) with galloping legs and steel chanfron forehead armor (`0xcbd5e1`), visored greathelm knight in billowing peak-white cloak (`0xf8fafc`/`0xffffff`) with silver mountain peak brooch, and exceptionally long tournament shock lance (`0x64748b`) with circular vamplate handguard disc (`0x94a3b8`) reaching `+facing * 18` with diamond-forged steel point (`0xffffff`).
  - `paintBoardMarches`: dispatches player marches when `unitType` is ranger, banner, outrider, warden, or lancer. Preserves chassis/mount/standard human dispatch for all other units.
- `packages/render/src/index.ts`:
  - Imported and re-exported `drawRangerMeeple`, `drawBannerMeeple`, `drawOutriderMeeple`, `drawWardenMeeple`, and `drawLancerMeeple`.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-culture-marches: silhouettes for Ranger, Banner, Outrider, Warden, Lancer")` covering:
    - `primaryUnitTypeForMarch` majority and mono-unit resolution, tier priority, and legacy unit preservation.
    - `unitPalette` gear configurations for each of the 5 units.
    - Dedicated meeple drawers testing colors, facings, bobbing, and optional pedestals.
    - `paintBoardMarches` integration tests verifying each culture unit meeple is dispatched on predominantly composed player marches.
    - Direct export checks, camera math invariance, and conflict marker checks.
- Invariants:
  - Zero changes to `packages/sim`, `server`, `packages/app/src/tabs/*`, or `theme.css`.
  - Camera math, zoom, and tile click hit-testing untouched.
  - Militia, spearman, archer, cavalry, and older march meeples stay as they are.
  - Mist, Glen, Salt, Fen, and Peak keep silhouettes stay as they are.

## 2026-10-03 — render / culture keeps (bakeoff/gemini-culture-keeps)

- `packages/render/src/tokens.ts`:
  - `drawMiniatureKeep`: extended signature with `kit: CultureKit | string` and `options?: MiniatureKeepOptions` (which accepts `cultureId?: string`).
  - Added dedicated miniature silhouettes for the 5 player cultures:
    - **Mist**: Low reed roof (`0xca8a04`/`0x92400e`, sod ridge `0x4d7c0f`), low wet-stone walls (`cy - 7`), peat smoke wisp, and an ethereal drifting pale mist veil (`0xe2e8f0`/`0xf1f5f9`).
    - **Glen**: Cyclopean quarry plinth, rough-hewn granite blocks (`0x78716c`/`0x57534e`), quarry courses, green turf slope (`0x4d7c0f`/`0x65a30d`/`0x365314`) hugging the southwest flank, and timber quarry crane with suspended stone block.
    - **Salt**: Fortified squared timber log walls (`0x854d0e`/`0x5c3818`) with dovetail notches, stacked lumber logs flanking entry, and a steep grey salt-crusted shingle roof (`0xd6d3d1`/`0xa8a29e`, salt frost ridge `0xf1f5f9`).
    - **Fen**: Stilt cottage keep (heavy wooden pilings `0x292524` with cross-bracing, stilt cottage walls `0x6b7280`, mossy reed thatch `0x4d7c0f`) over a dark water pool (`0x090d16`/`0x0f172a` with animated ripples and wetland bulrushes), with warm amber lantern glowing over dark water.
    - **Peak**: Soaring dressed limestone walls (`0xf8fafc`/`0xcbd5e1` reaching `cy - 16`) crowned with an alpine sculpted snow cap (`0xffffff`/`0xe0f2fe`), crystalline icicles hanging from corbels (`0xbae6fd`), and high alpine mast.
  - `paintBoardProvinces`: passes player culture ID `cultId` to `drawMiniatureKeep` for the player's home province.
  - Older kits (`cedar`, `sand`, `steppe`, `islands`, `western`) strictly preserved and rendered via existing pathways.
- `packages/render/src/buildings.ts`:
  - Added and exported `drawKeepPlayerCulture`, `drawKeepMist`, `drawKeepGlen`, `drawKeepSalt`, `drawKeepFen`, and `drawKeepPeak`.
  - Dispatched in `case "keep":` when `cultureId` is mist, glen, salt, fen, or peak.
- `packages/render/src/index.ts`:
  - `paintBuildings`: computes `bCultId` for player and foreign holds and passes it to `drawIsometricBuilding`.
  - Exported `drawIsometricBuilding`, `drawMiniatureKeep`, `drawKeepPlayerCulture`, `drawKeepMist`, `drawKeepGlen`, `drawKeepSalt`, `drawKeepFen`, and `drawKeepPeak`.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-culture-keeps: player home miniature keep silhouettes and isometric keeps")` covering all 5 cultures, intact vs breached states, options fallback, direct exports, camera math invariants, and zero merge conflicts.
- Invariants:
  - Zero changes to `packages/sim`, `server`, `packages/app/src/tabs/*`, or `theme.css`.
  - Camera math, zoom, and tile click hit-testing untouched.
  - Ranger, Banner, Outrider, Warden, and Lancer marches untouched.

## 2026-10-03 — sim / first-dawn stores (wave/dawn-stores)

- `packages/sim/src/actions/prestige.ts` `tryAscend`: after the wipe, if `!flags.dawn_gift`, set `flags.dawn_gift = 1`, add 20 food and 10 wood via `D()`/`toDecimalString`, and push one player militia (`id: "u_dawn_militia"`, `count: "1"`, `armyId: null`).
- `dawn_gift` is not wiped by ascend (only `peace_*` and `doctrine_lock` are), so the gift fires exactly once per save. Deterministic: no RNG, no tick dependence.
- Old saves that already ascended before this change have no `dawn_gift` flag, so their next ascend will grant the gift once.
- `prestige.test.ts`: keep/wipe test now expects food 45 / wood 45 and one militia; the "no militia" asserts in the dawn-bonus tests were removed; new "First-dawn gift" describe block (3 tests).
- Untouched: raid math, culture yields, unit costs, `ascendThreshold`/`canAscend`, app, render, server.

## 2026-10-03 — app / 28px lancer chip on Lancer card (bakeoff/gemini-lancer)

- `packages/app/src/hud/lancer-chip.css`:
  - Styles `.sc-lancer-chip-wrapper`, `.sc-lancer-chip`, and living aura states (`.is-open`, `.is-locked`).
  - Strictly enforces `pointer-events: none !important`, `flex-shrink: 0`, and `vertical-align: middle`.
  - Zero edits to `theme.css`.
- `packages/app/src/hud/LancerChip.tsx`:
  - 28px living unit chip component with mountain warhorse in charging gallop with steel chanfron armor, armored lancer knight in visored greathelm, heavy couched long lance with circular vamplate handguard disc and diamond-forged steel point with fluttering pennon, and billowing peak-white cloak with alpine frost highlights and silver mountain peak brooch clasp.
  - Reactive states: `open = true` (unlocked) displays gleaming peak-white mantle highlights, shining steel lance point, and drop-shadow halo; `open = false` (locked) displays desaturated dusk tones.
  - `data-lancer-chip`, `data-open`, `aria-hidden="true"`, `pointerEvents: "none"`.
- `packages/app/src/hud/UnitCard.tsx`:
  - Directly mounts `<LancerChip size={28} open={open} />` on the Lancer card (`typeId === "lancer"`).
- `packages/app/src/UnitIcon.tsx`:
  - Added dedicated `case "lancer":` rendering mountain warhorse, armored lancer knight, heavy long lance, and peak-white cloak.
- `packages/render/src/index.test.ts`:
  - Added test suite `describe("bakeoff/gemini-lancer: 28px lancer chip on Lancer card (horse, long lance, peak-white cloak)")`.
- Invariants:
  - Zero changes to `packages/sim`, `server/`, or `packages/app/src/theme.css` (0 diff against `origin/main`).
  - No new unit stats.

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
