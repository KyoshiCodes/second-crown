import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, setLivingSwitch } from "./livingRealm.js";
import { DAY_CYCLE_TICKS } from "./dayNight.js";
import {
  TERRAIN_RELIEF_HEIGHT,
  audioSnapshot,
  hybridBoardSnapshot,
  lightingSnapshot,
  terrainDepthSnapshot,
  weatherParticleSnapshot,
} from "./presentation.js";
import * as sim from "../index.js";

const NOON = 7 * DAY_CYCLE_TICKS + 1200;

function fresh(seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = NOON;
  ensureBoard(s);
  return s;
}

describe("route B slice 3: hybrid board snapshot", () => {
  it("shape: { provinces, cameraLocked } with { id, x, y, terrain, height } entries", () => {
    const s = fresh();
    const h = hybridBoardSnapshot(s)!;
    expect(Object.keys(h).sort()).toEqual(["cameraLocked", "provinces"]);
    expect(h.cameraLocked).toBe(true);
    expect(h.provinces.length).toBe(s.board.provinces.length);
    expect(h.provinces.length).toBeGreaterThan(0);
    h.provinces.forEach((hp, i) => {
      const p = s.board.provinces[i]!;
      expect(Object.keys(hp).sort()).toEqual(["height", "id", "terrain", "x", "y"]);
      expect(hp).toEqual({ id: p.id, x: p.x, y: p.y, terrain: p.terrain, height: TERRAIN_RELIEF_HEIGHT[p.terrain] });
      expect(hp.height).toBeGreaterThanOrEqual(0);
      expect(hp.height).toBeLessThanOrEqual(1);
    });
  });

  it("height follows terrain elevation", () => {
    const s = fresh();
    s.board.provinces[0]!.terrain = "peak";
    s.board.provinces[1]!.terrain = "plain";
    const h = hybridBoardSnapshot(s)!;
    expect(h.provinces[0]!.height).toBe(1);
    expect(h.provinces[1]!.height).toBe(0);
  });

  it("flag living_hybrid_board false returns null and leaves slice 0/1/2 snapshots alone", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.hybridBoard).toBe("living_hybrid_board");
    setLivingSwitch(s, "hybridBoard", false);
    expect(s.flags.living_hybrid_board).toBe(false);
    expect(hybridBoardSnapshot(s)).toBeNull();
    expect(audioSnapshot(s)).not.toBeNull();
    expect(weatherParticleSnapshot(s)).not.toBeNull();
    expect(lightingSnapshot(s)).not.toBeNull();
    expect(terrainDepthSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "hybridBoard", true);
    expect(hybridBoardSnapshot(s)).not.toBeNull();
  });

  it("slice 0/1/2 flags off do not affect the hybrid board", () => {
    const s = fresh();
    for (const k of ["audio", "weatherParticles", "lighting", "terrainDepth"] as const) setLivingSwitch(s, k, false);
    expect(hybridBoardSnapshot(s)).not.toBeNull();
  });

  it("does not mutate state, and the result does not alias board provinces", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    const h = hybridBoardSnapshot(s)!;
    expect(JSON.stringify(s)).toBe(before);
    h.provinces[0]!.terrain = "peak";
    h.provinces[0]!.x = 999;
    expect(JSON.stringify(s)).toBe(before);
  });

  it("deterministic", () => {
    for (const seed of [1, 7, 42]) {
      expect(hybridBoardSnapshot(fresh(seed))).toEqual(hybridBoardSnapshot(fresh(seed)));
    }
  });

  it("empty board gives an empty list", () => {
    const s = fresh();
    s.board.provinces = [];
    expect(hybridBoardSnapshot(s)).toEqual({ provinces: [], cameraLocked: true });
  });

  it("exported from packages/sim", () => {
    expect(sim.hybridBoardSnapshot).toBe(hybridBoardSnapshot);
  });
});
