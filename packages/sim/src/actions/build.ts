import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";

export interface BuildPayload {
  typeId: string;
  x: number;
  y: number;
  realmId?: string;
}

/** Cost multiplier from ruler traits (ambitious = 10% cheaper). */
export function buildCostMultiplier(state: GameState, realmId: string): number {
  const ruler = state.characters.find((c) => c.realmId === realmId && c.role === "ruler");
  if (!ruler) return 1;
  if (ruler.traits.includes("ambitious")) return 0.9;
  return 1;
}

export function tryBuild(state: GameState, payload: BuildPayload): boolean {
  const def = getBuildingType(payload.typeId);
  if (!def) return false;

  const realmId = payload.realmId ?? "player";
  const mult = buildCostMultiplier(state, realmId);

  for (const [res, costStr] of Object.entries(def.cost)) {
    const need = D(costStr).mul(mult).ceil();
    if (D(state.resources[res] ?? "0").lt(need)) return false;
  }

  for (const [res, costStr] of Object.entries(def.cost)) {
    const need = D(costStr).mul(mult).ceil();
    state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").sub(need));
  }

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

export function canAfford(state: GameState, typeId: string, realmId = "player"): boolean {
  const def = getBuildingType(typeId);
  if (!def) return false;
  const mult = buildCostMultiplier(state, realmId);
  for (const [res, costStr] of Object.entries(def.cost)) {
    const need = D(costStr).mul(mult).ceil();
    if (D(state.resources[res] ?? "0").lt(need)) return false;
  }
  return true;
}
