import type { GameState } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";

export function housingCap(state: GameState, realmId = "player"): number {
  return 2 + countBuilding(state, "cottage") * 2 + countBuilding(state, "keep") * 3;
}

export function population(state: GameState, realmId = "player"): number {
  return state.citizens.filter((c) => c.realmId === realmId).length;
}

export function canHouse(state: GameState, realmId = "player"): boolean {
  return population(state, realmId) < housingCap(state, realmId);
}
