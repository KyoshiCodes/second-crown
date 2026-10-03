import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { setPlayerCulture, playerCultureId, cultureOfRealm } from "./culture.js";
import { housingCap, workPlotCap } from "./housing.js";
import { tryStartResearch, researchDone, unitUnlocked } from "./research.js";
import { tryTrain, trainCostMultiplier } from "../actions/train.js";
import { getUnitType } from "../content/units.js";
import { TICKS_PER_SECOND } from "@second-crown/shared";

function withCottages(culture: string | null, n: number) {
  const s = createGameState({ seed: 1 });
  if (culture) setPlayerCulture(s, culture);
  for (let i = 0; i < n; i++) {
    s.buildings.push({ id: `c${i}`, typeId: "cottage", realmId: "player", x: 9 + i, y: 9, level: 1, completesAtTick: null });
  }
  return s;
}

function rich(s: ReturnType<typeof createGameState>) {
  for (const r of ["food", "wood", "stone", "gold"]) s.resources[r] = "10000";
}

describe("fen culture", () => {
  it("existing saves default to western; a new game can pick fen", () => {
    const s = createGameState({ seed: 1 });
    expect(playerCultureId(s)).toBe("western");
    expect(setPlayerCulture(s, "fen")).toBe(true);
    expect(playerCultureId(s)).toBe("fen");
  });

  it("a fen cottage holds 1 citizen above a western cottage", () => {
    const westernBase = housingCap(withCottages(null, 0));
    const fenBase = housingCap(withCottages("fen", 0));
    expect(fenBase).toBe(westernBase);
    expect(housingCap(withCottages("fen", 1)) - housingCap(withCottages(null, 1))).toBe(1);
    expect(housingCap(withCottages("fen", 3)) - housingCap(withCottages(null, 3))).toBe(3);
  });

  it("fen work plots match western", () => {
    expect(workPlotCap(withCottages("fen", 2))).toBe(workPlotCap(withCottages(null, 2)));
  });

  it("npc crowns are never seeded fen", () => {
    const s = createGameState({ seed: 3 });
    for (const id of ["a", "bb", "ccc", "dddd", "eeeee", "ffffff", "ggggggg"]) {
      expect(cultureOfRealm(s, id)).not.toBe("fen");
    }
  });
});

describe("warden", () => {
  it("costs the same as a skirmisher, power 3, drills in 3s", () => {
    const warden = getUnitType("warden")!;
    const skirmisher = getUnitType("skirmisher")!;
    expect(warden.cost).toEqual(skirmisher.cost);
    expect(warden.power).toBe(3);
    expect(warden.trainTicks).toBe(3 * TICKS_PER_SECOND);
    const s = createGameState({ seed: 1 });
    expect(trainCostMultiplier(s, "warden")).toBe(trainCostMultiplier(s, "skirmisher"));
  });

  it("refuses until Screening is done; skirmisher stays open", () => {
    const s = createGameState({ seed: 1 });
    rich(s);
    expect(unitUnlocked(s, "skirmisher")).toBe(true);
    expect(unitUnlocked(s, "warden")).toBe(false);
    expect(tryTrain(s, { typeId: "warden", count: 1 })).toBe(false);

    s.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 8, y: 8, level: 1, completesAtTick: null });
    expect(tryStartResearch(s, "screening")).toBe(true);
    expect(tryTrain(s, { typeId: "warden", count: 1 })).toBe(false);

    s.meta.tick += 10_000;
    expect(researchDone(s, "screening")).toBe(true);
    expect(tryTrain(s, { typeId: "warden", count: 1 })).toBe(true);
  });
});
