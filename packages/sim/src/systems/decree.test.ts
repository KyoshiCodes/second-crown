import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryDecree, decreeActive, tryScout, isScouted } from "./decree.js";

describe("wave 3 decrees and scouting", () => {
  it("pays for a harvest rite", () => {
    const s = createGameState({ seed: 3 });
    s.resources.food = "80";
    expect(tryDecree(s, "rite")).toBe(true);
    expect(decreeActive(s, "rite")).toBe(true);
    expect(Number(s.resources.food)).toBe(30);
  });

  it("scouts a rival for gold", () => {
    const s = createGameState({ seed: 3 });
    s.resources.gold = "12";
    expect(isScouted(s, "rival")).toBe(false);
    expect(tryScout(s, "rival")).toBe(true);
    expect(isScouted(s, "rival")).toBe(true);
    expect(Number(s.resources.gold)).toBe(2);
  });
});
