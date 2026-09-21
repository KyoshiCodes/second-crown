import type { GameState } from "@second-crown/shared";
import type { CitizenJobId } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";
import { researchDone } from "./research.js";
import { currentKeepGate } from "./keepGate.js";

const LABOR_PER_TICK = 0.1;
const GOLD_LABOR = 0.03;

function posted(state: GameState, job: CitizenJobId): number {
  return state.citizens.filter(
    (c) => c.realmId === "player" && c.job === job && c.tile != null
  ).length;
}

export function laborPerTick(state: GameState): Record<string, number> {
  return {
    food: posted(state, "farmer") * LABOR_PER_TICK,
    wood: posted(state, "woodcutter") * LABOR_PER_TICK,
    stone: posted(state, "miner") * LABOR_PER_TICK,
    gold: posted(state, "merchant") * GOLD_LABOR,
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
  const extra = researchDone(state, "logistics") ? 1 : 0;
  const raised = 1 + countBuilding(state, "barracks") + extra;
  return Math.max(1, Math.min(currentKeepGate(state).marchCap, raised));
}
