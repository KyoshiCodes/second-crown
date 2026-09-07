import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countCitizensByJob } from "./citizens.js";
import { countBuilding } from "../content/buildings.js";

const JOB_RES: Record<string, string> = {
  farmer: "food",
  woodcutter: "wood",
  miner: "stone",
  merchant: "gold",
};

export function laborPerTick(state: GameState): Record<string, number> {
  const out: Record<string, number> = {};
  const counts = countCitizensByJob(state, "player");
  for (const [job, res] of Object.entries(JOB_RES)) {
    const n = counts[job] ?? 0;
    if (n > 0) out[res] = (out[res] ?? 0) + n;
  }
  return out;
}

export function applyLabor(state: GameState, ticks: number): void {
  if (ticks <= 0) return;
  const labor = laborPerTick(state);
  for (const [res, n] of Object.entries(labor)) {
    state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").add(n * ticks));
  }
}

export function maxMarches(state: GameState): number {
  return Math.min(3, 1 + countBuilding(state, "barracks"));
}
