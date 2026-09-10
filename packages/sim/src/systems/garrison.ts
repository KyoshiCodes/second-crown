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

export function mergeGarrisonForce(state: GameState, provinceId: string, force: Record<string, number>): void {
  const list = read(state);
  const existing = list.find((g) => g.provinceId === provinceId);
  if (existing) {
    for (const [k, n] of Object.entries(force)) existing.force[k] = (existing.force[k] ?? 0) + n;
  } else {
    list.push({ provinceId, force: { ...force } });
  }
  save(state, list);
}

export function detachGarrison(state: GameState, provinceId: string): Record<string, number> | null {
  const list = read(state);
  const g = list.find((x) => x.provinceId === provinceId);
  if (!g) return null;
  save(state, list.filter((x) => x.provinceId !== provinceId));
  return { ...g.force };
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
  mergeGarrisonForce(state, provinceId, clean);
  state.inputLog.push({ tick: state.meta.tick, type: "garrison", payload: { provinceId, force: clean } });
  return true;
}

export function tryRecallGarrison(state: GameState, provinceId: string): boolean {
  const force = detachGarrison(state, provinceId);
  if (!force) return false;
  returnForce(state, force, 1);
  state.inputLog.push({ tick: state.meta.tick, type: "recall_garrison", payload: { provinceId } });
  return true;
}
