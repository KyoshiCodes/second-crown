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

/** Seconds from sim ticks, via the shared tick rate. */
export function ticksToSeconds(ticks: number): number {
  return ticks / TICKS_PER_SECOND;
}

/** A per-second rate with an explicit sign, using a true minus for deficits: "−2/s", "+0.4/s". */
export function formatSignedRate(n: number): string {
  const abs = Math.abs(n);
  const shown = abs >= 10 ? Math.round(abs).toString() : (Math.round(abs * 10) / 10).toString();
  if (shown === "0") return "0/s";
  return `${n < 0 ? "−" : "+"}${shown}/s`;
}

/** Net food per second after army upkeep when it is below zero; null when food holds even or grows. */
export function foodDeficit(rates: RealmRates): number | null {
  const r = rates.rate.food ?? 0;
  return r < 0 ? r : null;
}

/** "Food −2/s after upkeep", or null when there is no deficit. */
export function foodDeficitText(rates: RealmRates): string | null {
  const d = foodDeficit(rates);
  return d === null ? null : `Food ${formatSignedRate(d)} after upkeep`;
}

export type BlockKind = "prereq" | "keep" | "hall" | "busy" | "warehouse" | "stores";

export interface BlockReason {
  kind: BlockKind;
  /** Short plain words, e.g. "lectern busy (Forestry)". */
  text: string;
}

/** Gates outside the stores that the caller already read from the sim. Unset means met. */
export interface ProjectGates {
  /** Name of an unknown prerequisite study. */
  prereq?: string;
  /** Keep level still needed. */
  keepNeed?: number;
  /** Hall names when none is built. */
  halls?: readonly string[];
  /** Name of the study (or job) already occupying the slot. */
  busyWith?: string;
}

const ROMAN = ["0", "I", "II", "III", "IV", "V"];

/**
 * Pure: every reason a project cannot start right now, most structural first
 * (prerequisite, Keep, hall, lectern busy, warehouse too small, stores short).
 */
export function blockReasons(p: CostProjection, gates: ProjectGates = {}): BlockReason[] {
  const out: BlockReason[] = [];
  if (gates.prereq) out.push({ kind: "prereq", text: `missing prerequisite (${gates.prereq})` });
  if (gates.keepNeed) out.push({ kind: "keep", text: `needs Keep ${ROMAN[gates.keepNeed] ?? gates.keepNeed}` });
  if (gates.halls && gates.halls.length > 0) out.push({ kind: "hall", text: `needs ${gates.halls.join(" or ")}` });
  if (gates.busyWith) out.push({ kind: "busy", text: `lectern busy (${gates.busyWith})` });
  for (const x of p.parts) {
    if (x.overCap) out.push({ kind: "warehouse", text: `warehouse too small (${x.res} ${x.need} > ${x.cap})` });
  }
  const short = p.parts.filter((x) => x.short > 0 && !x.overCap);
  if (short.length > 0) {
    out.push({ kind: "stores", text: `stores short (${short.map((x) => `${x.short} ${x.res}`).join(", ")})` });
  }
  return out;
}
