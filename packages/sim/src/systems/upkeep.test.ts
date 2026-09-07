import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { applyUpkeep, armyMouths, upkeepPerTick } from "./upkeep.js";
import { D } from "../core/decimal.js";

describe("W16 upkeep", () => {
  it("charges food for standing troops", () => {
    const s = createGameState({ seed: 1 });
    s.units.push({ id: "m", typeId: "militia", realmId: "player", count: "10", armyId: null });
    s.resources.food = "5";
    expect(armyMouths(s)).toBe(10);
    expect(upkeepPerTick(s)).toBeCloseTo(0.2);
    applyUpkeep(s, 10);
    expect(D(s.resources.food).toNumber()).toBeCloseTo(3);
  });

  it("deserts one militia when the larder is empty", () => {
    const s = createGameState({ seed: 1 });
    s.units.push({ id: "m", typeId: "militia", realmId: "player", count: "4", armyId: null });
    s.resources.food = "0";
    applyUpkeep(s, 1);
    expect(D(s.units.find((u) => u.id === "m")?.count ?? "0").toNumber()).toBe(3);
  });
});
