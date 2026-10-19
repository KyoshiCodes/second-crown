import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen, neighbors, type GameState } from "@second-crown/sim";
import { trailLine } from "./trailLine";

function withMarches(state: GameState, toId: string, realmIds: string[]): void {
  state.flags.marches_json = JSON.stringify(
    realmIds.map((realmId, i) => ({
      id: `m${i}`,
      realmId,
      fromId: state.board.homeProvinceId,
      toId,
      arrivesTick: state.meta.tick + 30,
      kind: "node",
      levy: 5,
    }))
  );
}

describe("trailLine", () => {
  it("shows on a seen tile with your column on or heading to it", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0].id;
    withMarches(state, tile, ["player"]);
    expect(trailLine(state, tile)).toBe("Your column · out");
  });

  it("is null on a quiet tile", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0].id;
    expect(trailLine(state, tile)).toBeNull();
  });

  it("is null for a hostile column", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0].id;
    const rival = state.realms.find((r) => r.id !== "player")!.id;
    withMarches(state, tile, [rival]);
    expect(trailLine(state, tile)).toBeNull();
  });

  it("stays hidden on an unseen tile", () => {
    const state = createGameState();
    const far = state.board.provinces.find((p) => !isProvinceSeen(state, p.id))!;
    withMarches(state, far.id, ["player"]);
    expect(trailLine(state, far.id)).toBeNull();
  });
});
