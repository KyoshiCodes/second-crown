import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { applySiegeBlow } from "./march.js";
import { absorbWounded, HEAL_TICKS, infirmaryBeds, tryRepair, tryTreatWounded, woundedCount } from "./ward.js";

describe("W5 ward", () => {
  it("infirmary beds absorb half of losses up to cap", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push({
      id: "inf",
      typeId: "infirmary",
      realmId: "player",
      x: 2,
      y: 2,
      level: 1,
      completesAtTick: null,
    });
    expect(infirmaryBeds(s)).toBe(10);
    const saved = absorbWounded(s, 8);
    expect(saved).toBe(4);
    expect(woundedCount(s)).toBe(4);
    s.resources.food = "20";
    expect(tryTreatWounded(s)).toBe(true);
    expect(woundedCount(s)).toBe(3);
  });

  it("returns a militia after the heal timer", () => {
    const s = createGameState({ seed: 1 });
    s.units = [{ id: "m", typeId: "militia", realmId: "player", count: "2", armyId: null }];
    s.flags.wounded_player = 1;
    s.resources.food = "20";
    expect(tryTreatWounded(s)).toBe(true);
    expect(s.units.find((u) => u.typeId === "militia")?.count).toBe("2");
    new TickEngine(s).settleTicks(HEAL_TICKS);
    expect(s.units.find((u) => u.typeId === "militia")?.count).toBe("3");
  });

  it("repairs a scarred building for stone", () => {
    const s = createGameState({ seed: 1 });
    s.resources.stone = "20";
    s.buildings.push({
      id: "f",
      typeId: "farm",
      realmId: "player",
      x: 1,
      y: 1,
      level: 1,
      completesAtTick: null,
    });
    applySiegeBlow(s, 200, 1);
    expect(s.buildings.find((b) => b.id === "f")?.completesAtTick).not.toBeNull();
    expect(tryRepair(s, "f")).toBe(true);
    expect(s.buildings.find((b) => b.id === "f")?.completesAtTick).toBeNull();
  });
});
