import type { ResourceId } from "@second-crown/shared";

/**
 * Camp tiers. Content only: who defends, what it pays, what a loss costs.
 * Which camp gets which tier is decided in systems/camp.ts (nearest live camp = lean-to,
 * farthest camp site = stockade, everything else = the old bandit camp).
 */
export type CampTierId = "lean_to" | "camp" | "stockade";

export interface CampTier {
  id: CampTierId;
  /** Short name for the inspect card. */
  name: string;
  /** One-word difficulty chip. */
  difficulty: "Safe" | "Fair" | "Hard";
  /** Who it is meant for, one short line. */
  hint: string;
  /** Defenders, by unit type. `null` keeps the legacy threat-scaled militia guard. */
  guard: Record<string, number> | null;
  /** Columns at least this big always win. `null` means the fight decides. */
  sureWinAt: number | null;
  /** Palisade: damage the walls soak before blows land. A Siege Engine in the column ignores it. */
  palisade: number;
  /** Loot on a win. */
  reward: Partial<Record<ResourceId, number>>;
  /** Extra loot when a Siege Engine marched with the column. */
  siegeReward: Partial<Record<ResourceId, number>>;
  /** On a loss: how many do not come home. 0 = safe. */
  lossDead: number;
}

export const CAMP_TIERS: Record<CampTierId, CampTier> = {
  lean_to: {
    id: "lean_to",
    name: "Bandit lean-to",
    difficulty: "Safe",
    hint: "Starter. 3 militia clear it. No one dies.",
    guard: { militia: 2 },
    sureWinAt: 3,
    palisade: 0,
    reward: { wood: 6, food: 3 },
    siegeReward: {},
    lossDead: 0,
  },
  camp: {
    id: "camp",
    name: "Bandit camp",
    difficulty: "Fair",
    hint: "5 militia clear it.",
    guard: null,
    sureWinAt: 5,
    palisade: 0,
    reward: { wood: 6 },
    siegeReward: {},
    lossDead: 2,
  },
  stockade: {
    id: "stockade",
    name: "Bandit stockade",
    difficulty: "Hard",
    hint: "Optional. Bring spears and archers. Siege breaks the palisade.",
    guard: { spearman: 6, archer: 3, militia: 4 },
    sureWinAt: null,
    palisade: 60,
    reward: { gold: 10, stone: 8, wood: 6 },
    siegeReward: { gold: 6 },
    lossDead: 2,
  },
};

const RES_LABEL: Partial<Record<ResourceId, string>> = {
  wood: "wood",
  food: "food",
  stone: "stone",
  gold: "gold",
};

/** "+6 wood +3 food" */
export function formatCampLoot(loot: Partial<Record<ResourceId, number>>): string {
  return Object.entries(loot)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([k, n]) => `+${n} ${RES_LABEL[k as ResourceId] ?? k}`)
    .join(" ");
}
