import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { createCitizen, tryAssignCitizen } from "./citizens.js";
import { staffBonus } from "./economy.js";
import { TickEngine } from "../core/tickEngine.js";

describe("posted staff", () => {
  it("a farmer on the farm tile raises that farm's staff bonus", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push({
      id: "farm_1",
      typeId: "farm",
      realmId: "player",
      x: 2,
      y: 2,
      level: 1,
      completesAtTick: null,
    });
    expect(staffBonus(s, s.buildings[0])).toBe(1);
    const c = createCitizen(s, "player");
    expect(tryAssignCitizen(s, c.id, "farm_1")).toBe(true);
    expect(staffBonus(s, s.buildings[0])).toBeCloseTo(1.2);
  });

  it("a staffed farm outpaces an empty farm over the same ticks", () => {
    const empty = createGameState({ seed: 2 });
    empty.buildings.push({
      id: "farm_e",
      typeId: "farm",
      realmId: "player",
      x: 1,
      y: 1,
      level: 1,
      completesAtTick: null,
    });
    const staffed = createGameState({ seed: 2 });
    staffed.buildings.push({
      id: "farm_s",
      typeId: "farm",
      realmId: "player",
      x: 1,
      y: 1,
      level: 1,
      completesAtTick: null,
    });
    const c = createCitizen(staffed, "player");
    tryAssignCitizen(staffed, c.id, "farm_s");
    new TickEngine(empty).settleTicks(50);
    new TickEngine(staffed).settleTicks(50);
    expect(Number(staffed.resources.food)).toBeGreaterThan(Number(empty.resources.food));
  });
});
