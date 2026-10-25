import { getBuildingType, isProvinceSeen, type GameState } from "@second-crown/sim";

/**
 * Inspect line naming a finished player building on a tile. Reads existing
 * state only; no sim math. Player buildings sit on the hold grid at
 * homeProvinceId (BuildingInstance has no province), so only the home tile can
 * show one; the first finished building (completesAtTick null, as countBuilding
 * reads it) is named. Under-construction buildings and unseen tiles show nothing.
 */
export function buildingLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  if (provinceId !== state.board.homeProvinceId) return null;
  const done = state.buildings.find((b) => b.realmId === "player" && b.completesAtTick === null);
  if (!done) return null;
  return getBuildingType(done.typeId)?.name ?? null;
}
