import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countCitizensByJob } from "./citizens.js";
import { countBuilding } from "../content/buildings.js";

export function laborPerTick(state: GameState): Record<string, number> {
  return {
    food: countCitizensByJob(state, "player", "farmer"),
    wood: countCitizensByJob(state, "player", "woodcutter"),
    stone: countCitizensByJob(state, "player", "miner"),
    gold: countCitizensByJob(state, "player", "merchant"),
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
