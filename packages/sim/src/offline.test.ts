import { describe, it, expect } from "vitest";
import { createGameState } from "./state/createGameState.js";
import { applyOfflineProgress } from "./offline.js";
import { D } from "./core/decimal.js";

describe("applyOfflineProgress", () => {
  it("settles ticks for elapsed real time and advances resources", () => {
    const state = createGameState({ seed: 1, now: 1_000_000, withStarterBuildings: true });
    const startFood = D(state.resources.food ?? "0");
    const ticks = applyOfflineProgress(state, 1_000_000 + 10_000);
    expect(ticks).toBe(100);
    expect(state.meta.tick).toBe(100);
    expect(D(state.resources.food ?? "0").gt(startFood)).toBe(true);
    expect(state.meta.lastRealTime).toBe(1_000_000 + 10_000);
  });

  it("returns 0 when no time has passed", () => {
    const state = createGameState({ seed: 1, now: 5_000 });
    const ticks = applyOfflineProgress(state, 5_000);
    expect(ticks).toBe(0);
    expect(state.meta.tick).toBe(0);
  });
});
