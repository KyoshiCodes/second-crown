import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen, neighbors } from "@second-crown/sim";
import { garrisonLine } from "./garrisonLine";

const post = (state: ReturnType<typeof createGameState>, provinceId: string) => {
  state.flags["garrisons_json"] = JSON.stringify([{ provinceId, force: { militia: 3 } }]);
};

describe("garrisonLine", () => {
  it("shows on a province with a posted garrison", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    post(state, tile.id);
    expect(garrisonLine(state, tile.id)).toBe("Garrison · posted");
  });

  it("is null on a quiet province", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    expect(garrisonLine(state, tile.id)).toBeNull();
  });

  it("stays hidden on an unseen tile", () => {
    const state = createGameState();
    const far = state.board.provinces.find((p) => !isProvinceSeen(state, p.id))!;
    post(state, far.id);
    expect(garrisonLine(state, far.id)).toBeNull();
  });
});
