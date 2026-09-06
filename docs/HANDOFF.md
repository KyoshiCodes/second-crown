# HANDOFF — current project state

Last updated: 2026-09-06 | Version: playtest-0.6 | Updated by: Grok

## Live

`https://129.153.17.72.sslip.io/` — Caddy → 8787 — `pm2` `sc-cloud`.
Repo `main`: `https://github.com/KyoshiCodes/second-crown`.

## Just completed

Isometric pixel hold, presentation walkers, theme packs, recorded `/audio/<id>.ogg` (halloween + easter + midwinter planned), collapsible ChromeDock (Show tools + Holiday).
WarRoom, seasons, practice ledger still on main once PR 7 merges.

## Next

After PR 7 is on main:
- Gemini `bakeoff/gemini-board` — tabletop density, box lid, original holiday motion, War tab dressing, zoom+pan. No sim/server.
- Claude `bakeoff/claude-fort` — wall/tower/keep combat hooks + citizen job stubs.
- Astra waits.

## Deploy

```bash
cd ~/second-crown && git pull && npm test && npm run build -w @second-crown/app && pm2 restart sc-cloud
```
