# Dev notes

## 2026-09-24 — hud-people

- `JobCard` resolves "building they walk to" by matching `citizen.tile` to a player building at that x,y. `tryAssignCitizen` sets the tile to the building tile, so this holds. If a building is gone the label falls back to `Tile x,y`.
- The "Idle" button is disabled on the Idle card (those workers are already idle). The `act(tryAssignCitizen/tryIdleCitizen)` calls are the same as before.
- A citizen with a job but no tile counts as idle for display only. Sim state is untouched.

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
