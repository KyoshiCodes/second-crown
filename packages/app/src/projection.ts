import {
  computeIncomePerSecond,
  storageCap,
  upkeepPerTick,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";

/**
 * Read-only cost projections: "how long does this cost take at current income".
 * Pure functions over plain numbers, plus one adapter that reads the sim's own
 * income, upkeep and storage helpers. Nothing here changes state or rules.
 */

/** Per-resource rate (net per second), stock, and storage ceiling. */
export interface RealmRates {
  rate: Record<string, number>;
  have: Record<string, number>;
  cap: Record<string, number>;
}

/** Studies or upgrades costing this many seconds of production or more get a projection line. */
export const PROJECTION_MIN_SECONDS = 300;

export interface ResourceProjection {
  res: string;
  need: number;
  have: number;
  /** Net income per second (food has army upkeep taken off). */
  rate: number;
  cap: number;
  /** Whole units still missing. */
  short: number;
  /** Seconds of income the whole cost represents (Infinity when the rate is zero or less). */
  productionSeconds: number;
  /** Seconds until stores cover it (0 when they already do, Infinity when they never will at this rate). */
  waitSeconds: number;
  /** Cost is larger than the warehouse can hold. */
  overCap: boolean;
}

export interface CostProjection {
  parts: ResourceProjection[];
  /** The resource that takes longest (or can never be reached). Undefined for an empty cost. */
  limiter?: ResourceProjection;
  /** Longest production time among the parts. */
  productionSeconds: number;
  /** Longest wait among the parts. */
  waitSeconds: number;
}

/** Ranks a part by how badly it blocks: over cap, then never refills, then longest wait, then longest production. */
function blockScore(p: ResourceProjection): [number, number, number] {
  return [p.overCap ? 2 : !Number.isFinite(p.waitSeconds) ? 1 : 0, p.waitSeconds, p.productionSeconds];
}

function worse(a: ResourceProjection, b: ResourceProjection): boolean {
  const sa = blockScore(a);
  const sb = blockScore(b);
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return sa[i] > sb[i];
  }
  return false;
}

/** Pure: projects one cost against rates, stores and caps. Deterministic; table order breaks ties. */
export function projectCost(cost: Readonly<Record<string, string | number>>, rates: RealmRates): CostProjection {
  const parts: ResourceProjection[] = Object.entries(cost).map(([res, raw]) => {
    const need = Number(raw);
    const have = rates.have[res] ?? 0;
    const rate = rates.rate[res] ?? 0;
    const cap = rates.cap[res] ?? Infinity;
    const short = have >= need ? 0 : Math.ceil(need - have);
    const productionSeconds = need <= 0 ? 0 : rate > 0 ? need / rate : Infinity;
    const overCap = need > cap;
    const waitSeconds = short === 0 ? 0 : overCap || rate <= 0 ? Infinity : short / rate;
    return { res, need, have, rate, cap, short, productionSeconds, waitSeconds, overCap };
  });
  let limiter: ResourceProjection | undefined;
  for (const p of parts) {
    if (!limiter || worse(p, limiter)) limiter = p;
  }
  return {
    parts,
    limiter,
    productionSeconds: parts.reduce((m, p) => Math.max(m, p.productionSeconds), 0),
    waitSeconds: parts.reduce((m, p) => Math.max(m, p.waitSeconds), 0),
  };
}

/** True when the projection is worth a line: big relative to income, never refills, or too big for storage. */
export function projectionWorthShowing(p: CostProjection, minSeconds = PROJECTION_MIN_SECONDS): boolean {
  if (!p.limiter) return false;
  if (p.parts.some((x) => x.overCap)) return true;
  if (p.parts.some((x) => x.short > 0 && !Number.isFinite(x.waitSeconds))) return true;
  return p.productionSeconds >= minSeconds;
}

/** Reads the sim's income, army food upkeep and warehouse caps. Read-only. */
export function realmRates(state: GameState): RealmRates {
  const income = computeIncomePerSecond(state);
  const rate: Record<string, number> = {};
  for (const [res, v] of Object.entries(income)) rate[res] = Number(v);
  rate.food = (rate.food ?? 0) - upkeepPerTick(state) * TICKS_PER_SECOND;
  const have: Record<string, number> = {};
  const cap: Record<string, number> = {};
  for (const [res, v] of Object.entries(state.resources)) {
    have[res] = Number(v ?? 0);
    cap[res] = storageCap(state, res);
  }
  for (const res of ["food", "wood", "stone", "gold"]) {
    if (cap[res] === undefined) cap[res] = storageCap(state, res);
  }
  return { rate, have, cap };
}
