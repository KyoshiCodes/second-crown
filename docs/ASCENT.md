# Ascent — depth plan status

Owner accepted the six defaults in the 2026-09-21 assessment:
Marshals after Phase 1, Sworn Houses stay AI-only, old unit IDs stay as aliases,
Command mode stays late, twelve Marshal cap, invariant tests ride with Phase 1.

## Shipped

**R1 — stats + triangle (2026-09-21)**
- `UnitType` now has `attack`, `defense`, `hp`, `speed`, `role`, `tier`.
- IDs unchanged: militia, spearman, skirmisher, archer, cavalry, knight, siege, champion.
- `matchupModifier(attackerRole, defenderRole)` in `packages/sim/src/content/matchup.ts`.
- Triangle: line > shock > ranged > line (±40% material). Skirmish / siege / support asymmetric.
- `resolveBattle` is untouched. Live fights still `power × count × rng`.

## Next waves (do not skip)

| Wave | What | Must not do |
|---|---|---|
| R2 | 1,000-fight harness CSV under `packages/sim` | Change combat math |
| R3 | Round + morale + `BattleEvent[]` behind `resolveBattle` adapter | Second combat function |
| R4 | Wounded-by-default (overflow dies) | Break war/siege/march call sites |
| Then | Marshal schema, Keep gate table UI, Ledger of Crowns | Engagements before R3 gate |

## Hard rules

- One resolver. Tick-time, not wall-clock events.
- No streak-loss, no pay-skip timers.
- Invariants 1–3 cannot be bent to ship a feature.
