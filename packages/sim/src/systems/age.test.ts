import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryHireChampion, tryOpenRoute, seasonIndex, currentSeason } from "./age.js";

describe("age systems", () => {
  it("hires a single champion", () => {
    const s = createGameState({ seed: 4 });
    s.resources.gold = "100";
    s.resources.food = "50";
    expect(tryHireChampion(s)).toBe(true);
    expect(s.units.some((u) => u.typeId === "champion")).toBe(true);
    expect(tryHireChampion(s)).toBe(false);
  });

  it("opens up to three trade routes", () => {
    const s = createGameState({ seed: 4 });
    s.resources.gold = "80";
    expect(tryOpenRoute(s)).toBe(true);
    expect(tryOpenRoute(s)).toBe(true);
    expect(tryOpenRoute(s)).toBe(true);
    expect(tryOpenRoute(s)).toBe(false);
    expect(Number(s.flags.trade_routes)).toBe(3);
  });

  it("seasons cycle every 2000 ticks", () => {
    expect(seasonIndex(0)).toBe(0);
    expect(seasonIndex(2000)).toBe(1);
    const s = createGameState({ seed: 4 });
    s.meta.tick = 4000;
    expect(currentSeason(s)).toBe("Autumn");
  });
});
