# Ascent — depth plan status

## Shipped

- R1–R4 combat gate (stats, harness, rounds/morale, wounded-by-default)
- **Marshal schema (2026-09-21)** — `CharacterInstance.marshalTree` / `marshalRank`
  - `tryAppointMarshal` sets one player marshal to line | shock | ranged
  - `applyMarshalBonuses` is identity until skills hook `resolveRounds`

## Next

Keep gate table in the UI. Then first real marshal skill (Line Hold) inside `resolveRounds` only.
Do not start board engagements until that skill exists.

## Hard rules

One resolver. Tick-time events. No streak-loss. Invariants 1–3 stand.
