import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { maxLevelFor, tryUpgrade } from "./upgrade.js";

describe("upgrade cap", () => {
  it("without a keep, farms stop at level 2", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    const farm = s.buildings.find((b) => b.typeId === "farm")!;
    expect(maxLevelFor(s, "farm")).toBe(2);
    s.resources.wood = "999";
    s.resources.food = "999";
    s.resources.stone = "999";
    s.resources.gold = "999";
    expect(tryUpgrade(s, farm.id)).toBe(true);
    expect(farm.level).toBe(2);
    expect(tryUpgrade(s, farm.id)).toBe(false);
  });

  it("a level 2 keep raises the cap to 3", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    s.buildings.push({
      id: "k",
      typeId: "keep",
      realmId: "player",
      x: 4,
      y: 4,
      level: 2,
      completesAtTick: null,
    });
    expect(maxLevelFor(s, "farm")).toBe(3);
    expect(maxLevelFor(s, "keep")).toBe(5);
  });
});
