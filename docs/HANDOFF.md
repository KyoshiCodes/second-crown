# HANDOFF — current project state

Last updated: 2026-09-06 | Version: playtest-0.5 | Updated by: Grok

## 1. Where we are

Live: `https://129.153.17.72.sslip.io/`
Caddy → `127.0.0.1:8787`. Process: `pm2` `sc-cloud`.
Repo: `https://github.com/KyoshiCodes/second-crown` `main`.

## 2. Version

**0.5-playtest**. Gate: `npm test` then `npm run build -w @second-crown/app`. Ledger tests: `node --test server/ledger.test.mjs server/ledger-http.test.mjs`.

## 3. Just completed

- Claude WarRoom + `warSummary`.
- Gemini seasons/holidays/chips/weather (first bakeoff).
- Astra practice auction + PvP ledger (practice gold only; not kingdom saves).
- Layered synth bed + battle pulse; recorded-track hook at `/audio/<id>.ogg`.
- Holiday SVG stages (halloween night, midwinter, etc.). Everyday seasons do **not** use the flat two-color stage.
- TesterBar holiday dropdown is sticky so it does not vanish under the scene.

## 4. Next (planned)

**Gemini immersion foundation** — `docs/AGENT-TASK.md`, branch `bakeoff/gemini-immersion`.
Theme pack system: real backgrounds, pack-driven chrome, CC0 music files, battle beds.
Not Astra (ledger). Not Claude unless WarRoom breaks.
After that: friends playtest presentation; real-item trade stays gated.

## 5. New agent

Read AGENTS.md, INVARIANTS, this file, CHANGELOG, USER-NOTES, DEV-NOTES, AGENT-TASK.md.
Do not `pm2 delete sc-cloud` (Discord env).

## 6. Known issues

- Synth is not a soundtrack; drop CC0 oggs into `packages/app/public/audio/`.
- Practice ledger is not ranked PvP.
- Board is honor-system.

## 9. Deploy

```bash
cd ~/second-crown && git pull && npm test && npm run build -w @second-crown/app && pm2 restart sc-cloud
```
