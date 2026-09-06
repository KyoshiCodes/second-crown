import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";

export const SEASONS = ["Spring", "Summer", "Autumn", "Winter"] as const;

export function seasonIndex(tick: number): number {
  return Math.floor(tick / 2000) % 4;
}

export function currentSeason(state: GameState): (typeof SEASONS)[number] {
  return SEASONS[seasonIndex(state.meta.tick)];
}

export function seasonProductionBonus(state: GameState): number {
  const i = seasonIndex(state.meta.tick);
  if (i === 0) return 1;
  if (i === 2) return 1;
  return 0;
}

export function tryHireChampion(state: GameState): boolean {
  if (state.units.some((u) => u.realmId === "player" && u.typeId === "champion")) return false;
  if (D(state.resources.gold ?? "0").lt(80) || D(state.resources.food ?? "0").lt(40)) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(80));
  state.resources.food = toDecimalString(D(state.resources.food ?? "0").sub(40));
  state.units.push({
    id: `champ_${state.meta.tick}`,
    typeId: "champion",
    realmId: "player",
    count: "1",
    armyId: null,
  });
  return true;
}

export function tryOpenRoute(state: GameState): boolean {
  const n = Number(state.flags.trade_routes ?? 0);
  if (n >= 3) return false;
  if (D(state.resources.gold ?? "0").lt(25)) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(25));
  state.flags.trade_routes = n + 1;
  return true;
}

export function routeGoldPerTick(state: GameState): number {
  return Number(state.flags.trade_routes ?? 0);
}
