import type { BuildingTypeId, ResourceId } from "@second-crown/shared";

/**
 * Static building definitions for Phase D.
 * Production is expressed per fine tick (10 Hz).
 *
 * Rates are whole numbers so repeated fine-tick adds are bit-identical
 * to a single analytic multiply (Invariant 2 / floating-point safety).
 */
export interface BuildingType {
  id: BuildingTypeId;
  name: string;
  /** Resources produced each fine tick while the building is complete. */
  productionPerTick: Partial<Record<ResourceId, string>>;
  /** Construction time in fine ticks. 0 = instant. */
  buildTicks: number;
}

export const BUILDING_TYPES: Record<string, BuildingType> = {
  farm: {
    id: "farm",
    name: "Farm",
    productionPerTick: { food: "1" }, // 10 food per second at 10 Hz
    buildTicks: 50,
  },
  lumber_camp: {
    id: "lumber_camp",
    name: "Lumber Camp",
    productionPerTick: { wood: "1" },
    buildTicks: 50,
  },
  quarry: {
    id: "quarry",
    name: "Quarry",
    productionPerTick: { stone: "1" },
    buildTicks: 80,
  },
  gold_mine: {
    id: "gold_mine",
    name: "Gold Mine",
    productionPerTick: { gold: "1" },
    buildTicks: 100,
  },
};

export function getBuildingType(id: string): BuildingType | undefined {
  return BUILDING_TYPES[id];
}
