import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";
import { buildCostMultiplier } from "./build.js";

export const MAX_BUILDING_LEVEL = 5;

export function keepLevel(state: GameState, realmId = "player"): number {
  const keeps = state.buildings.filter(
    (b) => b.realmId === realmId && b.typeId === "keep" && b.completesAtTick === null
  );
  if (keeps.length === 0) return 0;
  return Math.max(...keeps.map((b) => b.level));
}

/** Other buildings may reach keepLevel+1, floored at 2, capped at 5. Keep uses the hard cap. */
export function maxLevelFor(state: GameState, typeId: string, realmId = "player"): number {
  if (typeId === "keep") return MAX_BUILDING_LEVEL;
  return Math.min(MAX_BUILDING_LEVEL, Math.max(2, keepLevel(state, realmId) + 1));
}

export function upgradeCost(state: GameState, buildingId: string): Record<string, string> | null {
  const b = state.buildings.find((x) => x.id === buildingId);
  if (!b || b.completesAtTick !== null) return null;
  if (b.level >= maxLevelFor(state, b.typeId, b.realmId)) return null;
  const def = getBuildingType(b.typeId);
  if (!def) return null;
  const mult = buildCostMultiplier(state, b.realmId);
  const scale = b.level + 1;
  const out: Record<string, string> = {};
  for (const [res, costStr] of Object.entries(def.cost)) {
    out[res] = toDecimalString(D(costStr ?? "0").mul(scale).mul(mult).ceil());
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
  if (b.level >= maxLevelFor(state, b.typeId, b.realmId)) return false;
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
