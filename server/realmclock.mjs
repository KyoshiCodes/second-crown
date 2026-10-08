// Per-realm server clocks (docs/REALTIME.md Phase 1). Memory only: a restart forgets them.
// A kept shared hold (keep.mjs) puts its clock back with resume() when it is loaded.
// Only a hold calls tick(), which starts a clock. The public tick read uses peek(), which never does.
// It does not run the sim and never reads or writes a realm save.

import { createClock, TICK_MS } from "./clock.mjs";

export const REALM_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
export const MAX_REALM_CLOCKS = 10_000;

/** One clock per realm id. The first ask starts it at 0; later asks never restart it. */
export function createRealmClocks(now = Date.now) {
  const clocks = new Map();
  return {
    /** Tick count for a realm, or null for a bad id or when the table is full. */
    tick(realmId) {
      if (typeof realmId !== "string" || !REALM_ID_RE.test(realmId)) return null;
      let clock = clocks.get(realmId);
      if (!clock) {
        if (clocks.size >= MAX_REALM_CLOCKS) return null;
        clock = createClock(now);
        clock.start();
        clocks.set(realmId, clock);
      }
      return clock.tick();
    },
    /**
     * Tick count without starting a clock: 0 for an id with no clock, null for a bad id.
     * GET /realm/:id/tick uses this, so a stranger's reads cannot fill the table.
     */
    peek(realmId) {
      if (typeof realmId !== "string" || !REALM_ID_RE.test(realmId)) return null;
      const clock = clocks.get(realmId);
      return clock ? clock.tick() : 0;
    },
    /** Forget a realm's clock. A dropped hold puts it back with resume() when it is opened again. */
    drop(realmId) {
      return clocks.delete(realmId);
    },
    /**
     * Seat a realm's clock so it reads `tick` now and counts on from there. Used only when a kept
     * hold is loaded after a restart. Never moves a running clock back. false for a bad id or tick.
     */
    resume(realmId, tick) {
      if (typeof realmId !== "string" || !REALM_ID_RE.test(realmId) || !Number.isSafeInteger(tick) || tick < 0) return false;
      const running = clocks.get(realmId);
      if (running && running.tick() >= tick) return true;
      if (!running && clocks.size >= MAX_REALM_CLOCKS) return false;
      const clock = createClock(now);
      clock.start(now() - tick * TICK_MS);
      clocks.set(realmId, clock);
      return true;
    },
    get size() {
      return clocks.size;
    },
  };
}
