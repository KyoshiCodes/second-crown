import type { GameState, Province } from "@second-crown/shared";
import { D } from "../core/decimal.js";
import { addCapped } from "./storage.js";

export function listOutposts(state: GameState, realmId = "player"): Province[] {
  return state.board.provinces.filter(
    (p) => p.occupantRealmId === realmId && p.id !== state.board.homeProvinceId && p.node !== "hold"
  );
}

export function plantOutpost(state: GameState, dest: Province, realmId = "player"): boolean {
  if (dest.id === state.board.homeProvinceId) return false;
  if (dest.node === "hold" && dest.occupantRealmId && dest.occupantRealmId !== realmId) return false;
  dest.occupantRealmId = realmId;
  if (dest.node === "none" || dest.node === "camp") dest.node = "field";
  return true;
}

/** Slow Lords-style tile yield. One outpost is a trickle, not a second hold. */
export function outpostTithePerTick(state: GameState, realmId = "player"): Record<string, number> {
  const tithe: Record<string, number> = { food: 0, wood: 0, stone: 0, gold: 0 };
  for (const p of listOutposts(state, realmId)) {
    if (p.node === "field" || p.node === "camp") tithe.food += 0.02;
    else if (p.node === "woodcut") tithe.wood += 0.02;
    else if (p.node === "quarry") tithe.stone += 0.015;
    else if (p.node === "ruins") tithe.gold += 0.008;
    else tithe.food += 0.01;
  }
  return tithe;
}

export function applyOutpostTithe(state: GameState, ticks: number, realmId = "player"): void {
  if (ticks <= 0) return;
  const tithe = outpostTithePerTick(state, realmId);
  for (const [res, rate] of Object.entries(tithe)) {
    if (rate > 0) addCapped(state, res, D(rate).mul(ticks));
  }
}
