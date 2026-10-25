import { describe, expect, it } from "vitest";
import { createGameState, getProvince, isProvinceSeen, neighbors } from "@second-crown/sim";
import { buildingLine } from "./buildingLine";

describe("buildingLine", () => {
  it("names a finished farm", () => {
    const state = createGameState();
    state.buildings.push({ id: "b-test", typeId: "farm", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null });
    expect(buildingLine(state, state.board.homeProvinceId)).toBe("Farm");
  });

  it("is null for an under-construction building", () => {
    const state = createGameState();
    state.buildings.push({ id: "b-test", typeId: "farm", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: 999 });
    expect(buildingLine(state, state.board.homeProvinceId)).toBeNull();
  });

  it("is null on an empty province", () => {
    const state = createGameState();
    expect(buildingLine(state, state.board.homeProvinceId)).toBeNull();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    getProvince(state, tile.id)!.occupantRealmId = null;
    expect(buildingLine(state, tile.id)).toBeNull();
  });

  it("stays hidden on an unseen tile", () => {
    const state = createGameState();
    const far = state.board.provinces.find((p) => !isProvinceSeen(state, p.id))!;
    expect(buildingLine(state, far.id)).toBeNull();
  });
});
