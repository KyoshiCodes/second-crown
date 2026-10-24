import { describe, expect, it } from "vitest";
import { createGameState, getProvince, isProvinceSeen, neighbors } from "@second-crown/sim";
import { ownerLine } from "./ownerLine";

describe("ownerLine", () => {
  it("names the rival realm on a province it holds", () => {
    const state = createGameState();
    const rival = state.realms.find((r) => r.id !== "player")!;
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    getProvince(state, tile.id)!.occupantRealmId = rival.id;
    expect(ownerLine(state, tile.id)).toBe(`Held by ${rival.name}`);
  });

  it("is null on a player-owned province", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    getProvince(state, tile.id)!.occupantRealmId = "player";
    expect(ownerLine(state, tile.id)).toBeNull();
    expect(ownerLine(state, state.board.homeProvinceId)).toBeNull();
  });

  it("is null on an unowned province", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    getProvince(state, tile.id)!.occupantRealmId = null;
    expect(ownerLine(state, tile.id)).toBeNull();
  });

  it("stays hidden on an unseen tile", () => {
    const state = createGameState();
    const rival = state.realms.find((r) => r.id !== "player")!;
    const far = state.board.provinces.find((p) => !isProvinceSeen(state, p.id))!;
    far.occupantRealmId = rival.id;
    expect(ownerLine(state, far.id)).toBeNull();
  });
});
