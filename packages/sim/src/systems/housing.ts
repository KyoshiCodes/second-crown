import type { GameState } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";

export const WORK_PLOTS = new Set(["farm", "lumber_camp", "quarry", "gold_mine"]);

export function housingCap(state: GameState, realmId = "player"): number {
  return 2 + countBuilding(state, "cottage", realmId) * 2 + countBuilding(state, "keep", realmId) * 3;
}

export function population(state: GameState, realmId = "player"): number {
  return state.citizens.filter((c) => c.realmId === realmId).length;
}

export function canHouse(state: GameState, realmId = "player"): boolean {
  return population(state, realmId) < housingCap(state, realmId);
}

/** Finished plus scaffolding. Cottages and the keep buy more field plots. */
export function workPlotCap(state: GameState, realmId = "player"): number {
  return 2 + countBuilding(state, "cottage", realmId) * 2 + countBuilding(state, "keep", realmId);
}

export function workPlotsUsed(state: GameState, realmId = "player"): number {
  return state.buildings.filter((b) => b.realmId === realmId && WORK_PLOTS.has(b.typeId)).length;
}

export function canRaiseWork(state: GameState, realmId = "player"): boolean {
  return workPlotsUsed(state, realmId) < workPlotCap(state, realmId);
}
