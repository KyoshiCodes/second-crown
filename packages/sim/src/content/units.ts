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
  skirmisher: {
    id: "skirmisher",
    name: "Skirmisher",
    power: 3,
    cost: { food: "5", wood: "3", gold: "1" },
    trainTicks: 28,
    blurb: "Light javelins",
  },
  archer: {
    id: "archer",
    name: "Archer",
    power: 4,
    cost: { food: "5", wood: "6", gold: "1" },
    trainTicks: 35,
    blurb: "Skirmish power",
  },
  cavalry: {
    id: "cavalry",
    name: "Cavalry",
    power: 7,
    cost: { food: "10", gold: "4", wood: "3" },
    trainTicks: 50,
    blurb: "Fast shock horse",
  },
  knight: {
    id: "knight",
    name: "Knight",
    power: 10,
    cost: { food: "12", gold: "8", wood: "4" },
    trainTicks: 60,
    blurb: "Heavy hitters",
  },
  siege: {
    id: "siege",
    name: "Siege Engine",
    power: 14,
    cost: { wood: "20", stone: "12", gold: "6" },
    trainTicks: 80,
    blurb: "Breaks walls and hosts",
  },
  champion: {
    id: "champion",
    name: "Champion",
    power: 18,
    cost: { gold: "80", food: "40" },
    trainTicks: 1,
    blurb: "One named blade. Hire from the Army tab.",
  },
};

export function getUnitType(id: string): UnitType | undefined {
  return UNIT_TYPES[id];
}

export function listUnitTypes(): UnitType[] {
  return Object.values(UNIT_TYPES).filter((u) => u.id !== "champion");
}
