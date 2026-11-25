import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { economyGain } from "./economy.js";
import { keepIncomeMult, levelYieldMult } from "../content/pacing.js";

/** Food per tick from one farm (far from the keep) at the given keep and farm level. */
function farmFood(keep: number, farmLevel: number, studies: string[] = []): number {
  const s = createGameState({ seed: 3 });
  s.buildings = [];
  s.citizens = [];
  if (keep > 0) {
    s.buildings.push({ id: "k", typeId: "keep", realmId: "player", x: 1, y: 1, level: keep, completesAtTick: null });
  }
  s.buildings.push({ id: "f", typeId: "farm", realmId: "player", x: 8, y: 8, level: farmLevel, completesAtTick: null });
  for (const id of studies) s.flags[`research_${id}`] = 1;
  return Number(economyGain(s, 1, false).food ?? 0);
}

describe("income pass: production scales with Keep and level", () => {
  it("Keep I rates are unchanged (1× at L1, 2× at L2)", () => {
    const base = farmFood(1, 1);
    expect(farmFood(0, 1)).toBeCloseTo(base);
    expect(farmFood(1, 2) / base).toBeCloseTo(2);
  });

  it("mid game (Keep II-III, max level) lands at 3-8× early", () => {
    const base = farmFood(1, 1);
    const k2 = farmFood(2, 3) / base;
    const k3 = farmFood(3, 4) / base;
    expect(k2).toBeGreaterThanOrEqual(3);
    expect(k3).toBeLessThanOrEqual(8);
    expect(k3).toBeGreaterThan(k2);
  });

  it("late game (Keep IV-V, level 5) lands at 15-40× early", () => {
    const base = farmFood(1, 1);
    const k4 = farmFood(4, 5) / base;
    const k5 = farmFood(5, 5) / base;
    const k5Studied = farmFood(5, 5, ["husbandry", "crop_rotation"]) / base;
    expect(k4).toBeGreaterThanOrEqual(15);
    expect(k5).toBeGreaterThan(k4);
    expect(k5Studied).toBeGreaterThan(k5);
    expect(k5Studied).toBeLessThanOrEqual(40);
  });

  it("tables are monotonic and clamp out-of-range input", () => {
    for (let l = 2; l <= 5; l++) expect(levelYieldMult(l)).toBeGreaterThan(levelYieldMult(l - 1));
    for (let k = 2; k <= 5; k++) expect(keepIncomeMult(k)).toBeGreaterThan(keepIncomeMult(k - 1));
    expect(levelYieldMult(0)).toBe(1);
    expect(levelYieldMult(9)).toBe(8);
    expect(keepIncomeMult(9)).toBe(3.5);
  });

  it("is deterministic", () => {
    expect(farmFood(4, 5, ["husbandry"])).toBe(farmFood(4, 5, ["husbandry"]));
  });
});
