# Bakeoff task (frozen main)

Ground commit family: current `main` including horde/bazaar, quests, court, seasons, Discord/HTTPS.
Do not rebase onto old `bakeoff/claude` or `bakeoff/gemini` — those are stale.

Use these branches (cut from current main):
- Claude Code: `bakeoff/claude-war`
- Gemini / Antigravity: `bakeoff/gemini-art`
- ChatGPT GPT-6 Astra: `bakeoff/astra`

Open a PR into `main` when green. Do not merge yourself.

## Shared invariants

1. Do not change `packages/sim/src/core/tickEngine.ts` tick math or cadence.
2. Do not change Discord OAuth, Caddy, or guest token behavior except Astra adding `/auction` and `/pvp` beside existing routes.
3. Determinism: no `Math.random()` in `packages/sim`.
4. Keep `npm test` and `npm run build -w @second-crown/app` green.
5. Do not invent a second combat resolver. `resolveBattle` stays the fight.
6. Big numbers stay `break_infinity` / `D()` / letter suffix.
7. Write a short `walkthrough.md` at repo root on your branch only.

## Claude — WarRoom + structure

Goal: one War tab that a player can read in 20 seconds.

- Create `packages/app/src/WarRoom.tsx` (or `tabs/WarRoom.tsx`) that composes: odds (`realmPower` attacker vs defender), levy/train shortcut, declare / resolve / white peace, last `BattleResult` phases, fortify/decree status.
- Thin `tabs/WarTab.tsx` so it mostly renders `WarRoom`.
- Optional: split `DecreesPanel` only if it stays behavior-identical.
- Do not restyle crests, theme.css palettes, or Pixi map art.
- Do not add server routes.
- Touch `packages/sim` only if you add a tiny pure helper (e.g. `warSummary(state)`) with a test. No formula changes.

## Gemini — presentation

Goal: the horde, battle strip, map tiles, and item bag look like a game.

- Horde / bazaar / spoils presentation on World (`MarketPanel` or adjacent).
- BattleVisual / ArmyVisual / UnitIcon polish. Champion and new units readable.
- Chapel/walls already have simple tiles; improve if you can without breaking clicks.
- Item tier chips (common / uncommon / rare / epic from `ITEMS` in loot.ts).
- Do not change sim formulas or `server/`.
- `git diff main -- packages/sim` and `git diff main -- server` should stay empty.

## Astra — auction + PvP ledger (spec first, then small code)

Goal: real multi-save movement, not a second idle sim.

1. Write `docs/SPEC-AUCTION-PVP.md` on your branch: endpoints, JSON shapes, what is deducted from the buyer save, how seller `pendingGold` is claimed, how a PvP rating uses a **power snapshot** (not a live tick fight).
2. Then implement the smallest slice:
   - `GET/POST /auction` and `POST /auction/buy` in `server/index.mjs` (JSON file under `server/data/`).
   - `GET /pvp` + `POST /pvp/report` storing `{ id, name, power, wins }`.
   - A small `AuctionPanel` that lists stalls when `Authorization` exists; if no token, show copy “log in to list an item.”
3. Buying must not print free relics. Deduct spoils/gold on the client via existing `act()` then POST; server rejects if the client does not send a plausible payload. Document the trust model (friends-only, honor + token).
4. Do not rewrite `resolveBattle`.

## Verify

```bash
npm test
npm run build -w @second-crown/app
```

Live game for reference: `https://129.153.17.72.sslip.io`
