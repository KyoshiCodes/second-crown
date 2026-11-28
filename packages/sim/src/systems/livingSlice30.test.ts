import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { BOARD_H, BOARD_W } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard, seedBoard } from "./board.js";
import { serializeState as serialize, deserializeState as deserialize } from "../save/serialize.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import { economyGain, workStationBonus } from "./economy.js";
import { buildingVarietySnapshot, workStationBenefitSnapshot } from "./livingStatus.js";
import { neighbors } from "./board.js";
import {
  BUILDING_VARIETY,
  BUILDING_VARIETY_DEFAULT,
  BUILDING_VARIETY_NOTE_BUILDING,
  BUILDING_VARIETY_NOTE_GROWING,
  BUILDING_VARIETY_NOTE_TOP,
  BUILDING_VARIETY_NOTE_UPGRADING,
  BUILDING_VARIETY_TIER_DETAIL,
  WORK_STATION_BENEFIT_LABEL,
  WORK_STATION_BENEFIT_MULT,
  WORK_STATION_BENEFIT_NOTE_ACTIVE,
  WORK_STATION_BENEFIT_NOTE_BUILDING,
  WORK_STATION_BENEFIT_NOTE_EMPTY,
  WORK_STATION_BENEFIT_NOTE_UPGRADING,
} from "../content/livingRealm.js";

function fresh(seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = 20100;
  ensureBoard(s);
  s.citizens = [];
  s.flags.upgrades_json = [];
  return s;
}

function addBuilding(s: GameState, typeId: string, opts: Partial<GameState["buildings"][number]> = {}) {
  const b = {
    id: `b_${typeId}_${s.buildings.length}`,
    typeId,
    realmId: "player",
    x: 3,
    y: 3,
    level: 1,
    completesAtTick: null,
    ...opts,
  } as GameState["buildings"][number];
  s.buildings.push(b);
  return b;
}

function upgrading(s: GameState, buildingId: string) {
  s.flags.upgrades_json = [{ id: "u1", buildingId, fromLevel: 1, doneTick: s.meta.tick + 50, ticks: 50, paid: {} }];
}

function staff(s: GameState, job: string, x = 3, y = 3, id = "c1") {
  s.citizens.push({ id, realmId: "player", job, tile: { x, y } } as GameState["citizens"][number]);
}

describe("living realm slice 30: board 16x10", () => {
  it("seeds 160 tiles with every coordinate once", () => {
    expect([BOARD_W, BOARD_H]).toEqual([16, 10]);
    const b = seedBoard(7);
    expect(b.width).toBe(16);
    expect(b.height).toBe(10);
    expect(b.provinces.length).toBe(160);
    expect(new Set(b.provinces.map((p) => p.id)).size).toBe(160);
    expect(b.provinces.some((p) => p.x === 15 && p.y === 9)).toBe(true);
    expect(b.provinces.some((p) => p.x === 16 || p.y === 10)).toBe(false);
  });

  it("is deterministic for a seed", () => {
    expect(JSON.stringify(seedBoard(42))).toBe(JSON.stringify(seedBoard(42)));
  });

  it("far corner has two neighbors; new edge tiles link in", () => {
    const s = fresh();
    expect(neighbors(s, "p_15_9").map((p) => p.id).sort()).toEqual(["p_14_9", "p_15_8"]);
    expect(neighbors(s, "p_12_5").length).toBe(4);
  });

  it("migrates a 12x8 save: old tiles kept, new tiles added, home kept", () => {
    const s = fresh(5);
    const old = s.board.provinces.filter((p) => p.x < 12 && p.y < 8);
    const marker = old.find((p) => p.x === 4 && p.y === 4)!;
    marker.terrain = "peak";
    marker.node = "ruins";
    s.board.width = 12;
    s.board.height = 8;
    s.board.provinces = old;
    const before = s.board.homeProvinceId;
    const loaded = deserialize(serialize(s));
    expect(loaded.board.width).toBe(16);
    expect(loaded.board.height).toBe(10);
    expect(loaded.board.provinces.length).toBe(160);
    expect(loaded.board.homeProvinceId).toBe(before);
    const kept = loaded.board.provinces.find((p) => p.id === "p_4_4")!;
    expect(kept.terrain).toBe("peak");
    expect(kept.node).toBe("ruins");
    expect(loaded.board.provinces.some((p) => p.id === "p_15_9")).toBe(true);
  });

  it("board size is not flagged", () => {
    expect(Object.values(LIVING_SWITCH_FLAGS).some((f) => /board_size/.test(f))).toBe(false);
  });
});

describe("living realm slice 30: building variety", () => {
  it("unknown building id gives null", () => {
    expect(buildingVarietySnapshot(fresh(), "nope")).toBeNull();
  });

  it("Tier I farm: shape", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    expect(buildingVarietySnapshot(s, b.id)).toEqual({
      variety: BUILDING_VARIETY.farm,
      tierDetail: null,
      note: BUILDING_VARIETY_NOTE_GROWING,
    });
  });

  it("tier detail by level; top tier note at 5", () => {
    const s = fresh();
    const b3 = addBuilding(s, "quarry", { level: 3 });
    expect(buildingVarietySnapshot(s, b3.id)).toEqual({
      variety: "Stone cut",
      tierDetail: BUILDING_VARIETY_TIER_DETAIL[3],
      note: BUILDING_VARIETY_NOTE_GROWING,
    });
    const b5 = addBuilding(s, "keep", { level: 9 });
    expect(buildingVarietySnapshot(s, b5.id)).toEqual({
      variety: "Seat of rule",
      tierDetail: BUILDING_VARIETY_TIER_DETAIL[5],
      note: BUILDING_VARIETY_NOTE_TOP,
    });
  });

  it("under construction: no tier detail", () => {
    const s = fresh();
    const b = addBuilding(s, "market", { level: 3, completesAtTick: s.meta.tick + 10 });
    expect(buildingVarietySnapshot(s, b.id)).toEqual({ variety: "Trade hall", tierDetail: null, note: BUILDING_VARIETY_NOTE_BUILDING });
  });

  it("upgrading keeps tier detail", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { level: 2 });
    upgrading(s, b.id);
    expect(buildingVarietySnapshot(s, b.id)).toEqual({
      variety: "Farmstead",
      tierDetail: BUILDING_VARIETY_TIER_DETAIL[2],
      note: BUILDING_VARIETY_NOTE_UPGRADING,
    });
  });

  it("unlisted type falls back", () => {
    const s = fresh();
    const b = addBuilding(s, "mystery_hut");
    expect(buildingVarietySnapshot(s, b.id)!.variety).toBe(BUILDING_VARIETY_DEFAULT);
  });

  it("every shipped building type has a variety label", () => {
    for (const id of ["farm", "cottage", "lumber_camp", "quarry", "gold_mine", "granary", "sawmill", "mason", "market", "mint", "barracks", "stables", "archery_range", "academy", "siege_workshop", "watchtower", "chapel", "infirmary", "walls", "gate", "keep"]) {
      expect(typeof BUILDING_VARIETY[id]).toBe("string");
    }
  });

  it("flag off gives null", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    setLivingSwitch(s, "buildingVariety", false);
    expect(livingSwitches(s).buildingVariety).toBe(false);
    expect(s.flags[LIVING_SWITCH_FLAGS.buildingVariety]).toBe(false);
    expect(LIVING_SWITCH_FLAGS.buildingVariety).toBe("living_building_variety");
    expect(buildingVarietySnapshot(s, b.id)).toBeNull();
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { level: 4 });
    const before = JSON.stringify(s);
    expect(buildingVarietySnapshot(s, b.id)).toEqual(buildingVarietySnapshot(s, b.id));
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("living realm slice 30: work station benefit", () => {
  it("unknown id or no station gives null", () => {
    const s = fresh();
    expect(workStationBenefitSnapshot(s, "nope")).toBeNull();
    const c = addBuilding(s, "cottage");
    expect(workStationBenefitSnapshot(s, c.id)).toBeNull();
  });

  it("empty station: inactive", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    expect(workStationBenefitSnapshot(s, b.id)).toEqual({ benefit: WORK_STATION_BENEFIT_LABEL, active: false, note: WORK_STATION_BENEFIT_NOTE_EMPTY });
    expect(workStationBonus(s, b)).toBe(1);
  });

  it("staffed station: active, +5%", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    staff(s, "farmer");
    expect(workStationBenefitSnapshot(s, b.id)).toEqual({ benefit: WORK_STATION_BENEFIT_LABEL, active: true, note: WORK_STATION_BENEFIT_NOTE_ACTIVE });
    expect(workStationBonus(s, b)).toBe(WORK_STATION_BENEFIT_MULT);
    expect(WORK_STATION_BENEFIT_MULT).toBe(1.05);
  });

  it("one step, not per worker", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    staff(s, "farmer", 3, 3, "c1");
    staff(s, "farmer", 3, 3, "c2");
    expect(workStationBonus(s, b)).toBe(1.05);
  });

  it("under construction or upgrading: inactive even with a worker", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { completesAtTick: s.meta.tick + 10 });
    staff(s, "farmer");
    expect(workStationBenefitSnapshot(s, b.id)).toEqual({ benefit: WORK_STATION_BENEFIT_LABEL, active: false, note: WORK_STATION_BENEFIT_NOTE_BUILDING });
    b.completesAtTick = null;
    upgrading(s, b.id);
    expect(workStationBenefitSnapshot(s, b.id)).toEqual({ benefit: WORK_STATION_BENEFIT_LABEL, active: false, note: WORK_STATION_BENEFIT_NOTE_UPGRADING });
    expect(workStationBonus(s, b)).toBe(1);
  });

  it("economy: a staffed farm makes more food, at most 5% more (flat culture food is not multiplied)", () => {
    const on = fresh();
    addBuilding(on, "farm");
    staff(on, "farmer");
    const off = fresh();
    addBuilding(off, "farm");
    staff(off, "farmer");
    setLivingSwitch(off, "workStationBenefit", false);
    const a = economyGain(on, 1000, false).food;
    const b = economyGain(off, 1000, false).food;
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    const ratio = a.div(b).toNumber();
    expect(ratio).toBeGreaterThan(1.03);
    expect(ratio).toBeLessThanOrEqual(1.05 + 1e-12);
    expect(economyGain(on, 1000, false).food.toString()).toBe(a.toString());
  });

  it("economy: an unstaffed farm is unchanged by the flag", () => {
    const on = fresh();
    addBuilding(on, "farm");
    const off = fresh();
    addBuilding(off, "farm");
    setLivingSwitch(off, "workStationBenefit", false);
    expect(economyGain(on, 1000, false).food.toString()).toBe(economyGain(off, 1000, false).food.toString());
  });

  it("flag off: null and no bonus", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    staff(s, "farmer");
    setLivingSwitch(s, "workStationBenefit", false);
    expect(LIVING_SWITCH_FLAGS.workStationBenefit).toBe("living_work_station_benefit");
    expect(workStationBenefitSnapshot(s, b.id)).toBeNull();
    expect(workStationBonus(s, b)).toBe(1);
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    staff(s, "farmer");
    const before = JSON.stringify(s);
    expect(workStationBenefitSnapshot(s, b.id)).toEqual(workStationBenefitSnapshot(s, b.id));
    expect(JSON.stringify(s)).toBe(before);
  });
});
