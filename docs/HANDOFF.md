# Handoff (2026-11-10)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · Oracle, `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.

`main` is at `13135c3` (living scroll glyphs under quest cards). The living-layer wave is **fully merged**: every `wave/*-living` and `bakeoff/gemini-*-living` branch is on `main`. There is no waiting list for HUD glyphs.
Also waiting: `bakeoff/gemini-board-light` (**not merged**, richer lighting and atmosphere pass on the isometric board, see below). Per-slice detail lives in `CHANGELOG.md` (newest first) and `DEV-NOTES.md`; older versions of this file are in git history.

Tests on `main` at the last slice: sim **323**, app **828**, server **158**, app build clean.

## Live now

### Core systems

- **Kernel.** 10 Hz deterministic sim, offline catch-up (capped at 30 days), IndexedDB + cloud save, Discord login with a one-use nonce, guest ids, save gate, static file gate, crash guard.
- **Hold.** Buildings, citizens and jobs, housing, keep upgrades and keep interior rooms, storage, vault, walls and gate, repair.
- **Host.** Train queue with x1/x5/x10 batches, barracks / stables / range / workshop, upkeep, mercs, champion, wounded + manual infirmary treat.
- **Board war.** Marches, column clashes, camps, outposts and flags, garrisons, hold storm, sally, incoming raids.
- **Map economy.** Gather nodes with stock, scouts and fog, seasons, weather (slows marches).
- **Crown.** Lectern studies with Academy discount, market stalls, royal decrees, events and quests, diplomacy (realms, pacts, truce, gifts), Ledger of Crowns with save/load audit lines.
- **Cultures.** Ten cultures in the picker; five carry a unit and an edge (Mist / Ranger, Glen / Banner, Salt / Outrider, Fen / Warden, Peak / Lancer). First Second Dawn gives +1 militia, +20 food, +10 wood, once.
- **Shared hold (opt-in).** Cloud panel **Join hold** card: hold key, train militia, build farm / cottage / lumber camp, stamps, intent log, leave. The server runs `packages/sim` only for a joined hold (ADR-011). Holds survive a restart. No owner-marked shared realm exists; solo play never touches the server sim.
- **Board presentation.** Isometric 12×8 diamond board with terrain tiles, roads and traffic, fog edge, keeps, march paths and meeples, unit labels, node piles, outpost / camp marks, selection rim, hover tooltip, day/night with sun and moon, weather, static tile cache. Tabs lazy-load in split chunks.
- **Board lighting and atmosphere pass (bakeoff/gemini-board-light, not merged).** Richer time-of-day lighting and atmosphere pass on the isometric board (exported via `BoardLiving` / `BoardLight` in `packages/app/src/BoardLiving.tsx`):
  - Sky horizon glow and directional celestial beams across dawn, day, dusk, night.
  - Sunward specular rims and leeward bevel shadows on seen terrain tiles.
  - Foundation occlusion ground shadows under keeps and resource nodes.
  - Hearth lantern sparks at keep windows and campfire glow blooms at camps (illuminated at dusk and night).
  - All decorative layers isolated, `pointer-events: none`, and softened in `hud/living-glyph-soften.css` with `prefers-reduced-motion` guards.
- **Feedback.** Action confirmation flash and sound, lo-fi radio, balance notes panel, pace lines (research, market, wall, vision, upkeep, training, academy), hint lines (research, market, decree, age, culture).

### Living HUD layers (all on `main`)

Each card below has two layers: stacked **living status rows** (Claude, `*LivingRows` / `*LivingCard`) and a **living glyph strip + corner watermark** (Gemini, `*LivingGlyph`). All are app-only, read existing rows, add no game math, use `pointer-events: none` on decoration, and honour reduced motion. Shared softening lives in `packages/app/src/hud/living-glyph-soften.css`.

| Card | Where the player sees it | Rows |
|---|---|---|
| Resource | strip above the tabs | Name / Stock / Income |
| Building (Standing works) | Kingdom tab | Name / Level / Staffed |
| People / jobs | Kingdom tab | job status |
| Vault | Kingdom tab | Name / Stock / Safety |
| Flags and outposts | Kingdom tab | Name / Camp / Flag / Stock |
| Market stall | Kingdom tab | stall status |
| Unit | Army tab | Name / Power / Cost |
| War Room force and garrison camp | War tab | Name / Flag / Stock |
| Diplomacy realm and pact | War tab, World tab | Name / Stance / Pact / Power |
| Research (study) | Academy / lectern | Name / Progress / Bonus |
| Decree | Crown tab | Name / Duration / Effect |
| Event | Events panel | Name / Omen / Duration |
| Quest | Quests panel | Name / Progress / Reward |
| Ledger of Crowns | Crown tab | Time / Entry |
| Atlas province | Overworld Atlas | Name / Terrain / Owner |
| Province node | ProvinceInspect | Name / Stock / Pile |
| Joined hold | Cloud panel | hold status, store, actions, key, log |

Not living (left as they are on purpose): Keep interior room cards, Court cards.

## Next recommended slices

1. **Playtest notes + balance pass.** Owner plays a full session on the live build; log what feels slow, confusing or pointless in `USER-NOTES.md`. Then tune numbers (five culture edges, gather vs farm income). Balance changes touch `packages/sim`: ask the owner first, small constants only.
2. **Board visual pass.** One readability sweep of the diamond board (`packages/render` + atlas CSS): layer order, contrast under weather and fog, label clutter. No new marks.
3. **Infirmary auto-heal.** Needs a short written spec first (treat is manual today: 4 food + 50 ticks → 1 militia). Sim change, owner approval required.

After those, see `ROADMAP.md` (research expansion, audio, performance).

**Stop doing:** another living row, glyph or one-line hint. That wave is complete.

## Owner machine

Two Windows clones, one per agent:

- `C:\Projects\second-crown-claude` — Claude works here.
- `C:\Projects\second-crown-gemini` — Gemini works here.

Do not point two agents at the same folder or the same files.
Always `git fetch` before checkout. If `docs/HANDOFF.md` is dirty: `git checkout -- docs/HANDOFF.md`.

**Rebase recipe.** Doc branches often conflict on the four doc files. During a rebase onto `origin/main` (`git fetch origin && git rebase origin/main`), on a conflict in `HANDOFF.md`, `CHANGELOG.md`, `USER-NOTES.md`, or `DEV-NOTES.md`, run `git checkout --theirs docs/HANDOFF.md docs/CHANGELOG.md docs/USER-NOTES.md docs/DEV-NOTES.md`, then `git add docs/HANDOFF.md docs/CHANGELOG.md docs/USER-NOTES.md docs/DEV-NOTES.md` and `git rebase --continue`.

## Parked (do not implement)

- Another dawn gift beyond the first-dawn stores.
- An owner-marked shared realm (`SHARED_SAVES` / `SHARED_REALMS` stay empty). The opt-in join hold is live; the plan and phase history are in `docs/REALTIME.md` and `CHANGELOG.md`.
- New shared-hold intents beyond train / farm / cottage / lumber / stamp.

## Verify

```
npm test
npm run test -w @second-crown/render
npm run build -w @second-crown/app
```

`npm test` runs the sim, app, and server tests (`npm run test:server` runs only the server ones). No separate `node --test` line is needed.

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
