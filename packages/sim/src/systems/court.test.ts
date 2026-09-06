import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryBanquet, tryFortify, fortifyPower } from "./court.js";

describe("court", () => {
  it("holds a banquet", () => {
    const s = createGameState({ seed: 9 });
    s.resources.food = "25";
    s.resources.gold = "10";
    expect(tryBanquet(s)).toBe(true);
    expect(tryBanquet(s)).toBe(false);
  });

  it("fortifies for bonus power", () => {
    const s = createGameState({ seed: 9 });
    s.resources.stone = "20";
    expect(fortifyPower(s)).toBe(0);
    expect(tryFortify(s)).toBe(true);
    expect(fortifyPower(s)).toBe(6);
    expect(tryFortify(s)).toBe(false);
  });
});
