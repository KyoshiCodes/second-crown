# Ascent — depth plan status

## Shipped

**R1** unit stats + matchup table.
**R2** 1,000-fight harness.
**R3 (2026-09-21)** `resolveBattle` now runs rounds and morale in `systems/resolver.ts`.
- Same function name and `BattleResult` fields (war/siege/march unchanged).
- Armies break at morale 30. Max 12 rounds.
- Per-hit rng is ±5% (`0.95 + rng * 0.1`).
- `BattleResult.events` is the log.
- `attackerPower` / `defenderPower` still use `realmPower` + keep defense so old tests hold.

## Next

**R4** wounded-by-default: loser overflow past infirmary beds dies; winner losses go to beds first.
Then Marshal schema / Keep gate table / Ledger.

## Hard rules

One resolver. No second combat function. Invariants 1–3 stand.
