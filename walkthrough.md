# Walkthrough — Claude Hold Economy: Smaller Raids, Academy, Storehouses (`bakeoff/claude-pace`)

## What changed

1. **Raid haul cut (`packages/sim/src/systems/march.ts`)**:
   - Breaking a bandit camp now pays **+6 wood** (was +20).
   - Clearing a woodcut/quarry/field node now pays **+5** of the matching resource (was +12).
   - Player wins on both paths still call `plantOutpost(state, dest)` exactly as before — the flag still plants, only the payout shrank.
   - Both payouts now route through the new `addCapped` helper (see #3), so an over-full warehouse loses the excess instead of raid loot silently exceeding a storage cap.

2. **Academy building (`packages/sim/src/content/buildings.ts`, `packages/sim/src/systems/research.ts`)**:
   - New `academy` entry in `BUILDING_TYPES`: `productionPerTick: {}` (no drip income), `cost: { wood: "24", stone: "20", gold: "12" }`, `buildTicks: 130` (≥ 120 as required).
   - `RESEARCH.horse` (Horse lore) now needs **either** a finished `academy` **or** a finished `barracks` (`needsAny: ["academy", "barracks"]`) — same shape used for `RESEARCH.siege`, which still needs only `siege_workshop`.
   - **Ambiguity call**: "prefers an academy" is read as "academy is the intended prerequisite going forward, barracks remains a valid fallback" rather than a cost/speed bonus for owning both — the smaller, fully deterministic reading, and it's the one already assumed by the pre-existing `research.test.ts` ("blocks cavalry until horse lore finishes" still builds only a barracks). No other research, training, or unlock rules changed.

3. **Storehouses / storage caps (`packages/sim/src/systems/storage.ts`, new file)**:
   - `storageCap(state, res)` returns a finite ceiling for `food` / `wood` / `stone` / `gold`; every other resource (e.g. spoils currencies) stays uncapped (`Infinity`).
   - **Ambiguity call**: the brief allowed "add a `storehouse` building OR reuse granary/sawmill/mason as caps." Reusing existing buildings is the smaller, lower-risk option — it needs no new build-menu entry, no new render art, and no new balancing surface for the two lanes that own `packages/app`/`packages/render`. Base caps (before any storage building) are `food 200`, `wood 150`, `stone 150`, `gold 100` — comfortably under the "two early farms can't sit on 2K food" bar. Each finished `granary` (+300 food), `sawmill` (+250 wood), `mason` (+250 stone), or `mint` (+150 gold) raises its resource's cap; unfinished buildings don't count (same `completesAtTick === null` rule every other cap/count helper in this codebase uses).
   - `addCapped(state, res, amount)` adds a gain and clamps the result at `storageCap`; the excess is simply lost. Spends (non-positive amounts) pass through uncapped so nothing blocks players from going into debt-free negative-avoidance logic elsewhere. It's used by:
     - `economy.ts`'s `EconomySystem.advanceAnalytic` (covers both the per-tick path and the offline/fast-forward analytic path, since `tick()` just calls `advanceAnalytic` for a 1-tick window).
     - `march.ts`'s camp/node raid payouts (see #1).
   - Deliberately **not** applied to spoils (`iron`/`banners`/`relics` from `loot.ts`/`raid.ts`), trade, tithe, or quest rewards — the brief calls out "production and raid payouts" specifically, and widening the cap to every gold/food/wood/stone credit in the game would have meant auditing systems outside this lane's scope.
   - **Determinism**: capping is a `min(current + gain, cap)` clamp applied on every credit. Because production/haul amounts are always non-negative, splitting one window into several smaller windows and clamping after each yields the same final value as clamping once over the combined window (proved out in `storage.test.ts`'s "same final food … one jump or several smaller ones" case) — so `settleTicks`' analytic fast-forward and single-tick stepping can never diverge because of storage capping.

4. **No new combat resolver, no new unit types.** `resolveBattle` in `systems/combat.ts` and `UNIT_TYPES` in `content/units.ts` are untouched.

## Where

- `packages/sim/src/systems/march.ts`: raid haul amounts (20→6, 12→5) and routed through `addCapped`.
- `packages/sim/src/content/buildings.ts`: added `academy`.
- `packages/sim/src/systems/research.ts`: `needs` → `needsAny: string[]`, horse lore accepts academy or barracks.
- `packages/sim/src/systems/storage.ts` (new): `storageCap`, `addCapped`.
- `packages/sim/src/systems/economy.ts`: production credits now go through `addCapped`.
- `packages/sim/src/index.ts`: exports `storageCap`.
- Tests: `packages/sim/src/systems/storage.test.ts` (new), plus additions to `march.test.ts`, `research.test.ts`, and `build.test.ts`.
- Documentation cadence: `docs/HANDOFF.md`, `docs/CHANGELOG.md`, `docs/USER-NOTES.md`, `docs/DEV-NOTES.md`, this file.

## Verification

- `npm test` (`@second-crown/sim`): 104/104 pass (93 pre-existing + 11 new, across `storage.test.ts` and additions to `march.test.ts`/`research.test.ts`/`build.test.ts`).
- `npm run build -w @second-crown/app`: `tsc -b && vite build` passes cleanly, unchanged app code building against the new sim exports.
- `git diff main -- packages/app packages/render server`: verified 100% empty.
- `git diff main -- packages/sim/src/core/tickEngine.ts`: verified empty — no changes to the tick engine or a second tick rate.
- `resolveBattle`/`UNIT_TYPES` untouched — no second combat resolver, no new unit types.
