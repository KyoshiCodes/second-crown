# HANDOFF — current project state

Last updated: 2026-09-06 | Version: playtest-0.5 | Updated by: Grok

## 1. Where we are

Live: `https://129.153.17.72.sslip.io/`
Caddy → `127.0.0.1:8787`. Process: `pm2` `sc-cloud`.
Repo: `https://github.com/KyoshiCodes/second-crown` `main`.

## 2. Version

**0.5-playtest**. Gate: `npm test` then `npm run build -w @second-crown/app`. Ledger tests: `node --test server/ledger.test.mjs server/ledger-http.test.mjs`.

## 3. Just completed

- **Gemini immersion foundation** (`bakeoff/gemini-immersion`):
  - Theme packs system (`packages/app/src/themes/`): 9 complete packs (halloween, midwinter, easter, harvest, midsummer, spring, summer, autumn, winter) with dedicated backgrounds, tab/badge chrome, music sources, and map ambient profiles.
  - Recorded audio first with synth fallback: `packages/app/src/themes/audioManager.ts` plays `/audio/<id>.ogg` (preserves owner's `halloween.ogg`), seamlessly falling back to procedural synth when missing, plus battle audio support.
  - Isometric 2.5D pixel hold (`packages/render`): 2:1 diamond projection matching the exact 16×10 grid click contract, cobblestone streets, 3D raised stone cliff rim.
  - Pixel isometric buildings: all 15 building types + fallback rendered with shaded facades, scaffolding during construction, upgrade level frames (1–5), and seasonal trims (snow caps, jack-o'-lanterns).
  - Living hold presentation walkers: 8 animated pixel citizens (villager, woodcutter, miner, merchant, guard, scholar) with walking strides and idle behaviors roaming between buildings or idling near the keep. Zero sim tick rules.
  - Atmospheric lighting and seasonal particle overlays (falling snow, spectral embers, fireflies, petals, autumn leaves).
  - Sticky TesterBar (`zIndex: 100`) above map and stage for instant holiday overlay switching.
  - Strict zero-diff invariant maintained on `packages/sim` and `server`.

## 4. Next (planned)

- Friends playtest presentation polish.
- Additional CC0 recorded audio drops into `packages/app/public/audio/`.
- Real-item trade remains gated behind future phases.

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
