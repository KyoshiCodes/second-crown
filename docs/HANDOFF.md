# Handoff (2026-10-09)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · Oracle, `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Merged through PR **#224**. Waiting: `wave/hold-write` (**not merged**, see Hold writes before it spends below).

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
- Real time: server clock, server save, shared hold. The written plan is `docs/REALTIME.md`. Phase 1 is merged: `server/clock.mjs`, and `GET /realm/:id/tick` (memory-only clock per realm id) read by `packages/app/src/game/settleOnLoad.ts` only for a shared realm. Phase 2 (save) is merged (#211): the save gate refuses every browser upload to a shared realm (409, server copy handed back), and a shared reload reads the server save and overwrites the browser cache (`packages/app/src/game/loadSaved.ts`). Phase 3 (shared hold) is merged (#212): the owner approved the rule change (ADR-011, INVARIANTS §17: a shared hold may call `packages/sim` on the server, solo play never does). `server/hold.mjs` keeps an in-memory hold per shared realm id, timed by the Phase 1 clock, takes one intent (a stamp) and applies it through the sim on the next tick boundary; routes `GET /realm/:id/hold` and `POST /realm/:id/intent`. No realm is marked shared (server `SHARED_SAVES` and `SHARED_REALMS` are empty, app `sharedRealmId` returns null), so the server never loads the sim, a solo load joins no hold, and the live game is unchanged. **Opt-in join** is merged (#213): `server/join.mjs` and `POST /join` let a signed-in player type a short id and join the in-memory hold `join-<id>`; two browsers on the same id see one tick and each other's stamps. App control: `packages/app/src/JoinHoldCard.tsx` in the Cloud panel (Join hold / Stamp / Leave). It never touches the solo save or offline catch-up; a blank id does not join; no full state is accepted. **Playable hold** is merged (#214): a joined hold is the sim's new game with starter buildings (fresh, never a client save), settled to the Phase 1 clock on each read; the view adds food, wood, stone, gold, militia (and militia still training). New intent `{ "type": "train" }` calls the sim's `tryTrain` for one militia at the settled tick; a hold that cannot pay gets 409. The card shows the five numbers and a **Train militia** button. Leave still drops only the view; the hold is never written to the local save. A server restart cleared every hold (until the keep branch below). **Build farm** is merged (#215): new intent `{ "type": "build" }` places one farm on the first tile the sim's `canPlaceType` allows, through the sim's `tryBuild` (the same call as a solo build: cost, free tile, work-plot cap). 409 `NO_TILE` when there is no tile, 409 `CANNOT_BUILD` when the hold cannot pay; nothing is spent either way. The view adds `farms`; the card shows **Farms** and a **Build farm** button next to Train militia. Note: a fresh hold starts with both work plots used (farm + lumber camp, cap 2, same as a solo new game), so Build farm is refused as no tile until the hold has a finished cottage or keep. **Build cottage** is merged (#216): new intent `{ "type": "cottage" }` places one cottage on the first tile the sim's `canPlaceType` allows, through the same `tryBuild` (cost 8 wood + 4 food, 25 ticks, open plot; a cottage is not a work plot). 409 `NO_COTTAGE_TILE` or `CANNOT_COTTAGE`; nothing is spent either way. Once the sim finishes it, its `workPlotCap` rises by 2, so a farm refused as no tile can land. The view adds `cottages`; the card shows **Cottages** and a **Build cottage** button next to Build farm. No keep intent yet. **Hold keep** is merged (#217): `server/keep.mjs` writes each shared hold to `<SAVES>/<realmId>.json` (the sim's `serializeState`, plus `savedAt` and pending stamps) after every train / farm / cottage / stamp and after settled ticks (at most every 5 s). After a process restart the next join on that id loads it with `sim.deserializeState` instead of a new game, and the Phase 1 clock resumes at the kept tick plus the down time, capped at 30 days like solo offline catch-up (`realmclock.mjs` `resume`). A different id never loads it (file name and the `realmId` inside must match). Solo saves are never read, written, or marked shared by it; `applyOfflineProgress` is untouched. No new button; the card copy says the hold survives a restart. **Build lumber camp** is merged (#218): new intent `{ "type": "lumber" }` places one lumber camp on the first tile the sim's `canPlaceType` allows, through the same `tryBuild` as a solo lumber camp (cost 3 wood + 5 food, 30 ticks, open plot and a free work plot, like a farm). 409 `NO_LUMBER_TILE` or `CANNOT_LUMBER`; nothing is spent either way. A fresh hold has no free work plot, so it needs a finished cottage first. The view adds `lumberCamps` (a fresh hold shows 1, the starter camp); the card shows **Lumber camps** and a **Build lumber camp** button next to Build farm. Kept through a restart like the rest of the hold. **Hold key** is merged (#219): the first `POST /join` of an id makes the hold and answers once with a random hold key (`key`, 16 URL-safe characters). Every later join, `GET /realm/join-*/hold`, and intent (train, farm, cottage, lumber, stamp) must send it in the `X-Hold-Key` header and be signed in. A missing or wrong key is 403 `Wrong or missing hold key.`, the same answer whether or not the hold exists; nothing is spent, loaded, or made. A session (account id) that sends 5 wrong or missing keys gets 429 on every later key try until the server restarts. Only the key's SHA-256 is kept, as `keyHash` in the hold file, so a restart still asks for the same key. A different id has a different key. A hold file from before this branch has no key; the next join on that id claims it and gets a new key. The card has a **Hold key** field next to the realm id and shows a new key once with **Copy key**. Leave unchanged; the key and the hold are never written into the local save. Owner-marked realms (`SHARED_REALMS`, empty) are not keyed.

## Login nonce (merged, #220)

- A sign-in result counts only if this browser started that sign-in. Before the Discord redirect or a guest request the app makes a one-use nonce (`packages/app/src/net/login.ts`, kept in `sessionStorage`). On the way back it is checked, then discarded, match or not.
- Discord: the app goes to `/auth/discord?state=<nonce>`. The server refuses a start with no nonce (400), puts the nonce in an HttpOnly cookie and passes it to Discord as `state`. The callback is refused (400) unless `state` equals that cookie; the cookie is cleared either way (`server/nonce.mjs`). The hash back to the app carries `cloud_nonce`.
- A link with `#cloud_token=…` that this browser did not start (someone else's token, no nonce, a wrong nonce, or a nonce already used) is ignored: the hash is cleared, the current session stays, and nothing is uploaded. The Cloud panel says "Ignored a sign-in link this browser did not start."
- Not touched: solo saves are not marked shared, `applyOfflineProgress`, hold keys, the join path, and the typed **Restore code** box (a code the player pastes on purpose).

## Hold-table cap (merged, #221)

- `GET /realm/:id/tick` no longer starts a clock. It answers the running tick, or 0 when no clock runs (`realmclock.mjs` `peek`). Only a hold that is actually joined with its key (or made by a first join) starts a clock. A stranger reading made-up ids cannot fill the clock table or block a later join.
- Per address (the socket address; forwarded headers are not trusted), memory only, per day: at most **10 new guest accounts** (`POST /guest` -> 429 `GUEST_CAP`, nothing written to `users.json`) and **3 new holds** (a first keyless join of an id nobody has used -> 429 `HOLD_CAP`). Joining, reading, or acting in a hold you already have the key for is never counted. Code: `server/cap.mjs`.
- When the 100-hold table is full, the hold idle longest (no read or intent for 15 minutes) is dropped from memory only: settled to its clock, written to its file, then forgotten with its clock. Its file stays, the same key opens it again (the clock catches up the dropped time), and a different id still cannot read it. If no hold is idle, a new hold gets 503 `The server is full. New holds are paused; a hold you already have still opens.` Without a hold store nothing is dropped.
- App: `net/hold.ts` shows the server's 429 hold-cap reason (other 429s stay "Too many wrong hold keys"); `createGuest` and the Cloud panel show the guest-cap reason.
- Not touched: solo saves are not marked shared, `applyOfflineProgress`, hold keys, the login nonce, no client state as a realm, no rules in `server/`.

## Crash guard (merged, #222)

- A bad percent-escape in an address (for example `/profile/%E0%A4%A` or `/%zz`) used to throw out of `decodeURIComponent` inside the async handler. That rejection was unhandled, and Node ends the process on an unhandled rejection, so one bad link could stop `sc-cloud`. It now answers **400** `That address is not readable.` A request URL `new URL` cannot parse also answers 400.
- `server/guard.mjs`: `safeDecode(s)` (null instead of a throw) and `guardRoute(route)`. `index.mjs` wraps the whole handler in `guardRoute`: any throw or rejection is logged and answered **500** `The server hit a snag. Try again.`, or the half-sent answer is cut. The process keeps running.
- `index.mjs` has no bare `decodeURIComponent` left (asserted in `guard.test.mjs`).
- Not touched: solo saves are not marked shared, `applyOfflineProgress`, hold keys, the login nonce, the hold and guest caps, no client state as a realm, no rules in `server/`. No app change.

## Catch-up matches ticks (merged, #223)

- `TickEngine.settleTicks` (offline catch-up for solo, and the shared hold's `advance`) used to batch every quiet stretch in one analytic step. Two places made that wrong: starvation took **one** militia per batch instead of one per tick, and a full store clipped once per batch, so food that tick-by-tick would sit at its cap ran down (or starved) instead.
- Now each stretch is batched only as far as no unpinned store reaches its cap and food covers upkeep (`safeTicks`); the ticks across a store filling or food running out are ordinary fine ticks. A store that held still on the last fine tick (or ended it full) is pinned: the batch runs and the store is put back to that value; with food pinned and the roster still, unit counts are put back too.
- `EconomySystem` gained `economyGain(state, ticks, tithe?)`, the same totals `advanceAnalytic` adds, read-only.
- A 30-day catch-up from the starter state takes about 25 s on the owner box (was about 20 s). The 30-day cap is unchanged.
- Not touched: `applyOfflineProgress`, solo saves are not marked shared, hold keys, the login nonce, the hold and guest caps, the crash guard, no client state as a realm, no rules in `server/`. No app change.

## Repair only fixes damage (merged, #224)

- Before, the sim treated **any** unfinished player building as scarred. `listScarred` offered a building still going up (including the starter lumber camp, `completesAtTick: 30`), and `tryRepair` would finish it at once for 8 stone, skipping its timer and its completion citizen. The app hid some of this with an id/timer guess (`isScarred` in `WorkCard.tsx`), but the starter camp (id `b2`) failed that guess and showed as scarred.
- Now the sim records damage. `damageHoldBuilding` (siege blow, `march.ts`) calls `markScarred`, which adds the building id to `flags.scar_json`. `isScarred(state, b)` = still on a timer **and** in that list. `listScarred` and `tryRepair` use it, so Repair refuses a building that is only under construction and leaves its timer alone.
- `tryRepair` (still 8 stone) clears the timer and the mark and logs `{ type: "repair", issuerId: "player", payload: { buildingId } }` in `inputLog`. It does not re-run completion, so the building keeps the citizen it was hired with and its level.
- App: the guess in `WorkCard.tsx` is gone; `KingdomTab.tsx` uses the sim's `isScarred`. `WarRoom.tsx` already reads `listScarred`. No Repair button was added to the shared hold.
- A save scarred before this branch has no mark: that building is shown as under construction and heals on its own 40-tick timer.
- Not touched: solo saves are not marked shared, `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, no client state as a realm, no rules in `server/`.

## Hold writes before it spends (branch `wave/hold-write`, **not merged**)

- Before, a hold intent (train, build, cottage, lumber, stamp) changed the live hold in memory first and wrote it to disk after. If that write failed (full or read-only disk), the stores were already spent in memory but not on disk: the player saw an error, and a retry spent again. A restart then brought back the old file.
- Now `commit` in `server/hold.mjs` copies the hold (`deserializeState(serializeState(...))` plus a copy of the pending list), runs the intent through the sim on the copy, writes the copy, and only then makes it the live hold (new `TickEngine` on the copy). A write that fails answers 503 `NOT_SAVED` ("The hold could not be saved. Nothing was spent; try again."); the live hold, its stores, and its kept file stay as they were, so the same intent can be sent again and spends once. A normal refusal (409 / 429) throws before the write, so it spends nothing and writes nothing.
- The first-join key claim goes through the same `commit`, so a failed first write leaves no key behind and the id can be joined again.
- A settled-ticks-only write that fails is skipped and tried on the next read (it used to throw out of the read). A hold leaving memory (`dropIdle`) still must be written, or it stays in memory.
- Not touched: solo saves are not marked shared, `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair (no Repair on the hold), no client state as a realm, no rules in `server/`. No app change.

## Verify

```
npm test
npm run test -w @second-crown/render
node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/nonce.test.mjs server/keep.test.mjs server/realmclock.test.mjs server/hold.test.mjs server/join.test.mjs server/play.test.mjs server/build.test.mjs server/cottage.test.mjs server/lumber.test.mjs server/cap.test.mjs server/guard.test.mjs server/write.test.mjs
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
