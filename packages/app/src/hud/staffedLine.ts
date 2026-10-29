import { isProvinceSeen, staffBonus, type GameState } from "@second-crown/sim";

/**
 * Inspect line for a finished player building with at least one worker posted.
 * Reads existing state only; staffBonus > 1 is the sim's own "has a worker"
 * check (the same one emptyStaffWorks uses). Player buildings sit on the hold
 * grid at homeProvinceId, so only the home tile can show this. Empty buildings
 * and unseen tiles show nothing.
 */
export function staffedLine(state: GameState, provinceId: string): string | null {
  if (!isProvinceSeen(state, provinceId)) return null;
  if (provinceId !== state.board.homeProvinceId) return null;
  const staffed = state.buildings.some(
    (b) => b.realmId === "player" && b.completesAtTick === null && staffBonus(state, b) > 1
  );
  return staffed ? "Staffed" : null;
}
