import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getUnitType } from "../content/units.js";
import { countBuilding } from "../content/buildings.js";
import { flagNum } from "../systems/wave.js";
import { decreeActive } from "../systems/decree.js";
import { unitUnlocked } from "../systems/research.js";
import { enqueueTraining, listTraining, trainingQueueCap } from "../systems/training.js";

export interface TrainPayload {
  typeId: string;
  count: number;
  realmId?: string;
}

function barracksOnKeepYard(state: GameState): boolean {
  const keeps = state.buildings.filter(
    (b) => b.realmId === "player" && b.typeId === "keep" && b.completesAtTick === null
  );
  if (keeps.length === 0) return false;
  return state.buildings.some(
    (b) =>
      b.realmId === "player" &&
      b.typeId === "barracks" &&
      b.completesAtTick === null &&
      keeps.some((k) => Math.abs(k.x - b.x) + Math.abs(k.y - b.y) === 1)
  );
}

export function trainCostMultiplier(state: GameState, typeId?: string): number {
  const n = countBuilding(state, "barracks");
  let m = Math.max(0.5, 1 - n * 0.05);
  if (flagNum(state, "craft_train")) m *= 0.9;
  if (state.flags.doctrine === "host") m *= 0.92;
  if (decreeActive(state, "muster")) m *= 0.9;
  if (typeId === "cavalry" || typeId === "knight") {
    if (countBuilding(state, "stables") > 0) m *= 0.9;
  }
  if (typeId === "archer" || typeId === "skirmisher") {
    if (countBuilding(state, "archery_range") > 0) m *= 0.9;
  }
  if (typeId === "siege") {
    if (countBuilding(state, "siege_workshop") > 0) m *= 0.85;
  }
  if (barracksOnKeepYard(state)) m *= 0.9;
  return Math.max(0.45, m);
}

export function tryTrain(state: GameState, payload: TrainPayload): boolean {
  const def = getUnitType(payload.typeId);
  if (!def || payload.count < 1) return false;
  if (!unitUnlocked(state, def.id)) return false;
  const realmId = payload.realmId ?? "player";
  if (listTraining(state, realmId).length >= trainingQueueCap(state, realmId)) return false;
  const count = Math.floor(payload.count);
  const mult = trainCostMultiplier(state, def.id);
  const paid: Record<string, string> = {};
  for (const [res, costStr] of Object.entries(def.cost)) {
    const need = D(costStr ?? "0").mul(count).mul(mult).ceil();
    if (D(state.resources[res] ?? "0").lt(need)) return false;
    paid[res] = toDecimalString(need);
  }
  for (const [res, amount] of Object.entries(paid)) {
    state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").sub(amount));
  }
  if (!enqueueTraining(state, def.id, count, realmId, paid)) return false;
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
  if (!unitUnlocked(state, typeId)) return false;
  const realmId = "player";
  if (listTraining(state, realmId).length >= trainingQueueCap(state, realmId)) return false;
  const mult = trainCostMultiplier(state, typeId);
  for (const [res, costStr] of Object.entries(def.cost)) {
    const need = D(costStr ?? "0").mul(count).mul(mult).ceil();
    if (D(state.resources[res] ?? "0").lt(need)) return false;
  }
  return true;
}
