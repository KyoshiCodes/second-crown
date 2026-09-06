import type { BuildingTypeId, ResourceId } from "@second-crown/shared";

/**
 * Static building definitions.
 * Production is per fine tick (10 Hz). Rates are whole numbers for determinism.
 * color is used by the Pixi map (Phase H).
 */
export interface BuildingType {
  id: BuildingTypeId;
  name: string;
  productionPerTick: Partial<Record<ResourceId, string>>;
  buildTicks: number;
  cost: Partial<Record<ResourceId, string>>;
  /** Hex color for map rectangle */
  color: number;
}

export const BUILDING_TYPES: Record<string, BuildingType> = {
  farm: {
    id: "farm",
    name: "Farm",
    productionPerTick: { food: "1" },
    buildTicks: 40,
    cost: { wood: "8" },
    color: 0x6b8e23,
  },
  lumber_camp: {
    id: "lumber_camp",
    name: "Lumber Camp",
    productionPerTick: { wood: "1" },
    buildTicks: 40,
    cost: { wood: "4", food: "8" },
    color: 0x8b5a2b,
  },
  quarry: {
    id: "quarry",
    name: "Quarry",
    productionPerTick: { stone: "1" },
    buildTicks: 60,
    cost: { wood: "12", food: "8" },
    color: 0x808080,
  },
  gold_mine: {
    id: "gold_mine",
    name: "Gold Mine",
    productionPerTick: { gold: "1" },
    buildTicks: 80,
    cost: { wood: "15", stone: "15", food: "15" },
    color: 0xdaa520,
  },
  granary: {
    id: "granary",
    name: "Granary",
    productionPerTick: { food: "3" },
    buildTicks: 80,
    cost: { wood: "25", stone: "10", food: "20" },
    color: 0xc4a35a,
  },
  sawmill: {
    id: "sawmill",
    name: "Sawmill",
    productionPerTick: { wood: "3" },
    buildTicks: 80,
    cost: { wood: "20", stone: "15", food: "15" },
    color: 0x5c4033,
  },
  mason: {
    id: "mason",
    name: "Mason",
    productionPerTick: { stone: "2" },
    buildTicks: 90,
    cost: { wood: "20", stone: "20", food: "10" },
    color: 0x696969,
  },
  mint: {
    id: "mint",
    name: "Mint",
    productionPerTick: { gold: "2" },
    buildTicks: 120,
    cost: { wood: "30", stone: "30", gold: "10" },
    color: 0xffd700,
  },
};

export function getBuildingType(id: string): BuildingType | undefined {
  return BUILDING_TYPES[id];
}

export function listBuildableTypes(): BuildingType[] {
  return Object.values(BUILDING_TYPES);
}
