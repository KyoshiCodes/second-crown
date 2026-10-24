import { isProvinceSeen, type GameState } from "@second-crown/sim";

/**
 * Inspect line for a tile that is part of the player's hold. Reads existing
 * state only; no sim math. Player buildings sit on the hold grid at
 * homeProvinceId (BuildingInstance has no province), so the home tile is the
 * hold and the only tile a player building can be on. Unseen tiles show nothing.
 */
export function holdLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  if (provinceId !== state.board.homeProvinceId) return null;
  return "Your hold";
}
