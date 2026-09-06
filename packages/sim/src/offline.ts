import type { GameState } from "@second-crown/shared";
import { MAX_OFFLINE_MS, TICKS_PER_SECOND } from "@second-crown/shared";
import { TickEngine } from "./core/tickEngine.js";

/**
 * Apply offline progress since state.meta.lastRealTime.
 * Caps at MAX_OFFLINE_MS (30 days). Updates lastRealTime to now.
 * Returns how many fine ticks were settled.
 */
export function applyOfflineProgress(state: GameState, now = Date.now()): number {
  const elapsedMs = Math.max(0, now - state.meta.lastRealTime);
  const cappedMs = Math.min(elapsedMs, MAX_OFFLINE_MS);
  const ticks = Math.floor((cappedMs / 1000) * TICKS_PER_SECOND);

  if (ticks > 0) {
    const engine = new TickEngine(state);
    engine.settleTicks(ticks);
  }

  state.meta.lastRealTime = now;
  return ticks;
}
