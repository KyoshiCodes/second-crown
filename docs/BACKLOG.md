# BACKLOG — deferred scope

Last updated: 2026-09-06

## Playtest exception (not 1.0 product scope)

Cloud saves, Discord login, and snapshot spectate exist for friend testing (ADR-008–010).
They are not a promise of multiplayer 1.0. The sim still runs only on the client.

## Next optional tracks

| Item | Note |
|---|---|
| HTTPS on Oracle | Removes Not secure + Discord HTTP warning |
| Live spectate | Would need a new ADR; do not break combat RNG |
| UI overhaul | Branch only; `AppShell.tsx` is the bottleneck |
| Painted heraldry v2 | Richer SVG / art; keep realm ids stable |
| 3D battle view | View-only over existing resolver (ADR-003) |

## Deferred to 1.1.0+

| Item | Target | Note |
|---|---|---|
| Ascendant theme | 1.1.0 | ADR-005 |
| Extra doctrines | 1.1.0+ | Data once perk pool exists |
| Localization | 1.1.0+ | Invariant 9 |
| Steam wrapper | post-1.0 | After ADR-007 |

## Explicit non-goals (still)

Citizen simulation, ads/telemetry, ingesting commercial game files, making the repo public without asking.

Original backlog called multiplayer and cloud saves non-goals. Playtest cloud is a **narrow exception**, not a lift of those non-goals for 1.0.
