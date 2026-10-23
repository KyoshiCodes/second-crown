import { getProvince, isProvinceSeen, listOutposts, type GameState } from "@second-crown/sim";

/**
 * Inspect line for your outpost or a hostile camp on this tile. Reads existing
 * outposts and occupants only; no sim math. Unseen tiles and your home show nothing.
 */
export function outpostLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  const p = getProvince(state, provinceId);
  if (!p || provinceId === state.board.homeProvinceId) return null;
  if (listOutposts(state).some((o) => o.id === provinceId)) return "Your outpost";
  if (p.node === "camp" && p.occupantRealmId !== "player") return "Rival camp";
  return null;
}
