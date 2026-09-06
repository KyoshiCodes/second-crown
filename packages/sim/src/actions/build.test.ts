import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryBuild, canAfford } from "./build.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";

describe("tryBuild", () => {
  it("rejects when player cannot afford", () => {
    const state = createGameState({ seed: 1 });
    expect(canAfford(state, "farm")).toBe(false);
    expect(tryBuild(state, { typeId: "farm", x: 0, y: 0 })).toBe(false);
    expect(state.buildings.length).toBe(0);
  });

  it("queues a building and deducts cost when affordable", () => {
    const state = createGameState({ seed: 1 });
    state.resources.wood = "100";
    state.resources.food = "100";

    expect(canAfford(state, "farm")).toBe(true);
    const ok = tryBuild(state, { typeId: "farm", x: 2, y: 3 });
    expect(ok).toBe(true);
    expect(state.buildings.length).toBe(1);
    expect(state.buildings[0].typeId).toBe("farm");
    expect(state.buildings[0].completesAtTick).toBe(40); // farm.buildTicks
    expect(D(state.resources.wood).eq(92)).toBe(true); // cost 8 wood
    expect(state.inputLog.length).toBe(1);
    expect(state.inputLog[0].type).toBe("build");
  });

  it("building eventually produces after completion", () => {
    const state = createGameState({ seed: 1 });
    state.resources.wood = "100";
    tryBuild(state, { typeId: "farm", x: 0, y: 0 });

    const engine = new TickEngine(state);
    engine.tickMany(50); // past 40 build time

    // ticks 41..50 = 10 ticks of production
    expect(D(engine.getState().resources.food).gte(10)).toBe(true);
  });
});
