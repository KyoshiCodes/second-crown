# Two lanes after PR 7

## Gemini — branch bakeoff/gemini-board

Tabletop presentation only.
- Denser pixel buildings and 2–3 frame walkers.
- Wooden table rim around the map.
- Original All Hallows backdrop + fog/lantern flicker (no Disney likenesses).
- War tab: living pixel unit strip. No second combat resolver.
- Zoom + pan on the map. No rotate this PR.
- Play `/audio/halloween.ogg`, `/audio/easter.ogg`, `/audio/midwinter.ogg` when present.
- Keep ChromeDock (Show tools + Holiday).
- `git diff main -- packages/sim server` must stay empty.

## Claude — branch bakeoff/claude-fort

Sim foundations only.
- Fortification buildings that change realm power / defense (walls, tower, keep or extend existing).
- Citizen stub: `job` + `tile` fields presentation can read later. No full economy.
- Tests required. Do not restyle themes or Pixi.

Both: npm test, npm run build -w @second-crown/app, PR into main, do not merge.
