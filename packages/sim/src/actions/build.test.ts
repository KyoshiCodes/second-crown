import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryBuild, canAfford, tryCancelBuild, listWorksInProgress } from "./build.js";
import { getBuildingType } from "../content/buildings.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";

describe("tryBuild", () => {
  it("rejects when player cannot afford", () => {
    const state = createGameState({ seed: 1 });
    expect(canAfford(state, "farm")).toBe(false);
    expect(tryBuild(state, { typeId: "farm", x: 0, y: 0 })).toBe(false);
  });

  it("queues a building and deducts cost when affordable", () => {
    const state = createGameState({ seed: 1 });
    state.resources.wood = "100";
    state.resources.food = "100";

    expect(tryBuild(state, { typeId: "farm", x: 2, y: 3 })).toBe(true);
    expect(state.buildings[0].typeId).toBe("farm");
    expect(state.buildings[0].completesAtTick).toBe(30);
    // cost 6 wood × 0.9 ambitious = ceil(5.4) = 6
    expect(D(state.resources.wood).eq(94)).toBe(true);
  });

  it("building eventually produces after completion", () => {
    const state = createGameState({ seed: 1 });
    state.resources.wood = "100";
    tryBuild(state, { typeId: "farm", x: 0, y: 0 });

    const engine = new TickEngine(state);
    engine.tickMany(40);

    expect(D(engine.getState().resources.food).gte(10)).toBe(true);
  });

  it("academy has no drip production, a stone/wood/gold cost, and a slow build", () => {
    const def = getBuildingType("academy");
    expect(def).toBeTruthy();
    expect(def?.productionPerTick).toEqual({});
    expect(Object.keys(def?.cost ?? {}).sort()).toEqual(["gold", "stone", "wood"]);
    expect(def!.buildTicks).toBeGreaterThanOrEqual(120);
  });

  it("cancels scaffolding and refunds unused stores", () => {
    const state = createGameState({ seed: 1 });
    state.resources.wood = "100";
    expect(tryBuild(state, { typeId: "farm", x: 1, y: 1 })).toBe(true);
    expect(listWorksInProgress(state)).toHaveLength(1);
    const id = state.buildings[0].id;
    new TickEngine(state).settleTicks(15);
    expect(tryCancelBuild(state, id)).toBe(true);
    expect(state.buildings.find((b) => b.id === id)).toBeUndefined();
    expect(D(state.resources.wood).gte(94)).toBe(true);
    expect(tryCancelBuild(state, id)).toBe(false);
  });
});
