import type { BuildingTypeId, ResourceId } from "@second-crown/shared";

/**
 * Building definitions — Phase N balance.
 * Production per fine tick (10 Hz). Integer rates for determinism.
 */
export interface BuildingType {
  id: BuildingTypeId;
  name: string;
  productionPerTick: Partial<Record<ResourceId, string>>;
  buildTicks: number;
  cost: Partial<Record<ResourceId, string>>;
  color: number;
  /** Optional flavor shown in UI */
  blurb?: string;
}

export const BUILDING_TYPES: Record<string, BuildingType> = {
  // --- Early ---
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
  // --- Mid ---
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
  // --- Late ---
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
    blurb: "Each barracks: −5% unit train cost (min 50%)",
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
};

export function getBuildingType(id: string): BuildingType | undefined {
  return BUILDING_TYPES[id];
}

export function listBuildableTypes(): BuildingType[] {
  return Object.values(BUILDING_TYPES);
}

/** Count completed buildings of a type. */
export function countBuilding(state: { buildings: { typeId: string; completesAtTick: number | null }[] }, typeId: string): number {
  return state.buildings.filter((b) => b.typeId === typeId && b.completesAtTick === null).length;
}
