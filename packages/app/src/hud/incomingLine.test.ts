import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen, neighbors, type GameState } from "@second-crown/sim";
import { incomingLine } from "./incomingLine";

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

describe("incomingLine", () => {
  it("shows on a seen tile with a hostile column inbound", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0].id;
    const rival = state.realms.find((r) => r.id !== "player")!.id;
    withMarches(state, tile, [rival]);
    expect(incomingLine(state, tile)).toBe("Incoming · hostile");
  });

  it("is null on a quiet tile", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0].id;
    expect(incomingLine(state, tile)).toBeNull();
  });

  it("is null for a player column", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0].id;
    withMarches(state, tile, ["player"]);
    expect(incomingLine(state, tile)).toBeNull();
  });

  it("stays hidden on an unseen tile", () => {
    const state = createGameState();
    const far = state.board.provinces.find((p) => !isProvinceSeen(state, p.id))!;
    const rival = state.realms.find((r) => r.id !== "player")!.id;
    withMarches(state, far.id, [rival]);
    expect(incomingLine(state, far.id)).toBeNull();
  });
});
