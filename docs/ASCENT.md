# Ascent — depth plan status

## Shipped (Phase 1 gate)

- **R1** unit stats + matchup table
- **R2** 1,000-fight harness
- **R3** rounds + morale inside `resolveBattle`
- **R4 (2026-09-21)** wounded-by-default: `absorbBattleCasualties`
  - Winner losses fill infirmary beds first
  - Loser overflow past beds is dead (already removed from the host)
  - No infirmary = no beds = all losses stay dead

## Next (Phase 2+)

Marshal schema on existing `CharacterInstance`, Keep gate table in the UI, Ledger of Crowns.
Do not start board engagements until Marshals have a hook into the resolver.

## Hard rules

One resolver. Tick-time events. No streak-loss. Invariants 1–3 stand.
