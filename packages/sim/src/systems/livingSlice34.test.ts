import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, setLivingSwitch } from "./livingRealm.js";
import { EconomySystem, economyGain, nextStationRhythmTick, stationRhythmBonus, stationRhythmWindowAt } from "./economy.js";
import { environmentSnapshot, stationRhythmSnapshot } from "./livingStatus.js";
import { weatherFor } from "./weather.js";
import { DAY_CYCLE_TICKS } from "./dayNight.js";
import {
  ENVIRONMENT_WEATHER_MARK,
  STATION_RHYTHM_END,
  STATION_RHYTHM_MULT,
  STATION_RHYTHM_NOTE_BUILDING,
  STATION_RHYTHM_NOTE_IN,
  STATION_RHYTHM_NOTE_UNSTAFFED,
  STATION_RHYTHM_NOTE_UPGRADING,
  STATION_RHYTHM_NOTE_WAIT,
  STATION_RHYTHM_START,
} from "../content/livingRealm.js";

// Day cycle: dawn 0-539, day 540-1979, dusk 1980-2519, night 2520-3599. Rhythm: 900-1979.
const DAY = 7 * DAY_CYCLE_TICKS;
const DAWN = DAY + 100;
const MORNING = DAY + 700;
const NOON = DAY + 1200;
const DUSK = DAY + 2200;
const NIGHT = DAY + 3000;

const KEYS = ["ambient", "features", "lightMark", "mood", "note", "seasonNote", "weatherMark"];

function fresh(tick = NOON, seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = tick;
  ensureBoard(s);
  s.citizens = [];
  s.flags.upgrades_json = [];
  // Keep the slice 33 dawn rest bonus out of the rhythm ratios.
  setLivingSwitch(s, "stationRest", false);
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

function staff(s: GameState, b: GameState["buildings"][number], job: string) {
  s.citizens.push({ id: `c_${s.citizens.length}`, realmId: "player", job, tile: { x: b.x, y: b.y } } as GameState["citizens"][number]);
}

function staffedFarm(s: GameState) {
  const f = addBuilding(s, "farm");
  staff(s, f, "farmer");
  return f;
}

describe("living realm slice 34: environment weather mark", () => {
  it("weatherMark follows the weather; other fields kept", () => {
    const s = fresh();
    const env = environmentSnapshot(s)!;
    expect(env.weatherMark).toBe(ENVIRONMENT_WEATHER_MARK[weatherFor(s)]);
    expect(Object.keys(env).sort()).toEqual(KEYS);
  });

  it("fixed strings per weather, and every mark matches its weather over many seasons", () => {
    expect(ENVIRONMENT_WEATHER_MARK).toEqual({
      clear: "Clear air",
      rain: "Light rain",
      storm: "Strong wind",
      snow: "Still mist",
    });
    const s = fresh();
    const seen = new Set<string>();
    for (let t = 0; t < 200_000; t += 1000) {
      s.meta.tick = t;
      const mark = environmentSnapshot(s)!.weatherMark!;
      expect(mark).toBe(ENVIRONMENT_WEATHER_MARK[weatherFor(s)]);
      seen.add(mark);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("living_environment_weather off: weatherMark null, other fields kept", () => {
    const s = fresh();
    const before = environmentSnapshot(s)!;
    setLivingSwitch(s, "environmentWeather", false);
    expect(LIVING_SWITCH_FLAGS.environmentWeather).toBe("living_environment_weather");
    expect(environmentSnapshot(s)).toEqual({ ...before, weatherMark: null });
  });

  it("is read-only and deterministic", () => {
    const s = fresh(NOON, 9);
    const json = JSON.stringify(s);
    expect(environmentSnapshot(s)).toEqual(environmentSnapshot(fresh(NOON, 9)));
    expect(JSON.stringify(s)).toBe(json);
  });
});

describe("living realm slice 34: station rhythm shape", () => {
  it("unknown id or no station gives null", () => {
    const s = fresh(NOON);
    expect(stationRhythmSnapshot(s, "nope")).toBeNull();
    const c = addBuilding(s, "cottage");
    expect(stationRhythmSnapshot(s, c.id)).toBeNull();
    expect(stationRhythmBonus(s, c)).toBe(1);
  });

  it("staffed at midday: in rhythm with +1%; other phases: waiting", () => {
    const s = fresh(NOON);
    const f = staffedFarm(s);
    expect(stationRhythmSnapshot(s, f.id)).toEqual({ inRhythm: true, note: STATION_RHYTHM_NOTE_IN });
    expect(stationRhythmBonus(s, f)).toBe(1.01);
    expect(STATION_RHYTHM_MULT).toBe(1.01);
    for (const t of [DAWN, MORNING, DUSK, NIGHT]) {
      s.meta.tick = t;
      expect(stationRhythmSnapshot(s, f.id)).toEqual({ inRhythm: false, note: STATION_RHYTHM_NOTE_WAIT });
      expect(stationRhythmBonus(s, f)).toBe(1);
    }
  });

  it("unstaffed, building, upgrading: not in rhythm, no bonus", () => {
    const s = fresh(NOON);
    const bare = addBuilding(s, "farm");
    expect(stationRhythmSnapshot(s, bare.id)).toEqual({ inRhythm: false, note: STATION_RHYTHM_NOTE_UNSTAFFED });
    expect(stationRhythmBonus(s, bare)).toBe(1);
    const built = addBuilding(s, "farm", { completesAtTick: NOON + 50 });
    staff(s, built, "farmer");
    expect(stationRhythmSnapshot(s, built.id)).toEqual({ inRhythm: false, note: STATION_RHYTHM_NOTE_BUILDING });
    expect(stationRhythmBonus(s, built)).toBe(1);
    const up = staffedFarm(s);
    s.flags.upgrades_json = [{ id: "u1", buildingId: up.id, fromLevel: 1, doneTick: NOON + 50, ticks: 50, paid: {} }] as never;
    expect(stationRhythmSnapshot(s, up.id)).toEqual({ inRhythm: false, note: STATION_RHYTHM_NOTE_UPGRADING });
    expect(stationRhythmBonus(s, up)).toBe(1);
  });

  it("over a whole day inRhythm is exactly the 900-1979 stretch", () => {
    expect([STATION_RHYTHM_START, STATION_RHYTHM_END]).toEqual([900, 1980]);
    const s = fresh(DAY);
    const f = staffedFarm(s);
    for (let t = DAY; t < DAY + DAY_CYCLE_TICKS; t += 30) {
      s.meta.tick = t;
      const inside = t - DAY >= 900 && t - DAY < 1980;
      expect(stationRhythmWindowAt(t)).toBe(inside);
      expect(stationRhythmSnapshot(s, f.id)!.inRhythm).toBe(inside);
      expect(stationRhythmBonus(s, f)).toBe(inside ? 1.01 : 1);
    }
  });

  it("flag off: null and no bonus", () => {
    const s = fresh(NOON);
    const f = staffedFarm(s);
    setLivingSwitch(s, "stationRhythm", false);
    expect(LIVING_SWITCH_FLAGS.stationRhythm).toBe("living_station_rhythm");
    expect(stationRhythmSnapshot(s, f.id)).toBeNull();
    expect(stationRhythmBonus(s, f)).toBe(1);
  });

  it("is read-only", () => {
    const s = fresh(NOON);
    const f = staffedFarm(s);
    const json = JSON.stringify(s);
    expect(stationRhythmSnapshot(s, f.id)).toEqual(stationRhythmSnapshot(s, f.id));
    expect(JSON.stringify(s)).toBe(json);
  });
});

describe("living realm slice 34: station rhythm economy", () => {
  function pair(tick: number, withStaff = true) {
    const on = fresh(tick);
    const off = fresh(tick);
    for (const s of [on, off]) {
      const f = addBuilding(s, "farm");
      if (withStaff) staff(s, f, "farmer");
    }
    setLivingSwitch(off, "stationRhythm", false);
    return { on, off };
  }

  it("midday: a staffed farm makes exactly 1% more food than with the flag off", () => {
    const { on, off } = pair(NOON);
    // The worker brings some food of their own; the +1% is on the building's share only.
    const worker = structuredClone(off);
    worker.buildings = [];
    const building = economyGain(off, 100, false).food.sub(economyGain(worker, 100, false).food);
    const extra = economyGain(on, 100, false).food.sub(economyGain(off, 100, false).food);
    expect(building.toNumber()).toBeGreaterThan(0);
    expect(extra.div(building).toNumber()).toBeCloseTo(0.01, 9);
  });

  it("outside the stretch, or unstaffed: no change", () => {
    for (const t of [DAWN, MORNING, DUSK, NIGHT]) {
      const { on, off } = pair(t);
      expect(economyGain(on, 100, false).food.toString()).toBe(economyGain(off, 100, false).food.toString());
    }
    const { on, off } = pair(NOON, false);
    expect(economyGain(on, 100, false).food.toString()).toBe(economyGain(off, 100, false).food.toString());
  });

  it("stacks with the slice 33 dawn rest without overlapping it", () => {
    const s = fresh(NOON);
    setLivingSwitch(s, "stationRest", true);
    const f = staffedFarm(s);
    expect(stationRhythmBonus(s, f)).toBe(1.01);
    s.meta.tick = DAWN;
    expect(stationRhythmBonus(s, f)).toBe(1);
  });

  it("rhythm start and end are economy event ticks", () => {
    expect(nextStationRhythmTick(DAY)).toBe(DAY + 900);
    expect(nextStationRhythmTick(DAY + 899)).toBe(DAY + 900);
    expect(nextStationRhythmTick(DAY + 900)).toBe(DAY + 1980);
    expect(nextStationRhythmTick(DAY + 1979)).toBe(DAY + 1980);
    expect(nextStationRhythmTick(DAY + 1980)).toBe(DAY + DAY_CYCLE_TICKS + 900);
    const s = fresh(NOON);
    staffedFarm(s);
    expect(EconomySystem.nextEventTick(s)).toBe(DAY + 1980);
    setLivingSwitch(s, "stationRhythm", false);
    // Slice 35 station focus adds its own event ticks; switch it off too.
    setLivingSwitch(s, "stationFocus", false);
    expect(EconomySystem.nextEventTick(s)).toBeNull();
  });

  it("settling across the whole stretch in one batch matches tick by tick (offline equals online)", () => {
    const a = fresh(MORNING);
    staffedFarm(a);
    a.resources.food = "0";
    const b = structuredClone(a);
    new TickEngine(a).tickMany(1600);
    new TickEngine(b).settleTicks(1600);
    expect(b.meta.tick).toBe(a.meta.tick);
    expect(D(b.resources.food ?? "0").toNumber()).toBeCloseTo(D(a.resources.food ?? "0").toNumber(), 6);
  });

  it("deterministic: same state, same gain", () => {
    const a = fresh(NOON);
    staffedFarm(a);
    const b = fresh(NOON);
    staffedFarm(b);
    expect(economyGain(a, 500, false).food.toString()).toBe(economyGain(b, 500, false).food.toString());
  });
});
