import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, setLivingSwitch } from "./livingRealm.js";
import { fogThickness, weatherFor, type Weather } from "./weather.js";
import { DAY_CYCLE_TICKS } from "./dayNight.js";
import { isProvinceSeen, revealProvince } from "./fog.js";
import {
  TERRAIN_RELIEF_BANDS,
  TERRAIN_RELIEF_HEIGHT,
  TERRAIN_SHADOW_WEATHER,
  audioSnapshot,
  lightingSnapshot,
  terrainDepthSnapshot,
  weatherParticleSnapshot,
} from "./presentation.js";
import * as sim from "../index.js";

const NOON = 7 * DAY_CYCLE_TICKS + 1200;

function fresh(tick = NOON, seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = tick;
  ensureBoard(s);
  return s;
}

function withWeather(w: Weather): GameState {
  for (let seed = 1; seed <= 500; seed++) {
    const s = fresh(NOON, seed);
    if (weatherFor(s) === w) return s;
  }
  throw new Error(`no seed with ${w}`);
}

function meanHeight(s: GameState): number {
  const ps = s.board.provinces;
  return ps.reduce((a, p) => a + TERRAIN_RELIEF_HEIGHT[p.terrain], 0) / ps.length;
}

function unseen(s: GameState): number {
  const ps = s.board.provinces;
  return ps.filter((p) => !isProvinceSeen(s, p.id)).length / ps.length;
}

describe("route B slice 2: terrain depth snapshot", () => {
  it("shape: { relief, shadowStrength, fogDensity }", () => {
    const t = terrainDepthSnapshot(fresh())!;
    expect(Object.keys(t).sort()).toEqual(["fogDensity", "relief", "shadowStrength"]);
    expect(["low", "mid", "high"]).toContain(t.relief);
    for (const v of [t.shadowStrength, t.fogDensity]) {
      expect(typeof v).toBe("number");
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("relief follows the board's mean terrain height", () => {
    const s = fresh();
    for (const p of s.board.provinces) p.terrain = "plain";
    expect(terrainDepthSnapshot(s)!.relief).toBe("low");
    for (const p of s.board.provinces) p.terrain = "hill";
    expect(terrainDepthSnapshot(s)!.relief).toBe("high");
    for (const p of s.board.provinces) p.terrain = "wood";
    expect(TERRAIN_RELIEF_HEIGHT.wood).toBeGreaterThanOrEqual(TERRAIN_RELIEF_BANDS.mid);
    expect(terrainDepthSnapshot(s)!.relief).toBe("mid");
  });

  it("shadowStrength rises with relief and softens under overcast weather", () => {
    const clear = withWeather("clear");
    const expected = (0.25 + 0.75 * meanHeight(clear)) * TERRAIN_SHADOW_WEATHER.clear;
    expect(terrainDepthSnapshot(clear)!.shadowStrength).toBeCloseTo(Math.min(1, expected), 3);
    for (const p of clear.board.provinces) p.terrain = "plain";
    const flat = terrainDepthSnapshot(clear)!.shadowStrength;
    for (const p of clear.board.provinces) p.terrain = "peak";
    expect(terrainDepthSnapshot(clear)!.shadowStrength).toBeGreaterThan(flat);

    const storm = withWeather("storm");
    for (const p of storm.board.provinces) p.terrain = "peak";
    expect(terrainDepthSnapshot(storm)!.shadowStrength).toBeCloseTo(TERRAIN_SHADOW_WEATHER.storm, 3);
  });

  it("fogDensity = unseen share x fog thickness, clamped; thins as provinces are revealed", () => {
    const s = fresh();
    const before = terrainDepthSnapshot(s)!.fogDensity;
    expect(before).toBeCloseTo(Math.min(1, unseen(s) * fogThickness(weatherFor(s))), 3);
    for (const p of s.board.provinces) revealProvince(s, p.id);
    expect(terrainDepthSnapshot(s)!.fogDensity).toBe(0);
    expect(before).toBeGreaterThan(0);
  });

  it("flag living_terrain_depth false returns null, leaves slice 0/1 snapshots alone", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.terrainDepth).toBe("living_terrain_depth");
    setLivingSwitch(s, "terrainDepth", false);
    expect(s.flags.living_terrain_depth).toBe(false);
    expect(terrainDepthSnapshot(s)).toBeNull();
    expect(audioSnapshot(s)).not.toBeNull();
    expect(weatherParticleSnapshot(s)).not.toBeNull();
    expect(lightingSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "terrainDepth", true);
    expect(terrainDepthSnapshot(s)).not.toBeNull();
  });

  it("slice 0/1 flags off do not affect terrain depth", () => {
    const s = fresh();
    setLivingSwitch(s, "audio", false);
    setLivingSwitch(s, "weatherParticles", false);
    setLivingSwitch(s, "lighting", false);
    expect(terrainDepthSnapshot(s)).not.toBeNull();
  });

  it("does not mutate state (even with no fog_seen yet) and is deterministic", () => {
    const s = fresh();
    delete s.flags.fog_seen;
    const before = JSON.stringify(s);
    terrainDepthSnapshot(s);
    expect(JSON.stringify(s)).toBe(before);
    expect("fog_seen" in s.flags).toBe(false);
    for (const seed of [1, 7, 42]) {
      expect(terrainDepthSnapshot(fresh(NOON, seed))).toEqual(terrainDepthSnapshot(fresh(NOON, seed)));
    }
  });

  it("empty board gives a flat, clear snapshot", () => {
    const s = fresh();
    s.board.provinces = [];
    const t = terrainDepthSnapshot(s)!;
    expect(t.relief).toBe("low");
    expect(t.fogDensity).toBe(0);
  });

  it("exported from packages/sim", () => {
    expect(sim.terrainDepthSnapshot).toBe(terrainDepthSnapshot);
  });
});
