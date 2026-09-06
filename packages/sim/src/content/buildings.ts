import type { BuildingTypeId, ResourceId } from "@second-crown/shared";

/**
 * Static building definitions for Phase D.
 * Production is expressed per fine tick (10 Hz).
 */
export interface BuildingType {
  id: BuildingTypeId;
  name: string;
  productionPerTick: Partial<Record<ResourceId, string>>;
  buildTicks: number;
}

export const BUILDING_TYPES: Record<string, BuildingType> = {
  farm: {
    id: "farm",
    name: "Farm",
    productionPerTick: { food: "0.1" },
    buildTicks: 50,
  },
  lumber_camp: {
    id: "lumber_camp",
    name: "Lumber Camp",
    productionPerTick: { wood: "0.08" },
    buildTicks: 50,
  },
  quarry: {
    id: "quarry",
    name: "Quarry",
    productionPerTick: { stone: "0.05" },
    buildTicks: 80,
  },
  gold_mine: {
    id: "gold_mine",
    name: "Gold Mine",
    productionPerTick: { gold: "0.02" },
    buildTicks: 100,
  },
};

export function getBuildingType(id: string): BuildingType | undefined {
  return BUILDING_TYPES[id];
}
