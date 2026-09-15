import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryBuild, canAfford, canPlaceAt, canPlaceType, tryCancelBuild, tryDemolish, listWorksInProgress, isUniqueBuilding } from "./build.js";
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

  it("demolishes a finished farm for salvage and will not touch a keep", () => {
    const state = createGameState({ seed: 1 });
    state.buildings.push({
      id: "farm_done",
      typeId: "farm",
      realmId: "player",
      x: 1,
      y: 1,
      level: 1,
      completesAtTick: null,
    });
    state.buildings.push({
      id: "keep_1",
      typeId: "keep",
      realmId: "player",
      x: 4,
      y: 4,
      level: 1,
      completesAtTick: null,
    });
    const wood = Number(state.resources.wood);
    expect(tryDemolish(state, "farm_done")).toBe(true);
    expect(state.buildings.find((b) => b.id === "farm_done")).toBeUndefined();
    expect(Number(state.resources.wood)).toBeGreaterThan(wood);
    expect(tryDemolish(state, "keep_1")).toBe(false);
    expect(state.buildings.find((b) => b.id === "keep_1")).toBeTruthy();
  });

  it("refuses a second building on the same plot and does not take stores", () => {
    const state = createGameState({ seed: 1 });
    state.resources.wood = "100";
    expect(tryBuild(state, { typeId: "farm", x: 3, y: 3 })).toBe(true);
    const wood = state.resources.wood;
    expect(canPlaceAt(state, 3, 3)).toBe(false);
    expect(tryBuild(state, { typeId: "farm", x: 3, y: 3 })).toBe(false);
    expect(state.resources.wood).toBe(wood);
    expect(state.buildings.filter((b) => b.x === 3 && b.y === 3)).toHaveLength(1);
    expect(canPlaceAt(state, 99, 0)).toBe(false);
  });

  it("walls and gates only sit on the rim", () => {
    const state = createGameState({ seed: 1 });
    state.resources.wood = "200";
    state.resources.stone = "200";
    state.resources.gold = "50";
    expect(canPlaceType(state, "walls", 4, 4)).toBe(false);
    expect(tryBuild(state, { typeId: "walls", x: 4, y: 4 })).toBe(false);
    expect(tryBuild(state, { typeId: "walls", x: 0, y: 4 })).toBe(true);
    expect(tryBuild(state, { typeId: "gate", x: 5, y: 5 })).toBe(false);
    expect(tryBuild(state, { typeId: "gate", x: 15, y: 3 })).toBe(true);
  });

  it("allows only one keep and one academy", () => {
    const state = createGameState({ seed: 1 });
    state.resources.wood = "400";
    state.resources.stone = "400";
    state.resources.gold = "200";
    expect(isUniqueBuilding("keep")).toBe(true);
    expect(isUniqueBuilding("farm")).toBe(false);
    expect(tryBuild(state, { typeId: "keep", x: 4, y: 4 })).toBe(true);
    const gold = state.resources.gold;
    expect(canPlaceType(state, "keep", 5, 5)).toBe(false);
    expect(tryBuild(state, { typeId: "keep", x: 5, y: 5 })).toBe(false);
    expect(state.resources.gold).toBe(gold);
    expect(tryBuild(state, { typeId: "academy", x: 6, y: 4 })).toBe(true);
    expect(tryBuild(state, { typeId: "academy", x: 7, y: 4 })).toBe(false);
    expect(tryBuild(state, { typeId: "farm", x: 2, y: 2 })).toBe(true);
    expect(tryBuild(state, { typeId: "farm", x: 2, y: 3 })).toBe(true);
  });
});
