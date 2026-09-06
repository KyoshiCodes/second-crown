# Gemini bakeoff — immersion foundation (large)

Branch: `bakeoff/gemini-immersion` from current `main`.
Claude/Astra do not take this lane.

Owner direction: Realm Grinder / classic pixel kingdom *look*, but **not** a tiny click-grid as the fantasy. Want a living hold: roads, buildings that read as a town, figures that walk. Full Unity-style 3D city sim is **out of scope for this PR**. Do it in the existing Pixi layer (`packages/render`) as isometric / 2.5D pixel art. Citizen *jobs and pathfinding in the sim* is a later Grok/Claude pass — you may add **presentation-only** walkers that roam building tiles using current `state.buildings`.

## Must ship

1. **Theme packs** in `packages/app/src/themes/` (or `seasons/packs/`):
   halloween, midwinter, easter, harvest, midsummer, spring, summer, autumn, winter.
   Each pack: background, tab/badge chrome, music src, optional battle src.
2. **Recorded audio first, synth fallback.** Play `/audio/<id>.ogg` when present.
   Owner will add `packages/app/public/audio/halloween.ogg` (their file). Do not replace it with silence. Credit any extra CC0/CC-BY tracks in `public/audio/CREDITS.md`. No copyrighted commercial songs.
3. **Isometric pixel map** replacing the current 16×10 colored-rect grid as the *look*. Keep the same build click contract (tile still maps to the existing building grid so sim does not change). Think Realm Grinder / old-school pixel town, not CAD 3D.
4. **Living hold (presentation):** 4–12 walker sprites that wander near houses/markets. No new sim tick rules. If a building type is missing, idle near the keep.
5. **Holiday + season packs tint the map and UI** (Halloween night, snow roofs already exist — go further).
6. Sticky TesterBar holiday `<select>` must keep working (`z-index` above the map).

## Stretch (only if 1–6 are done and tests/build stay green)

- Battle strip uses pack battle audio.
- Simple day/night tint from season, not a second clock.
- Building upgrade changes the pixel building frame.

## Must not

- Empty `git diff main -- packages/sim server`.
- No Three.js/Unity unless you can prove the Vite build stays healthy and map clicks still work — default is Pixi isometric.
- No second combat engine, no Discord/Caddy edits.
- Do not delete `halloween.ogg` if it is on the branch.

## Verify

npm test
npm run build -w @second-crown/app

walkthrough.md + PR into main. Do not merge.
