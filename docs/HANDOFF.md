# HANDOFF — current ground (2026-09-21)

Play: https://129.153.17.72.sslip.io/
Plan: docs/ASCENT.md | Player recap: docs/PROGRESS.md

## Combat

`resolveBattle` in `packages/sim/src/systems/combat.ts` is an adapter.
Rounds live in `packages/sim/src/systems/resolver.ts`.
Do not add another fight function.

## Next — R4

Wounded-by-default in the adapter: winner losses → infirmary; loser overflow past beds dies.
Keep `resolveBattle` signature. Tests required.
