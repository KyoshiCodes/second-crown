import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";

export interface BuildPayload {
  typeId: string;
  x: number;
  y: number;
  realmId?: string;
}

/**
 * Validate and apply a build order immediately against the current state.
 * Returns true if the building was queued, false if rejected (can't afford, unknown type, etc.).
 * Also appends an InputRecord when successful (for replays / determinism).
 */
export function tryBuild(state: GameState, payload: BuildPayload): boolean {
  const def = getBuildingType(payload.typeId);
  if (!def) return false;

  // Can we afford it?
  for (const [res, costStr] of Object.entries(def.cost)) {
    const have = D(state.resources[res] ?? "0");
    const need = D(costStr);
    if (have.lt(need)) return false;
  }

  // Deduct cost
  for (const [res, costStr] of Object.entries(def.cost)) {
    const have = D(state.resources[res] ?? "0");
    state.resources[res] = toDecimalString(have.sub(D(costStr)));
  }

  const realmId = payload.realmId ?? "player";
  const id = `b_${state.meta.tick}_${state.buildings.length}`;

  state.buildings.push({
    id,
    typeId: def.id,
    realmId,
    x: payload.x,
    y: payload.y,
    level: 1,
    completesAtTick: def.buildTicks === 0 ? null : state.meta.tick + def.buildTicks,
  });

  const record: InputRecord = {
    tick: state.meta.tick,
    type: "build",
    payload: { ...payload, realmId },
    issuerId: realmId,
  };
  state.inputLog.push(record);

  return true;
}

/** Check affordability without mutating state (for UI). */
export function canAfford(state: GameState, typeId: string): boolean {
  const def = getBuildingType(typeId);
  if (!def) return false;
  for (const [res, costStr] of Object.entries(def.cost)) {
    if (D(state.resources[res] ?? "0").lt(D(costStr))) return false;
  }
  return true;
}
