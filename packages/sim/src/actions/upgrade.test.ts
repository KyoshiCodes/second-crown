import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import {
  maxLevelFor,
  tryUpgrade,
  tryCancelUpgrade,
  listUpgrades,
  keepNotice,
  completeUpgrades,
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
    new TickEngine(s).settleTicks(200);
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
