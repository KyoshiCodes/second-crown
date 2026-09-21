# Ascent — depth plan status

Owner accepted the six defaults in the 2026-09-21 assessment:
Marshals after Phase 1, Sworn Houses stay AI-only, old unit IDs stay as aliases,
Command mode stays late, twelve Marshal cap, invariant tests ride with Phase 1.

## Shipped

**R1 — stats + triangle (2026-09-21)**
- `UnitType` now has `attack`, `defense`, `hp`, `speed`, `role`, `tier`.
- IDs unchanged.
- `matchupModifier` in `packages/sim/src/content/matchup.ts`.
- `resolveBattle` untouched.

**R2 — harness (2026-09-21)**
- `packages/sim/src/harness/battleHarness.ts` runs 1,000 seeded fights across 10 compositions.
- CSV helper `harnessCsv`. Summary tracks player-win rate and that 2× militia never loses under the current swing range.
- Same seed + same stacks = same winner / swings.
- Still does not change `resolveBattle`.

## Next

| Wave | What | Must not do |
|---|---|---|
| R3 | Round + morale + `BattleEvent[]` behind `resolveBattle` adapter | Second combat function |
| R4 | Wounded-by-default (overflow dies) | Break war/siege/march call sites |
| Then | Marshal schema, Keep gate table UI, Ledger of Crowns | Engagements before R3 gate |

## Hard rules

- One resolver. Tick-time, not wall-clock events.
- No streak-loss, no pay-skip timers.
- Invariants 1–3 cannot be bent to ship a feature.
