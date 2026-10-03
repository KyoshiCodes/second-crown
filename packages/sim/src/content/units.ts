import type { UnitTypeId, ResourceId } from "@second-crown/shared";

export type UnitRole = "line" | "ranged" | "shock" | "skirmish" | "siege" | "support";

export interface UnitType {
  id: UnitTypeId;
  name: string;
  power: number;
  attack: number;
  defense: number;
  hp: number;
  speed: number;
  role: UnitRole;
  tier: 1 | 2 | 3 | 4 | 5;
  cost: Partial<Record<ResourceId, string>>;
  trainTicks: number;
  blurb?: string;
}

export const UNIT_TYPES: Record<string, UnitType> = {
  militia: {
    id: "militia",
    name: "Militia",
    power: 1,
    attack: 4,
    defense: 3,
    hp: 8,
    speed: 3,
    role: "line",
    tier: 1,
    cost: { food: "4", wood: "1" },
    trainTicks: 15,
    blurb: "Cheap bodies",
  },
  spearman: {
    id: "spearman",
    name: "Spearman",
    power: 3,
    attack: 8,
    defense: 10,
    hp: 16,
    speed: 3,
    role: "line",
    tier: 2,
    cost: { food: "6", wood: "4", stone: "1" },
    trainTicks: 30,
    blurb: "Solid line infantry",
  },
  banner: {
    id: "banner",
    name: "Banner",
    power: 3,
    attack: 8,
    defense: 10,
    hp: 16,
    speed: 3,
    role: "line",
    tier: 2,
    cost: { food: "6", wood: "4", stone: "1" },
    trainTicks: 30,
    blurb: "Colour guard. Needs Drill.",
  },
  skirmisher: {
    id: "skirmisher",
    name: "Skirmisher",
    power: 3,
    attack: 7,
    defense: 4,
    hp: 10,
    speed: 5,
    role: "skirmish",
    tier: 2,
    cost: { food: "5", wood: "3", gold: "1" },
    trainTicks: 28,
    blurb: "Light javelins",
  },
  warden: {
    id: "warden",
    name: "Warden",
    power: 3,
    attack: 5,
    defense: 7,
    hp: 12,
    speed: 3,
    role: "line",
    tier: 2,
    cost: { food: "5", wood: "3", gold: "1" },
    trainTicks: 30,
    blurb: "Hold guard. Needs Screening.",
  },
  archer: {
    id: "archer",
    name: "Archer",
    power: 4,
    attack: 11,
    defense: 4,
    hp: 10,
    speed: 4,
    role: "ranged",
    tier: 2,
    cost: { food: "5", wood: "6", gold: "1" },
    trainTicks: 35,
    blurb: "Skirmish power",
  },
  ranger: {
    id: "ranger",
    name: "Ranger",
    power: 4,
    attack: 11,
    defense: 4,
    hp: 10,
    speed: 4,
    role: "ranged",
    tier: 2,
    cost: { food: "5", wood: "6", gold: "1" },
    trainTicks: 40,
    blurb: "Field bow. Needs Fieldcraft.",
  },
  cavalry: {
    id: "cavalry",
    name: "Cavalry",
    power: 7,
    attack: 14,
    defense: 8,
    hp: 18,
    speed: 7,
    role: "shock",
    tier: 3,
    cost: { food: "10", gold: "4", wood: "3" },
    trainTicks: 50,
    blurb: "Fast shock horse",
  },
  outrider: {
    id: "outrider",
    name: "Outrider",
    power: 5,
    attack: 14,
    defense: 8,
    hp: 18,
    speed: 7,
    role: "shock",
    tier: 3,
    cost: { food: "10", gold: "4", wood: "3" },
    trainTicks: 50,
    blurb: "Light scout horse. Needs Horse lore.",
  },
  knight: {
    id: "knight",
    name: "Knight",
    power: 10,
    attack: 16,
    defense: 14,
    hp: 24,
    speed: 5,
    role: "shock",
    tier: 3,
    cost: { food: "12", gold: "8", wood: "4" },
    trainTicks: 60,
    blurb: "Heavy hitters",
  },
  siege: {
    id: "siege",
    name: "Siege Engine",
    power: 14,
    attack: 20,
    defense: 6,
    hp: 22,
    speed: 2,
    role: "siege",
    tier: 4,
    cost: { wood: "20", stone: "12", gold: "6" },
    trainTicks: 80,
    blurb: "Breaks walls and hosts",
  },
  champion: {
    id: "champion",
    name: "Champion",
    power: 18,
    attack: 22,
    defense: 16,
    hp: 36,
    speed: 5,
    role: "support",
    tier: 4,
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
