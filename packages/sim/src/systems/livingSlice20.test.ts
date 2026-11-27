import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import {
  academyFeedbackSnapshot,
  researchDetailSnapshot,
  researchProgressDetailSnapshot,
  researchProgressSnapshot,
  studyEffectPreviewSnapshot,
} from "./livingStatus.js";
import {
  RESEARCH,
  cartographyScoutDiscount,
  masonryWallBonus,
  quartermasteryTrainMult,
  researchDuration,
  researchYield,
  surveyingVisionBonus,
  tryStartResearch,
  unitUnlocked,
  type ResearchId,
} from "./research.js";
import { storageCap } from "./storage.js";
import { maxMarches } from "./labor.js";
import { getUnitType } from "../content/units.js";
import {
  ACADEMY_NOTE_BUILDING,
  ACADEMY_NOTE_EARLY,
  ACADEMY_NOTE_IDLE,
  STUDY_EFFECT_CAP,
  STUDY_EFFECTS,
} from "../content/livingRealm.js";

const T0 = 20100;

function fresh(seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = T0;
  ensureBoard(s);
  for (const k of Object.keys(s.flags)) if (k.startsWith("research_")) delete s.flags[k];
  s.buildings = s.buildings.filter((b) => b.typeId !== "academy");
  return s;
}

let n = 0;
function build(s: GameState, typeId: string, done = true, realmId = "player"): GameState["buildings"][number] {
  n++;
  const b = { id: `b20_${n}`, typeId, realmId, level: 1, completesAtTick: done ? null : T0 + 500, x: (n % 6) * 3, y: 22 } as GameState["buildings"][number];
  s.buildings.push(b);
  return b;
}

function open(s: GameState, id: ResearchId, left: number, total: number): void {
  s.flags[`research_${id}_until`] = s.meta.tick + left;
  s.flags[`research_${id}_total`] = total;
}

function know(s: GameState, id: ResearchId): void {
  s.flags[`research_${id}`] = 1;
}

describe("slice 20 switches", () => {
  it("are on by default and map to their flags", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.researchProgress).toBe("living_research_progress");
    expect(LIVING_SWITCH_FLAGS.studyPreview).toBe("living_study_preview");
    expect(LIVING_SWITCH_FLAGS.academyFeedback).toBe("living_academy_feedback");
    const sw = livingSwitches(s);
    expect([sw.researchProgress, sw.studyPreview, sw.academyFeedback]).toEqual([true, true, true]);
  });

  it("false returns null", () => {
    const s = fresh();
    open(s, "husbandry", 100, 400);
    build(s, "academy");
    expect(researchProgressDetailSnapshot(s)).not.toBeNull();
    expect(studyEffectPreviewSnapshot(s, "husbandry")).not.toBeNull();
    expect(academyFeedbackSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "researchProgress", false);
    setLivingSwitch(s, "studyPreview", false);
    setLivingSwitch(s, "academyFeedback", false);
    expect(researchProgressDetailSnapshot(s)).toBeNull();
    expect(studyEffectPreviewSnapshot(s, "husbandry")).toBeNull();
    expect(academyFeedbackSnapshot(s)).toBeNull();
  });
});

describe("researchProgressDetailSnapshot", () => {
  it("is null with nothing being studied", () => {
    const s = fresh();
    expect(researchProgressDetailSnapshot(s)).toBeNull();
    know(s, "husbandry");
    expect(researchProgressDetailSnapshot(s)).toBeNull();
  });

  it("has the shape and matches researchProgressSnapshot.active", () => {
    const s = fresh();
    open(s, "forestry", 750, 3000);
    const d = researchProgressDetailSnapshot(s)!;
    expect(Object.keys(d).sort()).toEqual(["activeId", "name", "percent", "ticksLeft", "totalTicks"]);
    expect(d).toEqual({ activeId: "forestry", name: "Forestry", percent: 75, ticksLeft: 750, totalTicks: 3000 });
    const a = researchProgressSnapshot(s)!.active!;
    expect([d.activeId, d.name, d.ticksLeft, d.totalTicks]).toEqual([a.id, a.name, a.ticksLeft, a.totalTicks]);
    expect(researchDetailSnapshot(s)!.active!.id).toBe(d.activeId);
  });

  it("percent is a floored whole number in 0-100", () => {
    const s = fresh();
    open(s, "husbandry", 2999, 3000);
    expect(researchProgressDetailSnapshot(s)!.percent).toBe(0);
    s.flags.research_husbandry_until = s.meta.tick + 1;
    expect(researchProgressDetailSnapshot(s)!.percent).toBe(99);
    s.flags.research_husbandry_until = s.meta.tick + 2000;
    expect(researchProgressDetailSnapshot(s)!.percent).toBe(33);
    // A stored total shorter than what is left (odd save) clamps to 0, never negative.
    s.flags.research_husbandry_until = s.meta.tick + 5000;
    expect(researchProgressDetailSnapshot(s)!.percent).toBe(0);
  });

  it("falls back to the table length when no total is stored", () => {
    const s = fresh();
    s.flags.research_masonry_until = s.meta.tick + 900;
    const d = researchProgressDetailSnapshot(s)!;
    expect(d.totalTicks).toBe(RESEARCH.masonry.ticks);
    expect(d.percent).toBe(75);
  });

  it("follows a real tryStartResearch and does not write flags", () => {
    const s = fresh();
    build(s, "farm");
    s.resources.food = "1000";
    s.resources.wood = "1000";
    expect(tryStartResearch(s, "husbandry")).toBe(true);
    const before = JSON.stringify(s);
    const d = researchProgressDetailSnapshot(s)!;
    expect(d).toMatchObject({ activeId: "husbandry", percent: 0, ticksLeft: researchDuration(s, "husbandry") });
    s.meta.tick += RESEARCH.husbandry.ticks; // finished: lazily known, not open
    const after = JSON.stringify(s);
    expect(researchProgressDetailSnapshot(s)).toBeNull();
    expect(JSON.stringify(s)).toBe(after);
    expect(before).not.toBe(after);
  });

  it("is deterministic", () => {
    const a = fresh(7);
    const b = fresh(7);
    open(a, "drill", 1234, 3000);
    open(b, "drill", 1234, 3000);
    expect(researchProgressDetailSnapshot(a)).toEqual(researchProgressDetailSnapshot(b));
  });
});

describe("studyEffectPreviewSnapshot", () => {
  it("is null for an unknown id", () => {
    const s = fresh();
    expect(studyEffectPreviewSnapshot(s, "alchemy")).toBeNull();
    expect(studyEffectPreviewSnapshot(s, "toString")).toBeNull();
    expect(studyEffectPreviewSnapshot(s, "")).toBeNull();
  });

  it("covers every study, shape { id, name, effects }, 1 to 3 lines", () => {
    const s = fresh();
    expect(Object.keys(STUDY_EFFECTS).sort()).toEqual(Object.keys(RESEARCH).sort());
    for (const id of Object.keys(RESEARCH) as ResearchId[]) {
      const p = studyEffectPreviewSnapshot(s, id)!;
      expect(Object.keys(p).sort()).toEqual(["effects", "id", "name"]);
      expect(p.id).toBe(id);
      expect(p.name).toBe(RESEARCH[id].name);
      expect(p.effects.length).toBeGreaterThan(0);
      expect(p.effects.length).toBeLessThanOrEqual(STUDY_EFFECT_CAP);
    }
  });

  it("does not depend on what is known or the current state", () => {
    const s = fresh();
    const before = studyEffectPreviewSnapshot(s, "logistics");
    know(s, "logistics");
    expect(studyEffectPreviewSnapshot(s, "logistics")).toEqual(before);
  });

  it("yield lines match researchYield", () => {
    const pct = (res: string, id: ResearchId, prior?: ResearchId) => {
      const s = fresh();
      if (prior) know(s, prior);
      const base = researchYield(s, res);
      know(s, id);
      return `+${Math.round((researchYield(s, res) - base) * 100)}% ${res} from buildings`;
    };
    const s = fresh();
    const has = (id: ResearchId, line: string) => expect(studyEffectPreviewSnapshot(s, id)!.effects).toContain(line);
    has("husbandry", pct("food", "husbandry"));
    has("forestry", pct("wood", "forestry"));
    has("masonry", pct("stone", "masonry"));
    has("logistics", pct("gold", "logistics"));
    has("crop_rotation", pct("food", "crop_rotation", "husbandry"));
    has("timber_framing", pct("wood", "timber_framing", "forestry"));
    has("fortification", pct("stone", "fortification", "masonry"));
    // Studies with no yield line really add no yield.
    for (const id of ["surveying", "fieldcraft", "drill", "screening", "horse", "siege", "supply_trains", "cartography", "quartermastery"] as ResearchId[]) {
      const t = fresh();
      know(t, id);
      for (const res of ["food", "wood", "stone", "gold"]) expect(researchYield(t, res)).toBe(0);
    }
  });

  it("defense, storage, column, vision, scouting and training lines match their helpers", () => {
    const s = fresh();
    const eff = (id: ResearchId) => studyEffectPreviewSnapshot(s, id)!.effects;
    const delta = (id: ResearchId, f: (st: GameState) => number, prior?: ResearchId) => {
      const t = fresh();
      build(t, "barracks");
      build(t, "barracks");
      if (prior) know(t, prior);
      const a = f(t);
      know(t, id);
      return f(t) - a;
    };
    expect(eff("masonry")).toContain(`+${delta("masonry", masonryWallBonus)} defense`);
    expect(eff("fortification")).toContain(`+${delta("fortification", masonryWallBonus, "masonry")} defense`);
    expect(eff("logistics")).toContain(`+${delta("logistics", (t) => storageCap(t, "food"))} storage`);
    expect(eff("supply_trains")).toContain(`+${delta("supply_trains", (t) => storageCap(t, "food"), "logistics")} storage`);
    expect(delta("surveying", surveyingVisionBonus)).toBe(1);
    expect(eff("surveying")).toContain("+1 vision range");
    expect(delta("cartography", surveyingVisionBonus, "surveying")).toBe(1);
    expect(eff("cartography")).toContain("+1 vision range");
    expect(eff("cartography")).toContain(`Scouting costs ${delta("cartography", cartographyScoutDiscount)} gold less`);
    expect(eff("quartermastery")).toContain(`Training costs ${Math.round((1 - quartermasteryTrainMult({ ...fresh(), flags: { research_quartermastery: 1 } } as GameState)) * 100)}% less`);
    // March columns: the study raises the uncapped count by one (the Keep gate may still clamp it).
    expect(eff("logistics")).toContain("+1 march column (Keep limit applies)");
    expect(eff("supply_trains")).toContain("+1 march column (Keep limit applies)");
    const t = fresh();
    const m0 = maxMarches(t);
    know(t, "logistics");
    expect(maxMarches(t)).toBeGreaterThanOrEqual(m0);
  });

  it("unlock lines name exactly the units the study opens", () => {
    const s = fresh();
    for (const id of Object.keys(RESEARCH) as ResearchId[]) {
      const units = [...RESEARCH[id].unlocks].map(String);
      const line = studyEffectPreviewSnapshot(s, id)!.effects.find((e) => e.startsWith("Unlocks "));
      const listed = line ? line.slice("Unlocks ".length).split(", ") : [];
      expect(listed.length).toBe(units.length);
      for (const u of units) {
        expect(listed).toContain(getUnitType(u)!.name);
        const t = fresh();
        if (u !== "ironclad") expect(unitUnlocked(t, u)).toBe(false);
        know(t, id);
        expect(unitUnlocked(t, u)).toBe(true);
      }
    }
  });
});

describe("academyFeedbackSnapshot", () => {
  it("is null with no player academy", () => {
    const s = fresh();
    expect(academyFeedbackSnapshot(s)).toBeNull();
    build(s, "academy", true, "ai_1");
    expect(academyFeedbackSnapshot(s)).toBeNull();
  });

  it("under construction: not built, building note", () => {
    const s = fresh();
    build(s, "academy", false);
    const f = academyFeedbackSnapshot(s)!;
    expect(Object.keys(f).sort()).toEqual(["bonusActive", "built", "note", "staffed"]);
    expect(f).toEqual({ built: false, staffed: false, bonusActive: false, note: ACADEMY_NOTE_BUILDING });
  });

  it("built and idle: bonus on, idle note; bonusActive matches researchDuration", () => {
    const s = fresh();
    build(s, "academy");
    const f = academyFeedbackSnapshot(s)!;
    expect(f).toEqual({ built: true, staffed: false, bonusActive: true, note: ACADEMY_NOTE_IDLE });
    expect(researchDuration(s, "husbandry")).toBe(Math.ceil(RESEARCH.husbandry.ticks * 0.8));
  });

  it("study started before the academy gets the early note; a shortened one gets none", () => {
    const s = fresh();
    build(s, "academy");
    open(s, "husbandry", 1000, RESEARCH.husbandry.ticks);
    expect(academyFeedbackSnapshot(s)!.note).toBe(ACADEMY_NOTE_EARLY);
    s.flags.research_husbandry_total = researchDuration(s, "husbandry");
    expect(academyFeedbackSnapshot(s)!.note).toBeNull();
  });

  it("staffed stays false: the academy takes no citizen job", () => {
    const s = fresh();
    const b = build(s, "academy");
    s.citizens.push({ id: "c20", realmId: "player", job: "scholar", tile: { x: b.x, y: b.y } } as GameState["citizens"][number]);
    expect(academyFeedbackSnapshot(s)!.staffed).toBe(false);
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    build(s, "academy");
    open(s, "drill", 10, 3000);
    const before = JSON.stringify(s);
    const a = academyFeedbackSnapshot(s);
    researchProgressDetailSnapshot(s);
    studyEffectPreviewSnapshot(s, "drill");
    expect(JSON.stringify(s)).toBe(before);
    expect(academyFeedbackSnapshot(s)).toEqual(a);
  });
});
