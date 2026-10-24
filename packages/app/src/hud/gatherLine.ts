import { isProvinceSeen, listGathers, type GameState } from "@second-crown/sim";

/**
 * Inspect line for a player gather on or bound for this tile. Reads existing
 * gathers only; no sim math. A gathering column is here, an outbound one is
 * inbound, a returning one has left. Unseen tiles show nothing.
 */
export function gatherLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  const gathers = listGathers(state).filter((g) => g.realmId === "player" && g.toId === provinceId);
  if (gathers.some((g) => g.phase === "gathering")) return "Gather · here";
  if (gathers.some((g) => g.phase === "outbound")) return "Gather · inbound";
  return null;
}
