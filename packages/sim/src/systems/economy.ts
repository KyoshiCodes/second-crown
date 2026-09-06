import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";
import Decimal from "break_infinity.js";

/**
 * Economy system — Phase D.
 */
export const EconomySystem = {
  nextEventTick(state: GameState): number | null {
    let earliest: number | null = null;
    for (const b of state.buildings) {
      if (b.completesAtTick !== null) {
        if (earliest === null || b.completesAtTick < earliest) {
          earliest = b.completesAtTick;
        }
      }
    }
    return earliest;
  },

  advanceAnalytic(state: GameState, fromTick: number, toTick: number): void {
    const ticks = toTick - fromTick;
    if (ticks <= 0) return;

    const totals: Record<string, Decimal> = {};

    for (const b of state.buildings) {
      if (b.completesAtTick !== null) continue;
      const def = getBuildingType(b.typeId);
      if (!def) continue;

      for (const [res, rateStr] of Object.entries(def.productionPerTick)) {
        const rate = D(rateStr);
        const amount = rate.mul(ticks);
        totals[res] = (totals[res] ?? D(0)).add(amount);
      }
    }

    for (const [res, amount] of Object.entries(totals)) {
      const current = D(state.resources[res] ?? "0");
      state.resources[res] = toDecimalString(current.add(amount));
    }
  },

  processEventsAt(state: GameState, tick: number): void {
    for (const b of state.buildings) {
      if (b.completesAtTick === tick) {
        b.completesAtTick = null;
      }
    }
  },

  tick(state: GameState): void {
    this.advanceAnalytic(state, state.meta.tick - 1, state.meta.tick);
  },
};
