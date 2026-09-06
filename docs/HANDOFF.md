# HANDOFF — current project state

Last updated: 2026-09-06 | Version: playtest-0.3 | Updated by: Grok (Wave 1–2 + living map + clashes + docs)

## 1. Where we are

Playable idle kingdom + war prototype on a live Oracle VM.

- Game + API: `http://129.153.17.72:8787/`
- Repo: `https://github.com/KyoshiCodes/second-crown` (private, `main`)
- Owner playtests with Discord login and guest recovery codes
- Friends use the same URL or a `#watch=` spectator link

Stack: ADR-006 monorepo (Vite, React, Pixi map, Decimal in sim, Vitest). `server/index.mjs` stores JSON saves and OAuth. **The sim never runs on the server.**

## 2. Current version

Treat as **0.3-playtest**. Gate: `npm test` in `@second-crown/sim` then `npm run build -w @second-crown/app`.

## 3. What was just completed

- Wave 1: achievements, war spoils + crafts, kingdom trade, offline NPC shield, guild rename/crest
- Wave 2: `/board` `/profile` honor-system leaderboard + motto/crest
- Living map silhouettes + idle smoke/flags; army portraits bob
- World clashes: NPC vs NPC every ~30s; player can send a 20g levy
- Bakeoff merge: Claude tab split (`useGameEngine`, tab files) + Gemini heraldry/flavor/theme cards

## 4. What is in progress

Docs cadence locked (this file + CHANGELOG + USER-NOTES + DEV-NOTES). Next recommended product slice is **HTTPS** or **more unit types**, not PvP.

## 5. Immediate next step for a new agent

1. Read `AGENTS.md`, `docs/INVARIANTS.md`, this file, `docs/CHANGELOG.md`, `docs/USER-NOTES.md`, `docs/DEV-NOTES.md`
2. `npm test` then `npm run build -w @second-crown/app`
3. Do not rewrite `packages/sim` unless tests are red or the owner names a sim task
4. After any meaningful merge: update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES in the same PR

## 6. Known issues

- HTTP only
- Spectator is a 4s snapshot, not lockstep
- Board/stats are honor-system (client save push)
- `sc-game` pm2 name is obsolete; serve from `sc-cloud` on 8787
- First Furrow achievement needs placing an extra farm (starter farm does not grant it)

## 7. Decisions this stretch

ADR-008 Oracle playtest host  
ADR-009 Discord OAuth + guest tokens  
ADR-010 Snapshot spectate  
Wave 1–2 are playtest features, not 1.0 multiplayer

## 8. Important paths

| Path | Role |
|---|---|
| `packages/sim` | Rules. Deterministic. Tests here |
| `packages/sim/src/systems/wave.ts` | Achievements, crafts, shield, trades |
| `packages/sim/src/systems/worldClash.ts` | NPC vs NPC + levy |
| `packages/app` | React UI, CloudPanel, BoardPanel |
| `packages/render` | Pixi living map |
| `server/index.mjs` | guest, Discord, save, watch, board, profile, static dist |

## 9. Owner deploy

```bash
cd ~/second-crown
git pull
npm test
npm run build -w @second-crown/app
pm2 restart sc-cloud
```

Hard-refresh `http://129.153.17.72:8787/`

## 10. Verify

```bash
npm test
npm run build -w @second-crown/app
curl -s http://127.0.0.1:8787/health
curl -s http://127.0.0.1:8787/board
```

## 11. Open questions

- HTTPS vs stay HTTP
- When (if ever) to design async PvP (needs new ADR)
- More unit lines vs more buildings next

## 12. Pickup prompt

You are joining **Second Crown**, a deterministic idle/war game. Live: `http://129.153.17.72:8787/`.

Read: `AGENTS.md`, `docs/INVARIANTS.md`, `docs/HANDOFF.md`, `docs/CHANGELOG.md`, `docs/USER-NOTES.md`, `docs/DEV-NOTES.md`.

Do not violate invariants 2 or 6. Do not run the sim on the server.

After meaningful work, update the four docs above in the same change set. Give the owner exact `git pull` / `npm test` / `pm2 restart sc-cloud` commands. The owner is a beginner; no assumed tooling fluency.

---

## Session log (recent)

| Date | Summary |
|---|---|
| 2026-09-05 | Design bible + ADR-001–007 |
| 2026-09-06 | Sim through war/world/prestige; Oracle 8787; Discord; bakeoff merge; Wave 1–2; living map; world clashes |
