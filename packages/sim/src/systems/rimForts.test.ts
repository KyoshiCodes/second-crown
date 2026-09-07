import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { listRimForts } from "./rimForts.js";

describe("listRimForts", () => {
  it("empty rim returns nothing", () => {
    const s = createGameState({ seed: 1 });
    expect(listRimForts(s)).toEqual([]);
  });

  it("mixed walls and gate sort clockwise from (0,0)", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      { id: "w-bottom", typeId: "walls", realmId: "player", x: 10, y: 9, level: 1, completesAtTick: null },
      { id: "w-top", typeId: "walls", realmId: "player", x: 3, y: 0, level: 1, completesAtTick: null },
      { id: "g-right", typeId: "gate", realmId: "player", x: 15, y: 4, level: 1, completesAtTick: null },
      { id: "w-left", typeId: "walls", realmId: "player", x: 0, y: 5, level: 1, completesAtTick: null }
    );
    expect(listRimForts(s)).toEqual([
      { x: 3, y: 0, kind: "wall" },
      { x: 15, y: 4, kind: "gate" },
      { x: 10, y: 9, kind: "wall" },
      { x: 0, y: 5, kind: "wall" },
    ]);
  });

  it("excludes interior walls, unfinished buildings, and other realms", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      { id: "interior", typeId: "walls", realmId: "player", x: 5, y: 5, level: 1, completesAtTick: null },
      { id: "unfinished", typeId: "walls", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: 100 },
      { id: "rival", typeId: "walls", realmId: "rival", x: 0, y: 0, level: 1, completesAtTick: null },
      { id: "other", typeId: "chapel", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null }
    );
    expect(listRimForts(s)).toEqual([]);
  });
});
