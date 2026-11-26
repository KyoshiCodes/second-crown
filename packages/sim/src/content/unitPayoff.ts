import { getUnitType, type UnitRole } from "./units.js";
import { matchupRow } from "./matchup.js";

/**
 * Short "where this unit pays off" notes for elite units (tier III+ and siege).
 * The matchup half is read straight from content/matchup.ts, so it cannot drift.
 * The extra clause is hand-written and each one is pinned by a battle test in
 * systems/elitePayoff.test.ts: if a combat change makes it false, that test fails.
 */
const ROLE_WORD: Record<UnitRole, string> = {
  line: "line",
  ranged: "archers",
  shock: "horse",
  skirmish: "skirmishers",
  siege: "siege",
  support: "support",
};

const PAYOFF_EXTRA: Record<string, string> = {
  cavalry: "Rides down archer screens; a spear line stops it.",
  knight: "Six take the bandit stockade; four steady a home guard.",
  siege: "Ignores camp palisades: one turns a stockade loss into a win.",
};

function fmt(mult: number): string {
  return `×${mult}`;
}

/** "Strong vs archers ×1.4, skirmishers ×1.25 · weak vs line ×0.6" */
export function roleMatchupNote(role: UnitRole): string {
  const row = matchupRow(role);
  const strong = row.filter((r) => r.mult > 1).map((r) => `${ROLE_WORD[r.role]} ${fmt(r.mult)}`);
  const weak = row.filter((r) => r.mult < 1).map((r) => `${ROLE_WORD[r.role]} ${fmt(r.mult)}`);
  const parts: string[] = [];
  if (strong.length) parts.push(`Strong vs ${strong.join(", ")}`);
  if (weak.length) parts.push(`weak vs ${weak.join(", ")}`);
  return parts.join(" · ");
}

/** Payoff note for an elite unit (tier III+ or siege role), or null for ordinary units. */
export function unitPayoffNote(typeId: string): string | null {
  const def = getUnitType(typeId);
  if (!def) return null;
  if (def.tier < 3 && def.role !== "siege") return null;
  const role = roleMatchupNote(def.role);
  const extra = PAYOFF_EXTRA[typeId];
  return [role ? `${role}.` : "", extra ?? ""].filter(Boolean).join(" ");
}
