import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { emptyStaffWorks } from "./staffHint.js";

describe("empty staff hints", () => {
  it("flags a finished farm with no worker on the tile", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push({
      id: "farm1",
      typeId: "farm",
      realmId: "player",
      x: 3,
      y: 3,
      level: 1,
      completesAtTick: null,
    });
    expect(emptyStaffWorks(s).some((w) => w.typeId === "farm")).toBe(true);
  });
});
