import { describe, it, expect } from "vitest";
import { BASE_UNIT_TYPES, UNIT_TYPES, getUnitType } from "./units.js";
import { UNIT_TIER_PACING, UPGRADE_COST_MULT, UPGRADE_TIME_MULT } from "./pacing.js";

function totalCost(id: string): number {
  return Object.values(getUnitType(id)!.cost).reduce((n, v) => n + Number(v), 0);
}

describe("pacing pass 1", () => {
  it("unit tiers scale cost, drill time and power by the tier table", () => {
    const militia = getUnitType("militia")!;
    expect(militia.cost).toEqual({ food: "8", wood: "2" });
    expect(militia.trainTicks).toBe(60);
    expect(militia.power).toBe(1);

    const knight = getUnitType("knight")!;
    expect(knight.cost).toEqual({ food: "180", gold: "120", wood: "60" });
    expect(knight.trainTicks).toBe(1_200);
    expect(knight.power).toBe(25);

    const siege = getUnitType("siege")!;
    expect(siege.cost).toEqual({ wood: "800", stone: "480", gold: "240" });
    expect(siege.trainTicks).toBe(3_200);
    expect(siege.power).toBe(56);
  });

  it("each tier costs sharply more than the one below, and costs outrun power", () => {
    expect(totalCost("spearman")).toBeGreaterThan(totalCost("militia") * 5);
    expect(totalCost("knight")).toBeGreaterThan(totalCost("spearman") * 5);
    expect(totalCost("siege")).toBeGreaterThan(totalCost("knight") * 3);
    const perPower = (id: string) => totalCost(id) / getUnitType(id)!.power;
    expect(perPower("knight")).toBeGreaterThan(perPower("spearman"));
    expect(perPower("spearman")).toBeGreaterThan(perPower("militia"));
  });

  it("tier multipliers only climb", () => {
    for (const t of [2, 3, 4, 5] as const) {
      const lo = UNIT_TIER_PACING[(t - 1) as 1 | 2 | 3 | 4];
      const hi = UNIT_TIER_PACING[t];
      expect(hi.cost).toBeGreaterThan(lo.cost);
      expect(hi.train).toBeGreaterThan(lo.train);
      expect(hi.power).toBeGreaterThan(lo.power);
    }
    for (const lv of [2, 3, 4]) {
      expect(UPGRADE_TIME_MULT[lv]).toBeGreaterThan(UPGRADE_TIME_MULT[lv - 1]);
      expect(UPGRADE_COST_MULT[lv]).toBeGreaterThan(UPGRADE_COST_MULT[lv - 1]);
    }
  });

  it("the champion is hired, not drilled, and keeps its base numbers", () => {
    expect(UNIT_TYPES.champion).toEqual(BASE_UNIT_TYPES.champion);
  });

  it("is deterministic: the paced table is pure data", () => {
    expect(JSON.parse(JSON.stringify(UNIT_TYPES))).toEqual(UNIT_TYPES);
  });
});
