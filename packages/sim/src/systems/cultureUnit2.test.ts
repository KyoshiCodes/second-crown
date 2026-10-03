import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { setPlayerCulture, playerCultureId, cultureOfRealm } from "./culture.js";
import { computeIncomePerSecond } from "./economy.js";
import { tryStartResearch, researchDone, unitUnlocked } from "./research.js";
import { tryTrain } from "../actions/train.js";
import { getUnitType } from "../content/units.js";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { D } from "../core/decimal.js";

function perTick(culture: string | null, typeId: string, res: string): number {
  const s = createGameState({ seed: 1 });
  if (culture) setPlayerCulture(s, culture);
  const before = D(computeIncomePerSecond(s)[res] ?? "0");
  s.buildings.push({ id: "b1", typeId, realmId: "player", x: 9, y: 9, level: 1, completesAtTick: null });
  const after = D(computeIncomePerSecond(s)[res] ?? "0");
  return after.sub(before).div(TICKS_PER_SECOND).toNumber();
}

function rich(s: ReturnType<typeof createGameState>) {
  for (const r of ["food", "wood", "stone", "gold"]) s.resources[r] = "10000";
}

describe("glen culture", () => {
  it("existing saves default to western; a new game can pick glen", () => {
    const s = createGameState({ seed: 1 });
    expect(playerCultureId(s)).toBe("western");
    expect(setPlayerCulture(s, "glen")).toBe(true);
    expect(playerCultureId(s)).toBe("glen");
  });

  it("a glen quarry yields 1 above a western quarry", () => {
    const western = perTick(null, "quarry", "stone");
    const glen = perTick("glen", "quarry", "stone");
    expect(western).toBeGreaterThan(0);
    expect(glen - western).toBeCloseTo(1, 6);
  });

  it("glen farms match western farms", () => {
    expect(perTick("glen", "farm", "food")).toBeCloseTo(perTick(null, "farm", "food"), 6);
  });

  it("npc crowns are never seeded glen", () => {
    const s = createGameState({ seed: 3 });
    for (const id of ["a", "bb", "ccc", "dddd", "eeeee", "ffffff", "ggggggg"]) {
      expect(cultureOfRealm(s, id)).not.toBe("glen");
    }
  });
});

describe("banner", () => {
  it("costs the same as a spearman, power 3, drills in 3s", () => {
    const banner = getUnitType("banner")!;
    const spearman = getUnitType("spearman")!;
    expect(banner.cost).toEqual(spearman.cost);
    expect(banner.power).toBe(3);
    expect(banner.trainTicks).toBe(3 * TICKS_PER_SECOND);
  });

  it("refuses until Drill is done; spearman stays open", () => {
    const s = createGameState({ seed: 1 });
    rich(s);
    expect(unitUnlocked(s, "spearman")).toBe(true);
    expect(unitUnlocked(s, "banner")).toBe(false);
    expect(tryTrain(s, { typeId: "banner", count: 1 })).toBe(false);

    s.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 8, y: 8, level: 1, completesAtTick: null });
    expect(tryStartResearch(s, "drill")).toBe(true);
    expect(tryTrain(s, { typeId: "banner", count: 1 })).toBe(false);

    s.meta.tick += 10_000;
    expect(researchDone(s, "drill")).toBe(true);
    expect(tryTrain(s, { typeId: "banner", count: 1 })).toBe(true);
  });
});
