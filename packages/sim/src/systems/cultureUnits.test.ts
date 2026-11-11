import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { setPlayerCulture } from "./culture.js";
import { CULTURES } from "../content/cultures.js";
import { getUnitType, listUnitTypes } from "../content/units.js";
import { unitUnlocked } from "./research.js";
import { tryTrain, canAffordTrain } from "../actions/train.js";
import { listTraining, tryCancelTraining } from "./training.js";
import {
  CULTURE_UNITS,
  cultureKitId,
  cultureUnitForKit,
  cultureUnitGate,
  isCultureUnit,
  listRosterUnitTypes,
  playerCultureKit,
  playerCultureUnitId,
  unitInRoster,
} from "./cultureUnits.js";

function game(culture?: string) {
  const s = createGameState({ seed: 1 });
  if (culture) setPlayerCulture(s, culture);
  for (const r of ["food", "wood", "stone", "gold"]) s.resources[r] = "10000";
  return s;
}

const KIT_UNITS: Array<[culture: string, kit: string, unit: string]> = [
  ["western", "western", "halberdier"],
  ["woodland", "cedar", "cedar_stalker"],
  ["desert", "sand", "dune_lancer"],
  ["steppe", "steppe", "horse_archer"],
  ["tide", "islands", "reef_raider"],
];

describe("culture kits", () => {
  it("maps each culture to its kit; western offshoots and unknown ids build as western", () => {
    for (const [culture, kit] of KIT_UNITS) expect(cultureKitId(culture)).toBe(kit);
    for (const id of ["mist", "glen", "salt", "fen", "peak", "nonsense", undefined]) {
      expect(cultureKitId(id)).toBe("western");
    }
  });

  it("every culture in the picker resolves to a kit with a unit", () => {
    for (const c of CULTURES) {
      const unit = cultureUnitForKit(cultureKitId(c.id));
      expect(getUnitType(unit)).toBeDefined();
    }
  });

  it("a new game is western kit", () => {
    expect(playerCultureKit(game())).toBe("western");
    expect(playerCultureUnitId(game())).toBe("halberdier");
  });
});

describe("culture unit table", () => {
  it("has six units, each defined once with a kit or a study, never both", () => {
    expect(CULTURE_UNITS.map((g) => g.origin)).toEqual(["Western", "Cedar", "Sand", "Steppe", "Islands", "Iron March"]);
    expect(new Set(CULTURE_UNITS.map((g) => g.unitId)).size).toBe(6);
    for (const g of CULTURE_UNITS) {
      const def = getUnitType(g.unitId)!;
      expect(def).toBeDefined();
      expect(def.power).toBeGreaterThan(0);
      expect(def.trainTicks).toBeGreaterThan(0);
      expect(Object.keys(def.cost).length).toBeGreaterThan(0);
      expect(Boolean(g.kit) !== Boolean(g.research)).toBe(true);
    }
  });

  it("knows a culture unit from a base unit", () => {
    expect(isCultureUnit("ironclad")).toBe(true);
    expect(isCultureUnit("militia")).toBe(false);
    expect(cultureUnitGate("spearman")).toBeUndefined();
  });
});

describe("kit unit unlocks", () => {
  it.each(KIT_UNITS)("%s opens only its own kit unit (%s kit: %s)", (culture, _kit, unit) => {
    const s = game(culture);
    expect(playerCultureUnitId(s)).toBe(unit);
    expect(unitUnlocked(s, unit)).toBe(true);
    for (const [, , other] of KIT_UNITS) {
      if (other === unit) continue;
      expect(unitUnlocked(s, other)).toBe(false);
      expect(canAffordTrain(s, other, 1)).toBe(false);
      expect(tryTrain(s, { typeId: other, count: 1 })).toBe(false);
    }
  });

  it("a western offshoot trains the halberdier", () => {
    const s = game("mist");
    expect(tryTrain(s, { typeId: "halberdier", count: 1 })).toBe(true);
  });

  it("trains and cancels through the normal barracks queue", () => {
    const s = game("steppe");
    // Stay under the warehouse cap so the refund is not clipped.
    for (const r of ["food", "wood", "gold"]) s.resources[r] = "100";
    const before = s.resources.food;
    expect(tryTrain(s, { typeId: "horse_archer", count: 2 })).toBe(true);
    const job = listTraining(s, "player")[0];
    expect(job.typeId).toBe("horse_archer");
    expect(job.count).toBe(2);
    expect(s.resources.food).not.toBe(before);
    expect(tryCancelTraining(s, job.id)).toBe(true);
    expect(listTraining(s, "player").length).toBe(0);
    expect(s.resources.food).toBe(before);
  });

  it("changing culture closes the old kit unit and opens the new one", () => {
    const s = game("desert");
    expect(unitUnlocked(s, "dune_lancer")).toBe(true);
    setPlayerCulture(s, "tide");
    expect(unitUnlocked(s, "dune_lancer")).toBe(false);
    expect(unitUnlocked(s, "reef_raider")).toBe(true);
  });
});

describe("ironclad", () => {
  it("is closed to every culture until Fortification is done, then open to all", () => {
    for (const c of CULTURES) {
      const s = game(c.id);
      expect(unitUnlocked(s, "ironclad")).toBe(false);
      expect(tryTrain(s, { typeId: "ironclad", count: 1 })).toBe(false);
      s.flags.research_fortification = 1;
      expect(unitUnlocked(s, "ironclad")).toBe(true);
      expect(tryTrain(s, { typeId: "ironclad", count: 1 })).toBe(true);
    }
  });
});

describe("roster", () => {
  it("lists the base roster, this crown's kit unit and the ironclad, and no other kit unit", () => {
    const base = listUnitTypes().filter((u) => !isCultureUnit(u.id)).map((u) => u.id);
    for (const [culture, , unit] of KIT_UNITS) {
      const s = game(culture);
      const ids = listRosterUnitTypes(s).map((u) => u.id);
      expect(ids).toEqual([...base, unit, "ironclad"]);
      expect(unitInRoster(s, unit)).toBe(true);
      expect(unitInRoster(s, "ironclad")).toBe(true);
      expect(unitInRoster(s, "militia")).toBe(true);
    }
    expect(unitInRoster(game("western"), "reef_raider")).toBe(false);
  });

  it("leaves the base roster's gates alone", () => {
    const s = game();
    expect(unitUnlocked(s, "militia")).toBe(true);
    expect(unitUnlocked(s, "archer")).toBe(true);
    expect(unitUnlocked(s, "ranger")).toBe(false);
    expect(unitUnlocked(s, "siege")).toBe(false);
  });
});
