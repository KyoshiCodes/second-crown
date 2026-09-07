import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getProvince, neighbors } from "./board.js";

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
  return seenSet(state).has(id);
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
  if (D(state.resources.gold ?? "0").lt(8)) return false;
  if (!getProvince(state, id)) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold).sub(8));
  revealProvince(state, id);
  return true;
}
