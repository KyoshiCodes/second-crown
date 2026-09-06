# HANDOFF — current project state

Last updated: 2026-09-06 | Version: playtest-0.4 | Updated by: Grok (HTTPS live + specialist buildings)

## 1. Where we are

Live playtest (prefer this URL):

`https://129.153.17.72.sslip.io/`

Caddy terminates TLS and reverse-proxies `127.0.0.1:8787`. Process: `pm2` `sc-cloud`.
Old `http://129.153.17.72:8787/` still answers on 8787.

Repo: `https://github.com/KyoshiCodes/second-crown` `main`.

## 2. Version

**0.4-playtest**. Gate: `npm test` then `npm run build -w @second-crown/app`.

## 3. Just completed

- HTTPS via Caddy + Let's Encrypt on `129.153.17.72.sslip.io`
- Discord redirect + `PUBLIC_APP_URL` on that host
- Units: skirmisher, cavalry, siege + portraits
- Buildings: stables, archery range, siege workshop (unit-specific train discounts)

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

## Astra PR — practice exchange and PvP ledger (not deployed)

Branch `bakeoff/astra` adds `/auction`, `/pvp`, and a World-tab panel. Discord
players can exchange separate practice assets and lock unverified challenge
snapshots. Real kingdom transfers and rated fights remain gated; see
`SPEC-AUCTION-PVP.md` and root `walkthrough.md`. No sim, tick cadence, save schema,
OAuth, guest behavior, or seasonal presentation changes. Keep one sc-cloud
process and back up `DATA_DIR/ledger.json` with saves. Do not merge automatically.
