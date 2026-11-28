import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, setLivingSwitch } from "./livingRealm.js";
import { EconomySystem, economyGain, nextStationFocusTick, stationFocusBonus, stationFocusWindowAt } from "./economy.js";
import { environmentSnapshot, stationFocusSnapshot } from "./livingStatus.js";
import { DAY_CYCLE_TICKS, dayPhaseAt } from "./dayNight.js";
import {
  ENVIRONMENT_LIGHT_MARK,
  STATION_FOCUS_END,
  STATION_FOCUS_MULT,
  STATION_FOCUS_NOTE_BUILDING,
  STATION_FOCUS_NOTE_FOCUSED,
  STATION_FOCUS_NOTE_RESTING,
  STATION_FOCUS_NOTE_UNSTAFFED,
  STATION_FOCUS_NOTE_UPGRADING,
  STATION_FOCUS_NOTE_WAIT,
  STATION_FOCUS_START,
} from "../content/livingRealm.js";

// Day cycle: dawn 0-539, day 540-1979, dusk 1980-2519, night 2520-3599. Focus: 540-1979 (high light).
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
  // Keep the slice 33 rest and slice 34 rhythm bonuses out of the focus ratios.
  setLivingSwitch(s, "stationRest", false);
  setLivingSwitch(s, "stationRhythm", false);
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

describe("living realm slice 35: environment light mark", () => {
  it("lightMark follows the day phase; other fields kept", () => {
    const s = fresh();
    const env = environmentSnapshot(s)!;
    expect(env.lightMark).toBe("High light");
    expect(Object.keys(env).sort()).toEqual(KEYS);
  });

  it("fixed strings per phase, and matches the phase all day", () => {
    expect(ENVIRONMENT_LIGHT_MARK).toEqual({
      dawn: "Soft dawn",
      day: "High light",
      dusk: "Long shadow",
      night: "Deep quiet",
    });
    const s = fresh();
    for (const [t, mark] of [[DAWN, "Soft dawn"], [MORNING, "High light"], [NOON, "High light"], [DUSK, "Long shadow"], [NIGHT, "Deep quiet"]] as const) {
      s.meta.tick = t;
      expect(environmentSnapshot(s)!.lightMark).toBe(mark);
    }
    for (let t = DAY; t < DAY + DAY_CYCLE_TICKS; t += 45) {
      s.meta.tick = t;
      expect(environmentSnapshot(s)!.lightMark).toBe(ENVIRONMENT_LIGHT_MARK[dayPhaseAt(t)]);
    }
  });

  it("living_environment_light off: lightMark null, other fields kept", () => {
    const s = fresh();
    const before = environmentSnapshot(s)!;
    setLivingSwitch(s, "environmentLight", false);
    expect(LIVING_SWITCH_FLAGS.environmentLight).toBe("living_environment_light");
    expect(environmentSnapshot(s)).toEqual({ ...before, lightMark: null });
  });

  it("is read-only and deterministic", () => {
    const s = fresh(NOON, 9);
    const json = JSON.stringify(s);
    expect(environmentSnapshot(s)).toEqual(environmentSnapshot(fresh(NOON, 9)));
    expect(JSON.stringify(s)).toBe(json);
  });
});

describe("living realm slice 35: station focus shape", () => {
  it("unknown id or no station gives null", () => {
    const s = fresh(NOON);
    expect(stationFocusSnapshot(s, "nope")).toBeNull();
    const c = addBuilding(s, "cottage");
    expect(stationFocusSnapshot(s, c.id)).toBeNull();
    expect(stationFocusBonus(s, c)).toBe(1);
  });

  it("staffed in high light: focused with +1%; dawn and dusk: waiting", () => {
    const s = fresh(NOON);
    const f = staffedFarm(s);
    expect(stationFocusSnapshot(s, f.id)).toEqual({ focused: true, note: STATION_FOCUS_NOTE_FOCUSED });
    expect(stationFocusBonus(s, f)).toBe(1.01);
    expect(STATION_FOCUS_MULT).toBe(1.01);
    s.meta.tick = MORNING;
    expect(stationFocusSnapshot(s, f.id)!.focused).toBe(true);
    for (const t of [DAWN, DUSK]) {
      s.meta.tick = t;
      expect(stationFocusSnapshot(s, f.id)).toEqual({ focused: false, note: STATION_FOCUS_NOTE_WAIT });
      expect(stationFocusBonus(s, f)).toBe(1);
    }
  });

  it("night with rest on: resting note; rest off: waiting note; never a bonus", () => {
    const s = fresh(NIGHT);
    const f = staffedFarm(s);
    expect(stationFocusSnapshot(s, f.id)).toEqual({ focused: false, note: STATION_FOCUS_NOTE_WAIT });
    setLivingSwitch(s, "stationRest", true);
    expect(stationFocusSnapshot(s, f.id)).toEqual({ focused: false, note: STATION_FOCUS_NOTE_RESTING });
    expect(stationFocusBonus(s, f)).toBe(1);
  });

  it("unstaffed, building, upgrading: not focused, no bonus", () => {
    const s = fresh(NOON);
    const bare = addBuilding(s, "farm");
    expect(stationFocusSnapshot(s, bare.id)).toEqual({ focused: false, note: STATION_FOCUS_NOTE_UNSTAFFED });
    expect(stationFocusBonus(s, bare)).toBe(1);
    const built = addBuilding(s, "farm", { completesAtTick: NOON + 50 });
    staff(s, built, "farmer");
    expect(stationFocusSnapshot(s, built.id)).toEqual({ focused: false, note: STATION_FOCUS_NOTE_BUILDING });
    expect(stationFocusBonus(s, built)).toBe(1);
    const up = staffedFarm(s);
    s.flags.upgrades_json = [{ id: "u1", buildingId: up.id, fromLevel: 1, doneTick: NOON + 50, ticks: 50, paid: {} }] as never;
    expect(stationFocusSnapshot(s, up.id)).toEqual({ focused: false, note: STATION_FOCUS_NOTE_UPGRADING });
    expect(stationFocusBonus(s, up)).toBe(1);
  });

  it("over a whole day focused is exactly the 540-1979 stretch (lightMark High light)", () => {
    expect([STATION_FOCUS_START, STATION_FOCUS_END]).toEqual([540, 1980]);
    const s = fresh(DAY);
    const f = staffedFarm(s);
    for (let t = DAY; t < DAY + DAY_CYCLE_TICKS; t += 30) {
      s.meta.tick = t;
      const inside = t - DAY >= 540 && t - DAY < 1980;
      expect(stationFocusWindowAt(t)).toBe(inside);
      expect(stationFocusSnapshot(s, f.id)!.focused).toBe(inside);
      expect(environmentSnapshot(s)!.lightMark === "High light").toBe(inside);
      expect(stationFocusBonus(s, f)).toBe(inside ? 1.01 : 1);
    }
  });

  it("flag off: null and no bonus", () => {
    const s = fresh(NOON);
    const f = staffedFarm(s);
    setLivingSwitch(s, "stationFocus", false);
    expect(LIVING_SWITCH_FLAGS.stationFocus).toBe("living_station_focus");
    expect(stationFocusSnapshot(s, f.id)).toBeNull();
    expect(stationFocusBonus(s, f)).toBe(1);
  });

  it("is read-only", () => {
    const s = fresh(NOON);
    const f = staffedFarm(s);
    const json = JSON.stringify(s);
    expect(stationFocusSnapshot(s, f.id)).toEqual(stationFocusSnapshot(s, f.id));
    expect(JSON.stringify(s)).toBe(json);
  });
});

describe("living realm slice 35: station focus economy", () => {
  function pair(tick: number, withStaff = true) {
    const on = fresh(tick);
    const off = fresh(tick);
    for (const s of [on, off]) {
      const f = addBuilding(s, "farm");
      if (withStaff) staff(s, f, "farmer");
    }
    setLivingSwitch(off, "stationFocus", false);
    return { on, off };
  }

  it("high light: a staffed farm makes exactly 1% more food than with the flag off", () => {
    for (const t of [MORNING, NOON]) {
      const { on, off } = pair(t);
      // The worker brings some food of their own; the +1% is on the building's share only.
      const worker = structuredClone(off);
      worker.buildings = [];
      const building = economyGain(off, 100, false).food.sub(economyGain(worker, 100, false).food);
      const extra = economyGain(on, 100, false).food.sub(economyGain(off, 100, false).food);
      expect(building.toNumber()).toBeGreaterThan(0);
      expect(extra.div(building).toNumber()).toBeCloseTo(0.01, 9);
    }
  });

  it("outside high light, or unstaffed: no change", () => {
    for (const t of [DAWN, DUSK, NIGHT]) {
      const { on, off } = pair(t);
      expect(economyGain(on, 100, false).food.toString()).toBe(economyGain(off, 100, false).food.toString());
    }
    const { on, off } = pair(NOON, false);
    expect(economyGain(on, 100, false).food.toString()).toBe(economyGain(off, 100, false).food.toString());
  });

  it("stacks with slice 34 rhythm at midday (1.01 x 1.01)", () => {
    const { on, off } = pair(NOON);
    setLivingSwitch(on, "stationRhythm", true);
    setLivingSwitch(off, "stationRhythm", true);
    setLivingSwitch(off, "stationFocus", false);
    const worker = structuredClone(off);
    worker.buildings = [];
    const building = economyGain(off, 100, false).food.sub(economyGain(worker, 100, false).food);
    const extra = economyGain(on, 100, false).food.sub(economyGain(off, 100, false).food);
    expect(extra.div(building).toNumber()).toBeCloseTo(0.01, 9);
  });

  it("focus start and end are economy event ticks", () => {
    expect(nextStationFocusTick(DAY)).toBe(DAY + 540);
    expect(nextStationFocusTick(DAY + 539)).toBe(DAY + 540);
    expect(nextStationFocusTick(DAY + 540)).toBe(DAY + 1980);
    expect(nextStationFocusTick(DAY + 1979)).toBe(DAY + 1980);
    expect(nextStationFocusTick(DAY + 1980)).toBe(DAY + DAY_CYCLE_TICKS + 540);
    const s = fresh(DAWN);
    staffedFarm(s);
    expect(EconomySystem.nextEventTick(s)).toBe(DAY + 540);
    setLivingSwitch(s, "stationFocus", false);
    expect(EconomySystem.nextEventTick(s)).toBeNull();
  });

  it("settling across the whole stretch in one batch matches tick by tick (offline equals online)", () => {
    const a = fresh(DAWN);
    staffedFarm(a);
    a.resources.food = "0";
    const b = structuredClone(a);
    new TickEngine(a).tickMany(2200);
    new TickEngine(b).settleTicks(2200);
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
