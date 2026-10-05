# Real-time spec (plan only)

Status: **Phase 1 clock wired** (`server/clock.mjs`; `GET /realm/:id/tick` in `server/realmclock.mjs`, memory only; app reads it only for a shared realm). **Phase 2 save** merged (`gateSave` refuses browser uploads to a shared realm; `packages/app/src/game/loadSaved.ts` reads the server save on a shared reload). **Phase 3 shared hold** on `wave/realtime-hold`, not merged (`server/hold.mjs`, one stamp intent; rule change in ADR-011 / INVARIANTS §17). No realm is shared yet. The live game is unchanged.

Three phases, in this order. Each phase must be finished and merged before the next one starts.

---

## Phase 1 — Clock

- **The tick stays.** One tick is the same fixed slice the game already shows as seconds. Nothing about tick length or tick math changes.
- A future **server clock** advances ticks while a shared realm is open.
- The **browser sends actions only.** It does not decide how many ticks have passed in a shared realm.
- **Closing the tab does not fast-forward a shared world.** No offline catch-up burst on a shared realm when a player comes back.
- **A solo crown may still catch up** the way it does today (offline catch-up in `packages/sim/src/offline.ts`).
- **Do not replace tick math with `Date.now()`.** Time enters the sim only as a tick count passed in from outside (`INVARIANTS.md` §1). The server clock's job is to produce that count, not to change how the sim reads time.

## Phase 2 — Save

- **The server stores the realm.** The server save is the source of truth.
- **The browser is not the source of truth.** Its local copy is a cache.
- **A reload reads the server save**, not local storage.
- **Cheating the local save must not change a shared realm.** Editing local storage or a downloaded save can, at most, change what that one browser shows until the next reload.

## Phase 3 — Shared hold

- **Two browsers on one hold see the same tick.**
- **Actions are intents.** A browser sends "I want to do X"; it does not send a new state.
- The **server applies intents on a tick boundary** and sends the new state back to every browser on that hold.
- **Combat rules stay in the sim** (`packages/sim`). No second copy of the rules on the server.

**This phase breaks today's rule "no sim on the server."** Today `server/index.mjs` stores JSON saves, Discord and the board, and does not run the sim (`AGENTS.md`). Applying intents on the server means the server must run `packages/sim`. That rule change is an owner decision and must be written into `INVARIANTS.md` and `DECISIONS.md` before any Phase 3 code. The owner approved it on 2026-10-04 (ADR-011, INVARIANTS §17).

---

## Out of scope

- Guilds
- Auction
- HTTPS cutover
- Another dawn gift
