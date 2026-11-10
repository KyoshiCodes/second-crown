import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import {
  tryStartResearch,
  tryCancelResearch,
  researchDone,
  researchDuration,
  researchTicksLeft,
  unitUnlocked,
  researchYield,
  masonryWallBonus,
  logisticsCapBonus,
  researchKeepReady,
  researchRequires,
  researchTier,
  researchPrereqReady,
  surveyingVisionBonus,
  cartographyScoutDiscount,
  supplyTrainsColumnBonus,
  quartermasteryTrainMult,
  RESEARCH,
} from "./research.js";
import { tryTrain, trainCostMultiplier } from "../actions/train.js";
import { scoutCost } from "./fog.js";
import { D } from "../core/decimal.js";
import { storageCap } from "./storage.js";
import { maxMarches } from "./labor.js";
import { visionRange } from "./fog.js";

function keepAt(s: ReturnType<typeof createGameState>, level: number) {
  const keep = s.buildings.find((b) => b.typeId === "keep" && b.realmId === "player");
  if (keep) {
    keep.level = level;
    keep.completesAtTick = null;
  } else {
    s.buildings.push({
      id: "keep_t",
      typeId: "keep",
      realmId: "player",
      x: 3,
      y: 3,
      level,
      completesAtTick: null,
    });
  }
}

describe("academy research", () => {
  it("blocks cavalry until horse lore finishes behind Keep II", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "200";
    s.resources.food = "200";
    s.resources.wood = "200";
    expect(unitUnlocked(s, "cavalry")).toBe(false);
    expect(tryTrain(s, { typeId: "cavalry", count: 1 })).toBe(false);
    expect(tryStartResearch(s, "horse")).toBe(false);
    s.buildings.push({
      id: "br",
      typeId: "barracks",
      realmId: "player",
      x: 4,
      y: 4,
      level: 1,
      completesAtTick: null,
    });
    expect(researchKeepReady(s, "horse")).toBe(false);
    expect(tryStartResearch(s, "horse")).toBe(false);
    keepAt(s, 2);
    expect(tryStartResearch(s, "horse")).toBe(true);
    s.meta.tick = 300;
    expect(researchDone(s, "horse")).toBe(true);
    expect(tryTrain(s, { typeId: "cavalry", count: 1 })).toBe(true);
  });

  it("blocks siege engines until siege craft finishes behind Keep III", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "200";
    s.resources.wood = "200";
    s.resources.stone = "200";
    expect(unitUnlocked(s, "siege")).toBe(false);
    s.buildings.push({
      id: "sw",
      typeId: "siege_workshop",
      realmId: "player",
      x: 5,
      y: 5,
      level: 1,
      completesAtTick: null,
    });
    keepAt(s, 2);
    expect(tryStartResearch(s, "siege")).toBe(false);
    keepAt(s, 3);
    expect(tryStartResearch(s, "siege")).toBe(true);
    s.meta.tick = 400;
    expect(researchDone(s, "siege")).toBe(true);
    expect(unitUnlocked(s, "siege")).toBe(true);
  });

  it("a finished academy also opens horse lore once Keep II stands", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "200";
    s.resources.wood = "200";
    expect(tryStartResearch(s, "horse")).toBe(false);
    s.buildings.push({
      id: "ac",
      typeId: "academy",
      realmId: "player",
      x: 6,
      y: 6,
      level: 1,
      completesAtTick: null,
    });
    keepAt(s, 2);
    expect(tryStartResearch(s, "horse")).toBe(true);
  });

  it("cancels a study and refunds the unused fraction (academy-paced duration)", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "80";
    s.resources.wood = "48";
    keepAt(s, 2);
    s.buildings.push({
      id: "ac",
      typeId: "academy",
      realmId: "player",
      x: 6,
      y: 6,
      level: 1,
      completesAtTick: null,
    });
    expect(tryStartResearch(s, "horse")).toBe(true);
    expect(s.resources.gold).toBe("40");
    // Academy present: 240 ticks * 0.8 = 192.
    s.meta.tick = 120;
    expect(researchTicksLeft(s, "horse")).toBe(72);
    expect(tryCancelResearch(s, "horse")).toBe(true);
    expect(researchTicksLeft(s, "horse")).toBe(0);
    expect(researchDone(s, "horse")).toBe(false);
    expect(D(s.resources.gold).eq(55)).toBe(true);
    expect(D(s.resources.wood).eq(33)).toBe(true);
    expect(tryCancelResearch(s, "horse")).toBe(false);
    expect(tryStartResearch(s, "horse")).toBe(true);
  });

  it("husbandry only lifts food, masonry lifts walls, logistics lifts cap and columns", () => {
    const s = createGameState({ seed: 1 });
    expect(researchYield(s, "food")).toBe(0);
    expect(masonryWallBonus(s)).toBe(0);
    const cap = storageCap(s, "wood");
    const slots = maxMarches(s);
    s.flags.research_husbandry = 1;
    s.flags.research_masonry = 1;
    s.flags.research_logistics = 1;
    expect(researchYield(s, "food")).toBe(0.12);
    expect(researchYield(s, "wood")).toBe(0);
    expect(masonryWallBonus(s)).toBe(16);
    expect(logisticsCapBonus(s)).toBe(50);
    expect(storageCap(s, "wood")).toBe(cap + 50);
    expect(maxMarches(s)).toBe(slots + 1);
  });

  it("a finished academy shortens a new husbandry study by 20%, but not one already in progress", () => {
    const withoutAcademy = createGameState({ seed: 1 });
    withoutAcademy.resources.food = "40";
    withoutAcademy.resources.wood = "24";
    withoutAcademy.buildings.push({
      id: "farm",
      typeId: "farm",
      realmId: "player",
      x: 6,
      y: 6,
      level: 1,
      completesAtTick: null,
    });
    expect(tryStartResearch(withoutAcademy, "husbandry")).toBe(true);
    expect(researchTicksLeft(withoutAcademy, "husbandry")).toBe(180);

    const withAcademy = createGameState({ seed: 1 });
    withAcademy.resources.food = "40";
    withAcademy.resources.wood = "24";
    withAcademy.buildings.push({
      id: "ac",
      typeId: "academy",
      realmId: "player",
      x: 6,
      y: 6,
      level: 1,
      completesAtTick: null,
    });
    expect(tryStartResearch(withAcademy, "husbandry")).toBe(true);
    // 180 ticks * 0.8 = 144, ceil'd (already whole here).
    expect(researchTicksLeft(withAcademy, "husbandry")).toBe(144);

    // A study already underway keeps its original done tick even if an Academy
    // finishes construction afterward - the discount only applies at start time.
    withoutAcademy.buildings.push({
      id: "ac2",
      typeId: "academy",
      realmId: "player",
      x: 7,
      y: 7,
      level: 1,
      completesAtTick: null,
    });
    expect(researchTicksLeft(withoutAcademy, "husbandry")).toBe(180);
  });

  it("researchDuration reports the full tick length, or 20% less once an Academy stands", () => {
    const s = createGameState({ seed: 1 });
    expect(researchDuration(s, "husbandry")).toBe(180);
    expect(researchDuration(s, "siege")).toBe(360);
    s.buildings.push({
      id: "ac",
      typeId: "academy",
      realmId: "player",
      x: 6,
      y: 6,
      level: 1,
      completesAtTick: null,
    });
    // 180 * 0.8 = 144, exact.
    expect(researchDuration(s, "husbandry")).toBe(144);
    // 360 * 0.8 = 288, exact - Academy discounts every study, even ones it doesn't gate.
    expect(researchDuration(s, "siege")).toBe(288);
  });

  it("surveying needs Keep II and stretches vision", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "40";
    s.resources.wood = "40";
    s.buildings.push({
      id: "ac",
      typeId: "academy",
      realmId: "player",
      x: 6,
      y: 6,
      level: 1,
      completesAtTick: null,
    });
    const base = visionRange(s);
    expect(tryStartResearch(s, "surveying")).toBe(false);
    keepAt(s, 2);
    expect(tryStartResearch(s, "surveying")).toBe(true);
    s.meta.tick = 250;
    expect(researchDone(s, "surveying")).toBe(true);
    expect(visionRange(s)).toBe(base + 1);
  });

  describe("tier II studies", () => {
    const TIER_TWO = [
      ["crop_rotation", "husbandry"],
      ["timber_framing", "forestry"],
      ["fortification", "masonry"],
      ["supply_trains", "logistics"],
      ["cartography", "surveying"],
      ["quartermastery", "drill"],
    ] as const;

    function academyRealm(keep: number) {
      const s = createGameState({ seed: 1 });
      for (const res of ["food", "wood", "stone", "gold"]) s.resources[res] = "100";
      s.buildings.push({
        id: "ac",
        typeId: "academy",
        realmId: "player",
        x: 6,
        y: 6,
        level: 1,
        completesAtTick: null,
      });
      keepAt(s, keep);
      return s;
    }

    it("each tier II study names a tier I study and is gated behind Keep II or III", () => {
      for (const [id, parent] of TIER_TWO) {
        expect(researchRequires(id)).toBe(parent);
        expect(researchTier(id)).toBe(2);
        expect(researchTier(parent)).toBe(1);
        expect(researchRequires(parent)).toBe(null);
        expect(RESEARCH[id].keepMin).toBeGreaterThanOrEqual(2);
      }
      expect(Object.keys(RESEARCH).filter((id) => researchTier(id) === 2)).toHaveLength(TIER_TWO.length);
    });

    it("will not start until the tier I study is known", () => {
      for (const [id, parent] of TIER_TWO) {
        const s = academyRealm(3);
        expect(researchPrereqReady(s, id)).toBe(false);
        expect(tryStartResearch(s, id)).toBe(false);
        expect(s.resources.gold).toBe("100");
        s.flags[`research_${parent}`] = 1;
        expect(researchPrereqReady(s, id)).toBe(true);
        expect(tryStartResearch(s, id)).toBe(true);
        s.meta.tick = 1000;
        expect(researchDone(s, id)).toBe(true);
      }
    });

    it("still needs its Keep level once the tier I study is known", () => {
      const s = academyRealm(2);
      s.flags.research_masonry = 1;
      expect(tryStartResearch(s, "fortification")).toBe(false);
      keepAt(s, 3);
      expect(tryStartResearch(s, "fortification")).toBe(true);
    });

    it("cancel refunds the unused fraction and frees the lectern", () => {
      const s = academyRealm(2);
      s.flags.research_husbandry = 1;
      expect(tryStartResearch(s, "crop_rotation")).toBe(true);
      expect(s.resources.food).toBe("40");
      // Academy pace: 280 * 0.8 = 224 ticks. Half way through.
      s.meta.tick = 112;
      expect(tryCancelResearch(s, "crop_rotation")).toBe(true);
      expect(D(s.resources.food).eq(70)).toBe(true);
      expect(researchDone(s, "crop_rotation")).toBe(false);
    });

    it("crop rotation, timber framing and fortification stack on the tier I yield", () => {
      const s = createGameState({ seed: 1 });
      s.flags.research_husbandry = 1;
      s.flags.research_forestry = 1;
      s.flags.research_masonry = 1;
      expect(researchYield(s, "food")).toBe(0.12);
      s.flags.research_crop_rotation = 1;
      s.flags.research_timber_framing = 1;
      s.flags.research_fortification = 1;
      expect(researchYield(s, "food")).toBeCloseTo(0.22);
      expect(researchYield(s, "wood")).toBeCloseTo(0.22);
      expect(researchYield(s, "stone")).toBeCloseTo(0.22);
      expect(researchYield(s, "gold")).toBe(0);
      expect(masonryWallBonus(s)).toBe(40);
    });

    it("cartography adds a tile of vision and takes 4 gold off scouting", () => {
      const s = createGameState({ seed: 1 });
      s.flags.research_surveying = 1;
      const range = visionRange(s);
      const fee = scoutCost(s);
      expect(cartographyScoutDiscount(s)).toBe(0);
      s.flags.research_cartography = 1;
      expect(surveyingVisionBonus(s)).toBe(2);
      expect(visionRange(s)).toBe(range + 1);
      expect(scoutCost(s)).toBe(fee - 4);
    });

    it("supply trains adds 100 warehouse space and a column the Keep still limits", () => {
      const s = createGameState({ seed: 1 });
      s.flags.research_logistics = 1;
      const cap = storageCap(s, "stone");
      const slots = maxMarches(s);
      expect(supplyTrainsColumnBonus(s)).toBe(0);
      s.flags.research_supply_trains = 1;
      expect(supplyTrainsColumnBonus(s)).toBe(1);
      expect(storageCap(s, "stone")).toBe(cap + 100);
      expect(maxMarches(s)).toBeGreaterThanOrEqual(slots);
      expect(maxMarches(s)).toBeLessThanOrEqual(slots + 1);
    });

    it("supply trains space counts from the finish tick, with no read needed first", () => {
      const s = createGameState({ seed: 1 });
      const cap = storageCap(s, "food");
      s.flags.research_supply_trains_until = 50;
      s.meta.tick = 49;
      expect(storageCap(s, "food")).toBe(cap);
      s.meta.tick = 50;
      expect(storageCap(s, "food")).toBe(cap + 100);
    });

    it("quartermastery takes 8% off training costs", () => {
      const s = createGameState({ seed: 1 });
      const before = trainCostMultiplier(s, "militia");
      expect(quartermasteryTrainMult(s)).toBe(1);
      s.flags.research_quartermastery = 1;
      expect(quartermasteryTrainMult(s)).toBe(0.92);
      expect(trainCostMultiplier(s, "militia")).toBeCloseTo(before * 0.92);
    });
  });
});
