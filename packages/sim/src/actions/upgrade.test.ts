import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryUpgrade, canUpgrade, MAX_BUILDING_LEVEL } from "./upgrade.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";

describe("upgrade", () => {
  it("raises level and production", () => {
    const state = createGameState({ seed: 1, withStarterBuildings: true });
    state.resources.wood = "1000";
    state.resources.food = "1000";
    const farm = state.buildings.find((b) => b.typeId === "farm")!;
    expect(farm.level).toBe(1);
    expect(canUpgrade(state, farm.id)).toBe(true);
    expect(tryUpgrade(state, farm.id)).toBe(true);
    expect(farm.level).toBe(2);

    const engine = new TickEngine(state);
    engine.tickMany(10);
    // farm lv2: 2 base + 1 clever = 3/tick × 10 = 30 food
    expect(D(engine.getState().resources.food).gte(30)).toBe(true);
  });

  it("caps at max level", () => {
    const state = createGameState({ seed: 1, withStarterBuildings: true });
    state.resources.wood = "99999";
    state.resources.food = "99999";
    state.resources.stone = "99999";
    const farm = state.buildings.find((b) => b.typeId === "farm")!;
    for (let i = 1; i < MAX_BUILDING_LEVEL; i++) {
      expect(tryUpgrade(state, farm.id)).toBe(true);
    }
    expect(farm.level).toBe(MAX_BUILDING_LEVEL);
    expect(tryUpgrade(state, farm.id)).toBe(false);
  });
});
