import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";
import Decimal from "break_infinity.js";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { flagNum } from "./wave.js";
import { decreeActive } from "./decree.js";
import { routeGoldPerTick, seasonProductionBonus } from "./age.js";
import { applyLabor, laborPerTick } from "./labor.js";

export function productionBonus(state: GameState): number {
  let bonus = 0;
  const prestige = Number(state.flags["prestige_level"] ?? 0);
  bonus += prestige;
  bonus += flagNum(state, "craft_income");
  if (state.flags.doctrine === "harvest") bonus += 2;
  if (decreeActive(state, "rite")) bonus += 3;
  bonus += seasonProductionBonus(state);
  const advisor = state.characters.find(
    (c) => c.realmId === "player" && c.role === "advisor" && c.traits.includes("clever")
  );
  if (advisor) bonus += 1;
  return bonus;
}

function rateFor(state: GameState, typeId: string, level: number, res: string, rateStr: string) {
  void typeId;
  void res;
  return D(rateStr).mul(Math.max(1, level)).add(productionBonus(state));
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
    const totals: Record<string, Decimal> = {};
    for (const b of state.buildings) {
      if (b.completesAtTick !== null) continue;
      const def = getBuildingType(b.typeId);
      if (!def) continue;
      for (const [res, rateStr] of Object.entries(def.productionPerTick)) {
        const amount = rateFor(state, b.typeId, b.level, res, rateStr ?? "0").mul(ticks);
        totals[res] = (totals[res] ?? D(0)).add(amount);
      }
    }
    const routes = routeGoldPerTick(state);
    if (routes > 0) totals.gold = (totals.gold ?? D(0)).add(D(routes).mul(ticks));
    applyLabor(state, ticks);
    for (const [res, amount] of Object.entries(totals)) {
      state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").add(amount));
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
  const perTick: Record<string, Decimal> = {};
  for (const b of state.buildings) {
    if (b.completesAtTick !== null) continue;
    const def = getBuildingType(b.typeId);
    if (!def) continue;
    for (const [res, rateStr] of Object.entries(def.productionPerTick)) {
      perTick[res] = (perTick[res] ?? D(0)).add(rateFor(state, b.typeId, b.level, res, rateStr ?? "0"));
    }
  }
  const routes = routeGoldPerTick(state);
  if (routes > 0) perTick.gold = (perTick.gold ?? D(0)).add(routes);
  const labor = laborPerTick(state);
  for (const [res, n] of Object.entries(labor)) {
    if (n > 0) perTick[res] = (perTick[res] ?? D(0)).add(n);
  }
  const perSecond: Record<string, string> = {};
  for (const [res, rate] of Object.entries(perTick)) {
    perSecond[res] = toDecimalString(rate.mul(TICKS_PER_SECOND));
  }
  return perSecond;
}
