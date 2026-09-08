import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { listTroopPosts } from "./troops.js";
import { tryGather } from "./gather.js";
import { ensureBoard } from "./board.js";

describe("troop posts", () => {
  it("counts home vs gathering", () => {
    const s = createGameState({ seed: 3, withStarterBuildings: false });
    ensureBoard(s);
    s.units = [{ id: "t", typeId: "militia", realmId: "player", count: "10", armyId: null }];
    const dest = s.board.provinces.find((p) => p.node === "woodcut" || p.id !== s.board.homeProvinceId);
    if (dest) {
      dest.node = "woodcut";
      dest.occupantRealmId = null;
      tryGather(s, dest.id, { militia: 4 });
    }
    const row = listTroopPosts(s).find((p) => p.typeId === "militia");
    expect(row?.home).toBe(6);
    expect(row?.gathering).toBe(4);
  });
});
