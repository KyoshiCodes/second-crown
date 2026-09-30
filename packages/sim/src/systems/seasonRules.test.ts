import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { harvestMult, marchTicks } from "./age.js";
import { computeIncomePerSecond } from "./economy.js";
import { listMarches, tryMarch } from "./march.js";

function marchEta(tick: number): number {
  const s = createGameState({ seed: 1 });
  s.meta.tick = tick;
  s.units.push({ id: "u1", typeId: "militia", realmId: "player", count: "20", armyId: null });
  const camp = s.board.provinces.find((p) => p.node === "camp");
  expect(tryMarch(s, camp!.id)).toBe(true);
  const m = listMarches(s)[0];
  expect(m.departedTick).toBe(tick);
  return m.arrivesTick - tick;
}

function farmFood(tick: number): number {
  const s = createGameState({ seed: 1 });
  s.meta.tick = tick;
  s.buildings.push({ id: "f1", typeId: "farm", realmId: "player", x: 12, y: 8, level: 1, completesAtTick: null });
  s.buildings.push({ id: "l1", typeId: "lumber_camp", realmId: "player", x: 3, y: 8, level: 1, completesAtTick: null });
  return Number(computeIncomePerSecond(s).food ?? "0");
}

describe("season rules", () => {
  it("winter marches take 18 ticks per step instead of 15", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 0;
    expect(marchTicks(s, 3)).toBe(45);
    s.meta.tick = 6000;
    expect(marchTicks(s, 3)).toBe(54);
    expect(marchTicks(s, 0)).toBe(18);
  });

  it("a winter march arrives 20% later than a spring march", () => {
    const spring = marchEta(0);
    const winter = marchEta(6000);
    expect(winter).toBe((spring / 15) * 18);
  });

  it("autumn farms make 15% more food; other seasons and buildings unchanged", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 4000;
    expect(harvestMult(s, "farm", "food")).toBe(1.15);
    expect(harvestMult(s, "lumber_camp", "wood")).toBe(1);
    s.meta.tick = 0;
    expect(harvestMult(s, "farm", "food")).toBe(1);

    // Spring and Autumn share the same flat season bonus, so only the harvest differs.
    const spring = farmFood(0);
    const autumn = farmFood(4000);
    expect(spring).toBeGreaterThan(0);
    expect(autumn / spring).toBeCloseTo(1.15, 6);
  });
});
