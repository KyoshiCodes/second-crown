# HANDOFF — current project state

Last updated: 2026-09-06 | Version: playtest-0.5 | Updated by: Grok

## Live

`https://129.153.17.72.sslip.io/` — Caddy → 8787 — `pm2` `sc-cloud`.
Repo `main`: `https://github.com/KyoshiCodes/second-crown`.

## Just completed

WarRoom, seasons/holidays, practice ledger, synth + `/audio` hook, holiday SVG stages, sticky Holiday overlay bar.

## Next

**Gemini** `bakeoff/gemini-immersion` — `docs/AGENT-TASK.md`.
Pixel isometric living map (Realm Grinder direction), theme packs, halloween.ogg, presentation walkers.
Not full 3D Civ this sprint. Citizen economy stays future sim work.

## Deploy

```bash
cd ~/second-crown && git pull && npm test && npm run build -w @second-crown/app && pm2 restart sc-cloud
```
