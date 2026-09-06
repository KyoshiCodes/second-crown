# BACKLOG — deferred scope

Last updated: 2026-09-05 | Version: pre-0.1.0 | Updated by: project bootstrap

Anything requested outside the current milestone lands here with a target version. Nothing is
deleted from this file; items move to a milestone or are marked Rejected with a reason.

## Deferred to 1.1.0 and beyond

| Item | Target | Note |
|---|---|---|
| Ascendant theme (sci-fi) | 1.1.0 | Cut from 1.0 by ADR-005. Once themes are data plus a costed perk, this is a weekend of work |
| Additional doctrines beyond three | 1.1.0+ | Data-only once the perk pool exists |
| Localization beyond English | 1.1.0+ | Invariant 9 keeps the door open at near-zero cost |
| Steam / desktop wrapper | post-1.0 | Depends on the ADR-007 licensing decision |
| Mobile-native build | post-1.0 | Responsive web first; evaluate demand after |

## Explicit non-goals

| Item | Why not |
|---|---|
| Multiplayer of any kind | Requires a backend, accounts, and anti-cheat. Contradicts the free-and-serverless constraint at its root |
| Cloud saves | Same. Export/import to file covers the real need (invariant 15) |
| Anti-cheat / save encryption | Single-player idle game. A player editing their save harms no one. Obfuscation costs real effort and buys nothing |
| Citizen simulation or city pathfinding | Invariant 13. The specific trap that kills solo city-builders |
| Monetization, ads, telemetry | Free game, no server, no tracking |
| Procedurally generated art | Pixel art by hand or CC0. Generation is a project of its own |
| 3D anything | Explicitly rejected in the bible to avoid Blender |
| Ingesting commercial game files | Illegal and unnecessary. See AGENTS.md |

## Open ideas, unscheduled

Not committed, not rejected. Revisit after the 0.2.0 gate.

- Seeded weekly challenge realms — plays well with determinism, needs no server
- In-game encyclopedia generated from content data
- Battle replay sharing via export string, using stored outcomes per invariant 5
- Named rival kings persisting across exiles, remembering prior runs
