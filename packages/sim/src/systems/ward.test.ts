import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { applySiegeBlow } from "./march.js";
import { createCitizen, tryAssignCitizen, tryIdleCitizen } from "./citizens.js";
import {
  absorbWounded,
  AUTO_HEAL_EVERY,
  autoHealActive,
  autoHealAmount,
  autoHealTick,
  autoHealTicksLeft,
  HEAL_TICKS,
  infirmaryBeds,
  infirmaryStaffed,
  tryRepair,
  tryTreatWounded,
  woundedCount,
} from "./ward.js";

describe("W5 ward", () => {
  it("infirmary beds absorb half of losses up to cap", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push({
      id: "inf",
      typeId: "infirmary",
      realmId: "player",
      x: 2,
      y: 2,
      level: 1,
      completesAtTick: null,
    });
    expect(infirmaryBeds(s)).toBe(10);
    const saved = absorbWounded(s, 8);
    expect(saved).toBe(4);
    expect(woundedCount(s)).toBe(4);
    s.resources.food = "20";
    expect(tryTreatWounded(s)).toBe(true);
    expect(woundedCount(s)).toBe(3);
  });

  it("returns a militia after the heal timer", () => {
    const s = createGameState({ seed: 1 });
    s.units = [{ id: "m", typeId: "militia", realmId: "player", count: "2", armyId: null }];
    s.flags.wounded_player = 1;
    s.resources.food = "20";
    expect(tryTreatWounded(s)).toBe(true);
    expect(s.units.find((u) => u.typeId === "militia")?.count).toBe("2");
    new TickEngine(s).settleTicks(HEAL_TICKS);
    expect(s.units.find((u) => u.typeId === "militia")?.count).toBe("3");
  });

  it("repairs a scarred building for stone", () => {
    const s = createGameState({ seed: 1 });
    s.resources.stone = "20";
    s.buildings.push({
      id: "f",
      typeId: "farm",
      realmId: "player",
      x: 1,
      y: 1,
      level: 1,
      completesAtTick: null,
    });
    applySiegeBlow(s, 200, 1);
    expect(s.buildings.find((b) => b.id === "f")?.completesAtTick).not.toBeNull();
    expect(tryRepair(s, "f")).toBe(true);
    expect(s.buildings.find((b) => b.id === "f")?.completesAtTick).toBeNull();
  });
});

/** A hold with one Infirmary. `staffed` posts a worker on it; `done: false` leaves it under construction. */
function wardHold(opts: { staffed?: boolean; done?: boolean; wounded?: number } = {}) {
  const s = createGameState({ seed: 1 });
  s.units = [{ id: "m", typeId: "militia", realmId: "player", count: "2", armyId: null }];
  s.resources.food = "500";
  s.buildings.push({
    id: "inf",
    typeId: "infirmary",
    realmId: "player",
    x: 2,
    y: 2,
    level: 1,
    completesAtTick: null,
  });
  let healer: string | null = null;
  if (opts.staffed ?? true) {
    healer = createCitizen(s, "player").id;
    tryAssignCitizen(s, healer, "inf");
  }
  if (opts.done === false) s.buildings.find((b) => b.id === "inf")!.completesAtTick = s.meta.tick + 5000;
  s.flags.wounded_player = opts.wounded ?? 10;
  return { s, healer };
}

function militia(s: ReturnType<typeof createGameState>): number {
  return Number(s.units.find((u) => u.realmId === "player" && u.typeId === "militia")?.count ?? 0);
}

describe("Infirmary auto-heal", () => {
  it("counts an Infirmary as staffed only when finished and worked", () => {
    expect(infirmaryStaffed(createGameState({ seed: 1 }))).toBe(false);
    expect(infirmaryStaffed(wardHold({ staffed: false }).s)).toBe(false);
    expect(infirmaryStaffed(wardHold({ done: false }).s)).toBe(false);
    const { s, healer } = wardHold();
    expect(infirmaryStaffed(s)).toBe(true);
    tryIdleCitizen(s, healer!);
    expect(infirmaryStaffed(s)).toBe(false);
  });

  it("heals one wounded in ten, rounded up", () => {
    expect(autoHealAmount(0)).toBe(0);
    expect(autoHealAmount(1)).toBe(1);
    expect(autoHealAmount(10)).toBe(1);
    expect(autoHealAmount(11)).toBe(2);
    expect(autoHealAmount(30)).toBe(3);
  });

  it("returns a share of the wounded as militia on the heal tick only", () => {
    const { s } = wardHold({ wounded: 20 });
    const before = militia(s);
    expect(autoHealTick(s, AUTO_HEAL_EVERY - 1)).toBe(0);
    expect(woundedCount(s)).toBe(20);
    expect(autoHealTick(s, AUTO_HEAL_EVERY)).toBe(2);
    expect(woundedCount(s)).toBe(18);
    expect(militia(s)).toBe(before + 2);
  });

  it("heals through the engine and reports the wait", () => {
    const { s } = wardHold({ wounded: 10 });
    const before = militia(s);
    expect(autoHealActive(s)).toBe(true);
    const wait = autoHealTicksLeft(s);
    expect(wait).toBeGreaterThan(0);
    expect(wait).toBeLessThanOrEqual(AUTO_HEAL_EVERY);
    const engine = new TickEngine(s);
    engine.tickMany(wait - 1);
    expect(woundedCount(s)).toBe(10);
    engine.tick();
    expect(woundedCount(s)).toBe(9);
    expect(militia(s)).toBe(before + 1);
    expect(s.inputLog.some((e) => e.type === "treat")).toBe(false);
  });

  it("does nothing with no worker, or while the Infirmary is still going up", () => {
    for (const opts of [{ staffed: false }, { done: false }]) {
      const { s } = wardHold({ ...opts, wounded: 6 });
      const before = militia(s);
      expect(autoHealActive(s)).toBe(false);
      expect(autoHealTicksLeft(s)).toBe(0);
      new TickEngine(s).tickMany(AUTO_HEAL_EVERY * 3);
      expect(woundedCount(s)).toBe(6);
      expect(militia(s)).toBe(before);
    }
  });

  it("empties the beds and then stops", () => {
    const { s } = wardHold({ wounded: 3 });
    const before = militia(s);
    new TickEngine(s).tickMany(AUTO_HEAL_EVERY * 5);
    expect(woundedCount(s)).toBe(0);
    expect(militia(s)).toBe(before + 3);
    expect(autoHealActive(s)).toBe(false);
  });

  it("settles a batch the same as tick by tick", () => {
    const a = wardHold({ wounded: 25 }).s;
    const b = wardHold({ wounded: 25 }).s;
    new TickEngine(a).tickMany(1234);
    new TickEngine(b).settleTicks(1234);
    expect(woundedCount(b)).toBe(woundedCount(a));
    expect(b.units).toEqual(a.units);
    expect(woundedCount(a)).toBeLessThan(25);
  });

  it("leaves manual treat working beside it", () => {
    const { s } = wardHold({ wounded: 10 });
    const before = militia(s);
    expect(tryTreatWounded(s)).toBe(true);
    expect(woundedCount(s)).toBe(9);
    new TickEngine(s).settleTicks(AUTO_HEAL_EVERY);
    expect(woundedCount(s)).toBe(8);
    expect(militia(s)).toBe(before + 2);
  });
});
