# Bakeoff — three real systems (not docs busywork)

Ground is current `main`. Do not merge to main. One lane each. If a file is not in your allow-list, do not touch it.

Shared invariants:
- Do not edit `packages/sim/src/core/tickEngine.ts` unless your lane says so (Astra may register GatherSystem only).
- Do not change Discord / Caddy / OAuth.
- Deterministic: same seed + same inputs → same state.
- `npm test` and `npm run build -w @second-crown/app` green.
- Rewrite `walkthrough.md` for your PR only. Update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES.
- PR into main, leave unmerged.

## Claude — `bakeoff/claude-pace` — hold economy

Allow: `packages/sim` (not tickEngine), `packages/shared` only if a type needs a field, docs.
Forbid: `packages/app`, `packages/render`, `server`.
`git diff main -- packages/app packages/render server` empty.

Ship all of:
1. **Raid haul cut:** camp +20 wood → +6; forage nodes +12 → +5. Player wins still call `plantOutpost`.
2. **Academy building** in `BUILDING_TYPES`: no drip production; stone/wood/gold cost; buildTicks ≥ 120. Horse lore prefers a finished academy; if none exists, barracks still works so current testers are not soft-locked.
3. **Storehouses:** add `storehouse` building OR reuse granary/sawmill/mason as caps. `storageCap(state, res)` — food/wood/stone/gold have finite warehouses. Production and raid payouts that would exceed cap are lost (or stop). Default cap tight enough that two early farms cannot sit on 2K food. Tests required.
4. No second combat resolver. No new unit types.

## Astra — `bakeoff/astra-gather` — map gathering (Lords tile gather)

Allow: `packages/sim` including a new `systems/gather.ts` (+ tests), `packages/sim/src/index.ts` exports, `tickEngine.ts` **only** to append GatherSystem to SYSTEMS, `packages/shared` if gather-state must live on flags or a typed field, docs.
Forbid: `packages/app`, `packages/render`, presentation CSS, server routes.
`git diff main -- packages/app packages/render` empty.

Ship all of:
1. A gather expedition distinct from smash-and-grab raids: player sends a column to a **woodcut / quarry / field** node; troops stay until `load` fills or player recall; then they walk home and add resources on arrival.
2. Load and duration scale with troop count and node type. Gold nodes are not required this PR.
3. Cannot gather a tile another player march is already gathering (single occupant).
4. Recall action `tryRecallGather`.
5. Tests: start, tick/arrive, payout, recall, blocked double-gather, determinism vs settleTicks if you touch the engine.
6. Do not replace `resolveBattle`. Camps/holds stay combat marches.

If you need a UI hook, export functions only — Gemini will wire buttons later. Do not invent a second tick rate.

## Gemini — `bakeoff/gemini-academy` — see the new systems

Allow: `packages/app`, `packages/render`, docs.
Forbid: `packages/sim`, `server`.
`git diff main -- packages/sim server` empty.

Ship all of:
1. Distinct isometric **academy** (and polish siege workshop if it is still a generic box).
2. Research bar = lectern / study card (horse + siege), not two naked buttons. Costs stay as sim exports them.
3. Board: outpost / flag token on player-occupied field tiles; gather expedition pawn if `listMarches` / exported gather helpers exist on main — if Astra has not merged, stub the draw behind `listGathers?.()` or skip gathers and document that.
4. Keep zoom/pan, inspect/scout, holidays, dim lanterns, pixel army icons.
