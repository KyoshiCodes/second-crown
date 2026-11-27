import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingCounts, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import {
  boardFeedbackSnapshot,
  courtStatusSnapshot,
  economyPressureSnapshot,
  isBareFood,
  researchProgressSnapshot,
} from "./livingStatus.js";
import { storageCap } from "./storage.js";
import { computeIncomePerSecond } from "./economy.js";
import { DECREES, tryDecree } from "./decree.js";
import { RESEARCH, researchDone } from "./research.js";

const T0 = 20100;

function fresh(seed = 1, starter = false): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: starter });
  s.meta.tick = T0;
  ensureBoard(s);
  s.flags.marches_json = "[]";
  return s;
}

/** Remove every building and unit, so income and upkeep are zero. */
function bare(s: GameState): GameState {
  s.buildings = [];
  s.units = [];
  s.citizens = [];
  return s;
}

function setStore(s: GameState, res: string, n: number): void {
  s.resources[res] = String(n);
}

const SWITCHES = [
  ["economyStatus", "living_economy_status"],
  ["researchStatus", "living_research_status"],
  ["courtStatus", "living_court_status"],
  ["boardFeedback", "living_board_feedback"],
] as const;

describe("slice 16 switches", () => {
  it("each is on by default and maps to its flag", () => {
    const s = fresh();
    for (const [key, flag] of SWITCHES) {
      expect(LIVING_SWITCH_FLAGS[key]).toBe(flag);
      expect(livingSwitches(s)[key]).toBe(true);
    }
  });

  it("each flag off returns null", () => {
    const s = fresh();
    expect(economyPressureSnapshot(s)).not.toBeNull();
    expect(researchProgressSnapshot(s)).not.toBeNull();
    expect(courtStatusSnapshot(s)).not.toBeNull();
    expect(boardFeedbackSnapshot(s)).not.toBeNull();
    for (const [key] of SWITCHES) setLivingSwitch(s, key, false);
    expect(economyPressureSnapshot(s)).toBeNull();
    expect(researchProgressSnapshot(s)).toBeNull();
    expect(courtStatusSnapshot(s)).toBeNull();
    expect(boardFeedbackSnapshot(s, { selectedProvinceId: s.board.homeProvinceId })).toBeNull();
  });

  it("one switch off leaves the other three on", () => {
    const s = fresh();
    setLivingSwitch(s, "courtStatus", false);
    expect(courtStatusSnapshot(s)).toBeNull();
    expect(economyPressureSnapshot(s)).not.toBeNull();
    expect(researchProgressSnapshot(s)).not.toBeNull();
    expect(boardFeedbackSnapshot(s)).not.toBeNull();
  });
});

describe("economyPressureSnapshot", () => {
  it("has the documented shape", () => {
    const s = fresh(1, true);
    const e = economyPressureSnapshot(s)!;
    expect(Object.keys(e).sort()).toEqual(
      ["bareFood", "foodPressure", "fullStores", "goldPressure", "stonePressure", "woodPressure"].sort()
    );
    for (const k of ["foodPressure", "woodPressure", "stonePressure", "goldPressure"] as const) {
      expect(["low", "ok", "high"]).toContain(e[k]);
    }
    expect(Array.isArray(e.fullStores)).toBe(true);
    expect(typeof e.bareFood).toBe("boolean");
  });

  it("empty store with no income is high; full store is low and listed in fullStores", () => {
    const s = bare(fresh());
    setStore(s, "food", 100);
    setStore(s, "wood", 0);
    setStore(s, "stone", storageCap(s, "stone"));
    setStore(s, "gold", Math.floor(storageCap(s, "gold") / 2));
    const e = economyPressureSnapshot(s)!;
    expect(e.woodPressure).toBe("high");
    expect(e.stonePressure).toBe("low");
    expect(e.goldPressure).toBe("ok");
    expect(e.fullStores).toEqual(["stone"]);
  });

  it("fill thresholds sit at 25% and 75% of the cap", () => {
    const s = bare(fresh());
    const cap = storageCap(s, "wood");
    setStore(s, "wood", Math.ceil(cap * 0.25));
    expect(economyPressureSnapshot(s)!.woodPressure).toBe("ok");
    setStore(s, "wood", Math.floor(cap * 0.25) - 1);
    expect(economyPressureSnapshot(s)!.woodPressure).toBe("high");
    setStore(s, "wood", Math.ceil(cap * 0.75));
    expect(economyPressureSnapshot(s)!.woodPressure).toBe("low");
  });

  it("positive income keeps a nearly empty store out of high", () => {
    const s = bare(fresh());
    s.buildings.push({ id: "b_lc", typeId: "lumber_camp", realmId: "player", level: 1, completesAtTick: null, x: 0, y: 0 } as GameState["buildings"][number]);
    expect(Number(computeIncomePerSecond(s).wood ?? "0")).toBeGreaterThan(0);
    setStore(s, "wood", 1);
    expect(economyPressureSnapshot(s)!.woodPressure).toBe("ok");
  });

  it("bareFood matches the map's tired-host rule and forces food high", () => {
    const s = bare(fresh());
    setStore(s, "food", 0);
    expect(isBareFood(s)).toBe(true);
    setStore(s, "food", 5);
    expect(isBareFood(s)).toBe(true);
    setStore(s, "food", 6);
    expect(isBareFood(s)).toBe(false);
    // 1000 mouths eat 20/tick; bare at <= 1000 food.
    s.units.push({ id: "u_test", realmId: "player", typeId: "spearman", count: "1000" } as GameState["units"][number]);
    setStore(s, "food", 1000);
    expect(isBareFood(s)).toBe(true);
    const e = economyPressureSnapshot(s)!;
    expect(e.bareFood).toBe(true);
    expect(e.foodPressure).toBe("high");
    setStore(s, "food", 1001);
    expect(isBareFood(s)).toBe(false);
  });
});

describe("researchProgressSnapshot", () => {
  it("has the documented shape on a fresh game", () => {
    const s = fresh(1, true);
    const r = researchProgressSnapshot(s)!;
    expect(Object.keys(r).sort()).toEqual(["active", "completedCount", "nextAvailable"]);
    expect(r.active).toBeNull();
    expect(r.completedCount).toBe(0);
    expect(r.nextAvailable === null || typeof r.nextAvailable === "string").toBe(true);
  });

  it("nextAvailable is null with no buildings; a farm opens Husbandry", () => {
    const s = bare(fresh());
    expect(researchProgressSnapshot(s)!.nextAvailable).toBeNull();
    s.buildings.push({ id: "b_farm", typeId: "farm", realmId: "player", level: 1, completesAtTick: null, x: 0, y: 0 } as GameState["buildings"][number]);
    expect(researchProgressSnapshot(s)!.nextAvailable).toBe(RESEARCH.husbandry.name);
  });

  it("reports the open study and counts known ones; tier II needs its prerequisite", () => {
    const s = bare(fresh());
    s.buildings.push({ id: "b_farm", typeId: "farm", realmId: "player", level: 1, completesAtTick: null, x: 0, y: 0 } as GameState["buildings"][number]);
    s.flags.research_husbandry_until = T0 + 500;
    s.flags.research_husbandry_total = 3000;
    let r = researchProgressSnapshot(s)!;
    expect(r.active).toEqual({ id: "husbandry", name: "Husbandry", ticksLeft: 500, totalTicks: 3000 });
    expect(r.completedCount).toBe(0);
    expect(r.nextAvailable).toBeNull();
    s.flags.research_forestry = 1;
    r = researchProgressSnapshot(s)!;
    expect(r.completedCount).toBe(1);
  });

  it("a study past its finish tick counts as known without writing the flag", () => {
    const s = bare(fresh());
    s.flags.research_masonry_until = T0 - 1;
    const before = JSON.stringify(s);
    const r = researchProgressSnapshot(s)!;
    expect(r.active).toBeNull();
    expect(r.completedCount).toBe(1);
    expect(JSON.stringify(s)).toBe(before);
    expect(s.flags.research_masonry).toBeUndefined();
  });
});

describe("courtStatusSnapshot", () => {
  it("has the documented shape with nothing sworn", () => {
    const s = fresh();
    expect(courtStatusSnapshot(s)).toEqual({ activeDecrees: [], openSlots: DECREES.length, lastDecree: null });
  });

  it("null with no court (no player character)", () => {
    const s = fresh();
    s.characters = s.characters.filter((c) => c.realmId !== "player");
    expect(courtStatusSnapshot(s)).toBeNull();
  });

  it("tracks active decrees, open slots and the last one sworn", () => {
    const s = fresh();
    setStore(s, "gold", 1000);
    setStore(s, "food", 1000);
    expect(tryDecree(s, "muster")).toBe(true);
    s.meta.tick += 10;
    expect(tryDecree(s, "rite")).toBe(true);
    let c = courtStatusSnapshot(s)!;
    expect(c.activeDecrees).toEqual(["muster", "rite"]);
    expect(c.openSlots).toBe(DECREES.length - 2);
    expect(c.lastDecree).toEqual({ id: "rite", name: "Harvest Rite", startedTick: T0 + 10, active: true });
    s.meta.tick += 1000;
    c = courtStatusSnapshot(s)!;
    expect(c.activeDecrees).toEqual([]);
    expect(c.openSlots).toBe(DECREES.length);
    expect(c.lastDecree).toMatchObject({ id: "rite", active: false });
  });
});

describe("boardFeedbackSnapshot", () => {
  it("all nulls with nothing selected and no march", () => {
    const s = fresh();
    expect(boardFeedbackSnapshot(s)).toEqual({ selectedProvince: null, lastInspected: null, pendingMarch: null });
  });

  it("describes the selected and last inspected provinces; unknown ids are null", () => {
    const s = fresh();
    const home = s.board.homeProvinceId;
    const other = s.board.provinces.find((p) => p.id !== home)!;
    const f = boardFeedbackSnapshot(s, { selectedProvinceId: home, lastInspectedProvinceId: other.id })!;
    expect(f.selectedProvince).toMatchObject({ id: home, isHome: true, ownerRealmId: "player" });
    expect(f.lastInspected).toEqual({
      id: other.id,
      x: other.x,
      y: other.y,
      node: other.node,
      ownerRealmId: other.occupantRealmId,
      isHome: false,
    });
    expect(boardFeedbackSnapshot(s, { selectedProvinceId: "nope" })!.selectedProvince).toBeNull();
  });

  it("reports the player's march on the road", () => {
    const s = fresh();
    const to = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!.id;
    s.flags.marches_json = JSON.stringify([
      { id: "m_npc", realmId: "rival", fromId: "a", toId: to, arrivesTick: T0 + 10, kind: "node", levy: 5 },
      { id: "m1", realmId: "player", fromId: s.board.homeProvinceId, toId: to, arrivesTick: T0 + 90, kind: "node", levy: 5, purpose: "scout" },
    ]);
    expect(boardFeedbackSnapshot(s)!.pendingMarch).toEqual({
      id: "m1",
      fromId: s.board.homeProvinceId,
      toId: to,
      arrivesInTicks: 90,
      kind: "node",
      purpose: "scout",
    });
  });
});

describe("read-only and deterministic", () => {
  function callAll(s: GameState): unknown[] {
    return [
      economyPressureSnapshot(s),
      researchProgressSnapshot(s),
      courtStatusSnapshot(s),
      boardFeedbackSnapshot(s, { selectedProvinceId: s.board.homeProvinceId }),
    ];
  }

  it("calling every snapshot leaves the state byte-identical, even with an overdue study", () => {
    const s = fresh(3, true);
    s.flags.research_husbandry_until = T0 - 1; // researchDone would write research_husbandry = 1
    const before = JSON.stringify(s);
    const a = callAll(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(callAll(s)).toEqual(a);
    // The existing helper still does its lazy write, untouched by this slice.
    expect(researchDone(s, "husbandry")).toBe(true);
    expect(s.flags.research_husbandry).toBe(1);
  });

  it("engine run: counts, resources, flags and units match with snapshots called vs all four flags off", () => {
    for (const seed of [1, 7, 42]) {
      const on = createGameState({ seed, now: 1, withStarterBuildings: true });
      const off = createGameState({ seed, now: 1, withStarterBuildings: true });
      for (const [key] of SWITCHES) setLivingSwitch(off, key, false);
      const eOn = new TickEngine(on);
      const eOff = new TickEngine(off);
      for (let i = 0; i < 600; i++) {
        eOn.tick();
        eOff.tick();
        if (i % 20 === 0) {
          callAll(eOn.getState());
          callAll(eOff.getState());
        }
      }
      const a = eOn.getState();
      const b = eOff.getState();
      expect(livingCounts(a)).toEqual(livingCounts(b));
      expect(a.resources).toEqual(b.resources);
      expect(a.units).toEqual(b.units);
      expect(a.buildings).toEqual(b.buildings);
      expect(a.wars).toEqual(b.wars);
      const flagsOff = { ...b.flags };
      for (const [, flag] of SWITCHES) delete flagsOff[flag];
      expect(a.flags).toEqual(flagsOff);
    }
  });
});
