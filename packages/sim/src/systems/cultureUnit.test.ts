import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { setPlayerCulture, playerCultureId, cultureOfRealm } from "./culture.js";
import { computeIncomePerSecond } from "./economy.js";
import { tryStartResearch, researchDone, unitUnlocked } from "./research.js";
import { tryTrain } from "../actions/train.js";
import { getUnitType } from "../content/units.js";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { D } from "../core/decimal.js";

function farmFoodPerTick(culture: string | null): number {
  const s = createGameState({ seed: 1 });
  if (culture) setPlayerCulture(s, culture);
  const before = D(computeIncomePerSecond(s).food ?? "0");
  s.buildings.push({ id: "f1", typeId: "farm", realmId: "player", x: 9, y: 9, level: 1, completesAtTick: null });
  const after = D(computeIncomePerSecond(s).food ?? "0");
  return after.sub(before).div(TICKS_PER_SECOND).toNumber();
}

function rich(s: ReturnType<typeof createGameState>) {
  for (const r of ["food", "wood", "stone", "gold"]) s.resources[r] = "10000";
}

describe("mist culture", () => {
  it("existing saves default to western; a new game can pick mist", () => {
    const s = createGameState({ seed: 1 });
    expect(playerCultureId(s)).toBe("western");
    expect(setPlayerCulture(s, "mist")).toBe(true);
    expect(playerCultureId(s)).toBe("mist");
  });

  it("a mist farm yields 1 above a western farm", () => {
    const western = farmFoodPerTick(null);
    const mist = farmFoodPerTick("mist");
    expect(western).toBeGreaterThan(0);
    expect(mist - western).toBeCloseTo(1, 6);
  });

  it("npc crowns are never seeded mist", () => {
    const s = createGameState({ seed: 3 });
    for (const id of ["a", "bb", "ccc", "dddd", "eeeee", "ffffff", "ggggggg"]) {
      expect(cultureOfRealm(s, id)).not.toBe("mist");
    }
  });
});

describe("ranger", () => {
  it("costs the same as an archer, power 4, drills in 4s", () => {
    const ranger = getUnitType("ranger")!;
    const archer = getUnitType("archer")!;
    expect(ranger.cost).toEqual(archer.cost);
    expect(ranger.power).toBe(4);
    expect(ranger.trainTicks).toBe(4 * TICKS_PER_SECOND);
  });

  it("refuses until Fieldcraft is done; archer stays open", () => {
    const s = createGameState({ seed: 1 });
    rich(s);
    expect(unitUnlocked(s, "archer")).toBe(true);
    expect(unitUnlocked(s, "ranger")).toBe(false);
    expect(tryTrain(s, { typeId: "ranger", count: 1 })).toBe(false);

    s.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 8, y: 8, level: 1, completesAtTick: null });
    expect(tryStartResearch(s, "fieldcraft")).toBe(true);
    expect(tryTrain(s, { typeId: "ranger", count: 1 })).toBe(false);

    s.meta.tick += 10_000;
    expect(researchDone(s, "fieldcraft")).toBe(true);
    expect(tryTrain(s, { typeId: "ranger", count: 1 })).toBe(true);
  });
});
