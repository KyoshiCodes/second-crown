import { isProvinceSeen, listMarches, type GameState } from "@second-crown/sim";

/**
 * Inspect line for a player scout on or bound for this tile. Reads existing
 * marches only; no sim math. A scout whose arrival tick has come is here.
 * Unseen tiles show nothing.
 */
export function scoutLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  const scouts = listMarches(state).filter((m) => m.realmId === "player" && m.purpose === "scout" && m.toId === provinceId);
  if (scouts.length === 0) return null;
  return scouts.some((m) => m.arrivesTick <= state.meta.tick) ? "Scout · here" : "Scout · inbound";
}
