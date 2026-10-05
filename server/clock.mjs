// Server clock (docs/REALTIME.md Phase 1). Turns elapsed real time into a tick count.
// It does not run the sim and never reads or writes a realm save. Nothing calls it yet:
// the browser and offline catch-up still own time for every realm.

import { TICKS_PER_SECOND } from "./savegate.mjs";

export const TICK_MS = 1000 / TICKS_PER_SECOND; // 100 ms, the slice the game shows as seconds

/** Whole ticks between two millisecond timestamps. Never negative. */
export function ticksBetween(startMs, nowMs) {
  if (!Number.isFinite(startMs) || !Number.isFinite(nowMs) || nowMs <= startMs) return 0;
  return Math.floor((nowMs - startMs) / TICK_MS);
}

/** A clock that counts ticks from start(). Unstarted, it stays at 0. It never counts down. */
export function createClock(now = Date.now) {
  let startMs = null;
  let highTick = 0;
  return {
    start(atMs = now()) {
      startMs = atMs;
      highTick = 0;
    },
    get started() {
      return startMs !== null;
    },
    tick(atMs = now()) {
      if (startMs === null) return 0;
      highTick = Math.max(highTick, ticksBetween(startMs, atMs));
      return highTick;
    },
  };
}
