import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen, neighbors } from "@second-crown/sim";
import { outpostLine } from "./outpostLine";

describe("outpostLine", () => {
  it("shows on a seen player outpost", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    tile.node = "field";
    tile.occupantRealmId = "player";
    expect(outpostLine(state, tile.id)).toBe("Your outpost");
  });

  it("shows on a seen hostile camp", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    tile.node = "camp";
    tile.occupantRealmId = null;
    expect(outpostLine(state, tile.id)).toBe("Rival camp");
  });

  it("is null on a quiet tile", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    tile.node = "none";
    tile.occupantRealmId = null;
    expect(outpostLine(state, tile.id)).toBeNull();
  });

  it("is null on your home", () => {
    const state = createGameState();
    expect(outpostLine(state, state.board.homeProvinceId)).toBeNull();
  });

  it("stays hidden on an unseen tile", () => {
    const state = createGameState();
    const far = state.board.provinces.find((p) => !isProvinceSeen(state, p.id))!;
    far.node = "camp";
    expect(outpostLine(state, far.id)).toBeNull();
  });
});
