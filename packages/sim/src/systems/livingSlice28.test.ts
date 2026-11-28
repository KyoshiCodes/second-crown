import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { BOARD_H, BOARD_W } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import { boardScaleSnapshot, buildingDetailSnapshot } from "./livingStatus.js";
import {
  BOARD_SCALE_NOTE_MID,
  BOARD_SCALE_NOTE_SMALL,
  BOARD_SCALE_NOTE_WIDE,
  BUILDING_NOTE_BUILDING,
  BUILDING_NOTE_NO_STATION,
  BUILDING_NOTE_STAFFED,
  BUILDING_NOTE_UNSTAFFED,
  BUILDING_NOTE_UPGRADING,
  BUILDING_TIER_LABELS,
  BUILDING_WORK_STATIONS,
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

describe("living realm slice 28: building detail", () => {
  it("unknown building id gives null", () => {
    expect(buildingDetailSnapshot(fresh(), "nope")).toBeNull();
  });

  it("unstaffed farm: shape, name, tier, station, note", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    expect(buildingDetailSnapshot(s, b.id)).toEqual({
      name: "Farm",
      tier: "Tier I",
      staffed: false,
      workStation: BUILDING_WORK_STATIONS.farmer,
      note: BUILDING_NOTE_UNSTAFFED,
    });
  });

  it("a matching worker on the tile marks it staffed", () => {
    const s = fresh();
    const b = addBuilding(s, "quarry", { x: 4, y: 2 });
    s.citizens.push({ id: "c1", realmId: "player", job: "miner", tile: { x: 4, y: 2 } });
    const d = buildingDetailSnapshot(s, b.id)!;
    expect(d.staffed).toBe(true);
    expect(d.workStation).toBe("Pit");
    expect(d.note).toBe(BUILDING_NOTE_STAFFED);
  });

  it("a worker with the wrong job or tile does not staff it", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { x: 1, y: 1 });
    s.citizens.push({ id: "c1", realmId: "player", job: "miner", tile: { x: 1, y: 1 } });
    s.citizens.push({ id: "c2", realmId: "player", job: "farmer", tile: { x: 2, y: 1 } });
    expect(buildingDetailSnapshot(s, b.id)!.staffed).toBe(false);
  });

  it("a building that takes no job has no station", () => {
    const s = fresh();
    const b = addBuilding(s, "cottage");
    const d = buildingDetailSnapshot(s, b.id)!;
    expect(d.workStation).toBeNull();
    expect(d.staffed).toBe(false);
    expect(d.note).toBe(BUILDING_NOTE_NO_STATION);
  });

  it("tier follows level and clamps to I..V", () => {
    const s = fresh();
    const tiers = [0, 1, 2, 3, 4, 5, 9].map((level) => buildingDetailSnapshot(s, addBuilding(s, "farm", { level }).id)!.tier);
    expect(tiers).toEqual(["Tier I", "Tier I", "Tier II", "Tier III", "Tier IV", "Tier V", "Tier V"]);
    expect(BUILDING_TIER_LABELS.length).toBe(6);
  });

  it("under construction beats upgrading beats staffing", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { completesAtTick: s.meta.tick + 10 });
    expect(buildingDetailSnapshot(s, b.id)!.note).toBe(BUILDING_NOTE_BUILDING);
    const u = addBuilding(s, "farm", { x: 5 });
    s.flags.upgrades_json = [{ id: "u1", buildingId: u.id, fromLevel: 1, doneTick: s.meta.tick + 50, ticks: 50, paid: {} }];
    expect(buildingDetailSnapshot(s, u.id)!.note).toBe(BUILDING_NOTE_UPGRADING);
  });

  it("unknown type falls back to the type id", () => {
    const s = fresh();
    const b = addBuilding(s, "mystery_hut");
    const d = buildingDetailSnapshot(s, b.id)!;
    expect(d.name).toBe("mystery_hut");
    expect(d.workStation).toBeNull();
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 3, y: 3 } });
    const before = JSON.stringify(s);
    const a = buildingDetailSnapshot(s, b.id);
    expect(buildingDetailSnapshot(s, b.id)).toEqual(a);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("living_building_detail false gives null", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    expect(LIVING_SWITCH_FLAGS.buildingDetail).toBe("living_building_detail");
    setLivingSwitch(s, "buildingDetail", false);
    expect(livingSwitches(s).buildingDetail).toBe(false);
    expect(buildingDetailSnapshot(s, b.id)).toBeNull();
  });
});

describe("living realm slice 28: board scale", () => {
  it("live board: width, height and wide note (16x10 since slice 30)", () => {
    const s = fresh();
    expect(boardScaleSnapshot(s)).toEqual({ width: BOARD_W, height: BOARD_H, note: BOARD_SCALE_NOTE_WIDE });
  });

  it("note bands by tile count", () => {
    const s = fresh();
    s.board.width = 6;
    s.board.height = 8;
    expect(boardScaleSnapshot(s)!.note).toBe(BOARD_SCALE_NOTE_SMALL);
    s.board.width = 12;
    s.board.height = 10;
    expect(boardScaleSnapshot(s)!.note).toBe(BOARD_SCALE_NOTE_MID);
    s.board.width = 13;
    expect(boardScaleSnapshot(s)!.note).toBe(BOARD_SCALE_NOTE_WIDE);
  });

  it("bad dimensions give null", () => {
    const s = fresh();
    s.board.width = 0;
    expect(boardScaleSnapshot(s)).toBeNull();
    s.board.width = 12;
    s.board.height = 2.5;
    expect(boardScaleSnapshot(s)).toBeNull();
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    expect(boardScaleSnapshot(s)).toEqual(boardScaleSnapshot(s));
    expect(JSON.stringify(s)).toBe(before);
  });

  it("living_board_scale false gives null", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.boardScale).toBe("living_board_scale");
    setLivingSwitch(s, "boardScale", false);
    expect(boardScaleSnapshot(s)).toBeNull();
  });
});
