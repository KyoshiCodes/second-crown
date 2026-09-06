import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import {
  tryHireChampion,
  tryOpenRoute,
  seasonIndex,
  currentSeason,
  tryHireMercs,
  tryNameChampion,
  championName,
  tryCollectTithe,
} from "./age.js";
import { D } from "../core/decimal.js";

function playerMilitia(s: ReturnType<typeof createGameState>) {
  return D(s.units.find((u) => u.typeId === "militia" && u.realmId === "player")?.count ?? "0");
}

describe("age systems", () => {
  it("hires a single champion", () => {
    const s = createGameState({ seed: 4 });
    s.resources.gold = "100";
    s.resources.food = "50";
    expect(tryHireChampion(s)).toBe(true);
    expect(s.units.some((u) => u.typeId === "champion")).toBe(true);
    expect(tryHireChampion(s)).toBe(false);
    expect(tryNameChampion(s, "Ser Rowan")).toBe(true);
    expect(championName(s)).toBe("Ser Rowan");
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

  it("hires mercenaries for gold", () => {
    const s = createGameState({ seed: 4 });
    const before = playerMilitia(s);
    s.resources.gold = "30";
    expect(tryHireMercs(s)).toBe(true);
    expect(playerMilitia(s).eq(before.add(8))).toBe(true);
    expect(D(s.resources.gold).eq(0)).toBe(true);
  });

  it("collects tithe only with a chapel", () => {
    const s = createGameState({ seed: 4 });
    expect(tryCollectTithe(s)).toBe(false);
    s.buildings.push({
      id: "ch1",
      typeId: "chapel",
      realmId: "player",
      x: 2,
      y: 2,
      level: 1,
      completesAtTick: null,
    });
    expect(tryCollectTithe(s)).toBe(true);
    expect(tryCollectTithe(s)).toBe(false);
  });
});
