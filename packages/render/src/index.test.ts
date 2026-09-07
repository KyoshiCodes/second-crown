import { describe, it, expect } from "vitest";
import {
  roleForCitizenJob,
  pickDestination,
  type Walker,
  bandForZoom,
  ZOOM_THRESHOLD,
  provinceTokenBounds,
  hitTestProvince,
  calculateMarchProgress,
  terrainChipPalette,
} from "./index.js";
import type { GameState } from "@second-crown/shared";

function createMockWalker(id: number = 0, x: number = 0, y: number = 0): Walker {
  return {
    id,
    role: "villager",
    x,
    y,
    targetX: x,
    targetY: y,
    state: "idle",
    idleTime: 0,
    speed: 0.8,
    facing: 1,
    walkDist: 0,
    idlePhase: 0,
    graphics: {} as any,
  };
}

function createMockState(): GameState {
  return {
    meta: { version: 1, seed: 1, tick: 0, lastRealTime: 0, playTimeMs: 0 },
    resources: {},
    buildings: [],
    units: [],
    citizens: [],
    realms: [],
    characters: [],
    opinions: [],
    wars: [],
    factions: [],
    inputLog: [],
    flags: {},
    unlocks: [],
  };
}

describe("packages/render walker roles and pickDestination", () => {
  it("maps citizen jobs to matching walker roles", () => {
    expect(roleForCitizenJob("farmer")).toBe("villager");
    expect(roleForCitizenJob("woodcutter")).toBe("woodcutter");
    expect(roleForCitizenJob("miner")).toBe("miner");
    expect(roleForCitizenJob("merchant")).toBe("merchant");
    expect(roleForCitizenJob("guard")).toBe("guard");
    expect(roleForCitizenJob("scholar")).toBe("scholar");
    expect(roleForCitizenJob("unassigned")).toBe("villager");
    expect(roleForCitizenJob("unknown")).toBe("villager");
  });

  it("sends walker to player worker tile with matching role when citizens exist", () => {
    const state = createMockState();
    state.citizens.push({
      id: "c1",
      realmId: "player",
      job: "woodcutter",
      tile: { x: 5, y: 7 },
    });

    const walker = createMockWalker(0, 0, 0);
    pickDestination(walker, state);

    expect(walker.role).toBe("woodcutter");
    expect(walker.targetX).toBe(5);
    expect(walker.targetY).toBe(7);
    expect(walker.state).toBe("walking");
    expect(walker.facing).toBe(1);
  });

  it("maps walker id to matching player worker by modulo index", () => {
    const state = createMockState();
    state.citizens.push(
      { id: "c1", realmId: "player", job: "farmer", tile: { x: 2, y: 3 } },
      { id: "c2", realmId: "player", job: "guard", tile: { x: 8, y: 9 } }
    );

    const w0 = createMockWalker(0, 0, 0);
    const w1 = createMockWalker(1, 0, 0);
    const w2 = createMockWalker(2, 0, 0);

    pickDestination(w0, state);
    pickDestination(w1, state);
    pickDestination(w2, state);

    expect(w0.role).toBe("villager");
    expect(w0.targetX).toBe(2);
    expect(w0.targetY).toBe(3);

    expect(w1.role).toBe("guard");
    expect(w1.targetX).toBe(8);
    expect(w1.targetY).toBe(9);

    // w2 wraps around to worker 0
    expect(w2.role).toBe("villager");
    expect(w2.targetX).toBe(2);
    expect(w2.targetY).toBe(3);
  });

  it("ignores non-player citizens or citizens without a tile", () => {
    const state = createMockState();
    state.citizens.push(
      { id: "enemy_c", realmId: "rival", job: "guard", tile: { x: 1, y: 1 } },
      { id: "unassigned_c", realmId: "player", job: "guard", tile: null }
    );

    const walker = createMockWalker(0, 0, 0);
    pickDestination(walker, state);

    // Falls back to random wander (default center bounds 6..9, 3..5)
    expect(walker.targetX).toBeGreaterThanOrEqual(6);
    expect(walker.targetX).toBeLessThanOrEqual(9);
    expect(walker.targetY).toBeGreaterThanOrEqual(3);
    expect(walker.targetY).toBeLessThanOrEqual(5);
  });

  it("falls back to random wander when state has no citizens", () => {
    const state = createMockState();
    const walker = createMockWalker(0, 0, 0);
    pickDestination(walker, state);

    expect(walker.targetX).toBeGreaterThanOrEqual(6);
    expect(walker.targetX).toBeLessThanOrEqual(9);
    expect(walker.targetY).toBeGreaterThanOrEqual(3);
    expect(walker.state).toBe("walking");
  });
});

describe("packages/render two-band camera and tabletop board helpers", () => {
  it("determines camera band based on ZOOM_THRESHOLD", () => {
    expect(bandForZoom(1.0)).toBe("hold");
    expect(bandForZoom(0.71)).toBe("hold");
    expect(bandForZoom(ZOOM_THRESHOLD)).toBe("board");
    expect(bandForZoom(0.58)).toBe("board");
    expect(bandForZoom(0.45)).toBe("board");
  });

  it("calculates 8x6 province token bounds within diorama viewport", () => {
    const origin = provinceTokenBounds(0, 0);
    expect(origin.x).toBe(35);
    expect(origin.y).toBe(27);
    expect(origin.w).toBe(56);
    expect(origin.h).toBe(46);
    expect(origin.cx).toBe(35 + 28);
    expect(origin.cy).toBe(27 + 23);

    // Far corner token (column 7, row 5)
    const far = provinceTokenBounds(7, 5);
    expect(far.x + far.w).toBeLessThanOrEqual(544); // within RIM_SIZE=16 to 544
    expect(far.y + far.h).toBeLessThanOrEqual(344); // within RIM_SIZE=16 to 344
  });

  it("hit tests province tokens on the board", () => {
    const b0 = provinceTokenBounds(2, 3);
    const hit = hitTestProvince(b0.cx, b0.cy);
    expect(hit).toEqual({ bx: 2, by: 3 });

    // Click in the gap between tokens
    const miss = hitTestProvince(35 + 56 + 2, 27);
    expect(miss).toBeNull();
  });

  it("lerps march progress accurately across elapsed ticks", () => {
    // 2 steps distance = 30 ticks total
    const dist = 2;
    const arrivesTick = 100;
    // startTick = 100 - 30 = 70

    expect(calculateMarchProgress(50, arrivesTick, dist)).toBe(0);
    expect(calculateMarchProgress(70, arrivesTick, dist)).toBe(0);
    expect(calculateMarchProgress(85, arrivesTick, dist)).toBe(0.5);
    expect(calculateMarchProgress(100, arrivesTick, dist)).toBe(1);
    expect(calculateMarchProgress(120, arrivesTick, dist)).toBe(1);
  });

  it("provides rich palette colors for all six board terrain chips", () => {
    for (const t of ["plain", "wood", "hill", "waste", "shore", "peak"] as const) {
      const p = terrainChipPalette(t);
      expect(p.fill).toBeGreaterThan(0);
      expect(p.fillDark).toBeGreaterThan(0);
      expect(p.border).toBeGreaterThan(0);
      expect(p.accent).toBeGreaterThan(0);
    }
  });
});
