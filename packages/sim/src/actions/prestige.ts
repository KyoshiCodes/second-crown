import type { GameState, InputRecord } from "@second-crown/shared";
import { D } from "../core/decimal.js";

/** Minimum total resources (sum) required to ascend. */
const ASCEND_THRESHOLD = 50_000;

export function canAscend(state: GameState): boolean {
  let total = D(0);
  for (const v of Object.values(state.resources)) {
    total = total.add(D(v ?? "0"));
  }
  return total.gte(ASCEND_THRESHOLD);
}

/**
 * Soft reset: keep prestige level + permanent production bonus,
 * clear buildings/units/wars/resources (keep characters & realms).
 */
export function tryAscend(state: GameState): boolean {
  if (!canAscend(state)) return false;

  const level = Number(state.flags["prestige_level"] ?? 0) + 1;
  state.flags["prestige_level"] = level;
  state.flags["prestige_total"] = Number(state.flags["prestige_total"] ?? 0) + 1;

  state.resources = { gold: "0", food: "20", wood: "30", stone: "0" };
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
  ];
  state.units = state.units.filter((u) => u.realmId === "rival");
  state.wars = [];
  // Clear peace locks
  for (const k of Object.keys(state.flags)) {
    if (k.startsWith("peace_")) delete state.flags[k];
  }

  const record: InputRecord = {
    tick: state.meta.tick,
    type: "ascend",
    payload: { level },
    issuerId: "player",
  };
  state.inputLog.push(record);

  return true;
}
