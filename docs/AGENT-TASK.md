# Agent task — Gemini

You are on branch `bakeoff/gemini`.

## Mission

World presentation only. Make crowns feel distinct.

1. Improve heater-shield SVGs in `packages/app/src/Crest.tsx` and `crests.ts` so each of these ids is unique: player, rival, k_silk, k_ash, k_veil, k_glass, k_frost, k_tide, k_ember, k_bronze.
2. Add `packages/app/src/content/flavor.ts` with per-realm blurb, war taunt, gift thanks. Show blurbs on the World tab without editing `packages/sim`.
3. Strengthen `packages/app/src/theme.css` so Kingdom / Army / War / World / Crown tabs feel different.

## Forbidden

- `packages/sim/**` (no costs, combat, ticks)
- `server/**`
- Commits to `main`

## Done when

- `npm run build -w @second-crown/app` succeeds
- `git diff main -- packages/sim` is empty
- Open a PR: `bakeoff/gemini` → `main` titled `bakeoff(gemini): heraldry and flavor`
- PR body lists each realm and its shield charge
