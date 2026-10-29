import { isProvinceSeen, neighbors, type GameState } from "@second-crown/sim";

/**
 * Inspect line for a seen tile at the edge of the player's vision.
 * Reads existing state only: the board's own vision (isProvinceSeen) and
 * adjacency (neighbors) helpers. Fully surrounded seen tiles and unseen
 * tiles show nothing.
 */
export function fogEdgeLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  const edge = neighbors(state, provinceId).some((n) => !isProvinceSeen(state, n.id));
  return edge ? "Fog edge" : null;
}
