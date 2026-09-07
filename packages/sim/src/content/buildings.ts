import type { BuildingTypeId, ResourceId } from "@second-crown/shared";

export interface BuildingType {
  id: BuildingTypeId;
  name: string;
  productionPerTick: Partial<Record<ResourceId, string>>;
  buildTicks: number;
  cost: Partial<Record<ResourceId, string>>;
  color: number;
  blurb?: string;
}

export const BUILDING_TYPES: Record<string, BuildingType> = {
  farm: {
    id: "farm",
    name: "Farm",
    productionPerTick: { food: "1" },
    buildTicks: 30,
    cost: { wood: "6" },
    color: 0x6b8e23,
    blurb: "Feeds your people and your army",
  },
  lumber_camp: {
    id: "lumber_camp",
    name: "Lumber Camp",
    productionPerTick: { wood: "1" },
    buildTicks: 30,
    cost: { wood: "3", food: "5" },
    color: 0x8b5a2b,
    blurb: "Wood for everything else",
  },
  quarry: {
    id: "quarry",
    name: "Quarry",
    productionPerTick: { stone: "1" },
    buildTicks: 45,
    cost: { wood: "10", food: "6" },
    color: 0x808080,
    blurb: "Stone for advanced works",
  },
  gold_mine: {
    id: "gold_mine",
    name: "Gold Mine",
    productionPerTick: { gold: "1" },
    buildTicks: 60,
    cost: { wood: "12", stone: "10", food: "10" },
    color: 0xdaa520,
    blurb: "Coin for knights and prestige",
  },
  granary: {
    id: "granary",
    name: "Granary",
    productionPerTick: { food: "3" },
    buildTicks: 60,
    cost: { wood: "18", stone: "8", food: "12" },
    color: 0xc4a35a,
    blurb: "Bulk food",
  },
  sawmill: {
    id: "sawmill",
    name: "Sawmill",
    productionPerTick: { wood: "3" },
    buildTicks: 60,
    cost: { wood: "14", stone: "12", food: "10" },
    color: 0x5c4033,
    blurb: "Bulk wood",
  },
  mason: {
    id: "mason",
    name: "Mason Yard",
    productionPerTick: { stone: "2" },
    buildTicks: 70,
    cost: { wood: "14", stone: "14", food: "8" },
    color: 0x696969,
    blurb: "Bulk stone",
  },
  market: {
    id: "market",
    name: "Market",
    productionPerTick: { gold: "2", food: "1" },
    buildTicks: 80,
    cost: { wood: "20", stone: "15", gold: "5" },
    color: 0xcd853f,
    blurb: "Trade wealth",
  },
  mint: {
    id: "mint",
    name: "Mint",
    productionPerTick: { gold: "4" },
    buildTicks: 100,
    cost: { wood: "25", stone: "25", gold: "15" },
    color: 0xffd700,
    blurb: "Serious coin",
  },
  barracks: {
    id: "barracks",
    name: "Barracks",
    productionPerTick: {},
    buildTicks: 50,
    cost: { wood: "15", stone: "10", food: "15" },
    color: 0x4a5568,
    blurb: "Each barracks: -5% unit train cost (min 50%)",
  },
  stables: {
    id: "stables",
    name: "Stables",
    productionPerTick: { food: "1" },
    buildTicks: 55,
    cost: { wood: "16", food: "12", gold: "4" },
    color: 0x8b6914,
    blurb: "-10% Cavalry and Knight train cost",
  },
  archery_range: {
    id: "archery_range",
    name: "Archery Range",
    productionPerTick: {},
    buildTicks: 50,
    cost: { wood: "14", food: "8" },
    color: 0x2f6f4e,
    blurb: "-10% Archer and Skirmisher train cost",
  },
  siege_workshop: {
    id: "siege_workshop",
    name: "Siege Workshop",
    productionPerTick: {},
    buildTicks: 70,
    cost: { wood: "22", stone: "16", gold: "8" },
    color: 0x5c4033,
    blurb: "-15% Siege Engine train cost",
  },
  watchtower: {
    id: "watchtower",
    name: "Watchtower",
    productionPerTick: { gold: "1" },
    buildTicks: 40,
    cost: { wood: "8", stone: "12" },
    color: 0x718096,
    blurb: "Each tower: +2 combat power",
  },
  chapel: {
    id: "chapel",
    name: "Chapel",
    productionPerTick: { gold: "1" },
    buildTicks: 55,
    cost: { stone: "14", wood: "10", gold: "6" },
    color: 0xc4b5fd,
    blurb: "Tithe gold",
  },
  infirmary: {
    id: "infirmary",
    name: "Infirmary",
    productionPerTick: {},
    buildTicks: 70,
    cost: { wood: "16", stone: "12", food: "10" },
    color: 0xb91c1c,
    blurb: "Each infirmary: 10 wounded beds. Half of home losses go to beds instead of the grave",
  },
  walls: {
    id: "walls",
    name: "Walls",
    productionPerTick: {},
    buildTicks: 80,
    cost: { stone: "24", wood: "12" },
    color: 0x64748b,
    blurb: "Place on the hold rim. Eight rim walls close the ring",
  },
  keep: {
    id: "keep",
    name: "Keep",
    productionPerTick: {},
    buildTicks: 140,
    cost: { stone: "40", wood: "20", gold: "15" },
    color: 0x475569,
    blurb: "Each keep: +8 combat power, and doubles that as bonus defense when attacked",
  },
};

export function getBuildingType(id: string): BuildingType | undefined {
  return BUILDING_TYPES[id];
}

export function listBuildableTypes(): BuildingType[] {
  return Object.values(BUILDING_TYPES);
}

export function countBuilding(state: { buildings: { typeId: string; completesAtTick: number | null }[] }, typeId: string): number {
  return state.buildings.filter((b) => b.typeId === typeId && b.completesAtTick === null).length;
}
