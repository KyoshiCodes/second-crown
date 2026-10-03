import type { GameState } from "@second-crown/shared";
import { cottageCultureBonus } from "./culture.js";

export const WORK_PLOTS = new Set(["farm", "lumber_camp", "quarry", "gold_mine"]);

function finishedOf(state: GameState, typeId: string, realmId: string) {
  return state.buildings.filter(
    (b) => b.realmId === realmId && b.typeId === typeId && b.completesAtTick === null
  );
}

function levelsOf(state: GameState, typeId: string, realmId: string): number {
  return finishedOf(state, typeId, realmId).reduce((n, b) => n + Math.max(1, b.level ?? 1), 0);
}

function keepLv(state: GameState, realmId: string): number {
  const keeps = finishedOf(state, "keep", realmId);
  if (keeps.length === 0) return 0;
  return Math.max(...keeps.map((b) => Math.max(1, b.level ?? 1)));
}

export function housingCap(state: GameState, realmId = "player"): number {
  const cottageBonus = finishedOf(state, "cottage", realmId).length * cottageCultureBonus(state, realmId);
  return 2 + levelsOf(state, "cottage", realmId) * 2 + keepLv(state, realmId) * 3 + cottageBonus;
}

export function population(state: GameState, realmId = "player"): number {
  return state.citizens.filter((c) => c.realmId === realmId).length;
}

export function canHouse(state: GameState, realmId = "player"): boolean {
  return population(state, realmId) < housingCap(state, realmId);
}

/** Cottages buy 2 plots per level. Keep level buys 1 plot. Scaffolding still occupies a plot. */
export function workPlotCap(state: GameState, realmId = "player"): number {
  return 2 + levelsOf(state, "cottage", realmId) * 2 + keepLv(state, realmId);
}

export function workPlotsUsed(state: GameState, realmId = "player"): number {
  return state.buildings.filter((b) => b.realmId === realmId && WORK_PLOTS.has(b.typeId)).length;
}

export function canRaiseWork(state: GameState, realmId = "player"): boolean {
  return workPlotsUsed(state, realmId) < workPlotCap(state, realmId);
}
