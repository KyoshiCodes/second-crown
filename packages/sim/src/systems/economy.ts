import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";
import Decimal from "break_infinity.js";
import { TICKS_PER_SECOND } from "@second-crown/shared";

/** Advisor "clever" trait: +5% production. Prestige bonus stacked on top. */
export function productionMultiplier(state: GameState): Decimal {
  let mult = D(1);
  const advisor = state.characters.find(
    (c) => c.realmId === "player" && c.role === "advisor" && c.traits.includes("clever")
  );
  if (advisor) mult = mult.mul(1.05);

  const prestige = Number(state.flags["prestige_level"] ?? 0);
  if (prestige > 0) {
    // +2% production per prestige level
    mult = mult.mul(1 + prestige * 0.02);
  }
  return mult;
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

    const mult = productionMultiplier(state);
    const totals: Record<string, Decimal> = {};

    for (const b of state.buildings) {
      if (b.completesAtTick !== null) continue;
      const def = getBuildingType(b.typeId);
      if (!def) continue;

      for (const [res, rateStr] of Object.entries(def.productionPerTick)) {
        const amount = D(rateStr).mul(ticks).mul(mult);
        totals[res] = (totals[res] ?? D(0)).add(amount);
      }
    }

    for (const [res, amount] of Object.entries(totals)) {
      const current = D(state.resources[res] ?? "0");
      // Floor to whole numbers to keep bit-identity with repeated fine ticks
      state.resources[res] = toDecimalString(current.add(amount).floor());
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
  const mult = productionMultiplier(state);
  const perTick: Record<string, Decimal> = {};

  for (const b of state.buildings) {
    if (b.completesAtTick !== null) continue;
    const def = getBuildingType(b.typeId);
    if (!def) continue;
    for (const [res, rateStr] of Object.entries(def.productionPerTick)) {
      perTick[res] = (perTick[res] ?? D(0)).add(D(rateStr).mul(mult));
    }
  }

  const perSecond: Record<string, string> = {};
  for (const [res, rate] of Object.entries(perTick)) {
    perSecond[res] = toDecimalString(rate.mul(TICKS_PER_SECOND).floor());
  }
  return perSecond;
}
