import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryTrade, canTrade } from "./trade.js";
import { D } from "../core/decimal.js";

describe("trade", () => {
  it("requires a completed market", () => {
    const state = createGameState({ seed: 1 });
    state.resources.food = "100";
    expect(canTrade(state, "food_gold")).toBe(false);
    expect(tryTrade(state, "food_gold")).toBe(false);
  });

  it("swaps resources when a market exists", () => {
    const state = createGameState({ seed: 1 });
    state.resources.food = "100";
    state.buildings.push({
      id: "m1",
      typeId: "market",
      realmId: "player",
      x: 3,
      y: 3,
      level: 1,
      completesAtTick: null,
    });
    expect(tryTrade(state, "food_gold")).toBe(true);
    expect(D(state.resources.food).eq(80)).toBe(true);
    expect(D(state.resources.gold).eq(5)).toBe(true);
  });

  it("trades gold for wood", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "20";
    state.buildings.push({
      id: "m1",
      typeId: "market",
      realmId: "player",
      x: 3,
      y: 3,
      level: 1,
      completesAtTick: null,
    });
    expect(tryTrade(state, "gold_wood")).toBe(true);
    expect(D(state.resources.gold).eq(12)).toBe(true);
    expect(D(state.resources.wood).gte(22)).toBe(true);
  });
});
