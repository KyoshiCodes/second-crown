# HANDOFF — current ground (2026-09-21)

Play: https://129.153.17.72.sslip.io/
Plan: docs/ASCENT.md | Recap: docs/PROGRESS.md

Phase 1 of Ascent is on main: stats, harness, rounds/morale, wounded-by-default.
`resolveBattle` is still the only fight function.

## Next recommended wave

Marshal schema (`systems/marshal.ts`) on `CharacterInstance`. Do not add a second combat path.
Skills can no-op until they fire inside `resolveRounds`.
