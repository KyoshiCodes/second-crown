import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { housingCap, population, canHouse } from "./housing.js";
import { hireCitizenForBuilding } from "./citizens.js";

describe("W12 housing", () => {
  it("starts with two beds", () => {
    const s = createGameState({ seed: 1 });
    expect(housingCap(s)).toBe(2);
    expect(canHouse(s)).toBe(true);
  });

  it("cottage adds two beds and keep adds three", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push({
      id: "c",
      typeId: "cottage",
      realmId: "player",
      x: 1,
      y: 1,
      level: 1,
      completesAtTick: null,
    });
    expect(housingCap(s)).toBe(4);
    s.buildings.push({
      id: "k",
      typeId: "keep",
      realmId: "player",
      x: 2,
      y: 2,
      level: 1,
      completesAtTick: null,
    });
    expect(housingCap(s)).toBe(7);
  });

  it("stops hiring when beds are full", () => {
    const s = createGameState({ seed: 1 });
    hireCitizenForBuilding(s, "player", "farm", 0, 0);
    hireCitizenForBuilding(s, "player", "farm", 1, 0);
    expect(population(s)).toBe(2);
    hireCitizenForBuilding(s, "player", "farm", 2, 0);
    expect(population(s)).toBe(2);
  });
});
