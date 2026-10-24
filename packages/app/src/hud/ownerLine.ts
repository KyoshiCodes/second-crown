import { getProvince, isProvinceSeen, type GameState } from "@second-crown/sim";

/**
 * Inspect line for a tile a rival realm holds, from occupantRealmId. Reads
 * existing state only; no sim math. Player and empty tiles show nothing.
 * Unseen tiles show nothing.
 */
export function ownerLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  const occ = getProvince(state, provinceId)?.occupantRealmId;
  if (!occ || occ === "player") return null;
  return `Held by ${state.realms.find((r) => r.id === occ)?.name ?? occ}`;
}
