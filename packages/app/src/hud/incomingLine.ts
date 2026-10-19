import { incomingOnProvince, isProvinceSeen, type GameState } from "@second-crown/sim";

/**
 * Inspect line for a hostile column bound for this tile. Reads existing marches
 * only; no sim math. Player columns do not count. Unseen tiles show nothing.
 */
export function incomingLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  return incomingOnProvince(state, provinceId) ? "Incoming · hostile" : null;
}
