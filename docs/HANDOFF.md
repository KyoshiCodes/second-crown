# Handoff (2026-10-14)

Read `AGENTS.md` then this file.

## Live

`http://129.153.17.72:8787/` · Oracle, `pm2 restart sc-cloud` · repo `KyoshiCodes/second-crown` `main`.
Merged through PR **#283** (moving sun/moon and tile-plane weather, #283; slower day cycle, #282; day/night cycle and weather atmosphere on diamond, #281; deeper weather and day/night cycle, #280; living atmosphere on diamond, #279; weather slows marches, #278; fog edge mark on diamond, #277; fog edge line, #276; staffed mark on diamond, #275; staffed line, #274; building mark on diamond, #273; building line, #272; hold mark on diamond, #271; hold line, #270; owner mark on diamond, #269; owner line, #268; gather mark on diamond, #267; gather line, #266; scout mark on diamond, #265; scout line, #264; garrison mark on diamond, #263; garrison line, #262; season mark on diamond, #261; season line, #260; outpost and camp marks on diamond, #259; outpost line, #258; trail mark on diamond, #257; trail line, #256; incoming mark on diamond, #255; incoming line, #254; clash mark on diamond, #253; clash line, #252; stock badge on diamond, #251; stock badge line, #250; plain meadow on diamond, #249; plain line, #248; waste crag on diamond, #247; waste line, #246; hill rise on diamond, #245; hill line, #244; audio MIME, #243; mountain on diamond, #242; peak line, #241; trees on diamond, #240; wood line, #239; shore tile, #238; shore line, #237; ruins tile, #236). Waiting: `bakeoff/gemini-board-cache` (**not merged**, see Static board tile cache below).

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

## Hold writes before it spends (PR #225, merged)

- Before, a hold intent (train, build, cottage, lumber, stamp) changed the live hold in memory first and wrote it to disk after. If that write failed (full or read-only disk), the stores were already spent in memory but not on disk: the player saw an error, and a retry spent again. A restart then brought back the old file.
- Now `commit` in `server/hold.mjs` copies the hold (`deserializeState(serializeState(...))` plus a copy of the pending list), runs the intent through the sim on the copy, writes the copy, and only then makes it the live hold (new `TickEngine` on the copy). A write that fails answers 503 `NOT_SAVED` ("The hold could not be saved. Nothing was spent; try again."); the live hold, its stores, and its kept file stay as they were, so the same intent can be sent again and spends once. A normal refusal (409 / 429) throws before the write, so it spends nothing and writes nothing.
- The first-join key claim goes through the same `commit`, so a failed first write leaves no key behind and the id can be joined again.
- A settled-ticks-only write that fails is skipped and tried on the next read (it used to throw out of the read). A hold leaving memory (`dropIdle`) still must be written, or it stays in memory.
- Not touched: solo saves are not marked shared, `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair (no Repair on the hold), no client state as a realm, no rules in `server/`. No app change.

## A reload keeps an empty army (PR #226, merged)

- Before, every load (`deserializeState` -> `ensureWorldStubs`) refilled an empty army or worker list: the rival got 15 militia if it had no units, an NPC realm with no units got its starting troops, and an empty citizen list was reseeded with one worker per finished building. A solo reload brought back troops and workers you had dismissed or lost. A fresh shared hold (starter farm finished, lumber camp still building, no citizens yet) gained a farm worker on every restart, and on every hold action, since `commit` round-trips the state too.
- Now `ensureWorldStubs` notes whether `units` and `citizens` were present in the save before it defaults them. The old fill runs only when the field is missing: rival militia and NPC troops when `units` is missing, worker seeding when `citizens` is missing. A present, empty list stays empty. `seedWorldActors(state, { fillUnits })` still gives a realm it adds for the first time its starting army.
- Not touched: solo saves are not marked shared, `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, no client state as a realm, no rules in `server/`. No app change.

## Second Dawn clears unfinished jobs (PR #227, merged)

- Before, `tryAscend` wiped stores, buildings, player units and wars but left the job queues in `flags`. A militia in training, a wounded soldier being treated, a march, a gather column or a posted garrison could hand troops to the new crown after the dawn. An upgrade queued on the dawn farm (`b_prestige_farm`) finished on the next crown's farm of the same id.
- Now `clearRunJobs` in `packages/sim/src/actions/prestige.ts` runs inside `tryAscend`: player training (`training_json`), all treating (`heal_json`) and the wounded count (`wounded_player`), all upgrades (`upgrades_json`), player marches (`marches_json`), player gathers (`gathers_json`), and garrisons on player land (`garrisons_json`) are dropped, with no refund. Rival and NPC jobs stay. Kept: culture, guild, achievements, dawn count and its production bonus, doctrine choice, and the once-per-crown first-dawn gift (`dawn_gift`, does not stack).
- App: `DawnCard` does not draw the Ascend button when `sharedRealmId(state)` is set ("A shared hold has no Second Dawn."). No realm is shared yet, so the solo card is unchanged apart from one line naming what the dawn clears.
- Not touched: solo saves are not marked shared, `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, the empty-list reload, no client state as a realm, no rules in `server/`.

## Pull save waits for reload (PR #228, merged)

- Before, Pull save wrote the cloud copy over the browser autosave while the crown on screen kept running. The running crown autosaves every 50 ticks, so the pulled copy could be overwritten before the reload, and what loaded depended on timing.
- Now Pull save (`pullCloudCopy` in `packages/app/src/game/pullCloud.ts`) fetches the cloud copy, checks it parses (`deserializeState`), and stores it in its own IndexedDB slot (`pulled`). The crown on screen and its autosave are not touched. On the next page load `startSave` takes the pulled copy once: it becomes the autosave and the slot is cleared. A failed pull, or a copy that does not parse, writes nothing. The status still says "Pulled cloud save. Reload the page to play it."
- The "Load cloud" choice after a push conflict uses the same slot and then reloads.
- Not touched: solo saves are not marked shared, `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, the empty-list reload, Second Dawn, no client state as a realm, no rules in `server/`.

## Guest ids never repeat (PR #229, merged)

- Before, `POST /guest` made `guest_` + 3 random bytes (about 16.7 million ids) and wrote `users[id]` without checking. A repeat replaced the old account's token, so the new guest opened the old guest's cloud save and the old guest was locked out.
- Now `server/guestid.mjs` makes `guest_` + 16 random bytes (32 hex). `claimGuestId` refuses an id already in `users.json` or with a file in `saves/`; it draws again up to 3 times, then `/guest` answers 503 (`GUEST_ID_TAKEN`) and writes nothing. An existing account is never written over.
- Old guests keep their short ids and tokens; a token still opens only its own save. Discord login is unchanged (`discord_<id>`).
- Not touched: solo saves are not marked shared, `applyOfflineProgress`, hold keys, the login nonce, the hold caps (the guest cap still runs first), the crash guard, the catch-up match, Repair, the hold write, the empty-list reload, Second Dawn, Pull save, no client state as a realm, no rules in `server/`. No app or sim change.

## Server checks in npm test (PR #230, merged)

- Before, root `npm test` ran only the sim and app vitest suites. The server tests (`server/*.test.mjs`, node:test) ran only from a long hand-typed `node --test ...` line, so a deploy (`git pull && npm test && ...`) never ran them.
- Now root `npm test` ends with `npm run test:server` = `node server/test.mjs`. That runner lists every `server/*.test.mjs` file, prints their names, and runs them all in one `node --test --test-reporter=spec` call: clock, save gate, key, cap, guest id, hold write, and the rest (19 files, 144 tests today). A failing server test exits non-zero, so `npm test` fails and the deploy line stops before `pm2 restart`. A new `server/*.test.mjs` is picked up with no edit.
- The server tests start `index.mjs` on a free port with a temp `DATA_DIR`, so running them on Oracle does not touch `sc-cloud` (port 8787) or its saves.
- Not touched: no test was changed or skipped; solo saves are not marked shared, `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, the empty-list reload, Second Dawn, Pull save, guest ids, no client state as a realm, no rules in `server/`. No app, sim, or server code change.

## Shared-hold sim load (PR #231, merged)

- `loadSimFromSource` in `server/hold.mjs` loads `packages/sim` for a shared hold through Vite's `runnerImport`. The brief said Vite 8 does not export it. Checked here: Vite 8.3.0 (installed) and 8.3.4 (current `latest`) both still export it, and all 144 server tests passed on `main` before this change. It would break only on an install whose Vite has no `runnerImport` (Vites before 6.1). `package-lock.json` is not committed, so the Oracle box could have a different Vite from this machine.
- Now: if the installed Vite has `runnerImport`, it is used as before. If not, the loader starts a short-lived Vite server in middleware mode (`createServer`, no config file, no HMR, no websocket), loads the sim with `ssrLoadModule`, and closes the server. It is the same export (`loadSimFromSource()`). An optional `vite` argument exists only so the tests can make it take the fallback.
- A solo save still never reaches this loader: a realm that is not shared gets no hold and loads no sim.
- Not touched: solo saves are not marked shared, `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, the empty-list reload, Second Dawn, Pull save, guest ids, no client state as a realm, no rules in `server/`. No app or sim change.

## Sim clock (PR #232, merged)

- `packages/sim` no longer reads `Date.now()` anywhere. Before, three places fell back to the wall clock when no time was passed: `applyOfflineProgress`, `createGameState` (`meta.lastRealTime`), and the daily court (`utcDay`, `dailyClaimed`, `dailyMsLeft`, `tryClaimDaily`).
- Now the caller passes the clock. `applyOfflineProgress(state, now)` and the four daily functions require `now`; a missing or non-finite `now` throws (`requireClock` in `packages/sim/src/core/clock.ts`), it never falls back to the wall clock. `createGameState` with no `now` stamps `lastRealTime: 0`.
- The app owns the wall clock: `useGameEngine` (new game, import), `settleOnLoad` default deps, and `CrownTab` pass `Date.now()`. Solo play behaves as before.
- Same seed, same actions, same tick count give the same serialized state on two machines.
- Not touched: solo saves are not marked shared, `applyOfflineProgress` catch-up math, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, the empty-list reload, Second Dawn, Pull save, guest ids, how a shared hold loads the sim, no client state as a realm, no rules in `server/`. No server change.

## Save gate (PR #233, merged)

- A client cannot send a full game state and have the server take it as the realm. A shared hold takes only an intent: `POST /join` takes exactly `{ realm }` and `POST /realm/:id/intent` takes exactly one of `stamp`, `train`, `build`, `cottage`, `lumber`. A body shaped like a solo save, like the server's own kept hold record (`kind: "shared-hold"`), or like an intent with a state glued on is refused with 400. A state over 1 KB is cut off before it is read (the connection closes). The kept hold file stays byte for byte, and the allowed intents still work afterwards.
- This was already true in `server/join.mjs` (`parseJoin`) and `server/hold.mjs` (`parseIntent`). This branch adds a live-server test that proves it end to end: `server/stategate.test.mjs`. No server code changed.
- Owner choice (2026-10-14): solo cloud saves are **not** gated to intents. `PUT /save` still takes a whole solo save through `gateSave` (shape, real-time, append-only log), because the server does not run the sim for solo play (INVARIANTS §17) and so cannot build a solo crown from intents. A kept hold record sent to `PUT /save` is refused and the solo save stays.
- A solo load does not join: a solo push and pull make no hold file, start no realm clock, and `/realm/<account id>/hold` is 404.
- Not touched: solo saves are not marked shared, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, the empty-list reload, Second Dawn, Pull save, guest ids, how a shared hold loads the sim, the sim clock, no rules in `server/`. No app or sim change.

## Static gate (PR #234, merged)

- The static file server only serves files inside the built app folder (`packages/app/dist`, or `APP_DIST`). Code: `server/static.mjs` (`createStaticServer`, `staticPath`), wired in `server/index.mjs` as `serveStatic` (the old `tryStatic` is gone).
- Refused with 403 `That file is not part of the app.` before any file is touched: a `..` segment (also `%2e%2e`, `..%2f`, `..%5c`), an absolute path (`//etc/passwd`, `/C:/...`, `/%5c%5cshare`), a NUL byte, any path that resolves outside the folder (including a sibling such as `dist-secret`, which the old `startsWith` check let through), and a symlink inside the folder that points outside it. A bad percent-escape is still 400.
- A normal page request still returns the app: `/` and `/index.html` give `index.html`, `/assets/*` give the built files, and an unknown page inside the app (for example `/realm/oak-hill`) still gets `index.html`. API routes are matched before the static server, as before.
- Tests: `server/static.test.mjs` (every escape is refused and no path outside dist is read, exists-checked, or stat'ed; normal requests succeed; a solo load does not join). `npm test`: 22 server files, 158 server tests (1 symlink test skips on Windows without symlink rights).
- Not touched: solo saves are not marked shared, no combat rules in `server/`, no full client state as the realm, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, the empty-list reload, Second Dawn, Pull save, guest ids, how a shared hold loads the sim, the sim clock, the save gate. No app or sim change.

## Ruins line (PR #235, merged)

- The province inspect card shows one line, `Ruins · no stock`, on a seen tile whose node is `ruins`. Code: `ruinsLine(seen, node)` in `packages/app/src/hud/ruinsLine.ts`, rendered in `packages/app/src/ProvinceInspect.tsx` under the Tile group (after the camp threat line). Style: `.sc-inspect-ruins` in `packages/app/src/hud/inspect-card.css`.
- Reads the existing `node` field only; no new sim field. An unseen ruins tile still shows fog and no ruins line.
- Tests: `packages/app/src/hud/ruinsLine.test.ts`.

## Ruins tile on diamond (PR #236, merged)

- The board tile only. Render only. Do not change `packages/sim` or `server/`. Do not change `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen province whose node is ruins gets a small ruined keep on the diamond: broken wall (standing left stub, crumbled lower right stub, exposed inner rubble core), fallen stone (ashlar masonry blocks and loose debris), arched entrance with fallen lintel stone, wild moss and lichen. No flag, no tent.
- Unseen tiles stay fog (`paintFogHeightVeil`). Camps, outposts, resource piles, and keeps stay as they are.
- Outpost tent and flag overlays are guarded (`p.node !== "ruins"`) so claiming or occupying a ruins province does not replace the broken keep with a camp tent or faction flag.
- All new art is rendered to the board graphics layer with pointer-events: none semantics, so tile click hit-testing (`hitTestProvince`) continues to work without disruption.
- `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty.
- Tests: `npm test` passes, `npm run test -w @second-crown/render` passes (405 tests), and `npm run build -w @second-crown/app` succeeds cleanly.

## Shore line (PR #237, merged)

- The province inspect card shows one line, `Shore · water`, on a seen tile whose terrain is `shore`. Code: `shoreLine(seen, terrain)` in `packages/app/src/hud/shoreLine.ts`, rendered in `packages/app/src/ProvinceInspect.tsx` under the Tile group (after the ruins line). Style: `.sc-inspect-shore` in `packages/app/src/hud/inspect-card.css`.
- Reads the existing `terrain` field only; no new sim field. An unseen shore tile still shows fog ("Unscouted province", "Fog hides the token.", Terrain "Unknown") and no shore line.
- Tests: `packages/app/src/hud/shoreLine.test.ts` (shows for a seen shore tile; hidden when unseen; hidden on every other terrain).
- Not touched: `packages/sim`, `server/`, `theme.css`, scout / gather / garrison / march / abandon actions, the home, ruins, camp, outpost, and resource lines.

## Shore water on diamond (PR #238, merged)

- Render only (`packages/render/src/tokens.ts`): a seen shore tile draws water on the diamond (sea shelf, wave, wet sand edge). Tests in `packages/render/src/index.test.ts`. No sim, server, or app change.

## Wood line (PR #239, merged)

- The province inspect card shows one line, `Wood · trees`, on a seen tile whose terrain is `wood`. Code: `woodLine(seen, terrain)` in `packages/app/src/hud/woodLine.ts`, rendered in `packages/app/src/ProvinceInspect.tsx` under the Tile group (after the shore line). Style: `.sc-inspect-wood` in `packages/app/src/hud/inspect-card.css`.
- Reads the existing `terrain` field only; no new sim field. An unseen wood tile still shows fog and no wood line.
- Tests: `packages/app/src/hud/woodLine.test.ts` (shows for a seen wood tile; hidden when unseen; hidden on every other terrain).
- Not touched: `packages/sim`, `server/`, `theme.css`, scout / gather / garrison / march / abandon actions, the home, ruins, shore, camp, outpost, and resource lines.

## Trees on diamond (PR #240, merged)

- Render only (`packages/render`): a seen wood tile draws a stand of pines with trunks and ground shadows on the diamond. No sim, server, or app change.

## Peak line (PR #241, merged)

- The province inspect card shows one line, `Peak · mountain`, on a seen tile whose terrain is `peak`. Code: `peakLine(seen, terrain)` in `packages/app/src/hud/peakLine.ts`, rendered in `packages/app/src/ProvinceInspect.tsx` under the Tile group (after the wood line). Style: `.sc-inspect-peak` in `packages/app/src/hud/inspect-card.css`.
- Reads the existing `terrain` field only; no new sim field. An unseen peak tile still shows fog and no peak line.
- Tests: `packages/app/src/hud/peakLine.test.ts` (shows for a seen peak tile; hidden when unseen; hidden on every other terrain).
- Not touched: `packages/sim`, `server/`, `theme.css`, scout / gather / garrison / march / abandon actions, the home, ruins, shore, wood, camp, outpost, and resource lines.

## Mountain on diamond (PR #242, merged)

- Render only (`packages/render`): a seen peak tile draws a tall peak with a snow cap and rock shadow on the diamond. No sim, server, or app change.

## Audio MIME (PR #243, merged)

- The live server sent `.ogg` / `.mp3` / `.wav` as `application/octet-stream`, so lofi and realm tracks did not play on the live site (local Vite was fine). `server/static.mjs` `MIME` now maps `.ogg` → `audio/ogg`, `.mp3` → `audio/mpeg`, `.wav` → `audio/wav`.
- Static gate unchanged: a path leaving `packages/app/dist` is still refused (403); a missing page still falls back to `index.html`.
- Tests: `server/static.test.mjs` adds "an .ogg inside dist is answered as audio/ogg".
- Not touched: `packages/sim`, game rules, `theme.css`, the app.

## Hill rise on diamond (PR #245, merged)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen hill tile on the isometric diamond gets a small stepped rise (`drawHillRise` in `packages/render/src/tokens.ts`): a low stepped plateau in warm ochre (`0xb45309`, `0x92400e`, `0xd97706`, `0xca8a04`, `0xf59e0b`) and stone (`0x78716c`, `0x44403c`, `0xa8a29e`, `0x57534e`, `0xd6d3d1`, `0xe7e5e4`), three tiers, a soft shadow (`0x000000` alpha 0.34 contact shadow and `0x292524` alpha 0.45 base shadow), no keep, no flag, no tent.
- Unseen tiles stay fog (`paintFogHeightVeil`). Peaks, woods, shores, ruins, camps, outposts, resource piles, and keeps stay as they are.

## Waste crag on diamond (PR #247, merged)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen waste tile on the isometric diamond gets a scorched basalt crag (`drawWasteCrag` in `packages/render/src/tokens.ts`): a low scorched rise in dark basalt (`0x09090b`, `0x18181b`, `0x27272a`, `0x292524`, `0x3f3f46`, `0x52525b`, `0x71717a`), cracked ash (`0x140e0a`, `0x1c1917`, `0x44403c`, `0x57534e`, `0x78716c`, `0xa8a29e`), a faint heat glow (`0x7f1d1d`, `0x991b1b`, `0xea580c`, `0xef4444`, `0xf97316`, `0xfdba74`, `0xfef08a`), no keep, no flag, no tent.
- Unseen tiles stay fog (`paintFogHeightVeil`). Peaks, hills, woods, shores, ruins, camps, outposts, resource piles, and keeps stay as they are.

## Plain meadow on diamond (PR #249, merged)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen plain tile on the isometric diamond gets a low pastoral meadow (`drawPlainMeadow` in `packages/render/src/tokens.ts`): a low green meadow with soft grass (`0x365314`, `0x3f6212`, `0x4d7c0f`, `0x65a30d`, `0x84cc16`, `0xa3e635`), a few low tufts (`0x1a2e05`, `0x84cc16`, `0xbef264`, `0xd9f99d`, `0xecfccb`), a gentle shadow (`0x000000` alpha 0.24 contact shadow and `0x14532d` alpha 0.42 base shadow), no keep, no flag, no tent.
- Unseen tiles stay fog (`paintFogHeightVeil`). Peaks, hills, wastes, woods, shores, ruins, camps, outposts, resource piles, and keeps stay as they are.

## Stock badge on diamond (PR #251, merged)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen gather tile (`woodcut`, `quarry`, `field`) on the isometric diamond gets a small stock number badge next to the existing pile (`drawStockBadge(g, cx, cy, stock, stockMax)` in `packages/render/src/tokens.ts`): a small dark pill (`0x090d16`, border `0x475569` or `0x3f3f46`) with the ratio (e.g. `12/40`) in light text (`0xf8fafc`), tucked beside the pile. A dry tile shows `0/N` in muted grey (`0x94a3b8`). No badge when `stockMax` is `0`.
- Unseen tiles stay fog (`paintFogHeightVeil`). Peaks, hills, wastes, woods, plains, shores, ruins, camps, outposts, and keeps stay as they are.

## Clash mark on diamond (PR #253, merged)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen tile with an active fight on the isometric diamond gets a small clash mark (`drawClashMark(g, cx, cy, phase)` and `hasProvinceClash(state, provinceId)` in `packages/render/src/tokens.ts`): a small crossed-swords and crimson-amber impact burst emblem (`0x1a0b0e` dark roundel, `0xdc2626` / `0xf97316` impact burst, `0xcbd5e1` / `0xe2e8f0` crossed steel blades, `0xd97706` brass crossguards/pommels, `0x78350f` leather grips, and `0xfef08a` / `0xffffff` clash spark) on a province that has an active column clash or engagement, using only existing engagement data the board already reads (`listMarches`, `incomingOnProvince`, `garrisonAt`, `getProvince`, `isProvinceSeen`).
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, piles, ruins, camps, outposts, and keeps stay as they are.

## Incoming mark on diamond (PR #255, merged)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen tile with a hostile column inbound on the isometric diamond gets a small incoming mark (`drawIncomingMark(g, cx, cy, phase)` and `hasProvinceIncoming(state, provinceId)` in `packages/render/src/tokens.ts`): a small amber arrow and threat pip (`0x1c1206` dark amber-obsidian roundel with `0x92400e` rim, `0xb45309` / `0x78350f` amber threat diamond, `0xd97706` / `0xf59e0b` / `0xfbbf24` downward amber chevron arrow, and `0xfef3c7` threat pip core glint) on a province that has a non-player march heading to it, using only existing march data the board already reads (`isProvinceSeen`, `incomingOnProvince`, `listMarches`).
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, piles, ruins, camps, outposts, and keeps stay as they are.

## Trail mark on diamond (PR #257, merged)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen tile with your own column on or heading to it on the isometric diamond gets a small trail mark (`drawTrailMark(g, cx, cy, phase)` and `hasProvinceTrail(state, provinceId)` in `packages/render/src/tokens.ts`): a small soft-gold footprint and trail pip (`0x19160d` dark bronze-charcoal roundel with `0x85682a` / `0xa68438` rim, `0xc49e48` / `0xd4b062` / `0xe6c87a` stepping boot footprints, and `0xf5e6b3` trailing breadcrumb pips) on a province that has a player march on or heading to it, using only existing march data the board already reads (`isProvinceSeen`, `listMarches`).
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, incoming marks, piles, ruins, camps, outposts, and keeps stay as they are.

## Outpost and camp marks on diamond (PR #259, merged)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen player outpost or rival camp on the isometric diamond gets a small status mark (`drawOutpostMark(g, cx, cy, kind, phase)` and `resolveProvinceOutpostMark(state, provinceId)` in `packages/render/src/tokens.ts`): a small emerald flag pip (`0x042619` dark emerald roundel, `0x047857` rim, `0x059669` emerald disk, `0xe2e8f0` flagpole mast, and `0x10b981` / `0x6ee7b7` / `0xa7f3d0` swallowtail emerald flag) on a player outpost, and a small deep-red camp pip (`0x2a0808` dark garnet roundel, `0x7f1d1d` rim, `0x991b1b` deep-red disk, and `0xb91c1c` / `0xdc2626` / `0x450a0a` / `0xfca5a5` pitched war-camp tent) on a rival camp, using only existing outpost and province data the board already reads (`isProvinceSeen`, `getProvince`, `listOutposts`).
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, incoming marks, trail marks, piles, ruins, and keeps stay as they are.

## Season mark on diamond (PR #261, merged)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- The isometric diamond gets a small season mark on the seen home tile (`drawSeasonMark(g, cx, cy, seasonOrState, phase)`, `resolveBoardSeasonMark(stateOrSeason)`, and `resolveProvinceSeasonMark(state, provinceId)` in `packages/render/src/tokens.ts`) that changes with the current season using only existing season data the board already reads (`currentSeason(state)` / `state.season`): soft green leaf (`0x4ade80` / `0x16a34a` / `0xbbf7d0` over `0x132a1c`) for spring, gold sun (`0xfbbf24` / `0xfacc15` / `0xfef08a` over `0x2b1f07`) for summer, amber leaf (`0xf59e0b` / `0xd97706` / `0xfcd34d` over `0x2c1608`) for autumn, and pale blue flake (`0x7dd3fc` / `0xbae6fd` / `0xe0f2fe` over `0x0c2233`) for winter.
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, piles, ruins, camps, and keeps stay as they are.

## Garrison mark on diamond (PR #263, merged)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen tile with a posted player garrison on the isometric diamond gets a small garrison mark (`drawGarrisonMark(g, cx, cy, phase)` and `hasProvinceGarrison(state, provinceId)` in `packages/render/src/tokens.ts`): a small emerald heater-shield and tent pip (`0x062c1e` dark emerald-iron roundel, `0x047857` rim, `0x059669` / `0x10b981` emerald shield facets with `0x6ee7b7` bevel rim, and `0xd1fae5` / `0x064e3b` / `0xa7f3d0` pitched garrison tent emblem) using only existing garrison and visibility data the board already reads (`isProvinceSeen`, `garrisonAt`).
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, piles, ruins, camps, and keeps stay as they are.

## Scout mark on diamond (PR #265, merged)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen tile with a player scout on or heading to it on the isometric diamond gets a small scout mark (`drawScoutMark(g, cx, cy, phase)` and `hasProvinceScout(state, provinceId)` in `packages/render/src/tokens.ts`): a small sky cloak and spyglass pip (`0x071e2e` dark sky-slate roundel, `0x0284c7` rim, `0x0c4a6e` deep-sky disk, `0x0ea5e9` / `0x38bdf8` swept sky-blue cloak & hood, and `0x7dd3fc` / `0xe0f2fe` spyglass barrel & gleaming objective lens) using only existing march, scout, and visibility data the board already reads (`isProvinceSeen`, `listMarches`, `isScoutMarch`).
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, piles, ruins, camps, and keeps stay as they are.

## Gather mark on diamond (branch `bakeoff/gemini-gather-mark`, **merged as PR #267**)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen tile with a player gather on or heading to it on the isometric diamond gets a small gather mark (`drawGatherMark(g, cx, cy, phase)` and `hasProvinceGather(state, provinceId)` in `packages/render/src/tokens.ts`): a small amber cart and sack pip (`0x211508` dark amber-chestnut roundel, `0xb45309` rim, `0x45270d` deep-ochre disk, `0xd97706` handcart bed, `0xf59e0b` plump amber gather sack, `0xfbbf24` tied sack crown & wheel rim, and `0xfef3c7` wheel hub pip) using only existing gather, march, and visibility data the board already reads (`isProvinceSeen`, `listGathers`, `listMarches`).
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, piles, ruins, camps, and keeps stay as they are.
- All new art is rendered to the board graphics layer with `pointer-events: none` semantics, so tile click hit-testing (`hitTestProvince`) continues to work without disruption.
- `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty.
- Tests: `npm test` passes, `npm run test -w @second-crown/render` passes (507 tests), and `npm run build -w @second-crown/app` succeeds cleanly.

## Owner mark on diamond (branch `bakeoff/gemini-owner-mark`, **merged as PR #269**)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen tile owned by a rival realm on the isometric diamond gets a small owner mark (`drawOwnerMark(g, cx, cy, realmIdOrPal, phase)`, `resolveProvinceOwnerMark(state, provinceId)`, and `hasProvinceOwner(state, provinceId)` in `packages/render/src/tokens.ts`): a small realm crest or banner pip (`0x141419` dark iron-slate roundel, `pal.borderColor` rim, `pal.rimColor` inner disk, `pal.studColor` vertical flagpole, `pal.pennantColor` fluttering swallowtail banner, and `pal.accentColor` crest finial pip) using only existing owner and visibility data the board already reads (`isProvinceSeen`, `p.occupantRealmId`). Player-owned tiles get no mark.
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, piles, ruins, camps, and keeps stay as they are.
- All new art is rendered to the board graphics layer with `pointer-events: none` semantics, so tile click hit-testing (`hitTestProvince`) continues to work without disruption.
- `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty.
- Tests: `npm test` passes, `npm run test -w @second-crown/render` passes (518 tests), and `npm run build -w @second-crown/app` succeeds cleanly.

## Hold mark on diamond (branch `bakeoff/gemini-hold-mark`, **merged as PR #271**)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen tile that is part of the player's hold on the isometric diamond gets a small hold mark (`drawHoldMark(g, cx, cy, phase)` and `hasProvinceHold(state, provinceId)` in `packages/render/src/tokens.ts`): a small gold crown pip (`0x251a06` dark imperial gold roundel, `0xd97706` rim, `0x422d08` deep-bronze disk, `0xf59e0b` crown base, `0xfbbf24` gold crown peaks, `0xfef08a` peak jewels, and `0xef4444` ruby glint) using only existing hold, building, and visibility data the board already reads (`isProvinceSeen`, `state.board.homeProvinceId`, `state.buildings`).
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, piles, ruins, camps, and keeps stay as they are.
- All new art is rendered to the board graphics layer with `pointer-events: none` semantics, so tile click hit-testing (`hitTestProvince`) continues to work without disruption.
- `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty.
- Tests: `npm test` passes, `npm run test -w @second-crown/render` passes (528 tests), and `npm run build -w @second-crown/app` succeeds cleanly.

## Building mark on diamond (branch `bakeoff/gemini-building-mark`, **merged as PR #273**)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen tile with a finished player building on it on the isometric diamond gets a small building mark (`drawBuildingMark(g, cx, cy, phase)` and `hasProvinceBuilding(state, provinceId)` in `packages/render/src/tokens.ts`): a small cream building pip (`0x1f1610` dark timber-stone roundel, `0xd4a373` rim, `0x3a281c` deep-walnut disk, `0xf3e9d2` cream walls, `0xdeb887` gabled roof, `0xfff8ee` roof highlights, `0x2b1810` door, and `0xd97706` / `0xfef3c7` chimney with hearth warmth) using only existing building and visibility data the board already reads (`isProvinceSeen`, `state.board.homeProvinceId`, `state.buildings`). Under-construction buildings get no mark.
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, hold marks, piles, ruins, camps, and keeps stay as they are.
- All new art is rendered to the board graphics layer with `pointer-events: none` semantics, so tile click hit-testing (`hitTestProvince`) continues to work without disruption.
- `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty.
- Tests: `npm test` passes, `npm run test -w @second-crown/render` passes (539 tests), and `npm run build -w @second-crown/app` succeeds cleanly.

## Staffed mark on diamond (branch `bakeoff/gemini-staffed-mark`, **merged as PR #275**)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen tile with a staffed building on it on the isometric diamond gets a small staffed mark (`drawStaffedMark(g, cx, cy, phase)` and `hasProvinceStaffed(state, provinceId)` in `packages/render/src/tokens.ts`): a small green worker pip (`0x0c2718` dark moss-forest roundel, `0x22c55e` rim, `0x144026` deep-spruce disk, `0x7ec27a` / `0x4ade80` soft green worker tunic, `0x2b1810` / `0xd97706` belt and brass buckle, `0xfde68a` worker head, `0x22c55e` cap, `0xb45309` timber tool handle, and `0xe2e8f0` steel tool head) using only existing building, citizen, and visibility data the board already reads (`isProvinceSeen`, `state.board.homeProvinceId`, `state.buildings`, `state.citizens`, `isBuildingStaffed`). Empty buildings and under-construction buildings get no mark.
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, hold marks, building marks, piles, ruins, camps, and keeps stay as they are.
- All new art is rendered to the board graphics layer with `pointer-events: none` semantics, so tile click hit-testing (`hitTestProvince`) continues to work without disruption.
- `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty.
- Tests: `npm test` passes, `npm run test -w @second-crown/render` passes (551 tests), and `npm run build -w @second-crown/app` succeeds cleanly.

## Fog edge mark on diamond (branch `bakeoff/gemini-fog-edge-mark`, **merged as PR #277**)

- The board tile only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- A seen tile at the edge of the player's vision on the isometric diamond gets a small fog edge mark (`drawFogEdgeMark(g, cx, cy, phase)` and `hasProvinceFogEdge(state, provinceId)` in `packages/render/src/tokens.ts`): a small slate mist pip (`0x131d2e` dark slate-fog roundel, `0x64748b` rim, `0x1e293b` deep twilight disk, `0x64748b` & `0x94a3b8` swirling mist banks, `0xcfdbe8` drifting cloud puffs, `0xe2e8f0` cresting mist wisp, and `0xf8fafc` vapor condensation glint) using only existing vision and adjacency data the board already reads (`isProvinceSeen`, `neighbors`). Fully surrounded seen tiles get no mark.
- Unseen tiles stay fog (`paintFogHeightVeil`). Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, hold marks, building marks, staffed marks, piles, ruins, camps, and keeps stay as they are.
- All new art is rendered to the board graphics layer with `pointer-events: none` semantics, so tile click hit-testing (`hitTestProvince`) continues to work without disruption.
- `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty.
- Tests: `npm test` passes, `npm run test -w @second-crown/render` passes (561 tests), and `npm run build -w @second-crown/app` succeeds cleanly.

## Living atmosphere on diamond (branch `bakeoff/gemini-atmosphere`, **merged as PR #279**)

- The board only. Render only. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- Living atmosphere weather overlay and soft day/night ambient tint (`drawAtmosphere(state, g, phase, width, height)` in `packages/render/src/atmosphere.ts`). Resolves current weather via `(sim as any).weatherFor?.(state)` if present, with clean fallback to `flags.weather` or `currentSeason(state)` (Clear = warm gold tint, Rain = cool blue tint + drifting rain streaks, Storm = darker blue wash + heavier driving streaks + lightning flash, Snow = pale grey tint + drifting snow dots).
- Ground shadows under keeps (`drawMiniatureKeep` in `tokens.ts`) and walls/buildings (`drawIsometricBuilding` in `buildings.ts`) darken during storms.
- Gentle wind sway on pine tree foliage in `drawWoodTile`.
- Unseen tiles stay fog (`paintFogHeightVeil`). Existing marks, piles, ruins, camps, and keeps stay as they are.
- All new art is rendered to the board weather graphics layer with `pointer-events: none` (`eventMode = "none"`) semantics, so tile click hit-testing (`hitTestProvince`) continues to work without disruption.
- `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty.
- Tests: `npm test` passes, `npm run test -w @second-crown/render` passes (572 tests), and `npm run build -w @second-crown/app` succeeds cleanly.

## Day/night cycle and weather atmosphere (branch `bakeoff/gemini-day-night`, **merged as PR #281**)

- Render only in `packages/render`. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- `packages/render/src/atmosphere.ts`: `resolveDayPhase(state, animPhase)` reads `sim.dayPhase(state)` if present, or falls back to a 120-tick cycle (`dawn` 0–19, `day` 20–69, `dusk` 70–89, `night` 90–119). `drawAtmosphere` paints Dawn = warm gold rising, Day = clear warm, Dusk = amber, and Night = cool blue with lower brightness, keeping existing Clear, Rain, Storm, and Snow overlays.
- Soft ground shadows under keeps (`drawMiniatureKeep`, `drawIsometricBuilding`) and walls/gates (`drawIsometricBuilding`) darken in both night and storm.
- Wind sway on standing trees (`drawWoodTile`, `lumber_camp` pines, desert palm fronds) and keep banners, scaling brisker in storm wind.
- Fog edge marks (`drawFogEdgeMark`) thicken visually in storm and snow (higher opacity and denser rolling mist wisps) without changing hit-testing.
- All overlay graphics enforce `pointer-events: none` (`eventMode = "none"`). Unseen tiles stay fog (`paintFogHeightVeil`). Existing marks, piles, ruins, camps, and keeps stay as they are.
- `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty.
- Tests: `npm test` passes, `npm run test -w @second-crown/render` passes (585 tests), and `npm run build -w @second-crown/app` succeeds cleanly.

## Moving sun/moon and tile-plane weather (branch `bakeoff/gemini-sun-moon`, **merged as PR #283**)

- Render only in `packages/render`. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- `packages/render/src/atmosphere.ts`: removes all full-canvas `g.rect` color washes. Reads `sunMoonPosition(state)` when exported by `@second-crown/sim` (with a smooth half-sine tick fallback across `DAY_CYCLE_TICKS`) and draws a small sun or moon sprite moving across the top of the board. At night, draws a soft moonlight glow only right near the moon rather than across the whole board.
- Soft local lighting: draws a small warm glow on the tile plane directly under the sun by day/dawn/dusk and a small cool glow directly under the moon at night, never tinting the whole board.
- Weather on the tile plane: sparse rain streaks (`16`), storm streaks (`24` + localized sky-to-board lightning bolt), and snow dots (`16`) start above the board and fall/settle onto `boardGridToWorld` tiles with subtle droplet ripples and snow flecks so tiles stay readable.
- Night variations (`tokens.ts`, `buildings.ts`): when `dayPhase` is `night`, unbreached keeps, cottages, farms, academies, infirmaries, and marching player army/garrison/gather columns darken their windows (`0x1e293b`) and light warm amber lanterns (`0xf59e0b` / `0xd97706` / `0xfef08a`); sprites without night variants (`quarry`, `lumber_camp`, `walls`, `archery_range`, scouts, etc.) are skipped cleanly.
- All overlay graphics enforce `pointer-events: none` (`eventMode = "none"`). Unseen tiles stay fog (`paintFogHeightVeil`). Existing marks, piles, ruins, camps, and keeps stay as they are.
- `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty.
- Tests: `npm test` passes, `npm run test -w @second-crown/render` passes (590 tests), and `npm run build -w @second-crown/app` succeeds cleanly.

## Static board tile cache (branch `bakeoff/gemini-board-cache`, **not merged**)

- Render only in `packages/render`. Do not change `packages/sim`, `server/`, or `theme.css`. Do not change camera math, zoom, or tile click hit-testing.
- `packages/render/src/tokens.ts` & `packages/render/src/index.ts`: splits the board province paint path into a cached static tile `Graphics` layer (`boardStaticTilesLayer` managed by `createBoardStaticLayerCache` / `paintBoardStaticTiles` / `computeBoardStaticCacheKey`) for static terrain, 3D height faces, and unseen fog veils (`paintFogHeightVeil`), and a separate dynamic every-frame layer (`boardProvincesLayer` via `paintBoardDynamicTokens` alongside `boardRoutesLayer`, `boardPawnsLayer`, `boardSelectionLayer`, and `boardWeatherGraphic`).
- `boardStaticCache` only repaints `boardStaticTilesLayer` when the camera band changes to `"board"` or the seen/unseen province set changes (and skips board redraws while in `"hold"` band). Moving marks, piles, ruins, camps, keeps, marches, weather, and the sun/moon redraw every frame on separate layers.
- All board layers and overlays enforce `pointer-events: none` (`eventMode = "none"`). Unseen tiles stay fog (`paintFogHeightVeil`). Existing marks, piles, ruins, camps, and keeps stay as they are.
- `git diff origin/main -- packages/sim server packages/app/src/theme.css` is completely empty.
- Tests: `npm test` passes, `npm run test -w @second-crown/render` passes (593 tests), and `npm run build -w @second-crown/app` succeeds cleanly.

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
