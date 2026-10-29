import { describe, expect, it } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";
import { serializeState, deserializeState } from "../save/serialize.js";
import { tryGather, tryRecallGather, tryNpcGather, listGathers, GATHER_NODES } from "./gather.js";
import { tryMarch, tryMarchWith } from "./march.js";
import { nodeStock } from "./nodeStock.js";
import { gatherYieldFactor, weatherFor } from "./weather.js";
import { dayPhase, nightWorkFactor } from "./dayNight.js";

function fixture(node: keyof typeof GATHER_NODES = "woodcut") {
  const s = createGameState({ seed: 1, now: 0, withStarterBuildings: false });
  s.units = [{ id: "troops", typeId: "militia", realmId: "player", count: "30", armyId: null }];
  s.resources.food = "1000";
  s.buildings = [];
  s.citizens = [];
  const dest = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!;
  dest.node = node;
  dest.occupantRealmId = null;
  return { s, dest };
}
function advance(s: ReturnType<typeof fixture>["s"]) {
  new TickEngine(s).settleTicks(listGathers(s)[0].arrivesTick - s.meta.tick);
}
/** What a load pays at the current tick, after weather and night. */
function paidFor(s: ReturnType<typeof fixture>["s"], load: number) {
  return Math.floor(load * gatherYieldFactor(weatherFor(s)) * nightWorkFactor(dayPhase(s)));
}
function playerUnit(s: ReturnType<typeof fixture>["s"], typeId: string) {
  return s.units.find((u) => u.realmId === "player" && u.typeId === typeId);
}

describe("gather expeditions", () => {
  it.each(["woodcut", "quarry", "field"] as const)("travels, fills %s, walks home, pays once and returns original troops", (node) => {
    const { s, dest } = fixture(node);
    s.units[0].count = "1";
    s.resources.food = "0";
    s.units.push({ id: "archers", typeId: "archer", realmId: "player", count: "2", armyId: null });
    expect(tryGather(s, dest.id, { militia: 1, archer: 2 })).toBe(true);
    expect(playerUnit(s, "archer")).toBeUndefined();
    expect(listGathers(s)[0].phase).toBe("outbound");
    expect(s.inputLog.at(-1)?.type).toBe("gather");
    advance(s);
    expect(listGathers(s)[0].phase).toBe("gathering");
    expect(listGathers(s)[0].load).toBe("0");
    const capacity = listGathers(s)[0].capacity;
    expect(D(capacity).toNumber()).toBe(3 * GATHER_NODES[node].perTroop);
    advance(s);
    expect(listGathers(s)[0].phase).toBe("returning");
    expect(listGathers(s)[0].load).toBe(capacity);
    const res = GATHER_NODES[node].resource;
    expect(s.resources[res]).toBe("0");
    advance(s);
    expect(listGathers(s)).toEqual([]);
    expect(Number(s.resources[res])).toBeCloseTo(paidFor(s, Number(capacity)) - (res === "food" ? 0.06 : 0), 8);
    expect(playerUnit(s, "archer")?.count).toBe("2");
    expect(dest.node).toBe(node);
    const paid = s.resources[res];
    new TickEngine(s).settleTicks(1);
    expect(Number(s.resources[res])).toBeCloseTo(Number(paid) - (res === "food" ? 0.06 : 0), 8);
  });

  it("recalls a partial load and releases the tile while walking home", () => {
    const { s, dest } = fixture();
    s.buildings.push({ id: "b", typeId: "barracks", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null });
    expect(tryGather(s, dest.id, { militia: 2 })).toBe(true);
    advance(s);
    new TickEngine(s).settleTicks(25);
    const g = listGathers(s)[0];
    expect(g.load).toBe("2");
    expect(tryRecallGather(s, g.id)).toBe(true);
    expect(tryRecallGather(s, g.id)).toBe(false);
    expect(tryGather(s, dest.id, { militia: 1 })).toBe(true);
    advance(s);
    expect(s.resources.wood).toBe(String(paidFor(s, 2)));
  });

  it("recalls outbound with zero cargo and elapsed outbound travel as return time", () => {
    const { s, dest } = fixture();
    tryGather(s, dest.id, { militia: 2 });
    new TickEngine(s).settleTicks(7);
    expect(tryRecallGather(s, listGathers(s)[0].id)).toBe(true);
    expect(listGathers(s)[0].arrivesTick).toBe(14);
    advance(s);
    expect(s.resources.wood).toBe("0");
    expect(playerUnit(s, "militia")?.count).toBe("30");
    expect(tryRecallGather(s, "missing")).toBe(false);
  });

  it("blocks double gathering both en route and on the tile without taking troops", () => {
    const { s, dest } = fixture();
    s.buildings.push({ id: "b", typeId: "barracks", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null });
    tryGather(s, dest.id, { militia: 2 });
    for (let i = 0; i < 2; i++) {
      const before = serializeState(s);
      expect(tryGather(s, dest.id, { militia: 2 })).toBe(false);
      expect(serializeState(s)).toBe(before);
      if (i === 0) advance(s);
    }
  });

  it("shares march slots in both directions without consuming troops on rejection", () => {
    const { s, dest } = fixture();
    tryGather(s, dest.id, { militia: 2 });
    const before = serializeState(s);
    expect(tryMarch(s, dest.id)).toBe(false);
    expect(tryMarchWith(s, dest.id, { militia: 2 })).toBe(false);
    expect(serializeState(s)).toBe(before);
    const other = fixture();
    expect(tryMarch(other.s, other.dest.id)).toBe(true);
    const afterMarch = serializeState(other.s);
    expect(tryGather(other.s, other.dest.id, { militia: 2 })).toBe(false);
    expect(serializeState(other.s)).toBe(afterMarch);
  });

  it("rejects invalid forces, destinations, and enemy occupation atomically", () => {
    const { s, dest } = fixture();
    for (const force of [{}, { militia: 31 }, { militia: -1 }, { militia: 1.5 }, { militia: Infinity }, { militia: NaN }, { fake: 1 }]) {
      const before = serializeState(s);
      expect(tryGather(s, dest.id, force)).toBe(false);
      expect(serializeState(s)).toBe(before);
    }
    for (const node of ["camp", "hold", "none"] as const) {
      dest.node = node;
      expect(tryGather(s, dest.id, { militia: 1 })).toBe(false);
    }
    dest.node = "woodcut";
    dest.occupantRealmId = "rival";
    expect(tryGather(s, dest.id, { militia: 1 })).toBe(false);
    expect(tryGather(s, "missing", { militia: 1 })).toBe(false);
  });

  it("returns empty if the resource node disappears before arrival", () => {
    const { s, dest } = fixture();
    tryGather(s, dest.id, { militia: 1 });
    dest.node = "none";
    advance(s);
    expect(listGathers(s)[0].phase).toBe("returning");
    advance(s);
    expect(s.resources.wood).toBe("0");
    expect(playerUnit(s, "militia")?.count).toBe("30");
  });

  it("scales load and duration by troop count and node type", () => {
    const results = [];
    for (const node of ["woodcut", "quarry", "field"] as const) {
      for (const count of [1, 3]) {
        const { s, dest } = fixture(node);
        tryGather(s, dest.id, { militia: count });
        advance(s);
        const g = listGathers(s)[0];
        expect(Number(g.capacity)).toBe(count * GATHER_NODES[node].perTroop);
        expect(g.arrivesTick - s.meta.tick).toBe(count * GATHER_NODES[node].perTroop * GATHER_NODES[node].ticksPerLoad);
        results.push(g.capacity);
      }
    }
    expect(new Set(results).size).toBeGreaterThan(3);
  });

  it("matches tickMany, settleTicks and save/reload across phases and recall", () => {
    const { s, dest } = fixture();
    s.units = [{ id: "champ", typeId: "champion", realmId: "player", count: "3", armyId: null }];
    tryGather(s, dest.id, { champion: 3 });
    const online = structuredClone(s);
    const offline = structuredClone(s);
    for (const ticks of [5, 100, 31]) {
      new TickEngine(online).tickMany(ticks);
      new TickEngine(offline).settleTicks(ticks);
      expect(offline).toEqual(online);
      expect(listGathers(offline)).toEqual(listGathers(online));
    }
    const loaded = deserializeState(serializeState(offline));
    const live = deserializeState(serializeState(online));
    for (const state of [loaded, live]) tryRecallGather(state, listGathers(state)[0].id);
    new TickEngine(loaded).settleTicks(150);
    new TickEngine(live).tickMany(150);
    expect(loaded).toEqual(live);
  });

  it("lets a foreign crown gather and drain the tile without paying the player", () => {
    const { s, dest } = fixture();
    const hold = s.board.provinces.find((p) => p.id !== dest.id && p.id !== s.board.homeProvinceId)!;
    hold.occupantRealmId = "rival";
    hold.node = "hold";
    const wood = s.resources.wood;
    expect(tryNpcGather(s, "rival")).toBe(true);
    const target = listGathers(s)[0].toId;
    const before = nodeStock(s, target);
    advance(s);
    advance(s);
    expect(nodeStock(s, target)).toBeLessThan(before);
    expect(s.resources.wood).toBe(wood);
  });

  it("night trims what a column brings home", () => {
    const { s, dest } = fixture();
    expect(tryGather(s, dest.id, { militia: 2 })).toBe(true);
    advance(s);
    advance(s);
    const g = listGathers(s)[0];
    const load = Number(g.load);
    const day = structuredClone(s);
    const night = structuredClone(s);
    // Shift both columns so they land in day and in night of the same season.
    for (const [st, at] of [[day, 30], [night, 100]] as const) {
      const shift = Math.floor(g.arrivesTick / 120) * 120 + at + 120 - g.arrivesTick;
      const list = listGathers(st);
      list[0].arrivesTick += shift;
      st.flags["gathers_json"] = JSON.stringify(list);
      advance(st);
    }
    expect(weatherFor(day)).toBe(weatherFor(night));
    const w = gatherYieldFactor(weatherFor(day));
    expect(Number(day.resources.wood)).toBe(Math.floor(load * w));
    expect(Number(night.resources.wood)).toBe(Math.floor(load * w * 0.8));
  });
});
