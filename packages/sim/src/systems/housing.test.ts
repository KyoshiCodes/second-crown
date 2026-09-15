import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { housingCap, population, canHouse, workPlotCap, workPlotsUsed, canRaiseWork } from "./housing.js";
import { hireCitizenForBuilding } from "./citizens.js";
import { tryBuild } from "../actions/build.js";

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

  it("starts with two work plots and refuses a third farm", () => {
    const s = createGameState({ seed: 1 });
    s.resources.wood = "200";
    s.resources.food = "200";
    expect(workPlotCap(s)).toBe(2);
    expect(tryBuild(s, { typeId: "farm", x: 1, y: 1 })).toBe(true);
    expect(tryBuild(s, { typeId: "farm", x: 2, y: 1 })).toBe(true);
    expect(workPlotsUsed(s)).toBe(2);
    expect(canRaiseWork(s)).toBe(false);
    expect(tryBuild(s, { typeId: "farm", x: 3, y: 1 })).toBe(false);
  });

  it("a finished cottage buys two more plots", () => {
    const s = createGameState({ seed: 1 });
    s.resources.wood = "200";
    s.resources.food = "200";
    s.resources.stone = "200";
    s.buildings.push({
      id: "c",
      typeId: "cottage",
      realmId: "player",
      x: 4,
      y: 4,
      level: 1,
      completesAtTick: null,
    });
    expect(workPlotCap(s)).toBe(4);
    expect(tryBuild(s, { typeId: "farm", x: 1, y: 1 })).toBe(true);
    expect(tryBuild(s, { typeId: "lumber_camp", x: 2, y: 1 })).toBe(true);
    expect(tryBuild(s, { typeId: "quarry", x: 3, y: 1 })).toBe(true);
    expect(tryBuild(s, { typeId: "gold_mine", x: 5, y: 1 })).toBe(true);
    expect(tryBuild(s, { typeId: "farm", x: 6, y: 1 })).toBe(false);
  });
});
