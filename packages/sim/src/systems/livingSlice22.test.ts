import { describe, it, expect } from "vitest";
import type { CitizenJobId, GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import { jobSummarySnapshot, staffingPressureSnapshot } from "./livingStatus.js";
import { emptyStaffWorks } from "./staffHint.js";
import { staffBonus } from "./economy.js";
import { CITIZEN_JOBS } from "../content/citizens.js";
import {
  JOB_SUMMARY_BUILDING_CAP,
  STAFFING_NOTE_ASSIGN,
  STAFFING_NOTE_SHORT,
  STAFFING_NOTE_SPARE,
} from "../content/livingRealm.js";

const REAL_JOBS = Object.keys(CITIZEN_JOBS).filter((j) => j !== "unassigned");

/** No buildings, no citizens. */
function bare(seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.buildings = [];
  s.citizens = [];
  return s;
}

let n = 0;
function build(s: GameState, typeId: string, x: number, y: number, realmId = "player", done = true) {
  const b = { id: `b${n++}`, typeId, realmId, x, y, level: 1, completesAtTick: done ? null : 999 };
  s.buildings.push(b as GameState["buildings"][number]);
  return b;
}
function hire(s: GameState, job: CitizenJobId, tile: { x: number; y: number } | null = null, realmId = "player") {
  const c = { id: `c${n++}`, realmId, job, tile };
  s.citizens.push(c);
  return c;
}

describe("slice 22 switches", () => {
  it("are on by default and map to their flags", () => {
    const s = bare();
    expect(LIVING_SWITCH_FLAGS.jobSummary).toBe("living_job_summary");
    expect(LIVING_SWITCH_FLAGS.staffingPressure).toBe("living_staffing_pressure");
    const sw = livingSwitches(s);
    expect([sw.jobSummary, sw.staffingPressure]).toEqual([true, true]);
  });

  it("false returns null, each independently", () => {
    const s = bare();
    hire(s, "unassigned");
    expect(jobSummarySnapshot(s)).not.toBeNull();
    expect(staffingPressureSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "jobSummary", false);
    expect(jobSummarySnapshot(s)).toBeNull();
    expect(staffingPressureSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "staffingPressure", false);
    expect(staffingPressureSnapshot(s)).toBeNull();
  });
});

describe("jobSummarySnapshot", () => {
  it("is null with no player villagers (foreign ones do not count)", () => {
    const s = bare();
    expect(jobSummarySnapshot(s)).toBeNull();
    hire(s, "farmer", null, "rival_1");
    expect(jobSummarySnapshot(s)).toBeNull();
  });

  it("has the shape; idle villagers only gives an empty byJob", () => {
    const s = bare();
    hire(s, "unassigned");
    hire(s, "unassigned");
    const d = jobSummarySnapshot(s)!;
    expect(Object.keys(d).sort()).toEqual(["byJob", "idle"]);
    expect(d).toEqual({ idle: 2, byJob: [] });
  });

  it("counts by job in CITIZEN_JOBS order with job names and finished works", () => {
    const s = bare();
    const mine = build(s, "gold_mine", 2, 3);
    const farm = build(s, "farm", 4, 4);
    build(s, "farm", 9, 9, "player", false); // underway: not listed
    build(s, "farm", 7, 7, "rival_1"); // foreign: not listed
    build(s, "cottage", 1, 1); // no trade: not listed
    hire(s, "miner", { x: 2, y: 3 });
    hire(s, "farmer", { x: 4, y: 4 });
    hire(s, "farmer", null);
    hire(s, "unassigned");
    const d = jobSummarySnapshot(s)!;
    expect(d.idle).toBe(1);
    expect(d.byJob).toEqual([
      { id: "farmer", name: CITIZEN_JOBS.farmer.name, count: 2, buildings: [{ id: farm.id, name: "Farm", x: 4, y: 4 }] },
      { id: "miner", name: CITIZEN_JOBS.miner.name, count: 1, buildings: [{ id: mine.id, name: "Gold Mine", x: 2, y: 3 }] },
    ]);
  });

  it("lists a job with works but no workers, and one with workers but no works", () => {
    const s = bare();
    build(s, "market", 5, 5);
    hire(s, "guard");
    const d = jobSummarySnapshot(s)!;
    expect(d.byJob.map((j) => [j.id, j.count, j.buildings.length])).toEqual([
      ["merchant", 0, 1],
      ["guard", 1, 0],
    ]);
  });

  it("buildings are capped per job; byJob never exceeds the real job count", () => {
    const s = bare();
    for (let i = 0; i < 6; i++) build(s, i % 2 ? "granary" : "farm", i, 0);
    for (const t of ["lumber_camp", "quarry", "market", "barracks", "chapel"]) build(s, t, 0, 5);
    for (const j of REAL_JOBS) hire(s, j as CitizenJobId);
    hire(s, "unassigned");
    const d = jobSummarySnapshot(s)!;
    expect(d.byJob).toHaveLength(REAL_JOBS.length);
    expect(d.byJob.map((j) => j.id)).toEqual(REAL_JOBS);
    expect(d.byJob[0].buildings).toHaveLength(JOB_SUMMARY_BUILDING_CAP);
    expect(d.byJob[0].buildings.map((b) => b.x)).toEqual([0, 1, 2]);
    for (const j of d.byJob) expect(j.buildings.length).toBeLessThanOrEqual(JOB_SUMMARY_BUILDING_CAP);
  });
});

describe("staffingPressureSnapshot", () => {
  it("is null with nothing to report", () => {
    const s = bare();
    expect(staffingPressureSnapshot(s)).toBeNull();
    build(s, "farm", 1, 1);
    hire(s, "farmer", { x: 1, y: 1 });
    expect(staffingPressureSnapshot(s)).toBeNull();
  });

  it("has the shape; empty works and idle hands give the assign note", () => {
    const s = bare();
    build(s, "farm", 1, 1);
    build(s, "market", 2, 2);
    hire(s, "unassigned");
    const d = staffingPressureSnapshot(s)!;
    expect(Object.keys(d).sort()).toEqual(["emptyBuildings", "idleVillagers", "note"]);
    expect(d).toEqual({ emptyBuildings: 2, idleVillagers: 1, note: STAFFING_NOTE_ASSIGN });
  });

  it("empty works with no one idle: short note", () => {
    const s = bare();
    build(s, "farm", 1, 1);
    hire(s, "farmer", { x: 9, y: 9 }); // wrong tile: farm stays empty
    expect(staffingPressureSnapshot(s)).toEqual({ emptyBuildings: 1, idleVillagers: 0, note: STAFFING_NOTE_SHORT });
  });

  it("idle hands with no empty works: spare note", () => {
    const s = bare();
    hire(s, "unassigned");
    hire(s, "unassigned", null, "rival_1"); // foreign idle not counted
    expect(staffingPressureSnapshot(s)).toEqual({ emptyBuildings: 0, idleVillagers: 1, note: STAFFING_NOTE_SPARE });
  });

  it("emptyBuildings follows the staff hint's rule (emptyStaffWorks / staffBonus)", () => {
    const s = bare();
    build(s, "farm", 1, 1);
    build(s, "walls", 2, 2); // skipped by the staff hint
    build(s, "cottage", 3, 3); // no trade
    build(s, "market", 4, 4, "player", false); // underway
    build(s, "quarry", 5, 5);
    hire(s, "miner", { x: 5, y: 5 });
    const d = staffingPressureSnapshot(s)!;
    expect(d.emptyBuildings).toBe(emptyStaffWorks(s).length);
    expect(d.emptyBuildings).toBe(1);
    const unstaffed = s.buildings.filter((b) => b.typeId === "farm" || b.typeId === "quarry").filter((b) => staffBonus(s, b) === 1);
    expect(unstaffed.map((b) => b.typeId)).toEqual(["farm"]);
  });
});

describe("slice 22 determinism and purity", () => {
  it("same state gives the same answer and nothing is written", () => {
    const make = () => {
      const s = createGameState({ seed: 3, now: 1, withStarterBuildings: true });
      s.citizens.push({ id: "cx", realmId: "player", job: "unassigned", tile: null });
      return s;
    };
    const callAll = (s: GameState) => [jobSummarySnapshot(s), staffingPressureSnapshot(s)];
    const s = make();
    const before = JSON.stringify(s);
    const a = callAll(s);
    expect(a[0]).not.toBeNull();
    expect(JSON.stringify(s)).toBe(before);
    expect(callAll(s)).toEqual(a);
    expect(callAll(make())).toEqual(a);
  });
});
