import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";
import Decimal from "break_infinity.js";
import { TICKS_PER_SECOND } from "@second-crown/shared";

/**
 * Integer production bonus per tick (all buildings).
 * - prestige_level: +1 rate per level (flat)
 * - clever advisor: +1 rate
 * Kept integer so fine ticks and analytic jumps stay bit-identical.
 */
export function productionBonus(state: GameState): number {
  let bonus = 0;
  const prestige = Number(state.flags["prestige_level"] ?? 0);
  bonus += prestige;
  const advisor = state.characters.find(
    (c) => c.realmId === "player" && c.role === "advisor" && c.traits.includes("clever")
  );
  if (advisor) bonus += 1;
  return bonus;
}

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

    const bonus = productionBonus(state);
    const totals: Record<string, Decimal> = {};

    for (const b of state.buildings) {
      if (b.completesAtTick !== null) continue;
      const def = getBuildingType(b.typeId);
      if (!def) continue;

      for (const [res, rateStr] of Object.entries(def.productionPerTick)) {
        const rate = D(rateStr).add(bonus);
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

export function computeIncomePerSecond(state: GameState): Record<string, string> {
  const bonus = productionBonus(state);
  const perTick: Record<string, Decimal> = {};

  for (const b of state.buildings) {
    if (b.completesAtTick !== null) continue;
    const def = getBuildingType(b.typeId);
    if (!def) continue;
    for (const [res, rateStr] of Object.entries(def.productionPerTick)) {
      perTick[res] = (perTick[res] ?? D(0)).add(D(rateStr).add(bonus));
    }
  }

  const perSecond: Record<string, string> = {};
  for (const [res, rate] of Object.entries(perTick)) {
    perSecond[res] = toDecimalString(rate.mul(TICKS_PER_SECOND));
  }
  return perSecond;
}
