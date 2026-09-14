import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { tryGather, listGathers } from "./gather.js";
import { drainNodeStock, nodeStock, NODE_REGEN_PERIOD } from "./nodeStock.js";

describe("node stock", () => {
  it("caps a gather to whatever the tile still holds", () => {
    const s = createGameState({ seed: 1, now: 0, withStarterBuildings: false });
    s.units = [{ id: "t", typeId: "militia", realmId: "player", count: "20", armyId: null }];
    s.buildings = [];
    s.citizens = [];
    const dest = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!;
    dest.node = "woodcut";
    dest.occupantRealmId = null;
    drainNodeStock(s, dest.id, nodeStock(s, dest.id) - 4);
    expect(nodeStock(s, dest.id)).toBe(4);
    expect(tryGather(s, dest.id, { militia: 10 })).toBe(true);
    new TickEngine(s).settleTicks(listGathers(s)[0].arrivesTick - s.meta.tick);
    expect(listGathers(s)[0].capacity).toBe("4");
    new TickEngine(s).settleTicks(listGathers(s)[0].arrivesTick - s.meta.tick);
    expect(listGathers(s)[0].phase).toBe("returning");
    expect(listGathers(s)[0].load).toBe("4");
    expect(nodeStock(s, dest.id)).toBe(0);
    expect(tryGather(s, dest.id, { militia: 1 })).toBe(false);
  });

  it("refills a dry tile after regen pulses", () => {
    const s = createGameState({ seed: 1, now: 0, withStarterBuildings: false });
    s.buildings = [];
    s.citizens = [];
    const dest = s.board.provinces.find((p) => p.node === "woodcut") ?? s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!;
    dest.node = "woodcut";
    dest.occupantRealmId = null;
    drainNodeStock(s, dest.id, nodeStock(s, dest.id));
    expect(nodeStock(s, dest.id)).toBe(0);
    new TickEngine(s).settleTicks(NODE_REGEN_PERIOD);
    expect(nodeStock(s, dest.id)).toBeGreaterThan(0);
    const online = structuredClone(s);
    const offline = structuredClone(s);
    new TickEngine(online).tickMany(NODE_REGEN_PERIOD * 3);
    new TickEngine(offline).settleTicks(NODE_REGEN_PERIOD * 3);
    expect(nodeStock(offline, dest.id)).toBe(nodeStock(online, dest.id));
  });
});
