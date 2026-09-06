# HANDOFF — current project state

Last updated: 2026-09-06 | Version: playtest-cloud | Updated by: Grok session (post Discord + watch)

## 1. Where we are

Playable idle kingdom + war prototype on a live Oracle VM.

- Game + API: `http://129.153.17.72:8787/`
- Repo: `https://github.com/KyoshiCodes/second-crown` (private, `main`)
- Owner playtests with Discord login and guest recovery codes
- Friends can open the same URL, or a `#watch=` spectator link

Stack is still the ADR-006 monorepo (Vite, React, Pixi map, break_infinity / Decimal in sim, Vitest). A small Node process in `server/index.mjs` was added later for saves and OAuth. It does **not** run the sim. Clients run `@second-crown/sim` locally.

## 2. Current version

No semver tag. Treat as **0.2-playtest**. `packages/sim` tests are the health gate.

## 3. What was just completed

- Deterministic tick engine, buildings, units, combat, prestige, offline catch-up
- Multiple AI crowns (seed-picked archetypes) + Iron March primary rival
- Per-crown declare / gift / peace timers; one active war at a time
- Faction join/leave + player guild; stance sours over time
- Battle phase readout (same RNG order as the resolver)
- SVG heater-shield heraldry
- Oracle host, iptables + security list on **8787**
- Guest tokens, Discord OAuth, auto-push, watch rooms

## 4. What is in progress

Nothing blocked. Next owner choices: HTTPS on the VM, live tick spectate, or a UI overhaul on a branch.

## 5. Immediate next step for a new agent

1. Read `docs/INVARIANTS.md` and `docs/CHANGELOG.md`
2. `npm test` then `npm run build -w @second-crown/app`
3. Do **not** rewrite `packages/sim` unless a test is red or the owner names a sim task
4. UI / art / specs go on a feature branch

## 6. Known issues

- HTTP only — browser shows Not secure; Discord warns on the redirect
- Spectator is a **4s save snapshot**, not lockstep
- `AppShell.tsx` is a single large UI file
- Peace/gift on the War tab still highlights Varric; other crowns are on World + declare buttons
- `sc-game` pm2 process on port 8080 is obsolete; game is served from 8787
- Original ADR-006 said “no backend”. ADR-008 records the playtest exception

## 7. Decisions this stretch

ADR-008 Oracle playtest host  
ADR-009 Discord OAuth + guest tokens  
ADR-010 Snapshot spectate, not lockstep  

See `docs/DECISIONS.md`.

## 8. Important paths

| Path | Role |
|---|---|
| `packages/sim` | Authoritative game logic. Deterministic. Tests live here |
| `packages/app` | React shell, cloud panel, spectator view, crests |
| `packages/render` | Pixi map |
| `packages/shared` | Types, save version |
| `server/index.mjs` | Health, guest, Discord, save, watch, static `packages/app/dist` |

## 9. What the owner does manually

```bash
cd ~/second-crown
git pull
npm test
npm run build -w @second-crown/app
pm2 restart sc-cloud
```

Hard-refresh `http://129.153.17.72:8787/`

Discord env (already set on the VM if health shows `"discord":true`):

`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,  
`DISCORD_REDIRECT=http://129.153.17.72:8787/auth/discord/callback`,  
`PUBLIC_APP_URL=http://129.153.17.72:8787`, `PORT=8787`, `CORS_ORIGIN=*`

## 10. How to verify

```bash
npm test
npm run build -w @second-crown/app
curl -s http://127.0.0.1:8787/health
```

Expect tests green, health `{"ok":true,"discord":true}` on the VM, game HTML on `/`.

## 11. Open questions

- HTTPS (free cert) vs stay on HTTP for playtest
- Live spectate vs keep snapshots
- Whether a second AI agent may touch `packages/sim`

## 12. Pickup prompt

You are joining **Second Crown**, a deterministic idle/war game. Live playtest: `http://129.153.17.72:8787/`.

Read in order: `AGENTS.md`, `docs/INVARIANTS.md`, `docs/HANDOFF.md`, `docs/CHANGELOG.md`, `docs/DECISIONS.md`.

Do not violate invariants 2 (determinism) or 6 (sim independent of React). Do not run the sim on the server. Cloud stores JSON blobs only.

Default: work on UI, docs, or a spec branch. Ask before editing `packages/sim`.

---

## Session log (recent)

| Date | Summary |
|---|---|
| 2026-09-05 | Design bible + ADR-001–007 |
| 2026-09-05–06 | Sim + app built through war, world, prestige |
| 2026-09-06 | Oracle 8787, Discord, guests, auto-push, watch links, extra crowns, SVG shields, per-crown peace |
