# CHANGELOG

## 2026-10-09 — Server checks in npm test (wave/server-check)

- Test command only. No solo save is marked shared; `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, the empty-list reload, Second Dawn, Pull save, and guest ids are unchanged. No rule copied into `server/`; no client state accepted as a realm. No app, sim, or server code change.
- `package.json`: `test` now ends with `npm run test:server`; new script `test:server` = `node server/test.mjs`.
- `server/test.mjs` (new): finds every `server/*.test.mjs`, prints the file names, and runs them in one `node --test --test-reporter=spec` call; exits with node's status, so a failing server test fails `npm test`. Exits 1 if no server test file is found.
- Tests: no test changed or skipped. `npm test` now also runs all 19 server test files (144 tests), including clock, save gate, key, cap, guest id, hold write, and `write.test.mjs` "a solo load does not join". Run: `npm test`.

## 2026-10-09 — Guest ids never repeat (wave/guest-id)

- Guest sign-in only. No solo save is marked shared; `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, the empty-list reload, Second Dawn, Pull save, and Discord login are unchanged. No rule copied into `server/`; no client state accepted as a realm. No app or sim change.
- `server/guestid.mjs` (new): `newGuestId` is `guest_` + 16 random bytes in hex; `claimGuestId(isTaken)` refuses an id already issued and draws again up to `GUEST_ID_TRIES` (3) times, else returns null.
- `server/index.mjs` `POST /guest`: an id counts as taken if it is in `users.json` or has a `saves/<id>.json`. If no free id is found it answers 503 `GUEST_ID_TAKEN` and writes nothing. Before, a 3-byte id that repeated wrote over the old account and handed its save to the new guest.
- Tests: new `server/guestid.test.mjs` (50,000 new guest ids are unique; a repeated id is refused and a repeat draw is thrown away; the module names no combat rule and no shared save; live server: new guests do not take the old short ids, start with no cloud save, and do not change old accounts; an old guest token still loads its own save and not another guest's; one new guest's save is not another's). Pull save and solo-load checks stay in `pullCloud.test.ts` and `settleOnLoad.test.ts`. Run: `npm test` and `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/cap.test.mjs server/guestid.test.mjs`.

## 2026-10-09 — Pull save waits for reload (wave/pull-hold)

- Pull save only. No solo save is marked shared; `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, the empty-list reload, and Second Dawn are unchanged. No rule copied into `server/`; no client state accepted as a realm. No server change.
- `packages/app/src/save/indexedDb.ts`: a second key `pulled` beside `autosave` (`savePulledToIndexedDb`, `loadPulledFromIndexedDb`, `clearPulledFromIndexedDb`).
- `packages/app/src/game/pullCloud.ts` (new): `pullCloudCopy` fetches, parses, then writes only the `pulled` slot; `startSave` promotes a pulled copy to the autosave once on load, else reads the autosave.
- `packages/app/src/game/useGameEngine.ts`: startup reads `startSave()` instead of `loadFromIndexedDb()`. `packages/app/src/CloudPanel.tsx`: Pull save and the conflict "Load cloud" write the `pulled` slot, never the autosave.
- Tests: `packages/app/src/game/pullCloud.test.ts` (pull stores the cloud copy and the on-screen tick, stores and buildings and the autosave are unchanged until load; a failed or garbled pull leaves the local save unchanged; a pulled crown loads solo and joins no hold; Second Dawn on a pulled crown still clears unfinished jobs). Run: `npm test` and `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/cap.test.mjs`.

## 2026-10-09 — Second Dawn clears unfinished jobs (wave/dawn-clear)

- Second Dawn only. No solo save is marked shared; `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, the hold write, and the empty-list reload are unchanged. No rule copied into `server/`; no client state accepted as a realm.
- `packages/sim/src/actions/prestige.ts`: `tryAscend` calls new `clearRunJobs`, which drops player training, all heal jobs and `wounded_player`, all upgrade jobs, player marches and gathers, and garrisons on player-held provinces. Rival / NPC entries are kept. Permanent progress and the once-per-crown first-dawn gift are unchanged.
- `packages/app/src/hud/DawnCard.tsx`: no Ascend button for a shared realm (`sharedRealmId`); one line says unfinished training, treating, upgrades and marches end at the dawn.
- Tests: `packages/sim/src/actions/prestige.test.ts` (a pending train, heal, upgrade, march, gather and garrison end with the dawn and no troops land over the next 2,000 ticks; an upgrade queued on the dawn farm does not finish on the next crown's farm; a second ascend clears jobs and does not grant the gift again; an ascended empty army stays empty on reload; rival training is kept). `packages/app/src/game/settleOnLoad.test.ts` (an ascended crown still loads solo and joins no hold). Run: `npm test` and `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/cap.test.mjs`.

## 2026-10-09 — A reload keeps an empty army (wave/reload-empty)

- Reload only. No solo save is marked shared; `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, Repair, and the hold write are unchanged. No rule copied into `server/`; no client state accepted as a realm. No app change.
- `packages/sim/src/save/serialize.ts`: `ensureWorldStubs` runs the old-save fill only when `units` / `citizens` are missing from the save. The rival's migrated militia and NPC starting troops need `units` missing; `seedCitizensFromBuildings` needs `citizens` missing. An empty army or worker list loads empty.
- `packages/sim/src/content/world.ts`: `seedWorldActors(state, { fillUnits })` gives starting troops to a realm it adds now, or to every troop-less realm when `fillUnits` is set; an existing realm with no units stays empty.
- Tests: `packages/sim/src/save/serialize.test.ts` (a saved empty army stays empty; a saved empty worker list stays empty beside a finished farm; a fresh starter game gains no farm worker over repeated reloads; a save that omits units and citizens still loads and gets the old fill). New `server/reload.test.mjs` (a fresh hold restart adds no farm worker while its lumber camp is building; a hold's empty army and worker list survive a restart). Failed-write and solo-load checks stay in `server/write.test.mjs`. Run: `npm test` and `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/cap.test.mjs server/write.test.mjs server/reload.test.mjs`.

## 2026-10-09 — Hold writes before it spends (wave/hold-write)

- Hold save only. No solo save is marked shared; `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, the catch-up match, and Repair are unchanged. No rule copied into `server/`; no client state accepted as a realm. No app change.
- `server/hold.mjs`: new `commit(realmId, hold, act)`. A hold intent (train, build, cottage, lumber, stamp) and the first-join key claim run on a copy of the hold (state via the sim's `serializeState` / `deserializeState`, plus pending and key hash). The copy is written through the hold store, then published as the live hold with a new `TickEngine`. A failed write -> 503 `NOT_SAVED`; the live hold, its stores, and its kept file are unchanged, so a retry spends once. A refusal throws before the write and writes nothing.
- `keep()`: a settled-ticks write that fails is skipped and retried on the next read; a forced write (a hold leaving memory) still throws.
- Tests: new `server/write.test.mjs` (a failed write leaves militia, training, farms, cottages, lumber camps, pending, stores, and the kept file unchanged; after the disk recovers the same intents spend once, matching a server whose disk never failed; a refusal spends and writes nothing; a written hold survives a restart and the next keyed join sees the new stores; a failed first join leaves no key and the id joins again; a wrong hold key does not spend or write; Repair still does not finish the hold's cottage under construction; a solo load does not join). Run: `npm test` and `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/cap.test.mjs server/write.test.mjs`.

## 2026-10-09 — Repair only fixes damage (wave/repair-scar)

- Repair only. No solo save is marked shared; `applyOfflineProgress`, hold keys, the login nonce, the hold caps, the crash guard, and the catch-up match are unchanged. No rule copied into `server/`; no client state accepted as a realm. No Repair button on the shared hold.
- `packages/sim/src/systems/ward.ts`: new `isScarred(state, b)` and `markScarred(state, id)`, backed by `flags.scar_json` (building ids). `listScarred` returns only marked buildings still on a timer; `tryRepair` refuses anything not marked (a building under construction, including the starter lumber camp), so it no longer finishes a build early. A repair spends 8 stone, clears the timer and the mark, and logs `type: "repair"` with `payload.buildingId` in `inputLog`. It does not re-run completion. `isScarred` is exported from `@second-crown/sim`.
- `packages/sim/src/systems/march.ts`: `damageHoldBuilding` marks the building it knocks down.
- App: `hud/WorkCard.tsx` drops its id/timer `isScarred` guess; `tabs/KingdomTab.tsx` uses the sim's `isScarred(state, b)`.
- Tests: new `packages/sim/src/systems/repair.test.ts` (the starter lumber camp is not scarred, Repair refuses it and it finishes at tick 30; a newly placed farm is not scarred, Repair does not complete it, and it finishes on its timer; a damaged farm repairs for 8 stone, is logged, keeps its level and citizens, and cannot be repaired twice; Repair needs 8 stone; a 3,000-tick catch-up with a scar matches ordinary ticks). Catch-up match and solo-load checks stay in `settleMatch.test.ts` and `settleOnLoad.test.ts`. Run: `npm test` and `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/cap.test.mjs`.

## 2026-10-08 — Catch-up matches ticks (wave/settle-match)

- Offline catch-up only. `applyOfflineProgress` and the 30-day cap are unchanged; no solo save is marked shared; hold keys, the login nonce, the hold caps, and the crash guard are unchanged. No rule copied into `server/`; no client state accepted as a realm. No app change.
- `packages/sim/src/core/tickEngine.ts`: `settleTicks` now ends like the same number of ordinary ticks when food is starving the host or a store is full. A batch stops before any store would clip at its cap or food would run short of upkeep (`safeTicks`), and those ticks run one at a time (`fineTick`). A store that held still, or ended full, on the last fine tick is pinned through the batch; with food pinned and the roster still, unit counts are kept too. Both solo catch-up and the shared hold use this path.
- `packages/sim/src/systems/economy.ts`: new `economyGain(state, ticks, tithe = true)`, the totals `advanceAnalytic` adds, read-only.
- Tests: new `packages/sim/src/core/settleMatch.test.ts` (20 starving ticks and one 20-tick batch end with the same militia; 2,000 starving ticks match; a full-store batch matches tick-by-tick stores; a store filling partway through 5,000 ticks matches; a 50-tick catch-up with room in every store is the same single analytic step as before; the 30-day cap is unchanged and a day from full stores ends full). Wrong-key and solo-load checks stay in `server/key.test.mjs` and `settleOnLoad.test.ts`. Run: `npm test` and `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/cap.test.mjs`.

## 2026-10-08 — Crash guard (wave/realtime-guard)

- Crash guard only. No solo save is marked shared; `applyOfflineProgress`, hold keys, the login nonce, and the hold and guest caps are unchanged. No rule copied into `server/`; no client state accepted as a realm. No app change.
- New `server/guard.mjs`: `safeDecode(s)` returns null for a bad percent-escape; `guardRoute(route, log)` wraps an async `(req, res)` route so a throw or rejection is logged and answered 500 `ROUTE_FAILED` (or a half-sent answer is destroyed), never an unhandled rejection.
- `server/index.mjs`: the HTTP handler is wrapped in `guardRoute`. `GET /profile/:id` and static files use `safeDecode`; a bad escape -> 400 `BAD_ADDRESS`. The static decode now runs before the dist check, so it answers 400 even with no build. An unparseable request URL -> 400.
- Tests: new `server/guard.test.mjs` (bad escapes decode to null; a rejecting, throwing, or half-sent route is answered and no unhandled rejection is seen, and the server still answers after; a tick read creates no clock; a wrong hold key does not spend; a foreign sign-in link is ignored; a solo load does not join and no save is marked shared; live server: four bad escapes answer 400, the process stays up, `/health`, the page, a tick read, a guest, a profile, a keyed hold join, a wrong-key join (403), and a solo save PUT/GET all still work). Run: `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/cap.test.mjs server/guard.test.mjs`.

## 2026-10-08 — Hold-table cap (wave/realtime-cap)

- Hold-table cap only. No solo save is marked shared; `applyOfflineProgress`, hold keys, and the login nonce are unchanged. No rule copied into `server/`; no client state accepted as a realm.
- `server/realmclock.mjs`: new `peek(id)` (running tick, 0 when none, null for a bad id; never creates) and `drop(id)`. `GET /realm/:id/tick` uses `peek`, so a public tick read creates no clock. Holds still start clocks through `tick(id)`, which only runs after a key check or a first join.
- New `server/cap.mjs`: `createAddressCap({ max, windowMs })`, a fixed one-day window per address (at most 10,000 addresses tracked; when full and none expired, a new address is refused). `MAX_GUESTS_PER_ADDRESS` = 10, `MAX_NEW_HOLDS_PER_ADDRESS` = 3. `POST /guest` over the cap -> 429 `GUEST_CAP`. A first keyless join of an unused id over the cap -> 429 `HOLD_CAP`; a claim of a pre-key hold file and every keyed open are not counted.
- `server/hold.mjs`: `createHolds` takes `maxHolds`, `idleMs` (`HOLD_IDLE_MS`, 15 min), `onDrop`. Every touch stamps `usedAt`. When full, `dropIdle()` settles the longest-idle hold to its clock, force-writes it, removes it and its clock from memory, and calls `onDrop`; with no idle hold or no store, a new hold is 503 `FULL`. `server/join.mjs` uses the same drop when its joined set is full and forgets the dropped id's `joined` entry and cached key hash, so the next open reads the hash from the file. `join(body, key, session, address)` gains the address.
- `server/index.mjs`: `clientAddress(req)` = socket address; guest cap and hold cap wired.
- App: `net/hold.ts` shows the server's hold-cap reason on 429; `createGuest` / `CloudPanel.tsx` show the guest-cap reason.
- Tests: new `server/cap.test.mjs` (a tick read for an unknown id creates no clock and does not block a later join; address cap per address and per day; after the hold cap a further create is refused and an existing keyed hold still opens; a full table with nothing idle refuses a new hold and still opens a joined one; dropping an idle hold keeps its save, the same key reopens it with its clock caught up, a different id cannot read it, a wrong key does not spend; no drop without a store; a foreign sign-in link is still ignored; a solo load does not join; live server: guest and hold caps refuse, the refused guest is not written, a tick read gives 0, a keyed hold still opens). `key.test.mjs` source check updated for the address argument. `net/hold.test.ts` adds the hold-cap reason. Run: `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/cap.test.mjs`.

## 2026-10-05 — Login nonce (wave/realtime-nonce)

- Login nonce only. No solo save is marked shared; `applyOfflineProgress`, hold keys, and the join path are unchanged. No rule copied into `server/`; no client state accepted as a realm.
- App: new `packages/app/src/net/login.ts`. `startLogin()` makes a 24-byte random nonce (base64url) in `sessionStorage`; `takeLogin(nonce)` returns true only for that nonce and removes it, match or not. `createGuest` starts a nonce before `POST /guest` and takes it before saving the session. `discordLoginUrl()` is replaced by `startDiscordLogin()` → `/auth/discord?state=<nonce>`. `absorbHashSession()` now returns `"none" | "signed-in" | "refused"`; a `cloud_token` hash without this browser's nonce is refused, the hash is cleared, and the session is not replaced. `CloudPanel.tsx` shows "Ignored a sign-in link this browser did not start."
- Server: new `server/nonce.mjs`. `GET /auth/discord` needs a `state` nonce (400 without), sets it in an HttpOnly, SameSite=Lax cookie on `/auth/discord` (10 minutes) and passes it to Discord as `state`. `GET /auth/discord/callback` refuses (400) a `state` that does not equal that cookie (constant-time compare) and clears the cookie on every callback. The redirect hash adds `cloud_nonce`.
- Tests: new `server/nonce.test.mjs` (pattern mirrors the client; matching state accepted; someone else's state or no stored nonce refused; a used nonce refused after the clear; cookie flags; hash carries the nonce; index wires both routes; a hold join still needs the hold key; a solo load does not join). New `packages/app/src/net/login.test.ts` (a foreign token in the URL does not replace the session and does not upload; a made-up nonce refused; a used nonce refused; a Discord login this browser started signs in; guest signs in; only the newest nonce counts; a solo load does not join and a join still sends `X-Hold-Key`). Run: `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/nonce.test.mjs`.

## 2026-10-04 — Shared hold key (wave/realtime-key)

- Hold key only. No solo save is marked shared; `SHARED_SAVES` and `SHARED_REALMS` stay empty; `applyOfflineProgress` is unchanged. No rule copied into `server/`; no client state accepted as the realm.
- `server/join.mjs`: the first successful `POST /join` of an id makes the hold and returns `{ ...view, key }` once. The key is 96 random bits (`crypto.randomBytes(12)`, base64url, 16 characters). Later joins, `GET /realm/join-*/hold`, and every intent must send it in the `X-Hold-Key` header, signed in. Missing or wrong key → 403 `BAD_KEY`, the same for a hold that does not exist; checked before the sim is loaded or anything is spent or made. A keyless join on an id that has a key is refused, so it never makes a second hold. 5 wrong or missing keys from one session (account id) → 429 `TOO_MANY_TRIES` on later key tries from that session (memory only; a restart clears it). Two first joins at once: one gets the key, the other 403.
- `server/hold.mjs` / `server/keep.mjs`: the hold carries `keyHash` (SHA-256 of the key) and the hold file stores it; the key itself is never written. `keyHashOf(id)` reads it without loading the sim; `claim(id, hash)` sets it once. After a restart the same key opens the hold (a keyed read works without a join first) and a wrong key does not. A hold file with no `keyHash` (kept before this branch) is claimed by the next join.
- `server/index.mjs`: routes `/join`, `/realm/:id/hold`, `/realm/:id/intent` through the key gate; CORS allows `X-Hold-Key`. Owner-marked realms are not keyed.
- App: `net/hold.ts` sends `X-Hold-Key` on join, read, and intents (never in a body); `joinRealm(code, key?)` returns the key once; 403/429 read as plain reasons. `JoinHoldCard.tsx`: **Hold key** field next to the realm id (blank makes a new hold), the new key shown once with **Copy key** and a hint to send it with the id. Leave still returns to the solo crown; the key lives only in the card's state, never the local save.
- Tests: new `server/key.test.mjs` (first join returns a key; a different id has a different key; a second join without the key is rejected and makes no second hold; with the key it sees the same stores; an intent with a wrong or missing key does not spend; a wrong key answers the same for a hold that does not exist; a guesser is locked out after 5; after the in-memory hold is dropped the same key opens it and a wrong key does not, and the file holds only the hash; concurrent first joins; a pre-key hold is claimed; no client state; a solo load does not join; index routes through the gate). Older server tests join through `server/testkeys.mjs`, a friend who keeps the key. `net/hold.test.ts` adds key header and refusal cases. Run: `node --test server/clock.test.mjs server/savegate.test.mjs server/key.test.mjs server/keep.test.mjs server/realmclock.test.mjs server/hold.test.mjs server/join.test.mjs server/play.test.mjs server/build.test.mjs server/cottage.test.mjs server/lumber.test.mjs`.

## 2026-10-04 — Shared hold: Build lumber camp (wave/realtime-lumber)

- Still opt-in. No solo save is marked shared; `SHARED_SAVES` and `SHARED_REALMS` stay empty; `applyOfflineProgress` is unchanged. No rule copied into `server/`; no client state accepted as the realm.
- `server/hold.mjs`: new intent, exactly `{ "type": "lumber" }` (one lumber camp). Same path as Build farm and Build cottage, now one `BUILDS` table: first tile where `sim.canPlaceType(state, "lumber_camp", x, y)` is true, then `sim.tryBuild(state, { typeId: "lumber_camp", x, y })`, the same call a solo lumber camp makes. No tile or no free work plot → 409 `NO_LUMBER_TILE`; cannot pay → 409 `CANNOT_LUMBER`; nothing is spent in either case. Any extra key is 400. The view adds `lumberCamps` (player lumber camps, finished or building; the starter camp counts). Written through the hold store after the intent, so it survives a restart. Train, Build farm, Build cottage, and Stamp unchanged.
- App: `net/hold.ts` `HoldView` gains `lumberCamps` (missing reads as zero); new `sendLumber(realmId)`. `JoinHoldCard.tsx` adds a **Build lumber camp** button next to Build farm and **Lumber camps** beside the numbers. Leave unchanged; nothing is written to the local save.
- Tests: new `server/lumber.test.mjs` (starter camp shows; a camp on one id shows on the other; an unaffordable camp is rejected and does not spend; a fresh hold with no free work plot is rejected and does not spend; a camp built before a restart is there after the in-memory hold is dropped; a different id does not see it; extra keys refused; train, cottage, and farm still work; a solo load does not join; source calls `sim.tryBuild` and copies no rules). `net/hold.test.ts` (lumber sends only `{ type: "lumber" }`; 409 reason shown; old view reads zero). `settleOnLoad.test.ts` fixtures gain `lumberCamps`. Run: `node --test server/clock.test.mjs server/savegate.test.mjs server/keep.test.mjs server/realmclock.test.mjs server/hold.test.mjs server/join.test.mjs server/play.test.mjs server/build.test.mjs server/cottage.test.mjs server/lumber.test.mjs`.

## 2026-10-04 — Shared hold survives a restart (wave/realtime-keep)

- Only the shared hold is kept. No solo save is marked shared; `SHARED_SAVES` and `SHARED_REALMS` stay empty; `applyOfflineProgress` is unchanged and not called. No rule copied into `server/`; no client state accepted as the realm.
- New `server/keep.mjs`: `createHoldStore(dir)` writes one file per realm id, `<SAVES>/<realmId>.json` (joined ids are `join-<id>`, never an account id), whole through a temp file. The record is `{ kind: "shared-hold", realmId, savedAt, pending, state }`, `state` being the sim's own `serializeState` text. A file whose `realmId` is not the asked id is not loaded. `downTicks(savedAt, now)` = real ticks since the write, capped at `MAX_OFFLINE_MS` (30 days, mirrored from `packages/shared`, drift-tested), the same cap as solo offline catch-up.
- `server/hold.mjs`: `createHolds` takes an optional `store` and `now`. A hold is written after a train, farm, cottage, or stamp intent, and after settled ticks (at most every `SETTLE_SAVE_MS`, 5 s). On first touch after a restart it loads that id's kept hold through `sim.deserializeState` instead of a new game, and puts the Phase 1 clock back at the kept tick plus the down time (`realmclock.mjs` `resume`). The sim settles the gap through `TickEngine` on the next read.
- `server/index.mjs`: the join table gets `store: createHoldStore(SAVES)`.
- App: no new button. `JoinHoldCard.tsx` copy now says a joined hold survives a server restart and the solo crown is not kept with it. Leave unchanged; nothing is written to the local save.
- Tests: new `server/keep.test.mjs` (a cottage survives dropping the in-memory hold; farms, cottages, and militia come back; the clock counts the down time; the cap; a different id starts empty; a copied file under another id is not loaded; a solo load does not read or write the hold file; settled ticks throttled, intents written at once; index uses the save folder and never marks a solo save shared). `realmclock.test.mjs` adds `resume`. Run: `node --test server/clock.test.mjs server/savegate.test.mjs server/keep.test.mjs server/realmclock.test.mjs server/hold.test.mjs server/join.test.mjs server/play.test.mjs server/build.test.mjs server/cottage.test.mjs`.

## 2026-10-04 — Shared hold: Build cottage (wave/realtime-cottage)

- Still opt-in. No solo save is marked shared; `SHARED_SAVES` and `SHARED_REALMS` stay empty; `applyOfflineProgress` is unchanged. No rule copied into `server/`; no client state accepted.
- `server/hold.mjs`: new intent, exactly `{ "type": "cottage" }` (one cottage). Same path as Build farm, now shared as `freeTile(hold, typeId)`: first tile where `sim.canPlaceType(state, "cottage", x, y)` is true, then `sim.tryBuild(state, { typeId: "cottage", x, y })`, the same call a solo cottage makes. No tile → 409 `NO_COTTAGE_TILE`; cannot pay → 409 `CANNOT_COTTAGE`; nothing is spent in either case. Any extra key is 400. When the sim finishes the cottage its work-plot cap rises, so a farm that was refused as no tile can land. The view adds `cottages` (player cottages, finished or building). Train, Build farm, and Stamp unchanged.
- App: `net/hold.ts` `HoldView` gains `cottages` (missing reads as zero); new `sendCottage(realmId)`. `JoinHoldCard.tsx` adds a **Build cottage** button next to Build farm and **Cottages** beside the numbers. Leave unchanged; nothing is written to the local save.
- Tests: new `server/cottage.test.mjs` (fresh hold has none; a cottage on one id shows on the other; an unaffordable cottage is rejected and does not spend; after a cottage finishes a farm refused for no free tile lands, and not while it is still scaffolding; a different id does not see it; extra keys refused; train and farm still work; a solo load does not join; source calls `sim.tryBuild` and copies no rules). `net/hold.test.ts` (cottage sends only `{ type: "cottage" }`; 409 reason shown; old view reads zero cottages). `settleOnLoad.test.ts` fixtures gain `cottages`.

## 2026-10-04 — Shared hold: Build farm (wave/realtime-build)

- Still opt-in. No solo save is marked shared; `SHARED_SAVES` and `SHARED_REALMS` stay empty; `applyOfflineProgress` is unchanged. No rule copied into `server/`; no client state accepted.
- `server/hold.mjs`: new intent, exactly `{ "type": "build" }` (one farm). The server scans tiles row by row and takes the first where `sim.canPlaceType(state, "farm", x, y)` is true, then calls `sim.tryBuild(state, { typeId: "farm", x, y })`, the same call a solo build makes. No tile → 409 `NO_TILE`; sim refuses (cannot pay) → 409 `CANNOT_BUILD`; nothing is spent in either case. Any extra key (type, tile, state) is 400. The view adds `farms` (player farms, finished or building). Train and Stamp unchanged.
- A fresh hold has both starter work plots in use (cap 2), like a solo new game, so a farm build is refused as no tile until the hold has a cottage or keep. There is no intent for those yet.
- App: `net/hold.ts` `HoldView` gains `farms` (missing reads as zero); new `sendBuild(realmId)`. `JoinHoldCard.tsx` adds a **Build farm** button next to Train militia and **Farms** beside the five numbers. Leave unchanged; nothing is written to the local save.
- Tests: new `server/build.test.mjs` (starter farm shows; a build on one id shows on the other; an unaffordable build is rejected and does not spend; no free tile is rejected and does not spend; a different id does not see the farm; extra keys refused; train still works; a solo load does not join; source calls `sim.tryBuild`/`sim.canPlaceType` and copies no rules). Success cases seed one finished cottage in test setup only. `hold.test.mjs` refused-body list now uses `{ type: "build", typeId: "keep" }`. `net/hold.test.ts` (build sends only `{ type: "build" }`; 409 reason shown). `settleOnLoad.test.ts` fixtures gain `farms`.

## 2026-10-04 — Playable shared hold: stores and Train militia (wave/realtime-play)

- Still opt-in. No solo save is marked shared; `SHARED_SAVES` and `SHARED_REALMS` stay empty; `applyOfflineProgress` is unchanged. No rule copied into `server/`.
- `server/hold.mjs`: a new hold is `createGameState({ seed: seedForRealm(id), now: 0, withStarterBuildings: true })`, the same new game a solo player gets, never a client state. Each read still settles to the Phase 1 clock through `TickEngine`. The view adds `stores` (`food`, `wood`, `stone`, `gold`, the sim's decimal strings), `militia` (trained player militia) and `training` (militia still queued).
- New intent, exactly `{ "type": "train" }`: one militia through the sim's `tryTrain` at the settled tick. If the sim refuses (cannot pay, or queue full) the server answers 409 `CANNOT_TRAIN` and nothing changes. Any extra key (unit, count, state) is 400. Stamps work as before.
- App: `net/hold.ts` `HoldView` gains `stores`, `militia`, `training` (missing fields read as zero); new `sendTrain(realmId)`; a refused intent surfaces the server's reason. `JoinHoldCard.tsx` shows Food / Wood / Stone / Gold / Militia and a **Train militia** button. Stamp and Leave unchanged; nothing is written to the local save.
- Tests: new `server/play.test.mjs` (fresh new-game stores; two readers on one id see the same stores; a train on one id shows on the other, then becomes a militia; an unaffordable train is rejected with no change; a different id does not see the militia; extra keys refused; a solo load does not join; source calls `sim.tryTrain` and copies no rules). `net/hold.test.ts` (train sends only `{ type: "train" }`; 409 reason shown; old view reads as zeros). `settleOnLoad.test.ts` updated for the new view shape.

## 2026-10-04 — Join a shared hold by realm id (wave/realtime-join)

- Opt-in only. No solo save is marked shared; `SHARED_SAVES` and `SHARED_REALMS` stay empty; `sharedRealmId` still returns null; `applyOfflineProgress` for a solo crown is unchanged.
- New `server/join.mjs`: `createJoinableHolds({ clocks, isShared, loadSim })` wraps the Phase 3 `createHolds` and adds `join(body)`. Body must be exactly `{ "realm": "<id>" }`; the id is trimmed and lowercased and must match `[a-z0-9-]{1,24}`. The hold lives under `join-<id>` (memory only, max 100). A blank or bad id, a full save, or any extra key is refused (400) and loads no sim. No rule copied into `server/`.
- `server/index.mjs`: new route `POST /join` (sign-in required, 1 KB body) returns the hold view. A joined hold then answers the existing `GET /realm/join-<id>/hold` and `POST /realm/join-<id>/intent`.
- App: `joinRealm(code)` and `cleanJoinCode` in `packages/app/src/net/hold.ts` (blank id sends nothing). New `packages/app/src/JoinHoldCard.tsx` in the Cloud panel: type an id, **Join hold**, see the tick and stamps (polled every second), **Stamp**, **Leave**. It never loads or saves the solo crown; Leave returns to it unchanged.
- Tests: new `server/join.test.mjs` (two joins on one id see the same tick and stamp; a different id does not; blank id does not join; full state refused; solo ids never shared by a join; source copies no rules). `net/hold.test.ts` (join sends only the id; blank does not fetch). `settleOnLoad.test.ts` (a solo load still uses the local save and does not join).

## 2026-10-04 — Real-time shared hold, Phase 3 (wave/realtime-hold)

- Rule change, owner approved: ADR-011 in `docs/DECISIONS.md` and new INVARIANTS §17. A shared hold may run `packages/sim` on the server; solo play does not. `AGENTS.md` non-negotiables updated to match. Committed before the code.
- Sim: new `packages/sim/src/actions/stamp.ts`, `tryStamp(state, by)` (one `stamp` record in the input log at the current tick, nothing else changes) and `listStamps(state)`. Exported from the sim index.
- New `server/hold.mjs`: `createHolds({ clocks, isShared, loadSim })`. In memory, one hold per shared realm id (max 100). Loads the sim as-is with Vite `runnerImport` of `packages/sim/src/index.ts`, only on the first touch of a shared hold. Tick comes from the Phase 1 realm clock. Accepts one intent, exactly `{ "type": "stamp" }`; anything else, a full save included, is refused (400). Pending intents go in on the next tick boundary through `tryStamp`, then `TickEngine.settleTicks` runs to the clock tick. Never reads or writes a solo save; no rule copied into `server/`.
- `server/index.mjs`: `SHARED_REALMS` (empty `Set`), `GET /realm/:id/hold` and `POST /realm/:id/intent` (auth required, 1 KB body). Both return 404 `not a shared realm` for every realm today, so the live server never loads the sim.
- App: new `packages/app/src/net/hold.ts` (`readHold`, `sendStamp`). `settleOnLoad` joins the hold (`joinHold`) only for a shared realm; solo never calls it. `sharedRealmId` still returns null. Solo catch-up and the local save unchanged. No UI.
- Live game unchanged: no realm is shared.
- Tests: `server/hold.test.mjs` (two readers same tick; a stamp from one is visible to the other after the next tick boundary; full client state refused; unshared realm gets no hold and loads no sim; live server shares nothing; hold source copies no rules and touches no saves); `packages/sim/src/actions/stamp.test.ts`; `packages/app/src/net/hold.test.ts`; `settleOnLoad.test.ts` (solo never joins a hold).

## 2026-10-04 — Real-time save, Phase 2 (wave/realtime-save)

- `server/savegate.mjs`: `gateSave(raw, prev, elapsedMs, replace, shared)`. With `shared`, every upload is refused with 409 `Shared realm: the server copy wins.` (`SHARED_REALM`, `conflict: true`), with or without `replace=1`, even with no server copy yet. The `PUT /save` handler already returns the server save on a conflict.
- `server/index.mjs`: `SHARED_SAVES` (empty `Set` of account ids) feeds that flag. No realm is shared. No sim on the server; no shared hold.
- App: new `packages/app/src/game/loadSaved.ts`. On autosave load, a shared realm pulls the server save (`pullSave`), loads it instead of the local copy, and writes it over the IndexedDB cache; server unreachable → the cache is shown. Solo returns the local state object untouched, then `settleOnLoad` / `applyOfflineProgress` as before.
- Live game unchanged: `sharedRealmId` still returns null and `SHARED_SAVES` is empty.
- Tests: `server/savegate.test.mjs` (tampered, replace, solo-valid and first uploads all refused on a shared realm; solo default unchanged); `packages/app/src/game/loadSaved.test.ts` (shared reload returns the server save after a local edit and rewrites the cache; solo reload returns the local save with no server read; server down shows the cache).

## 2026-10-04 — Real-time wire, Phase 1 (wave/realtime-wire)

- New `server/realmclock.mjs`: `createRealmClocks(now)`, one `createClock` per realm id, kept in memory. First ask starts that realm's clock at 0; later asks never restart it. Bad ids (not `[a-zA-Z0-9_-]{1,64}`) and a full table (10,000 clocks) return null.
- New route `GET /realm/:id/tick` → `{ realmId, tick }`, 400 `bad realm` on a bad id. No auth, no save read or write, no sim on the server.
- App: `packages/app/src/net/realmClock.ts` (`fetchRealmTick`) and `packages/app/src/game/settleOnLoad.ts`. On autosave load, a shared realm reads the server tick and skips offline catch-up; a solo realm runs `applyOfflineProgress` as before. `sharedRealmId` returns null, so no realm is shared and the live game is unchanged. Solo tick loop and file import untouched.
- Root `npm test` now also runs `packages/app` vitest (new `test` script and `vitest.config.ts` in the app).
- Tests: `server/realmclock.test.mjs` (first ask 0, +250 ms → 2, no restart, separate ids, bad ids); `packages/app/src/game/settleOnLoad.test.ts` (solo calls `applyOfflineProgress` and never fetches; shared reads the tick and skips catch-up).

## 2026-10-04 — Real-time clock, Phase 1 (wave/realtime-clock)

- New `server/clock.mjs`: `TICK_MS` (100 ms, from `TICKS_PER_SECOND`), `ticksBetween(startMs, nowMs)`, and `createClock(now)` with `start()` / `tick()`.
- Unstarted clock stays at 0; time going backward never gives a negative tick, and a started clock never counts down.
- No sim on the server, no save read or write. Not wired into `server/index.mjs`. Browser, offline catch-up, and live solo game unchanged.
- Tests: `server/clock.test.mjs` (0 ms → 0, 100 ms → 1, 250 ms → 2, unstarted, backward).

## 2026-10-04 — Real-time spec (wave/realtime-spec)

- Docs only. New `docs/REALTIME.md`: a three-phase plan (Clock, Save, Shared hold). Not started; no code or endpoints.
- `HANDOFF.md`, `ROADMAP.md`, `docs/obsidian/03 Roadmap.md`: the parked real-time item points at `docs/REALTIME.md`, still parked.
- `HANDOFF.md` rebase recipe now matches the owner's steps (`git checkout --theirs` on the four doc files, `git add`, `git rebase --continue`).

## 2026-10-04 — Docs current (wave/docs-current)

- Docs only. `HANDOFF.md` rewritten as one current handoff: all "Active wave (... not merged)" sections removed (those slices are live), culture/unit table, first-dawn gift, both owner folders, short rebase recipe.
- `ROADMAP.md` and `docs/obsidian/03 Roadmap.md` match the live set. People job counts and keep-gate cards dropped from near-term (shipped). Parked: another dawn gift, real-time spec (server clock, server save, shared hold).
- `USER-NOTES.md`: placeholder-icon lines for Ranger, Banner, Outrider, Warden, Lancer corrected.
- `AGENTS.md`: slice rule — the four doc files update in the same commit as any player-visible or sim change.

## 2026-10-04 — Gemini Culture Marches (bakeoff/gemini-culture-marches)

- **Render: dedicated march meeple silhouettes for Ranger, Banner, Outrider, Warden, Lancer (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/render/src/index.test.ts`)**:
  - **Unit Resolution (`primaryUnitTypeForMarch`)**: Marches consisting predominantly of `ranger`, `banner`, `outrider`, `warden`, or `lancer` now resolve directly to their specific unit type (with tier priority `lancer: 8, outrider: 7, ranger: 6, warden: 4, banner: 4`).
  - **Visual Gear Palettes (`unitPalette`)**: Defined dedicated configurations for `ranger` (hood, shortbow), `banner` (pennant), `outrider` (shortlance, mounted), `warden` (roundshield), and `lancer` (longlance, mounted).
  - **5 Dedicated Meeple Drawers**:
    - **Ranger** (`drawRangerMeeple`): Nimble runner stride, mist-blue cloak cowl (`0x475569`/`0x1e293b`) with pointed peak, shadowed face with keen cyan scout eye glint (`0x38bdf8`), back quiver, and hunting recurve short bow (`0xca8a04`) with taut string (`0xf8fafc`) and nocked bodkin arrow (`0xd4a359`/`0xffffff`).
    - **Banner** (`drawBannerMeeple`): Disciplined marching stride, glen-green cloak (`0x4d7c0f`/`0x365314`), granite kettle helm (`0x78716c`), tall upright spear shaft (`0x5c3818`) with steel leaf head (`0xffffff`), and small waving swallowtail pennant (`0xa3e635`/`0xfacc15`).
    - **Outrider** (`drawOutriderMeeple`): Fast galloping scout horse in dun/salt coat (`0x78716c`), salt-white mane and bridle, rider with billowing salt-grey cloak (`0xa8a29e`/`0x57534e`), and couched compact short lance (`0xd4a359`) with sharp steel tip (`0xf1f5f9`).
    - **Warden** (`drawWardenMeeple`): Heavy marsh guard stride, fen-reed cloak (`0x3f6212`/`0x1a2e05`) with bone toggle clasp (`0xfef08a`), conical iron kettle helm (`0x4b5563`), prominent round wicker-reed boss shield (`0x292524` rim, `0x65a30d` reed face, `0xd1d5db` iron boss), and sturdy marsh-wood thrusting spear (`0x5c3818`/`0xf8fafc`).
    - **Lancer** (`drawLancerMeeple`): Heavy mountain warhorse (`0x334155`) with galloping legs and steel chanfron forehead armor (`0xcbd5e1`), visored greathelm knight in billowing peak-white cloak (`0xf8fafc`/`0xffffff`) with silver mountain peak brooch, and exceptionally long tournament shock lance (`0x64748b`) with circular vamplate handguard disc (`0x94a3b8`) reaching `+facing * 18` with diamond-forged steel point (`0xffffff`).
  - **Board March Painting (`paintBoardMarches`)**: Dispatches player marches composed predominantly of any of these 5 units to their respective silhouette drawers.
  - **Legacy Preservation**: Militia, spearman, archer, cavalry, and older march meeples strictly preserved. Mist, Glen, Salt, Fen, and Peak keep silhouettes strictly preserved.
  - **Invariants**: Camera math, zoom, and tile click hit-testing untouched. Zero changes to `packages/sim`, `server`, `packages/app/src/tabs/*`, or `theme.css`.

## 2026-10-03 — Gemini Culture Keeps (bakeoff/gemini-culture-keeps)

- **Render: miniature keep silhouettes & isometric keeps for Mist, Glen, Salt, Fen, Peak (`packages/render/src/tokens.ts`, `packages/render/src/buildings.ts`, `packages/render/src/index.ts`, `packages/render/src/index.test.ts`)**:
  - **Dedicated Miniature Silhouettes (`drawMiniatureKeep`)**: On the board and world view, the player home keep renders the culture they picked:
    - **Mist**: Low reed roof (wide low-pitched reed thatch `0xca8a04`/`0x92400e`, sod ridge `0x4d7c0f`), low wet-stone walls (`cy - 7`), peat smoke wisp, and an ethereal drifting pale mist veil (`0xe2e8f0`/`0xf1f5f9`).
    - **Glen**: Stone quarry keep (cyclopean quarry plinth, rough-hewn granite blocks `0x78716c`/`0x57534e`, quarry courses) with a green turf slope (`0x4d7c0f`/`0x65a30d`/`0x365314`) hugging the southwest flank, and timber quarry crane with suspended stone block.
    - **Salt**: Timber yard keep (fortified squared timber log walls `0x854d0e`/`0x5c3818` with dovetail notches, stacked lumber logs flanking entry) with a steep grey salt-crusted shingle roof (`0xd6d3d1`/`0xa8a29e`, salt frost ridge `0xf1f5f9`).
    - **Fen**: Stilt cottage keep (heavy wooden pilings `0x292524` with cross-bracing, stilt cottage walls `0x6b7280`, mossy reed thatch `0x4d7c0f`) over a dark water pool (`0x090d16`/`0x0f172a` with animated ripples and wetland bulrushes), with warm amber lantern glowing over the dark water.
    - **Peak**: Tall white keep (soaring dressed limestone walls `0xf8fafc`/`0xcbd5e1` reaching `cy - 16`) crowned with an alpine sculpted snow cap (`0xffffff`/`0xe0f2fe`), crystalline icicles hanging from corbels (`0xbae6fd`), and high alpine mast.
  - **Isometric Hold Grid Keep (`drawIsometricBuilding`, `drawKeepPlayerCulture`)**: The hold keep on the isometric board also renders the full-fidelity cultural architecture matching these exact silhouettes.
  - **Western & Older Kits Preserved**: Cedar, sand, steppe, islands, and western keeps remain completely unchanged.
  - **Non-Negotiables**: Camera math, zoom, and tile click hit-testing untouched. Ranger, Banner, Outrider, Warden, and Lancer marches untouched. Zero changes to `packages/sim`, `server`, `packages/app/src/tabs/*`, or `theme.css`.

## 2026-10-03 — First-dawn stores (wave/dawn-stores)

- **Sim: first-dawn gift (`packages/sim/src/actions/prestige.ts`)**: the first Second Dawn now grants +1 militia, +20 food and +10 wood on the new crown. Once per save, tracked by `flags.dawn_gift`. Later ascends reset to the plain 25 food / 35 wood with no units.
- Tests in `packages/sim/src/actions/prestige.test.ts`: first dawn has the gift, second dawn does not repeat it, a refused ascend grants nothing.

## 2026-10-03 — Gemini 28px Lancer Chip on Lancer Card (bakeoff/gemini-lancer)

- **App HUD: 28px Lancer Chip on Lancer Card (`packages/app/src/hud/LancerChip.tsx`, `packages/app/src/hud/lancer-chip.css`, `packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/render/src/index.test.ts`)**:
  - **Living Lancer Chip (`LancerChip`)**: 28px iconic heavy shock cavalry chip for the Lancer card in the Army tab. Features mountain warhorse in charging gallop with steel chanfron armor, armored lancer knight in visored greathelm, heavy couched long lance with circular vamplate handguard disc and diamond-forged steel point with fluttering pennon, and a billowing peak-white cloak with alpine frost highlights and silver mountain peak brooch clasp.
  - **Living Reactive States**:
    - **Unlocked/Open** (`open = true`): Gleaming peak-white mantle highlights (`#f8fafc` / `#cbd5e1`), shining steel lance point, and subtle peak-frost silver aura drop-shadow (`rgba(226, 232, 240, 0.55)`).
    - **Locked** (`open = false`): Muted dusk tones (`grayscale(0.4)`, `opacity: 0.65`) indicating the lancer awaits Horse lore study.
  - **Card Integration**: Mounted directly on the Lancer card in `UnitCard.tsx` via `<LancerChip size={28} open={open} />`. Additionally, `UnitIcon.tsx`'s `case "lancer":` renders dedicated mountain warhorse, armored lancer knight, heavy long lance, and peak-white cloak art.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on all pips, wrappers, and SVGs.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/lancer-chip.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new unit stats.

## 2026-10-03 — Gemini 28px Warden Chip on Warden Card (bakeoff/gemini-warden)

- **App HUD: 28px Warden Chip on Warden Card (`packages/app/src/hud/WardenChip.tsx`, `packages/app/src/hud/warden-chip.css`, `packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/render/src/index.test.ts`)**:
  - **Living Warden Chip (`WardenChip`)**: 28px iconic unit chip for the Warden card in the Army tab. Features hold guard defender with sturdy short spear (marsh-wood shaft, leaf-shaped forged steel head, and golden reed bindings), wicker-reed woven round boss shield with reinforced iron rim on off-arm, layered fen-reed cloak with rush frills and carved bone toggle clasp, and conical iron kettle helm.
  - **Living Reactive States**:
    - **Unlocked/Open** (`open = true`): Radiant fen-reed moss green and golden reed tassels (`#65a30d` / `#84cc16` / `#eab308`), gleaming spear point, and subtle fen-reed aura drop-shadow (`rgba(101, 163, 13, 0.45)`).
    - **Locked** (`open = false`): Muted cold marsh dusk tones (`grayscale(0.4)`, `opacity: 0.65`) indicating the warden awaits Screening study.
  - **Card Integration**: Mounted directly on the Warden card in `UnitCard.tsx` via `<WardenChip size={28} open={open} />`. Additionally, `UnitIcon.tsx`'s `case "warden":` renders dedicated hold guard, short spear, round shield, and fen-reed cloak art.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on all pips, wrappers, and SVGs.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/warden-chip.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new unit stats.

## 2026-10-03 — Peak culture and lancer unit (wave/culture-unit-5)

- **Sim:** added the `peak` culture (`content/cultures.ts`). Once the player has a finished keep, `visionRange` in `systems/fog.ts` adds +1 through `keepVisionCultureBonus` (`systems/culture.ts`). It is a flat +1, not +1 per keep level. `NPC_CULTURE_IDS` is unchanged, so existing seeds don't shift.
- **Sim:** added the `lancer` unit (`content/units.ts`): knight cost, power 6, `trainTicks` 60. It is unlocked by the existing **Horse lore** study, the same one knights use, and gets the same stables discount in `trainCostMultiplier`. Knight is unchanged.
- Tests: `systems/cultureUnit5.test.ts`. No change to raid math, ascend, mist, ranger, glen, banner, salt, outrider, fen, warden, or existing costs.

## 2026-10-02 — Fen culture and warden unit (wave/culture-unit-4)

- **Sim:** added the `fen` culture (`content/cultures.ts`). Each finished cottage holds +1 citizen through `cottageCultureBonus` (`systems/culture.ts`), which `housingCap` in `systems/housing.ts` adds. Work plots are unchanged. `NPC_CULTURE_IDS` is unchanged, so existing seeds don't shift.
- **Sim:** added the `warden` unit (`content/units.ts`): skirmisher cost, power 3, `trainTicks` 30. It gets the same archery-range discount as skirmisher in `trainCostMultiplier`. New lectern study `screening` (180 ticks, food 20 / wood 12, barracks or academy, keepMin 0) unlocks it. Skirmisher is unchanged and still needs no study.
- Tests: `systems/cultureUnit4.test.ts`. No change to raid math, ascend, mist, ranger, glen, banner, salt, outrider, or existing costs.

## 2026-10-02 — Gemini 28px Outrider Chip on Outrider Card (bakeoff/gemini-outrider)

- **App HUD: 28px Outrider Chip on Outrider Card (`packages/app/src/hud/OutriderChip.tsx`, `packages/app/src/hud/outrider-chip.css`, `packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/render/src/index.test.ts`)**:
  - **Living Outrider Chip (`OutriderChip`)**: 28px iconic unit chip for the Outrider card in the Army tab. Features an agile scout horse in forward charging gallop with salt-frosted mane and flowing tail, short couched scout lance with forged leaf point and pennon, and a billowing salt-grey cloak with sea-mist highlights pinned by a salt-silver brooch clasp, with a conical iron scout helm.
  - **Living Reactive States**:
    - **Unlocked/Open** (`open = true`): Radiant salt-grey mantle highlights (`#cbd5e1` / `#94a3b8`), gleaming lance point, and subtle salt-silver aura drop-shadow (`rgba(148, 163, 184, 0.5)`).
    - **Locked** (`open = false`): Muted dusk tones (`grayscale(0.4)`, `opacity: 0.65`) indicating the outrider awaits Horse lore study.
  - **Card Integration**: Mounted directly on the Outrider card in `UnitCard.tsx` via `<OutriderChip size={28} open={open} />`. Additionally, `UnitIcon.tsx`'s `case "outrider":` renders dedicated scout steed, short couched lance, and salt-grey cloak art.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on all pips, wrappers, and SVGs.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/outrider-chip.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new unit stats.

## 2026-10-02 — Salt culture and outrider unit (wave/culture-unit-3)

- **Sim:** added the `salt` culture (`content/cultures.ts`). It gives each lumber camp a flat +1 wood per tick through `woodCultureBonus` (`systems/culture.ts`), which `rateFor` in `systems/economy.ts` adds. `NPC_CULTURE_IDS` is unchanged, so existing seeds don't shift.
- **Sim:** added the `outrider` unit (`content/units.ts`): cavalry cost and stats, power 5, `trainTicks` 50. `unitUnlocked("outrider")` waits on the existing `horse` study, same as cavalry. Cavalry is unchanged.
- Tests: `systems/cultureUnit3.test.ts`. No change to raid math, ascend, mist, ranger, glen, banner, or existing costs.

## 2026-10-02 — Gemini 28px Banner Chip on Banner Card (bakeoff/gemini-banner)

- **App HUD: 28px Banner Chip on Banner Card (`packages/app/src/hud/BannerChip.tsx`, `packages/app/src/hud/banner-chip.css`, `packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/render/src/index.test.ts`)**:
  - **Living Banner Chip (`BannerChip`)**: 28px iconic unit chip for the Banner card. Features tall ash wood spear, leaf-shaped forged steel spearhead, flying swallowtail heraldic pennant with scarlet stripe, billowing glen-green cloak fastened with a stone/bronze ring brooch clasp, iron kettle helm, and highland round targe shield.
  - **Living Reactive States**:
    - **Unlocked/Open** (`open = true`): Vibrant glen-green cloak (`#4d7c0f` / `#65a30d`), bright golden swallowtail pennant with scarlet stripe, and subtle glen-green drop-shadow aura.
    - **Locked** (`open = false`): Muted stony-glen dusk tones (`#475569` / `#52525b`) indicating the banner warrior is in drill preparation awaiting Drill study.
  - **Card Integration**: Mounted directly on the Banner card in `UnitCard.tsx` via `<BannerChip size={28} open={open} />`. Additionally, `UnitIcon.tsx`'s `case "banner":` renders dedicated spear, small pennant, and glen-green cloak art.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on all pips, wrappers, and SVGs.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/banner-chip.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new unit stats.

## 2026-10-02 — Glen culture and banner unit (wave/culture-unit-2)

- **Sim:** added the `glen` culture (`content/cultures.ts`). It gives each quarry a flat +1 stone per tick through `quarryCultureBonus` (`systems/culture.ts`), which `rateFor` in `systems/economy.ts` adds. `NPC_CULTURE_IDS` is unchanged, so existing seeds don't shift.
- **Sim:** added the `banner` unit (`content/units.ts`): spearman cost and stats, power 3, `trainTicks` 30. Added the `drill` study (`systems/research.ts`). `unitUnlocked("banner")` waits on it.
- Tests: `systems/cultureUnit2.test.ts`. No change to raid math, ascend, mist, ranger, or existing costs.

## 2026-10-02 — Gemini 28px Ranger Chip on Ranger Card (bakeoff/gemini-ranger)

- **App HUD: 28px Ranger Chip on Ranger Card (`packages/app/src/hud/RangerChip.tsx`, `packages/app/src/hud/ranger-chip.css`, `packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/render/src/index.test.ts`)**:
  - **Living Ranger Chip (`RangerChip`)**: 28px iconic unit chip for the Ranger card. Features cowl hood with peaked liripipe, shadowed face with keen gleaming eyes, recurve woodland composite longbow with taut string and nocked bodkin arrow, billowing mist-blue cloak with golden leaf brooch clasp, and swirling morning mist wisps.
  - **Living Reactive States**:
    - **Unlocked/Open** (`open = true`): Vibrant mist-blue cloak (`#0284c7` / `#38bdf8`), golden leaf brooch clasp, warm seasoned ash bow, and subtle mist-blue drop-shadow aura.
    - **Locked** (`open = false`): Muted dusk fog tones (`#475569` / `#64748b`) indicating the ranger is shrouded in cold morning mist awaiting Fieldcraft study.
  - **Card Integration**: Mounted directly on the Ranger card in `UnitCard.tsx` via `<RangerChip size={28} open={open} />`. Additionally, `UnitIcon.tsx`'s `case "ranger":` renders dedicated hood, bow, and mist-blue cloak art.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on all pips, wrappers, and SVGs.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/ranger-chip.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new unit stats.

## 2026-10-02 — Mist and ranger in the UI (wave/culture-unit-ui)

- **App:** `ArmyTab.tsx` gets a ranger lock note (Fieldcraft), the footnote names Fieldcraft, and the range discount line says archers/rangers.
- **App:** `UnitIcon.tsx` draws ranger with the archer bow art. Mist was already in `CulturePicker` from `CULTURES`.

## 2026-10-02 — Mist culture and ranger unit (wave/culture-unit)

- **Sim:** added the `mist` culture (`content/cultures.ts`). It gives each farm a flat +1 food per tick through `farmCultureBonus` (`systems/culture.ts`), which `rateFor` in `systems/economy.ts` adds. NPC seeding now draws from `NPC_CULTURE_IDS` (the original five), so existing seeds don't change.
- **Sim:** added the `ranger` unit (`content/units.ts`): archer cost, power 4, `trainTicks` 40. Added the `fieldcraft` study (`systems/research.ts`). `unitUnlocked("ranger")` waits on it. Ranger gets the archery range discount (`actions/train.ts`).
- Tests: `systems/cultureUnit.test.ts`. No change to raid math, ascend, or existing unit costs.
 
## 2026-10-02 — Gemini 28px Dawn Seal Pip on Second Dawn Card (bakeoff/gemini-dawn-seal)

- **App HUD: 28px Dawn Seal Pip on Second Dawn Card (`packages/app/src/hud/DawnSealPip.tsx`, `packages/app/src/hud/dawn-seal.css`, `packages/app/src/hud/DawnCard.tsx`, `packages/app/src/hud/dawn-card.css`, `packages/render/src/index.test.ts`)**:
  - **Living Dawn Seal Pip (`DawnSealPip`)**: 28px stamped royal solar wax seal celebrating the Second Dawn. Features dual hanging silk ribbons with swallowtails, scalloped poured wax pool, raised bezel ring, milled matrix rim, and stamped sigil of the rising sun above the horizon with celestial sunburst rays, crowned by the Second Crown crest and morning star glint.
  - **Living Reactive States**:
    - **Risen/Active** (`dawned = true` / `ach_ascend` completed): Rich molten gold wax (`#d97706`), bright golden bezel (`#f59e0b`), celestial white dawn sun (`#ffffff`), glowing morning rays (`#fef08a`), and radiant solar aura.
    - **Dormant** (`dawned = false` / "not yet"): Antique dusk slate/bronze seal (`#334155` / `#475569`) with cool pewter horizon and dormant sun awaiting ascension.
  - **Strictly Non-Blocking**: `pointer-events: none !important` on all pips, wrappers, and SVGs.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/dawn-seal.css` and `packages/app/src/hud/dawn-card.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new actions.

## 2026-10-02 — Gemini Keep Room Living Pips (bakeoff/gemini-keep-rooms)

- **App HUD: Small Living Pips on Hall, Wall, and Yard Cards (Bed, Wall, Anvil) (`packages/app/src/hud/BedPip.tsx`, `packages/app/src/hud/AnvilPip.tsx`, `packages/app/src/hud/KeepRoomPip.tsx`, `packages/app/src/hud/keep-room-pips.css`, `packages/app/src/KeepInterior.tsx`, `packages/render/src/index.test.ts`)**:
  - **Living Bed Pip (`BedPip`)**: 16px medieval timber cot with carved oak posts, linen bolster pillow, and folded blanket. Features living reactive state: warm bedside candlelight flame when occupied or housing full (`pop >= cap`), red medic cross when wounded are resting on cots. Mounted on Hall room tab and Hall fact cards (Keep, People, Plots), and Yard Beds/Healing cards.
  - **Living Wall Pip (`WallPip`)**: 16px ashlar stone curtain wall with battlements, gatehouse arch with portcullis, and emerald green ring status jewel stud (warm amber when open). Mounted on Wall room tab and Wall fact cards (Walls, Ring, Gate).
  - **Living Anvil Pip (`AnvilPip`)**: 16px forged steel blacksmith anvil on iron-banded oak stump with conical bick, striking face, and hammer. Features living reactive state: cherry-red heated iron billet with radiant flying sparks when works are active. Mounted on Yard room tab and Yard Keep edge card.
  - **Unified Component (`KeepRoomPip`)**: Resolves room kind ("hall", "wall", "yard") or symbol ("bed", "wall", "anvil").
  - **Strictly Non-Blocking**: `pointer-events: none` on all pips and SVGs.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/keep-room-pips.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new rooms.

## 2026-10-01 — Keep room cards (wave/keep-rooms)

- **App HUD**: Keep interior Hall, Wall, and Yard rooms show their facts as `.sc-work-card` cards. Hall: Keep level, People, Plots (slot counts, same numbers as the keep header). Wall: Walls (HP, rim/total), Ring (closed/open), Gate (up + HP / down). Yard: Beds (wounded/beds, seconds per treat from `healTicks`), Healing (treating count + seconds left), Keep edge count. Wall and Yard work lists are read-only work cards. No new rooms, no heal math change. Styles only in `keep-room.css`; `theme.css`, `packages/sim`, `server` untouched. Files: `packages/app/src/hud/keep-room.css`, `KeepInterior.tsx`.

## 2026-10-01 — Gemini Faction Seals & Spoils Wax Seals (bakeoff/gemini-faction-seals)

- **App HUD: 24px Faction Seal Pips (Order, Pact, Guild) and Spoils Craft Wax Seals (`packages/app/src/hud/FactionSealPip.tsx`, `packages/app/src/hud/faction-seals.css`, `packages/app/src/hud/WaxSealPip.tsx`, `packages/app/src/WorldPanel.tsx`, `packages/app/src/tabs/CrownTab.tsx`, `packages/render/src/index.test.ts`)**:
  - **24px Faction Seal Pips (`FactionSealPip`)**: Distinct signet seals on the three faction cards in WorldPanel:
    - **Order (Amber Compact)**: Sunburst beaded amber wax seal with knightly cruciform blade and golden studs.
    - **Pact (Salt Road Pact)**: Crimson blood-wax seal with crossed treaty stilettos and faceted salt diamond covenant emblem.
    - **Guild (Free Artisans Guild)**: Imperial emerald bronze wax seal with master craftsman hammer, drafting compass calipers, and bullion coin boss.
    - **Sworn Member Insignia**: Glowing green laurel insignia ring with crown emerald stud when the player has sworn into the faction.
  - **Spoils Craft Wax Seals (`WaxSealPip`)**: 16px red wax seal with ribbon tails and imperial crown insignia mounted on each Spoils craft card in Crown Tab (`CrownTab.tsx`), illuminating when crafted/owned.
  - **Strictly Non-Blocking**: `pointer-events: none` on all seals and wrappers; card buttons, join/leave faction actions, and craft actions work unobstructed.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/faction-seals.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). No new factions or crafts.

## 2026-10-01 — Crown and faction cards (wave/crown-factions)

- **App HUD**: Crown Spoils crafts and Achievements are now `.sc-work-card` cards (same craft and achievement text). Save/Export/Import/New Game stay buttons in one card row. World faction rows are cards with stance and Join/Leave. Army Treat label reads heal seconds from sim `healTicks` (4s with Barracks yard, 5s without); no hardcoded 5s fallback. Styles only in `crown-card.css`; `theme.css`, `packages/sim`, `server` untouched. Files: `packages/app/src/hud/crown-card.css`, `tabs/CrownTab.tsx`, `WorldPanel.tsx`, `tabs/ArmyTab.tsx`.

## 2026-10-01 — Gemini Button Pips (bakeoff/gemini-button-pips)

- **App HUD: 16px Icon Pips on Leftover Buttons for Build, Study, and Holiday (`packages/app/src/hud/button-pips.css`, `packages/app/src/hud/HolidayPip.tsx`, `packages/app/src/hud/HallChip.tsx`, `packages/app/src/hud/ScrollPip.tsx`, `packages/app/src/tabs/KingdomTab.tsx`, `packages/app/src/KeepInterior.tsx`, `packages/app/src/ResearchBar.tsx`, `packages/app/src/ChromeDock.tsx`, `packages/app/src/TesterBar.tsx`, `packages/render/src/index.test.ts`)**:
  - **Build Pips (`HallChip`)**: Adds 16px isometric building chips to the Kingdom tab building picker palette, the Cottage hint button, Raising works items, Improving upgrades items, and the Keep Interior building palette.
  - **Study Pips (`ScrollPip`)**: Adds 16px parchment scroll pips with sepia script lines and wax seal to lectern study research buttons (`ResearchBar.tsx`), active studying progress rows (`status="ready"`), and mastered study rows (`status="claimed"`).
  - **Holiday Pips (`HolidayPip`)**: Adds 16px holiday emblem pips (`packages/app/src/hud/HolidayPip.tsx`) rendering established holiday prop emblems (🎃 All Hallows, 🎄 Midwinter, 🪺 Dawn Feast, 🌕 Harvest Moon, ☀️ Midsummer, ⚔️ Common Days) to the Holiday selector in `ChromeDock.tsx` and `TesterBar.tsx`.
  - **Button-Safe Nesting**: Enhanced `HallChip` with `as?: "div" | "span"` (defaults to `"div"`), allowing clean inline button content.
  - **Strictly Non-Blocking**: `pointer-events: none` on all pips and wrappers.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/button-pips.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). 311 render tests pass; 239 sim tests pass; app builds cleanly.

## 2026-10-01 — Gemini Map Strip Pips (bakeoff/gemini-map-pips)

- **App/Render HUD: Map Strip Under the Board with Small Heraldic Pips (`packages/app/src/hud/map-strip.css`, `packages/app/src/hud/WallPip.tsx`, `packages/app/src/hud/VisionPip.tsx`, `packages/app/src/WallLine.tsx`, `packages/app/src/VisionLine.tsx`, `packages/app/src/tabs/KingdomTab.tsx`, `packages/render/src/index.test.ts`)**:
  - **Single Work-Card Strip**: Groups the hold summary line, `WallLine`, and `VisionLine` into a unified `.sc-work-card.sc-map-strip` under the kingdom board with distinct cells and a shared hints drawer.
  - **Keep Crest Pip (`RealmCrestPip`)**: 20px player crown heraldic shield displayed alongside the hold name.
  - **Wall Pip (`WallPip`)**: 20px crenellated ashlar stone wall with battlements, wall-walk terrace, gatehouse arch, and status stud (emerald green `#3fb950` when wall ring closed, warm amber `#d29922` when open).
  - **Vision Pip (`VisionPip`)**: 20px stone watchtower spire with projecting parapet walkway, iron beacon brazier, burning flame, and radiant vision glints when vision range expands beyond base.
  - **Slot Pips**: Preserves the strict "No new facts" invariant by not adding slot counters to the kingdom map strip where slots are not shown in plain text.
  - **Strictly Non-Blocking**: `pointer-events: none` on all pips and wrappers.
  - **Dedicated Styles**: Stored in `packages/app/src/hud/map-strip.css`; `theme.css` strictly untouched.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). 302 render tests pass; 239 sim tests pass; app builds cleanly.

## 2026-10-01 — Gemini World Crest Pips (bakeoff/gemini-world-crests)

- **App/Render HUD: 28px RealmCrestPip Heraldic Pips Across World View (`packages/app/src/WorldPanel.tsx`, `packages/app/src/tabs/WorldTab.tsx`, `packages/render/src/index.test.ts`)**:
  - **Player Banner**: Integrates 28px `RealmCrestPip` for `player` crown banner.
  - **Known Crowns**: Replaces legacy raw crests with 28px `RealmCrestPip` displaying live diplomatic stances (friendly, wary, hostile, war, truce) with cold frost aura effects during conflict.
  - **Factions**: Displays 28px `RealmCrestPip` for faction leader realms and all member kingdoms.
  - **Watchtower Warning / Dust on the Road**: Adds 28px `RealmCrestPip` with `stance="war"` immediately identifying incoming hostile hosts.
  - **Foreign War (Clash Header & Action Buttons)**: Displays 28px `RealmCrestPip` with `stance="war"` for both clashing realms in the header and within each "Send levy" dispatch button.
  - **Holds on the Board**: Displays 28px `RealmCrestPip` with stance indicators for every occupied hold across the board (and styled keep placeholder for unoccupied keeps).
  - **Strictly Non-Blocking**: `pointer-events: none` on all crest elements ensures click-through on all buttons and cards.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). 298 render tests pass; 239 sim tests pass; app builds cleanly.

## 2026-10-01 — Gemini Store Buildings Isometric Chips (bakeoff/gemini-stores)

- **Render Only: Distinct Isometric Chips for Granary, Mint, Sawmill, Mason Yard (`packages/render/src/buildings.ts`, `packages/render/src/index.test.ts`)**:
  - **Four Store Buildings Distinct Identity**: Replaces generic boxes with four uniquely tailored architectural profiles for the four cap buildings, both finished and unfinished scaffolding:
    - **Granary (Food Cap)**:
      - *Finished*: Elevated on stone mushroom staddle piers (`0x64748b`, `0x94a3b8`) to deter vermin, horizontal louvered timber walls (`0x854d0e`), steep thatched gable roof with dormer vent and wheat ear finial (`0xd4a359`, `0xfacc15`), hoist gantry beam with suspended flour sack (`0xfef08a`), and loading dock props (golden grain barrels, flour sack stacks, wooden grain crates).
      - *Scaffolding*: Staddle stone piers, sill framing with exposed floor joists, partial floor planking, scaffolding standards/cross-braces, A-frame hoist with dangling hook rope, timber framing stacks, and peg bucket.
    - **Mint (Gold Cap)**:
      - *Finished*: Heavy rusticated ashlar plinth courses (`0x64748b`), iron-studded security door with brass padlock (`0x1e293b`, `0xd4a359`), pedimented stone niche with gilded royal crown medallion (`0xfacc15`), sloped slate roof (`0x334155`), rotating flywheel coin press with active smelting crucible (`0xf97316`, `0xfef08a`), and bullion props (gold ingot stacks, open brass coin chests, balance scale).
      - *Scaffolding*: Excavated foundation ditch trench, low stone masonry plinth courses with mortar scoring, wooden vault centering arch former, multi-tier scaffold platforms with ladders, timber derrick crane hoisting stone lintel block, and mortar mixing trough with lime and trowel.
    - **Sawmill (Wood Cap)**:
      - *Finished*: River timber millhouse with mossy shake roof (`0x78350f`, `0x451a03`), excavated millrace flume channel with rushing stream (`0x38bdf8`), active rotating waterwheel with foaming spray droplets (`0xe0f2fe`, `0xbae6fd`), log carriage track with timber log and spinning circular steel saw blade (`0xcbd5e1`), fresh golden sawdust mounds (`0xfef08a`), and stacked lumber cords.
      - *Scaffolding*: Excavated millrace flume channel with shoring stakes, wheel bearing posts and axle spindle (waterwheel unmounted), open timber framing with exposed King-post roof trusses open to sky, saw carriage track under construction, carpenter sawhorses, and crosscut saw.
    - **Mason Yard (Stone Cap)**:
      - *Finished*: Stonecutter atelier with slate shed roof (`0x334155`), heavy banker workbench with half-dressed stone block, steel chisels and wooden mallets (`0x475569`, `0xcbd5e1`, `0x78350f`), high wooden tripod derrick shear-legs crane with hoist tackle lifting ashlar block (`0x78350f`, `0x94a3b8`), finished ashlar stone pallet stacks, displayed carved classical column (`0xf8fafc`), and marble urn (`0xe2e8f0`).
      - *Scaffolding*: Chalked ground grid layout with red corner boundary pegs, high wooden derrick tripod shear-legs crane with hoist tackle and rough boulder, partial stonecutter shed framing, raw unquarried stone boulders with steel splitting wedges, and mason sledgehammer.
  - **All Culture Kits Supported**: Cedar Kin (log crib granary, boulder vault mint, fir flume sawmill, megalithic mason lodge), Sand Banner (whitewashed mudbrick granary, horseshoe arch mint, donkey drive sawmill, open-air marble atelier), Wind Host (grain wagon, armored cart-yurt mint, tripod log crane sawmill, balbal stele mason), Tide Clans (stilt palafito granary, sunken coral vault mint, tidal paddle sawmill, coral-stone lodge).
  - **Untouched Existing Kits**: Farm, Cottage, Quarry, and Watchtower remain strictly untouched.
  - **Construction Scaffolding Invariant**: Store buildings in progress skip cracked stone overlay and display authentic timber scaffolding structures.
  - **Strictly Non-Blocking**: `pointer-events: none` on all graphics layers.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). 295 render tests pass; 239 sim tests pass; app builds cleanly.

## 2026-10-01 — Hall room bonus (wave/hall-bonus)

- **Sim: `systems/hallBonus.ts`** (new): `hallRoomBuilt`, `hallBonuses`, `HALL_ROOM_NEEDS`, `YARD_HEAL_TICKS` (40), `LECTERN_STUDY_MULT` (0.8).
- **Sim: Yard bonus** (`systems/ward.ts`): `healTicks(state)` returns 40 with a finished player Barracks, else `HEAL_TICKS` (50). `tryTreatWounded` uses it.
- Lectern and Gate report effects that already exist (Academy -20% study time; gate HP in the wall soak). No retune.
- **App: Hall panel** (`KeepHall.tsx`): "Room bonus: ..." line for the open room; Yard treat text reads the real heal time.
- No raid timing, train cost, server or theme.css changes. 234 tests pass (+5); app build clean.

## 2026-10-01 — Gemini Cottage Bunk and Bedrolls (bakeoff/gemini-cottage-bunk)

- **Render Only: Cottages Show a Small Bunk / Bed Pip (`packages/render/src/buildings.ts`, `packages/render/src/index.ts`, `packages/render/src/index.test.ts`)**:
  - **Hold Capacity Detection (`isHoldFull`, `hasFreeBed`)**: Reads caller overrides (`options.isFull`, `options.isHoldFull`, `options.isPacked`, `options.hasFreeBed`, `options.pop`, `options.beds`), test flags in `state.flags`, and derives live occupancy from `population(state, realmId) >= housingCap(state, realmId)`.
  - **Free Bed State (`pop < beds` / `hasFreeBed`)**:
    - "One empty bunk" rendered inside/alongside the cottage doorway.
    - Clean white/cream linen mattress (`0xf8fafc`) with neat folded sheet crease (`0x94a3b8`).
    - Smooth, plump empty pillow (`0xffffff`).
    - Vacant green indicator pip (`0x4ade80`) showing open housing capacity.
    - Suppresses occupied blankets, extra bedrolls, and packed duffle bags.
  - **Full Hold State (`pop === beds` / `pop >= beds` / `isFull`)**:
    - "Cottages look packed (extra bedrolls)":
    - Occupied bunk with deep crimson wool quilt (`0x991b1b`) and indented pillow (`0xd6d3d1`).
    - Extra Bedroll 1: rolled deep emerald wool roll (`0x065f46`) bound with twin amber leather straps (`0xb45309`) and roll spiral (`0x059669`).
    - Extra Bedroll 2: thick rust terracotta wool roll (`0x9a3412`) stacked crosswise with gold cord & buckle (`0xfacc15`) and roll spiral (`0xea580c`).
    - Extra Bedroll 3: compact navy blue travel roll (`0x1e3a8a`) tucked at the footboard with tie cord (`0x78350f`).
    - Packed canvas bedding duffle sack (`0x713f12`, `0xa16207`).
    - Packed red indicator pip (`0xef4444`) signaling full hold capacity.
    - Suppresses vacant white linen and green pip.
  - **All Cultures Supported**: Western cottages as well as Cedar Kin, Sand Banner, Wind Host, and Tide Clans all render cultural timber frames and proper free vs packed bedroll states.
  - **Construction Gating**: Scaffolding (`completesAtTick !== null`) suppresses bunks and bedrolls until the cottage is finished.
  - **Strictly Non-Blocking**: `pointer-events: none` on all graphics layers.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). 290 render tests pass; 229 sim tests pass; app builds cleanly.

## 2026-09-30 — Gemini Stall/Post Column Slot Pips on War (bakeoff/gemini-slot-pips)

- **HUD: N/max Column Slots as Stall/Post Pips on War (`packages/app/src/hud/SlotPip.tsx`, `packages/app/src/hud/slot-pip.css`, `packages/app/src/WarRoom.tsx`, `packages/app/src/AppShell.tsx`)**:
  - **Column Slots Visualization**: Renders `N/max` column capacity as small medieval muster stall/post pips where `filled = a column out`:
    - **Empty Pip (`filled = false`)**: Column is at home; dormant dark timber post, stall hitch rail, cold iron ring, flat timber post cap, subdued opacity (0.42).
    - **Filled Pip (`filled = true`)**: Column is deployed on the road; hoisted standard with red-and-gold swallowtail war pennant (`#dc2626`, `#facc15`), golden spearhead finial (`#facc15`), glowing amber beacon spark (`#fef08a`), and active harness.
  - **Mounted on War**:
    - **War Tab Button (`AppShell.tsx`)**: Compact `N/max` and stall/post pips rendered directly on the `War` tab button, allowing instant monitoring of marching columns from any game screen.
    - **War Tab Screen (`WarRoom.tsx`)**: Mounted alongside the `Columns` card header with `N/max` count and full-size stall/post pips.
  - **Strictly Non-Blocking**: `pointer-events: none` on all wrappers, text, and SVGs.
  - **Invariants**: `packages/sim`, `server`, and `packages/app/src/theme.css` strictly untouched (0 diff against `origin/main`). 284 render tests pass; 229 sim tests pass; app builds cleanly.

## 2026-09-30 — Keep Hall (wave/keep-hall)

- **App: Hall panel on the home inspect card** (`packages/app/src/KeepHall.tsx`, `keep-hall.css`, `ProvinceInspect.tsx`): three rooms, Yard / Lectern / Gate.
  - Yard: train buttons (x1/x5/x10, unlocked units, `tryTrain`), barracks queue count, wounded/beds and Treat (`tryTreatWounded`). Messages copied from Army.
  - Lectern: renders the existing `ResearchBar`.
  - Gate: `WallLine`, first incoming column (name only if `watchtowerWarning`), Sally (`canSally`/`trySally`). Message copied from War.
  - Room shows "Not built" until its finished building exists for the player: Barracks / Academy / Gate.
- No sim, server or theme.css changes. 229 tests pass; app build clean.

## 2026-09-30 — Raid mercy (wave/raid-mercy)

- **Sim: home raid timing** (`packages/sim/src/systems/raidMarch.ts`): `HOME_RAID_FIRST_TICK = 3000`, `HOME_RAID_GAP = 1500`. `maybeNpcRaid` refuses before the first tick or within the gap of the last launch (`flags.home_raid_last`). Rival AI still checks every 500 ticks.
- **Sim: sieges fight the column** (`march.ts`, `combat.ts`): home-hold arrivals call `resolveBattle(..., { attackerForce: march.force, wallSoak: wallHp })`. Attacker stacks are capped to the column; only column losses are written back to the rival's units.
- **Sim: wall soak** (`resolver.ts`): `resolveRounds` takes an optional `wallSoak` pool that absorbs damage aimed at the defender before it reaches stacks. Logs "The walls give way." when spent.
- **Playtest**: first home launch 3000 (was 1000), 7 columns in 12000 ticks (was 23), 6/6 held (was 0/22).
- **Tests**: `raidMercy.test.ts` (new), `raidMarch.test.ts` (+gap test), harness test runs 3100 ticks and asserts first raid ≥ 3000 and at least one hold. 229 tests pass.

## 2026-09-30 — Gemini Player Keep Intact vs Cracked Stone / Dark Windows / No Proud Banner When Breached (bakeoff/gemini-keep-breach)

- **Render Only: Player Keep Intact vs Cracked Stone / Dark Windows / No Proud Banner When Breached (`packages/render/src/buildings.ts`, `packages/render/src/tokens.ts`, `packages/render/src/index.ts`)**:
  - **Breached Flag Detection (`isHoldBreached`)**: Safely inspects hold defense state from `options.isBreached`, `options.breached`, `options.stands === false`, boolean flags in `state.flags` (`isBreached`, `breached`, `holdBreached`, `stands === false`), string flags (`hold: "breached"`, `defense: "breached"`, `last_siege: "breached"`), direct state properties, and `state.wars` siege battle outcomes (`w_siege_...` where `status !== "defender_won"`).
  - **When the Hold Stands**:
    - Intact dressed ashlar stone masonry and foundation talus plinth.
    - Warm royal high window with flickering candlelight (`0xfef08a`).
    - Soaring proud royal standard waving on mast with golden finial ball (`0xfacc15`) and tabard/gold (`0xb91c1c`, `0xfacc15`).
    - Courtyard brazier with leaping orange/gold fire (`0xf97316`, `0xfef08a`).
    - Warm golden chimney flue glow (`0xfef08a`) and billowing hearth smoke.
  - **When Breached**:
    - **Cracked Stone**: Jagged structural fracture fissures descending across tower faces (`0x0f172a`, `0x09090b`), branching mortar cracks (`0x1e293b`), chipped masonry rubble divots (`0x1e293b`, `0x09090b`), foundation plinth fracture lines (`0x09090b`), chipped crenel tooth fissure (`0x09090b`), buckled portcullis bars (`0x475569`).
    - **Dark Windows**: Zero warm candlelight (`0xfef08a`), dark shattered void (`0x09090b`), broken glass fractures (`0x334155`).
    - **No Proud Banner**: Snapped / splintered flagpole stump (`0x5c3818`, `0x78350f`), zero golden finial ball (`0xfacc15`), zero royal standard banner polygon (`0xb91c1c`, `0xfacc15`). Charred slate heraldic shield above archway (`0x1e293b`) split by fracture fissure.
    - **Cold Hearth**: Zero warm golden flue glow (`0xfef08a`), cold extinguished brazier (cold ash `0x1e293b`, zero `0xf97316` flame), faint dying spent soot wisp (`0x475569`, low alpha). Subdued stone level pips (`0x64748b`).
  - **All Culture Kits Supported**: Cedar Kin longhouse, Sand Banner courtyard keep, Wind Host felt ger, and Tide Clans pile-house keep all reflect cracked timbers/mudbrick/lattice/stilts, dark louvers/toono/vents with zero `0xfef08a` warm glow, extinguished braziers/cauldrons, and snapped mast stumps without proud standards.
  - **Miniature Keep Supported (`drawMiniatureKeep`)**: Overworld and band keeps reflect intact banner, window candle, and coronet crest when hold stands; wall fracture crack, dark window void, and snapped mast stump without banner/coronet when breached.
  - **Invariants**: Strictly non-blocking (`entitiesLayer.eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. No invented sim fields. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — Gemini Missing Rim Wall Segments Faint Timber Stake / Gap Mark (bakeoff/gemini-wall-gap)

- **Render Only: Missing Rim Wall Segments Faint Timber Stake / Gap Mark (`packages/render/src/tiles.ts`, `packages/render/src/index.ts`)**:
  - **Open Wall Ring Visualized**: Along the 48 hold perimeter rim tiles (`isRimTile(gx, gy)`), missing wall segments receive a faint timber stake / gap mark so an open ring is immediately obvious to the player.
  - **Finished Segments Stay As They Are**: Tiles with finished walls or gates (`completesAtTick === null`) remain completely untouched; no gap mark or stake is drawn over finished segments.
  - **Closed Ring Support**: When all 48 rim segments are finished (or the ring is closed), `listMissingRimSegments` returns `[]` and `paintMissingRimSegments` clears the layer, rendering zero gap marks.
  - **Visual Detail (`drawRimGapMark`)**:
    - **Foundation Trench Alignment Line**: Faint scored foundation trench notch (`0x52525b`, alpha 0.35) and mason's lime chalk alignment mark (`0xa8a29e`, alpha 0.42) tracing the perimeter wall footing between adjacent rim tiles.
    - **Contact Shadow & Loam Clods**: Soft ground contact shadow on the turf (`0x000000`, `0x271708`) with dark turf loam clods at the peg base (`0x3f220c`, `0x2e1908`).
    - **Slender Timber Stake**: Aged oak/cedar peg (`0x78350f`) with sunlit highlight (`0xa16207`), chamfered heartwood top cut (`0xc29d62`), and vertical woodgrain split (`0x451a03`).
    - **Neck Cord Binding**: Weathered cord/chalk binding around the neck (`0xa8a29e`, knot `0x78716c`).
    - **Winter Frost Cap**: In winter / midwinter themes, a delicate frost dusting (`0xf1f5f9`) caps the top of the stake.
    - **Distinct from Courtyard Stakes**: No bright red ribbon and no gold hint glow.
  - **Dedicated Layer**: `rimGapLayer = new Graphics()` added to `holdContainer` directly above `groundLayer` with `eventMode = "none"` (`pointer-events: none`).
  - **Helpers Exported**: `isMissingRimSegment`, `listMissingRimSegments`, `drawRimGapMark`, `paintMissingRimSegments`.
  - **Invariants**: Strictly non-blocking (`rimGapLayer.eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. No invented sim fields. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — Gemini Watchtower Unlit Beacon When No Worker, Staffed Beacon On (bakeoff/gemini-tower-unlit)

- **Render Only: Finished Watchtower Unlit / Cold Beacon When No Worker, Staffed Beacon On (`packages/render/src/buildings.ts`, `packages/render/src/tokens.ts`, `packages/render/src/index.ts`)**:
  - **Finished Watchtower With No Worker**: When a finished watchtower is unstaffed, its beacon brazier is cold and unlit (`0x0f172a`, `0x334155`, `0x475569` dark charcoal & grey ash bed), with zero active fire flames, zero radiant glow halo, and zero gold glint.
  - **Staffed Watchtower**: When a worker/guard is assigned (`isBuildingStaffed(state, b)` is true, or `isStaffed: true`), the beacon burns bright with lively leaping fire tongues (`0xf97316`, `0xfacc15`, `0xffffff`), radiant warm glow halo (`0xfde047`), ember sparks, and gold glint diamond star atop the masthead.
  - **All Culture Kits Supported**: Western stone tower, Cedar Kin lookout cage, Sand Banner minaret cupola, Wind Host nomad pylon, and Tide Clans lighthouse all reflect active beacon flames/cyan light/smoke when staffed, and cold unlit dark charcoal/lantern glass when unstaffed.
  - **Keep-Yard Annexes Supported**: Miniature watchtowers in keep-yard annexes also check staffing and extinguish to cold charcoal ash when unstaffed.
  - **Helper Exported**: `isBuildingStaffed(state, buildingOrCoords, gx, gy)` safely resolves staffing from building flags, `state.citizens` tile assignments, and `sim.staffBonus`.
  - **Invariants**: Strictly non-blocking (`entitiesLayer.eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. No invented sim fields. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — Gemini Soft Gold Ground Ring Hint Glow (bakeoff/gemini-hint-glow)

- **Render Only: Soft Gold Ground Ring Hint Glow on Empty Work Plots (`packages/render/src/tiles.ts`, `packages/render/src/index.ts`)**:
  - **App Hint Glow**: When the app passes a plot id (e.g. `{ x, y }` or `"x,y"`), that empty plot receives a radiant **soft gold ground ring** (`drawPlotGlowRing`) rendered as an isometric 2:1 ground ellipse on the turf with ambient diffused gold light pool (`0xfde047`, `0xfacc15`), warm amber glow stroke (`0xf59e0b`), radiant core ring (`0xfef08a`), specular rim (`0xffffff`), breathing pulse animation, and shimmering cardinal nodal pips.
  - **Other Empty Stakes Stay Plain**: For all other empty plots, `glowAlpha = 0` so other empty stakes remain plain without gold rings.
  - **Low Opacity Fallback**: If the app does not pass a plot id (`hintPlot` is `null` or `undefined`), every empty hold plot glows at low opacity instead (`glowAlpha = 0.22`), inviting construction across the courtyard without overwhelming the diorama.
  - **Built Plots Stay Untouched**: Occupied plots (buildings, scaffolding, keep) render zero stakes and zero empty plot rings.
  - **API Additions**:
    - `parsePlotCoord(plot)`: parses `{ x, y }` or string coordinates (`"4,2"`, `"plot_4_2"`, `"4-2"`).
    - `drawPlotGlowRing(g, wx, wy, phase, alpha)`: renders the 2:1 isometric gold ground ring.
    - `drawPlotStake(..., glowAlpha)`: accepts optional `glowAlpha` parameter.
    - `paintEmptyPlotStakes(..., hintPlot)`: accepts optional `hintPlot` identifier.
    - `MapRenderer`: updated `sync(state, selectedProvinceId, hintPlot)` and added `setHintPlot(hintPlot)`, `getHintPlot()`, and `"sc-hint-plot-change"` window event listener.
  - **Invariants**: Strictly non-blocking (`plotStakesLayer.eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. No invented sim fields. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — Gemini Empty Work Plots Wooden Survey Stake (bakeoff/gemini-plot-stake)

- **Render Only: Empty Work Plots on the Player Hold Get a Small Wooden Stake (`packages/render/src/tiles.ts`, `packages/render/src/index.ts`)**:
  - **Surveyor Stakes on Empty Work Plots**: Every open interior plot on the player hold (`!isRimTile` and `!ROAD_TILES.has(...)` not occupied by a building) receives a small authentic wooden surveyor's stake.
  - **Visual Anatomy (`drawPlotStake`)**:
    - **Contact Shadow & Loam Turf Indent**: Soft ground contact shadow (`0x000000`, `0x271708`) with dark turf indent where the peg was struck into the earth.
    - **Fresh Soil Clods**: Small displaced dark loam soil clods (`0x3f220c`, `0x2e1908`) around the base.
    - **Chiseled Timber Stake**: Hand-hewn aged oak timber peg (`0x78350f`) with left sunlit wood grain highlight (`0xb45309`), chamfered mallet-struck heartwood top cut (`0xd97706`), and fine vertical wood grain split (`0x451a03`).
    - **Hemp Twine Neck Wrap**: Pale straw hemp twine cord (`0xfef08a`) tightly bound around the stake's upper neck.
    - **Fluttering Surveyor Ribbon**: Bright vermilion red marker ribbon (`0xef4444`, `0xb91c1c`) with golden tie knot bead (`0xfacc15`) fluttering dynamically in the breeze with `phase`.
    - **Seasonal Adaptation**: In winter / midwinter themes, a soft pale dusting of snow and frost (`0xf8fafc`) caps the top of the stake.
  - **Built Plots Stay As They Are**: Occupied plots (buildings, scaffolding, keep, cottage, farm, quarry, lumber camp, etc.) render zero stakes; existing structures render untouched.
  - **Rim Forts & Cobblestone Streets Excluded**: Rim tiles (reserved for perimeter walls and gate) and cobblestone road network remain clean and unobstructed.
  - **Helpers Exported**: `isEmptyWorkPlot`, `listEmptyWorkPlots`, `drawPlotStake`, `paintEmptyPlotStakes`.
  - **Dedicated Layer**: `plotStakesLayer = new Graphics()` added to `holdContainer` with `eventMode = "none"` (`pointer-events: none`), ensuring 100% unimpeded tile click and hover interactions.
  - **Invariants**: Strictly non-blocking (`eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — Gemini Player Keep Chimney/Hearth Smoke When Hold Has People, Quieter If Empty (bakeoff/gemini-keep-hearth)

- **Render Only: Player Keep Chimney/Hearth Smoke When Hold Has People; Quieter If Empty (`packages/render/src/buildings.ts`, `packages/render/src/tokens.ts`, `packages/render/src/index.ts`)**:
  - **Western Keep**:
    - Built an Ashlar stone chimney stack on the hold roof terrace (`0x64748b`, `0x475569`, `0x334155`) with masonry course line, coping cap, and dark flue cavity (`0x09090b`).
    - When hold has people (`hasPeople: true`): warm golden hearth glow (`0xfef08a`) at the chimney flue, and 4 animated billowing hearth smoke puffs rising and expanding (`0xe2e8f0`, `0xf1f5f9`, `0xf8fafc`, `0xffffff`) with radii expanding up to 5.0 and wind drift.
    - When hold is empty (`hasPeople: false`): "quieter if empty" — chimney stack stands cold with a faint, thin quiet wisp (`0xd1d5db`, `0xe5e7eb`, radius <= 1.6, alpha 0.12–0.18).
  - **Culture Keeps**:
    - `cedar`: active billowing hearth smoke with warm hearth glow at louvers when populated, single quiet wisp when empty.
    - `sand`: mudbrick hearth chimney pot on flat terrace with warm golden flue glow and drifting spice smoke when populated, faint wisp when empty.
    - `steppe`: warm central hearth fire glow at the toono crown ring with billowing nomad hearth smoke when populated, single quiet wisp when empty.
    - `islands`: driftwood hearth smoke rising from roof smoke cowl with warm ember glow when populated, faint wisp when empty.
  - **Miniature Home Keep**:
    - Board map home keep displays warm ember glint and billowing smoke puffs when populated, quieter faint wisp when empty.
  - **Population Detection**:
    - Added `holdHasPeople(state, realmId)` checking `state.citizens` (`c.realmId === realmId`), `sim.population(state, realmId)`, or garrisoned `state.units`. Also supported via `hasPeople` flag in `BuildingDrawOptions` and `MiniatureKeepOptions`.
  - **Invariants**: Strictly non-blocking (`eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — Gemini Closed Home Gate Lit Lamp & Warm Slot, Open Gate Dark & Raised (bakeoff/gemini-gate-lamp)

- **Render Only: Closed Home Gate Reads as Lit Lamp / Warm Slot; Open Gate is Dark / Raised (`packages/render/src/buildings.ts`)**:
  - **Closed Home Gate**: Features an exterior wall sconce lantern with glowing glass (`0xfacc15`), white-hot flame core (`0xffffff`), and radiant warm amber halo (`0xfde047`, `0xf59e0b`), along with a horizontal viewing slot glowing with warm interior golden light (`0xfef08a`, `0xf59e0b`) casting an ambient light spill (`0xfde047`, `0xfbbf24`) across the doorstep.
  - **Open Home Gate**: Portal passage reads as deep dark cavernous shadow (`0x09090b`, `0x050507`), cold unlit lantern glass, zero warm amber glow, and a raised heavy iron portcullis with crossbars and spiked arrow teeth hoisted high into the ceiling vault.
  - Implemented across Western gatehouse and all 4 culture kits (`cedar`, `sand`, `steppe`, `islands`).
  - **Invariants**: Strictly non-blocking (`eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — Gemini Finished Quarry Cut Stone, Crane & Piles, Unfinished Scaffolding (bakeoff/gemini-quarry-yard)

- **Render Only: Finished Quarry Cut Stone, Crane & Piles, Unfinished Scaffolding (`packages/render/src/buildings.ts`, `packages/render/src/tokens.ts`, `packages/render/src/index.ts`)**:
  - **Finished Quarry**: Displays excavated granite quarry pit bedrock, terraced rock shelves with chiseled face fractures, cut stone ashlar stacks on pallets (`0xcbd5e1`, `0x94a3b8`, `0xe2e8f0`) with carved mortar seams, a wooden A-frame crane with brass pulley wheel (`0xf59e0b`), steel cable, hoisted stone block, quarried rubble piles on that tile (`0x64748b`, `0x52525b`), wooden wheelbarrow loaded with stone chunks, and a steel mason pickaxe. Fully supported in both hold isometric tiles and keep-yard annexes.
  - **Unfinished Quarry**: Under construction, strictly renders authentic timber scaffolding (`drawQuarryScaffolding`) with corner uprights, ledger beams, diagonal X-braces with lashings, work staging plank deck, and hoist rope with dangling builder stone. Excluded from cracked stone damage overlay so it remains clean construction scaffolding.
  - **Invariants**: Strictly non-blocking (`eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff origin/main -- packages/sim server packages/app/src/theme.css` strictly empty. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — Gemini Finished Watchtower Clear Beacon & Gold Glint (bakeoff/gemini-tower-beacon)

- **Render Only: Finished Watchtower Clear Beacon & Gold Glint (`packages/render/src/buildings.ts`, `packages/render/src/tokens.ts`, `packages/render/src/index.ts`)**:
  - **Finished Watchtower**: Rendered with an active, brilliant beacon fire (vibrant orange/yellow flame tongues `0xf97316`, `0xfacc15`, white-hot core `0xffffff`, radiant warm halo `0xfde047`, and rising ember sparks `0xfef08a`), and a gleaming 4-point diamond star **gold glint** (`0xfacc15`, `0xffffff`) atop the beacon spire finial. Supported across Western and all culture kits (`cedar`, `sand`, `steppe`, `islands`) and keep-yard annex tokens.
  - **Unfinished Watchtower**: Strictly preserves authentic timber construction scaffolding (`drawWatchtowerScaffolding`) with upright corner posts, ledger cross-beams, diagonal X-braces, staging deck, and suspended building block. Zero beacon flames, zero radiant glow, zero gold glints.
  - **Invariants**: Strictly non-blocking (`eventMode = "none"`). Hit-test and camera math (`camera.ts`) 100% untouched. `git diff main -- packages/sim server` strictly empty. No `theme.css` changes. Zero `<<<<<<<` conflict markers anywhere in the repository.

## 2026-09-30 — Quarry / Watchtower hints (wave/hint-quarry-tower)

- New `packages/app/src/buildHints.ts`: `wallsStoneHint(state)` and `scoutGoldHint(state)`. Costs come from `getBuildingType(...).cost` times `buildCostMultiplier`, and `scoutCost(state)`. No hard-coded numbers.
- `KingdomTab.tsx`: amber hint line under the wall line when stone < Walls stone cost.
- `ProvinceInspect.tsx`: `sc-inspect-hint` line under Scout column when gold < scout cost (unscouted tiles only).
- No sim, server or theme.css changes.

## 2026-09-30 — Sim playtest harness (wave/playtest-harness)

- `packages/sim/src/harness/playtestHarness.ts`: `runPlaytest({ seed, ticks, turnEvery })` bot that builds cottage/farm, trains militia, scouts, gathers, marches once, builds walls/studies for the primer, and presses primer advance. Records tries/refusals per action, thrown errors, soft invariant failures, home raids, and peak resources. `playtestMarkdown(report)` gives deterministic output.
- `playtestHarness.test.ts` (in `npm test`): 3,000-tick run with no throws, and the same seed gives an identical report.
- `playtest.report.ts` + `vitest.playtest.config.ts`: `npm run playtest` writes the `<!-- sim-playtest -->` block in `docs/PLAYTEST.md` (the friends guide below it is kept).
- No `packages/sim` rule changes, no server or app changes.

## 2026-09-30 — Gemini Board-Only Seasonal Wash (bakeoff/gemini-season-wash)

- **Board-Only Seasonal Wash (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - `resolveBoardSeasonWash(state, province, visuals)`: determines seasonal wash characteristics reading `currentSeason(state)`:
    - **Winter**: Light snow / frost wash (`0xbae6fd` / `0xe0f2fe`, alpha 0.22) across all board tiles, delicate white frost rime (`0xffffff`), and subtle snow dusting flecks.
    - **Harvest** (`Autumn` or `harvest` holiday): Warm gold wash (`0xf59e0b`, alpha 0.22) restricted strictly to farms (`p.node === "field"`) and plains (`p.terrain === "plain"`), featuring golden rim highlights (`0xfde047`) and wheat glints (`0xfef08a`). Other terrain retains its natural look.
    - **Spring / Summer**: Zero wash (`hasWash: false`, alpha 0), leaving the base terrain artwork completely untouched.
  - `paintBoardProvinces`: applies tile-specific wash to the plateau, cliffs, and borders.
  - `OverworldAtlas.tsx`: SVG overworld map applies the tile-specific wash, frost rime, and harvest gold glow with `pointer-events: none`.
  - Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. March speed and farm yield untouched. No `theme.css` changes. Zero conflict markers.

## 2026-09-30 — Lofi dock stable (wave/lofi-stable)

- `music.ts`: removed the `lofiErrors` skip-ahead. The audio `error` event now sets `LofiStatus` `"missing"` and stops; no index change.
- New `LofiStatus` (`idle | playing | blocked | missing`), `getLofiStatus()`, `LOFI_STATUS_EVENT`. `play()` rejection `NotAllowedError` → `blocked`, `NotSupportedError` → `missing`, `AbortError` ignored.
- `playLofiTrack` pins the pick (`el.loop = true`); `ended` only advances unpinned play. A missing file is reloaded only on a new pick or mode switch; the global click `startMusicBed` retries `blocked` but not `missing`.
- Synth lofi fallback is silent while status is `missing`.
- `MusicDock.tsx`: `useLofiStatus`; status line `lofi-dock__status` replaces "Now playing" when blocked or missing.

## 2026-09-30 — Gemini Keep Room 2D Backdrops (bakeoff/gemini-rooms)

- **Distinct 2D Room Backdrops (`packages/app/src/RoomBackdrop.tsx`, `packages/app/src/KeepInterior.tsx`, `packages/app/src/keep-interior.css`)**:
  - `RoomBackdrop`: renders a tailored 2D backdrop banner and ambient background for each keep interior room:
    - **Hall**: **Throne dais** (`ThroneDaisBackdrop`) with a 3-tier elevated stone dais platform, ornate carved hardwood monarch throne with golden finials and royal tufted crimson velvet upholstery, Romanesque stone alcove arch, torch sconces casting ambient radial glows, and hanging heraldic wall tapestries.
    - **Wall**: **Wall walk** (`WallWalkBackdrop`) with stone curtain wall battlements, merlons with cruciform arrow slits, weathered timber sentry duckboards, iron tripod braziers with burning coals and rising embers, leaning sentry kite shield, and crossed halberds overlooking a twilight sky.
    - **Yard**: **Muddy yard** (`MuddyYardBackdrop`) with churned dark muddy soil, deep curved wagon wheel ruts, reflective rainwater puddles, weathered timber palisade fence, stacked barrels & crates, and soldier training quintain dummy.
  - **Invariants**: All art strictly enforces `pointer-events: none !important;` (`aria-hidden="true"`). Interactive plots, facts, and buttons remain 100% interactive. Hit-test and camera math (`camera.ts`) 100% untouched. `git diff main -- packages/sim server` strictly empty. Zero conflict markers.

## 2026-09-30 — Keep rooms (wave/keep-rooms)

- `KeepInterior.tsx`: Hall / Wall / Yard tabs (`role="tablist"`), local `useState<Room>`, default Hall.
- Hall: existing plot grid, legend, hint and build picker. Wall: `WallRoom` fact tiles (Wall HP, rim walls, ring, gate) plus the player's walls/gate list. Yard: `YardRoom` lists finished player works with `keepBonus > 1`.
- Shared `WorkList` shows HallChip, name, level or raising time, and plot.
- Header title now reads "· Keep". New `sc-keepin-room*`, `sc-keepin-facts`, `sc-keepin-list*`, `sc-keepin-empty` classes in `keep-interior.css`. No sim, render, server or theme.css changes.

## 2026-09-30 — HUD captains (wave/hud-captains)

- New `packages/app/src/hud/captainName.ts`: `captainName(id)` hashes the id (FNV-1a) into a 24-name list.
- `ForceCard` gains an optional `captain` prop, shown as a `sc-force-captain` line under the title.
- `WarRoom` passes `captainName(m.id)` / `captainName(g.id)` for scout, gather and hostile cards. Garrisons (keyed by province) get none.
- No sim, recall, sally or theme.css changes.

## 2026-09-30 — Save lock (wave/save-lock)

- `server/savegate.mjs`: stale uploads (lower tick, lower save version, or an input log missing the cloud's actions) throw `SaveGateError` with `conflict: true` and the message "Cloud has a newer hold." A lower-tick fresh game passes only with `replace`.
- `PUT /save?replace=1` passes `replace` to the gate. On a conflict the handler returns 409 `{ error, conflict: true, save }` with the stored save.
- `net/cloud.ts`: `CloudConflictError` (carries the cloud save); `pushSave(json, replace?)`.
- `CloudPanel`: auto-push, Push save and Share watch link all route conflicts to a **Cloud has a newer hold.** line with **Load cloud** and **Keep this game**.
- Tests in `server/savegate.test.mjs` for stale tabs, forked logs, version downgrades, and cheat checks staying non-conflict.

## 2026-09-30 — Keep interior (wave/keep-interior)

- New `KeepInterior.tsx`: courtyard grid of the home hold (16×10) from `state.buildings`, with HallChip, level, and rim / keep-yard / raising / improving markers, plus the build picker.
- Home hold inspect card gains an **Enter the keep** button; `AppShell` mounts the view on the Kingdom tab.
- `useGameEngine` exposes `tapHoldTile(x, y)`, the old map tile-click body unchanged; the canvas and the interior both call it.
- Styles in new `keep-interior.css`. No sim, render, server or theme.css changes.

## 2026-09-29 — Security gate (wave/security-gate)

- New `server/savegate.mjs`: every cloud save upload is checked before it is stored. Partial saves and resource-only patches are refused (400). Saves whose time or history does not line up with the last accepted save are refused (409). Oversized bodies are refused (413).
- `/save` accepts only whole-save `PUT` (and `GET`); other methods get 405. Invalid JSON returns 400 instead of throwing.
- `pushSave` surfaces the server's error text; the Cloud panel shows it on manual push.
- Tests: `server/savegate.test.mjs`; `server/ledger-http.test.mjs` now uploads a full save and checks a partial one is refused.
- No sim, economy, combat or theme.css changes. The server still does not run the sim.

## 2026-09-29 — Lofi radio (wave/lofi-radio)

- Music select (Off / Lofi / Realm) next to Holiday and Chrome. Persists in `sc-music`, default Off.
- `music.ts` gains `MusicMode`, `getMusicMode`, `setMusicMode`, `loadMusicMode`, a lofi `<audio>` player that plays all 33 lofi tracks in `public/audio/` (HoliznaCC0 `03`–`33`, `lofi-a`, `lofi-b`) in filename order and loops, skipping any that 404, and a slow synth lofi fallback when none load.
- The HUD "Music on/off" button toggles Off and the last picked mode. Holiday / battle recordings only play in Realm.
- Lofi dock (shown only in Lofi mode): Now playing (cleaned name), ‹ / › prev/next (wrap), and a select of every track; picking one plays it. Styles in `lofi-dock.css`.
- Audio files not committed yet. No sim, combat, gold or theme.css changes.

## 2026-09-29 — Primer v3 (wave/primer-v3)

- Primer step text now names live UI: resource strip, work cards, People job cards, Market offer cards, unit cards, inspect card groups (Tile / Owner / Forces / Hold), gold select rim, Scout column, Column box, War force cards / Last battle / diplomacy cards, World log, decrees, Latest event.
- Step ids, order, count (9) and advance checks unchanged. No economy / combat / win math touched.

## 2026-09-30 — Gemini Supply Cart Art & Load Silhouettes (bakeoff/gemini-supply)

- **Clearer Supply Cart with Draft Yoke, Timber Crates, and Load Silhouettes (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/app/src/hud/WarChip.tsx`, `packages/app/src/hud/ForceCard.tsx`, `packages/app/src/WarRoom.tsx`)**:
  - **Draft Yoke & Hitch Assembly**: Added arched hardwood yoke beam (`0x92400e`), under-neck iron yoke bow (`0x27272a`), central brass hitch ring (`0xd4a359`), and dual timber draft shafts connecting directly from yoke to wagon bolster.
  - **Timber Supply Crates**: Sturdy crates with plank slat seams, iron corner straps (`0x27272a`), and diagonal X-braces.
  - **Cargo Load Awareness (`resolveGatherLoadInfo`)**:
    - Full loaded haul: Stacked crates, bulging burlap sacks with golden twine ties, hooped barrels, node-specific resource cargo (logs, stone ashlars, gold coffers, wheat sheaves), heavy tie-down lashings, and green/gold load badge (`0x22c55e`).
    - Empty return: Light unburdened wagon silhouette with bare floorboard plank lines (`0x543007`), open side stakes (`0x27272a`), folded drop cloth, and slate badge (`0x64748b`) with empty cart icon.
    - WarChip & ForceCard: 24px cart icon updated with forward draft yoke and loaded/empty variants for gather cards.
  - **Invariants**: War, scout, and garrison art completely untouched. Hit-test and camera math (`camera.ts`) 100% untouched. All chips strictly `pointer-events: none !important;`. `git diff main -- packages/sim server` strictly empty. Zero conflict markers.

## 2026-09-30 — Gemini Seasonal Weather Particles (bakeoff/gemini-weather)

- **Seasonal Weather Precipitation Particles (`packages/render/src/weather.ts`, `packages/render/src/index.ts`, `packages/app/src/seasons/WeatherOverlay.tsx`, `packages/app/src/theme.css`)**:
  - **Weather Resolution (`resolveWeatherKind`, `resolveWeatherFromState`)**:
    - Light rain in autumn-ish wet seasons (`Autumn`, `Fall`, `Harvest`, `Halloween`).
    - Light snow in winter seasons (`Winter`, `Midwinter`).
    - Clear sky otherwise (`Spring`, `Summer`, `Easter`, `Midsummer`, default) with 0 precipitation particles.
  - **PixiJS Map Particles (`paintWeatherParticles`, `createWeatherParticles`)**:
    - Rain: slanted downward streaks with wind drift and subtle ground splash ripples at lower elevation.
    - Snow: soft crystalline circular snowflakes with cyan halo and gentle horizontal flutter.
    - Clear: graphics buffer cleanly cleared with 0 particles drawn.
    - Non-interactive: `particlesGraphic.eventMode = "none"` in hold view and `boardWeatherGraphic.eventMode = "none"` in board view.
  - **React WeatherOverlay & CSS**:
    - Updated `WeatherOverlay.tsx` to use `resolveWeatherKind`, rendering rain in autumn wet seasons, snow in winter, clear otherwise.
    - Added pointer-events isolation in `theme.css`: `.sc-weather-container, .sc-weather-container * { pointer-events: none !important; user-select: none !important; }`.
  - **Strict Invariants**:
    - Hit-test and camera math (`camera.ts`) 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere in the repository.
    - All tests passing (221 sim tests, 212 render tests; clean app build).

## 2026-09-29 — Gemini March Destination Tile Faint Rings (bakeoff/gemini-dest)

- **Tiles That Are a March Destination Get a Faint Ring (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/app/src/OverworldAtlas.tsx`, `packages/app/src/theme.css`)**:
  - **Color-Coded Faint Destination Rings (`paintBoardDestinationRing`)**:
    - Tiles that are already a march destination get a faint, elegant ring around the tile perimeter:
      - **Player march destination**: Warm luminous amber-gold palette (`0xf59e0b` ring, `0xd97706` glow, `0xfde047` pips).
      - **Hostile march destination**: Menacing crimson danger palette (`0xef4444` ring, `0xdc2626` glow, `0xfca5a5` pips).
    - Faint ground ring at the tabletop base plane with soft atmospheric glow (`alpha: 0.25 - 0.55`).
    - Faint elevated plateau ring on raised terrain facets with rear-facet sunlit shimmer.
    - Subtle cardinal corner bracket pips marking the tile vertices.
    - Subtle breathing pulse driven by phase and tile coordinates (`Math.sin(phase * 3 + p.x * 2 + p.y)`).
    - Covers both seen and unseen (fog/cloud) destination tiles so player scout routes remain readable.
    - Distinct from the thick, high-opacity gold player selection rim (`paintBoardSelectionRim`).
  - **March Destination Classification (`buildMarchDestinationMap`, `getTileMarchDestination`)**:
    - Automatically maps destinations of all active marches in `listMarches(state)` and gathers in `listGathersPresentation(state)`.
    - Hostile enemy warbands and raids take combat alert priority if both forces target the same province.
  - **Kingdom Atlas SVG Integration (`packages/app/src/OverworldAtlas.tsx`, `packages/app/src/theme.css`)**:
    - `<g className="sc-atlas-dest-ring" pointerEvents="none">` renders matching faint SVG destination rings on the kingdom map.
    - Enforced non-interactive pointer events (`pointerEvents: "none"` and `.sc-atlas-dest-ring { pointer-events: none !important; }`), ensuring clicks fall through to tile selections.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Full test suite passing (221 sim tests, 206 render tests; clean app build).

## 2026-09-29 — Gemini Rival Home Keeps Realm Crests (bakeoff/gemini-capitals)

- **Rival Home Keeps Show Small Realm Crest Above Keep (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`, `packages/app/src/theme.css`)**:
  - **Heraldic Escutcheon Crest Floating Above Keep (`drawRealmCrestAboveKeep`)**:
    - Rival and foreign NPC home holds show a distinct heraldic escutcheon crest floating above the keep apex (`cx`, `cy - 23.5`).
    - Tactile drop shadow onto keep air (`0x050403`), faction rim plaque (`pal.plaqueColor`, `pal.borderColor`), and inner faction pennant field (`pal.pennantColor`).
    - Faction-specific heraldic charge / sigil:
      - Iron March (`rival`): Crossed white blades with crimson central rivet and golden boss.
      - Silk Coast (`k_silk`): Golden nautical anchor and trident flukes.
      - Ash Nomads (`k_ash`): Steppe nomad arrowhead with amber core.
      - Veil Theocracy (`k_veil`): Radiant dawn star with deep violet center.
      - Glass Cities (`k_glass`): Faceted cyan prism diamond with white core.
      - Frost Holds (`k_frost`): Six-pointed crystalline snowflake.
      - Tide Princes (`k_tide`): Twin ocean surf waves.
      - Ember Concord (`k_ember`): Rising flame comet with golden ember core.
      - Bronze League (`k_bronze`): Classical bronze arch & anvil.
      - Custom / other realms: Heraldic chevron and realm stud.
    - Finial crown stud atop the shield rim and subtle animated breathing glint (`Math.sin(phase * 3 + cx)`).
  - **Player Home Retains Golden Coronet**:
    - The player's home keep retains its sovereign triple-peaked golden coronet (`0xfacc15`, `0xfde047`) and gilded royal frame.
    - Player home is 100% unchanged.
  - **Kingdom Atlas SVG Integration (`packages/app/src/OverworldAtlas.tsx`, `packages/app/src/theme.css`)**:
    - `<MiniRealmCrest>` renders corresponding SVG escutcheons on the kingdom map for foreign and rival keeps.
    - Non-interactive pointer events (`pointerEvents: "none"` and `.sc-atlas-realm-crest { pointer-events: none !important; }`), ensuring clicks fall through to tile selections.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Full test suite passing (221 sim tests, 201 render tests; clean app build).

## 2026-09-29 — Gemini Board Tiles Seasonal & Holiday Tint (bakeoff/gemini-season-tint)

- **Light Seasonal & Holiday Tint on Board Tiles (`packages/render/src/tokens.ts`, `packages/render/src/buildings.ts`, `packages/render/src/tiles.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - **Light Seasonal Tint Wash (`resolveBoardThemeVisuals`, `resolveBoardSeasonTint`, `paintBoardProvinces`)**:
    - Tabletop board tiles pick up a light seasonal tint wash from existing season/holiday state without hiding underlying terrain:
      - Spring: Fresh spring green (`0x86efac`, alpha 0.10).
      - Summer: Warm sunbeam yellow (`0xfef08a`, alpha 0.10).
      - Autumn: Luminous autumn gold (`0xf59e0b`, alpha 0.14).
      - Winter: Cool frost cyan (`0xbae6fd`, alpha 0.14).
      - Holiday packs (Halloween `0x581c87`, Midwinter `0x38bdf8`, Easter `0xc084fc`, Harvest `0xf59e0b`, Midsummer `0xfde047`).
  - **Terrain Preservation & Layering**:
    - Translucent tint wash is painted immediately above the base plateau fill (`pal.fill`) and before all isometric relief artwork, ensuring terrain features (trees, wildflowers, rocks, grass tufts, ridges, waves) remain 100% visible on top.
    - Cliff height faces in `paintTileHeightFace` pick up a subtle matching glazed wash on front-left and front-right facets.
  - **Kingdom Atlas Integration (`packages/app/src/OverworldAtlas.tsx`)**:
    - Evaluates `currentSeason(state)` and `detectCurrentHoliday()` to apply translucent SVG tint polygons with `style={{ pointerEvents: "none" }}` to seen provinces.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Full test suite passing (221 sim tests, 196 render tests; clean app build).

## 2026-09-29 — Gemini Board March Meeple Seconds Badge (bakeoff/gemini-eta)

- **Tiny Seconds Badge on Board March Meeples (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - **Deterministic Pixel Art Badge (`drawMarchEtaBadge`, `MARCH_ETA_GLYPHS_3X5`)**:
    - Each board march meeple that already has an arrival time (`m.arrivesTick` or `g.arrivesTick`) displays a tiny seconds countdown badge floating above its head (e.g. `4s`, `18s`, `0s`).
    - Compact rounded pill container with subtle drop shadow, dark translucent background (`0x090d16`), and crisp stroke border:
      - Player war/raid march: Warm golden amber (`pal.accentColor`) with golden hourglass pip.
      - Scout column: Celestial recon cyan (`0x38bdf8`) with cyan hourglass pip.
      - Gather column / expedition: Emerald green (`0x22c55e`) with harvest hourglass pip.
      - Garrison column: Royal blue (`0x3b82f6`) with defensive hourglass pip.
      - Hostile incoming warband: Menacing crimson (`0xdc2626`, `0xef4444`) with hazard skull pip.
    - 3x5 bitmap pixel font rendered via pure geometry rects, eliminating DOM font dependencies and guaranteeing 100% determinism in headless tests and WebGL.
    - Floating height dynamically tracks the marching meeple stride and head bob (`pawnY - 28 - bob`).
  - **Strict Pointer-Events None Guarantee**:
    - Pixi layer `boardPawnsLayer.eventMode = "none"` guarantees clicks never get blocked or intercepted.
    - Mini-map SVG `<g className="sc-atlas-march-eta-badge" style={{ pointerEvents: "none" }}>` with `.sc-atlas-march-eta-badge { pointer-events: none !important; }` in `theme.css`.
    - Clicks and hovers fall cleanly through to provinces, tiles, and hit tests underneath.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Full test suite passing (221 sim tests, 190 render tests; clean app build).

## 2026-09-29 — Gemini Cloud Veil on Unseen Tiles (bakeoff/gemini-fog)

- **Unseen Tiles Cloud Veil & Clear Seen Tiles (`packages/render/src/tiles.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - **High-Distinction Volumetric Cloud Veil (`paintFogHeightVeil`)**:
    - Unseen tiles on the tabletop board render as a distinct atmospheric cloud mass floating above the diamond tile, making the veil immediately and unmistakably distinguishable from solid terrain (peaks, rocks, wastes, plains, hills, shores).
    - Floating diffused aerial shadow on the tabletop plane (`0x000000`, `0x0f172a`), clearly detaching the airborne cloud bank from ground-level terrain.
    - Ethereal sky-mist atmospheric base stratum with cool celestial azure undertone (`0x38bdf8`, `0xdbeafe`) and soft underside shadow (`0x475569`, `0x94a3b8`).
    - Multi-tiered billowing cumulus cloud lobes spanning the full diamond width and height with brilliant pure white sunlit crests (`0xffffff`).
    - Windblown curving vapor wisps and trailing mist curls (`0xe0f2fe`, `0xffffff`) signaling living air and fog in motion.
    - Antique cartographer 8-point brass compass rose with warm golden star glint (`0xd4a359`, `0xfef08a`), the authentic cartographic seal of uncharted terra incognita.
    - Gentle floating hover animation (`bob`, `driftX`) across animation phases.
  - **Clear Seen Tiles**:
    - Seen provinces stay 100% clear on both tabletop board and atlas, displaying their crisp terrain plateaus, 3D height cliff faces, trees/props, resource node piles, camps, and keep-yard annexes.
  - **Kingdom Atlas Integration (`packages/app/src/OverworldAtlas.tsx`)**:
    - Evaluates `isProvinceSeen(state, p.id)` for each atlas province.
    - Unseen provinces stay an atmospheric SVG `<MiniCloudVeil>` with soft aerial shadow, celestial mist, billowing cumulus lobes, wind wisps, and brass compass star, completely hiding unexplored terrain.
    - Supports selection and inspect card scouting clicks while keeping the visual boundary distinct from explored lands.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Full test suite passing (221 sim tests, 182 render tests; clean app build).

## 2026-09-28 — Gemini Keep-Yard Annexes & Construction Scaffolding (bakeoff/gemini-yard)

- **Finished Keep-Yard Annexes and Scaffolding Around Home Tile Keep (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - **Keep-Yard Spatial Geometry & Adjacency (`listKeepYardBuildings`)**:
    - Identifies buildings on the home hold grid adjacent to the player's keep (`Math.abs(dx) + Math.abs(dy) === 1`), matching `keepBonus` economy logic.
    - Maps adjacent buildings to 4 isometric yard slots around the keep:
      - `west`: Rear-left flank (`cx - 11.5, cy - 3.8`)
      - `north`: Rear-right flank (`cx + 11.5, cy - 3.8`)
      - `south`: Front-left flank (`cx - 11.5, cy + 2.8`)
      - `east`: Front-right flank (`cx + 11.5, cy + 2.8`)
    - Evaluates construction state via `completesAtTick` (`null` = finished annex, non-null = unfinished scaffolding).
  - **Finished Buildings: Architectural Annexes (`drawKeepYardAnnex`)**:
    - Solid isometric ashlar/timber walls with sunlit and shaded facets.
    - Ground footprint shadow detaching building from terrain relief.
    - Pitched gabled roof with eaves or crenellated stone parapet wing with crest shield for military works.
    - Plinth foundation, dark doorway aperture, and warm flickering hearth/candlelight glow (`0xfef08a`).
    - Type-specific courtyard props: grain sacks for stores, firewood cords for timber/industry, ashlar stone blocks for masons/quarries, golden finial cross for chapels.
    - Cultural palettes across all 5 cultures: Western granite, Cedar log/timber, Sand limestone, Steppe felt/kurgan, Islands weathered driftwood.
  - **Unfinished Buildings: Authentic Timber Construction Scaffolding**:
    - Upright timber standards (corner posts) rising alongside sawdust turf debris.
    - Horizontal ledger beams and diagonal X-bracing.
    - Staging deck planks where laborers work.
    - Builder's rope hoist line suspending a cut stone ashlar block mid-air.
  - **Natural Depth Ordering (Not a Flat Stack)**:
    - In `drawMiniatureKeep`, rear annexes (`west`, `north`) are painted before the keep silhouette, and front annexes (`south`, `east`) are painted after the keep.
    - Annexes cluster naturally around the keep perimeter creating genuine 3D visual depth instead of a flat vertical stack.
  - **Kingdom Atlas Integration (`packages/app/src/OverworldAtlas.tsx`)**:
    - `OverworldAtlas` renders SVG mini annexes and scaffolding for home hold with identical isometric depth and styling.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Full test suite passing (221 sim tests, 177 render tests; clean app build).

## 2026-09-28 — Gemini Hold Gatehouse Open vs Shut Doors (bakeoff/gemini-gate)

- **Hold Gatehouse Open vs Shut Doors (`packages/render/src/buildings.ts`, `packages/render/src/index.ts`)**:
  - **Wall Ring Closed Detection (`isWallRingClosed`)**:
    - Automatically evaluates whether the hold's defensive wall ring is closed using existing state via `sim.hasClosedWallRing(state, realmId)` (requiring `>= 8` rim walls and a rim gate).
    - Also supports explicit test or flag overrides (`state.flags.isRingClosed`, `state.isRingClosed`).
    - Added `isRingClosed?: boolean` to `BuildingDrawOptions` and exported `isWallRingClosed` from `@second-crown/render`.
  - **Shut Doors on Closed Ring (`isRingClosed === true`)**:
    - Western gatehouse: Heavy oak double-doors shut tight meeting at the center with vertical plank seam, heavy blackened iron hinge straps with rivets, central iron drop bar / lock hasp, and lowered portcullis teeth.
    - Cedar Kin: Split-cedar double doors shut tight with cross-straps and lowered log portcullis.
    - Sand Banner: Brass-studded cedar double doors shut tight with bronze lattice portcullis.
    - Wind Host: Heavy cross-braced timber double gates barred shut against pylons.
    - Tide Clans: Weathered driftwood double doors shut tight with lowered bamboo portcullis.
  - **Open Doors on Open Ring (`isRingClosed === false`)**:
    - Double doors swing open inward in perspective against the door jambs/reveals, displaying 3D door leaf thickness and iron strap hinges.
    - Open vaulted portal reveals courtyard threshold road pavers and warm amber/golden lantern glow cast from within.
    - Portcullis is drawn raised high tucked under the archway lintel.
    - Applied across all 5 cultures: Western, Cedar, Sand, Steppe, and Islands.
  - **Interior / Non-Rim Gatehouses**: Un-hung open vaulted passage preserved as before.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Tests pass: 221 sim tests pass, 169 render tests pass (+5 new tests verifying ring detection, open vs shut gate graphics across all cultures, state inference, and invariants); app build clean.

## 2026-09-28 — Gemini Damaged Rim Wall Art Presentation with Low wallHp (bakeoff/gemini-wall-scar)

- **Damaged Rim Wall Art Presentation with Low wallHp (`packages/render/src/buildings.ts`, `packages/render/src/index.ts`)**:
  - **Wall HP Status Detection (`getWallHpStatus`, `isWallHpLow`)**:
    - Automatically checks `state.wallHp` (number or `{ cur, max }`), `state.wall_hp`, or `state.flags.wallHp` / `wall_hp` / `wallHpCur` / `wall_hp_cur`.
    - Returns `hasWallHp: false, isLow: false` when `wallHp` is not on state (undefined / null), ensuring full HP walls stay untouched.
    - Accurately computes `ratio = cur / max` against nominal intact wall ring baseline (~96–146 HP) or explicit `maxHp`, detecting low wall HP when `ratio < 0.60` or `cur <= 0`.
  - **Battle Scars & Missing Merlons Presentation**:
    - **Straight Rim Wall Curtain Spans (`drawCurtainSpan`)**:
      - Deep shadow fissure paths descending jaggedly down the vertical ashlar wall face with secondary branch cracks, sunlight highlight ridge accents, and fallen masonry rubble chunks at the plinth base.
      - Dynamic parapet crenellation damage: deterministic PRNG per merlon drops ~45% of merlons into missing gaps with crumbled mortar stumps, chips ~25% down to partial fractured height, and leaves remaining merlons intact with cultural coping stones.
    - **Corner Bastion Towers (`drawRimWallCurtain`)**: Shears away the front center merlon into an open jagged gap with a crumbled mortar stump, chips the sunlit merlon, and draws vertical stress fractures with fallen stone chips at the base.
    - **Pilaster Wall Buttresses**: Draws stress fracture lines across visible center wall buttresses.
    - **Gatehouse Curtain Wings (`drawGatehouseCurtainWings`)**: Adjacent connecting curtain wings display matching cracked masonry and battlement gaps across all 5 cultures.
  - **Full HP Walls Stay As They Are**: When walls are at full HP or when `wallHp` is absent from state, 100% full-height merlons and pristine stone curtain faces are rendered exactly as before.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera projection remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Tests pass: 221 sim tests pass, 164 render tests pass (+6 new tests verifying wallHp detection, low vs high HP thresholds, missing merlons, corner bastion cracks, gatehouse wings, and invariant preservation); app build clean.

## 2026-09-28 — Gemini Player Camps and Outposts Clearer Tent + Flag (bakeoff/gemini-camps)

- **Clearer Tent + Flag for Player Camps and Outposts (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - **Encampment Tent (`drawCampTentAndFlag`, `drawPlayerCampTentAndFlag`)**:
    - Replaces the rudimentary stake or primitive red triangle with an authentic pitched military pavilion tent: dual-tone canvas roof panels, timber apex ridgepole, scalloped valance eaves trim in faction tabard colors, dark arched entry flap, and cozy glowing lantern/hearth light.
    - Nomadic Steppe culture features a rounded felt yurt with conical dome and compression crown ring.
    - Angled tension guy ropes anchored by timber ground pegs with soft ground contact footprint shadows.
  - **Heraldic Flag Standard**:
    - Tall hardwood flagpole with iron ground bracket and polished finial sphere (customized per culture: cedar huntsman plume, steppe horsehair tuft, islands sea pearl).
    - Fluttering swallowtail heraldic banner waving in the wind with animated phase wave and golden chevron charge.
  - **Tile Integration**:
    - Player outposts on the board (`p.occupantRealmId === "player"` and `p.id !== homeProvinceId`) now prominently display the clear tent + flag when unguarded, and the fortified pavilion with garrison armor when guarded.
    - Wild / neutral camp nodes (`p.node === "camp"`) render a rugged weathered hide canvas tent with crimson camp pennant.
  - **Overworld Atlas `<MiniCamp>`**:
    - Adds `<MiniCamp>` SVG component to `OverworldAtlas.tsx` for camp tiles and player outposts (`style={{ pointerEvents: "none" }}`), displaying pitched tent, entrance, lantern glow, flagpole, and heraldic flag pennant.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera geometry remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Tests pass: 221 sim tests pass, 158 render tests pass (+5 new tests covering tent and flag rendering across all culture kits, board painting, and atlas components); app build clean.

## 2026-09-28 — Gemini Node Stock Piles on Diamond (bakeoff/gemini-node-piles)

- **Node Stock Piles on Diamond (`packages/render/src/tokens.ts`, `packages/app/src/OverworldAtlas.tsx`)**:
  - Provinces that already have node stock draw a small stock pile on the diamond tile:
    - **Woodcut**: Stacked timber logs on supporting skid beams with detailed bark bodies and cut growth rings.
    - **Field**: Burlap harvest grain sacks on a threshing mat with tied necks and golden grain ear tips.
    - **Quarry**: Dressed isometric ashlar stone blocks with sunlit top facets and shaded faces.
  - **Empty Nodes Stay As They Are**: When a node has no stock (`stock <= 0` or depleted), no pile is drawn on the diamond and empty nodes stay as they are (preserving the base landmark/circle marker without red blinking dots).
  - **Overworld Atlas Integration**: Adds `<MiniLogs>`, `<MiniSacks>`, and `<MiniBlocks>` SVG components to `OverworldAtlas.tsx` for provinces with positive stock (`nodeStock(state, p.id) > 0`). Empty nodes remain as default node circles.
  - **Strict Invariants**:
    - Hit-test math (`hitTestProvince` in `camera.ts`) and camera geometry remain 100% untouched.
    - `git diff main -- packages/sim server` strictly empty.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - Tests pass: 220 sim tests pass, 153 render tests pass (+5 new tests covering stock pile detection, empty node preservation, and atlas mini-piles); app build clean.

## 2026-09-28 — Gemini Ledger Cards & 16–20px Quill/Ink Pip (bakeoff/gemini-ledger)

- **Ledger Cards with Quill / Ink Pip (`packages/app/src/hud/QuillPip.tsx`, `packages/app/src/hud/LedgerCard.tsx`, `packages/app/src/hud/ledger-card.css`, `packages/app/src/LedgerPanel.tsx`)**:
  - **Quill / Ink Pip (`QuillPip.tsx`)**: 16–20px vector pip (`size = 18`, `viewBox="0 0 20 20"`) featuring a finely detailed goose feather scribe quill (slender rachis, barb notches, calamus barrel, writing nib, and slit) beside a faceted stone inkpot with liquid ink pool, gloss meniscus glint, and a hanging wet ink bead.
  - **Dynamic Rubrication Ink Tinting (`resolveInkColors`)**: Inks automatically harmonize with entry categories:
    - War / Defeat / Clash: Scribe's crimson rubrication ink (`#dc2626`).
    - Victory / Truce / Peace: Royal golden illumination ink (`#d97706`).
    - Marshal / Decrees: Imperial sapphire/indigo court ink (`#6366f1`).
    - General Chronicle: Traditional azure iron-gall ink (`#0284c7`).
  - **Ledger Card Component (`LedgerCard.tsx`)**: Renders `<li className="sc-ledger-card">` with `QuillPip`, `sc-ledger-card-time`, and `sc-ledger-card-text`. Integrated into `LedgerPanel.tsx`.
  - **Strict Invariants**:
    - Strictly `pointer-events: none` on both pip wrapper and SVG elements.
    - All pip styling contained entirely in `packages/app/src/hud/ledger-card.css`.
    - `packages/app/src/theme.css` remains 100% untouched.
    - Zero `<<<<<<<` merge conflict markers anywhere.
    - `git diff main -- packages/sim server` strictly empty.
    - Tests pass: 220 sim tests pass, 148 render tests pass; app build clean.

## 2026-09-28 — Ledger cards (wave/hud-ledger)

- `LedgerPanel.tsx` renders each Ledger of Crowns entry as a small `.sc-ledger-card`: time (`tN`) then text.
- Order unchanged: `listLedger` already sorts newest first.
- Styles only in `packages/app/src/hud/ledger-card.css`; inline styles removed from the component. `theme.css` not edited.
- No sim, server or ledger data changed. No conflict markers. 220 sim tests pass, 146 render tests pass; app build clean.

## 2026-09-27 — Gemini Selected Board Province Clear Gold Rim & Ground Ring (bakeoff/gemini-select-rim)

- **Clear Gold Rim & Ground Ring (`packages/render/src/tokens.ts`, `packages/render/src/index.ts`, `packages/app/src/OverworldAtlas.tsx`, `packages/app/src/game/useGameEngine.ts`)**:
  - **Tabletop Ground Ring (`wy`)**: Selected board provinces now project a clear radiant gold ground ring at tabletop ground level (`0xfacc15`, `0xb45309`, `0xfef08a`) with an inner shimmer line and 4 cardinal corner bracket pips, anchoring the tile firmly to the tabletop plane.
  - **Vertical Cliff Corner Struts**: For elevated provinces (`elev > 0`), vertical corner struts drop down the cliff facets from the elevated plateau to the ground ring, paired with a front cliff ground rim.
  - **Top Gold Rim (`cy = wy - elev`)**: Surrounds the elevated playable plateau with a double gold rim (`0xfacc15`, `0xd97706`), rear sunlight facet glint, and 4 cardinal diamond corner glints.
  - **Board Selection Layer & MapRenderer API**:
    - Adds `boardSelectionLayer` to Pixi `boardContainer` and implements `paintBoardSelectionRim`.
    - `MapRenderer` exposes `setSelectedProvince(provinceId: string | null)` and `getSelectedProvince()`, synchronizing seamlessly with game state in `useGameEngine.ts`.
    - `paintBoardHighlight` (hover) and `paintBoardProvinces` both integrate `paintBoardSelectionRim`.
    - `OverworldAtlas.tsx` renders matching `.sc-atlas-select-rim` with base ground ring, top gold rim, and corner bracket pips (`pointerEvents="none"`).
- **Invariants & Preservations**:
  - Hit-test math (`hitTestProvince`) and camera math in `camera.ts` remain 100% unchanged.
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero `<<<<<<<` merge conflict markers anywhere in the repository.
  - Monorepo tests pass: 220 sim tests, 144 render tests (+6 unit tests covering ground ring geometry, top gold rim, vertical cliff struts, selection layer, MapRenderer methods, and camera invariants).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Gemini Event Cards & 24px Omen Pip (bakeoff/gemini-events)

- **World Event Cards (`packages/app/src/hud/EventCard.tsx`, `packages/app/src/hud/event-card.css`, `packages/app/src/EventPanel.tsx`)**:
  - Presents world events as medieval chronicle cards with title, body narrative, tick count, and optional interactive choices.
  - The latest event is highlighted as a banner card, followed by Advisor Mira's counsel, with past events arranged in a responsive grid (`.sc-event-grid`).
  - Distinct left-edge border colors by event type: `.is-harvest`, `.is-timber`, `.is-spoil`, `.is-levy`, `.is-tribute`, `.is-comet`, `.is-raven`.
- **24px Omen Pip (`packages/app/src/hud/OmenPip.tsx`, `packages/app/src/hud/event-card.css`)**:
  - 24px SVG heraldic omen pip (`width: 24px; height: 24px; viewBox="0 0 24 24"`) with three authentic medieval portent variants:
    - `comet`: blazing celestial star portent with streaking fiery tail, star dust embers, glowing nucleus, and astral aura.
    - `raven`: prophetic obsidian raven perched upon a twilight crag with piercing glinting eye, sharp beak, and folded wing plumage.
    - `harvest`: auspicious golden wheat sheaf bound with crimson ribbon, alternating ripe wheat grains, awn whiskers, and solar sparkles.
  - `resolveOmenVariant` helper maps simulation events (`harvest`, `timber`, `spoil`, `levy`, `tribute`, `comet`, etc.) to the appropriate omen pip.
  - Click pass-through: strictly enforces `pointer-events: none !important;` on wrapper, SVG, and child elements so choice buttons and event cards are never blocked.
- **Invariants & Preservations**:
  - Styles strictly isolated to `packages/app/src/hud/event-card.css` only; `packages/app/src/theme.css` was NOT edited.
  - Zero `<<<<<<<` merge conflict markers anywhere in the repository.
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 138 render tests (+6 unit tests covering event card CSS rules, variant resolution, text splitting, 24px omen pip SVG art, EventCard mounting, and EventPanel grid).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Gemini Quest Cards & 24px Scroll Pip (bakeoff/gemini-quests)

- **Quest Cards (`packages/app/src/hud/QuestCard.tsx`, `packages/app/src/hud/quest-card.css`, `packages/app/src/QuestPanel.tsx`)**:
  - Replaces raw quest rows with dedicated `QuestCard` components arranged in a responsive grid (`.sc-quest-grid`).
  - Card displays quest title, hint, 0/1 progress bar track and fill, count, and Claim button when ready (or gold reward preview / taken text).
  - Left border highlights status: `.is-open` (amber `#d29922`), `.is-ready` (green `#3fb950`), `.is-claimed` (muted slate `#6e7681`).
- **24px Scroll Pip (`packages/app/src/hud/ScrollPip.tsx`, `packages/app/src/hud/quest-card.css`)**:
  - Unrolled medieval parchment mandate at 24px (`width: 24px; height: 24px; viewBox="0 0 24 24"`) with wooden roller rod curls, sepia script lines, and a wax signet seal.
  - **Ready Pip is LIT**: When complete and ready to claim, the scroll glows with radiant golden vellum (`#fffbeb`, `#fbbf24`), dual sparkle stars, and candle flame flicker (`drop-shadow(0 0 2.5px rgba(250, 204, 21, 0.95)) drop-shadow(0 0 6px rgba(245, 158, 11, 0.65))`).
  - Open quests display warm antique vellum; claimed quests show archived slate-grey.
  - Unconditionally enforces `pointer-events: none !important;` on wrapper, SVG, and all child paths so card clicks and Claim button presses are never obstructed.
- **Invariants & Preservations**:
  - Styles strictly isolated to `packages/app/src/hud/quest-card.css` only; `packages/app/src/theme.css` was NOT edited.
  - Zero `<<<<<<<` merge conflict markers anywhere in the repository.
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 132 render tests (+5 unit tests covering quest card CSS rules, questStatus state machine, 24px scroll pip ready lit glow, QuestCard mounting, and QuestPanel grid).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Gemini Diplomacy Realm Cards & 28px Realm Crest Pip (bakeoff/gemini-diplo)

- **Diplomacy Realm Cards (`packages/app/src/hud/RealmCard.tsx`, `packages/app/src/hud/realm-card.css`, `packages/app/src/WarRoom.tsx`, `packages/app/src/theme.css`)**:
  - Replaces raw odds button list in the War tab with dedicated `RealmCard` components arranged in a responsive grid (`.sc-realm-dip-grid`).
  - Card displays realm name, stance badge (with truce countdown timer), opinion breakdown, power odds comparison (mine vs theirs and share percentage with favorable green or unfavorable red color), and direct Declare war / Gift actions.
  - Card left border indicates diplomatic stance: `.is-war` (red `#f85149`), `.is-truce` (azure `#58a6ff`), `.is-friendly` (green `#3fb950`), `.is-wary` (amber `#d29922`), `.is-hostile` (orange `#db6d28`).
- **28px Realm Crest Pip (`packages/app/src/hud/RealmCrestPip.tsx`, `packages/app/src/hud/realm-card.css`, `packages/app/src/theme.css`)**:
  - Integrates the existing heraldic `Crest` at 28px (`width: 28px; height: 28px; size={28}`).
  - **Hostile Crest is Colder**: When a realm is in a hostile stance (`stance === "hostile"` or `stance === "war"`), the crest shifts to a colder hue-rotated steel frost (`saturate(0.5) hue-rotate(185deg) brightness(0.9)`), accompanied by a crystalline frost contour overlay and icy cyan glow (`drop-shadow(0 0 2.5px rgba(56, 189, 248, 0.75))`).
  - Friendly stances apply a warm emerald radiance, truce a calm azure glow, and wary a warm amber rim.
  - Unconditionally enforces `pointer-events: none !important;` on wrapper, SVG, and child elements so Declare war and Gift gold button clicks are never obstructed.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 127 render tests (+5 unit tests covering diplomacy card CSS rules, stance mapping, 28px realm crest pip colder state, RealmCard mounting, and WarRoom grid).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Gemini Royal Decree Cards & 24px Wax-Seal Pip (bakeoff/gemini-decrees)

- **Royal Decree Cards (`packages/app/src/hud/DecreeCard.tsx`, `packages/app/src/hud/decree-card.css`, `packages/app/src/DecreesPanel.tsx`, `packages/app/src/theme.css`)**:
  - Replaces raw decree buttons in the Crown tab with dedicated `DecreeCard` components in a responsive `.sc-decree-grid`.
  - Card displays decree name, blurb, cost row with 16px `ResourcePip`s (with red short amounts when unaffordable), active countdown timer (`${Math.ceil(left / 10)}s left`), and Issue button ("Already active" when sworn).
  - Tones match system states: `.is-ready` (amber), `.is-active` (green with subtle illuminated background), `.is-off` (muted when unaffordable).
- **24px Wax-Seal Pip (`packages/app/src/hud/WaxSealPip.tsx`, `packages/app/src/hud/decree-card.css`, `packages/app/src/theme.css`)**:
  - 24px circular stamped royal wax seal (`width: 24px; height: 24px; viewBox="0 0 24 24"`) featuring organic scalloped wax pooling, hanging royal ribbon tails, and a stamped royal signet crown matrix.
  - **Active seal is LIT**: Transmutes to molten amber-gold wax with radiant incandescent core, crown flare, secondary specular glints, and gentle flame glow flicker (`drop-shadow(0 0 2.5px rgba(250, 204, 21, 0.95)) drop-shadow(0 0 6px rgba(245, 158, 11, 0.65))`).
  - **Dormant seal**: Deep regal crimson pressed wax (`#991b1b` / `#7f1d1d`).
  - Unconditionally enforces `pointer-events: none !important;` on wrapper, SVG, and all child paths so card clicks and Issue button presses are never blocked.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 122 render tests (+4 unit tests covering decree card CSS rules, 24px wax-seal pip active lit state and dormant state, DecreeCard mounting, and DecreesPanel grid).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Gemini Last Battle Card & 28px Clash Pip (bakeoff/gemini-battle)

- **Last Battle Card (`packages/app/src/hud/BattleCard.tsx`, `packages/app/src/hud/battle-card.css`, `packages/app/src/WarRoom.tsx`, `packages/app/src/theme.css`)**:
  - Replaces raw paragraphs and event list with a dedicated `BattleCard`:
    - Header shows combatants (`winner` vs `loser`), outcome verdict (Victory in green, Defeat in red, or X won in amber), and the 28px clash pip.
    - Shows combat report line, Butcher's bill phase when present, and folds detailed round-by-round combat logs under `<details className="sc-battle-log"><summary>Blow by blow</summary>`.
- **28px Clash Pip (`packages/app/src/hud/ClashPip.tsx`, `packages/app/src/hud/battle-card.css`, `packages/app/src/theme.css`)**:
  - **Crossed Blades (`variant="crossed_blades"`)**: Two crossed forged steel arming swords with gold pommels and central clash spark with emerald victor glow (`rgba(63, 185, 80, 0.65)`). Displays on victory or AI clash.
  - **Broken Shield (`variant="broken_shield"`)**: Fractured iron-rimmed heater shield cleaved by a jagged glowing fissure with embers and silver rivets (`rgba(248, 81, 73, 0.75)`). Displays when the player is defeated (`loserId === "player"`).
  - Strictly enforces `pointer-events: none !important;` across all pip elements, wrappers, and SVGs.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 118 render tests (+4 unit tests covering battle card structure, clash pip variant resolution, defeat broken shield, and WarRoom mounting).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-27 — Market offer cards (wave/hud-market)

- Kingdom tab Market: each `MARKET_OFFERS` entry is now an `OfferCard` (`packages/app/src/hud/OfferCard.tsx`, `offer-card.css`) in `.sc-offer-grid`: Give row, Get row (resource pips), Trade button.
- Trade is disabled when `canTrade` is false (no Market, or short on the give resource). Short amounts show in red.
- Still calls `tryTrade`. Prices unchanged. No sim or server changes.

## 2026-09-24 — Gemini War Force Cards & 24px War Chips (bakeoff/gemini-war-chips)

- **Tactical War Force Cards (`packages/app/src/hud/ForceCard.tsx`, `packages/app/src/WarRoom.tsx`, `packages/app/src/theme.css`)**:
  - Converts plain military mission lists into a structured, responsive CSS grid (`.sc-force-grid`) of force cards.
  - Covers incoming hostile warbands, scouting expeditions, supply gather convoys, and outpost garrisons.
  - Each card presents force name, destination target, dynamic ETA timer ("posted" or `${seconds}s`), and instant Sally / Recall actions.
- **24px Bespoke Tactical War Chips (`packages/app/src/hud/WarChip.tsx`, `packages/app/src/theme.css`)**:
  - Every force card features a distinct 24px tactical SVG chip matching its mission role:
    - **Incoming (`tone="hostile"` / `kind="warband"`)**: Red warband pip with horned barbarian helm, blood-red tabard, and spiked morningstar flail; crimson left accent with `drop-shadow(0 0 2px rgba(239, 68, 68, 0.7))`.
    - **Scouts (`tone="scout"` / `kind="cloak"`)**: Scout cloak pip with twilight-navy cowl mantle, sky-cyan border trim, and brass spyglass telescope; blue left accent with cyan glow.
    - **Gathers (`tone="gather"` / `kind="cart"`)**: Gather cart pip with timber cargo wagon, banded grain sacks, and iron-spoke wheel; golden amber left accent with warm glow.
    - **Garrisons (`tone="garrison"` / `kind="tent"`)**: Garrison tent pip with canvas pavilion ridgepole, leaning spear and tower heater shield, and warm lantern hearth; emerald green left accent.
- **Strict Non-blocking Pointer Events**:
  - All chip wrappers (`.sc-war-chip-wrapper`), SVGs, and descendant elements unconditionally enforce `pointer-events: none !important;`.
  - Guarantees zero obstruction for Sally, Recall, and atlas interaction clicks.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 114 render tests (+4 unit tests covering force grid, war chip rendering, kind normalization, and WarRoom mounting).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-24 — Gemini People Cards with Walker Role Pips (bakeoff/gemini-people)

- **Walker Role Pips (`packages/app/src/hud/WalkerPip.tsx`, `packages/app/src/hud/JobCard.tsx`, `packages/app/src/theme.css`)**:
  - Each people trade card features an authentic 24px walker role pip with matching tools:
    - **Farmer (Hoe)**: Forged iron field hoe, ash haft, straw sun hat, golden harvest wheat ear.
    - **Woodcutter (Axe)**: Bearded felling broadaxe with razor steel cutting edge, wool cap, rough pine log.
    - **Miner (Pick)**: Double-pointed heavy quarry pickaxe with piercing beak, leather miner coif, brass lantern.
    - **Merchant (Coin)**: Minted royal gold sovereign with starburst twinkle shine, merchant beret, coin purse.
- **Idle Pip Sits**:
  - When unassigned or idle (`assigned === false`), the walker sits in a peaceful, restful posture on a hay bale, pine log, ashlar granite block, or strongbox trunk with hands on knees.
- **Assigned Pip Walks 2 Frames**:
  - When assigned (`assigned === true`), the pip walks through a stepped 2-frame cycle (`.sc-walker-f0`, `.sc-walker-f1`) with bobbing and tool swaying via GPU-accelerated CSS keyframes (`steps(1)`).
- **People Panel & Job Cards (`packages/app/src/PeoplePanel.tsx`, `packages/app/src/hud/JobCard.tsx`)**:
  - Displays people roster grouped into trade cards (`.sc-job-grid`) with idle villagers first in a dashed amber card, and assigned trades with a green left accent.
  - Shows trade name, walker role pip, worker count, worksite paths, and per-worker "Post at..." and "Idle" controls.
- **Non-blocking Clicks**:
  - Strictly enforces `pointer-events: none !important;` across all pip wrappers, SVGs, and child elements.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 110 render tests (+5 new unit tests covering job card grid, walker role pips, 2-frame walk animations, sitting pose, tool resolution, and non-blocking clicks).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-24 — Gemini Army Unit Cards with 28px Culture-Kit Chips (bakeoff/gemini-army-chips)

- **Trainable Army Unit Cards (`packages/app/src/hud/UnitCard.tsx`, `packages/app/src/tabs/ArmyTab.tsx`, `packages/app/src/theme.css`)**:
  - Replaces text buttons with rich unit cards in a responsive CSS grid (`.sc-unit-grid`) for all units: Militia, Spearman, Archer, Skirmisher, Cavalry, Knight, Champion, and Siege.
  - Each card displays unit name, power rating (`pwr {power}`), dynamic train costs/duration, and locked requirements.
- **28px Culture-Kit Chip Art (`packages/app/src/hud/UnitCard.tsx`, `packages/app/src/UnitIcon.tsx`, `packages/app/src/theme.css`)**:
  - Each card embeds a culture-kit `UnitIcon` sized to 28px within `.sc-unit-art-wrapper`.
  - Units reflect the player's active culture style and gear aesthetic.
- **Greyed Out Locked Cards**:
  - Units not yet unlocked via Crown study (e.g. Cavalry/Knights without Horse lore, Siege without Siege craft) are styled with `.is-locked`:
  - Applies `filter: grayscale(1)`, `opacity: 0.55`, muted slate color on names/power, desaturated 28px chip art, and `cursor: not-allowed`.
- **Non-blocking Clicks**:
  - Chip art and wrapper strictly enforce `pointer-events: none !important;` so that card button interactions, clicks, and training triggers fire with zero obstruction.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 105 render tests (+3 new unit tests covering army card grid, 28px chip art wrapper, locked state styling, UnitCard states, and ArmyTab integration).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-24 — Gemini Kingdom Work Cards with 24px Isometric Hall Chips (bakeoff/gemini-works)

- **24px Isometric Hall Chips (`packages/app/src/hud/HallChip.tsx`, `packages/app/src/theme.css`)**:
  - Each player work card is equipped with a distinct 24px isometric SVG architectural chip reflecting its building type:
    - `cottage`: Timber hall with half-timber studs, pitched thatch roof, stone chimney with smoke wisp.
    - `farm`: Barn with gambrel roof, cross-braced doors, cylindrical stone granary silo, spilling golden straw.
    - `lumber_camp` / `camp`: A-frame timber shelter, stacked firewood rick with growth rings, woodsman's axe in stump.
    - `quarry` / `mason`: Stepped ashlar blocks, timber crane derrick boom with pulley and hoisted stone.
    - `market`: Merchant stall with striped crimson/gold scalloped awning canopy and goods baskets.
    - `barracks`: Fortified stone training hall with crenellated parapet battlements, arched gateway, heraldic shield.
    - `academy`: Classical scriptorium with stone columns, triangular pediment, scholar's cupola and golden astrolabe finial.
    - `chapel`: Soaring sanctuary bell spire crowned with golden cross and stained glass lancet window.
    - `infirmary`: Healer's hospice hall with steep slate roof and bold red cross medallion.
    - `watchtower`: Tall stone tower shaft, corbelled parapet, elevated iron brazier with signal fire beacon.
    - Additional bespoke isometric SVGs for `granary`, `sawmill`, `gold_mine`/`mint`, `stables`, `archery_range`, `siege_workshop`, `walls`, `gate`.
- **Unstaffed Chip is Dim**:
  - When a building lacks assigned staff, its chip dims (`opacity: 0.42`, `filter: grayscale(0.55) brightness(0.68)`) with extinguished windows and dormant hearths. Staffed buildings display warm golden candlelight and vibrant colors.
- **Scarred Chip is Cracked**:
  - When damaged from siege attacks, the chip renders jagged stone fracture crack lines (`sc-chip-cracks`, `sc-chip-crack-main`, `sc-chip-crack-branch`) and chipped stone effects.
- **Kingdom Tab Card Grid (`packages/app/src/hud/WorkCard.tsx`, `packages/app/src/tabs/KingdomTab.tsx`)**:
  - Replaces text lists with responsive cards featuring building name, level, staffing status, bonuses, and Demolish/Repair actions.
  - Distinguishes fresh building scaffolding from siege scars via `isScarred`.
- **Non-blocking Clicks**:
  - Strictly enforces `pointer-events: none !important;` on all chip wrappers and SVGs so Demolish and Repair buttons always receive clicks cleanly.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Monorepo tests pass: 220 sim tests, 102 render tests (+4 new unit tests covering work card grid, 24px hall chip, dim unstaffed state, and cracked scarred state).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-24 — Gemini Resource Strip Animated Pips (bakeoff/gemini-strip)

- **Looping 2–3 Frame Animated Pips (`packages/app/src/hud/ResourcePip.tsx`, `packages/app/src/hud/ResourceHud.tsx`, `packages/app/src/theme.css`)**:
  - Each resource store cell in the carved timber ledger features an authentic 2–3 frame looping animated pip:
    - **Food (Grain Sack)**: Plump burlap sack tied with twine, breathing and shifting folds, settling with golden grain glints.
    - **Wood (Timber Log)**: Felled cylindrical log with tree growth rings and bark grain, catching glowing amber resin sap droplets.
    - **Stone (Cut Ashlar)**: Isometric masonry ashlar block with drafted bevel margins and crystalline chisel tool glints.
    - **Gold (Minted Coin)**: Royal gold sovereign with reeded edge and crown stamp, gleaming with traveling starburst shines.
  - **Empty Food Pip Slumps**:
    - When player food stores are depleted or critically low (`isFoodStoresEmptyOrLow`), the food pip deflates completely into a flat slumped sack collapsed in the dirt with a drooping limp neck and tired horizontal folds.
  - **Full Store Pip Stacks High**:
    - When any store is full (`isFull`), its pip stacks high into an impressive multi-tier structure:
      - Food: 3-sack pyramid stacked high with sprouting ripe wheat ears.
      - Wood: 5-log timber cord rick stacked high in three tiers with cross-section rings.
      - Stone: 4-tier stepped fortress masonry pier and capstone stacked high.
      - Gold: Twin towering treasury coin stacks with loose golden coins spilled at the base.
      - Enhanced with a warm golden aura glow (`@keyframes sc-pip-stacked-glow`).
  - **Non-blocking Clicks**:
    - Strictly enforced `pointer-events: none !important;` on all pips and wrappers. All cell clicks, tooltips, and interactions remain 100% responsive.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Form inputs not restyled to white.
  - Monorepo tests pass: 220 sim tests, 98 render tests (+4 new unit tests covering stepped loops, slumped idle, stacked glow, variant resolution, and non-blocking click pass-through).
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-24 — Gemini Inhabited Shell HUD, Stamped Tabs & Primer Banner (bakeoff/gemini-hud)

- **Inhabited Atmosphere for Lectern & Realm Cards (`packages/app/src/hud/InhabitedOverlay.tsx`, `packages/app/src/theme.css`, `packages/app/src/ResearchBar.tsx`)**:
  - Lectern card and realm cards enhanced with inner gold leaf edge (`inset 0 0 0 1px rgba(212, 163, 89, 0.42)`), subtle candle flare, and warm scriptorium ambience.
  - Ambient dust motes drift lazily upward and twinkle as they catch candlelight via dedicated canvas overlay (`InhabitedOverlay`).
  - Organic multi-harmonic candle flicker (`@keyframes sc-candle-flicker`) provides a living, breathing study and kingdom atmosphere.
  - Overlay strictly enforces `pointer-events: none` and content uses `z-index: 1`, guaranteeing 100% click-through and interaction integrity.
- **Stamped Metal Navigation Tabs & Active Lantern Tick (`packages/app/src/theme.css`, `packages/app/src/AppShell.tsx`)**:
  - Navigation tabs restyled as stamped bronze/iron plates with beveled highlights, metallic gradient backings, and pressed tactile responses.
  - Active tab features an ornate hanging lantern tick icon (`.sc-tab-lantern`) with a pulsing candle flame (`@keyframes sc-lantern-flame`) and top metal notch indicator.
- **Primer Banner with Royal Wax Seal & Page Edge (`packages/app/src/TutorialBanner.tsx`, `packages/app/src/theme.css`)**:
  - Tutorial banner upgraded to look like imperial vellum with a deckled page edge, gold embroidery stitch border, and ruby wax seal medallion.
  - Action buttons ("Done with this step" and "Skip primer") given prominent high-contrast finishes to preserve immediate readability against parchment.
- **HUD Input Styling Preserved**:
  - Did not restyle form inputs to white; form elements retain consistent dark HUD styling.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Full test suite passes: 220 sim tests, 94 render & HUD unit tests.
  - Clean production build with Vite (`npm run build -w @second-crown/app`).

## 2026-09-23 — Upkeep line on Army tab (`wave/upkeep-line`)

- `packages/app/src/UpkeepLine.tsx` (new, display only): "Upkeep · N mouths · X food/tick (Y/s)." Mounted under Posts in `ArmyTab.tsx`.
- `packages/sim/src/index.ts`: now re-exports existing read-only `armyMouths` and `upkeepPerTick` from `systems/upkeep.ts`. No logic change; units eat the same.
- No render or server changes.
 
+## 2026-09-23 — Gemini Tired Home Militia on Low/Empty Food Stores (`bakeoff/gemini-upkeep`)
+
+- **Tired Home Militia Meeples on Hold & Units When Food Stores Depleted (`packages/render/src/walkers.ts`, `packages/render/src/index.ts`, `packages/app/src/UnitIcon.tsx`)**:
+  - If player food stores are empty or nearly empty, home militia meeples on the hold and army displays visually slump into a tired posture with dragged weapons and zero banner bounce:
+    - **Food Upkeep Depletion Detection (`isFoodStoresEmptyOrLow`)**:
+      - Self-contained function checking whether food is missing, `<= 0`, or depleted below standing army upkeep demands (`mouths * 0.02 * 50` ticks buffer, minimum 5 food).
+    - **Slumped Meeple Stance & Drooping Brow (`drawWalkerFrame`, `drawCultureWalker`)**:
+      - Torso and head slump down by 2px (`slumpY = 2`).
+      - Drooping exhausted brow line drawn across eyes/face.
+      - Shield hangs low at the hip (`-3 + slumpY`).
+    - **Low Dragged Weapons & Suppressed Banner Bounce (No Banner Bounce)**:
+      - Spear/lance dragged low along the ground (`moveTo(facing * 3, 1)`, `lineTo(facing * 4, -10)`).
+      - Pennants hang limp and sagged; coordinates remain completely static across walk animation frames 0, 1, 2 (**zero banner bounce**).
+    - **Culture-Kit Adaptations**: Western, Cedar Kin, Sand Banner, Wind Host (Steppe), and Tide Clans all feature tailored tired postures and suppressed banner bounce.
+    - **Full Food Stores Unchanged**: Alert upright posture and energetic banner bounce preserved when food stores are sufficient.
+    - **App Visuals (`UnitIcon.tsx`, `ArmyVisual.tsx`, `WarLivingStrip.tsx`)**:
+      - `UnitIcon` supports `tired?: boolean` slumping clubs and tunics.
+      - `ArmyVisual` passes `tired` to company cards and marching squad rows.
+      - `WarLivingStrip` slumps the Royal Standard Bearer and suppresses royal banner wave when food is low.
+- **Invariants & Preservations**:
+  - `git diff main -- packages/sim server` strictly 100% empty.
+  - Zero changes to camera math, projection, or click hit-testing.
+  - Full test suite passes: 216 monorepo tests, 92 tests in `@second-crown/render` (+5 new tests covering empty/low food detection, slumped coordinates, suppressed banner bounce, and culture kits).
+  - Clean production build in `@second-crown/app`.
+
 ## 2026-09-23 — Gemini Rim Watchtowers Taller with Beacon & Scaffolding (`bakeoff/gemini-towers`)
+
+- **Rim Watchtowers & Unfinished Scaffolding (`packages/render/src/buildings.ts`)**:
+  - Finished watchtowers on the rim now read taller with a small beacon, and unfinished towers stay scaffolding:
+    - **Elevated Rim Profile (`buildingHeight`, `drawIsometricBuilding`)**:
+      - Extended `buildingHeight` to accept optional `(gx, gy)` coordinates. Rim watchtowers resolve to height `44 + heightBoost` (vs interior `34 + heightBoost`), rising prominently above walls (20px) and gates (24px).
+      - Extended Western stone shaft with multi-level arrow slit tiers and stone corbel belt course.
+    - **Small Signal Beacon**:
+      - Elevated iron brazier basket cage with animated beacon fire (`0xf97316`), inner hot ember (`0xfacc15`), radiant beacon illumination halo (`0xfde047`), and floating ember sparks.
+      - Culture kits feature tailored beacons: Cedar beacon cage with signal fire, Sand minaret golden cupola beacon with crimson pennant, Steppe signal pylon with coals and smoke, and Islands maritime beacon lens and halo.
+    - **Unfinished Towers Stay Scaffolding (`drawWatchtowerScaffolding`)**:
+      - When `complete === false`, watchtowers render as timber construction scaffolding towers across Western and all 4 culture kits:
+        - Heavy corner timber upright standards, multi-tier horizontal ledger rails, and diagonal X-braces with rope lashings.
+        - Planking staging platforms at mid-height and top levels with stacked materials.
+        - Side access ladder and cantilevered builder's hoist boom with pulley wheel, dangling rope, and hoisted ashlar block.
+        - Low WIP masonry footings and mortar bucket.
+        - Completely suppresses finished roofs, pennants, and beacon fire.
+        - Exempted watchtowers from `drawCrackedStoneOverlay`, ensuring unfinished towers stay authentic scaffolding.
+- **Invariants & Preservations**:
+  - `git diff main -- packages/sim server` strictly 100% empty.
+  - Zero changes to camera math, zoom, or tile click hit-testing.
+  - Full test suite passes: 216 monorepo tests, 87 tests in `@second-crown/render` (+6 new tests covering rim height, beacons across cultures, scaffolding details, and rim scaffolding scale).
+  - Clean production build in `@second-crown/app`.
+
 ## 2026-09-22 — Gemini Scarred Buildings with Cracked Stone & Smoke Suppression (`bakeoff/gemini-scar`)
+
+- **Scarred / Knocked-out Buildings with Cracked Stone & Smoke Suppression (`packages/render/src/buildings.ts`)**:
+  - Buildings with `completesAtTick !== null` (knocked out by siege strikes, or under build/repair) now render as solid, battered structures with rich cracked stone detailing and complete suppression of work-in-progress smoke puffs:
+    - **Cracked Stone Overlay (`drawCrackedStoneOverlay`)**: Replaced the placeholder under-construction scaffolding overlay with a comprehensive cracked stone presentation:
+      - **Primary Structural Fissures**: Jagged shadow crevice fault lines (`0x0f172a`) paired with offset light stone highlight ridges (`0xcbd5e1`) that zig-zag down the wall facets across masonry courses, accompanied by branching diagonal stress fractures.
+      - **Transverse Masonry Fractures & Roof Cleave**: Secondary hairline cracks scoring opposing facets and cleaved notches splitting the roofline/eave coping.
+      - **Radial Impact Blowout Crater**: Dark scorch shadow halo, pulverized stone crater depression, bright shattered stone fleck highlights, and radiating micro-fracture spokes simulating a direct siege artillery impact strike.
+      - **Fallen Masonry Rubble & Debris Chunks**: 3D faceted isometric stone blocks sheared from the walls lying at the ground footing/plinth with cast shadows, lit top faces, and shaded side facets, surrounded by scattered debris pebbles.
+      - **Culture-Adapted Palettes**: Material palettes adapt automatically across culture kits (granite/slate for western, desert sandstone for sand, weathered shale/basalt for steppe, river rock/timber for cedar, and reef limestone/coral for islands).
+      - **Deterministic Stability**: Fissure paths and rubble placements use a deterministic PRNG seeded by tile coordinates `(gx, gy)` and building height, giving stable, diverse fracture patterns across the hold.
+    - **Complete Smoke & Flame Suppression**:
+      - Suppressed chimney smoke in Western farm, cottage, and infirmary.
+      - Suppressed culture smoke puffs across Cedar farm, cottage, keep, chapel (incense), and infirmary, as well as Steppe farm, cottage, keep, infirmary, and watchtower (signal smoke pylon).
+      - Extinguished active forge flame in siege workshop and beacon braziers in watchtower and keep, displaying dormant ash coals instead.
+    - **Solid Stonework Presentation**: Changed base building opacity from 0.45 translucent ghost to solid `1.0` so masonry and cracks read with crisp clarity.
+    - **Finished Buildings Unchanged**: Finished buildings (`completesAtTick === null`) remain 100% untouched with all smoke, decorations, and lighting preserved.
+- **Invariants & Preservations**:
+  - `git diff main -- packages/sim server` strictly 100% empty.
+  - Zero changes to camera math, zoom, or tile click hit-testing.
+  - Full test suite passes: 216 monorepo tests, 81 tests in `@second-crown/render` (+10 new comprehensive test blocks for scarred building presentation, cracked stone overlay, and culture smoke suppression).
+  - Clean production build in `@second-crown/app`.
+
 ## 2026-09-22 — Gemini Connected Rim Walls & Gate Ring on Isometric Hold (`bakeoff/gemini-walls`)

- **Connected Rim Walls & Gate Ring (`packages/render/src/buildings.ts`)**:
  - Rim walls and the gatehouse now render as a continuous, unified defensive ring on the isometric hold view with gap-free curtain spans:
    - **Gapless Continuous Curtain Runs**: For contiguous wall runs (`hasPrev && hasNext`), wall segments span cleanly from neighbor boundary to neighbor boundary (`bPrev` to `bNext`). Features continuous stone foundation plinths, vertical curtain faces with horizontal ashlar mortar scoring, top wall-walk ramparts at height `-h` with planking centerlines, and culture-kit specific crenellations along the outer parapet.
    - **Wall Buttress Pilasters & Torches**: Intermediate wall segments feature a projecting stone buttress pilaster with an arrow loop slit and culture-specific wall fixtures (western animated flame torch sconces, cedar carved beast totems with pitch torches, sand brass oil lanterns with amber glow, steppe horsehair standards, and islands driftwood sea-lanterns with cyan beacons).
    - **Four Corner Bastion Towers**: Grid corners `(0,0)`, `(15,0)`, `(15,9)`, and `(0,9)` feature towering keep bastions (`towerH = h + 5`) with diamond plinths, sunlit/shaded facets, roof platforms, four-sided merlons, arrow loops, and cultural apex banners, cleanly bonding orthogonal wall directions without visual clipping.
    - **Seamless Gatehouse Flanking Wings (`drawGatehouseCurtainWings`)**: Gatehouse curtain wings now span from the left/right flanking bastion towers to the exact tile boundaries (`bLeft` and `bRight`) with identical profile geometry (matching wall-walk height, width, plinth, and merlons), creating a seamless transition where the defensive curtain meets the gatehouse.
    - **Terminal Pier End Caps**: Unconnected wall terminals (`hasPrev` or `hasNext` false) cleanly terminate with a fortified terminal pier and merlon post instead of open hollow cross-sections; isolated walls render as compact defensive bastion blocks.
    - **Perimeter Ground Foundation Shadow**: Tailored ambient ground footprint shadows along the rim to prevent individual isolated diamond cutouts or awkward southeast diagonal shadow breaks under wall runs.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 71 tests in `@second-crown/render` (+3 new comprehensive test blocks for closed 48-tile ring, partial runs, and 4-edge gatehouse wings).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Red Warband Meeple for Hostile Incoming Marches (`bakeoff/gemini-incoming`)

- **Distinct Red Warband Meeple (`drawRedWarbandMeeple` in `packages/render/src/tokens.ts`)**:
  - Hostile incoming marches advancing on player territory or traversing the board now display a menacing, hulking red warband meeple clearly distinct from player war marches, scout runners, gather carts, and garrison encampments:
    - **Spiked Blackened Iron Pedestal**: Heavy faceted iron pedestal base flanked by spiked flange studs and an illuminated crimson danger ring (`0xdc2626`).
    - **Hulking Iron Torso & Blood-Red Tabard**: Broad angular blackened iron breastplate (`0x27272a`) draped in a blood-red warband surcoat (`0x991b1b`) with crossed heavy iron harness straps and central skull/stud medallion.
    - **Tiered Spiked Pauldrons**: Aggressive tiered iron shoulder guards flaring outward on both flanks.
    - **Horned Iron War Helm**: Menacing dark iron Greathelm crowned with two sweeping curved demonic horn spikes (`0x52525b`).
    - **Glowing Crimson Visor**: Deep shadowed eye-slit cavity with a pulsing crimson eye corona and dual burning white/red specular pupil hot spots.
    - **Wicked Barbed Poleaxe & Ragged War Pennant**: Tall blackened shaft carrying a jagged, barbed halberd axe head with a razor cutting bevel and a violently fluttering ragged crimson/black battle pennant.
    - **Spiked Heater Shield**: Heavy off-hand iron-trimmed heater shield with central spiked iron boss.
    - **Hostile Threat & ETA Badge**: Floating blackened iron pill badge with skull hazard insignia and pulsing crimson threat LEDs indicating impending impact.
    - **Rival Realm Integration**: Automatically incorporates realm heraldic palettes (`realmTokenPalette`) for the war pennant and shield trims when the hostile march belongs to a rival kingdom (`k_silk`, `k_ash`, `k_frost`, `k_tide`, etc.).
  - **March Classification & Identification (`isIncomingMarch`)**:
    - `isIncomingMarch` safely identifies all hostile incoming threats (`m.realmId !== "player"` and not scout/gather/garrison), cleanly separating enemy warbands from player columns.
    - Re-exports `drawWarbandMeeple` as an alias for flexible integration.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or province tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 68 tests in `@second-crown/render` (+3 new comprehensive test blocks for `isIncomingMarch`, `drawRedWarbandMeeple`, and board march rendering).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Posted Garrison Tent & Banner Meeple (`bakeoff/gemini-garrisons`)

- **Distinct Tent & Banner Meeple for Posted Garrisons (`packages/render/src/tokens.ts`)**:
  - Outpost flag tiles with a posted garrison now show a distinctive, compact military encampment meeple clearly separate from gather carts, stealth scouts, and war march pedestals:
    - **3D Pitched Pavilion Tent**: High-tensile canvas ridgepole pavilion with shadowed left pitch, sunlit right gable, timber ridgepole, taut guy ropes stretching to timber ground pegs, and culture-colored valance trim.
    - **Glowing Hearth / Lantern Interior**: Arched dark entryway revealing a warm golden lantern glow (`0xfef08a`, `0xf59e0b`) radiating candlelight from inside the shelter.
    - **Leaning Defensive Armaments**: Steel-tipped guard spear/halberd and an iron-bossed heraldic heater shield leaning ready beside the encampment entrance.
    - **Elevated Royal Heraldic War Banner**: Hardwood flagpole topped with a gilded finial and waving royal swallowtail standard emblazoned with a golden garrison chevron charge.
    - **Floating Garrison Readiness Crest**: Fortified obsidian shield badge hovering above the pavilion indicating garrison presence, with golden rank studs reflecting garrison defensive strength.
    - **Culture Kit Responsive**:
      - `western`: Royal blue canvas valance, steel halberd, gold finial, and heater shield with gold rim.
      - `cedar`: Woodland forest green pavilion, dark timber ridgepole, red huntsman plume on flagpole, and oak stakes.
      - `sand`: Desert nomad pavilion with scalloped amber cloth, sun brass finial, and round bronze buckler shield.
      - `steppe`: Conical felt yurt dome with horsehair flagpole tuft and round shield.
      - `islands`: Marine blue pavilion with ocean pearl finial and naval wave heraldry.
  - **Guarded vs Unguarded Outpost Clarity**:
    - Provinces with posted garrisons (`getPostedGarrison(state, provinceId).posted`) display the fortified tent + banner encampment meeple.
    - Unguarded outposts / territory claims display a solitary wooden boundary marker stake with a fluttering pennant flag, making undefended borders immediately obvious at a glance.
  - **Garrison Deployment & Recall Marches (`isGarrisonMarch`)**:
    - Automatically classifies garrison dispatches (`purpose === "garrison"`) and recalls (`purpose === "garrison_home"`), rendering them with a royal blue and steel/gold garrison deployment route trail and fortified outpost reticle.
    - Marching garrison columns render with the distinct tent + banner meeple in animated marching mode with vertical bob.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or province tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 65 tests in `@second-crown/render` (+5 new comprehensive test blocks for garrison status, march classification, meeple rendering, board provinces, and multi-march routes).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Reconnaissance Scout Cloak & Spy Meeple (`bakeoff/gemini-scouts`)

- **Distinct Cloak/Spy Meeple for Scout Columns (`packages/render/src/tokens.ts`)**:
  - Scout columns exploring uncharted provinces on the isometric board now use an iconic, agile spy/ranger meeple clearly distinct from heavy military war marches and agrarian gather carts:
    - **Deep Shadowed Hooded Cowl**: Deep shadow-cast facial cavity concealing the operative's identity, pierced by glowing radiant cyan scout eyes (`0x38bdf8`) with a specular starlight slit scanning the frontier.
    - **Billowing Ranger Stealth Cloak**: Midnight slate mantle (`0x0f172a` tinted by culture) trailing behind the runner with dynamic flapping physics across stride frames (`frame 1` & `frame 2` lift up in the wind; `frame 0` drapes gracefully), silver cloak clasp pin, and moonlit hem highlights.
    - **Brass Spyglass / Monocular Telescope**: Held forward in the scout's outstretched lead hand, featuring polished brass tubing, brass eyepiece and objective rings, and a glinting glass lens with a bright sky reflection flare.
    - **Nimble Running Legs**: Agile stride with leather scout boots and turn-down cuffs animated in a 2-3 frame running gait with zero pedestal, keeping the silhouette grounded and fleet-footed.
    - **Scout Kit Gear**: Leather utility belt with brass buckle and a rolled cartography map scroll sealed with a crimson wax stamp.
    - **Culture Kit Detailing**:
      - `western`: Classic silver-brooched ranger cowl with trailing swallowtail cloak hem.
      - `cedar`: Red huntsman feather pinned to the hood crown.
      - `sand`: Ivory nomad headwrap sash fluttering behind.
      - `steppe`: Fur-trimmed hood rim.
      - `islands`: Marine sailor cowl with cyan sea-shell pearl brooch.
    - **Floating Reconnaissance Status Badge**: Obsidian glass pill with a glowing spyglass/eye icon and travel progress pips.
  - **March Classification & Recon Route Trails (`isScoutMarch`)**:
    - Automatically classifies scout missions (`purpose === "scout"` or `id` starting with `m_scout_`), ensuring scout marches to resource node tiles are never misclassified as gather trips.
    - **Reconnaissance Route Trails**: Renders with stealth midnight cyan glowing trail and crisp starlight core, leading to a 4-point compass rose reticle and vision eye target indicator on the destination province.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or province tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 60 tests in `@second-crown/render` (+3 new comprehensive test blocks for scout classification, meeple rendering, and multi-march board rendering).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Resource Node Dynamic Stock Piles (`bakeoff/gemini-nodes`)

- **Dynamic Resource Node Stock Piles (`packages/render/src/tokens.ts`)**:
  - Resource nodes on the isometric board now display a dedicated, material-specific stock pile beside their work station that visibly empties as the node stock drains:
    - **Woodcut (`woodcut`)**: Sturdy timber skid rails supporting stacked pine logs with dark bark and golden heartwood growth rings. Transitions dynamically across 4 volume tiers:
      - *Full (ratio >= 0.65)*: 6 logs stacked 3 tiers high with retaining end stakes and golden dust sparkle.
      - *Medium (0.35 <= ratio < 0.65)*: 4 logs stacked 2 tiers high.
      - *Low (0.10 <= ratio < 0.35)*: 2 lone logs resting flat on the skids with loose wood shavings.
      - *Depleted / Dry (ratio < 0.10)*: Zero logs; bare timber skid rails on sawdust ground with a soft pulsing amber/red depletion alert dot when empty (`ratio <= 0`).
    - **Quarry (`quarry`)**: Excavated gravel bed with dressed ashlar granite masonry blocks displaying 3D sunlit facets, shaded walls, and chisel bevels:
      - *Full (ratio >= 0.65)*: 6 dressed ashlar blocks stacked in a stepped pyramid with specular chisel glint.
      - *Medium (0.35 <= ratio < 0.65)*: 4 blocks stacked in 2 tiers.
      - *Low (0.10 <= ratio < 0.35)*: 2 lone blocks resting on gravel with loose stone rubble chips.
      - *Depleted / Dry (ratio < 0.10)*: Zero blocks; bare excavated gravel pit with chisel scoring and a pulsing depletion alert pip when empty.
    - **Field (`field`)**: Woven burlap threshing pad with plump harvest grain sacks tied with twine knots and golden wheat sprigs:
      - *Full (ratio >= 0.65)*: 5 plump harvest sacks stacked high with wheat ear highlights.
      - *Medium (0.35 <= ratio < 0.65)*: 3 sacks nestled together.
      - *Low (0.10 <= ratio < 0.35)*: 1 lone sagging sack with scattered chaff seeds.
      - *Depleted / Dry (ratio < 0.10)*: Zero sacks; bare trampled threshing cloth with a pulsing depletion alert pip when empty.
    - **Ruins (`ruins`)**: Cracked flagstones with an iron-banded treasure chest overflowing with gold bullion and jewels when stocked, or an open empty picked-clean chest when looted.
  - **Work Station Facility Landmarks (`drawResourceNode`)**:
    - Each node pairs its dynamic stock pile on the right (`cx + 5, cy + 1`) with an evocative labor landmark on the left (`cx - 5, cy`):
      - *Woodcut*: Root-flared tree stump with an embedded steel felling broadaxe and an A-frame timber sawbuck.
      - *Quarry*: Stratified granite rock wall with exposed bedrock seams and a heavy double-pointed quarry pickaxe.
      - *Field*: Standing golden wheat sheaf bundle tied with a crimson waist cord and an embedded crescent reaping sickle.
      - *Ruins*: Weathered classical stone archway with fluted column drums and cracked lintel.
  - **Stock Resolution Helper (`getNodeStockInfo`)**:
    - Resolves stock directly from sim (`nodeStock(state, provinceId)` and `nodeStockMax(p.node)`) or `state.flags[\`node_stock_${p.id}\`]`, normalizing cleanly to `ratio` in `[0, 1]`.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or province tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 57 tests in `@second-crown/render` (+4 comprehensive test blocks for stock pile tiers and node rendering).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Distinct Gather Columns vs War Marches (`bakeoff/gemini-gathers`)

- **Distinct Cart & Sack Meeple for Gather Columns (`packages/render/src/tokens.ts`)**:
  - Implemented `drawGatherColumnMeeple` giving gather columns on the isometric board a distinct, highly readable non-military meeple silhouette:
    - **Wheeled Cart Chassis**: Sturdy timber freight bed with iron corner brackets, heavy iron axle, and rolling spoked wheels with iron rim tires and bronze axle hubs that rotate with movement frames.
    - **Burlap Cargo Sacks**: Bulging woven burlap sacks with tied twine knots stacked high in the cart bed.
    - **Resource Cargo Overlays**: Dynamic visual cargo rendered atop the sacks matching destination node types:
      - `field`: Golden sheaf of wheat stalks and harvest ears.
      - `woodcut`: Rough-hewn pine logs with bark and cut rings.
      - `quarry`: Dressed ashlar granite stone blocks with chisel facets.
      - `ruins`: Gilded treasure chest with golden bullion and coin glints.
    - **Harnessed Draft Mule / Pack Animal**: Animated pack animal leading the cart in front with harness shafts, bridle straps, alert pricked ears, and a 2-3 frame walking leg gait matching column travel ticks.
    - **Culture Kit Adaptations**: Timber bed, wheel spokes, and mule harness accents dynamically adapt to regional culture palettes (`western`, `cedar`, `sand`, `steppe`, `islands`).
    - **Gather Status Pill**: Semi-transparent dark obsidian floating indicator showing active harvest progress pips (`outbound`, `gathering`, `returning`).
  - **March Classification & Distinct Trails (`isGatherMarch`)**:
    - Automatically classifies marches as gather operations (`kind === "node"`, `purpose === "gather"`, or targeting resource node provinces `field`, `woodcut`, `quarry`, `ruins`) vs military war marches (`kind === "camp"`, `kind === "hold"`).
    - **Gather Columns**: Render with soft emerald/harvest amber pastoral supply route trails and a gentle golden node harvest indicator.
    - **War Marches**: Retain tactical battle pedestals (walnut/faction ring for player, dread iron/danger ring for rival), iconic unit weapon silhouettes, high-contrast war route trails, and red targeting reticles.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or province tile click hit-testing.
  - Full test suite passes: 216 monorepo tests, 53 tests in `@second-crown/render` (+4 comprehensive test blocks for gather meeples and trails).
  - Clean production build in `@second-crown/app`.

## 2026-09-22 — Gemini Isometric Hold Citizen Walkers (`bakeoff/gemini-walkers`)

- **2-3 Frame Pixel Walkers & Job Tools (`packages/render/src/walkers.ts`)**:
  - Citizens walking the isometric hold village now read as authentic 2–3 frame pixel walkers with distinct, high-contrast tools for the hold's 4 core resource works:
    - **Farm (`farm`)**: Peasant wide-brim straw sun hat with sunny crown highlight and rustic band, harvest amber tunic with rope waist twine, 3-tined forged iron pitchfork with steel tips that tilts with the stride, and a golden sheaf of harvested wheat stalks nestled on the hip.
    - **Wood (`wood`)**: Forester/huntsman felt cap with red pheasant quill feather, forest green tunic with dark leather shoulder baldric, heavy felling broadaxe with bearded iron head and razor-sharp specular steel cutting bit that flashes on the swing, and a rough-hewn pine timber log slung over the shoulder with exposed ring core.
    - **Stone (`stone`)**: Protective quarry dust cowl/hood, heavy split-cowhide mason apron with iron belt buckle over stone-grey tunic, double-pointed heavy quarry pickaxe with long curved forward piercing beak and rear chisel striker, and a hand-hewn square granite ashlar block carried on the hip with chisel highlights.
    - **Gold (`gold`)**: Royal midnight navy velvet tunic with gleaming gold waist sash and polished gold buckle, miner/assayer leather headband with glowing golden forehead reflector lamp, gilded prospector's pick with golden steel head and flashing tip, and an iron prospecting pan filled with raw gold dust, bullion bar, and an animated 2–3 frame specular gold star twinkle.
  - **Dynamic Tool Resolution (`toolForCitizen`, `resolveWalkerTool`)**:
    - Automatically links citizen jobs and work tile building types (`farm`/`granary` → farm pitchfork; `lumber_camp`/`sawmill` → wood broadaxe; `quarry`/`mason` → stone pickaxe; `gold_mine`/`mint` → gold prospector pick & pan).
    - Default presentation pool (8 citizens) rotates across all four job tools (`farm`, `wood`, `stone`, `gold`) so the hold feels active with industry from the very first tick.
  - **Culture Kit Adaptations (`drawCultureWalker`)**:
    - Supports non-western culture kits (`cedar`, `sand`, `steppe`, `tide`) by tinting tool handles and stonework with culture timber and stone palettes while preserving culture-specific headwear and cloaks.
  - **Authentic 2-3 Frame Animation Physics**:
    - Frame 0 (planted / neutral): 0px bob, legs centered under body, tools in neutral carry pose.
    - Frame 1 (forward step): 1px bob up, forward leg extends, lead arm swings forward, tool tilts into the stride catching specular light.
    - Frame 2 (opposite step): 1px bob up, opposite leg extends, lead arm swings back, tool head flashes/sparkles.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zero changes to camera math, zoom, or tile click hit-testing.
  - Full test suite passes: 215 in `@second-crown/sim`, 49 in `@second-crown/render` (+5 new test blocks).
  - Clean production build in `@second-crown/app`.


- **Miniature Keeps Readability on Diamond Board (`packages/render/src/tokens.ts`)**:
  - Added ground contact footprint shadows (`0x050403`, alpha 0.62) to cleanly detach miniature keeps from textured, height-mapped 3D terrain relief.
  - Added stepped foundation plinths with crisp dark contour outlining across all culture kits.
  - Enhanced facet lighting contrast: bright sunlit left facets with corner quoins, masonry seams, and shingle highlights vs deep cool shaded right facets with vertical dividing corner seams.
  - Culture kits:
    - `western`: Heavy dressed ashlar talus plinth, granite walls with alternating corner quoins, corbelled watch bartizans with golden finials, arched portcullis gate, warm candlelit window with ambient halo, and waving swallowtail royal banner.
    - `cedar`: Riverstone plinth with individual stone outlines, golden cedar cross-lap logs, steep shake roof with shingle texture highlights, golden eagle ridgepole finials, and warm hearthfire doorway.
    - `sand`: Terraced sandstone plinth, radiant ivory limestone hold, sharp sawtooth merlons, lookout minaret turret with specular dome glint and crescent spire, and horseshoe arched portal with keystone.
    - `steppe`: Packed earthen kurgan mound with stone rim, royal felt yurt with radial tension ribs, carved timber smoke crown (*shangyrak*), crimson embroidered felt bands, and tall horsehair streamer pole.
    - `islands`: Elevated driftwood/ironwood pilings with cross-bracing, planked wharf deck, multi-tier ocean teal pavilion roof with wave-crest finial, glowing hanging sea lantern, and maritime swallowtail pennant.
    - `rival` (Iron March): Charred basalt foundation talus with corner brackets, cold gunmetal lit wall, obsidian shadow wall, spiked battlements with sharpened steel spike glints, sinister crimson eye-slit gate with dark iron backing, and waving blood-red spiked war pennant.
  - **NPC Hold Faction Escutcheons**: Mounted heraldic realm shields on NPC keep walls displaying `realmPal.pennantColor`, `realmPal.borderColor`, and `realmPal.accentColor`, making NPC holds instantly identifiable by realm at a glance without having to click them.
  - **Player Home Keep Badge**: Rendered a majestic golden coronet crest with pearl jewels above the capital keep tower.
- **Pixel Units & March Pawns Readability (`packages/render/src/tokens.ts`)**:
  - **Faction Pedestal Bases**:
    - Player columns: Turned walnut plinth with beveled base, dual-tier golden and sapphire faction ring (`0xfacc15` / `0x2563eb`), and corner golden studs.
    - Hostile (Rival) columns: Heavy spiked blackened iron pedestal with crimson danger ring (`0xdc2626`) and dark iron rivets.
  - **Iconic Unit Silhouettes across all 8 unit types**:
    - `archer`: High-visibility recurve bow held forward with taut string and nocked bodkin arrow, feathered back quiver, Robin Hood cowl with cockade feather.
    - `spearman`: Towering steel-tipped pike reaching high above the column, culture-styled heraldic shield with metallic rim and boss.
    - `skirmisher`: Poised throwing stance with steel-tipped javelin, back harness with spare javelins, off-arm target buckler.
    - `cavalry`: Muscular warhorse with animated 2-frame galloping stride, hooves, saddle caparison with golden trim, mounted armored lancer with couched lance and fluttering lance pennon.
    - `knight`: Polished silver plate armor, Greathelm with cross-visor and waving chivalric plume, heavy heraldic heater shield with golden cross, upright broadsword.
    - `siege`: Heavy timber bed with iron corner brackets, studded wheels with bronze axle hubs, A-frame gantry, pivoting throwing beam with iron counterweight and stone projectile.
    - `champion`: Billowing royal mantle with golden border, golden spiked coronet helm, and massive two-handed claymore with glowing azure runic edge and power pulse.
    - `militia`: Peasant levy tunic and coif, spiked knotty oak war club with steel studs, and banded target buckler.
  - **Hostile March Meeples**: Blackened iron dreadplate with spiked pauldrons, horned greathelm, glowing crimson eye-slit with ambient corona, jagged halberd axe head, and tattered blood-red war pennant.
  - **Floating March ETA Badge**: Dark obsidian glass background with drop shadow, sharp unit accent border, and cleanly spaced glowing progress timer dots.
  - **Route Trails**: Two-tone glowing pulse with high-contrast inner core and concentric target crosshair reticle.
- **Claimed Territory Outposts**:
  - Enhanced player outposts with ground contact shadows, detailed expedition shelter tents with entrance flaps, and waving royal swallowtail banners.
  - Enhanced NPC outposts with ground shadows, realm-colored territory flags, and iron-banded supply crates.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zooming, pan, tile clicks, building placement/upgrades, holidays, and dim lanterns remain completely preserved.
  - Full test suite passes: 214 in `@second-crown/sim`, 44 in `@second-crown/render` (+2 new test blocks).
  - Clean production build in `@second-crown/app`.

## 2026-09-21 — Gemini Lords Mobile Overworld & Height-Mapped Tiles (`bakeoff/gemini-overworld`)

- **Lords Mobile 3D Overworld Map (`packages/render`)**:
  - `terrainElevation`: Added vertical elevation thickness mapping across all 6 board terrain types: peaks tower highest (13px), hills form stepped highland contour terraces (9px), wastes feature cracked basalt cliffs (8px), woods form elevated loam embankments (6px), plains form rich sod terraces (5px), and shores meet coastal sea shelves (3px).
  - `paintTileHeightFace`: Stratified vertical cliff faces with light/shadow facets, vertical granite chisel clefts and snowmelt gullies (`peak`), horizontal sedimentary strata lines and overhanging highland sod (`hill`), dark loam and dangling gnarled tree roots (`wood`), agricultural loam and fine rootlets (`plain`), vertical basalt columns with animated pulsing molten magma fissures (`waste`), and wave-cut sandstone notches with frothing surf spray (`shore`).
  - Taller relief artwork for each terrain feature on the top plateau (towering arête mountain massifs with cirque glaciers, multi-tier evergreen pine groves with taller monarch spires, stepped contour knolls, bubbling caldera vents, and breaking coastal surf).
- **Miniature Pixel Keeps on Board Holds (`packages/render`)**:
  - `drawMiniatureKeep`: Replaced generic flat 14×11 rectangle with authentic miniature scale (`~0.42x`) pixel keeps reusing the culture kit silhouettes:
    - `western`: Ashlar stone tower with twin corner bartizans, merlon battlements, iron portcullis, candlelit high royal window, heraldic shield, and waving royal standard.
    - `cedar`: Sturdy timber longhouse keep on riverstone plinth with cross-lap logs, steep shake roof, golden eagle ridgepole finials, corner watchposts, and forest pennant.
    - `sand`: Sunbleached limestone quadrangle keep with parapet flat roof, observation minaret turret, and desert silk standard.
    - `steppe`: Circular felt-roof great hall on earthen mound with conical dome, timber door frame, and horsehair streamer standard.
    - `islands`: Elevated stilt pile-house keep on driftwood pilings with woven pavilion roof, hanging sea lantern, and ocean pennant.
    - `rival` (Iron March): Spiked blackened iron fortress keep with angular iron bastion walls, serrated spiked battlements, narrow glowing crimson eye-slit gate, and blood-red war standard.
    - Neutral/unclaimed: Weathered ancient stone keep ruins.
- **Fog as a Height Veil (`packages/render`)**:
  - `paintFogHeightVeil`: Unscouted provinces rise as billowing volumetric cloud plateaus with 3D drop shadow, shaded vapor strata in the height face, undulating cloud crests, shifting mist tendrils, and faint cartographer markings.
- **Full-Chrome Canvas Presentation (`packages/app` & `packages/render`)**:
  - `theme.css`: Removed `max-width: 560px` restriction on `.sc-map-canvas`, setting `max-width: 100%` so the canvas expands cleanly across the full chrome container (`maxWidth: 900px`).
  - `createMapRenderer`: Ensures canvas style width fills 100% dynamically without fixed pixel clamping.
- **Modular Split of `packages/render`**:
  - Split 7,921-line monolithic `index.ts` into modular, focused files:
    - `src/camera.ts`: camera viewport, zoom bands, projection, coordinate conversion, province token bounds, table rim.
    - `src/tiles.ts`: terrain elevation, height faces, fog height veil, isometric ground, rim fort navigation.
    - `src/buildings.ts`: culture palettes, theme visuals, isometric building drawers across all 21 types and 5 culture kits.
    - `src/tokens.ts`: miniature pixel keep drawers, board provinces painter, march columns, gather carts, province inspect plaque.
    - `src/walkers.ts`: citizen job mapping, destination picking, 2-3 frame animation cadence.
    - `src/index.ts`: public re-exports and MapRenderer factory.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` strictly 100% empty.
  - Zooming, tile clicks, building placement/upgrades, holidays, and dim lanterns remain completely preserved.
  - Full tests pass: 195 in `@second-crown/sim`, 42 in `@second-crown/render` (+4 new tests).
  - Clean build in `@second-crown/app`.

- **Hold Building Silhouettes (`packages/render`)**:
  - `walls`: Distinct interior block ramparts and rim curtain walls + parapet merlons across all 4 cultures: riverstone log palisade (`cedar`), sandstone rampart with sawtooth merlons (`sand`), rammed-earth wattle hurdle rampart with horsehair streamers (`steppe`), and coral/driftwood stilt wall (`islands`). Western ashlar stone untouched.
  - `gate`: Distinct gatehouses and arches: cedar log blockhouse (`cedar`), horseshoe-arched sandstone portal (`sand`), leather-wrapped pylon gateway (`steppe`), and driftwood/bamboo gatehouse with bamboo portcullis (`islands`). Western bastion towers untouched.
  - `chapel`: Spirit grove totem lodge (`cedar`), sandstone sun sanctuary with cupola dome (`sand`), open-sky Tengri cairn altar (`steppe`), tidal stone shrine with giant clam font (`islands`). Western gothic chapel untouched.
  - `infirmary`: Dropped generic red cross for all non-western cultures: woodland herbalist lodge with hot tub (`cedar`), bimaristan courtyard hospital with cooling fountain (`sand`), nomad shaman yurt with wormwood smoke braziers (`steppe`), slatted reef apothecary with nautilus emblem (`islands`). Western red-cross hospice untouched.
  - `siege_workshop`: Cedar logging yard ram/catapult (`cedar`), desert mangonel arsenal (`sand`), war arba wagon workshop (`steppe`), shoreline outrigger artillery dock (`islands`). Western carriage yard untouched.
  - `watchtower`: Cedar trestle lookout with beacon cage (`cedar`), sandstone minaret with observation balcony (`sand`), four-legged signal smoke pylon (`steppe`), driftwood/bamboo stilt lighthouse (`islands`). Western turret untouched.
  - `barracks`: Cedar log warrior lodge (`cedar`), colonnaded sandstone barracks (`sand`), three-yurt war camp (`steppe`), open coral/bamboo stilt pavilion (`islands`). Western soldier hall untouched.
  - `stables`: Split-rail cedar paddock (`cedar`), domed equestrian pavilion (`sand`), steppe horse paddock (`steppe`), coastal stilt pen (`islands`). Western stable untouched.
  - `archery_range`: Forest stump range (`cedar`), silk-canopied desert pavilion (`sand`), mounted nomad ring-target track (`steppe`), beachside spear deck (`islands`). Western butt range untouched.
- **Unit Silhouettes (`UnitIcon.tsx` in `packages/app`)**:
  - `archer`: Woodland marksman with flatbow (`cedar`), turban composite reflex bowman (`sand`), conical cap horn bowman (`steppe`), reed-hat daikyu bamboo marksman (`islands`).
  - `skirmisher`: Fur hood tomahawk stalker (`cedar`), keffiyeh javelin thrower with red tassels (`sand`), nomad dart outrider (`steppe`), reef diver with barbed harpoon (`islands`).
  - `cavalry`: Boreal bay charger with boar lance (`cedar`), cream Arabian courser with silk banner lance (`sand`), dun steppe pony with horsehair streamer lance (`steppe`), slate tide mount with trident polearm (`islands`).
  - `knight`: Hearthguard with antler helm and oak-leaf shield (`cedar`), Mamluk in mirror armor with sunburst sipar and shamshir (`sand`), Kheshig in lamellar coat with tamga shield and kilij (`steppe`), Tide Sentinel in pearl-shell armor with wave shield and leiomano (`islands`).
  - `siege`: Cedar log ram/trebuchet with river-stone basket (`cedar`), desert mangonel with flaming Greek fire pot (`sand`), war arba wagon cart with sandbag counterweight (`steppe`), bamboo catamaran shore catapult with volcanic pumice (`islands`).
  - `champion`: High Chieftain with antler emerald crown and radiant green blade (`cedar`), Sultan with ruby turban-crown and blazing sun-scimitar (`sand`), Khagan with winged falcon crown and lightning saber (`steppe`), Tide Sovereign with ray crown and aqua tidestrike trident (`islands`).
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` is 100% empty.
  - Western Crown Marches hold buildings, curtain walls, and army unit icons remain 100% untouched.
  - Full tests pass: 119 in `@second-crown/sim`, 38 in `@second-crown/render`.
  - `npm run build -w @second-crown/app` builds cleanly.

## 2026-09-08 — Gemini Leftover Kits: Hold Building Art, Gold Mine & Market Culture Silhouettes, Column Kits (`bakeoff/gemini-holdrest`)

- **Hold Building Art & Silhouettes (`packages/render`)**:
  - Aliased `lumber` to `lumber_camp` in `drawIsometricBuilding`: both IDs render identically across all kits.
  - Dedicated hold art for `infirmary`: half-timbered hospice hall on stone plinth, red cross emblem on front gable, steep slate roof with candlelit dormer, stone chimney with herbal hearth smoke, courtyard medicinal herb garden (lavender and red poppies), and herbalist water basin bench.
  - Bespoke culture silhouettes for `gold_mine`:
    - `cedar`: River-panning flume, heavy cedar log headframe, gravel sluice box, and nugget wash pan.
    - `sand`: Sandstone canyon adit portal with sunshade awning, rocker box dry winnower, and ore amphorae.
    - `steppe`: Alluvial gravel trench with timber shoring, nomad felt windbreak screen, golden fleece sluice trough, and ironbound spoil chest.
    - `islands`: Coastal reef/cave mine with elevated stilt flume on driftwood pilings, tidal paddle wheel, and wicker black-sand gold baskets.
    - `western`: Classic crag portal, timber headframe, ore tracks, and gold cart untouched.
  - Bespoke culture silhouettes for `market`:
    - `cedar`: Forest log trading post with cedar bark roof canopy, left stall canopy, buckskin/fur pelt rack, berry baskets, and hanging amber lantern.
    - `sand`: Desert souk grand bazaar with mudbrick base, striped crimson & desert gold silk awning, teal silk wing canopy, hanging brass lantern, spice sacks, and date palm baskets.
    - `steppe`: Nomad caravan fair with trade yurt tent canopy, arba two-wheeled trade wagon, kumis flagons, and horsehair standard.
    - `islands`: Shoreline pier market on elevated driftwood boardwalk pilings, thatched palm pavilion canopy with frond fringe, fish drying rack, and woven baskets of pearls and sea glass.
    - `western`: Classic three-canopy grand bazaar with fruit crates untouched.
  - Complete coverage: all 21 IDs from `packages/sim/src/content/buildings.ts` (`farm`, `cottage`, `lumber_camp`, `quarry`, `gold_mine`, `granary`, `sawmill`, `mason`, `market`, `mint`, `barracks`, `stables`, `archery_range`, `academy`, `siege_workshop`, `watchtower`, `chapel`, `infirmary`, `walls`, `gate`, `keep`) plus `lumber` alias render cleanly across all 5 culture kits (`western`, `cedar`, `sand`, `steppe`, `islands`).
- **Board March Columns & Gather Expeditions Culture Kits (`packages/render`)**:
  - Player march meeples (`paintBoardMarches`) dynamically resolve the player hold's active culture kit (`resolveCultureKit(playerCultureId)`):
    - `cedar`: Hooded hunter cowl, buckskin tunic, leaf-blade hunting spear, round cedar bark shield.
    - `sand`: Desert turban with havelock veil, crimson sash, slender lance with red pennon, polished brass sun buckler.
    - `steppe`: Conical spangenhelm with horsehair crest, nomad coat, horsehair collar lance, studded rawhide buckler.
    - `islands`: Woven reed war cap, teal vest, 3-pronged barbed fishing trident, turtle-shell reef buckler.
    - `western`: Classic kettle hat, royal blue tabard, ash spear, brass-boss round shield untouched.
    - Hostile Iron March columns strictly remain red/iron.
  - Gather pack-carts (`paintBoardGathers`) render culture-adapted pack-carts: split-cedar cart with foraging burlap sack (`cedar`), acacia cart with terracotta amphorae (`sand`), two-wheeled arba wagon with wool felt pack (`steppe`), coastal driftwood slip cart with reed baskets (`islands`), or classic timber cart (`western`).
  - Unit visual palette (`unitPalette`): accepts optional `cultureId` and adapts tabard, armor, and accent colors for non-western cultures while preserving default western palettes.
- **Army Visual Culture Kit Propagation (`packages/app`)**:
  - `packages/app/src/ArmyVisual.tsx`: Resolves player culture using `playerCultureId(state)` / `cultureOfRealm(state, "player")` and passes `culture={culture}` to both commander and squad formation `UnitIcon` instances.
  - `packages/app/src/AppShell.tsx`: Unified `CultureContext.Provider` wrapping `ProvinceInspect` and tab contents.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` is 100% empty.
  - Western culture visual assets remain 100% unaltered.
  - Full tests pass: 119 in `@second-crown/sim`, 37 in `@second-crown/render`.
  - `npm run build -w @second-crown/app` builds cleanly.

## 2026-09-08 — Gemini Culture Kits: Distinct Silhouettes for Cedar, Sand, Steppe & Islands (`bakeoff/gemini-kits`)

- **Culture Kit Silhouettes for Hold Buildings (`packages/render`)**:
  - Exported `resolveCultureKit(cultureId)` resolving sim IDs (`western`, `woodland`, `desert`, `steppe`, `tide`) and culture kit names (`cedar`, `sand`, `steppe`, `islands`).
  - Western Crown Marches (`western`) keeps current keep, cottage, farm, lumber, walkers, and UnitIcon 100% untouched.
  - Distinct architectural silhouette changes in `drawIsometricBuilding`:
    - **Keep**:
      - `cedar`: Sturdy timber longhouse keep on riverstone plinth with cross-lap log walls, pitched roof, and carved ridgepole.
      - `sand`: Open quadrangle courtyard keep on sunbleached limestone with flat parapet roofs and inner courtyard opening.
      - `steppe`: Nomadic circular felt-roof great hall on low earth mound with conical tent canopy, timber door frame, and smoke cowl.
      - `islands`: Elevated stilt pile-house keep on timber pilings with driftwood ladder, woven pavilion roof, and hanging sea lantern.
    - **Cottage**:
      - `cedar`: Hewn log cabin with overhanging gables and stone hearth.
      - `sand`: Flat-roof desert adobe dwelling with timber shade canopy.
      - `steppe`: Circular felt yurt/ger with domed roof, felt bands, and low door frame.
      - `islands`: Stilthouse cabin raised above ground on timber piles with reed thatch.
    - **Farm**:
      - `cedar`: Forest split-rail log fenced clearing with dark loam soil and vegetable mounds.
      - `sand`: Terraced irrigation garden with earthen bunds, central water channel, and date palm fronds.
      - `steppe`: Nomad hurdle livestock pen with steppe grasses and sheep hayrack.
      - `islands`: Tidal crop paddy with drying racks and flooded basin lines.
    - **Lumber**:
      - `cedar`: Split-rail logging yard with stacked heavy timber logs, chopping stump, and splitting axe.
      - `sand`: Desert acacia drying yard with lashed lumber poles and desert woodpile.
      - `steppe`: Nomad wagon yard with timber cart axles, wheelwright trestle, and wood sled.
      - `islands`: Coastal timber slipway with net-drying racks, boat timbers, and rope coils.
- **Hold Walkers (`packages/render`)**:
  - `drawCultureWalker`: Villagers and guards feature distinct headwear and gear silhouettes per culture kit:
    - `cedar`: Hooded hunter cowl, buckskin tunic, leaf-spear / woodsman tool.
    - `sand`: Desert turban with draped havelock veil behind, flowing linen robe, crimson sash, slender lance.
    - `steppe`: Pointed nomad cap / conical steel helmet with horsehair plume, double-breasted caftan coat, horsehair lance.
    - `islands`: Woven reed war cap / straw sun hat, sailcloth vest and rope wraps, 3-pronged barbed fishing trident.
- **Unit Icons (`packages/app/src/UnitIcon.tsx`)**:
  - `spearman`:
    - `western`: Untouched steel kettle hat, royal blue tabard over chainmail, ash pike, and round shield.
    - `cedar`: Pointed hunter cowl, fur shoulder mantle, buckskin tunic, broad leaf-blade spear, and cedar bark shield.
    - `sand`: Desert turban with fluttering havelock veil, flowing linen tunic, crimson waist sash, slender lance with red pennon, and polished brass sun buckler.
    - `steppe`: Conical spangenhelm with horsehair crest, nomad caftan coat with gold silk sash, horsehair collar lance, and studded rawhide buckler.
    - `islands`: Woven reed war cap with shell band, teal sailcloth vest, rope wrap kilt, 3-pronged barbed trident, and oval turtle-shell reef buckler.
  - `militia`:
    - `western`: Untouched homespun tunic, cloth coif, and simple wooden club.
    - `cedar`: Woodland hunter hood, buckskin tunic, and heavy carved cedar cudgel.
    - `sand`: Desert turban, flowing linen robe with hanging sash tails, and upright ironwood walking staff.
    - `steppe`: Conical felt cap with fur brim, belted nomad coat (deel), and spiked wooden cudgel.
    - `islands`: Broad-brim woven straw hat, frayed sailcloth tunic with rope belt, and carved boat paddle oar.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` is 100% empty.
  - Western culture visual assets remain 100% unaltered.
  - Full tests pass: 119 in `@second-crown/sim`, 26 in `@second-crown/render`.
  - `npm run build -w @second-crown/app` builds cleanly.

## 2026-09-07 - Astra map gathering PR

Added sim-only map gathering: outbound, loading, return and recall; three resource node profiles; reserved tiles; shared march capacity checked before troop withdrawal; decimal cargo and event-based settlement; tick-stamped action records and additive save flags. Added 11 regression cases. No app/render/server changes. Existing upkeep starvation batching limitation documented in walkthrough.md.


Newest first.

## 2026-09-07 — Gemini Crowns: Distinct NPC Hold Tokens, Culture Tints & World Log Visibility (`bakeoff/gemini-crowns`)

- **Distinct NPC Hold Tokens on Board (`packages/render`)**:
  - `paintBoardProvinces`: Every province with `node === "hold"` occupied by a non-player realm draws a distinct heraldic keep token on the board (`zoom <= 0.70`), not just Iron March.
  - Exported `realmTokenPalette(realmId)` mapping `rival`, `k_silk`, `k_ash`, `k_veil`, `k_glass`, `k_frost`, `k_tide`, `k_ember`, `k_bronze` to canonical crest colors, with deterministic hash fallback.
  - Keeps render stone plinth, corner bartizans, ashlar walls, rivets, fluttering swallowtail banner in realm colors, and heraldic seal. Iron March preserves spiked battlements. Claimed non-hold nodes render a realm claim flag.
  - `paintBoardHighlight` selection pips reflect the realm's accent color.
  - Pure exported helpers: `realmTokenPalette`, `REALM_TOKEN_PALETTES`, `isNpcHoldProvince`.
- **Player Culture Tints (`packages/render` & `packages/app`)**:
  - Reads `playerCultureId(state)` and `CULTURES` from `@second-crown/sim`.
  - Crown Marches (`western`) strictly retains 100% of the original art.
  - Cedar Kin (`cedar`), Sand Banner (`sand`), Wind Host (`steppe`), and Tide Clans (`islands`) tint:
    - Hold keep isometric building: stone walls, bartizans, plinth, lintels, heraldic shield, and royal banner.
    - Hold walkers: villager/miner/guard tunics, tool handles, spear shafts, and guard pennants.
    - `UnitIcon` across all 8 unit classes: tunics, bows/shafts, and shields/armor.
  - In `packages/app`:
    - `UnitIcon.tsx`: `CultureContext` created; `UnitIconProps` accepts optional `culture?: string`, defaulting to context or `"western"`.
    - `AppShell.tsx`: Wrapped tabs in `<CultureContext.Provider value={state ? playerCultureId(state) : "western"}>`. Choosing culture in `CrownTab` via `CulturePicker` dynamically re-tints Army rosters immediately.
    - `WarLivingStrip.tsx`: Passes player culture to player `UnitIcon`s and opponent realm culture (`cultureOfRealm(state, enemyRealmId)`) to opposing `UnitIcon`s.
- **World Log Visibility (`packages/app`)**:
  - `WorldTab.tsx`: Elevated Crown Chronicle to the top of World tab. Category filter pills (`All`, `Claims 🚩`, `Trades ⚖️`, `Wars ⚔️`, `Musters 🛡️`), formatted badges, monospace ticks (`T{e.tick}`), newest entry highlight, and scrollable container. "Holds on the Board" card displays realm crest color swatches matching board tokens.
  - `ChromeDock.tsx` & `useGameEngine.ts`: `useGameEngine` dispatches `sc-world-dispatch` on `state.flags.last_world` updates. `ChromeDock.tsx` renders a live ticker (`📜 WORLD: ...`) in the dock header bar.
- **Invariants & Preservations**:
  - `git diff main -- packages/sim server` is 100% empty.
  - Tests passing: 117 in `@second-crown/sim`, 24 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).

## 2026-09-07 — Claude Hold Economy: Smaller Raids, Academy, Storehouses (`bakeoff/claude-pace`)

- **Raid haul cut (`packages/sim/src/systems/march.ts`)**: breaking a camp now pays +6 wood (was +20); clearing a woodcut/quarry/field node now pays +5 of the matching resource (was +12). Player wins still call `plantOutpost`.
- **Academy building (`packages/sim/src/content/buildings.ts`, `systems/research.ts`)**: new `academy` building type — no drip production, `wood`/`stone`/`gold` cost, `buildTicks: 130`. Horse lore research now accepts a finished `academy` **or** a finished `barracks` (`needsAny`), so existing barracks-only saves stay unlocked.
- **Storehouses (`packages/sim/src/systems/storage.ts`, new)**: `storageCap(state, res)` gives `food`/`wood`/`stone`/`gold` finite warehouses (base 200/150/150/100, raised per finished `granary`/`sawmill`/`mason`/`mint`); `addCapped` clamps production and raid payouts at the cap so overflow is lost. Chose reusing existing bulk-production buildings over adding a dedicated `storehouse` type — smaller footprint, no new render/app surface needed.
- **Tests**: new `storage.test.ts` plus additions to `march.test.ts`, `research.test.ts`, and `build.test.ts` covering cap growth, clamped gains, batching-independent determinism, the new haul amounts, and the academy fallback path.
- **Sim & App Purity**: `git diff main -- packages/app packages/render server` empty. `tickEngine.ts` untouched — no new tick rate. No new combat resolver, no new unit types. Full `@second-crown/sim` suite (104 tests) and `npm run build -w @second-crown/app` pass.

## 2026-09-07 — Gemini Pixel Army Tab & Board Marching Columns (`bakeoff/gemini-army`)

- **Pixel Walker Style for Army Tab Roster & Visuals (`packages/app`)**:
  - `UnitIcon.tsx`: Replaced flat chip portraits with integer-pixel SVG silhouettes in the authentic aesthetic of hold walkers and buildings (`shapeRendering: "crispEdges"`).
  - Supports 2–3 frame animated marching/idle cadence (`frame = 0 | 1 | 2` cycling 0 → 1 → 0 → 2), directional facing (`facing = 1 | -1`), and faction tabard colors matching hold walkers.
  - Weapons and gear match type:
    - **Militia**: Spear-less peasant levy, coarse homespun tunic (`#854d0e`), rope belt (`#a16207`), cloth coif (`#52525b`), unarmed/cudgel posture.
    - **Spearman**: Steel kettle hat (`#94a3b8` / `#cbd5e1`), royal blue tabard (`#1e40af`), long ash spear with pointed steel spearhead (`#f1f5f9`), and round boss shield (`#1e3a8a` / `#facc15`).
    - **Skirmisher**: Scout green coat (`#15803d`), leather coif (`#5c3818`), throwing javelins with steel barbs (`#cbd5e1`), and arm buckler.
    - **Archer**: Deep forest coat (`#14532d`), feathered cap with quill (`#facc15`), recurve yew longbow (`#854d0e`), taut bowstring, nocked arrow, and back quiver.
    - **Cavalry**: Warhorse mount (`#6b3a19`) with animated galloping hooves, leather saddle, reins, and mounted armored lancer with royal blue tunic, steel helm, and pennant.
    - **Knight**: Full steel plate harness (`#cbd5e1`), great helm with visor eye-slit (`#0f172a`), heraldic crimson heater shield (`#b91c1c`) with golden cross (`#facc15`), steel broadsword, and red mantle.
    - **Siege Engine**: Sturdy timber carriage (`#5c3818`), spoked wooden wheels with iron rims, upright A-frame trestle, and throwing beam with counterweight bucket and granite boulder.
    - **Champion**: Radiant gilded plate (`#f59e0b`), winged royal crown helm (`#fde047`), Tyrian purple tabard (`#581c87`), glowing runic broadsword (`#38bdf8`), and flowing crimson cape.
  - `ArmyTab.tsx`: Transformed unit training section into rich roster cards with animated pixel silhouettes, power ratings, training costs, and flavor blurbs. Dedicated Champion recruitment card with gilded champion silhouette, custom naming input, and recruitment actions.
  - `ArmyVisual.tsx`: Raised companies in "Your Host" display the animated pixel silhouettes alongside company counts, total combat power, and lively multi-unit squad formations marching in 2–3 frame cadence.
  - `ProvinceInspect.tsx`: March column composer displays mini unit pixel silhouettes next to each unit count.
- **Board Meeple Reuse for Marching Columns (`packages/render`)**:
  - `primaryUnitTypeForMarch(march)`: Pure sim-reading helper exported from `@second-crown/render` that resolves the primary unit type for any column based on `march.force` counts and tier priority (champion > siege > knight > cavalry > archer > skirmisher > spearman > militia).
  - `unitPalette(typeId)`: Pure palette/gear helper exported from `@second-crown/render` providing matching tabard, armor, weapon, and helm properties for all 8 unit types.
  - Tabletop board marching meeples (`paintBoardMarches`) now render player columns using the exact same sprites, colors, weapons, and 2–3 frame stride cadence as the Army tab. An archer column looks like an archer on the march; a knight column marches with great helm and heater shield; cavalry trots with a warhorse mount; siege engines roll on spoked wheels.
  - Hardwood pedestal, contact shadow, destination trail, and floating ETA pill badge are fully preserved.
  - Hostile marches strictly preserve their menacing red/iron war meeple with horned helm and glowing crimson visor.
- **Sim & Server Purity**:
  - `git diff main -- packages/sim server` 100% empty.
  - All automated tests passing: 90/90 in `@second-crown/sim`, 18/18 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).
  - ChromeDock, holidays, dim lanterns, inspect card, primer, and zoom/pan fully preserved.

## 2026-09-07 — Claude Rim Fort Listing (`bakeoff/claude-walls`)

- **Sim helper (`packages/sim/src/systems/rimForts.ts`)**: new `listRimForts(state, realmId = "player")` returns `{ x, y, kind: "wall" | "gate" }[]` for finished `walls`/`gate` buildings on the 16×10 hold rim (`x===0 || y===0 || x===15 || y===9`), ordered clockwise from `(0,0)` so a renderer can stroke a connected ring.
- **Sim exports (`packages/sim/src/index.ts`)**: `listRimForts` and the `RimFort` type are now exported from `@second-crown/sim`.
- **Tests (`packages/sim/src/systems/rimForts.test.ts`)**: empty rim, mixed walls+gate sorted clockwise, and interior walls / unfinished buildings / other realms excluded.
- **Sim & App Purity**: `git diff main -- packages/app packages/render server` empty. No combat, march, fog, housing, or tickEngine changes. Full `@second-crown/sim` test suite (90 tests) and `npm run build -w @second-crown/app` pass.

## 2026-09-07 — Gemini Connected Rim Wall Run & Stronger Terrain Chips (`bakeoff/gemini-map`)

- **Connected Rim Wall Run on the Hold (`packages/render`)**:
  - Automatically queries finished rim fort structures (`listRimForts` if exported from `@second-crown/sim`, otherwise reading `state.buildings` using the matching 16×10 rim rule: `gx === 0 || gy === 0 || gx === 15 || gy === 9` ordered clockwise).
  - Draws a continuous ashlar stone curtain wall connecting adjacent rim forts (walls and gates):
    - Dark foundation plinths and dual-tone ashlar granite curtain faces (sunlit on South-West edges, shaded on South-East edges).
    - Horizontal mortar scoring lines and wall-walk walkway with timber planking center line.
    - Regular crenellated stone merlons along the outer parapet with bright coping highlights.
    - Arrow loop slits in the curtain face and center bastion towers with animated flickering wall torches.
    - Sturdy corner bastion towers anchoring the four perimeter corners `(0,0)`, `(15,0)`, `(15,9)`, `(0,9)`.
  - Gatehouses sit flush in the gap: flanking bastion towers connect seamlessly to adjacent curtain spans while retaining heavy reinforced double oak doors, iron strap hinges, portcullis teeth, and defensive pennant.
  - Interior walls (`!isRimTile`) strictly preserve the original isometric block visual.
  - Tile clicks and building placement/upgrade contracts remain 100% intact.
- **Stronger 8×6 Terrain Chips on the Board Band (`packages/render`)**:
  - All 6 tabletop province terrain chips redesigned to read instantly at 0.58 zoom (Peak, Shore, Wood, Waste, Hill, Plain).
- **Sim & Server Purity**:
  - `git diff main -- packages/sim server` 100% empty.
  - Automated tests passing: 87/87 in `@second-crown/sim`, 14/14 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).
  - Fog chips, hostile red meeple, cottage art, zoom/pan, ChromeDock, and dim lanterns completely preserved.

## 2026-09-07 — Claude War Tab Briefing (`bakeoff/claude-war2`)

- **War Tab Briefing (`packages/app/src/WarRoom.tsx`)**:
  - Replaced the old single-line "Hold defense" blurb with a "Briefing" card that reads in one glance:
    - **Incoming**: a row per hostile march headed for your hold, with realm name (revealed only once a Watchtower is built — otherwise "Unknown host") and ETA in seconds, plus current Wall HP and Gate status (up/down).
    - **Wounded**: wounded count vs. infirmary beds with a "Treat (4 food)" action.
    - **People**: population vs. housing cap.
- **Sim exports (`packages/sim/src/index.ts`)**: `gateOnRim` and `gateHp` are now exported from `@second-crown/sim` (pure re-exports of existing `systems/gate.ts` functions already used internally by `wallHp`). No behavior change.
- **Sim & Core Purity**: `git diff main -- packages/sim/src/core` empty. No combat math, march formulas, fog rules, tickEngine, Discord, or Caddy changes. Full `@second-crown/sim` test suite (87 tests) and `npm run build -w @second-crown/app` pass.

## 2026-09-07 — Gemini Isometric Cottage & Gate, Board Fog Chips & Hostile Iron Meeple (`bakeoff/gemini-board2`)

- **Distinct Isometric Cottage & Gatehouse (`packages/render`)**:
  - **Cottage (`case "cottage"`)**: Cozy half-timbered plaster residence with steep reed-thatched gable roof, ridge cresting, fieldstone chimney with gentle curled hearth smoke puffs, warm leaded-glass window with shutters and glowing candlelit interior, plank door with brass knob and stone threshold, front stone-lined flowerbed with blossoms, and stacked cord of split firewood.
  - **Gatehouse (`case "gate"`)**: Massive fortified ashlar granite gatehouse with twin bastion towers, crenellated parapets, arrow loops, and central vaulted portal arch.
    - **Rim Tile Detection (`isRimTile`)**: On rim edge tiles (`gx === 0 || gy === 0 || gx === 15 || gy === 9`), renders heavy iron-reinforced oak double-doors with blackened iron strap hinges, iron rivets, central drop-bar lock, lowered portcullis iron teeth, and a defensive crimson faction pennant atop the central curtain wall.
    - On interior tiles, presents an open vaulted courtyard archway.
- **Board-Band Tokens: Unseen Province Fog Chips (`packages/render`)**:
  - Queries existing sim state helper `isProvinceSeen(state, p.id)` without inventing a secondary fog mechanism.
  - Unseen provinces render as tactile 3D blank parchment / fog chips with drop shadow, dark vellum bevel, blank parchment face, subtle animated fog mist curves, and faint cartographer compass marks.
  - Completely hides terrain graphics, node icons, and rival heraldry until scouted or within vision range.
  - Highlight plaque masks confidential occupant identity for unscouted provinces.
- **Hostile Red/Iron March Meeple (`packages/render`)**:
  - Hostile marches (`listMarches` where `realmId !== "player"`) use an imposing red/iron meeple pawn:
    - Heavy blackened iron pedestal base with steel rivets.
    - Angular dark steel torso with spiked iron pauldrons.
    - Blood-red war tabard with crossed black iron harness straps.
    - Jagged dark iron sallet helm with horn crests and glowing crimson visor eye-slit.
    - Blackened polearm with jagged halberd axe head and ragged crimson/black battle pennant.
    - Dotted crimson route trail and blackened iron / crimson ETA pill badge.
  - Player marches retain the polished wood pedestal, royal blue tunic, bright steel helm, golden standard, and amber route trail.
- **Sim & Server Purity**:
  - `git diff main -- packages/sim server` 100% empty.
  - All automated tests passing: 87/87 in `@second-crown/sim`, 12/12 in `@second-crown/render`.
  - App production build clean (`npm run build -w @second-crown/app`).
  - Zoom/pan, tile clicks, ChromeDock, recorded audio, and dim holiday lanterns fully preserved.

## 2026-09-07 — Gemini Two-Band Camera & Tabletop Board Diorama (`bakeoff/gemini-board-cam`)

- **Two-Band Camera Architecture (`packages/render`)**:
  - Unified camera viewport on the single existing Pixi canvas with two distinct zoom bands separated by threshold `ZOOM_THRESHOLD = 0.70`:
    - **Hold Band (`zoom > 0.70`)**: 16×10 isometric turf with building placement/upgrade tile clicks, living walkers, animated keeps, holiday dressing, mist, and polished hardwood table rim.
    - **Board Band (`zoom <= 0.70`)**: Hides Hold turf detail and presents `state.board.provinces` as tactile tabletop chips on an 8×6 grid.
  - Smooth mouse wheel zooming across the threshold transitions seamlessly between close diorama view and regional tabletop view.
  - Dedicated `[Board / Hold]` toggle button next to ChromeDock and on canvas control overlay allows instant switching without mouse wheel scrolling.
- **Tabletop 8×6 Province Tokens (`packages/render`)**:
  - 8 columns × 6 rows grid framed in dark oiled walnut tabletop diorama with brass corner brackets and compass rose.
  - 6 distinct terrain chips:
    - `plain`: verdant meadow green with grass blade marks and chamomile flower dots.
    - `wood`: deep spruce forest with miniature cluster of three stylized pine trees.
    - `hill`: highland stone brown with layered rolling contour hill ridges.
    - `waste`: scorched volcanic ash with glowing amber and crimson fissure lines.
    - `shore`: coastal azure waves with sandy beach margin and surf crests.
    - `peak`: alpine granite crags with snowcapped summits.
  - Distinct node marks:
    - `hold`: carved stone keep silhouette with battlements, portcullis, and flag.
    - `camp`: striped war pavilion tent with crossed spears.
    - `woodcut`: stacked timber cord with crossed felling axes.
    - `quarry`: ashlar granite block with leaning steel pickaxe.
    - `field`: bundled golden grain sheaf bound with crimson twine.
  - Special realm occupant tokens:
    - Player Hold (`x=2, y=2`): Gilded royal brass border, 4 corner studs, royal crown emblem, crimson plaque, and golden pulse halo.
    - Iron March / Rival (`x=5, y=2`): Spiked blackened iron border, iron rivets, spiked battlements, blood-red pennant, and dark steel plaque.
- **Interactive Marching & Active March Pawn (`packages/render`, `packages/app`)**:
  - Clicking home province token snaps camera back to Hold band.
  - Clicking foreign province token calls `tryMarch(state, provinceId)` via existing `act` helper and toasts the outcome in the status banner.
  - Active march from `listMarches` / `activePlayerMarch` displays a lerped tabletop marching meeple pawn between origin and destination with animated marching bob, tabard, steel helmet, spear with pennant, dotted amber trail, and remaining ETA badge.
- **Sim & Server Purity**:
  - `git diff main -- packages/sim server` 100% empty.
  - Full automated tests passing: 68/68 in `@second-crown/sim`, 10/10 in `@second-crown/render`.

## 2026-09-06 — Gemini Citizen Job Walkers & Distinct Stone Keep (`bakeoff/gemini-jobs`)

- **Citizen Job Presentation Hook (`packages/render`)**:
  - `pickDestination` and walker presentation now read `state.citizens`.
  - Walkers assigned to player workers with an assigned tile walk directly to their workstation tile and adopt matching role visuals:
    - `farmer` → `villager` (wicker bread basket, rustic tunic)
    - `woodcutter` → `woodcutter` (felling axe, woodsman green)
    - `miner` → `miner` (quarry pickaxe, ashlar stone gray)
    - `merchant` → `merchant` (crimson mercantile robe)
    - `guard` → `guard` (steel helmet, spear with red pennant, royal blue tabard)
    - `scholar` → `scholar` (monk cowl, parchment scroll, purple habit)
  - Falls back cleanly to default center random wander when no citizens or worker tiles exist.
  - Active work pacing prevents walkers from freezing once they reach their assigned hold.
  - Full unit test coverage in `packages/render/src/index.test.ts` (5 tests passing).
- **Distinct Stone Keep (`packages/render`)**:
  - Replaced generic civic box fallback with a dedicated, towering ashlar granite keep (`h = 30 + heightBoost`).
  - Architecture: Flared talus plinth foundation, twin corner bartizans (watch turrets) with slate caps, machicolations, parapet battlements with merlon crenellations, double-height arched portal with iron portcullis grille and carved keystone, defensive arrow slits, warm candlelit leaded high royal window, courtyard ashlar steps, standing iron brazier with animated flame tongues, and a towering royal flagpole flying an animated waving crimson and gold standard.
- **Combat & Sim Integrity**:
  - Zero changes to combat math or `tickEngine`.
  - Full automated test suite passing in `@second-crown/sim` (60 tests).

## 2026-09-06 — Gemini Seasons & War Strip Overhaul (`bakeoff/gemini-seasons`)

- **Halloween-Class Board Dressing for Every Holiday & Season**:
  - **Midwinter**: Snowdrifts, pine boughs with holly berries, ice crystals; thick contoured snow roofs with hanging icicles, pine wreaths with red ribbons, warm candlelit windows with golden halos, doorstep brass lanterns; drifting frosty blizzard vapor.
  - **Easter**: Spring wildflowers & crocuses, hand-painted patterned easter eggs, fluttering pale ribbons; climbing floral vines & blooming boughs, dawn lanterns with golden-lilac morning halos; soft rolling dawn dew mist.
  - **Harvest**: Golden wheat sheaves bound with twine, field pumpkins, apple bushels, fallen leaves; amber oil lamps with deep amber flicker and cast halos, cider casks, golden wheat bundles; warm golden autumn twilight haze.
  - **Midsummer**: Golden sunflowers, solstice flower crowns on the grass, chamomile; standing iron bonfire brazier with animated dancing flames & expansive firelight halo, long light sunset highlights & marigold garlands; radiant golden heat shimmer mist.
  - **Four Seasons (when holiday is none)**: Lighter versions of ground scatter, window lighting, and ambient seasonal weather mist.
  - **Halloween**: Kept as-is (witchfire jack-o'-lanterns, pumpkins, deep purple mist banks).
- **WarLivingStrip Overhaul**:
  - Completely resolved label/portrait overlap issues by giving unit portraits and name/count badges dedicated vertical hierarchy.
  - Displays real unit type names (Militia, Spearman, Archer, Champion, etc.) and real counts only, with counts cleanly aggregated by unit type.
  - Eliminated all leftover debug labels (no "Suki", no "Stone Frontier Marker", no "duplicate Cohort").
  - Two distinct sides: player host on the left with Royal Standard Bearer; enemy vanguard on the right facing left with Host Standard Bearer; central active battle clash or peaceful border watch demarcation.
  - Crisp, spacious, and fully readable at 1280px wide.
- **Sim & Server Purity**: `git diff main -- packages/sim server` verified 100% empty.

## 2026-09-06 — Gemini Tabletop Board Presentation (`bakeoff/gemini-board`)

- **Tabletop Board & Hardwood Rim**: Recessed isometric board framed in beveled polished dark walnut with antique brass corner brackets, steel rivets, and inner drop shadow.
- **Zoom & Pan Controls (No Rotate)**: Free-form camera navigation with smooth mouse wheel zooming, pointer click-and-drag panning with velocity bounds, and on-screen `[+]`, `[-]`, `[⟲]` buttons. Strict separation between drag and click preserves 100% building click accuracy.
- **Denser Pixel Architecture**: Multi-structure vignettes across all building types (wells, crop patches, woodpile cords, stone terraces, cranes, ore carts, silos, spinning waterwheels, multi-stall bazaars, training dummies).
- **2–3 Frame Walker Sprites**: Discrete 2-3 frame walking and idle cadence (pass, left step, right step) across 6 citizen roles with integer pixel tool/weapon animations.
- **All Hallows Atmosphere**: Creeping low mist and fog banks rolling over cobblestones, jack-o'-lanterns with organic flickering witchfire glow, and gothic folklore backdrop (no Disney likenesses).
- **War Tab Living Pixel Unit Strip**: Real-time tactical army line visualizer displaying player companies, animated waving royal standard bearer, enemy cohorts, and power balance meter. Presentation-only with zero combat simulation changes.
- **Recorded Audio Playback**: Recorded audio loops (`/audio/halloween.ogg`, `/audio/easter.ogg`, `/audio/midwinter.ogg`) play on user interaction with smooth procedural synth fallback.
- **Preserved Sim/Server Purity & ChromeDock**: Zero diff on `packages/sim` and `server`. Sticky ChromeDock tools and holiday switcher intact.

## 2026-09-06 — Gemini immersion foundation (isometric pixel hold, living walkers, theme packs)

- **Isometric Pixel Hold**: 2:1 isometric diamond grid in `packages/render` replacing flat 2D grid. Retains identical 16×10 tile click contract for placing/upgrading buildings.
- **Detailed Pixel Buildings**: Silhouettes for all 15 building types + fallback with construction scaffolding, level upgrade frames (1–5), chimney smoke, and seasonal trims.
- **Living Presentation Walkers**: 8 animated pixel citizens (villagers, woodcutters, miners, merchants, sentries, scholars) with walking strides and idle routines roaming between buildings. Zero sim tick rules.
- **Theme Packs System**: 9 complete packs in `packages/app/src/themes/` (halloween, midwinter, easter, harvest, midsummer, spring, summer, autumn, winter) with dedicated CSS atmospheric backgrounds, chrome, and ambient lighting.
- **Audio Manager**: Recorded audio first (`/audio/<id>.ogg`) with seamless procedural synth fallback and active battle support. Preserves owner's `halloween.ogg`.
- **Sticky TesterBar**: TesterBar pinned at `zIndex: 100` for instant holiday switching.
- **Sim & Server Purity**: `git diff main -- packages/sim server` verified empty.

## 2026-09-06 — Holiday stage + sticky tester bar

- Illustrated holiday stages (not used on plain seasons).
- TesterBar pinned so Holiday overlay stays visible.
- Recorded loop hook `/audio/<id>.ogg` with synth fallback.

## 2026-09-06 — Bakeoff merge: WarRoom, seasons, practice ledger

- Claude WarRoom, Gemini weather/audio/chips, Astra practice exchange.

## 2026-09-06 — HTTPS live + specialist buildings

- `https://129.153.17.72.sslip.io/`
