import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen, neighbors } from "@second-crown/sim";
import { gatherLine } from "./gatherLine";

const send = (state: ReturnType<typeof createGameState>, toId: string, phase: "outbound" | "gathering" | "returning") => {
  state.flags["gathers_json"] = JSON.stringify([
    {
      id: "g_1",
      realmId: "player",
      fromId: state.board.homeProvinceId,
      toId,
      node: "woodcut",
      force: { militia: 1 },
      phase,
      departedTick: state.meta.tick,
      arrivesTick: state.meta.tick + 30,
      travelTicks: 30,
      gatherStartedTick: state.meta.tick,
      capacity: "6",
      load: "0",
    },
  ]);
};

describe("gatherLine", () => {
  it("shows here on a province a gather is working", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    send(state, tile.id, "gathering");
    expect(gatherLine(state, tile.id)).toBe("Gather · here");
  });

  it("shows inbound on a province a gather is heading to", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    send(state, tile.id, "outbound");
    expect(gatherLine(state, tile.id)).toBe("Gather · inbound");
  });

  it("is null on a quiet province", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    expect(gatherLine(state, tile.id)).toBeNull();
  });

  it("stays hidden on an unseen tile", () => {
    const state = createGameState();
    const far = state.board.provinces.find((p) => !isProvinceSeen(state, p.id))!;
    send(state, far.id, "outbound");
    expect(gatherLine(state, far.id)).toBeNull();
  });
});
