import type { BuildingTypeId, ResourceId } from "@second-crown/shared";

/**
 * Static building definitions.
 * Production is per fine tick (10 Hz). Rates are whole numbers for determinism.
 */
export interface BuildingType {
  id: BuildingTypeId;
  name: string;
  productionPerTick: Partial<Record<ResourceId, string>>;
  buildTicks: number;
  /** Resource cost to start construction. */
  cost: Partial<Record<ResourceId, string>>;
}

export const BUILDING_TYPES: Record<string, BuildingType> = {
  farm: {
    id: "farm",
    name: "Farm",
    productionPerTick: { food: "1" },
    buildTicks: 50,
    cost: { wood: "10" },
  },
  lumber_camp: {
    id: "lumber_camp",
    name: "Lumber Camp",
    productionPerTick: { wood: "1" },
    buildTicks: 50,
    cost: { wood: "5", food: "10" },
  },
  quarry: {
    id: "quarry",
    name: "Quarry",
    productionPerTick: { stone: "1" },
    buildTicks: 80,
    cost: { wood: "15", food: "10" },
  },
  gold_mine: {
    id: "gold_mine",
    name: "Gold Mine",
    productionPerTick: { gold: "1" },
    buildTicks: 100,
    cost: { wood: "20", stone: "20", food: "20" },
  },
};

export function getBuildingType(id: string): BuildingType | undefined {
  return BUILDING_TYPES[id];
}

export function listBuildableTypes(): BuildingType[] {
  return Object.values(BUILDING_TYPES);
}
