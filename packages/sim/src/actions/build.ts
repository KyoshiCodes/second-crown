import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";
import { unlock } from "../systems/wave.js";
import { addCapped } from "../systems/storage.js";
import { WORK_PLOTS, canRaiseWork } from "../systems/housing.js";

export interface BuildPayload {
  typeId: string;
  x: number;
  y: number;
  realmId?: string;
}

const HOLD_W = 16;
const HOLD_H = 10;
const RIM_ONLY = new Set(["walls", "gate"]);
const UNIQUE = new Set([
  "keep",
  "gate",
  "academy",
  "mint",
  "chapel",
  "stables",
  "archery_range",
  "siege_workshop",
]);

export function isHoldRim(x: number, y: number): boolean {
  return x === 0 || y === 0 || x === HOLD_W - 1 || y === HOLD_H - 1;
}

export function isUniqueBuilding(typeId: string): boolean {
  return UNIQUE.has(typeId);
}

export function buildingAt(state: GameState, x: number, y: number) {
  return state.buildings.find((b) => b.x === x && b.y === y);
}

export function canPlaceAt(state: GameState, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= HOLD_W || y >= HOLD_H) return false;
  return !buildingAt(state, x, y);
}

export function realmOwnsType(state: GameState, typeId: string, realmId = "player"): boolean {
  return state.buildings.some((b) => b.realmId === realmId && b.typeId === typeId);
}

function rimForts(state: GameState, realmId: string) {
  return state.buildings.filter(
    (b) => b.realmId === realmId && RIM_ONLY.has(b.typeId) && isHoldRim(b.x, b.y)
  );
}

export function rimRunTouches(state: GameState, x: number, y: number, realmId = "player"): boolean {
  const existing = rimForts(state, realmId);
  if (existing.length === 0) return true;
  return existing.some((b) => Math.abs(b.x - x) + Math.abs(b.y - y) === 1);
}

export function canPlaceType(state: GameState, typeId: string, x: number, y: number, realmId = "player"): boolean {
  if (!canPlaceAt(state, x, y)) return false;
  if (RIM_ONLY.has(typeId) && !isHoldRim(x, y)) return false;
  if (RIM_ONLY.has(typeId) && !rimRunTouches(state, x, y, realmId)) return false;
  if (UNIQUE.has(typeId) && realmOwnsType(state, typeId, realmId)) return false;
  if (WORK_PLOTS.has(typeId) && !canRaiseWork(state, realmId)) return false;
  return true;
}

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
  if (!canPlaceType(state, payload.typeId, payload.x, payload.y, realmId)) return false;
  const mult = buildCostMultiplier(state, realmId);
  for (const [res, costStr] of Object.entries(def.cost)) {
    const need = D(costStr ?? "0").mul(mult).ceil();
    if (D(state.resources[res] ?? "0").lt(need)) return false;
  }
  for (const [res, costStr] of Object.entries(def.cost)) {
    const need = D(costStr ?? "0").mul(mult).ceil();
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
  if (def.id === "farm") unlock(state, "ach_farm");
  state.inputLog.push({
    tick: state.meta.tick,
    type: "build",
    payload: { ...payload, realmId },
    issuerId: realmId,
  } satisfies InputRecord);
  return true;
}

export function canAfford(state: GameState, typeId: string, realmId = "player"): boolean {
  const def = getBuildingType(typeId);
  if (!def) return false;
  const mult = buildCostMultiplier(state, realmId);
  for (const [res, costStr] of Object.entries(def.cost)) {
    const need = D(costStr ?? "0").mul(mult).ceil();
    if (D(state.resources[res] ?? "0").lt(need)) return false;
  }
  return true;
}

export function listWorksInProgress(state: GameState, realmId = "player") {
  return state.buildings.filter((b) => b.realmId === realmId && b.completesAtTick !== null);
}

export function buildTicksLeft(state: GameState, buildingId: string): number {
  const b = state.buildings.find((x) => x.id === buildingId);
  if (!b || b.completesAtTick === null) return 0;
  return Math.max(0, b.completesAtTick - state.meta.tick);
}

/** Tear down scaffolding. Refunds the unused fraction of the paid cost. */
export function tryCancelBuild(state: GameState, buildingId: string): boolean {
  const idx = state.buildings.findIndex((b) => b.id === buildingId);
  if (idx < 0) return false;
  const b = state.buildings[idx];
  if (b.completesAtTick === null) return false;
  const def = getBuildingType(b.typeId);
  if (!def || def.buildTicks <= 0) return false;
  const left = Math.max(0, b.completesAtTick - state.meta.tick);
  const frac = Math.min(1, left / def.buildTicks);
  const mult = buildCostMultiplier(state, b.realmId);
  for (const [res, costStr] of Object.entries(def.cost)) {
    const paid = D(costStr ?? "0").mul(mult).ceil();
    addCapped(state, res, paid.mul(frac));
  }
  state.buildings.splice(idx, 1);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "cancel_build",
    issuerId: b.realmId,
    payload: { buildingId, typeId: b.typeId },
  });
  return true;
}

const SALVAGE = 0.3;

/** Tear down a finished work. Keep stays. Salvage is 30% of base cost × level. */
export function tryDemolish(state: GameState, buildingId: string): boolean {
  const idx = state.buildings.findIndex((b) => b.id === buildingId);
  if (idx < 0) return false;
  const b = state.buildings[idx];
  if (b.typeId === "keep") return false;
  if (b.completesAtTick !== null) return false;
  const def = getBuildingType(b.typeId);
  if (!def) return false;
  const level = Math.max(1, b.level ?? 1);
  const mult = buildCostMultiplier(state, b.realmId);
  for (const [res, costStr] of Object.entries(def.cost)) {
    const paid = D(costStr ?? "0").mul(mult).ceil();
    addCapped(state, res, paid.mul(SALVAGE).mul(level));
  }
  state.buildings.splice(idx, 1);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "demolish",
    issuerId: b.realmId,
    payload: { buildingId, typeId: b.typeId },
  });
  return true;
}
