import { afterEach, describe, expect, it, vi } from "vitest";
import { createGameState } from "@second-crown/sim";
import { settleOnLoad, sharedRealmId, type SettleDeps } from "./settleOnLoad";

afterEach(() => {
  vi.unstubAllGlobals();
});

function deps(realmId: string | null): SettleDeps {
  return {
    sharedRealmId: () => realmId,
    applyOfflineProgress: vi.fn(() => 7),
    fetchRealmTick: vi.fn(async () => 42),
  };
}

describe("settleOnLoad", () => {
  it("no realm is marked shared yet", () => {
    expect(sharedRealmId(createGameState())).toBeNull();
  });

  it("solo calls applyOfflineProgress and never asks the server", async () => {
    const d = deps(null);
    const state = createGameState();
    expect(await settleOnLoad(state, d)).toEqual({ mode: "solo", settled: 7 });
    expect(d.applyOfflineProgress).toHaveBeenCalledWith(state);
    expect(d.fetchRealmTick).not.toHaveBeenCalled();
  });

  it("the default solo path settles offline time without any fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const state = createGameState();
    state.meta.lastRealTime = Date.now() - 1_000;
    const result = await settleOnLoad(state);
    expect(result.mode).toBe("solo");
    expect(result.mode === "solo" && result.settled).toBeGreaterThanOrEqual(10);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("a shared realm reads the server tick and skips offline catch-up", async () => {
    const d = deps("realm-a");
    expect(await settleOnLoad(createGameState(), d)).toEqual({ mode: "shared", realmId: "realm-a", serverTick: 42 });
    expect(d.fetchRealmTick).toHaveBeenCalledWith("realm-a");
    expect(d.applyOfflineProgress).not.toHaveBeenCalled();
  });

  it("a failed server read leaves the shared realm alone", async () => {
    const d = deps("realm-a");
    d.fetchRealmTick = vi.fn(async () => { throw new Error("down"); });
    expect(await settleOnLoad(createGameState(), d)).toEqual({ mode: "shared", realmId: "realm-a", serverTick: null });
    expect(d.applyOfflineProgress).not.toHaveBeenCalled();
  });
});
