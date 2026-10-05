# DECISIONS — architecture decision records

Last updated: 2026-10-04

Records 001–007 are the original locked design ADRs (free placement, hybrid themes, Watch before Report, intrigue later, two themes at 1.0, web stack, license deferred). They stay in git history on this file’s earlier revision if you need the long form. Summary of 001–007: see repo history before this date, or the 2026-09-05 commit.

This file now appends playtest-era ADRs. Never delete; supersede.

---

## ADR-008 — Playtest backend on Oracle Always Free

**Date:** 2026-09-06 · **Status:** Accepted · **Decided by:** owner

**Context.** ADR-006 forbade a backend so 1.0 could ship serverless. Friends needed shared saves before Discord-scale infra existed. Owner already had an Oracle A1.Flex VM.

**Options.** GitHub Pages only; Render/Fly free tier; Oracle VM.

**Decision.** One Node process on the existing Oracle VM, port 8787, stores JSON under `server/data/`.

**Consequences.** Security lists + iptables, HTTP not HTTPS, public IP can change if not reserved.

**Mitigation.** Server never ticks the sim. Saves are blobs. Determinism stays on the client. This does not license a general multiplayer backend.

---

## ADR-009 — Discord OAuth plus guest tokens

**Date:** 2026-09-06 · **Status:** Accepted · **Decided by:** owner

**Context.** Testers need persistent identity. Display names collide and must not be keys.

**Decision.** Saves keyed by `guest_*` or `discord_*` ids and a random bearer token. Discord scope `identify` only. Guests get a copy-paste recovery code (the token).

**Consequences.** Losing the token loses guest access. HTTP OAuth shows a Discord warning.

**Mitigation.** Same-browser localStorage keeps the token. Discord is the durable identity. No passwords stored.

---

## ADR-010 — Spectator is a save snapshot

**Date:** 2026-09-06 · **Status:** Accepted · **Decided by:** owner

**Context.** Friends should watch a kingdom. True lockstep needs shared input logs and a host clock.

**Decision.** `POST /watch` issues a short code. Push save mirrors the blob. Spectators poll every 4s and render read-only.

**Consequences.** Delay, no live ticks, no co-op commands.

**Mitigation.** Good enough for playtest. A later ADR may add lockstep; it must not change `resolveBattle` RNG order.

---

## ADR-011 — A shared hold may run the sim on the server

**Date:** 2026-10-04 · **Status:** Accepted · **Decided by:** owner

**Context.** docs/REALTIME.md Phase 3: two browsers on one hold must see the same tick and each other's actions. Actions are intents, applied on a tick boundary. ADR-008 said the server never ticks the sim, and `AGENTS.md` said "no sim on the server". Applying intents on the server needs the sim there.

**Options.** (a) Keep the rule and let browsers trade states (cheatable, two sources of truth). (b) Copy the rules into `server/` (two rule sets drift). (c) Let the server call `packages/sim` for a shared hold only.

**Decision.** (c). A shared hold may run `packages/sim` on the server. Solo play does not. The server loads the sim as-is (Vite `runnerImport` of `packages/sim/src/index.ts`) and calls it; no rule is copied into `server/`. The hold is in memory, keyed by realm id, timed by the Phase 1 clock. It takes intents, never a full client state, and never reads or writes the solo save.

**Consequences.** Supersedes ADR-008's "server never ticks the sim" for shared holds only. The server now depends on `vite` being installed when a hold is touched. A restart forgets every hold. Determinism is same-build only (INVARIANTS §5), so the server copy is the authority for a shared hold.

**Mitigation.** No realm is shared: the server's shared set is empty and the app's `sharedRealmId` returns null, so the sim is never loaded on the live server and the live game is unchanged. Marking a realm shared is a separate owner decision. INVARIANTS §17.

---

## ADR-001 through ADR-007 (locked design, 2026-09-05)

- **001** Free tile placement; no citizen agents.
- **002** Themes = cosmetic + one costed perk.
- **003** Watch-mode visualization is a view over a headless resolver.
- **004** Full intrigue is 1.0-scope but characters exist early.
- **005** 1.0 ships two themes.
- **006** TS monorepo, Vite, React, Pixi, Vitest. Originally no backend (superseded for *playtest only* by 008).
- **007** No LICENSE; repo private until the owner says otherwise.
