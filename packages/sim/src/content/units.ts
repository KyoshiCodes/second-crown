import type { UnitTypeId, ResourceId } from "@second-crown/shared";

export interface UnitType {
  id: UnitTypeId;
  name: string;
  power: number;
  cost: Partial<Record<ResourceId, string>>;
  trainTicks: number;
  blurb?: string;
}

export const UNIT_TYPES: Record<string, UnitType> = {
  militia: {
    id: "militia",
    name: "Militia",
    power: 1,
    cost: { food: "4", wood: "1" },
    trainTicks: 15,
    blurb: "Cheap bodies",
  },
  spearman: {
    id: "spearman",
    name: "Spearman",
    power: 3,
    cost: { food: "6", wood: "4", stone: "1" },
    trainTicks: 30,
    blurb: "Solid line infantry",
  },
  archer: {
    id: "archer",
    name: "Archer",
    power: 4,
    cost: { food: "5", wood: "6", gold: "1" },
    trainTicks: 35,
    blurb: "Skirmish power",
  },
  knight: {
    id: "knight",
    name: "Knight",
    power: 10,
    cost: { food: "12", gold: "8", wood: "4" },
    trainTicks: 60,
    blurb: "Heavy hitters",
  },
};

export function getUnitType(id: string): UnitType | undefined {
  return UNIT_TYPES[id];
}

export function listUnitTypes(): UnitType[] {
  return Object.values(UNIT_TYPES);
}
