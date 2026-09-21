# HANDOFF — current ground (2026-09-21)

Read this first. Older per-PR bakeoff notes live in CHANGELOG.md.
Player-facing recap: docs/PROGRESS.md. Depth plan: docs/ASCENT.md.
Play: https://129.153.17.72.sslip.io/

## Repo

- Monorepo: `packages/sim` (rules), `packages/render` (Pixi board), `packages/app` (React), `packages/shared`, `server/`.
- Host: Oracle ARM Ubuntu, Caddy HTTPS on `129.153.17.72.sslip.io`, pm2 `sc-cloud` on 8787.
- Stack: Vite 8 on Windows clones; server may still show Vite 5 until Node on the VM is raised. Sim tests are the gate.
- Invariants: deterministic ticks, one combat function, content-as-data, no Discord/Caddy edits unless asked.

## Live systems (do not rebuild)

Hold + 12×8 board, marches, gather + node stock, garrisons, fog, scouts, camps, siege, rim walls/gate, incoming warnings, warehouse caps, research, training queue, upgrade queue, citizens + jobs, labor from posted workers, adjacency / pair / keep-yard / barracks-on-keep train discount, cultures (5 kits), holidays + audio, Discord cloud save.

Combat is still scalar `resolveBattle` (power × count × rng).

## Just landed — Ascent R1

- Units have attack/defense/hp/speed/role/tier.
- `matchupModifier` exists and is tested.
- Fights do not use those fields yet.

## Next agent task

R2: headless 1,000-battle harness writing CSV. Do not edit `resolveBattle`. Do not touch app/render unless asked.

## Verify

```
npm test
npm run test -w @second-crown/render
npm run build -w @second-crown/app
```
