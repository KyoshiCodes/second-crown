import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";
import Decimal from "break_infinity.js";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { flagNum } from "./wave.js";
import { decreeActive } from "./decree.js";
import { harvestMult, routeGoldPerTick, seasonProductionBonus } from "./age.js";
import { hireCitizenForBuilding, jobForBuildingType } from "./citizens.js";
import { addCapped } from "./storage.js";
import { applyOutpostTithe, outpostTithePerTick } from "./outpost.js";
import { researchYield } from "./research.js";
import { laborPerTick } from "./labor.js";

const PAIR: Record<string, string> = {
  farm: "granary",
  lumber_camp: "sawmill",
  quarry: "mason",
  gold_mine: "mint",
};

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

/** Matching job on this tile: +20% each, cap +40%. Unmanned stays 1. */
export function staffBonus(state: GameState, building: GameState["buildings"][number]): number {
  const job = jobForBuildingType(building.typeId);
  if (job === "unassigned") return 1;
  const n = state.citizens.filter(
    (c) =>
      c.realmId === building.realmId &&
      c.job === job &&
      c.tile?.x === building.x &&
      c.tile?.y === building.y
  ).length;
  return 1 + Math.min(0.4, n * 0.2);
}

/** Finished same-type neighbor on an edge: +10% each, cap +20%. */
export function adjacencyBonus(state: GameState, building: GameState["buildings"][number]): number {
  const n = state.buildings.filter(
    (b) =>
      b.id !== building.id &&
      b.realmId === building.realmId &&
      b.typeId === building.typeId &&
      b.completesAtTick === null &&
      Math.abs(b.x - building.x) + Math.abs(b.y - building.y) === 1
  ).length;
  return 1 + Math.min(0.2, n * 0.1);
}

function edgeOf(state: GameState, building: GameState["buildings"][number], typeId: string): boolean {
  return state.buildings.some(
    (b) =>
      b.id !== building.id &&
      b.realmId === building.realmId &&
      b.typeId === typeId &&
      b.completesAtTick === null &&
      Math.abs(b.x - building.x) + Math.abs(b.y - building.y) === 1
  );
}

/** Producer next to its warehouse: +15%. Warehouse next to its producer: +15% on its own drip. */
export function pairBonus(state: GameState, building: GameState["buildings"][number]): number {
  const mate = PAIR[building.typeId];
  if (mate && edgeOf(state, building, mate)) return 1.15;
  const producer = Object.entries(PAIR).find(([, store]) => store === building.typeId)?.[0];
  if (producer && edgeOf(state, building, producer)) return 1.15;
  return 1;
}

/** Finished keep on an edge of this work: +10%. Keep itself does not lift itself. */
export function keepBonus(state: GameState, building: GameState["buildings"][number]): number {
  if (building.typeId === "keep") return 1;
  return edgeOf(state, building, "keep") ? 1.1 : 1;
}

function rateFor(state: GameState, building: GameState["buildings"][number], res: string, rateStr: string) {
  const scarce = res === "gold" ? 0.35 : 1;
  return D(rateStr)
    .mul(Math.max(1, building.level))
    .mul(1 + productionBonus(state) * 0.04 + researchYield(state, res))
    .mul(scarce)
    .mul(staffBonus(state, building))
    .mul(adjacencyBonus(state, building))
    .mul(pairBonus(state, building))
    .mul(keepBonus(state, building))
    .mul(harvestMult(state, building.typeId, res));
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
        const amount = rateFor(state, b, res, rateStr ?? "0").mul(ticks);
        totals[res] = (totals[res] ?? D(0)).add(amount);
      }
    }
    const routes = routeGoldPerTick(state);
    if (routes > 0) totals.gold = (totals.gold ?? D(0)).add(D(routes).mul(0.15).mul(ticks));
    const labor = laborPerTick(state);
    for (const [res, n] of Object.entries(labor)) {
      if (n > 0) totals[res] = (totals[res] ?? D(0)).add(D(n).mul(ticks));
    }
    for (const [res, amount] of Object.entries(totals)) {
      addCapped(state, res, amount);
    }
    applyOutpostTithe(state, ticks);
  },

  processEventsAt(state: GameState, tick: number): void {
    for (const b of state.buildings) {
      if (b.completesAtTick === tick) {
        b.completesAtTick = null;
        hireCitizenForBuilding(state, b.realmId, b.typeId, b.x, b.y);
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
      perTick[res] = (perTick[res] ?? D(0)).add(rateFor(state, b, res, rateStr ?? "0"));
    }
  }
  const routes = routeGoldPerTick(state);
  if (routes > 0) perTick.gold = (perTick.gold ?? D(0)).add(D(routes).mul(0.15));
  const tithe = outpostTithePerTick(state);
  for (const [res, rate] of Object.entries(tithe)) {
    if (rate > 0) perTick[res] = (perTick[res] ?? D(0)).add(D(rate));
  }
  const labor = laborPerTick(state);
  for (const [res, n] of Object.entries(labor)) {
    if (n > 0) perTick[res] = (perTick[res] ?? D(0)).add(D(n));
  }
  const perSecond: Record<string, string> = {};
  for (const [res, rate] of Object.entries(perTick)) {
    perSecond[res] = toDecimalString(rate.mul(TICKS_PER_SECOND));
  }
  return perSecond;
}
