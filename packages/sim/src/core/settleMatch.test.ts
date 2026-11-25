import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { MAX_OFFLINE_MS } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "./tickEngine.js";
import { storageCap } from "../systems/storage.js";
import { EconomySystem } from "../systems/economy.js";
import { applyOfflineProgress } from "../offline.js";
import { D } from "./decimal.js";
import { researchDone } from "../systems/research.js";
import { decreeActive } from "../systems/decree.js";

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

/** Keep III with a granary, farms, and Husbandry known: the Codex audit fixture. */
function keepThree(s: GameState): void {
  const keep = s.buildings.find((b) => b.typeId === "keep" && b.realmId === "player");
  if (keep) {
    keep.level = 3;
    keep.completesAtTick = null;
  } else {
    s.buildings.push({ id: "k3", typeId: "keep", realmId: "player", x: 3, y: 3, level: 3, completesAtTick: null });
  }
  s.buildings.push({ id: "gr", typeId: "granary", realmId: "player", x: 8, y: 8, level: 1, completesAtTick: null });
  s.flags.research_husbandry = 1;
  for (const res of STORES) s.resources[res] = "0";
}

function liveAndCatchUp(ticks: number, setup: (s: GameState) => void): [GameState, GameState] {
  const [live, caught] = twins(setup);
  new TickEngine(live).tickMany(ticks);
  new TickEngine(caught).settleTicks(ticks);
  expect(caught.meta.tick).toBe(live.meta.tick);
  return [live, caught];
}

describe("catch-up splits where income changes mid-stretch", () => {
  it("Crop rotation finishing partway through catch-up matches live ticks", () => {
    const [live, caught] = liveAndCatchUp(500, (s) => {
      keepThree(s);
      s.flags.research_crop_rotation_until = 234;
      s.flags.research_crop_rotation_total = 72_000;
    });
    expect(researchDone(caught, "crop_rotation")).toBe(true);
    expect(D(live.resources.food).toNumber()).toBeGreaterThan(0);
    expect(D(live.resources.food).toNumber()).toBeLessThan(storageCap(live, "food"));
    expectSameStores(live, caught);
  });

  it("Harvest Rite expiring partway through catch-up matches live ticks", () => {
    const [live, caught] = liveAndCatchUp(500, (s) => {
      keepThree(s);
      s.flags.decree_rite_until = 250;
    });
    expect(decreeActive(caught, "rite")).toBe(false);
    expectSameStores(live, caught);
  });

  it("a Keep upgrade completing partway through catch-up matches live ticks", () => {
    const [live, caught] = liveAndCatchUp(500, (s) => {
      keepThree(s);
      const keep = s.buildings.find((b) => b.typeId === "keep" && b.realmId === "player")!;
      keep.level = 2;
      s.flags.upgrades_json = [
        { id: "up_k", buildingId: keep.id, fromLevel: 2, doneTick: 234, ticks: 5_000, paid: { stone: "1" } },
      ];
    });
    expect(caught.buildings.find((b) => b.typeId === "keep" && b.realmId === "player")!.level).toBe(3);
    expectSameStores(live, caught);
  });

  it("Logistics raising the warehouse cap while stores sit full matches live ticks", () => {
    const [live, caught] = liveAndCatchUp(500, (s) => {
      s.buildings.push({ id: "k2", typeId: "keep", realmId: "player", x: 3, y: 3, level: 2, completesAtTick: null });
      for (const res of STORES) s.resources[res] = String(storageCap(s, res));
      s.flags.research_logistics_until = 234;
      s.flags.research_logistics_total = 27_000;
    });
    expect(Number(caught.flags.research_logistics)).toBe(1);
    expect(storageCap(caught, "wood")).toBe(storageCap(live, "wood"));
    expectSameStores(live, caught);
  });

  it("a study, a decree, and a Keep upgrade all landing in one long catch-up match live ticks", () => {
    const [live, caught] = liveAndCatchUp(1_000, (s) => {
      keepThree(s);
      const keep = s.buildings.find((b) => b.typeId === "keep" && b.realmId === "player")!;
      keep.level = 2;
      s.flags.upgrades_json = [
        { id: "up_k", buildingId: keep.id, fromLevel: 2, doneTick: 777, ticks: 9_000, paid: { stone: "1" } },
      ];
      s.flags.research_crop_rotation_until = 333;
      s.flags.research_crop_rotation_total = 72_000;
      s.flags.decree_rite_until = 555;
      s.flags.research_logistics_until = 444;
    });
    for (const res of ["food", "wood"]) {
      expect(D(live.resources[res]).toNumber(), res).toBeLessThan(storageCap(live, res));
    }
    expectSameStores(live, caught);
  });
});
