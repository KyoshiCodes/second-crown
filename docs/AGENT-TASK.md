# Agent task — Claude

You are on branch `bakeoff/claude`.

## Mission

Split `packages/app/src/AppShell.tsx` into focused components without changing game rules.

Create files such as:
- `packages/app/src/game/useGameEngine.ts` (interval must tick `engineRef.current`, never a closed-over engine)
- `packages/app/src/tabs/KingdomTab.tsx`
- `packages/app/src/tabs/ArmyTab.tsx`
- `packages/app/src/tabs/WarTab.tsx`
- `packages/app/src/tabs/WorldTab.tsx`
- `packages/app/src/tabs/CrownTab.tsx`
- `packages/app/src/hud/ResourceHud.tsx`

## Must preserve

- New Game replaces the engine and persists the new state
- Per-crown declare: `peaceTicksRemaining(state, "player", realmId)`
- Fight uses `tryResolveWar` phases for BattleVisual
- World gifts: `tryGiftGold(st, 15, realmId)`
- Map tile click build/upgrade via Pixi
- `CloudPanel` and `TesterBar` stay mounted from `main.tsx`

## Forbidden

- `packages/sim/**`
- `server/**`
- New network endpoints
- Commits to `main`

## Done when

- `npm test` green
- `npm run build -w @second-crown/app` succeeds
- Open a PR: `bakeoff/claude` → `main` titled `bakeoff(claude): split AppShell`
