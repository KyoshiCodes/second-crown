import type { GameState } from "@second-crown/shared";

export const WORK_PLOTS = new Set(["farm", "lumber_camp", "quarry", "gold_mine"]);

function finished(state: GameState, typeId: string, realmId: string): number {
  return state.buildings.filter(
    (b) => b.realmId === realmId && b.typeId === typeId && b.completesAtTick === null
  ).length;
}

export function housingCap(state: GameState, realmId = "player"): number {
  return 2 + finished(state, "cottage", realmId) * 2 + finished(state, "keep", realmId) * 3;
}

export function population(state: GameState, realmId = "player"): number {
  return state.citizens.filter((c) => c.realmId === realmId).length;
}

export function canHouse(state: GameState, realmId = "player"): boolean {
  return population(state, realmId) < housingCap(state, realmId);
}

/** Finished cottages and keep buy more field plots. Scaffolding still occupies a plot. */
export function workPlotCap(state: GameState, realmId = "player"): number {
  return 2 + finished(state, "cottage", realmId) * 2 + finished(state, "keep", realmId);
}

export function workPlotsUsed(state: GameState, realmId = "player"): number {
  return state.buildings.filter((b) => b.realmId === realmId && WORK_PLOTS.has(b.typeId)).length;
}

export function canRaiseWork(state: GameState, realmId = "player"): boolean {
  return workPlotsUsed(state, realmId) < workPlotCap(state, realmId);
}
