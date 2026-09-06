import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";

/**
 * Rival passive growth: every 100 ticks, Iron March gains 1 militia
 * (scaled slightly by how many wars they've lost — they dig in).
 */
export const RivalSystem = {
  nextEventTick(_state: GameState): number | null {
    return null; // driven from tick, not discrete events
  },

  advanceAnalytic(state: GameState, fromTick: number, toTick: number): void {
    // Apply growth for each 100-tick boundary crossed
    const start = Math.floor(fromTick / 100) + 1;
    const end = Math.floor(toTick / 100);
    for (let step = start; step <= end; step++) {
      growRivalOnce(state);
    }
  },

  processEventsAt(_state: GameState, _tick: number): void {},

  tick(state: GameState): void {
    if (state.meta.tick > 0 && state.meta.tick % 100 === 0) {
      growRivalOnce(state);
    }
  },
};

function growRivalOnce(state: GameState): void {
  const losses = state.wars.filter(
    (w) =>
      (w.defenderRealmId === "rival" && w.status === "attacker_won") ||
      (w.attackerRealmId === "rival" && w.status === "defender_won")
  ).length;
  const amount = 1 + Math.min(3, losses); // 1–4 militia per pulse

  const existing = state.units.find(
    (u) => u.realmId === "rival" && u.typeId === "militia" && u.armyId === null
  );
  if (existing) {
    existing.count = toDecimalString(D(existing.count).add(amount));
  } else {
    state.units.push({
      id: `u_rival_${state.meta.tick}`,
      typeId: "militia",
      realmId: "rival",
      count: toDecimalString(amount),
      armyId: null,
    });
  }
}
