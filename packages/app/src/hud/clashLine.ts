import { getProvince, incomingOnProvince, isProvinceSeen, listMarches, type GameState } from "@second-crown/sim";

/**
 * Inspect line for a fight on this tile. Reads existing marches only; no sim math.
 * A column clash is columns of two realms bound for the tile; an engagement is a
 * rival column bound for a tile the player holds. Unseen tiles show nothing.
 */
export function clashLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  const realms = new Set(listMarches(state).filter((m) => m.toId === provinceId).map((m) => m.realmId));
  const held = getProvince(state, provinceId)?.occupantRealmId === "player" || provinceId === state.board.homeProvinceId;
  const engaged = held && Boolean(incomingOnProvince(state, provinceId));
  return realms.size >= 2 || engaged ? "Clash · fighting" : null;
}
