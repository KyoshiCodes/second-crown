import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import {
  economyPressureSnapshot,
  economyYieldBreakdownSnapshot,
  economyYieldsSnapshot,
  storagePressureDetailSnapshot,
} from "./livingStatus.js";
import { storageCap } from "./storage.js";
import { YIELD_BREAKDOWN_CAP } from "../content/livingRealm.js";

const T0 = 20100;
const RES = ["food", "wood", "stone", "gold"] as const;

function fresh(seed = 1, starter = false): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: starter });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.gathers_json = "[]";
  return s;
}

/** Bare economy: no buildings, citizens, army, outposts or routes. */
function empty(): GameState {
  const s = fresh();
  s.buildings = [];
  s.citizens = [];
  s.units = [];
  delete s.flags.trade_routes;
  for (const p of s.board.provinces) if (p.id !== s.board.homeProvinceId && p.occupantRealmId === "player") p.occupantRealmId = null;
  return s;
}

let n = 0;
/** Finished building, spread out so no adjacency/pair/keep bonus links them. */
function build(s: GameState, typeId: string): void {
  n++;
  s.buildings.push({ id: `b_${n}`, typeId, realmId: "player", level: 1, completesAtTick: null, x: (n % 6) * 3, y: Math.floor(n / 6) * 3 + 20 } as GameState["buildings"][number]);
}

function outpost(s: GameState, node: string): void {
  const p = s.board.provinces.find((q) => q.id !== s.board.homeProvinceId && q.occupantRealmId !== "player" && q.node !== "hold")!;
  p.occupantRealmId = "player";
  p.node = node as typeof p.node;
}

const sum = (xs: { perSec: number }[]) => xs.reduce((a, x) => a + x.perSec, 0);

describe("slice 18 switches", () => {
  it("are on by default and map to their flags", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.yieldBreakdown).toBe("living_yield_breakdown");
    expect(LIVING_SWITCH_FLAGS.storageDetail).toBe("living_storage_detail");
    expect(livingSwitches(s).yieldBreakdown).toBe(true);
    expect(livingSwitches(s).storageDetail).toBe(true);
  });

  it("false returns empty", () => {
    const s = fresh(1, true);
    expect(economyYieldBreakdownSnapshot(s).food.length).toBeGreaterThan(0);
    expect(storagePressureDetailSnapshot(s)).toHaveLength(4);
    setLivingSwitch(s, "yieldBreakdown", false);
    setLivingSwitch(s, "storageDetail", false);
    expect(economyYieldBreakdownSnapshot(s)).toEqual({ food: [], wood: [], stone: [], gold: [] });
    expect(storagePressureDetailSnapshot(s)).toEqual([]);
  });
});

describe("economyYieldBreakdownSnapshot", () => {
  it("has four lists of { id, name, perSec }", () => {
    const b = economyYieldBreakdownSnapshot(fresh(1, true));
    expect(Object.keys(b).sort()).toEqual(["food", "gold", "stone", "wood"]);
    for (const res of RES) {
      for (const src of b[res]) {
        expect(Object.keys(src).sort()).toEqual(["id", "name", "perSec"]);
        expect(typeof src.id).toBe("string");
        expect(typeof src.name).toBe("string");
        expect(src.perSec).toBeGreaterThan(0);
      }
    }
  });

  it("is empty with no economy", () => {
    expect(economyYieldBreakdownSnapshot(empty())).toEqual({ food: [], wood: [], stone: [], gold: [] });
  });

  it("totals match economyYieldsSnapshot (food is gross: net + upkeep)", () => {
    for (const s of [fresh(1, true), fresh(7, true)]) {
      const b = economyYieldBreakdownSnapshot(s);
      const y = economyYieldsSnapshot(s)!;
      for (const res of RES) expect(b[res].length).toBeLessThanOrEqual(YIELD_BREAKDOWN_CAP);
      expect(sum(b.food)).toBeCloseTo(y.foodPerSec + y.foodUpkeep, 9);
      expect(sum(b.wood)).toBeCloseTo(y.woodPerSec, 9);
      expect(sum(b.stone)).toBeCloseTo(y.stonePerSec, 9);
      expect(sum(b.gold)).toBeCloseTo(y.goldPerSec, 9);
    }
  });

  it("groups buildings by type and names routes, tithe and labor as their own sources", () => {
    const s = empty();
    build(s, "farm");
    build(s, "farm");
    build(s, "market"); // gold 2 + food 1
    s.flags.trade_routes = 4;
    outpost(s, "woodcut");
    const b = economyYieldBreakdownSnapshot(s);
    const y = economyYieldsSnapshot(s)!;
    expect(b.food.map((x) => x.id)).toEqual(["farm", "market"]);
    expect(b.food[0].name).toBe("Farm");
    expect(b.gold.map((x) => x.id).sort()).toEqual(["market", "trade_routes"]);
    expect(b.wood).toEqual([{ id: "outpost_tithe", name: "Outpost tithe", perSec: y.woodPerSec }]);
    expect(b.stone).toEqual([]);
    expect(sum(b.food)).toBeCloseTo(y.foodPerSec + y.foodUpkeep, 9);
    expect(sum(b.gold)).toBeCloseTo(y.goldPerSec, 9);
  });

  it("caps at 4 per resource, highest first, dropping the smallest", () => {
    const s = empty();
    for (const t of ["farm", "granary", "market", "stables"]) build(s, t);
    outpost(s, "field"); // fifth, tiny food source
    const b = economyYieldBreakdownSnapshot(s);
    const y = economyYieldsSnapshot(s)!;
    expect(YIELD_BREAKDOWN_CAP).toBe(4);
    expect(b.food).toHaveLength(4);
    expect(b.food.map((x) => x.id)).not.toContain("outpost_tithe");
    for (let i = 1; i < b.food.length; i++) expect(b.food[i - 1].perSec).toBeGreaterThanOrEqual(b.food[i].perSec);
    expect(b.food[0].id).toBe("granary");
    // Capped list misses only the dropped tithe.
    expect(sum(b.food)).toBeLessThan(y.foodPerSec + y.foodUpkeep);
  });

  it("is deterministic and never writes state", () => {
    const s = fresh(3, true);
    const before = JSON.stringify(s);
    expect(economyYieldBreakdownSnapshot(s)).toEqual(economyYieldBreakdownSnapshot(s));
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("storagePressureDetailSnapshot", () => {
  it("lists the four resources in order with the four fields", () => {
    const d = storagePressureDetailSnapshot(fresh(1, true));
    expect(d.map((x) => x.resource)).toEqual(["food", "wood", "stone", "gold"]);
    for (const row of d) {
      expect(Object.keys(row).sort()).toEqual(["netPerSec", "percentFull", "resource", "status"]);
      expect(Number.isFinite(row.percentFull)).toBe(true);
      expect(["low", "ok", "high"]).toContain(row.status);
    }
  });

  it("status matches economyPressureSnapshot and net matches economyYieldsSnapshot", () => {
    for (const s of [fresh(1, true), empty()]) {
      const d = storagePressureDetailSnapshot(s);
      const p = economyPressureSnapshot(s)!;
      const y = economyYieldsSnapshot(s)!;
      expect(d.map((x) => x.status)).toEqual([p.foodPressure, p.woodPressure, p.stonePressure, p.goldPressure]);
      expect(d.map((x) => x.netPerSec)).toEqual([y.foodPerSec, y.woodPerSec, y.stonePerSec, y.goldPerSec]);
    }
  });

  it("percentFull is stores over cap times 100, and status follows the fill", () => {
    const s = empty();
    const cap = storageCap(s, "wood");
    s.resources.wood = String(cap / 2);
    expect(storagePressureDetailSnapshot(s)[1]).toMatchObject({ resource: "wood", percentFull: 50, status: "ok" });
    s.resources.wood = String(cap * 0.1);
    expect(storagePressureDetailSnapshot(s)[1]).toMatchObject({ percentFull: 10, status: "high" });
    s.resources.wood = String(cap * 0.8);
    expect(storagePressureDetailSnapshot(s)[1]).toMatchObject({ percentFull: 80, status: "low" });
  });

  it("is deterministic and never writes state", () => {
    const s = fresh(3, true);
    const before = JSON.stringify(s);
    expect(storagePressureDetailSnapshot(s)).toEqual(storagePressureDetailSnapshot(s));
    expect(JSON.stringify(s)).toBe(before);
  });
});
