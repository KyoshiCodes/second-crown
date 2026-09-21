import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { unpairedWorks } from "./pairHint.js";

describe("pair hints", () => {
  it("flags a farm with no granary on an edge", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push({
      id: "farm1",
      typeId: "farm",
      realmId: "player",
      x: 4,
      y: 4,
      level: 1,
      completesAtTick: null,
    });
    const miss = unpairedWorks(s);
    expect(miss.some((m) => m.typeId === "farm" && m.wants === "granary")).toBe(true);
  });

  it("clears when the mate sits on an edge", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      {
        id: "farm1",
        typeId: "farm",
        realmId: "player",
        x: 4,
        y: 4,
        level: 1,
        completesAtTick: null,
      },
      {
        id: "g1",
        typeId: "granary",
        realmId: "player",
        x: 5,
        y: 4,
        level: 1,
        completesAtTick: null,
      }
    );
    expect(unpairedWorks(s).some((m) => m.id === "farm1")).toBe(false);
  });
});
