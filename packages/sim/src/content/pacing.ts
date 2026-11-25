/**
 * Pacing pass 1 (2026-11-25). One place for the long-game curves.
 *
 * The sim runs at TICKS_PER_SECOND = 10, so:
 *   1 minute = 600 ticks, 1 hour = 36_000 ticks, 1 day = 864_000 ticks.
 *
 * Early game (Keep I, tier I studies) stays in minutes. Mid game (Keep II-III)
 * stretches into hours. Late game (Keep IV -> V, deep studies) runs 8h to 3d,
 * with costs in the tens of thousands. All values are plain numbers: no clocks,
 * no randomness, same result on every machine.
 */

export const MINUTE_TICKS = 600;
export const HOUR_TICKS = 36_000;
export const DAY_TICKS = 864_000;

/**
 * Upgrade time = building buildTicks × UPGRADE_TIME_MULT[fromLevel].
 * Keep (140 build ticks): I→II ~19m, II→III ~1.75h, III→IV ~9.7h, IV→V ~2.3d.
 * Farm (30 build ticks):  1→2 4m,   2→3 22.5m,   3→4 ~2.1h,  4→5 ~11.7h.
 */
export const UPGRADE_TIME_MULT: Readonly<Record<number, number>> = {
  1: 80,
  2: 450,
  3: 2_500,
  4: 14_000,
};

/**
 * Upgrade cost = building cost × UPGRADE_COST_MULT[fromLevel] × build discounts.
 * Each step is sized to fit under the warehouse at the Keep level that allows it
 * (see KEEP_GATES.storeMult). Keep IV→V: 20k stone, 10k wood, 7.5k gold.
 */
export const UPGRADE_COST_MULT: Readonly<Record<number, number>> = {
  1: 3,
  2: 12,
  3: 60,
  4: 500,
};

export function upgradeTimeMult(fromLevel: number): number {
  return UPGRADE_TIME_MULT[fromLevel] ?? UPGRADE_TIME_MULT[4];
}

export function upgradeCostMult(fromLevel: number): number {
  return UPGRADE_COST_MULT[fromLevel] ?? UPGRADE_COST_MULT[4];
}

export interface UnitTierPacing {
  /** Multiplies the base resource cost of one unit. */
  cost: number;
  /** Multiplies the base train ticks of one unit. */
  train: number;
  /** Multiplies the base combat power of one unit. */
  power: number;
}

/**
 * Per-tier unit curve. Costs climb faster than power, so higher tiers are
 * stronger per head but dearer per point of power (the usual long-game trade).
 * Militia: 1.5s → 6s each. Knight: 6s → 2m each. Siege engine: 8s → 5.3m each.
 */
export const UNIT_TIER_PACING: Readonly<Record<1 | 2 | 3 | 4 | 5, UnitTierPacing>> = {
  1: { cost: 2, train: 4, power: 1 },
  2: { cost: 5, train: 8, power: 1.5 },
  3: { cost: 15, train: 20, power: 2.5 },
  4: { cost: 40, train: 40, power: 4 },
  5: { cost: 100, train: 80, power: 6 },
};
