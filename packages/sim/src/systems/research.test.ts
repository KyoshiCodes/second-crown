import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import {
  tryStartResearch,
  tryCancelResearch,
  researchDone,
  researchTicksLeft,
  unitUnlocked,
  researchYield,
  masonryWallBonus,
  logisticsCapBonus,
  researchKeepReady,
} from "./research.js";
import { tryTrain } from "../actions/train.js";
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
});
