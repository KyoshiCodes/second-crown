# Bakeoff task (frozen main + immersion brief)

Ground: current `main` (horde/bazaar, quests, court, seasons, Discord/HTTPS).
Do not use stale `bakeoff/claude` or `bakeoff/gemini`.

Branches from current main:
- Claude Code: `bakeoff/claude-war`
- Gemini / Antigravity: `bakeoff/gemini-art`
- ChatGPT GPT-6 Astra: `bakeoff/astra`

PR into `main`. Do not merge yourself.

## Shared invariants

1. Do not change `packages/sim/src/core/tickEngine.ts` tick math or cadence.
2. Do not change Discord OAuth, Caddy, or guest token behavior except Astra adding `/auction` and `/pvp` beside existing routes.
3. Determinism: no `Math.random()` in `packages/sim`.
4. Keep `npm test` and `npm run build -w @second-crown/app` green.
5. Do not invent a second combat resolver. `resolveBattle` stays the fight.
6. Big numbers stay `break_infinity` / `D()` / letter suffix.
7. Write `walkthrough.md` on your branch only.
8. Season and holiday *look* is Gemini. Season *timing* already lives in `currentSeason()` / `seasonIndex()`. Do not invent a second calendar in the sim.

## Claude — WarRoom + structure

Goal: one War tab readable in 20 seconds.

- `WarRoom.tsx` composing odds (`realmPower`), levy/train shortcut, declare / resolve / white peace, last battle phases, fortify/decree status.
- Thin `WarTab.tsx` to render `WarRoom`.
- Keep existing `className` hooks (`sc-tab-war`, `sc-realm-card`, season data attributes if present) so Gemini themes still apply.
- No crest/theme.css/Pixi restyle. No server routes.
- Sim only if you add a tiny tested helper (`warSummary`). No formula changes.

## Gemini — world presentation (grand lane)

Goal: the hold should *feel* the year. Not a season label in a corner.

### Must ship

1. **Per-tab atmospheres** (kingdom / army / war / world / crown) that are more than a flat color. Layered backgrounds: parchment, fog, ember, starfield, or timber — CSS and/or canvas. Subtle motion (drift, flicker, weather) without blocking clicks.
2. **Seasons are visible and audible.** Read `currentSeason(state)` (`Spring` `Summer` `Autumn` `Winter`).
   - Spring: growth, pollen, birds or light motif.
   - Summer: heat shimmer, bright gold, cicada/drone or bright bed.
   - Autumn: falling leaves, harvest amber, lower woodwinds.
   - Winter: snow motes, cold steel, thin wind.
   Tie volume to the existing music toggle. Do not autoplay loud loops.
3. **Calendar holidays as overlays** (presentation only). Derive from *real-world date in the player's browser* OR from `meta.tick` mapped to a festival table in `packages/app` (not in tickEngine). At least:
   - All Hallows / Halloween
   - Midwinter / Christmas-tide
   - Dawn feast / Easter-tide
   Optional: harvest moon, midsummer.
   Each holiday: background shift, a few props (lanterns, wreath, painted eggs, pale riders), and a short stinger or motif on the existing audio path (`sfx` / music bed). Must turn off when the date/tick window ends.
4. **Horde, bazaar, spoils bag, BattleVisual, ArmyVisual, UnitIcon, chapel/walls tiles** still in scope from the previous Gemini brief. Item tier chips from `ITEMS` in `loot.ts`.
5. Prefer CSS 3D (`transform`, `perspective`, layered planes), SVG, Pixi overlays already in the app. Do **not** add Unity, Three.js, or a second renderer unless you can tree-shake it and keep the production build working. If you add a dependency, justify it in `walkthrough.md`.

### Must not

- `git diff main -- packages/sim` empty.
- `git diff main -- server` empty.
- No change to season length, production bonuses, or holiday *gameplay* bonuses unless a flag already exists. Immersion first; balance later.
- Do not break map tile clicks or tab switching.

Ambition is wanted. Uniqueness is wanted. A broken tick loop is not.

## Astra — auction + PvP ledger

Unchanged: spec `docs/SPEC-AUCTION-PVP.md`, then smallest `/auction` + `/pvp` + `AuctionPanel`. No second combat engine. Do not restyle Gemini's season layers.

## Verify

```bash
npm test
npm run build -w @second-crown/app
```

Live: `https://129.153.17.72.sslip.io`
