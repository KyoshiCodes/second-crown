# HANDOFF — current project state

Last updated: 2026-09-06 | Version: playtest-0.4 (Gemini Presentation Pass) | Updated by: Gemini

## 1. Where we are

Live playtest (prefer this URL):

`https://129.153.17.72.sslip.io/`

Caddy terminates TLS and reverse-proxies `127.0.0.1:8787`. Process: `pm2` `sc-cloud`.
Old `http://129.153.17.72:8787/` still answers on 8787.

Repo: `https://github.com/KyoshiCodes/second-crown` `main`.

## 2. Version

**0.4-playtest** (Gemini Presentation Pass). Gate: `npm test` then `npm run build -w @second-crown/app`.

## 3. Just completed

- **Living Seasons (Seen & Heard)**: Canvas weather particles (Spring pollen/petals, Summer fireflies/shimmer, Autumn leaves, Winter snow) tied to sim season clock + seasonal Web Audio pentatonic scales and timbres.
- **Calendar & Holiday Overlays**: All Hallows (Halloween), Midwinter (Christmas-tide), Dawn Feast (Easter-tide), Harvest Moon, Midsummer Solstice with ambient lighting, badges, and holiday stingers. Instant preview switcher in `TesterBar`.
- **Pixi Map Ground Seasoning**: Seasonal ground recoloring and rooftop snow caps in Winter.
- **Loot & Bazaar Item Tier Chips**: Rarity chips (`common`, `uncommon`, `rare`, `epic`) with SVG badges for the Spoils Bag and Wandering Bazaar.
- **Atmospheres & Polish**: Layered CSS/SVG atmospheres for all tabs without blocking pointer events, custom Champion portrait, combat victory/defeat sound cues.
- **Strict Invariant Adherence**: Zero lines touched in `packages/sim` or `server`; 100% sim tests passing.


## 4. In progress

Nothing blocked. Next: more map identity (tile names) or audio pass — not PvP.

## 5. New agent

Read AGENTS.md, INVARIANTS, this file, CHANGELOG, USER-NOTES, DEV-NOTES.
Do not break Caddy or drop Discord env on `pm2 delete`.

## 6. Known issues

- OCSP staple warning on Caddy is harmless
- Board is honor-system
- Spectator is snapshot

## 8. Paths

`packages/sim` rules. `packages/render` map. `server/index.mjs` cloud. `/etc/caddy/Caddyfile` TLS.

## 9. Deploy

```bash
cd ~/second-crown && git pull && npm test && npm run build -w @second-crown/app && pm2 restart sc-cloud
```

Do not `pm2 delete sc-cloud` unless you re-pass Discord env.

## 12. Pickup prompt

Second Crown idle/war game. Play `https://129.153.17.72.sslip.io/`. Sim is client-only. Caddy + sc-cloud. Update HANDOFF/CHANGELOG/USER-NOTES/DEV-NOTES on meaningful merges.
