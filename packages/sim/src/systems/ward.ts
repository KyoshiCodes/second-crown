import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";

const REPAIR_STONE = 8;
const TREAT_FOOD = 4;

export function woundedCount(state: GameState): number {
  return Math.max(0, Number(state.flags.wounded_player ?? 0));
}

export function infirmaryBeds(state: GameState): number {
  return countBuilding(state, "infirmary") * 10;
}

export function absorbWounded(state: GameState, lost: number): number {
  if (lost <= 0) return 0;
  const beds = infirmaryBeds(state);
  const have = woundedCount(state);
  const space = Math.max(0, beds - have);
  const saved = Math.min(space, Math.floor(lost * 0.5));
  state.flags.wounded_player = have + saved;
  return saved;
}

export function tryTreatWounded(state: GameState): boolean {
  const n = woundedCount(state);
  if (n <= 0) return false;
  if (D(state.resources.food ?? "0").lt(TREAT_FOOD)) return false;
  state.resources.food = toDecimalString(D(state.resources.food).sub(TREAT_FOOD));
  state.flags.wounded_player = n - 1;
  const militia = state.units.find((u) => u.realmId === "player" && u.typeId === "militia");
  if (militia) militia.count = toDecimalString(D(militia.count).add(1));
  else {
    state.units.push({
      id: `u_heal_${state.meta.tick}`,
      typeId: "militia",
      realmId: "player",
      count: "1",
      armyId: null,
    });
  }
  return true;
}

export function listScarred(state: GameState) {
  return state.buildings.filter((b) => b.realmId === "player" && b.completesAtTick !== null && b.level >= 1);
}

export function tryRepair(state: GameState, buildingId: string): boolean {
  const b = state.buildings.find((x) => x.id === buildingId && x.realmId === "player");
  if (!b || b.completesAtTick === null) return false;
  if (D(state.resources.stone ?? "0").lt(REPAIR_STONE)) return false;
  state.resources.stone = toDecimalString(D(state.resources.stone).sub(REPAIR_STONE));
  b.completesAtTick = null;
  return true;
}
