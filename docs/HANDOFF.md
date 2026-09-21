# HANDOFF — current ground (2026-09-21)

Read this first. Player recap: docs/PROGRESS.md. Plan: docs/ASCENT.md.
Play: https://129.153.17.72.sslip.io/

## Live systems

Hold + 12×8 board, marches, gather, garrisons, fog, siege, cultures, cloud save.
Combat is still scalar `resolveBattle`.

## Shipped this week

- Layout bonuses (staff, cluster, pair, keep yard, barracks-on-keep).
- R1 unit stats + `matchupModifier` (unused by combat).
- R2 harness: `packages/sim/src/harness/battleHarness.ts` — 1,000 fights, deterministic, 2× militia baseline.

## Next agent task — R3

Replace the internals of `resolveBattle` with a round + morale + `BattleEvent[]` loop.
Keep the same function name and `BattleResult` fields so war/siege/march keep compiling.
Use `matchupModifier` and unit stats. Seeded rng ±5% per round max.
Same seed + same stacks = identical log. Do not add a second combat function.

## Verify

```
npm test
npm run build -w @second-crown/app
```
