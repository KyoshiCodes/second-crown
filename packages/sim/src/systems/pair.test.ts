import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { pairBonus } from "./economy.js";
import { TickEngine } from "../core/tickEngine.js";

describe("warehouse pairs", () => {
  it("a farm touching a granary gets the pair bonus", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      { id: "f", typeId: "farm", realmId: "player", x: 2, y: 2, level: 1, completesAtTick: null },
      { id: "g", typeId: "granary", realmId: "player", x: 3, y: 2, level: 1, completesAtTick: null }
    );
    expect(pairBonus(s, s.buildings[0])).toBeCloseTo(1.15);
    expect(pairBonus(s, s.buildings[1])).toBeCloseTo(1.15);
  });

  it("a far granary does not pair", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      { id: "f", typeId: "farm", realmId: "player", x: 2, y: 2, level: 1, completesAtTick: null },
      { id: "g", typeId: "granary", realmId: "player", x: 7, y: 7, level: 1, completesAtTick: null }
    );
    expect(pairBonus(s, s.buildings[0])).toBe(1);
  });

  it("paired farm outpaces a lone farm over the same ticks", () => {
    const paired = createGameState({ seed: 5 });
    paired.buildings.push(
      { id: "f", typeId: "farm", realmId: "player", x: 2, y: 2, level: 1, completesAtTick: null },
      { id: "g", typeId: "granary", realmId: "player", x: 3, y: 2, level: 1, completesAtTick: null }
    );
    const lone = createGameState({ seed: 5 });
    lone.buildings.push(
      { id: "f", typeId: "farm", realmId: "player", x: 2, y: 2, level: 1, completesAtTick: null },
      { id: "g", typeId: "granary", realmId: "player", x: 8, y: 8, level: 1, completesAtTick: null }
    );
    new TickEngine(paired).settleTicks(40);
    new TickEngine(lone).settleTicks(40);
    expect(Number(paired.resources.food)).toBeGreaterThan(Number(lone.resources.food));
  });
});
