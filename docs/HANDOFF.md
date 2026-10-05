# Handoff (2026-10-04)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · Oracle, `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Merged through PR **#212**. Waiting: `wave/realtime-join` (**not merged**, see Real time below).

### Cultures and units (all merged)

| Culture | Its one difference | Unit | Cost like | Power | Drill | Unlock |
|---|---|---|---|---|---|---|
| **Mist** (Mist Reach) | each finished farm +1 food/tick | **Ranger** | archer | 4 | 4s | Fieldcraft (Archery Range or Academy) |
| **Glen** (Glen Holds) | each finished quarry +1 stone/tick | **Banner** | spearman | 3 | 3s | Drill (Barracks or Academy) |
| **Salt** (Salt Reaches) | each finished lumber camp +1 wood/tick | **Outrider** | cavalry | 5 | 5s | Horse lore |
| **Fen** (Fen Steads) | each finished cottage +1 citizen | **Warden** | skirmisher | 3 | 3s | Screening |
| **Peak** (Peak Holds) | finished keep gives +1 hold vision | **Lancer** | knight | 6 | 6s | Horse lore |

- Pick a culture on the Crown tab, then New Game (`setPlayerCulture`). Saves with no culture flag stay western. NPCs are never seeded with these five.
- The old units (archer, spearman, cavalry, skirmisher, knight) are not replaced.
- Art is live for all five: 28px chips on the Army tab unit cards (`packages/app/src/hud/*Chip.tsx`, `UnitIcon.tsx`), culture keeps on the board and hold grid (`drawMiniatureKeep`, `drawKeepPlayerCulture`), and march meeples on the board (`drawRangerMeeple` … `drawLancerMeeple` in `packages/render/src/tokens.ts`).

### First dawn

- The first legal Second Dawn gives the new crown **+1 militia, +20 food, +10 wood** (45 food / 45 wood instead of 25 / 35).
- It does **not** stack: `flags.dawn_gift` is set on the first ascend and kept, so later ascends start with normal stores and no militia. Code: `tryAscend` in `packages/sim/src/actions/prestige.ts`.
- The Second Dawn card shows one line for it (`packages/app/src/hud/DawnCard.tsx`).

### Also live (earlier waves)

Keep interior Hall / Wall / Yard work cards and room pips, People job cards, keep-gated studies and barracks queue, Last battle card, province inspect card, faction and dawn seals, stores, hall bonus, raid mercy, save lock, security gate, lo-fi radio, primer v3, fog cloud veil, weather / season tint. Details per wave are in `CHANGELOG.md`.

## Owner machine

Two Windows clones, one per agent:

- `C:\Projects\second-crown-claude` — Claude works here.
- `C:\Projects\second-crown-gemini` — Gemini works here.

Do not point two agents at the same folder or the same files.
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.

**Rebase recipe.** Doc branches often conflict on the four doc files. During a rebase onto `origin/main` (`git fetch origin && git rebase origin/main`), on a conflict in `HANDOFF.md`, `CHANGELOG.md`, `USER-NOTES.md`, or `DEV-NOTES.md`, run `git checkout --theirs docs/HANDOFF.md docs/CHANGELOG.md docs/USER-NOTES.md docs/DEV-NOTES.md`, then `git add docs/HANDOFF.md docs/CHANGELOG.md docs/USER-NOTES.md docs/DEV-NOTES.md` and `git rebase --continue`.

## Parked (do not implement)

- Another dawn gift beyond the first-dawn stores.
- Real time: server clock, server save, shared hold. The written plan is `docs/REALTIME.md`. Phase 1 is merged: `server/clock.mjs`, and `GET /realm/:id/tick` (memory-only clock per realm id) read by `packages/app/src/game/settleOnLoad.ts` only for a shared realm. Phase 2 (save) is merged (#211): the save gate refuses every browser upload to a shared realm (409, server copy handed back), and a shared reload reads the server save and overwrites the browser cache (`packages/app/src/game/loadSaved.ts`). Phase 3 (shared hold) is merged (#212): the owner approved the rule change (ADR-011, INVARIANTS §17: a shared hold may call `packages/sim` on the server, solo play never does). `server/hold.mjs` keeps an in-memory hold per shared realm id, timed by the Phase 1 clock, takes one intent (a stamp) and applies it through the sim on the next tick boundary; routes `GET /realm/:id/hold` and `POST /realm/:id/intent`. No realm is marked shared (server `SHARED_SAVES` and `SHARED_REALMS` are empty, app `sharedRealmId` returns null), so the server never loads the sim, a solo load joins no hold, and the live game is unchanged. **Opt-in join** is on branch `wave/realtime-join` (**not merged**): `server/join.mjs` and `POST /join` let a signed-in player type a short id and join the in-memory hold `join-<id>`; two browsers on the same id see one tick and each other's stamps. App control: `packages/app/src/JoinHoldCard.tsx` in the Cloud panel (Join hold / Stamp / Leave). It never touches the solo save or offline catch-up; a blank id does not join; no full state is accepted.

## Verify

```
npm test
npm run test -w @second-crown/render
node --test server/clock.test.mjs server/savegate.test.mjs server/hold.test.mjs server/join.test.mjs
npm run build -w @second-crown/app
```

Deploy (on Oracle over SSH):

```bash
cd ~/second-crown && git pull && npm test && npm run build -w @second-crown/app && pm2 restart sc-cloud
```

## Invariants that still bite

- Sim is 10 Hz, deterministic, offline catch-up. No sim on `server/` for solo play; a shared hold may call `packages/sim` (ADR-011), never copy its rules.
- Presentation branches must leave `git diff main -- packages/sim server` empty.
- HUD chrome palette: `<html data-chrome>` via `ThemeDock.tsx`, key `sc-chrome`. Buttons default dark from `theme.css`.
- World atlas pans by drag. 6px slop keeps clicks working. Recenter resets.
- Column clashes use the column, not the home army.
- One study at a time. Academy only shortens *new* studies.
- Treat wounded is 4 food + 50 ticks → 1 militia.
- Wall HP already includes gate HP; do not add them twice in copy.
- Vision ≠ rim tower count. See DEV-NOTES.

## Docs map

| File | Who |
|---|---|
| USER-NOTES.md | playtesters |
| CHANGELOG.md | every merge crumb |
| DEV-NOTES.md | footguns |
| ROADMAP.md | next |
| PROGRESS.md | eras |
| INVARIANTS.md | law |
| CONCEPT-BIBLE.md | fantasy |
| obsidian/ | vault seed |
