import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";
import Decimal from "break_infinity.js";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { flagNum } from "./wave.js";
import { decreeActive } from "./decree.js";
import { routeGoldPerTick, seasonProductionBonus } from "./age.js";
import { hireCitizenForBuilding, jobForBuildingType } from "./citizens.js";
import { addCapped } from "./storage.js";
import { applyOutpostTithe, outpostTithePerTick } from "./outpost.js";
import { researchYield } from "./research.js";
import { laborPerTick } from "./labor.js";
import { keepLevel, upgradeJobFor } from "../actions/upgrade.js";
import { BUILDING_WORK_STATIONS, STATION_PAIR_MULT, STATION_REST_MULT, STATION_RHYTHM_END, STATION_RHYTHM_MULT, STATION_RHYTHM_START, WORK_STATION_BENEFIT_MULT, WORK_STATION_DEPTH_MIN_LEVEL, WORK_STATION_DEPTH_MULT } from "../content/livingRealm.js";
import { LIVING_SWITCH_FLAGS } from "./livingRealm.js";
import { keepIncomeMult, levelYieldMult } from "../content/pacing.js";
import { DAWN_END, DAY_CYCLE_TICKS, dayPhaseAt } from "./dayNight.js";
import { farmCultureBonus, quarryCultureBonus, woodCultureBonus } from "./culture.js";

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

/**
 * Slice 30: a worker staged at a finished, non-upgrading work station adds a flat
 * WORK_STATION_BENEFIT_MULT (+5%) on top of staffBonus. One step, not per worker.
 * Flag living_work_station_benefit false: 1. Deterministic, reads state only.
 */
export function workStationBonus(state: GameState, building: GameState["buildings"][number]): number {
  if (state.flags[LIVING_SWITCH_FLAGS.workStationBenefit] === false) return 1;
  if (building.completesAtTick !== null) return 1;
  if (staffBonus(state, building) <= 1) return 1;
  if (upgradeJobFor(state, building.id)) return 1;
  return WORK_STATION_BENEFIT_MULT;
}

/**
 * Slice 31: a seasoned station. When workStationBonus is active and the building is
 * Tier II or higher, a further flat WORK_STATION_DEPTH_MULT (+3%). One step.
 * Flag living_work_station_depth false: 1 (the slice 30 bonus stays). Pure.
 */
export function workStationDepthBonus(state: GameState, building: GameState["buildings"][number]): number {
  if (state.flags[LIVING_SWITCH_FLAGS.workStationDepth] === false) return 1;
  if (workStationBonus(state, building) <= 1) return 1;
  const level = Number.isFinite(building.level) ? Math.floor(building.level) : 1;
  if (level < WORK_STATION_DEPTH_MIN_LEVEL) return 1;
  return WORK_STATION_DEPTH_MULT;
}

/**
 * Slice 32: station pairing. A building is paired when it and at least one other building of
 * the same type in the same realm are finished. The lead of the pair is the first finished
 * one of that type in build order (state.buildings order). Pure.
 */
export function stationPairState(
  state: GameState,
  building: GameState["buildings"][number]
): { paired: boolean; lead: boolean } {
  if (building.completesAtTick !== null) return { paired: false, lead: false };
  const finished = state.buildings.filter(
    (b) => b.realmId === building.realmId && b.typeId === building.typeId && b.completesAtTick === null
  );
  if (finished.length < 2) return { paired: false, lead: false };
  return { paired: true, lead: finished[0]?.id === building.id };
}

/**
 * Slice 32: +2% (STATION_PAIR_MULT) on the lead station of a same-type pair. One per type,
 * not per twin. Buildings that take no worker never pair. Flag living_station_pair false: 1.
 */
export function stationPairBonus(state: GameState, building: GameState["buildings"][number]): number {
  if (state.flags[LIVING_SWITCH_FLAGS.stationPair] === false) return 1;
  if (BUILDING_WORK_STATIONS[jobForBuildingType(building.typeId)] === undefined) return 1;
  return stationPairState(state, building).lead ? STATION_PAIR_MULT : 1;
}

/**
 * Slice 33: station rest. A finished station's crew rests through the night (no station
 * work), and comes back fresh at dawn: +2% (STATION_REST_MULT) on its output for the dawn
 * phase. Pure tick math on dayPhaseAt; dawn start and end are economy event ticks so a
 * settled batch matches tick by tick. Flag living_station_rest false: 1.
 */
export function stationRestBonus(state: GameState, building: GameState["buildings"][number]): number {
  if (state.flags[LIVING_SWITCH_FLAGS.stationRest] === false) return 1;
  if (building.completesAtTick !== null) return 1;
  if (BUILDING_WORK_STATIONS[jobForBuildingType(building.typeId)] === undefined) return 1;
  return dayPhaseAt(state.meta.tick) === "dawn" ? STATION_REST_MULT : 1;
}

/** Slice 33: first dawn start or dawn end strictly after `tick` (where stationRestBonus can change). */
export function nextStationRestTick(tick: number): number {
  const base = Math.floor(tick / DAY_CYCLE_TICKS) * DAY_CYCLE_TICKS;
  const dawnEnd = base + DAWN_END;
  return tick < dawnEnd ? dawnEnd : base + DAY_CYCLE_TICKS;
}

/**
 * Slice 34: station rhythm. A finished, staffed station that is not being upgraded settles
 * into its day's rhythm after a stretch of morning work: +1% (STATION_RHYTHM_MULT) from
 * day-cycle tick STATION_RHYTHM_START to STATION_RHYTHM_END (dusk). Stateless tick math;
 * both ends are economy event ticks. Flag living_station_rhythm false: 1.
 */
export function stationRhythmBonus(state: GameState, building: GameState["buildings"][number]): number {
  if (state.flags[LIVING_SWITCH_FLAGS.stationRhythm] === false) return 1;
  if (!stationRhythmWindowAt(state.meta.tick)) return 1;
  return stationRhythmReady(state, building) ? STATION_RHYTHM_MULT : 1;
}

/** Slice 34: finished, staffed work station not being upgraded (the rhythm's preconditions). */
export function stationRhythmReady(state: GameState, building: GameState["buildings"][number]): boolean {
  if (building.completesAtTick !== null) return false;
  if (BUILDING_WORK_STATIONS[jobForBuildingType(building.typeId)] === undefined) return false;
  if (staffBonus(state, building) <= 1) return false;
  return !upgradeJobFor(state, building.id);
}

/** Slice 34: true while the day-cycle tick is inside the rhythm stretch. */
export function stationRhythmWindowAt(tick: number): boolean {
  const t = ((tick % DAY_CYCLE_TICKS) + DAY_CYCLE_TICKS) % DAY_CYCLE_TICKS;
  return t >= STATION_RHYTHM_START && t < STATION_RHYTHM_END;
}

/** Slice 34: first rhythm start or end strictly after `tick` (where stationRhythmBonus can change). */
export function nextStationRhythmTick(tick: number): number {
  const base = Math.floor(tick / DAY_CYCLE_TICKS) * DAY_CYCLE_TICKS;
  const t = tick - base;
  if (t < STATION_RHYTHM_START) return base + STATION_RHYTHM_START;
  if (t < STATION_RHYTHM_END) return base + STATION_RHYTHM_END;
  return base + DAY_CYCLE_TICKS + STATION_RHYTHM_START;
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
  const flat =
    building.typeId === "farm" && res === "food"
      ? farmCultureBonus(state, building.realmId)
      : building.typeId === "quarry" && res === "stone"
        ? quarryCultureBonus(state, building.realmId)
        : building.typeId === "lumber_camp" && res === "wood"
          ? woodCultureBonus(state, building.realmId)
          : 0;
  return D(rateStr)
    .mul(levelYieldMult(building.level))
    .mul(keepIncomeMult(keepLevel(state, building.realmId)))
    .mul(1 + productionBonus(state) * 0.04 + researchYield(state, res))
    .mul(scarce)
    .mul(staffBonus(state, building))
    .mul(workStationBonus(state, building))
    .mul(workStationDepthBonus(state, building))
    .mul(stationPairBonus(state, building))
    .mul(stationRestBonus(state, building))
    .mul(stationRhythmBonus(state, building))
    .mul(adjacencyBonus(state, building))
    .mul(pairBonus(state, building))
    .mul(keepBonus(state, building))
    .add(flat);
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
    if (state.flags[LIVING_SWITCH_FLAGS.stationRest] !== false) {
      const rest = nextStationRestTick(state.meta.tick);
      if (earliest === null || earliest <= state.meta.tick || rest < earliest) earliest = rest;
    }
    if (state.flags[LIVING_SWITCH_FLAGS.stationRhythm] !== false) {
      const rhythm = nextStationRhythmTick(state.meta.tick);
      if (earliest === null || earliest <= state.meta.tick || rhythm < earliest) earliest = rhythm;
    }
    return earliest;
  },

  advanceAnalytic(state: GameState, fromTick: number, toTick: number): void {
    const ticks = toTick - fromTick;
    if (ticks <= 0) return;
    for (const [res, amount] of Object.entries(economyGain(state, ticks, false))) {
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

/**
 * What the economy would add over `ticks` before any store cap, with the outpost tithe
 * unless `tithe` is false. Reads state, changes nothing.
 */
export function economyGain(state: GameState, ticks: number, tithe = true): Record<string, Decimal> {
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
  for (const [res, n] of Object.entries(tithe ? outpostTithePerTick(state) : {})) {
    if (n > 0) totals[res] = (totals[res] ?? D(0)).add(D(n).mul(ticks));
  }
  return totals;
}

/** One named contributor to income, per tick (slice 18 yield breakdown). */
export interface IncomeSourcePerTick {
  id: string;
  name: string;
  res: string;
  perTick: Decimal;
}

/**
 * The same pieces computeIncomePerSecond adds up, kept apart by source: finished buildings
 * grouped by type (id = type id), trade routes, outpost tithe, posted labor. Same formulas;
 * summing perTick by resource gives computeIncomePerSecond's per-tick totals.
 * Reads state, changes nothing (callers that care about lazy research flags pass a copy).
 */
export function incomeSourcesPerTick(state: GameState): IncomeSourcePerTick[] {
  const byKey = new Map<string, IncomeSourcePerTick>();
  const add = (id: string, name: string, res: string, perTick: Decimal) => {
    const key = `${id}|${res}`;
    const cur = byKey.get(key);
    if (cur) cur.perTick = cur.perTick.add(perTick);
    else byKey.set(key, { id, name, res, perTick });
  };
  for (const b of state.buildings) {
    if (b.completesAtTick !== null) continue;
    const def = getBuildingType(b.typeId);
    if (!def) continue;
    for (const [res, rateStr] of Object.entries(def.productionPerTick)) {
      add(b.typeId, def.name, res, rateFor(state, b, res, rateStr ?? "0"));
    }
  }
  const routes = routeGoldPerTick(state);
  if (routes > 0) add("trade_routes", "Trade routes", "gold", D(routes).mul(0.15));
  for (const [res, rate] of Object.entries(outpostTithePerTick(state))) {
    if (rate > 0) add("outpost_tithe", "Outpost tithe", res, D(rate));
  }
  for (const [res, n] of Object.entries(laborPerTick(state))) {
    if (n > 0) add("labor", "Labor", res, D(n));
  }
  return [...byKey.values()];
}

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
