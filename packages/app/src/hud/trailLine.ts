import { isProvinceSeen, listMarches, type GameState } from "@second-crown/sim";

/**
 * Inspect line for your own column on or bound for this tile. Reads existing
 * marches only; no sim math. Rival columns do not count. Unseen tiles show nothing.
 */
export function trailLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  const out = listMarches(state).some((m) => m.realmId === "player" && m.toId === provinceId);
  return out ? "Your column · out" : null;
}
