import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";

export const DOCTRINES = [
  { id: "harvest", name: "Harvest Law", blurb: "+2 production on every completed building" },
  { id: "host", name: "Host Law", blurb: "8% cheaper training" },
  { id: "court", name: "Court Law", blurb: "Gifts sway opinion more" },
] as const;

export function ascendThreshold(state: GameState): number {
  const level = Number(state.flags["prestige_level"] ?? 0);
  return 30_000 + level * 25_000;
}

export function canAscend(state: GameState): boolean {
  let total = D(0);
  for (const v of Object.values(state.resources)) {
    total = total.add(D(v ?? "0"));
  }
  return total.gte(ascendThreshold(state));
}

export function tryAscend(state: GameState): boolean {
  if (!canAscend(state)) return false;

  const level = Number(state.flags["prestige_level"] ?? 0) + 1;
  state.flags["prestige_level"] = level;
  state.flags["prestige_total"] = Number(state.flags["prestige_total"] ?? 0) + 1;
  delete state.flags.doctrine_lock;

  state.resources = { gold: "0", food: "25", wood: "35", stone: "0" };
  state.buildings = [
    {
      id: "b_prestige_farm",
      typeId: "farm",
      realmId: "player",
      x: 0,
      y: 0,
      level: 1,
      completesAtTick: null,
    },
    {
      id: "b_prestige_lumber",
      typeId: "lumber_camp",
      realmId: "player",
      x: 1,
      y: 0,
      level: 1,
      completesAtTick: null,
    },
  ];
  state.units = state.units.filter((u) => u.realmId === "rival");
  state.wars = [];
  for (const k of Object.keys(state.flags)) {
    if (k.startsWith("peace_")) delete state.flags[k];
  }

  // First-dawn gift: one militia and a small store, once per crown.
  if (!state.flags.dawn_gift) {
    state.flags.dawn_gift = 1;
    state.resources.food = toDecimalString(D(state.resources.food ?? "0").add(20));
    state.resources.wood = toDecimalString(D(state.resources.wood ?? "0").add(10));
    state.units.push({
      id: "u_dawn_militia",
      typeId: "militia",
      realmId: "player",
      count: "1",
      armyId: null,
    });
  }

  state.inputLog.push({
    tick: state.meta.tick,
    type: "ascend",
    payload: { level },
    issuerId: "player",
  } satisfies InputRecord);

  return true;
}

export function tryPickDoctrine(state: GameState, id: string): boolean {
  if (!DOCTRINES.some((d) => d.id === id)) return false;
  const level = Number(state.flags.prestige_level ?? 0);
  if (level < 1) return false;
  if (Number(state.flags.doctrine_lock ?? 0) === level && state.flags.doctrine) return false;
  state.flags.doctrine = id;
  state.flags.doctrine_lock = level;
  return true;
}
