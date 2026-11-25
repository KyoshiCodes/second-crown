/**
 * Higher-income bracket helpers for the stores strip (app only).
 * Compares per-second income against a single Keep I level-1 starter building
 * (1/tick * 10 ticks/s = 10/s). Display only; no game rules live here.
 */

export const BASE_INCOME_PER_SECOND = 10;
export const INCOME_MID_MULT = 3;
export const INCOME_LATE_MULT = 15;

export type IncomeBracket = "base" | "mid" | "late";

/** Classifies a resource's net/gross income per second into base, mid (3x+), or late (15x+). */
export function resolveIncomeBracket(rawIncome: string | number | undefined): IncomeBracket {
  if (rawIncome === Infinity) return "late";
  const n = typeof rawIncome === "number" ? rawIncome : Number(rawIncome ?? "0");
  if (n === Infinity) return "late";
  if (!Number.isFinite(n) || n <= 0) return "base";
  if (n >= BASE_INCOME_PER_SECOND * INCOME_LATE_MULT) return "late";
  if (n >= BASE_INCOME_PER_SECOND * INCOME_MID_MULT) return "mid";
  return "base";
}

/** Short tooltip label for mid/late production brackets, or null at base income. */
export function incomeBracketLabel(bracket: IncomeBracket): string | null {
  if (bracket === "late") return "Late income (15×+ base)";
  if (bracket === "mid") return "Mid income (3×+ base)";
  return null;
}
