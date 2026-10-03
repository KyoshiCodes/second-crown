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

function keepAt(s: ReturnType<typeof createGameState>, level: number) {
  const keep = s.buildings.find((b) => b.typeId === "keep" && b.realmId === "player");
  if (keep) {
    keep.level = level;
    keep.completesAtTick = null;
  } else {
    s.buildings.push({ id: "keep_t", typeId: "keep", realmId: "player", x: 7, y: 7, level, completesAtTick: null });
  }
}

describe("salt culture", () => {
  it("existing saves default to western; a new game can pick salt", () => {
    const s = createGameState({ seed: 1 });
    expect(playerCultureId(s)).toBe("western");
    expect(setPlayerCulture(s, "salt")).toBe(true);
    expect(playerCultureId(s)).toBe("salt");
  });

  it("a salt lumber camp yields 1 wood above a western lumber camp", () => {
    const western = perTick(null, "lumber_camp", "wood");
    const salt = perTick("salt", "lumber_camp", "wood");
    expect(western).toBeGreaterThan(0);
    expect(salt - western).toBeCloseTo(1, 6);
  });

  it("salt farms and quarries match western", () => {
    expect(perTick("salt", "farm", "food")).toBeCloseTo(perTick(null, "farm", "food"), 6);
    expect(perTick("salt", "quarry", "stone")).toBeCloseTo(perTick(null, "quarry", "stone"), 6);
  });

  it("npc crowns are never seeded salt", () => {
    const s = createGameState({ seed: 3 });
    for (const id of ["a", "bb", "ccc", "dddd", "eeeee", "ffffff", "ggggggg"]) {
      expect(cultureOfRealm(s, id)).not.toBe("salt");
    }
  });
});

describe("outrider", () => {
  it("costs the same as cavalry, power 5, drills in 5s", () => {
    const outrider = getUnitType("outrider")!;
    const cavalry = getUnitType("cavalry")!;
    expect(outrider.cost).toEqual(cavalry.cost);
    expect(outrider.power).toBe(5);
    expect(outrider.trainTicks).toBe(5 * TICKS_PER_SECOND);
  });

  it("refuses until Horse lore is done; cavalry still unlocks with it", () => {
    const s = createGameState({ seed: 1 });
    rich(s);
    expect(unitUnlocked(s, "outrider")).toBe(false);
    expect(tryTrain(s, { typeId: "outrider", count: 1 })).toBe(false);

    s.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 8, y: 8, level: 1, completesAtTick: null });
    keepAt(s, 2);
    expect(tryStartResearch(s, "horse")).toBe(true);
    expect(tryTrain(s, { typeId: "outrider", count: 1 })).toBe(false);

    s.meta.tick += 10_000;
    expect(researchDone(s, "horse")).toBe(true);
    expect(unitUnlocked(s, "cavalry")).toBe(true);
    expect(tryTrain(s, { typeId: "outrider", count: 1 })).toBe(true);
  });
});
