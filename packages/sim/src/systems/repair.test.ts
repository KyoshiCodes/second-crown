import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { tryBuild } from "../actions/build.js";
import { getBuildingType } from "../content/buildings.js";
import { applySiegeBlow } from "./march.js";
import { isScarred, listScarred, tryRepair } from "./ward.js";

function starter(): GameState {
  const s = createGameState({ seed: 1, now: 0, withStarterBuildings: true });
  s.resources.stone = "50";
  return s;
}

function camp(s: GameState) {
  return s.buildings.find((b) => b.typeId === "lumber_camp")!;
}

describe("repair only fixes a damaged building", () => {
  it("the starter lumber camp is not scarred, Repair refuses it, and it finishes on its own timer", () => {
    const s = starter();
    const lc = camp(s);
    expect(lc.completesAtTick).toBe(30);
    expect(isScarred(s, lc)).toBe(false);
    expect(listScarred(s)).toEqual([]);
    expect(tryRepair(s, lc.id)).toBe(false);
    expect(lc.completesAtTick).toBe(30);
    expect(s.resources.stone).toBe("50");
    expect(s.inputLog.some((r) => r.type === "repair")).toBe(false);
    new TickEngine(s).tickMany(29);
    expect(lc.completesAtTick).toBe(30);
    new TickEngine(s).tickMany(1);
    expect(lc.completesAtTick).toBeNull();
  });

  it("a building the player just placed is not scarred and Repair does not complete it", () => {
    const s = createGameState({ seed: 1 });
    s.resources.wood = "100";
    s.resources.food = "100";
    s.resources.stone = "50";
    const before = s.buildings.length;
    expect(tryBuild(s, { typeId: "farm", x: 2, y: 3 })).toBe(true);
    const b = s.buildings[before];
    const due = b.completesAtTick;
    expect(due).not.toBeNull();
    expect(isScarred(s, b)).toBe(false);
    expect(tryRepair(s, b.id)).toBe(false);
    expect(b.completesAtTick).toBe(due);
    // A normal build still finishes on its timer.
    new TickEngine(s).tickMany(due! - s.meta.tick);
    expect(b.completesAtTick).toBeNull();
    expect(getBuildingType("farm")!.buildTicks).toBeGreaterThan(0);
  });

  it("a damaged building repairs for 8 stone, is logged, and keeps what it had", () => {
    const s = starter();
    const farm = s.buildings.find((b) => b.typeId === "farm")!;
    const citizens = JSON.stringify(s.citizens);
    expect(applySiegeBlow(s, 10_000, 1)).toBe("farm");
    expect(isScarred(s, farm)).toBe(true);
    expect(listScarred(s).map((b) => b.id)).toEqual([farm.id]);
    // The lumber camp is still going up and is not offered.
    expect(isScarred(s, camp(s))).toBe(false);
    expect(tryRepair(s, farm.id)).toBe(true);
    expect(s.resources.stone).toBe("42");
    expect(farm.completesAtTick).toBeNull();
    expect(farm.level).toBe(1);
    expect(JSON.stringify(s.citizens)).toBe(citizens);
    expect(isScarred(s, farm)).toBe(false);
    expect(s.inputLog.at(-1)).toMatchObject({ type: "repair", issuerId: "player", payload: { buildingId: farm.id } });
    expect(tryRepair(s, farm.id)).toBe(false);
    expect(s.resources.stone).toBe("42");
    // The camp is still on its own timer.
    expect(camp(s).completesAtTick).toBe(30);
  });

  it("Repair needs 8 stone", () => {
    const s = starter();
    s.resources.stone = "7";
    applySiegeBlow(s, 10_000, 1);
    const farm = s.buildings.find((b) => b.typeId === "farm")!;
    expect(tryRepair(s, farm.id)).toBe(false);
    expect(isScarred(s, farm)).toBe(true);
  });

  it("a long catch-up with a scar still matches ordinary ticks", () => {
    const a = starter();
    applySiegeBlow(a, 10_000, 1);
    const b = structuredClone(a);
    new TickEngine(a).tickMany(3_000);
    new TickEngine(b).settleTicks(3_000);
    expect(b.meta.tick).toBe(a.meta.tick);
    for (const res of ["food", "wood", "stone", "gold"]) {
      expect(Number(b.resources[res]), res).toBeCloseTo(Number(a.resources[res]), 6);
    }
    expect(b.buildings).toEqual(a.buildings);
    expect(listScarred(b)).toEqual([]);
  });
});
