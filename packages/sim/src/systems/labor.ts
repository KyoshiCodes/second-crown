import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countCitizensByJob } from "./citizens.js";
import { countBuilding } from "../content/buildings.js";

const LABOR_PER_TICK = 0.1;
const GOLD_LABOR = 0.03;

export function laborPerTick(state: GameState): Record<string, number> {
  return {
    food: countCitizensByJob(state, "player", "farmer") * LABOR_PER_TICK,
    wood: countCitizensByJob(state, "player", "woodcutter") * LABOR_PER_TICK,
    stone: countCitizensByJob(state, "player", "miner") * LABOR_PER_TICK,
    gold: countCitizensByJob(state, "player", "merchant") * GOLD_LABOR,
  };
}

export function applyLabor(state: GameState, ticks: number): void {
  if (ticks <= 0) return;
  const labor = laborPerTick(state);
  for (const [res, n] of Object.entries(labor)) {
    if (n > 0) state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").add(n * ticks));
  }
}

export function maxMarches(state: GameState): number {
  return Math.min(3, 1 + countBuilding(state, "barracks"));
}
