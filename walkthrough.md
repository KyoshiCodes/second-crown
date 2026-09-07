# Walkthrough — Claude War Tab Briefing (`bakeoff/claude-war2`)

## What changed

The War tab now opens with a single "Briefing" card, meant to be read in about 20 seconds:

- **Incoming** — one line per hostile march headed for your hold: realm name (only revealed once you've built a Watchtower — otherwise "Unknown host") and ETA in seconds, followed by your current Wall HP and whether the Gate is up or down.
- **Wounded** — wounded count vs. infirmary beds, with a one-click "Treat (4 food)" button that's disabled when nobody's hurt.
- **People** — population vs. housing cap, so you can see at a glance whether you need another Cottage.

Everything else on the tab (living unit strip, diplomacy panel, declare-war buttons, Fight/White Peace, decree/fortification summary, repair buttons) is unchanged.

## Where

- `packages/app/src/WarRoom.tsx` — the new Briefing card.
- `packages/sim/src/index.ts` — exports `gateOnRim` and `gateHp` from `systems/gate.ts` (both already existed and were already used internally by `wallHp`; this PR only exposes them to the app).

## What did not change

- No combat math, march formulas, or fog rules.
- No edits to `packages/sim/src/core` (`git diff main -- packages/sim/src/core` is empty).
- No Discord, Caddy, or tickEngine changes.
- No Pixi/render or theme edits — presentation-layer pixel art is Gemini's lane (`bakeoff/gemini-board2`).

## Verification

- `npm test` — 87/87 sim tests pass.
- `npm run build -w @second-crown/app` — `tsc -b && vite build` passes.
