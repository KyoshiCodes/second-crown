import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, setLivingSwitch } from "./livingRealm.js";
import { economyGain, stationPairBonus, stationPairState } from "./economy.js";
import { environmentMood, environmentSnapshot, stationPairSnapshot } from "./livingStatus.js";
import { weatherFor } from "./weather.js";
import { currentSeason } from "./age.js";
import {
  ENVIRONMENT_MOOD_OPEN,
  ENVIRONMENT_MOOD_RESTLESS,
  ENVIRONMENT_MOOD_SOFT,
  ENVIRONMENT_MOOD_STILL,
  STATION_PAIR_MULT,
  STATION_PAIR_NOTE_ALONE,
  STATION_PAIR_NOTE_BUILDING,
  STATION_PAIR_NOTE_LEAD,
  STATION_PAIR_NOTE_TWIN,
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
    x: 3 + s.buildings.length * 3,
    y: 3,
    level: 1,
    completesAtTick: null,
    ...opts,
  } as GameState["buildings"][number];
  s.buildings.push(b);
  return b;
}

const MOODS = [ENVIRONMENT_MOOD_OPEN, ENVIRONMENT_MOOD_RESTLESS, ENVIRONMENT_MOOD_SOFT, ENVIRONMENT_MOOD_STILL];

describe("living realm slice 32: environment mood", () => {
  it("live board: mood follows today's weather and season", () => {
    const s = fresh();
    const env = environmentSnapshot(s)!;
    expect(env.mood).toBe(environmentMood(weatherFor(s), currentSeason(s)));
    expect(MOODS).toContain(env.mood);
    expect(Object.keys(env).sort()).toEqual(["ambient", "features", "lightMark", "mood", "note", "seasonNote", "weatherMark", "windMark"]);
  });

  it("fixed mapping: storm, rain/snow, clear Winter, clear otherwise", () => {
    expect(environmentMood("storm", "Summer")).toBe(ENVIRONMENT_MOOD_RESTLESS);
    expect(environmentMood("storm", "Winter")).toBe(ENVIRONMENT_MOOD_RESTLESS);
    expect(environmentMood("rain", "Spring")).toBe(ENVIRONMENT_MOOD_SOFT);
    expect(environmentMood("snow", "Winter")).toBe(ENVIRONMENT_MOOD_SOFT);
    expect(environmentMood("clear", "Winter")).toBe(ENVIRONMENT_MOOD_STILL);
    expect(environmentMood("clear", "Spring")).toBe(ENVIRONMENT_MOOD_OPEN);
    expect(environmentMood("clear", "Autumn")).toBe(ENVIRONMENT_MOOD_OPEN);
  });

  it("over many ticks every mood is a fixed string and matches the rule", () => {
    const s = fresh();
    for (let t = 0; t < 200000; t += 3000) {
      s.meta.tick = t;
      const env = environmentSnapshot(s)!;
      expect(MOODS).toContain(env.mood);
      expect(env.mood).toBe(environmentMood(weatherFor(s), currentSeason(s)));
    }
  });

  it("living_environment_depth off: mood null, other fields kept", () => {
    const s = fresh();
    const before = environmentSnapshot(s)!;
    setLivingSwitch(s, "environmentDepth", false);
    expect(LIVING_SWITCH_FLAGS.environmentDepth).toBe("living_environment_depth");
    expect(environmentSnapshot(s)).toEqual({ ...before, mood: null });
  });

  it("living_environment off still gives null", () => {
    const s = fresh();
    setLivingSwitch(s, "environment", false);
    expect(environmentSnapshot(s)).toBeNull();
  });

  it("is read-only and deterministic", () => {
    const s = fresh(9);
    const json = JSON.stringify(s);
    expect(environmentSnapshot(s)).toEqual(environmentSnapshot(fresh(9)));
    expect(JSON.stringify(s)).toBe(json);
  });
});

describe("living realm slice 32: station pairing", () => {
  it("unknown id or no station gives null", () => {
    const s = fresh();
    expect(stationPairSnapshot(s, "nope")).toBeNull();
    const g = addBuilding(s, "cottage");
    addBuilding(s, "cottage");
    expect(stationPairSnapshot(s, g.id)).toBeNull();
    expect(stationPairBonus(s, g)).toBe(1);
  });

  it("one farm alone: not paired, no bonus", () => {
    const s = fresh();
    const a = addBuilding(s, "farm");
    expect(stationPairSnapshot(s, a.id)).toEqual({ paired: false, note: STATION_PAIR_NOTE_ALONE });
    expect(stationPairBonus(s, a)).toBe(1);
  });

  it("two finished farms: both paired, +2% on the first only", () => {
    const s = fresh();
    const a = addBuilding(s, "farm");
    const b = addBuilding(s, "farm");
    expect(stationPairSnapshot(s, a.id)).toEqual({ paired: true, note: STATION_PAIR_NOTE_LEAD });
    expect(stationPairSnapshot(s, b.id)).toEqual({ paired: true, note: STATION_PAIR_NOTE_TWIN });
    expect(stationPairBonus(s, a)).toBe(1.02);
    expect(stationPairBonus(s, b)).toBe(1);
    expect(STATION_PAIR_MULT).toBe(1.02);
  });

  it("three farms: still one bonus per type", () => {
    const s = fresh();
    const farms = [addBuilding(s, "farm"), addBuilding(s, "farm"), addBuilding(s, "farm")];
    expect(farms.map((f) => stationPairBonus(s, f))).toEqual([1.02, 1, 1]);
  });

  it("different types do not pair", () => {
    const s = fresh();
    const f = addBuilding(s, "farm");
    addBuilding(s, "lumber_camp");
    expect(stationPairState(s, f)).toEqual({ paired: false, lead: false });
  });

  it("a twin under construction does not pair; it notes that it pairs once built", () => {
    const s = fresh();
    const a = addBuilding(s, "farm");
    const b = addBuilding(s, "farm", { completesAtTick: s.meta.tick + 100 });
    expect(stationPairSnapshot(s, a.id)).toEqual({ paired: false, note: STATION_PAIR_NOTE_ALONE });
    expect(stationPairSnapshot(s, b.id)).toEqual({ paired: false, note: STATION_PAIR_NOTE_BUILDING });
    expect(stationPairBonus(s, a)).toBe(1);
  });

  it("lead is the first finished one in build order", () => {
    const s = fresh();
    const a = addBuilding(s, "farm", { completesAtTick: s.meta.tick + 100 });
    const b = addBuilding(s, "farm");
    const c = addBuilding(s, "farm");
    expect(stationPairBonus(s, a)).toBe(1);
    expect(stationPairBonus(s, b)).toBe(1.02);
    expect(stationPairBonus(s, c)).toBe(1);
  });

  it("another realm's farm does not pair with yours", () => {
    const s = fresh();
    const a = addBuilding(s, "farm");
    addBuilding(s, "farm", { realmId: "npc_1" });
    expect(stationPairState(s, a).paired).toBe(false);
  });

  it("economy: two farms make 1% more food in total (one gets +2%), deterministic", () => {
    const on = fresh();
    addBuilding(on, "farm");
    addBuilding(on, "farm");
    const off = fresh();
    addBuilding(off, "farm");
    addBuilding(off, "farm");
    setLivingSwitch(off, "stationPair", false);
    const a = economyGain(on, 1000, false).food;
    const b = economyGain(off, 1000, false).food;
    const ratio = a.div(b).toNumber();
    expect(ratio).toBeCloseTo(1.01, 9);
    expect(economyGain(on, 1000, false).food.toString()).toBe(a.toString());
  });

  it("economy: a lone farm is unchanged by the pair flag", () => {
    const on = fresh();
    addBuilding(on, "farm");
    const off = fresh();
    addBuilding(off, "farm");
    setLivingSwitch(off, "stationPair", false);
    expect(economyGain(on, 1000, false).food.toString()).toBe(economyGain(off, 1000, false).food.toString());
  });

  it("flag off: null and no bonus", () => {
    const s = fresh();
    const a = addBuilding(s, "farm");
    addBuilding(s, "farm");
    setLivingSwitch(s, "stationPair", false);
    expect(LIVING_SWITCH_FLAGS.stationPair).toBe("living_station_pair");
    expect(stationPairSnapshot(s, a.id)).toBeNull();
    expect(stationPairBonus(s, a)).toBe(1);
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    const a = addBuilding(s, "farm");
    addBuilding(s, "farm");
    const json = JSON.stringify(s);
    expect(stationPairSnapshot(s, a.id)).toEqual(stationPairSnapshot(s, a.id));
    expect(JSON.stringify(s)).toBe(json);
  });
});
