import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { adjacencyBonus } from "./economy.js";
import { TickEngine } from "../core/tickEngine.js";

function farm(id: string, x: number, y: number) {
  return {
    id,
    typeId: "farm",
    realmId: "player",
    x,
    y,
    level: 1,
    completesAtTick: null,
  };
}

describe("adjacency", () => {
  it("edge neighbors of the same type raise the bonus", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(farm("a", 2, 2), farm("b", 3, 2));
    expect(adjacencyBonus(s, s.buildings[0])).toBeCloseTo(1.1);
    expect(adjacencyBonus(s, s.buildings[1])).toBeCloseTo(1.1);
  });

  it("diagonal farms do not count", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(farm("a", 2, 2), farm("b", 3, 3));
    expect(adjacencyBonus(s, s.buildings[0])).toBe(1);
  });

  it("a paired field beats two isolated farms over the same ticks", () => {
    const paired = createGameState({ seed: 4 });
    paired.buildings.push(farm("p1", 2, 2), farm("p2", 3, 2));
    const split = createGameState({ seed: 4 });
    split.buildings.push(farm("s1", 1, 1), farm("s2", 6, 6));
    new TickEngine(paired).settleTicks(40);
    new TickEngine(split).settleTicks(40);
    expect(Number(paired.resources.food)).toBeGreaterThan(Number(split.resources.food));
  });
});
