import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, setLivingSwitch } from "./livingRealm.js";
import { EconomySystem, economyGain, nextStationRestTick, stationRestBonus } from "./economy.js";
import { environmentSnapshot, stationRestSnapshot } from "./livingStatus.js";
import { currentSeason } from "./age.js";
import { DAY_CYCLE_TICKS, dayPhaseAt } from "./dayNight.js";
import {
  ENVIRONMENT_SEASON_NOTE,
  STATION_REST_MULT,
  STATION_REST_NOTE_BUILDING,
  STATION_REST_NOTE_FRESH,
  STATION_REST_NOTE_RESTING,
  STATION_REST_NOTE_WORKING,
} from "../content/livingRealm.js";

// Day cycle: dawn 0-539, day 540-1979, dusk 1980-2519, night 2520-3599.
const DAY = 7 * DAY_CYCLE_TICKS;
const DAWN = DAY + 100;
const NOON = DAY + 1000;
const DUSK = DAY + 2200;
const NIGHT = DAY + 3000;

function fresh(tick = NOON, seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = tick;
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
    x: 3 + s.buildings.length * 3,
    y: 3,
    level: 1,
    completesAtTick: null,
    ...opts,
  } as GameState["buildings"][number];
  s.buildings.push(b);
  return b;
}

describe("living realm slice 33: environment season note", () => {
  it("seasonNote follows the season; other fields kept", () => {
    const s = fresh();
    const env = environmentSnapshot(s)!;
    expect(env.seasonNote).toBe(ENVIRONMENT_SEASON_NOTE[currentSeason(s)]);
    expect(Object.keys(env).sort()).toEqual(["ambient", "features", "lightMark", "mood", "note", "seasonNote", "weatherMark"]);
  });

  it("fixed strings per season", () => {
    expect(ENVIRONMENT_SEASON_NOTE).toEqual({
      Spring: "Early growth",
      Summer: "High sun",
      Autumn: "Turning leaves",
      Winter: "Quiet frost",
    });
    const s = fresh();
    const seen = new Set<string>();
    for (let t = 0; t < 8000; t += 500) {
      s.meta.tick = t;
      const note = environmentSnapshot(s)!.seasonNote!;
      expect(note).toBe(ENVIRONMENT_SEASON_NOTE[currentSeason(s)]);
      seen.add(note);
    }
    expect(seen.size).toBe(4);
  });

  it("living_environment_notes off: seasonNote null, other fields kept", () => {
    const s = fresh();
    const before = environmentSnapshot(s)!;
    setLivingSwitch(s, "environmentNotes", false);
    expect(LIVING_SWITCH_FLAGS.environmentNotes).toBe("living_environment_notes");
    expect(environmentSnapshot(s)).toEqual({ ...before, seasonNote: null });
  });

  it("is read-only and deterministic", () => {
    const s = fresh(NOON, 9);
    const json = JSON.stringify(s);
    expect(environmentSnapshot(s)).toEqual(environmentSnapshot(fresh(NOON, 9)));
    expect(JSON.stringify(s)).toBe(json);
  });
});

describe("living realm slice 33: station rest shape", () => {
  it("unknown id or no station gives null", () => {
    const s = fresh(NIGHT);
    expect(stationRestSnapshot(s, "nope")).toBeNull();
    const c = addBuilding(s, "cottage");
    expect(stationRestSnapshot(s, c.id)).toBeNull();
    s.meta.tick = DAWN;
    expect(stationRestBonus(s, c)).toBe(1);
  });

  it("night: resting; dawn: fresh with +2%; day and dusk: at work", () => {
    const s = fresh(NIGHT);
    const f = addBuilding(s, "farm");
    expect(stationRestSnapshot(s, f.id)).toEqual({ resting: true, note: STATION_REST_NOTE_RESTING });
    expect(stationRestBonus(s, f)).toBe(1);
    s.meta.tick = DAWN;
    expect(stationRestSnapshot(s, f.id)).toEqual({ resting: false, note: STATION_REST_NOTE_FRESH });
    expect(stationRestBonus(s, f)).toBe(1.02);
    expect(STATION_REST_MULT).toBe(1.02);
    for (const t of [NOON, DUSK]) {
      s.meta.tick = t;
      expect(stationRestSnapshot(s, f.id)).toEqual({ resting: false, note: STATION_REST_NOTE_WORKING });
      expect(stationRestBonus(s, f)).toBe(1);
    }
  });

  it("under construction: not resting, no bonus", () => {
    const s = fresh(DAWN);
    const f = addBuilding(s, "farm", { completesAtTick: DAWN + 50 });
    expect(stationRestSnapshot(s, f.id)).toEqual({ resting: false, note: STATION_REST_NOTE_BUILDING });
    expect(stationRestBonus(s, f)).toBe(1);
  });

  it("over a whole day the shape is always one of the fixed notes and matches the phase", () => {
    const s = fresh(DAY);
    const f = addBuilding(s, "farm");
    for (let t = DAY; t < DAY + DAY_CYCLE_TICKS; t += 60) {
      s.meta.tick = t;
      const r = stationRestSnapshot(s, f.id)!;
      expect(r.resting).toBe(dayPhaseAt(t) === "night");
      expect(stationRestBonus(s, f)).toBe(dayPhaseAt(t) === "dawn" ? 1.02 : 1);
    }
  });

  it("flag off: null and no bonus", () => {
    const s = fresh(DAWN);
    const f = addBuilding(s, "farm");
    setLivingSwitch(s, "stationRest", false);
    expect(LIVING_SWITCH_FLAGS.stationRest).toBe("living_station_rest");
    expect(stationRestSnapshot(s, f.id)).toBeNull();
    expect(stationRestBonus(s, f)).toBe(1);
  });

  it("is read-only", () => {
    const s = fresh(DAWN);
    const f = addBuilding(s, "farm");
    const json = JSON.stringify(s);
    expect(stationRestSnapshot(s, f.id)).toEqual(stationRestSnapshot(s, f.id));
    expect(JSON.stringify(s)).toBe(json);
  });
});

describe("living realm slice 33: station rest economy", () => {
  it("dawn: a farm makes exactly 2% more food than with the flag off", () => {
    const on = fresh(DAWN);
    addBuilding(on, "farm");
    const off = fresh(DAWN);
    addBuilding(off, "farm");
    setLivingSwitch(off, "stationRest", false);
    const ratio = economyGain(on, 100, false).food.div(economyGain(off, 100, false).food).toNumber();
    expect(ratio).toBeCloseTo(1.02, 9);
  });

  it("day, dusk and night: no change", () => {
    for (const t of [NOON, DUSK, NIGHT]) {
      const on = fresh(t);
      addBuilding(on, "farm");
      const off = fresh(t);
      addBuilding(off, "farm");
      setLivingSwitch(off, "stationRest", false);
      expect(economyGain(on, 100, false).food.toString()).toBe(economyGain(off, 100, false).food.toString());
    }
  });

  it("non-station output is untouched at dawn", () => {
    const on = fresh(DAWN);
    addBuilding(on, "cottage");
    const off = fresh(DAWN);
    addBuilding(off, "cottage");
    setLivingSwitch(off, "stationRest", false);
    const a = economyGain(on, 100, false);
    const b = economyGain(off, 100, false);
    for (const res of Object.keys(b)) expect(a[res]?.toString()).toBe(b[res].toString());
  });

  it("dawn start and dawn end are economy event ticks", () => {
    expect(nextStationRestTick(DAY - 1)).toBe(DAY);
    expect(nextStationRestTick(DAY)).toBe(DAY + 540);
    expect(nextStationRestTick(DAY + 539)).toBe(DAY + 540);
    expect(nextStationRestTick(DAY + 540)).toBe(DAY + DAY_CYCLE_TICKS);
    const s = fresh(NIGHT);
    addBuilding(s, "farm");
    expect(EconomySystem.nextEventTick(s)).toBe(DAY + DAY_CYCLE_TICKS);
    setLivingSwitch(s, "stationRest", false);
    // Slice 34 station rhythm adds its own event ticks; switch it off to isolate rest.
    setLivingSwitch(s, "stationRhythm", false);
    // Slice 35 station focus adds its own event ticks; switch it off too.
    setLivingSwitch(s, "stationFocus", false);
    expect(EconomySystem.nextEventTick(s)).toBeNull();
  });

  it("settling across a dawn in one batch matches tick by tick (offline equals online)", () => {
    const a = fresh(NIGHT);
    addBuilding(a, "farm");
    addBuilding(a, "lumber_camp");
    a.resources.food = "0";
    a.resources.wood = "0";
    const b = structuredClone(a);
    new TickEngine(a).tickMany(2000);
    new TickEngine(b).settleTicks(2000);
    expect(b.meta.tick).toBe(a.meta.tick);
    for (const res of ["food", "wood"]) {
      expect(D(b.resources[res] ?? "0").toNumber(), res).toBeCloseTo(D(a.resources[res] ?? "0").toNumber(), 6);
    }
  });

  it("deterministic: same state, same gain", () => {
    const a = fresh(DAWN);
    addBuilding(a, "farm");
    const b = fresh(DAWN);
    addBuilding(b, "farm");
    expect(economyGain(a, 500, false).food.toString()).toBe(economyGain(b, 500, false).food.toString());
  });
});
