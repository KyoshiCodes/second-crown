import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import {
  maxLevelFor,
  tryUpgrade,
  tryCancelUpgrade,
  listUpgrades,
  keepNotice,
  completeUpgrades,
  upgradeCost,
  upgradeDurationTicks,
} from "./upgrade.js";
import { TickEngine } from "../core/tickEngine.js";
import { listLedger } from "../systems/ledger.js";

describe("upgrade cap", () => {
  it("without a keep, farms stop at level 2", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    const farm = s.buildings.find((b) => b.typeId === "farm")!;
    expect(maxLevelFor(s, "farm")).toBe(2);
    s.resources.wood = "999";
    s.resources.food = "999";
    s.resources.stone = "999";
    s.resources.gold = "999";
    expect(tryUpgrade(s, farm.id)).toBe(true);
    expect(farm.level).toBe(1);
    // Pacing pass 1: farm 1→2 is 30 build ticks × 80 = 2_400 ticks (4 minutes).
    new TickEngine(s).settleTicks(2_399);
    expect(farm.level).toBe(1);
    new TickEngine(s).settleTicks(1);
    expect(farm.level).toBe(2);
    expect(tryUpgrade(s, farm.id)).toBe(false);
  });

  it("a level 2 keep raises the cap to 3", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    s.buildings.push({
      id: "k",
      typeId: "keep",
      realmId: "player",
      x: 4,
      y: 4,
      level: 2,
      completesAtTick: null,
    });
    expect(maxLevelFor(s, "farm")).toBe(3);
    expect(maxLevelFor(s, "keep")).toBe(5);
  });

  it("cancels an upgrade and refunds unused stores", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    const farm = s.buildings.find((b) => b.typeId === "farm")!;
    s.resources.wood = "40";
    expect(tryUpgrade(s, farm.id)).toBe(true);
    const afterPay = Number(s.resources.wood);
    expect(listUpgrades(s)).toHaveLength(1);
    expect(tryCancelUpgrade(s, farm.id)).toBe(true);
    expect(listUpgrades(s)).toHaveLength(0);
    expect(farm.level).toBe(1);
    expect(Number(s.resources.wood)).toBeGreaterThan(afterPay);
  });

  it("finishing Keep II posts a marshal notice on the ledger", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push({
      id: "keep_up",
      typeId: "keep",
      realmId: "player",
      x: 3,
      y: 3,
      level: 1,
      completesAtTick: null,
    });
    s.flags.upgrades_json = [
      {
        id: "up_keep",
        buildingId: "keep_up",
        fromLevel: 1,
        doneTick: s.meta.tick,
        ticks: 1,
        paid: {},
      },
    ];
    completeUpgrades(s, s.meta.tick);
    expect(s.buildings.find((b) => b.id === "keep_up")?.level).toBe(2);
    expect(keepNotice(s)).toMatch(/Marshal rank 2/);
    expect(listLedger(s).some((e) => /Marshal rank 2/.test(e.text))).toBe(true);
  });
});

describe("upgrade pacing (pass 1)", () => {
  const H = 36_000;
  function keepRealm(level: number) {
    const s = createGameState({ seed: 1 });
    // Strip ruler traits so "ambitious" (-10% build cost) doesn't blur the raw curve.
    for (const c of s.characters) c.traits = [];
    s.buildings.push({ id: "k", typeId: "keep", realmId: "player", x: 4, y: 4, level, completesAtTick: null });
    s.buildings.push({ id: "f", typeId: "farm", realmId: "player", x: 5, y: 5, level, completesAtTick: null });
    return s;
  }

  it("Keep upgrades run ~19m, ~1.75h, ~9.7h, then ~2.3 days", () => {
    expect(upgradeDurationTicks(keepRealm(1), "k")).toBe(11_200);
    expect(upgradeDurationTicks(keepRealm(2), "k")).toBe(63_000);
    expect(upgradeDurationTicks(keepRealm(3), "k")).toBe(350_000);
    expect(upgradeDurationTicks(keepRealm(4), "k")).toBe(1_960_000);
    expect(upgradeDurationTicks(keepRealm(3), "k")).toBeGreaterThanOrEqual(8 * H);
    expect(upgradeDurationTicks(keepRealm(4), "k")).toBeGreaterThanOrEqual(48 * H);
  });

  it("farm upgrades go from 4 minutes to half a day", () => {
    expect(upgradeDurationTicks(keepRealm(1), "f")).toBe(2_400);
    expect(upgradeDurationTicks(keepRealm(4), "f")).toBe(420_000);
  });

  it("Keep IV→V costs tens of thousands and every step fits the warehouse that allows it", () => {
    expect(upgradeCost(keepRealm(1), "k")).toEqual({ stone: "120", wood: "60", gold: "45" });
    expect(upgradeCost(keepRealm(4), "k")).toEqual({ stone: "20000", wood: "10000", gold: "7500" });
    const late = upgradeCost(keepRealm(4), "k")!;
    expect(Object.values(late).reduce((n, v) => n + Number(v), 0)).toBeGreaterThanOrEqual(30_000);
  });
});
