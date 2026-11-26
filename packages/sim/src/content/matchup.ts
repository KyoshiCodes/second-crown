import type { UnitRole } from "./units.js";

/** Line > Shock > Ranged > Line. Skirmish, siege, support are asymmetric. */
const TABLE: Record<UnitRole, Partial<Record<UnitRole, number>>> = {
  line: { shock: 1.4, ranged: 0.6, skirmish: 1.15 },
  ranged: { line: 1.4, shock: 0.6, siege: 1.2 },
  shock: { ranged: 1.4, line: 0.6, skirmish: 1.25 },
  skirmish: { siege: 1.3, support: 1.2, line: 0.85 },
  siege: { line: 1.25, shock: 0.7, ranged: 0.8 },
  support: { skirmish: 1.1 },
};

/** The roles a role hits harder (> 1) and softer (< 1), in table order. Read-only view for payoff notes. */
export function matchupRow(role: UnitRole): { role: UnitRole; mult: number }[] {
  return Object.entries(TABLE[role] ?? {}).map(([r, mult]) => ({ role: r as UnitRole, mult: mult ?? 1 }));
}

export function matchupModifier(attackerRole: UnitRole, defenderRole: UnitRole): number {
  return TABLE[attackerRole]?.[defenderRole] ?? 1;
}
