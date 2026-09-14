import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { tryGather, listGathers } from "./gather.js";
import { drainNodeStock, nodeStock } from "./nodeStock.js";

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
});
