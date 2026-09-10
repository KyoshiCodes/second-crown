import type { GameState } from "@second-crown/shared";
import { getProvince } from "./board.js";
import { takeForce, returnForce, forcePower } from "./column.js";
import { listOutposts } from "./outpost.js";

export interface Garrison {
  provinceId: string;
  force: Record<string, number>;
}

function read(state: GameState): Garrison[] {
  const raw = state.flags["garrisons_json"];
  if (typeof raw !== "string" || !raw) return [];
  try {
    return JSON.parse(raw) as Garrison[];
  } catch {
    return [];
  }
}

function save(state: GameState, list: Garrison[]): void {
  state.flags["garrisons_json"] = JSON.stringify(list);
}

export function listGarrisons(state: GameState): Garrison[] {
  return read(state);
}

export function garrisonAt(state: GameState, provinceId: string): Garrison | undefined {
  return read(state).find((g) => g.provinceId === provinceId);
}

export function garrisonPower(state: GameState, provinceId: string): number {
  const g = garrisonAt(state, provinceId);
  return g ? forcePower(g.force) : 0;
}

export function tryGarrison(state: GameState, provinceId: string, force: Record<string, number>): boolean {
  const dest = getProvince(state, provinceId);
  if (!dest) return false;
  if (!listOutposts(state).some((p) => p.id === provinceId)) return false;
  const clean: Record<string, number> = {};
  for (const [k, v] of Object.entries(force)) {
    const n = Math.floor(Number(v) || 0);
    if (n > 0) clean[k] = n;
  }
  if (Object.keys(clean).length === 0) return false;
  if (!takeForce(state, clean)) return false;
  const list = read(state);
  const existing = list.find((g) => g.provinceId === provinceId);
  if (existing) {
    for (const [k, n] of Object.entries(clean)) existing.force[k] = (existing.force[k] ?? 0) + n;
  } else {
    list.push({ provinceId, force: clean });
  }
  save(state, list);
  state.inputLog.push({ tick: state.meta.tick, type: "garrison", payload: { provinceId, force: clean } });
  return true;
}

export function tryRecallGarrison(state: GameState, provinceId: string): boolean {
  const list = read(state);
  const g = list.find((x) => x.provinceId === provinceId);
  if (!g) return false;
  returnForce(state, g.force, 1);
  save(state, list.filter((x) => x.provinceId !== provinceId));
  state.inputLog.push({ tick: state.meta.tick, type: "recall_garrison", payload: { provinceId } });
  return true;
}
