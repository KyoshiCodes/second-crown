import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import { economyGain, workStationBonus, workStationDepthBonus } from "./economy.js";
import { environmentSnapshot, extraBuildingSnapshot, workStationDepthSnapshot, workStationBenefitSnapshot } from "./livingStatus.js";
import { weatherFor } from "./weather.js";
import { currentSeason } from "./age.js";
import {
  ENVIRONMENT_AMBIENT,
  ENVIRONMENT_FEATURES,
  ENVIRONMENT_NOTE,
  EXTRA_BUILDINGS,
  EXTRA_BUILDING_DETAIL_FULL,
  EXTRA_BUILDING_DETAIL_SMALL,
  EXTRA_BUILDING_DETAIL_UPGRADING,
  EXTRA_BUILDING_NOTE_BUILDING,
  EXTRA_BUILDING_NOTE_STANDING,
  EXTRA_BUILDING_NOTE_UPGRADING,
  WORK_STATION_BENEFIT_MULT,
  WORK_STATION_DEPTH_LABEL,
  WORK_STATION_DEPTH_MULT,
  WORK_STATION_DEPTH_NOTE_ACTIVE,
  WORK_STATION_DEPTH_NOTE_BUILDING,
  WORK_STATION_DEPTH_NOTE_EMPTY,
  WORK_STATION_DEPTH_NOTE_LOW_TIER,
  WORK_STATION_DEPTH_NOTE_NO_BASE,
  WORK_STATION_DEPTH_NOTE_UPGRADING,
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

function pairFarm(level: number) {
  const on = fresh();
  addBuilding(on, "farm", { level });
  staff(on, "farmer");
  const off = fresh();
  addBuilding(off, "farm", { level });
  staff(off, "farmer");
  return { on, off };
}

describe("living realm slice 31: environment", () => {
  it("live board: shape from terrain, weather and season", () => {
    const s = fresh();
    const env = environmentSnapshot(s)!;
    expect(Object.values(ENVIRONMENT_FEATURES)).toContain(env.features);
    expect(env.ambient).toBe(ENVIRONMENT_AMBIENT[weatherFor(s)]);
    expect(env.note).toBe(ENVIRONMENT_NOTE[currentSeason(s)]);
    expect(Object.keys(env).sort()).toEqual(["ambient", "features", "note"]);
  });

  it("features follow the most common terrain", () => {
    const s = fresh();
    for (const p of s.board.provinces) p.terrain = "plain";
    for (const p of s.board.provinces.slice(0, 100)) p.terrain = "wood";
    expect(environmentSnapshot(s)!.features).toBe("Old woods");
    for (const p of s.board.provinces) p.terrain = "peak";
    expect(environmentSnapshot(s)!.features).toBe("High peaks");
  });

  it("ties break in fixed key order", () => {
    const s = fresh();
    s.board.provinces.forEach((p, i) => (p.terrain = i % 2 === 0 ? "shore" : "hill"));
    expect(environmentSnapshot(s)!.features).toBe(ENVIRONMENT_FEATURES.hill);
  });

  it("note follows the season", () => {
    const s = fresh();
    s.meta.tick = 0;
    expect(environmentSnapshot(s)!.note).toBe(ENVIRONMENT_NOTE.Spring);
    s.meta.tick = 6000;
    expect(environmentSnapshot(s)!.note).toBe(ENVIRONMENT_NOTE.Winter);
  });

  it("every weather has an ambient label", () => {
    for (const w of ["clear", "rain", "storm", "snow"]) expect(typeof ENVIRONMENT_AMBIENT[w]).toBe("string");
  });

  it("empty board gives null", () => {
    const s = fresh();
    s.board.provinces = [];
    expect(environmentSnapshot(s)).toBeNull();
  });

  it("flag off gives null", () => {
    const s = fresh();
    setLivingSwitch(s, "environment", false);
    expect(LIVING_SWITCH_FLAGS.environment).toBe("living_environment");
    expect(livingSwitches(s).environment).toBe(false);
    expect(environmentSnapshot(s)).toBeNull();
  });

  it("is read-only and deterministic", () => {
    const s = fresh(9);
    const before = JSON.stringify(s);
    expect(environmentSnapshot(s)).toEqual(environmentSnapshot(fresh(9)));
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("living realm slice 31: work station depth", () => {
  it("unknown id or no station gives null", () => {
    const s = fresh();
    expect(workStationDepthSnapshot(s, "nope")).toBeNull();
    const c = addBuilding(s, "cottage", { level: 3 });
    expect(workStationDepthSnapshot(s, c.id)).toBeNull();
  });

  it("staffed Tier II: active, extra +3% on top of +5%", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { level: 2 });
    staff(s, "farmer");
    expect(workStationDepthSnapshot(s, b.id)).toEqual({ depth: WORK_STATION_DEPTH_LABEL, active: true, note: WORK_STATION_DEPTH_NOTE_ACTIVE });
    expect(WORK_STATION_DEPTH_MULT).toBe(1.03);
    expect(workStationDepthBonus(s, b)).toBe(1.03);
    expect(workStationBonus(s, b)).toBe(WORK_STATION_BENEFIT_MULT);
  });

  it("staffed Tier I: inactive, low-tier note", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    staff(s, "farmer");
    expect(workStationDepthSnapshot(s, b.id)).toEqual({ depth: WORK_STATION_DEPTH_LABEL, active: false, note: WORK_STATION_DEPTH_NOTE_LOW_TIER });
    expect(workStationDepthBonus(s, b)).toBe(1);
  });

  it("empty, building, upgrading: inactive", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { level: 3 });
    expect(workStationDepthSnapshot(s, b.id)).toEqual({ depth: WORK_STATION_DEPTH_LABEL, active: false, note: WORK_STATION_DEPTH_NOTE_EMPTY });
    staff(s, "farmer");
    b.completesAtTick = s.meta.tick + 10;
    expect(workStationDepthSnapshot(s, b.id)).toEqual({ depth: WORK_STATION_DEPTH_LABEL, active: false, note: WORK_STATION_DEPTH_NOTE_BUILDING });
    b.completesAtTick = null;
    upgrading(s, b.id);
    expect(workStationDepthSnapshot(s, b.id)).toEqual({ depth: WORK_STATION_DEPTH_LABEL, active: false, note: WORK_STATION_DEPTH_NOTE_UPGRADING });
    expect(workStationDepthBonus(s, b)).toBe(1);
  });

  it("one step, not per worker", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { level: 4 });
    staff(s, "farmer", 3, 3, "c1");
    staff(s, "farmer", 3, 3, "c2");
    expect(workStationDepthBonus(s, b)).toBe(1.03);
  });

  it("needs the slice 30 station bonus", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { level: 2 });
    staff(s, "farmer");
    setLivingSwitch(s, "workStationBenefit", false);
    expect(workStationDepthBonus(s, b)).toBe(1);
    expect(workStationDepthSnapshot(s, b.id)).toEqual({ depth: WORK_STATION_DEPTH_LABEL, active: false, note: WORK_STATION_DEPTH_NOTE_NO_BASE });
  });

  it("economy: staffed Tier II farm makes more food with depth on, at most 3% more", () => {
    const { on, off } = pairFarm(2);
    setLivingSwitch(off, "workStationDepth", false);
    const a = economyGain(on, 1000, false).food;
    const b = economyGain(off, 1000, false).food;
    const ratio = a.div(b).toNumber();
    expect(ratio).toBeGreaterThan(1.01);
    expect(ratio).toBeLessThanOrEqual(1.03 + 1e-12);
    expect(economyGain(on, 1000, false).food.toString()).toBe(a.toString());
  });

  it("economy: both bonuses together stay small (at most 1.05 x 1.03)", () => {
    const { on, off } = pairFarm(2);
    setLivingSwitch(off, "workStationBenefit", false);
    setLivingSwitch(off, "workStationDepth", false);
    const ratio = economyGain(on, 1000, false).food.div(economyGain(off, 1000, false).food).toNumber();
    expect(ratio).toBeGreaterThan(1.05);
    expect(ratio).toBeLessThanOrEqual(1.05 * 1.03 + 1e-12);
  });

  it("economy: Tier I staffed farm is unchanged by the depth flag", () => {
    const { on, off } = pairFarm(1);
    setLivingSwitch(off, "workStationDepth", false);
    expect(economyGain(on, 1000, false).food.toString()).toBe(economyGain(off, 1000, false).food.toString());
  });

  it("flag off: null, no depth bonus, slice 30 bonus stays", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { level: 2 });
    staff(s, "farmer");
    setLivingSwitch(s, "workStationDepth", false);
    expect(LIVING_SWITCH_FLAGS.workStationDepth).toBe("living_work_station_depth");
    expect(workStationDepthSnapshot(s, b.id)).toBeNull();
    expect(workStationDepthBonus(s, b)).toBe(1);
    expect(workStationBonus(s, b)).toBe(1.05);
    expect(workStationBenefitSnapshot(s, b.id)!.active).toBe(true);
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { level: 2 });
    staff(s, "farmer");
    const before = JSON.stringify(s);
    expect(workStationDepthSnapshot(s, b.id)).toEqual(workStationDepthSnapshot(s, b.id));
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("living realm slice 31: extra buildings", () => {
  it("unknown id or type with no extra gives null", () => {
    const s = fresh();
    expect(extraBuildingSnapshot(s, "nope")).toBeNull();
    const c = addBuilding(s, "cottage");
    expect(extraBuildingSnapshot(s, c.id)).toBeNull();
  });

  it("Tier I farm: windmill, small", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    expect(extraBuildingSnapshot(s, b.id)).toEqual({ extra: EXTRA_BUILDINGS.farm, detail: EXTRA_BUILDING_DETAIL_SMALL, note: EXTRA_BUILDING_NOTE_STANDING });
    expect(EXTRA_BUILDINGS.farm).toBe("Windmill");
  });

  it("Tier III and up: full size", () => {
    const s = fresh();
    const b = addBuilding(s, "keep", { level: 3 });
    expect(extraBuildingSnapshot(s, b.id)).toEqual({ extra: "Courtyard well", detail: EXTRA_BUILDING_DETAIL_FULL, note: EXTRA_BUILDING_NOTE_STANDING });
  });

  it("under construction: detail null; upgrading: being extended", () => {
    const s = fresh();
    const b = addBuilding(s, "chapel", { completesAtTick: s.meta.tick + 5 });
    expect(extraBuildingSnapshot(s, b.id)).toEqual({ extra: "Bell tower", detail: null, note: EXTRA_BUILDING_NOTE_BUILDING });
    b.completesAtTick = null;
    upgrading(s, b.id);
    expect(extraBuildingSnapshot(s, b.id)).toEqual({ extra: "Bell tower", detail: EXTRA_BUILDING_DETAIL_UPGRADING, note: EXTRA_BUILDING_NOTE_UPGRADING });
  });

  it("only existing building types carry an extra", () => {
    const shipped = ["farm", "cottage", "lumber_camp", "quarry", "gold_mine", "granary", "sawmill", "mason", "market", "mint", "barracks", "stables", "archery_range", "academy", "siege_workshop", "watchtower", "chapel", "infirmary", "walls", "gate", "keep"];
    for (const id of Object.keys(EXTRA_BUILDINGS)) expect(shipped).toContain(id);
  });

  it("visual only: economy unchanged by the flag", () => {
    const on = fresh();
    addBuilding(on, "farm", { level: 3 });
    const off = fresh();
    addBuilding(off, "farm", { level: 3 });
    setLivingSwitch(off, "extraBuildings", false);
    expect(economyGain(on, 1000, false).food.toString()).toBe(economyGain(off, 1000, false).food.toString());
  });

  it("flag off gives null", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    setLivingSwitch(s, "extraBuildings", false);
    expect(LIVING_SWITCH_FLAGS.extraBuildings).toBe("living_extra_buildings");
    expect(extraBuildingSnapshot(s, b.id)).toBeNull();
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    const b = addBuilding(s, "market", { level: 2 });
    const before = JSON.stringify(s);
    expect(extraBuildingSnapshot(s, b.id)).toEqual(extraBuildingSnapshot(s, b.id));
    expect(JSON.stringify(s)).toBe(before);
  });
});
