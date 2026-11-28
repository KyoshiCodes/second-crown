import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, setLivingSwitch } from "./livingRealm.js";
import { weatherFor, type Weather } from "./weather.js";
import { DAY_CYCLE_TICKS, dayPhase } from "./dayNight.js";
import {
  LIGHTING_PHASE_INTENSITY,
  LIGHTING_WEATHER_INTENSITY,
  LIGHTING_WEATHER_TINT,
  audioSnapshot,
  lightingSnapshot,
  weatherParticleSnapshot,
} from "./presentation.js";
import * as sim from "../index.js";

const DAY = 7 * DAY_CYCLE_TICKS;
const DAWN = DAY + 100;
const NOON = DAY + 1200;
const DUSK = DAY + 2200;
const NIGHT = DAY + 3000;

function fresh(tick = NOON, seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = tick;
  ensureBoard(s);
  return s;
}

/** First seed (1..500) whose weather at `tick` is `w`. */
function withWeather(w: Weather, tick = NOON): GameState {
  for (let seed = 1; seed <= 500; seed++) {
    const s = fresh(tick, seed);
    if (weatherFor(s) === w) return s;
  }
  throw new Error(`no seed with ${w} at ${tick}`);
}

function snowState(): GameState {
  for (let day = 0; day < 400; day++) {
    for (let seed = 1; seed <= 40; seed++) {
      const s = fresh(day * DAY_CYCLE_TICKS + 1200, seed);
      if (weatherFor(s) === "snow") return s;
    }
  }
  throw new Error("no snow found");
}

describe("route B slice 1: lighting snapshot", () => {
  it("shape: { timeOfDay, weatherTint, intensity }", () => {
    const l = lightingSnapshot(fresh())!;
    expect(Object.keys(l).sort()).toEqual(["intensity", "timeOfDay", "weatherTint"]);
    expect(["dawn", "day", "dusk", "night"]).toContain(l.timeOfDay);
    expect(["clear", "rain", "storm", "snow"]).toContain(l.weatherTint);
    expect(typeof l.intensity).toBe("number");
    expect(l.intensity).toBeGreaterThanOrEqual(0);
    expect(l.intensity).toBeLessThanOrEqual(1);
  });

  it("timeOfDay follows the day cycle", () => {
    expect(lightingSnapshot(fresh(DAWN))!.timeOfDay).toBe("dawn");
    expect(lightingSnapshot(fresh(NOON))!.timeOfDay).toBe("day");
    expect(lightingSnapshot(fresh(DUSK))!.timeOfDay).toBe("dusk");
    expect(lightingSnapshot(fresh(NIGHT))!.timeOfDay).toBe("night");
  });

  it("weatherTint follows weather", () => {
    expect(lightingSnapshot(withWeather("clear"))!.weatherTint).toBe("clear");
    expect(lightingSnapshot(withWeather("rain"))!.weatherTint).toBe("rain");
    expect(lightingSnapshot(withWeather("storm"))!.weatherTint).toBe("storm");
    expect(lightingSnapshot(snowState())!.weatherTint).toBe("snow");
  });

  it("intensity = phase base + weather add, clamped 0-1", () => {
    expect(lightingSnapshot(withWeather("clear", NOON))!.intensity).toBe(0);
    const storm = withWeather("storm", NOON);
    expect(lightingSnapshot(storm)!.intensity).toBeCloseTo(LIGHTING_WEATHER_INTENSITY.storm, 10);
    const s = fresh(DAY);
    for (let t = DAY; t < DAY + DAY_CYCLE_TICKS; t += 120) {
      s.meta.tick = t;
      const l = lightingSnapshot(s)!;
      const expected = Math.min(1, LIGHTING_PHASE_INTENSITY[dayPhase(s)] + LIGHTING_WEATHER_INTENSITY[weatherFor(s)]);
      expect(l.intensity).toBeCloseTo(expected, 3);
      expect(l.timeOfDay).toBe(dayPhase(s));
      expect(l.weatherTint).toBe(LIGHTING_WEATHER_TINT[weatherFor(s)]);
      expect(l.intensity).toBeGreaterThanOrEqual(0);
      expect(l.intensity).toBeLessThanOrEqual(1);
    }
  });

  it("flag living_lighting false returns null, leaves slice 0 snapshots alone", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.lighting).toBe("living_lighting");
    setLivingSwitch(s, "lighting", false);
    expect(s.flags.living_lighting).toBe(false);
    expect(lightingSnapshot(s)).toBeNull();
    expect(audioSnapshot(s)).not.toBeNull();
    expect(weatherParticleSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "lighting", true);
    expect(lightingSnapshot(s)).not.toBeNull();
  });

  it("slice 0 flags off do not affect lighting", () => {
    const s = fresh();
    setLivingSwitch(s, "audio", false);
    setLivingSwitch(s, "weatherParticles", false);
    expect(lightingSnapshot(s)).not.toBeNull();
  });

  it("does not mutate state and is deterministic", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    lightingSnapshot(s);
    expect(JSON.stringify(s)).toBe(before);
    for (const t of [DAWN, NOON, DUSK, NIGHT]) {
      expect(lightingSnapshot(fresh(t, 7))).toEqual(lightingSnapshot(fresh(t, 7)));
    }
  });

  it("exported from packages/sim", () => {
    expect(sim.lightingSnapshot).toBe(lightingSnapshot);
  });
});
