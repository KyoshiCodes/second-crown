import { garrisonAt, isProvinceSeen, type GameState } from "@second-crown/sim";

/**
 * Inspect line for a player garrison posted on this tile. Reads the existing
 * garrison helper only; no sim math. Unseen tiles show nothing.
 */
export function garrisonLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  return garrisonAt(state, provinceId) ? "Garrison · posted" : null;
}
