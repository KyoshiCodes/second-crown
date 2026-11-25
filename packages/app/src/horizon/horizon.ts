/**
 * Progression horizon helpers. Display only: they read numbers the sim already gives the app
 * and turn them into words. No rules live here.
 */
import { TICKS_PER_SECOND } from "@second-crown/shared";

export const MINUTE = 60;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** How long a wait is, in plain bands. */
export type HorizonBracket = "seconds" | "minutes" | "hours" | "days";

/**
 * Long-form time. Seconds are rounded up, then shown in the two largest units:
 *   45 → "45s", 90 → "1m 30s", 600 → "10m", 12_000 → "3h 20m", 187_200 → "2d 4h".
 * A zero second unit is dropped ("2h", not "2h 0m"). Under a minute it stays "Ns",
 * so short timers read exactly as before.
 */
export function formatHorizon(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const s = Math.ceil(seconds);
  if (s < MINUTE) return `${s}s`;
  if (s < HOUR) {
    const m = Math.floor(s / MINUTE);
    const r = s % MINUTE;
    return r ? `${m}m ${r}s` : `${m}m`;
  }
  if (s < DAY) {
    const h = Math.floor(s / HOUR);
    const m = Math.floor((s % HOUR) / MINUTE);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(s / DAY);
  const h = Math.floor((s % DAY) / HOUR);
  return h ? `${d}d ${h}h` : `${d}d`;
}

/** Same as formatHorizon, from sim ticks. */
export function formatTicksHorizon(ticks: number, ticksPerSecond = TICKS_PER_SECOND): string {
  return formatHorizon(ticks / ticksPerSecond);
}

export function horizonBracket(seconds: number): HorizonBracket {
  const s = Math.ceil(Math.max(0, seconds));
  if (s >= DAY) return "days";
  if (s >= HOUR) return "hours";
  if (s >= MINUTE) return "minutes";
  return "seconds";
}

/** True when a wait is long enough to call out (an hour or more). */
export function isLongHorizon(seconds: number): boolean {
  const b = horizonBracket(seconds);
  return b === "hours" || b === "days";
}

/** Exact count for a tooltip, e.g. "12,000 seconds". */
export function exactSeconds(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${s.toLocaleString("en-US")} second${s === 1 ? "" : "s"}`;
}

/** Threshold (4 hours) at which a wait earns the "Long project" pacing badge. */
export const LONG_PROJECT_SECONDS = 4 * HOUR;

export type PacingTier = "short" | "extended" | "long-project" | "multi-day";

/** True when a research or building wait is 4 hours or longer. */
export function isLongProject(seconds: number): boolean {
  const s = Math.ceil(Math.max(0, seconds));
  return s >= LONG_PROJECT_SECONDS;
}

/** Classifies a wait into display pacing bands for indicators and tooltips. */
export function pacingTier(seconds: number): PacingTier {
  if (horizonBracket(seconds) === "days") return "multi-day";
  if (isLongProject(seconds)) return "long-project";
  if (horizonBracket(seconds) === "hours") return "extended";
  return "short";
}

/** Tooltip text carrying exact seconds plus pacing context for hour/day waits. */
export function pacingTooltip(seconds: number): string {
  const exact = exactSeconds(seconds);
  const tier = pacingTier(seconds);
  if (tier === "multi-day") {
    return `Long project (multi-day commitment) · ${formatHorizon(seconds)} (${exact}). Progress continues while away.`;
  }
  if (tier === "long-project") {
    return `Long project (4h+ commitment) · ${formatHorizon(seconds)} (${exact}). Progress continues while away.`;
  }
  if (tier === "extended") {
    return `Multi-hour wait · ${formatHorizon(seconds)} (${exact}). Progress continues while away.`;
  }
  return exact;
}

// ---------- Units ----------

export type UnitTierRank = 1 | 2 | 3 | 4 | 5;
export type UnitTierShape = "circle" | "chevron" | "diamond" | "star" | "crown";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII"];

const TIER_SHAPES: Record<UnitTierRank, UnitTierShape> = {
  1: "circle",
  2: "chevron",
  3: "diamond",
  4: "star",
  5: "crown",
};

export function unitTierRank(tier: number | undefined): UnitTierRank {
  const n = Math.floor(tier ?? 1);
  if (!Number.isFinite(n) || n <= 1) return 1;
  if (n >= 5) return 5;
  return n as UnitTierRank;
}

export function unitTierShape(tier: number | undefined): UnitTierShape {
  return TIER_SHAPES[unitTierRank(tier)];
}

export function unitTierLabel(tier: number | undefined): string {
  const t = Math.max(1, Math.floor(tier ?? 1));
  return `Tier ${ROMAN[t] ?? t}`;
}

/** True for elite units (Tier IV or Tier V) deserving a quiet highlight on unit cards. */
export function isEliteUnitTier(tier: number | undefined): boolean {
  return tier !== undefined && unitTierRank(tier) >= 4;
}

export type CostBracket = "standard" | "costly" | "steep";

/**
 * Cost bands for one batch (sum of every resource in the cost × batch size).
 * Tuned to the paced unit table: one Tier III Knight ~360, one Tier IV Siege engine ~1520.
 * 50 militia or a few Knights reads "costly"; two Siege engines or a big Knight batch reads "steep".
 */
export const COST_BRACKET_COSTLY = 500;
export const COST_BRACKET_STEEP = 2000;

export function batchCostTotal(cost: Partial<Record<string, string | number>>, qty = 1): number {
  let sum = 0;
  for (const v of Object.values(cost)) {
    const n = Number(v);
    if (Number.isFinite(n)) sum += n;
  }
  return sum * Math.max(1, qty);
}

export function costBracket(total: number): CostBracket {
  if (total >= COST_BRACKET_STEEP) return "steep";
  if (total >= COST_BRACKET_COSTLY) return "costly";
  return "standard";
}

/** One short note when a unit's batch is in a higher cost or time band, else null. */
export function unitBracketNote(input: { costTotal: number; seconds: number }): string | null {
  const parts: string[] = [];
  const cb = costBracket(input.costTotal);
  if (cb === "steep") parts.push("steep cost");
  else if (cb === "costly") parts.push("costly batch");
  const tb = horizonBracket(input.seconds);
  if (tb === "days" || tb === "hours") parts.push(`${tb}-long drill`);
  else if (tb === "minutes") parts.push("long drill");
  return parts.length ? `Higher bracket · ${parts.join(" · ")}` : null;
}

// ---------- Pace ----------

export type PaceStage = "early" | "mid" | "late";

/** True when the player has reached mid or late pace and the Pace line softly breathes. */
export function isPaceBreathing(stage: PaceStage): boolean {
  return stage === "mid" || stage === "late";
}

/**
 * Where the realm stands, from Keep level (0–5) and the share of lectern studies known.
 *  - late:  Keep IV or higher, or at least two thirds of studies known
 *  - early: Keep I or lower and under a third of studies known
 *  - mid:   everything between
 */
export function paceStage(input: { keep: number; known: number; total: number }): PaceStage {
  const share = input.total > 0 ? input.known / input.total : 0;
  if (input.keep >= 4 || share >= 2 / 3) return "late";
  if (input.keep <= 1 && share < 1 / 3) return "early";
  return "mid";
}
