import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, setLivingSwitch } from "./livingRealm.js";
import { EconomySystem, economyGain, nextStationCareTick, stationCareBonus } from "./economy.js";
import { environmentSnapshot, environmentWindMark, stationCareSnapshot } from "./livingStatus.js";
import { DAY_CYCLE_TICKS, dayPhaseAt } from "./dayNight.js";
import { weatherFor } from "./weather.js";
import {
  ENVIRONMENT_WIND_MARK,
  STATION_CARE_MULT,
  STATION_CARE_NOTE_BUILDING,
  STATION_CARE_NOTE_CARED,
  STATION_CARE_NOTE_RESTING,
  STATION_CARE_NOTE_UNSTAFFED,
  STATION_CARE_NOTE_UPGRADING,
} from "../content/livingRealm.js";

// Day cycle: dawn 0-539, day 540-1979, dusk 1980-2519, night 2520-3599. Care: all but night (rest on).
const DAY = 7 * DAY_CYCLE_TICKS;
const DAWN = DAY + 100;
const NOON = DAY + 1200;
const DUSK = DAY + 2200;
const NIGHT = DAY + 3000;

const KEYS = ["ambient", "features", "lightMark", "mood", "note", "seasonNote", "weatherMark", "windMark"];

function fresh(tick = NOON, seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = tick;
  ensureBoard(s);
  s.citizens = [];
  s.flags.upgrades_json = [];
  // Keep the slice 33-35 station bonuses out of the care ratios (rest stays on: it is what pauses care).
  setLivingSwitch(s, "stationRhythm", false);
  setLivingSwitch(s, "stationFocus", false);
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

describe("living realm slice 36: environment wind mark", () => {
  it("windMark is added; other fields kept", () => {
    const s = fresh();
    const env = environmentSnapshot(s)!;
    expect(Object.keys(env).sort()).toEqual(KEYS);
    expect(Object.values(ENVIRONMENT_WIND_MARK)).toContain(env.windMark);
  });

  it("fixed strings, read from weather and day phase", () => {
    expect(ENVIRONMENT_WIND_MARK).toEqual({ still: "Still air", soft: "Soft breeze", steady: "Steady wind", gusting: "Gusting" });
    for (const phase of ["dawn", "day", "dusk", "night"]) {
      expect(environmentWindMark("storm", phase)).toBe("Gusting");
      expect(environmentWindMark("rain", phase)).toBe("Steady wind");
      expect(environmentWindMark("snow", phase)).toBe("Still air");
    }
    expect(environmentWindMark("clear", "dawn")).toBe("Still air");
    expect(environmentWindMark("clear", "day")).toBe("Soft breeze");
    expect(environmentWindMark("clear", "dusk")).toBe("Soft breeze");
    expect(environmentWindMark("clear", "night")).toBe("Still air");
  });

  it("matches the live weather and phase across a day", () => {
    const s = fresh();
    for (let t = DAY; t < DAY + DAY_CYCLE_TICKS; t += 60) {
      s.meta.tick = t;
      expect(environmentSnapshot(s)!.windMark).toBe(environmentWindMark(weatherFor(s), dayPhaseAt(t)));
    }
  });

  it("living_environment_wind off: windMark null, other fields kept", () => {
    const s = fresh();
    const before = environmentSnapshot(s)!;
    setLivingSwitch(s, "environmentWind", false);
    expect(LIVING_SWITCH_FLAGS.environmentWind).toBe("living_environment_wind");
    expect(environmentSnapshot(s)).toEqual({ ...before, windMark: null });
  });

  it("is read-only and deterministic", () => {
    const s = fresh(DUSK, 9);
    const json = JSON.stringify(s);
    expect(environmentSnapshot(s)).toEqual(environmentSnapshot(fresh(DUSK, 9)));
    expect(JSON.stringify(s)).toBe(json);
  });
});

describe("living realm slice 36: station care shape", () => {
  it("unknown id or no station gives null", () => {
    const s = fresh();
    expect(stationCareSnapshot(s, "nope")).toBeNull();
    const c = addBuilding(s, "cottage");
    expect(stationCareSnapshot(s, c.id)).toBeNull();
    expect(stationCareBonus(s, c)).toBe(1);
  });

  it("staffed at dawn, noon, dusk: cared with +0.5%", () => {
    const s = fresh();
    const f = staffedFarm(s);
    expect(STATION_CARE_MULT).toBe(1.005);
    for (const t of [DAWN, NOON, DUSK]) {
      s.meta.tick = t;
      expect(stationCareSnapshot(s, f.id)).toEqual({ cared: true, note: STATION_CARE_NOTE_CARED });
      expect(stationCareBonus(s, f)).toBe(1.005);
    }
  });

  it("night with rest on: resting, no bonus; rest off: cared at night too", () => {
    const s = fresh(NIGHT);
    const f = staffedFarm(s);
    expect(stationCareSnapshot(s, f.id)).toEqual({ cared: false, note: STATION_CARE_NOTE_RESTING });
    expect(stationCareBonus(s, f)).toBe(1);
    setLivingSwitch(s, "stationRest", false);
    expect(stationCareSnapshot(s, f.id)).toEqual({ cared: true, note: STATION_CARE_NOTE_CARED });
    expect(stationCareBonus(s, f)).toBe(1.005);
  });

  it("unstaffed, building, upgrading: not cared, no bonus", () => {
    const s = fresh();
    const bare = addBuilding(s, "farm");
    expect(stationCareSnapshot(s, bare.id)).toEqual({ cared: false, note: STATION_CARE_NOTE_UNSTAFFED });
    expect(stationCareBonus(s, bare)).toBe(1);
    const built = addBuilding(s, "farm", { completesAtTick: NOON + 50 });
    staff(s, built, "farmer");
    expect(stationCareSnapshot(s, built.id)).toEqual({ cared: false, note: STATION_CARE_NOTE_BUILDING });
    expect(stationCareBonus(s, built)).toBe(1);
    const up = staffedFarm(s);
    s.flags.upgrades_json = [{ id: "u1", buildingId: up.id, fromLevel: 1, doneTick: NOON + 50, ticks: 50, paid: {} }] as never;
    expect(stationCareSnapshot(s, up.id)).toEqual({ cared: false, note: STATION_CARE_NOTE_UPGRADING });
    expect(stationCareBonus(s, up)).toBe(1);
  });

  it("over a whole day cared is everything but night", () => {
    const s = fresh(DAY);
    const f = staffedFarm(s);
    for (let t = DAY; t < DAY + DAY_CYCLE_TICKS; t += 30) {
      s.meta.tick = t;
      const night = dayPhaseAt(t) === "night";
      expect(stationCareSnapshot(s, f.id)!.cared).toBe(!night);
      expect(stationCareBonus(s, f)).toBe(night ? 1 : 1.005);
    }
  });

  it("flag off: null and no bonus", () => {
    const s = fresh();
    const f = staffedFarm(s);
    setLivingSwitch(s, "stationCare", false);
    expect(LIVING_SWITCH_FLAGS.stationCare).toBe("living_station_care");
    expect(stationCareSnapshot(s, f.id)).toBeNull();
    expect(stationCareBonus(s, f)).toBe(1);
  });

  it("is read-only", () => {
    const s = fresh();
    const f = staffedFarm(s);
    const json = JSON.stringify(s);
    expect(stationCareSnapshot(s, f.id)).toEqual(stationCareSnapshot(s, f.id));
    expect(JSON.stringify(s)).toBe(json);
  });
});

describe("living realm slice 36: station care economy", () => {
  function pair(tick: number, withStaff = true) {
    const on = fresh(tick);
    const off = fresh(tick);
    for (const s of [on, off]) {
      const f = addBuilding(s, "farm");
      if (withStaff) staff(s, f, "farmer");
    }
    setLivingSwitch(off, "stationCare", false);
    return { on, off };
  }

  function buildingShare(off: GameState) {
    const worker = structuredClone(off);
    worker.buildings = [];
    return economyGain(off, 100, false).food.sub(economyGain(worker, 100, false).food);
  }

  it("noon and dusk: a staffed farm makes exactly 0.5% more food than with the flag off", () => {
    for (const t of [NOON, DUSK]) {
      const { on, off } = pair(t);
      const building = buildingShare(off);
      const extra = economyGain(on, 100, false).food.sub(economyGain(off, 100, false).food);
      expect(building.toNumber()).toBeGreaterThan(0);
      expect(extra.div(building).toNumber()).toBeCloseTo(0.005, 9);
    }
  });

  it("night (resting) or unstaffed: no change", () => {
    const night = pair(NIGHT);
    expect(economyGain(night.on, 100, false).food.toString()).toBe(economyGain(night.off, 100, false).food.toString());
    const bare = pair(NOON, false);
    expect(economyGain(bare.on, 100, false).food.toString()).toBe(economyGain(bare.off, 100, false).food.toString());
  });

  it("stacks with slice 35 focus in high light (1.01 x 1.005)", () => {
    const { on, off } = pair(NOON);
    setLivingSwitch(on, "stationFocus", true);
    setLivingSwitch(off, "stationFocus", true);
    const building = buildingShare(off);
    const extra = economyGain(on, 100, false).food.sub(economyGain(off, 100, false).food);
    expect(extra.div(building).toNumber()).toBeCloseTo(0.005, 9);
  });

  it("night start and end are economy event ticks while rest is on", () => {
    expect(nextStationCareTick(DAY)).toBe(DAY + 2520);
    expect(nextStationCareTick(DAY + 2519)).toBe(DAY + 2520);
    expect(nextStationCareTick(DAY + 2520)).toBe(DAY + DAY_CYCLE_TICKS);
    expect(nextStationCareTick(DAY + 3599)).toBe(DAY + DAY_CYCLE_TICKS);
    const s = fresh(DUSK);
    staffedFarm(s);
    setLivingSwitch(s, "stationRest", false);
    expect(EconomySystem.nextEventTick(s)).toBeNull();
    setLivingSwitch(s, "stationRest", true);
    expect(EconomySystem.nextEventTick(s)).toBe(DAY + 2520);
    setLivingSwitch(s, "stationCare", false);
    expect(EconomySystem.nextEventTick(s)).toBe(DAY + DAY_CYCLE_TICKS);
  });

  it("settling across dusk into night in one batch matches tick by tick (offline equals online)", () => {
    const a = fresh(NOON);
    staffedFarm(a);
    a.resources.food = "0";
    const b = structuredClone(a);
    new TickEngine(a).tickMany(2600);
    new TickEngine(b).settleTicks(2600);
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
