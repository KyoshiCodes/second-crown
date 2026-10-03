import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { setPlayerCulture, playerCultureId, cultureOfRealm } from "./culture.js";
import { visionRange } from "./fog.js";
import { tryStartResearch, researchDone, unitUnlocked } from "./research.js";
import { tryTrain, trainCostMultiplier } from "../actions/train.js";
import { getUnitType } from "../content/units.js";
import { TICKS_PER_SECOND } from "@second-crown/shared";

function withKeep(culture: string | null, keep: "none" | "building" | "done") {
  const s = createGameState({ seed: 1 });
  if (culture) setPlayerCulture(s, culture);
  if (keep !== "none") {
    s.buildings.push({ id: "k", typeId: "keep", realmId: "player", x: 8, y: 8, level: 1, completesAtTick: keep === "done" ? null : 999_999 });
  }
  return s;
}

function rich(s: ReturnType<typeof createGameState>) {
  for (const r of ["food", "wood", "stone", "gold"]) s.resources[r] = "10000";
}

describe("peak culture", () => {
  it("existing saves default to western; a new game can pick peak", () => {
    const s = createGameState({ seed: 1 });
    expect(playerCultureId(s)).toBe("western");
    expect(setPlayerCulture(s, "peak")).toBe(true);
    expect(playerCultureId(s)).toBe("peak");
  });

  it("a peak crown sees 1 farther than western once the keep is finished", () => {
    expect(visionRange(withKeep("peak", "none"))).toBe(visionRange(withKeep(null, "none")));
    expect(visionRange(withKeep("peak", "building"))).toBe(visionRange(withKeep(null, "building")));
    expect(visionRange(withKeep("peak", "done")) - visionRange(withKeep(null, "done"))).toBe(1);
  });

  it("npc crowns are never seeded peak", () => {
    const s = createGameState({ seed: 3 });
    for (const id of ["a", "bb", "ccc", "dddd", "eeeee", "ffffff", "ggggggg"]) {
      expect(cultureOfRealm(s, id)).not.toBe("peak");
    }
  });
});

describe("lancer", () => {
  it("costs the same as a knight, power 6, drills in 6s", () => {
    const lancer = getUnitType("lancer")!;
    const knight = getUnitType("knight")!;
    expect(lancer.cost).toEqual(knight.cost);
    expect(lancer.power).toBe(6);
    expect(lancer.trainTicks).toBe(6 * TICKS_PER_SECOND);
    const s = createGameState({ seed: 1 });
    expect(trainCostMultiplier(s, "lancer")).toBe(trainCostMultiplier(s, "knight"));
    s.buildings.push({ id: "st", typeId: "stables", realmId: "player", x: 7, y: 7, level: 1, completesAtTick: null });
    expect(trainCostMultiplier(s, "lancer")).toBe(trainCostMultiplier(s, "knight"));
  });

  it("refuses until Horse lore is done; knight stays", () => {
    const s = createGameState({ seed: 1 });
    rich(s);
    expect(unitUnlocked(s, "lancer")).toBe(false);
    expect(tryTrain(s, { typeId: "lancer", count: 1 })).toBe(false);

    s.buildings.push({ id: "k", typeId: "keep", realmId: "player", x: 8, y: 8, level: 2, completesAtTick: null });
    s.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 9, y: 8, level: 1, completesAtTick: null });
    expect(tryStartResearch(s, "horse")).toBe(true);
    expect(tryTrain(s, { typeId: "lancer", count: 1 })).toBe(false);

    s.meta.tick += 10_000;
    expect(researchDone(s, "horse")).toBe(true);
    expect(unitUnlocked(s, "knight")).toBe(true);
    expect(tryTrain(s, { typeId: "lancer", count: 1 })).toBe(true);
  });
});
