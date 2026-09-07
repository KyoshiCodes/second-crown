import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { gateHp, gateOnRim } from "./gate.js";
import { wallHp } from "./march.js";

describe("W15 gate", () => {
  it("a rim gate adds wall HP", () => {
    const s = createGameState({ seed: 1 });
    expect(gateOnRim(s)).toBe(false);
    const before = wallHp(s);
    s.buildings.push({
      id: "g",
      typeId: "gate",
      realmId: "player",
      x: 0,
      y: 5,
      level: 1,
      completesAtTick: null,
    });
    expect(gateOnRim(s)).toBe(true);
    expect(gateHp(s)).toBe(30);
    expect(wallHp(s)).toBe(before + 30);
  });
});
