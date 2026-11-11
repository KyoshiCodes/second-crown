# Handoff (2026-11-11)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · Oracle, `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.

`main` is at `13135c3` (living scroll glyphs under quest cards). The living-layer wave is **fully merged**: every `wave/*-living` and `bakeoff/gemini-*-living` branch is on `main`. There is no waiting list for HUD glyphs.
Also waiting: `bakeoff/gemini-board-light` (**not merged**, richer lighting and atmosphere pass on the isometric board, see below). Per-slice detail lives in `CHANGELOG.md` (newest first) and `DEV-NOTES.md`; older versions of this file are in git history.
Also waiting: `wave/research-tree` (**not merged**, pushed, no PR). Branch was re-cut from `main` on 2026-11-11 (the six tier II studies it used to carry are already on `main`). It now holds one app-only slice: a Cost row and a shorter Study button on every lectern study card, see "Research cards" below. On that branch: sim **362**, app **927**, server **159**, app build clean.
Also waiting: `wave/infirmary-heal` (**not merged**, pushed, no PR). Infirmary auto-heal, sim + Army tab line, see "Infirmary auto-heal" below. On that branch: sim **340**, app **855**, server **158**, app build clean.
Also waiting: `bakeoff/gemini-research-tree` (**not merged**, living glyphs and visual flair for the new research studies, see below). On this branch: sim **332**, app **852**, server **158**, app build clean.
Also waiting: `bakeoff/gemini-infirmary` (**not merged**, subtle living heal glow and bandage pips on wounded unit chips when Infirmary is active, see below). On this branch: sim **340**, app **862**, server **158**, app build clean.
Also waiting: `bakeoff/gemini-culture-units` (**not merged**, distinct 28px living chips for each culture's unique unit, see below). On this branch: sim **340**, app **872**, server **158**, app build clean.
Fixed on `main` (2026-11-11): `RealmCard` takes `gift?: GiftOffer` again and `WorldPanel` crown cards show the `GiftLine` tribute line with a gated Gift button; the gift pip slice had dropped both and broken the app build. Gift pip kept. Now: sim **362**, app **894**, server **158**, app build clean.

Also waiting: `bakeoff/gemini-diplomacy-gifts` (**not merged**, living gift or tribute pip on diplomacy realm cards when available or just sent, see below). On this branch: sim **356**, app **885**, server **158**, app build clean.
Also waiting: `bakeoff/gemini-season-claim` (**not merged**, living seasonal crest or weather pip on season status line, see below). On this branch: sim **362**, app **907**, server **158**, app build clean.

Also waiting: `wave/season-claim` (**not merged**, pushed, no PR). Season status line with a Claim button on the Kingdom tab, app only, see "Season line" under Feedback below. On that branch: sim **362**, app **905**, server **158**, app build clean.

Tests on `main` at the last slice: sim **323**, app **828**, server **158**, app build clean.

## Live now

### Core systems

- **Kernel.** 10 Hz deterministic sim, offline catch-up (capped at 30 days), IndexedDB + cloud save, Discord login with a one-use nonce, guest ids, save gate, static file gate, crash guard.
- **Hold.** Buildings, citizens and jobs, housing, keep upgrades and keep interior rooms, storage, vault, walls and gate, repair.
- **Host.** Train queue with x1/x5/x10 batches, barracks / stables / range / workshop, upkeep, mercs, champion, wounded + manual infirmary treat.
- **Board war.** Marches, column clashes, camps, outposts and flags, garrisons, hold storm, sally, incoming raids.
- **Map economy.** Gather nodes with stock, scouts and fog, seasons, weather (slows marches).
  - **Living seasonal crest and weather pips (bakeoff/gemini-season-claim, not merged).** Adds bespoke living seasonal crest/weather pips (`SeasonPip` / `SeasonalCrestPip` / `SeasonWeatherPip`) and `SeasonStatusLine` that adapt to the current season across Spring (leafy sprout & blossom, dewdrop glint, drifting pollen), Summer (high sun disc, solar flare, heat shimmer), Autumn (lobed harvest leaf with acorns, gale motes, harvest star), and Winter (6-point crystalline snowflake, diamond core, snow flurries). Integrated into the Crown Tab Season Court card, ProvinceInspect season line, and Kingdom summary line. All decorative layers strictly `pointer-events: none !important;`, softened in `hud/living-glyph-soften.css` with reduced-motion support.
- **Infirmary auto-heal (wave/infirmary-heal, not merged).** A finished player Infirmary with at least one worker posted on it heals by itself: every 100 ticks (10s) one wounded in ten, rounded up, comes back as militia, free. No worker or a scarred / unfinished Infirmary: no healing. Manual Treat is unchanged and still works beside it. Army tab Wounded card shows **Healing · N wounded · next M in Xs**, or **Not healing · no worker at the Infirmary**. Sim change is small and pure (`systems/ward.ts`: `infirmaryStaffed`, `autoHealAmount`, `autoHealActive`, `autoHealTicksLeft`, `autoHealTick`, run from `WardSystem`); no save schema change. Numbers are first-pass, not playtested.
  - **Living heal glow and bandage pips (bakeoff/gemini-infirmary, not merged).** Adds bespoke crossed-linen bandage pips (`BandagePip` / `WoundedChip` / `WoundedUnitChip`) and reactive living heal glow (emerald breath glow, rotating dashed aura ring, rising restorative motes) on wounded unit chips and the Army tab Wounded card when the Infirmary is actively healing. When resting calmly, wounded chips show an amber/red field-dressing cross; when the Infirmary is active, they pulse with an emerald heal glow. All decorative layers isolated, `pointer-events: none`, and softened in `hud/living-glyph-soften.css` with `prefers-reduced-motion` guards.
- **Crown.** Lectern studies with Academy discount, market stalls, royal decrees, events and quests, diplomacy (realms, pacts, truce, gifts), Ledger of Crowns with save/load audit lines.
  - **Living diplomacy gift and tribute pips (bakeoff/gemini-diplomacy-gifts, not merged).** Adds bespoke gilded diplomatic tribute coffer pips (`GiftPip` / `TributePip`) and top-corner card badges (`.sc-realm-gift-badge`) on diplomacy realm cards in WarRoom and WorldPanel when tribute is available (player holds 15 gold) or was just sent (celebration ripple ping, ascending golden motes, and radiant drop-shadow). Embedded directly into tribute action buttons and diplomacy cards. All decorative layers strictly `pointer-events: none !important;` and softened in `hud/living-glyph-soften.css` with `@media (prefers-reduced-motion: reduce)` fallbacks.
- **Research cards (wave/research-tree, not merged).** Every lectern study card (Keep → Lectern, and the primer banner) now reads top to bottom: name, progress, bonus, **Cost**, Study button. The Cost row has one chip per resource (red when the stores are short), and one plain line: "Short 13 food, 4 wood.", "Stores cover it. Ready to study.", "Stores cover it. Lectern is busy with X.", or "Paid." on a study that is underway or known. The Study button label is now just "Study husbandry (14s)"; cost and hall names moved out of it. App only (`ResearchCost.tsx`, `ResearchBar.tsx`, `research-tree.css`). No research math changed; `tryStartResearch` still decides and spends. Not opened in a browser yet.
- **Research tree (on `main`).** Six tier II studies on the lectern, each needing one tier I study plus Keep II or III: Crop rotation (Husbandry, +10% food), Timber framing (Forestry, +10% wood), Fortification (Masonry, +10% stone and +24 wall HP), Supply trains (Logistics, +100 warehouse and +1 column up to the Keep limit), Cartography (Surveying, +1 vision and scouting 4 gold cheaper), Quartermastery (Drill, training 8% cheaper). Lectern shows **I First studies** / **II Deeper studies**; Study and Cancel unchanged. Sim change is small and pure (`systems/research.ts` plus one-line hooks in `storage`, `labor`, `fog`, `train`); no save schema change. Numbers are first-pass, not playtested.
  - **Living flair (bakeoff/gemini-research-tree, not merged).** Adds bespoke living glyphs, corner watermarks, and tier II link flares for all six tier II studies across agronomy, masonry, cartography, and tactics (16 distinct emblems across the lectern). All decorative layers isolated, `pointer-events: none`, and softened in `hud/living-glyph-soften.css`.
- **Cultures.** Ten cultures in the picker; five carry a unit and an edge (Mist / Ranger, Glen / Banner, Salt / Outrider, Fen / Warden, Peak / Lancer). First Second Dawn gives +1 militia, +20 food, +10 wood, once.
  - **Living unique unit chips (bakeoff/gemini-culture-units, not merged).** Adds distinct 28px living chips (`CultureUnitChip`, `RangerChip`, `BannerChip`, `OutriderChip`, `WardenChip`, `LancerChip`) for the five cultures with unique martial units (Mist Reach / Ranger, Glen Holds / Banner, Salt Reaches / Outrider, Fen Steads / Warden, Peak Holds / Lancer). Each chip features bespoke SVG vector heraldry, breathing aura glow, ambient motion (mist wisps, pennant flutter, dust drift, reed sway, alpine frost drift), and metallic glint twinkle. Mounted in the Culture Picker alongside unique unit lines, in the Balance Notes culture roster breakdown, and reusable across host/army displays. All decorative layers isolated, strictly `pointer-events: none !important;`, and softened in `hud/living-glyph-soften.css` with `@media (prefers-reduced-motion: reduce)` fallbacks.
- **Shared hold (opt-in).** Cloud panel **Join hold** card: hold key, train militia, build farm / cottage / lumber camp, stamps, intent log, leave. The server runs `packages/sim` only for a joined hold (ADR-011). Holds survive a restart. No owner-marked shared realm exists; solo play never touches the server sim.
- **Board presentation.** Isometric 12×8 diamond board with terrain tiles, roads and traffic, fog edge, keeps, march paths and meeples, unit labels, node piles, outpost / camp marks, selection rim, hover tooltip, day/night with sun and moon, weather, static tile cache. Tabs lazy-load in split chunks.
- **Board lighting and atmosphere pass (bakeoff/gemini-board-light, not merged).** Richer time-of-day lighting and atmosphere pass on the isometric board (exported via `BoardLiving` / `BoardLight` in `packages/app/src/BoardLiving.tsx`):
  - Sky horizon glow and directional celestial beams across dawn, day, dusk, night.
  - Sunward specular rims and leeward bevel shadows on seen terrain tiles.
  - Foundation occlusion ground shadows under keeps and resource nodes.
  - Hearth lantern sparks at keep windows and campfire glow blooms at camps (illuminated at dusk and night).
  - All decorative layers isolated, `pointer-events: none`, and softened in `hud/living-glyph-soften.css` with `prefers-reduced-motion` guards.
- **Feedback.** Action confirmation flash and sound, lo-fi radio, balance notes panel, pace lines (research, market, wall, vision, upkeep, training, academy), hint lines (research, market, decree, age, culture).
- **Season line (wave/season-claim, not merged).** Kingdom tab, under the hold strip: **Season · Spring · 0.6 days left (200s) · season court ready: +40 food** with a **Claim** button; after claiming the button goes and it reads **season court claimed, next in Summer**. App only (`SeasonClaimLine.tsx`, `season-claim-line.css`): it calls the existing sim `tryClaimSeason` / `seasonClaimed` / `seasonBoonPreview`, the same ones the Crown tab Season court card uses (that card is unchanged). No sim, server, or `theme.css` edits. Known oddity, not changed: a season is 2000 ticks and a game day is 3600, so a whole season is 0.6 of a day and the line always reads under one day.

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
3. **Infirmary auto-heal.** Built on `wave/infirmary-heal` (owner asked for it), waiting for merge. After merge: playtest the pace (1 in 10 every 10s, free) against manual Treat.

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
- Auto-heal (wave/infirmary-heal) fires only on ticks that are a multiple of 100, as a `WardSystem` event, never as a per-tick step. That keeps a batch settle equal to tick by tick.
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
