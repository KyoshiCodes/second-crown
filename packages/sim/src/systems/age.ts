import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";

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

export function tryNameChampion(state: GameState, name: string): boolean {
  const n = name.trim().slice(0, 24);
  if (!n) return false;
  if (!state.units.some((u) => u.realmId === "player" && u.typeId === "champion")) return false;
  state.flags.champion_name = n;
  return true;
}

export function championName(state: GameState): string {
  const n = String(state.flags.champion_name || "").trim();
  return n || "Your Champion";
}

export function tryHireMercs(state: GameState): boolean {
  if (D(state.resources.gold ?? "0").lt(30)) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(30));
  const existing = state.units.find((u) => u.typeId === "militia" && u.realmId === "player" && u.armyId === null);
  if (existing) existing.count = toDecimalString(D(existing.count).add(8));
  else {
    state.units.push({
      id: `merc_${state.meta.tick}`,
      typeId: "militia",
      realmId: "player",
      count: "8",
      armyId: null,
    });
  }
  return true;
}

export function tryCollectTithe(state: GameState): boolean {
  const n = countBuilding(state, "chapel");
  if (n < 1) return false;
  const ready = Number(state.flags.tithe_ready ?? 0);
  if (state.meta.tick < ready) return false;
  const gold = n * 8;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").add(gold));
  state.flags.tithe_ready = state.meta.tick + 300;
  return true;
}

export function titheTicksLeft(state: GameState): number {
  return Math.max(0, Number(state.flags.tithe_ready ?? 0) - state.meta.tick);
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
