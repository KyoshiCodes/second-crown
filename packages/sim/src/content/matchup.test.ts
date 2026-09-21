import { describe, it, expect } from "vitest";
import { matchupModifier } from "./matchup.js";
import { UNIT_TYPES, listUnitTypes } from "./units.js";

describe("unit stats and matchups", () => {
  it("every listed unit has attack defense hp speed role tier", () => {
    for (const u of [...listUnitTypes(), UNIT_TYPES.champion]) {
      expect(u.attack).toBeGreaterThan(0);
      expect(u.defense).toBeGreaterThan(0);
      expect(u.hp).toBeGreaterThan(0);
      expect(u.speed).toBeGreaterThan(0);
      expect(u.tier).toBeGreaterThanOrEqual(1);
      expect(["line", "ranged", "shock", "skirmish", "siege", "support"]).toContain(u.role);
    }
  });

  it("line beats shock, shock beats ranged, ranged beats line", () => {
    expect(matchupModifier("line", "shock")).toBeGreaterThan(1);
    expect(matchupModifier("shock", "ranged")).toBeGreaterThan(1);
    expect(matchupModifier("ranged", "line")).toBeGreaterThan(1);
    expect(matchupModifier("line", "ranged")).toBeLessThan(1);
  });

  it("same role is even", () => {
    expect(matchupModifier("line", "line")).toBe(1);
    expect(matchupModifier("shock", "shock")).toBe(1);
  });
});
