import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { absorbBattleCasualties, infirmaryBeds, woundedCount } from "./ward.js";

describe("wounded by default", () => {
  it("winner losses fill empty beds first", () => {
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
    const r = absorbBattleCasualties(s, 7, "winner");
    expect(r.saved).toBe(7);
    expect(r.dead).toBe(0);
    expect(woundedCount(s)).toBe(7);
  });

  it("loser overflow past beds is dead", () => {
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
    const r = absorbBattleCasualties(s, 15, "loser");
    expect(r.saved).toBe(10);
    expect(r.dead).toBe(5);
    expect(woundedCount(s)).toBe(10);
  });
});
