import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getUnitType } from "../content/units.js";
import { countBuilding } from "../content/buildings.js";

export interface TrainPayload {
  typeId: string;
  count: number;
  realmId?: string;
}

export function trainCostMultiplier(state: GameState): number {
  const n = countBuilding(state, "barracks");
  return Math.max(0.5, 1 - n * 0.05);
}

export function tryTrain(state: GameState, payload: TrainPayload): boolean {
  const def = getUnitType(payload.typeId);
  if (!def || payload.count < 1) return false;

  const realmId = payload.realmId ?? "player";
  const count = Math.floor(payload.count);
  const mult = trainCostMultiplier(state);

  for (const [res, costStr] of Object.entries(def.cost)) {
    const need = D(costStr ?? "0").mul(count).mul(mult).ceil();
    if (D(state.resources[res] ?? "0").lt(need)) return false;
  }

  for (const [res, costStr] of Object.entries(def.cost)) {
    const need = D(costStr ?? "0").mul(count).mul(mult).ceil();
    state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").sub(need));
  }

  const existing = state.units.find(
    (u) => u.typeId === def.id && u.realmId === realmId && u.armyId === null
  );
  if (existing) {
    existing.count = toDecimalString(D(existing.count).add(count));
  } else {
    state.units.push({
      id: `u_${state.meta.tick}_${state.units.length}`,
      typeId: def.id,
      realmId,
      count: toDecimalString(count),
      armyId: null,
    });
  }

  state.inputLog.push({
    tick: state.meta.tick,
    type: "train",
    payload: { ...payload, realmId, count },
    issuerId: realmId,
  } satisfies InputRecord);

  return true;
}

export function canAffordTrain(state: GameState, typeId: string, count = 1): boolean {
  const def = getUnitType(typeId);
  if (!def || count < 1) return false;
  const mult = trainCostMultiplier(state);
  for (const [res, costStr] of Object.entries(def.cost)) {
    const need = D(costStr ?? "0").mul(count).mul(mult).ceil();
    if (D(state.resources[res] ?? "0").lt(need)) return false;
  }
  return true;
}
