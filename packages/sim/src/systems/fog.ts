import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";
import { getProvince, neighbors } from "./board.js";

export function visionRange(state: GameState): number {
  return 1 + countBuilding(state, "watchtower");
}

function homeCoord(state: GameState): { x: number; y: number } {
  const h = getProvince(state, state.board.homeProvinceId);
  return h ?? { x: 2, y: 2 };
}

function seenSet(state: GameState): Set<string> {
  const raw = state.flags.fog_seen;
  if (typeof raw === "string" && raw) {
    try {
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }
  const start = new Set<string>([state.board.homeProvinceId]);
  for (const n of neighbors(state, state.board.homeProvinceId)) start.add(n.id);
  state.flags.fog_seen = JSON.stringify([...start]);
  return start;
}

function saveSeen(state: GameState, set: Set<string>): void {
  state.flags.fog_seen = JSON.stringify([...set]);
}

export function ensureFog(state: GameState): void {
  seenSet(state);
}

export function isProvinceSeen(state: GameState, id: string): boolean {
  if (seenSet(state).has(id)) return true;
  const p = getProvince(state, id);
  if (!p) return false;
  const h = homeCoord(state);
  return Math.abs(p.x - h.x) + Math.abs(p.y - h.y) <= visionRange(state);
}

export function revealProvince(state: GameState, id: string): void {
  const set = seenSet(state);
  set.add(id);
  const p = getProvince(state, id);
  if (p) {
    for (const n of neighbors(state, p.id)) set.add(n.id);
  }
  saveSeen(state, set);
}

export function tryScoutProvince(state: GameState, id: string): boolean {
  if (isProvinceSeen(state, id)) return false;
  const cost = Math.max(4, 8 - countBuilding(state, "watchtower"));
  if (D(state.resources.gold ?? "0").lt(cost)) return false;
  if (!getProvince(state, id)) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold).sub(cost));
  revealProvince(state, id);
  return true;
}

export function scoutCost(state: GameState): number {
  return Math.max(4, 8 - countBuilding(state, "watchtower"));
}
