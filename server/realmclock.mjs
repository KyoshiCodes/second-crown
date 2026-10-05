// Per-realm server clocks (docs/REALTIME.md Phase 1). Memory only: a restart forgets them.
// It does not run the sim and never reads or writes a realm save.

import { createClock } from "./clock.mjs";

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
    get size() {
      return clocks.size;
    },
  };
}
