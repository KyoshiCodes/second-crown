import { describe, expect, it, vi } from "vitest";
import {
  ascendThreshold,
  createGameState,
  deserializeState,
  listTraining,
  listUpgrades,
  serializeState,
  TickEngine,
  tryAscend,
  tryTrain,
  tryUpgrade,
  type GameState,
} from "@second-crown/sim";
import { pullCloudCopy, startSave, type PullDeps, type StartDeps } from "./pullCloud";
import { settleOnLoad, sharedRealmId, type SettleDeps } from "./settleOnLoad";

/** The browser's save store: the autosave and the pulled slot. */
function browser(localRaw: string | null) {
  const slots: { local: string | null; pulled: string | null } = { local: localRaw, pulled: null };
  const start: StartDeps = {
    readPulled: async () => slots.pulled,
    clearPulled: async () => { slots.pulled = null; },
    readLocal: async () => slots.local,
    writeLocal: async (raw) => { slots.local = raw; },
  };
  return { slots, start };
}

function pullDeps(slots: { pulled: string | null }, serverRaw: () => Promise<string>): PullDeps {
  return { pullServerSave: vi.fn(serverRaw), writePulled: vi.fn(async (raw: string) => { slots.pulled = raw; }) };
}

/** What the HUD shows: tick, stores, buildings. */
function onScreen(state: GameState) {
  return JSON.stringify({ tick: state.meta.tick, stores: state.resources, buildings: state.buildings });
}

/** A local crown well ahead of the cloud copy, so the two never match. */
function crowns() {
  const cloud = createGameState({ seed: 3, withStarterBuildings: true });
  const cloudRaw = serializeState(cloud);
  const local = createGameState({ seed: 9, withStarterBuildings: true });
  const engine = new TickEngine(local);
  for (let i = 0; i < 120; i++) engine.tick();
  local.resources.gold = "777";
  const localRaw = serializeState(local);
  expect(localRaw).not.toBe(cloudRaw);
  return { cloudRaw, engine, localRaw };
}

describe("Pull save", () => {
  it("stores the cloud copy and leaves the crown on screen and its autosave unchanged until load", async () => {
    const { cloudRaw, engine, localRaw } = crowns();
    const { slots, start } = browser(localRaw);
    const before = onScreen(engine.getState());

    const d = pullDeps(slots, async () => cloudRaw);
    await pullCloudCopy(d);

    expect(slots.pulled).toBe(cloudRaw);
    expect(slots.local).toBe(localRaw);
    expect(onScreen(engine.getState())).toBe(before);

    // The crown keeps running and autosaving; the pulled copy waits.
    engine.tick();
    slots.local = serializeState(engine.getState());
    expect(slots.pulled).toBe(cloudRaw);

    // Reload: the cloud copy becomes the crown, once.
    const loaded = await startSave(start);
    expect(loaded).toBe(cloudRaw);
    expect(slots.local).toBe(cloudRaw);
    expect(slots.pulled).toBeNull();
    expect(onScreen(deserializeState(loaded!))).toBe(onScreen(deserializeState(cloudRaw)));
    expect(await startSave(start)).toBe(cloudRaw);
  });

  it("a failed pull leaves the local save unchanged and stores nothing", async () => {
    const { engine, localRaw } = crowns();
    const { slots, start } = browser(localRaw);
    const before = onScreen(engine.getState());

    const down = pullDeps(slots, async () => { throw new Error("no cloud save"); });
    await expect(pullCloudCopy(down)).rejects.toThrow();
    const garbled = pullDeps(slots, async () => "{not a save");
    await expect(pullCloudCopy(garbled)).rejects.toThrow();

    expect(garbled.writePulled).not.toHaveBeenCalled();
    expect(slots).toEqual({ local: localRaw, pulled: null });
    expect(onScreen(engine.getState())).toBe(before);
    expect(await startSave(start)).toBe(localRaw);
  });

  it("with nothing pulled, a reload reads the local save as before", async () => {
    const { localRaw } = crowns();
    const { slots, start } = browser(localRaw);
    expect(await startSave(start)).toBe(localRaw);
    expect(slots).toEqual({ local: localRaw, pulled: null });
  });

  it("a pulled crown loads solo and joins no hold", async () => {
    const { cloudRaw } = crowns();
    const { slots, start } = browser(null);
    await pullCloudCopy(pullDeps(slots, async () => cloudRaw));
    const state = deserializeState((await startSave(start))!);
    expect(sharedRealmId(state)).toBeNull();
    const d: SettleDeps = {
      sharedRealmId,
      applyOfflineProgress: vi.fn(() => 0),
      fetchRealmTick: vi.fn(async () => 0),
      joinHold: vi.fn(async () => { throw new Error("must not join"); }),
    };
    expect((await settleOnLoad(state, d)).mode).toBe("solo");
    expect(d.joinHold).not.toHaveBeenCalled();
    expect(d.fetchRealmTick).not.toHaveBeenCalled();
  });

  it("Second Dawn on a pulled crown still clears unfinished jobs", async () => {
    const cloud = createGameState({ seed: 1, withStarterBuildings: true });
    cloud.resources = { gold: "9999", food: "9999", wood: "9999", stone: "9999" };
    expect(tryTrain(cloud, { typeId: "militia", count: 3 })).toBe(true);
    const farm = cloud.buildings.find((b) => b.realmId === "player" && b.typeId === "farm" && b.completesAtTick === null);
    expect(farm && tryUpgrade(cloud, farm.id)).toBe(true);
    const { slots, start } = browser(null);
    await pullCloudCopy(pullDeps(slots, async () => serializeState(cloud)));

    const s = deserializeState((await startSave(start))!);
    expect(listTraining(s, "player")).toHaveLength(1);
    expect(listUpgrades(s)).toHaveLength(1);
    s.resources.gold = String(ascendThreshold(s));
    expect(tryAscend(s)).toBe(true);
    expect(listTraining(s, "player")).toHaveLength(0);
    expect(listUpgrades(s)).toHaveLength(0);
    expect(sharedRealmId(s)).toBeNull();
  });
});
