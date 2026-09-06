import type { UnitTypeId, ResourceId } from "@second-crown/shared";

export interface UnitType {
  id: UnitTypeId;
  name: string;
  /** Combat power per unit (integer). */
  power: number;
  cost: Partial<Record<ResourceId, string>>;
  /** Fine ticks to train one unit. */
  trainTicks: number;
}

export const UNIT_TYPES: Record<string, UnitType> = {
  militia: {
    id: "militia",
    name: "Militia",
    power: 1,
    cost: { food: "5", wood: "2" },
    trainTicks: 20,
  },
  spearman: {
    id: "spearman",
    name: "Spearman",
    power: 3,
    cost: { food: "8", wood: "5", stone: "2" },
    trainTicks: 40,
  },
  knight: {
    id: "knight",
    name: "Knight",
    power: 8,
    cost: { food: "15", gold: "10", wood: "5" },
    trainTicks: 80,
  },
};

export function getUnitType(id: string): UnitType | undefined {
  return UNIT_TYPES[id];
}

export function listUnitTypes(): UnitType[] {
  return Object.values(UNIT_TYPES);
}
