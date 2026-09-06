import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";

export const DECREES = [
  { id: "muster", name: "Muster the Host", cost: { gold: "40" }, ticks: 400, blurb: "Training 10% cheaper for ~40s" },
  { id: "rite", name: "Harvest Rite", cost: { food: "50" }, ticks: 400, blurb: "+3 production for ~40s" },
  { id: "envoys", name: "Send Envoys", cost: { gold: "35" }, ticks: 500, blurb: "Gifts +6 opinion for ~50s" },
] as const;

export function decreeUntil(state: GameState, id: string): number {
  return Math.max(0, Number(state.flags[`decree_${id}_until`] ?? 0) - state.meta.tick);
}

export function decreeActive(state: GameState, id: string): boolean {
  return decreeUntil(state, id) > 0;
}

export function tryDecree(state: GameState, id: string): boolean {
  const def = DECREES.find((d) => d.id === id);
  if (!def) return false;
  if (decreeActive(state, id)) return false;
  for (const [res, amt] of Object.entries(def.cost)) {
    if (D(state.resources[res] ?? "0").lt(D(amt))) return false;
  }
  for (const [res, amt] of Object.entries(def.cost)) {
    state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").sub(D(amt)));
  }
  state.flags[`decree_${id}_until`] = state.meta.tick + def.ticks;
  return true;
}

export function tryScout(state: GameState, realmId: string, costGold = 10): boolean {
  if (realmId === "player") return false;
  if (state.flags[`scout_${realmId}`]) return true;
  if (D(state.resources.gold ?? "0").lt(costGold)) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(costGold));
  state.flags[`scout_${realmId}`] = 1;
  return true;
}

export function isScouted(state: GameState, realmId: string): boolean {
  if (realmId === "player") return true;
  return Boolean(state.flags[`scout_${realmId}`]);
}
