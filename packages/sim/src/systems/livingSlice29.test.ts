import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import { boardExpansionSnapshot, buildingLifeSnapshot, workStationStagingSnapshot } from "./livingStatus.js";
import {
  BOARD_BAND_MID,
  BOARD_BAND_SMALL,
  BOARD_BAND_WIDE,
  BOARD_EXPANSION_NOTE_PLANNED,
  BOARD_EXPANSION_NOTE_WIDEST,
  BUILDING_LIFE_MOTION_HAMMERS,
  BUILDING_LIFE_MOTION_SCAFFOLD,
  BUILDING_LIFE_MOTION_WORK,
  BUILDING_LIFE_NOTE_BUILDING,
  BUILDING_LIFE_NOTE_NO_STATION,
  BUILDING_LIFE_NOTE_STAFFED,
  BUILDING_LIFE_NOTE_UNSTAFFED,
  BUILDING_LIFE_NOTE_UPGRADING,
  BUILDING_LIFE_TIER_ELEMENTS,
  WORK_STATION_NOTE_BUILDING,
  WORK_STATION_NOTE_EMPTY,
  WORK_STATION_NOTE_STAFFED,
  WORK_STATION_NOTE_UPGRADING,
  WORK_STATION_STAGED,
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

describe("living realm slice 29: building life", () => {
  it("unknown building id gives null", () => {
    expect(buildingLifeSnapshot(fresh(), "nope")).toBeNull();
  });

  it("unstaffed Tier I farm: shape", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    expect(buildingLifeSnapshot(s, b.id)).toEqual({ tierElements: null, motion: null, note: BUILDING_LIFE_NOTE_UNSTAFFED });
  });

  it("staffed farm moves", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { level: 3 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 3, y: 3 } });
    expect(buildingLifeSnapshot(s, b.id)).toEqual({
      tierElements: BUILDING_LIFE_TIER_ELEMENTS[3],
      motion: BUILDING_LIFE_MOTION_WORK,
      note: BUILDING_LIFE_NOTE_STAFFED,
    });
  });

  it("tier elements follow level and clamp", () => {
    const s = fresh();
    const els = [0, 1, 2, 3, 4, 5, 9].map((level) => buildingLifeSnapshot(s, addBuilding(s, "cottage", { level }).id)!.tierElements);
    expect(els).toEqual([null, null, "Banner", "Banner, lamps", "Banner, lamps, stone trim", "Banner, lamps, stone trim, crest", "Banner, lamps, stone trim, crest"]);
  });

  it("construction: scaffold, no tier elements; upgrade: hammers, keeps elements", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { level: 4, completesAtTick: s.meta.tick + 10 });
    expect(buildingLifeSnapshot(s, b.id)).toEqual({ tierElements: null, motion: BUILDING_LIFE_MOTION_SCAFFOLD, note: BUILDING_LIFE_NOTE_BUILDING });
    const u = addBuilding(s, "farm", { x: 5, level: 2 });
    upgrading(s, u.id);
    expect(buildingLifeSnapshot(s, u.id)).toEqual({ tierElements: "Banner", motion: BUILDING_LIFE_MOTION_HAMMERS, note: BUILDING_LIFE_NOTE_UPGRADING });
  });

  it("building with no station stands still", () => {
    const s = fresh();
    const b = addBuilding(s, "cottage");
    expect(buildingLifeSnapshot(s, b.id)).toEqual({ tierElements: null, motion: null, note: BUILDING_LIFE_NOTE_NO_STATION });
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { level: 2 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 3, y: 3 } });
    const before = JSON.stringify(s);
    const a = buildingLifeSnapshot(s, b.id);
    expect(buildingLifeSnapshot(s, b.id)).toEqual(a);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("living_building_life false gives null", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    expect(LIVING_SWITCH_FLAGS.buildingLife).toBe("living_building_life");
    setLivingSwitch(s, "buildingLife", false);
    expect(livingSwitches(s).buildingLife).toBe(false);
    expect(buildingLifeSnapshot(s, b.id)).toBeNull();
  });
});

describe("living realm slice 29: work station staging", () => {
  it("unknown id or a building with no station gives null", () => {
    const s = fresh();
    expect(workStationStagingSnapshot(s, "nope")).toBeNull();
    expect(workStationStagingSnapshot(s, addBuilding(s, "cottage").id)).toBeNull();
  });

  it("empty station: shape", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    expect(workStationStagingSnapshot(s, b.id)).toEqual({ station: "Field", staged: null, note: WORK_STATION_NOTE_EMPTY });
  });

  it("staffed station stages its pose", () => {
    const s = fresh();
    const b = addBuilding(s, "quarry", { x: 4, y: 2 });
    s.citizens.push({ id: "c1", realmId: "player", job: "miner", tile: { x: 4, y: 2 } });
    expect(workStationStagingSnapshot(s, b.id)).toEqual({ station: "Pit", staged: WORK_STATION_STAGED.Pit, note: WORK_STATION_NOTE_STAFFED });
    expect(WORK_STATION_STAGED.Pit).toBe("Digging");
  });

  it("construction and upgrade stage nothing, even with a worker present", () => {
    const s = fresh();
    const b = addBuilding(s, "farm", { completesAtTick: s.meta.tick + 10 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 3, y: 3 } });
    expect(workStationStagingSnapshot(s, b.id)).toEqual({ station: "Field", staged: null, note: WORK_STATION_NOTE_BUILDING });
    const u = addBuilding(s, "farm", { x: 6 });
    s.citizens.push({ id: "c2", realmId: "player", job: "farmer", tile: { x: 6, y: 3 } });
    upgrading(s, u.id);
    expect(workStationStagingSnapshot(s, u.id)).toEqual({ station: "Field", staged: null, note: WORK_STATION_NOTE_UPGRADING });
  });

  it("every station label has a staged pose", () => {
    for (const st of ["Field", "Woodlot", "Pit", "Stall", "Post", "Study"]) expect(typeof WORK_STATION_STAGED[st]).toBe("string");
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 3, y: 3 } });
    const before = JSON.stringify(s);
    expect(workStationStagingSnapshot(s, b.id)).toEqual(workStationStagingSnapshot(s, b.id));
    expect(JSON.stringify(s)).toBe(before);
  });

  it("living_work_station_staging false gives null", () => {
    const s = fresh();
    const b = addBuilding(s, "farm");
    expect(LIVING_SWITCH_FLAGS.workStationStaging).toBe("living_work_station_staging");
    setLivingSwitch(s, "workStationStaging", false);
    expect(workStationStagingSnapshot(s, b.id)).toBeNull();
  });
});

describe("living realm slice 29: board expansion prep", () => {
  it("live board: mid, wide prepared", () => {
    expect(boardExpansionSnapshot(fresh())).toEqual({ current: BOARD_BAND_MID, prepared: BOARD_BAND_WIDE, note: BOARD_EXPANSION_NOTE_PLANNED });
  });

  it("small and wide bands", () => {
    const s = fresh();
    s.board.width = 6;
    s.board.height = 8;
    expect(boardExpansionSnapshot(s)).toEqual({ current: BOARD_BAND_SMALL, prepared: BOARD_BAND_MID, note: BOARD_EXPANSION_NOTE_PLANNED });
    s.board.width = 13;
    s.board.height = 10;
    expect(boardExpansionSnapshot(s)).toEqual({ current: BOARD_BAND_WIDE, prepared: BOARD_BAND_WIDE, note: BOARD_EXPANSION_NOTE_WIDEST });
  });

  it("bad dimensions give null", () => {
    const s = fresh();
    s.board.height = -1;
    expect(boardExpansionSnapshot(s)).toBeNull();
  });

  it("is read-only and does not change the board", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    expect(boardExpansionSnapshot(s)).toEqual(boardExpansionSnapshot(s));
    expect(JSON.stringify(s)).toBe(before);
  });

  it("living_board_expansion false gives null", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.boardExpansion).toBe("living_board_expansion");
    setLivingSwitch(s, "boardExpansion", false);
    expect(boardExpansionSnapshot(s)).toBeNull();
  });
});
