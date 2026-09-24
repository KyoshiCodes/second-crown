# Dev notes

## 2026-09-24 — hud-chrome

- Chrome palette lives on `<html data-chrome>`, separate from the body `theme-<tab>` classes and the season/holiday packs. Add new chrome colors as `--chrome-*` vars in all three blocks of `theme.css`.
- The global `button` rule is element-only on purpose: any class or inline style overrides it. Inline `background` also overrides the disabled background, but the opacity still applies.
- Atlas drag only calls `setPointerCapture` after 6px of travel. Capturing on pointerdown would retarget the click to the `<svg>` and break province selection.
- Atlas SVG has `touch-action: none`, so on phones a swipe over the atlas pans it instead of scrolling the page.
- localStorage keys: `sc-chrome` (palette) is not `sc-chrome-open` (tools drawer).

## 2026-09-24

- Docs audit branch adds ROADMAP, refreshes PROGRESS/HANDOFF/USER-NOTES, seeds `docs/obsidian/`.
- CHANGELOG still has old Gemini entries with stray `+` prefixes from conflicted merges. Do not spend a wave deleting history; prepend clean entries.
- Gemini + Claude both editing the four docs = rebase conflict every pair. Prefer Gemini skip docs or only touch USER-NOTES flavor.
- `tryTreatWounded` does not require an Infirmary building (tests cover treat without one). UI still tells you to raise a hall so beds exist.
- `trainCostMultiplier()` without `typeId` is barracks+global only. Stables/range/workshop apply only when `typeId` is passed.
- Repair button label "8 stone" is hardcoded in the app; cost lives in `ward.ts` `REPAIR_STONE`.
- Watchtowers: `rimWatchtowers` is rim-only. `visionRange` counts rim towers twice plus other finished towers plus survey research.
