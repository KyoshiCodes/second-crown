import type { GameState } from "@second-crown/shared";
import { listMarches } from "./march.js";
import { listGathers } from "./gather.js";
import { woundedCount } from "./ward.js";

export interface TroopPost {
  typeId: string;
  home: number;
  marching: number;
  gathering: number;
}

export function listTroopPosts(state: GameState): TroopPost[] {
  const map = new Map<string, TroopPost>();
  const bump = (id: string) => {
    if (!map.has(id)) map.set(id, { typeId: id, home: 0, marching: 0, gathering: 0 });
    return map.get(id)!;
  };
  for (const u of state.units) {
    if (u.realmId !== "player") continue;
    bump(u.typeId).home += Number(u.count ?? 0);
  }
  for (const m of listMarches(state)) {
    if (m.realmId !== "player") continue;
    if (m.force) {
      for (const [id, n] of Object.entries(m.force)) bump(id).marching += n;
    } else if (m.levy) {
      bump("militia").marching += m.levy;
    }
  }
  for (const g of listGathers(state)) {
    if (g.phase === "returning" && Number(g.load) === 0 && g.phase) {
      /* still away */
    }
    for (const [id, n] of Object.entries(g.force)) bump(id).gathering += n;
  }
  return [...map.values()];
}

export function troopWounded(state: GameState): number {
  return woundedCount(state);
}
