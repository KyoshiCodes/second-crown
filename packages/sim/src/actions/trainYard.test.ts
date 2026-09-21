import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { trainCostMultiplier } from "./train.js";

describe("keep-yard barracks", () => {
  it("cheapens training when barracks shares an edge with the keep", () => {
    const yard = createGameState({ seed: 1 });
    yard.buildings.push(
      { id: "k", typeId: "keep", realmId: "player", x: 4, y: 4, level: 1, completesAtTick: null },
      { id: "b", typeId: "barracks", realmId: "player", x: 5, y: 4, level: 1, completesAtTick: null }
    );
    const far = createGameState({ seed: 1 });
    far.buildings.push(
      { id: "k", typeId: "keep", realmId: "player", x: 4, y: 4, level: 1, completesAtTick: null },
      { id: "b", typeId: "barracks", realmId: "player", x: 8, y: 8, level: 1, completesAtTick: null }
    );
    expect(trainCostMultiplier(yard, "militia")).toBeLessThan(trainCostMultiplier(far, "militia"));
  });
});
