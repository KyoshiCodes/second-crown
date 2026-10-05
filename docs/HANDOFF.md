# Handoff (2026-10-04)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · Oracle, `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Merged through PR **#206**. Nothing is waiting on an unmerged wave.

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

**Rebase recipe.** Doc branches often conflict on the four doc files. Run `git fetch origin && git rebase origin/main`; on each conflict in `HANDOFF.md`, `CHANGELOG.md`, `USER-NOTES.md`, or `DEV-NOTES.md`, take main's copy (`git checkout --ours <file>`; during a rebase "ours" is main and "theirs" is your branch), re-add your own entry on top by hand, `git add` and `git rebase --continue`, then `git push --force-with-lease`.

## Parked (do not implement)

- Another dawn gift beyond the first-dawn stores.
- A real-time spec: server clock, server save, shared hold. Needs a written spec first and must not put the sim on the server.

## Verify

```
npm test
npm run test -w @second-crown/render
npm run build -w @second-crown/app
```

Deploy (on Oracle over SSH):

```bash
cd ~/second-crown && git pull && npm test && npm run build -w @second-crown/app && pm2 restart sc-cloud
```

## Invariants that still bite

- Sim is 10 Hz, deterministic, offline catch-up. No sim on `server/`.
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
