import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, setLivingSwitch } from "./livingRealm.js";
import { weatherFor, type Weather } from "./weather.js";
import { DAY_CYCLE_TICKS, dayPhase } from "./dayNight.js";
import {
  AUDIO_AMBIENT,
  AUDIO_NIGHT_FACTOR,
  AUDIO_VOLUME,
  AUDIO_WEATHER_LAYER,
  WEATHER_PARTICLES,
  audioSnapshot,
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

/** Tick in some later season where some seed gives snow (Winter). */
function snowState(): GameState {
  for (let day = 0; day < 400; day++) {
    for (let seed = 1; seed <= 40; seed++) {
      const s = fresh(day * DAY_CYCLE_TICKS + 1200, seed);
      if (weatherFor(s) === "snow") return s;
    }
  }
  throw new Error("no snow found");
}

describe("route B slice 0: audio snapshot", () => {
  it("shape: { ambient, weatherLayer, volume } with fixed ids and 0-1 volume", () => {
    const a = audioSnapshot(fresh())!;
    expect(Object.keys(a).sort()).toEqual(["ambient", "volume", "weatherLayer"]);
    expect(Object.values(AUDIO_AMBIENT)).toContain(a.ambient);
    expect(["clear", "rain", "wind", "mist"]).toContain(a.weatherLayer);
    expect(typeof a.volume).toBe("number");
    expect(a.volume).toBeGreaterThanOrEqual(0);
    expect(a.volume).toBeLessThanOrEqual(1);
  });

  it("ambient follows the day phase", () => {
    expect(audioSnapshot(fresh(DAWN))!.ambient).toBe("hold_dawn");
    expect(audioSnapshot(fresh(NOON))!.ambient).toBe("hold_day");
    expect(audioSnapshot(fresh(DUSK))!.ambient).toBe("hold_dusk");
    expect(audioSnapshot(fresh(NIGHT))!.ambient).toBe("hold_night");
  });

  it("weather layer: clear, rain, storm -> wind, snow -> mist", () => {
    expect(audioSnapshot(withWeather("clear"))!.weatherLayer).toBe("clear");
    expect(audioSnapshot(withWeather("rain"))!.weatherLayer).toBe("rain");
    expect(audioSnapshot(withWeather("storm"))!.weatherLayer).toBe("wind");
    expect(audioSnapshot(snowState())!.weatherLayer).toBe("mist");
    expect(AUDIO_WEATHER_LAYER).toEqual({ clear: "clear", rain: "rain", storm: "wind", snow: "mist" });
  });

  it("volume: base per weather, night quieter", () => {
    for (const w of ["clear", "rain", "storm"] as Weather[]) {
      const day = withWeather(w, NOON);
      expect(audioSnapshot(day)!.volume).toBe(AUDIO_VOLUME[w]);
      const night = fresh(NIGHT, day.meta.seed);
      if (weatherFor(night) === w) expect(audioSnapshot(night)!.volume).toBeCloseTo(AUDIO_VOLUME[w] * AUDIO_NIGHT_FACTOR, 10);
    }
    for (const v of Object.values(AUDIO_VOLUME)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("matches live weather and phase over a day", () => {
    const s = fresh(DAY);
    for (let t = DAY; t < DAY + DAY_CYCLE_TICKS; t += 120) {
      s.meta.tick = t;
      const a = audioSnapshot(s)!;
      expect(a.ambient).toBe(AUDIO_AMBIENT[dayPhase(s)]);
      expect(a.weatherLayer).toBe(AUDIO_WEATHER_LAYER[weatherFor(s)]);
    }
  });

  it("flag living_audio false returns null", () => {
    const s = fresh();
    setLivingSwitch(s, "audio", false);
    expect(s.flags[LIVING_SWITCH_FLAGS.audio]).toBe(false);
    expect(LIVING_SWITCH_FLAGS.audio).toBe("living_audio");
    expect(audioSnapshot(s)).toBeNull();
    expect(weatherParticleSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "audio", true);
    expect(audioSnapshot(s)).not.toBeNull();
  });
});

describe("route B slice 0: weather particle snapshot", () => {
  it("shape: { kind, intensity }", () => {
    const p = weatherParticleSnapshot(fresh())!;
    expect(Object.keys(p).sort()).toEqual(["intensity", "kind"]);
    expect(["rain", "mist", "none"]).toContain(p.kind);
    expect(p.intensity).toBeGreaterThanOrEqual(0);
    expect(p.intensity).toBeLessThanOrEqual(1);
  });

  it("driven by weather: clear none, rain rain, storm heavy rain, snow mist", () => {
    expect(weatherParticleSnapshot(withWeather("clear"))).toEqual({ kind: "none", intensity: 0 });
    expect(weatherParticleSnapshot(withWeather("rain"))).toEqual({ kind: "rain", intensity: 0.6 });
    expect(weatherParticleSnapshot(withWeather("storm"))).toEqual({ kind: "rain", intensity: 1 });
    expect(weatherParticleSnapshot(snowState())).toEqual({ kind: "mist", intensity: 0.5 });
    for (const p of Object.values(WEATHER_PARTICLES)) {
      expect(p.intensity).toBeGreaterThanOrEqual(0);
      expect(p.intensity).toBeLessThanOrEqual(1);
    }
  });

  it("returns a copy, not the shared table", () => {
    const s = withWeather("rain");
    const p = weatherParticleSnapshot(s)!;
    p.intensity = 0;
    expect(weatherParticleSnapshot(s)!.intensity).toBe(0.6);
  });

  it("flag living_weather_particles false returns null", () => {
    const s = fresh();
    setLivingSwitch(s, "weatherParticles", false);
    expect(LIVING_SWITCH_FLAGS.weatherParticles).toBe("living_weather_particles");
    expect(weatherParticleSnapshot(s)).toBeNull();
    expect(audioSnapshot(s)).not.toBeNull();
  });
});

describe("route B slice 0: read-only and deterministic", () => {
  it("does not mutate state", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    audioSnapshot(s);
    weatherParticleSnapshot(s);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("same seed and tick give the same snapshots", () => {
    for (const t of [DAWN, NOON, DUSK, NIGHT]) {
      expect(audioSnapshot(fresh(t, 7))).toEqual(audioSnapshot(fresh(t, 7)));
      expect(weatherParticleSnapshot(fresh(t, 7))).toEqual(weatherParticleSnapshot(fresh(t, 7)));
    }
  });

  it("exported from packages/sim", () => {
    expect(sim.audioSnapshot).toBe(audioSnapshot);
    expect(sim.weatherParticleSnapshot).toBe(weatherParticleSnapshot);
  });
});
