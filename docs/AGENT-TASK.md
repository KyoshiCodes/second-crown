# Bakeoff — pace and academy

Ground is current `main`. Do not merge.

## Claude — `bakeoff/claude-pace`

Sim only. `git diff main -- packages/app packages/render server` empty.

1. Camp win loot +20 wood → +6. Node wins +12 → +5. Keep flag plant via `plantOutpost` on player camp/node wins if that hook is missing.
2. Add `academy` to `BUILDING_TYPES` (no production, stone/wood/gold cost, ~120 buildTicks). Point horse lore `needs` at `academy` (keep barracks fallback if academy count is 0 so old saves still study).
3. Tests for loot amounts and academy-as-need. `npm test` green. No tickEngine rewrite.

## Gemini — `bakeoff/gemini-academy`

Presentation only. `git diff main -- packages/sim server` empty.

1. Pixel academy (and siege workshop if it still shares a generic box) in the hold isometric set: windows, lecture hall, banner.
2. Research bar looks like a lectern card, not two raw buttons. Keep horse + siege. Do not change costs.

## Astra — `bakeoff/astra-pace`

Docs only. No gameplay code.

Write `docs/PACE.md`: how we get from 10 Hz seconds-scale queues to a week-scale game without breaking current testers (real-minute research option, gather-time on nodes, gold sinks). No implementation.

Each lane: rewrite walkthrough.md for that PR, update HANDOFF/CHANGELOG/USER-NOTES/DEV-NOTES, PR into main, leave unmerged.
