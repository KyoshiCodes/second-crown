import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryStartResearch, researchDone, unitUnlocked } from "./research.js";
import { tryTrain } from "../actions/train.js";

describe("academy research", () => {
  it("blocks cavalry until horse lore finishes", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "200";
    s.resources.food = "200";
    s.resources.wood = "200";
    expect(unitUnlocked(s, "cavalry")).toBe(false);
    expect(tryTrain(s, { typeId: "cavalry", count: 1 })).toBe(false);
    expect(tryStartResearch(s, "horse")).toBe(false);
    s.buildings.push({
      id: "br",
      typeId: "barracks",
      realmId: "player",
      x: 4,
      y: 4,
      level: 1,
      completesAtTick: null,
    });
    expect(tryStartResearch(s, "horse")).toBe(true);
    s.meta.tick = 300;
    expect(researchDone(s, "horse")).toBe(true);
    expect(tryTrain(s, { typeId: "cavalry", count: 1 })).toBe(true);
  });

  it("blocks siege engines until siege craft finishes", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "200";
    s.resources.wood = "200";
    s.resources.stone = "200";
    expect(unitUnlocked(s, "siege")).toBe(false);
    s.buildings.push({
      id: "sw",
      typeId: "siege_workshop",
      realmId: "player",
      x: 5,
      y: 5,
      level: 1,
      completesAtTick: null,
    });
    expect(tryStartResearch(s, "siege")).toBe(true);
    s.meta.tick = 400;
    expect(researchDone(s, "siege")).toBe(true);
    expect(unitUnlocked(s, "siege")).toBe(true);
  });

  it("a finished academy also opens horse lore, no barracks required", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "200";
    s.resources.wood = "200";
    expect(tryStartResearch(s, "horse")).toBe(false);
    s.buildings.push({
      id: "ac",
      typeId: "academy",
      realmId: "player",
      x: 6,
      y: 6,
      level: 1,
      completesAtTick: null,
    });
    expect(tryStartResearch(s, "horse")).toBe(true);
  });
});
