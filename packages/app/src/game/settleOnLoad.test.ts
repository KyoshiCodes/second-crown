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
    joinHold: vi.fn(async (id: string) => ({
      realmId: id,
      tick: 42,
      stores: { food: "0", wood: "0", stone: "0", gold: "0" },
      militia: 0,
      training: 0,
      farms: 1,
      stamps: [{ tick: 40, by: "guest_a" }],
      pending: 0,
    })),
  };
}

describe("settleOnLoad", () => {
  it("no realm is marked shared yet", () => {
    expect(sharedRealmId(createGameState())).toBeNull();
  });

  it("solo calls applyOfflineProgress, never asks the server, and never joins a hold", async () => {
    const d = deps(null);
    const state = createGameState();
    expect(await settleOnLoad(state, d)).toEqual({ mode: "solo", settled: 7 });
    expect(d.applyOfflineProgress).toHaveBeenCalledWith(state);
    expect(d.fetchRealmTick).not.toHaveBeenCalled();
    expect(d.joinHold).not.toHaveBeenCalled();
  });

  it("a solo load after a join still uses the local save and does not join", async () => {
    const state = createGameState();
    // Joining is a separate opt-in control; it never marks the crown shared.
    expect(sharedRealmId(state)).toBeNull();
    const d = deps(sharedRealmId(state));
    expect((await settleOnLoad(state, d)).mode).toBe("solo");
    expect(d.joinHold).not.toHaveBeenCalled();
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
    expect(await settleOnLoad(createGameState(), d)).toEqual({
      mode: "shared",
      realmId: "realm-a",
      serverTick: 42,
      hold: {
        realmId: "realm-a",
        tick: 42,
        stores: { food: "0", wood: "0", stone: "0", gold: "0" },
        militia: 0,
        training: 0,
        farms: 1,
        stamps: [{ tick: 40, by: "guest_a" }],
        pending: 0,
      },
    });
    expect(d.fetchRealmTick).toHaveBeenCalledWith("realm-a");
    expect(d.joinHold).toHaveBeenCalledWith("realm-a");
    expect(d.applyOfflineProgress).not.toHaveBeenCalled();
  });

  it("a failed server read leaves the shared realm alone", async () => {
    const d = deps("realm-a");
    d.fetchRealmTick = vi.fn(async () => { throw new Error("down"); });
    d.joinHold = vi.fn(async () => { throw new Error("down"); });
    expect(await settleOnLoad(createGameState(), d)).toEqual({ mode: "shared", realmId: "realm-a", serverTick: null, hold: null });
    expect(d.applyOfflineProgress).not.toHaveBeenCalled();
  });
});
