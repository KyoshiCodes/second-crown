import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "./tickEngine.js";
import { D } from "./decimal.js";

describe("TickEngine determinism (Invariant 2)", () => {
  it("empty world: one-by-one vs settleTicks produce identical state", () => {
    const seed = 12345;
    const N = 1000;

    const stateA = createGameState({ seed, now: 1_000_000 });
    const engineA = new TickEngine(stateA);
    engineA.tickMany(N);

    const stateB = createGameState({ seed, now: 1_000_000 });
    const engineB = new TickEngine(stateB);
    engineB.settleTicks(N);

    expect(engineA.getState().meta.tick).toBe(N);
    expect(engineB.getState().meta.tick).toBe(N);
    expect(engineA.getState()).toEqual(engineB.getState());
  });

  it("with buildings: one-by-one vs settleTicks produce identical resources", () => {
    const seed = 99;
    const N = 200;

    const stateA = createGameState({ seed, now: 1_000_000, withStarterBuildings: true });
    const engineA = new TickEngine(stateA);
    engineA.tickMany(N);

    const stateB = createGameState({ seed, now: 1_000_000, withStarterBuildings: true });
    const engineB = new TickEngine(stateB);
    engineB.settleTicks(N);

    const sA = engineA.getState();
    const sB = engineB.getState();

    expect(sA.meta.tick).toBe(N);
    expect(sB.meta.tick).toBe(N);
    expect(sA.resources.food).toBe(sB.resources.food);
    expect(sA.resources.wood).toBe(sB.resources.wood);
    expect(sA.resources.gold).toBe(sB.resources.gold);
    expect(sA.resources.stone).toBe(sB.resources.stone);
    expect(sA.buildings.map((b) => b.completesAtTick)).toEqual(
      sB.buildings.map((b) => b.completesAtTick)
    );
    expect(sA).toEqual(sB);
  });

  it("production actually increases resources", () => {
    const state = createGameState({ seed: 1, withStarterBuildings: true });
    const engine = new TickEngine(state);

    engine.tickMany(100);

    const food = D(engine.getState().resources.food ?? "0");
    expect(food.gte(9.9)).toBe(true);
    expect(food.lte(10.1)).toBe(true);

    const wood = D(engine.getState().resources.wood ?? "0");
    expect(wood.gte(3.9)).toBe(true);
    expect(wood.lte(4.1)).toBe(true);
  });

  it("same seed produces same initial state", () => {
    const a = createGameState({ seed: 42, now: 99 });
    const b = createGameState({ seed: 42, now: 99 });
    expect(a).toEqual(b);
  });
});

describe("mulberry32", () => {
  it("is deterministic for a given seed", async () => {
    const { mulberry32 } = await import("./rng.js");
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const seq1 = Array.from({ length: 20 }, () => rng1());
    const seq2 = Array.from({ length: 20 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it("produces values in [0, 1)", async () => {
    const { mulberry32 } = await import("./rng.js");
    const rng = mulberry32(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("event-horizon", () => {
  it("jumps over long empty stretches without losing determinism", () => {
    const seed = 7;
    const N = 10_000;

    const stateA = createGameState({ seed, now: 1, withStarterBuildings: true });
    const engineA = new TickEngine(stateA);
    engineA.tickMany(N);

    const stateB = createGameState({ seed, now: 1, withStarterBuildings: true });
    const engineB = new TickEngine(stateB);
    engineB.settleTicks(N);

    expect(engineA.getState().resources).toEqual(engineB.getState().resources);
    expect(engineA.getState().meta.tick).toBe(engineB.getState().meta.tick);
  });
});
