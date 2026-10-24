import { describe, expect, it } from "vitest";
import { createGameState, getProvince, isProvinceSeen, neighbors } from "@second-crown/sim";
import { holdLine } from "./holdLine";

describe("holdLine", () => {
  it("names the home province as your hold", () => {
    const state = createGameState();
    expect(holdLine(state, state.board.homeProvinceId)).toBe("Your hold");
  });

  it("names the province with a player building as your hold", () => {
    const state = createGameState();
    state.buildings.push({ id: "b-test", typeId: "farm", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null });
    const built = state.board.homeProvinceId;
    expect(holdLine(state, built)).toBe("Your hold");
  });

  it("is null on an empty wild province", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    getProvince(state, tile.id)!.occupantRealmId = null;
    expect(holdLine(state, tile.id)).toBeNull();
  });

  it("stays hidden on an unseen tile", () => {
    const state = createGameState();
    const far = state.board.provinces.find((p) => !isProvinceSeen(state, p.id))!;
    expect(holdLine(state, far.id)).toBeNull();
  });
});
