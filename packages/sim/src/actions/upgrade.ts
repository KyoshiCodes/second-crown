import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";
import { buildCostMultiplier } from "./build.js";

export const MAX_BUILDING_LEVEL = 5;

export function upgradeCost(state: GameState, buildingId: string): Record<string, string> | null {
  const b = state.buildings.find((x) => x.id === buildingId);
  if (!b || b.completesAtTick !== null) return null;
  if (b.level >= MAX_BUILDING_LEVEL) return null;
  const def = getBuildingType(b.typeId);
  if (!def) return null;
  const mult = buildCostMultiplier(state, b.realmId);
  const scale = b.level + 1;
  const out: Record<string, string> = {};
  for (const [res, costStr] of Object.entries(def.cost)) {
    out[res] = toDecimalString(D(costStr).mul(scale).mul(mult).ceil());
  }
  return out;
}

export function canUpgrade(state: GameState, buildingId: string): boolean {
  const cost = upgradeCost(state, buildingId);
  if (!cost) return false;
  for (const [res, need] of Object.entries(cost)) {
    if (D(state.resources[res] ?? "0").lt(D(need))) return false;
  }
  return true;
}

export function tryUpgrade(state: GameState, buildingId: string): boolean {
  const b = state.buildings.find((x) => x.id === buildingId);
  if (!b || b.completesAtTick !== null) return false;
  if (b.level >= MAX_BUILDING_LEVEL) return false;
  const cost = upgradeCost(state, buildingId);
  if (!cost) return false;
  for (const [res, need] of Object.entries(cost)) {
    if (D(state.resources[res] ?? "0").lt(D(need))) return false;
  }
  for (const [res, need] of Object.entries(cost)) {
    state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").sub(D(need)));
  }
  b.level += 1;

  state.inputLog.push({
    tick: state.meta.tick,
    type: "upgrade",
    payload: { buildingId, level: b.level },
    issuerId: b.realmId,
  } satisfies InputRecord);
  return true;
}
