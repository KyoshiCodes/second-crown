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
    expect(sA).toEqual(sB);
  });

  it("production actually increases resources", () => {
    const state = createGameState({ seed: 1, withStarterBuildings: true });
    const engine = new TickEngine(state);

    engine.tickMany(100);

    expect(D(engine.getState().resources.food ?? "0").eq(300)).toBe(true);

    // Lumber finishes at 30 → 71 × 3 building wood, plus woodcutter labor after hire.
    const wood = D(engine.getState().resources.wood ?? "0").toNumber();
    expect(wood).toBeGreaterThanOrEqual(213);
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
    expect(Array.from({ length: 20 }, () => rng1())).toEqual(
      Array.from({ length: 20 }, () => rng2())
    );
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
