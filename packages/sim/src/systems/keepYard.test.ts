import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { keepBonus } from "./economy.js";
import { TickEngine } from "../core/tickEngine.js";

describe("keep yard", () => {
  it("a farm on the keep edge gets +10%", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      { id: "k", typeId: "keep", realmId: "player", x: 4, y: 4, level: 1, completesAtTick: null },
      { id: "f", typeId: "farm", realmId: "player", x: 5, y: 4, level: 1, completesAtTick: null }
    );
    expect(keepBonus(s, s.buildings[1])).toBeCloseTo(1.1);
    expect(keepBonus(s, s.buildings[0])).toBe(1);
  });

  it("a farm two tiles away is not lifted", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      { id: "k", typeId: "keep", realmId: "player", x: 4, y: 4, level: 1, completesAtTick: null },
      { id: "f", typeId: "farm", realmId: "player", x: 6, y: 4, level: 1, completesAtTick: null }
    );
    expect(keepBonus(s, s.buildings[1])).toBe(1);
  });

  it("keep-side farm outpaces a far farm", () => {
    const near = createGameState({ seed: 9 });
    near.buildings.push(
      { id: "k", typeId: "keep", realmId: "player", x: 4, y: 4, level: 1, completesAtTick: null },
      { id: "f", typeId: "farm", realmId: "player", x: 5, y: 4, level: 1, completesAtTick: null }
    );
    const far = createGameState({ seed: 9 });
    far.buildings.push(
      { id: "k", typeId: "keep", realmId: "player", x: 4, y: 4, level: 1, completesAtTick: null },
      { id: "f", typeId: "farm", realmId: "player", x: 8, y: 8, level: 1, completesAtTick: null }
    );
    new TickEngine(near).settleTicks(40);
    new TickEngine(far).settleTicks(40);
    expect(Number(near.resources.food)).toBeGreaterThan(Number(far.resources.food));
  });
});
