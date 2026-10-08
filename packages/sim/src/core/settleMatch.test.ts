import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { MAX_OFFLINE_MS } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "./tickEngine.js";
import { storageCap } from "../systems/storage.js";
import { EconomySystem } from "../systems/economy.js";
import { applyOfflineProgress } from "../offline.js";
import { D } from "./decimal.js";

const STORES = ["food", "wood", "stone", "gold"];

function militia(state: GameState): number {
  const m = state.units.find((u) => u.realmId === "player" && u.typeId === "militia");
  return m ? D(m.count).toNumber() : 0;
}

function twins(setup: (s: GameState) => void): [GameState, GameState] {
  const a = createGameState({ seed: 7, now: 0, withStarterBuildings: true });
  setup(a);
  return [a, structuredClone(a)];
}

function expectSameStores(a: GameState, b: GameState): void {
  for (const res of STORES) {
    expect(D(b.resources[res] ?? "0").toNumber(), res).toBeCloseTo(D(a.resources[res] ?? "0").toNumber(), 6);
  }
}

describe("a batch ends like the same ticks one at a time", () => {
  it("twenty starving ticks and one twenty-tick batch lose the same militia", () => {
    const [byTick, byBatch] = twins((s) => {
      s.resources.food = "0";
      s.units.push({ id: "u_m", typeId: "militia", realmId: "player", count: "500", armyId: null });
    });
    new TickEngine(byTick).tickMany(20);
    new TickEngine(byBatch).settleTicks(20);
    expect(militia(byTick)).toBeLessThan(499);
    expect(militia(byBatch)).toBe(militia(byTick));
    expect(byBatch.meta.tick).toBe(20);
  });

  it("starving across many stretches still matches, and ends with the militia gone", () => {
    const [byTick, byBatch] = twins((s) => {
      s.resources.food = "0";
      s.units.push({ id: "u_m", typeId: "militia", realmId: "player", count: "60", armyId: null });
    });
    new TickEngine(byTick).tickMany(2_000);
    new TickEngine(byBatch).settleTicks(2_000);
    expect(militia(byBatch)).toBe(militia(byTick));
    expectSameStores(byTick, byBatch);
  });

  it("a full-store batch matches the tick-by-tick stores", () => {
    const [byTick, byBatch] = twins((s) => {
      for (const res of STORES) s.resources[res] = String(storageCap(s, res));
      s.units.push({ id: "u_m", typeId: "militia", realmId: "player", count: "5", armyId: null });
    });
    new TickEngine(byTick).tickMany(50);
    new TickEngine(byBatch).settleTicks(50);
    expectSameStores(byTick, byBatch);
    expect(militia(byBatch)).toBe(militia(byTick));
  });

  it("a store that fills partway through a long catch-up matches tick-by-tick", () => {
    const [byTick, byBatch] = twins((s) => {
      s.resources.food = "150";
      s.resources.wood = "0";
      s.units.push({ id: "u_m", typeId: "militia", realmId: "player", count: "2", armyId: null });
    });
    new TickEngine(byTick).tickMany(5_000);
    new TickEngine(byBatch).settleTicks(5_000);
    expect(D(byTick.resources.food).toNumber()).toBeGreaterThan(150);
    expectSameStores(byTick, byBatch);
    expect(militia(byBatch)).toBe(militia(byTick));
  });

  it("a normal catch-up with room in every store is the same single batch as before", () => {
    const [settled, analytic] = twins((s) => {
      for (const res of STORES) s.resources[res] = "0";
      s.buildings = s.buildings.filter((b) => b.completesAtTick === null);
    });
    new TickEngine(settled).settleTicks(50);
    // The old path for a quiet 50-tick stretch: one analytic step, no fine ticks.
    EconomySystem.advanceAnalytic(analytic, 0, 50);
    expect(settled.meta.tick).toBe(50);
    for (const res of STORES) expect(settled.resources[res], res).toBe(analytic.resources[res]);
    expect(D(settled.resources.food).toNumber()).toBeGreaterThan(0);
  });

  it("the 30-day cap is unchanged, and a day from full stores ends full", () => {
    expect(MAX_OFFLINE_MS).toBe(30 * 24 * 3600 * 1000);
    const state = createGameState({ seed: 7, now: 0, withStarterBuildings: true });
    const ticks = applyOfflineProgress(state, 24 * 3600 * 1000);
    expect(ticks).toBe(24 * 3600 * 10);
    expect(state.meta.tick).toBe(ticks);
    for (const res of ["food", "wood"]) expect(D(state.resources[res]).toNumber(), res).toBe(storageCap(state, res));
  });
});
