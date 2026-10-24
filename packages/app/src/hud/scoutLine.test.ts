import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen, neighbors } from "@second-crown/sim";
import { scoutLine } from "./scoutLine";

const send = (state: ReturnType<typeof createGameState>, toId: string, arrivesTick: number) => {
  state.flags["marches_json"] = JSON.stringify([
    {
      id: `m_scout_0_${toId}`,
      realmId: "player",
      fromId: state.board.homeProvinceId,
      toId,
      arrivesTick,
      kind: "node",
      levy: 1,
      force: { militia: 1 },
      purpose: "scout",
    },
  ]);
};

describe("scoutLine", () => {
  it("shows here on a province a scout has reached", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    send(state, tile.id, state.meta.tick);
    expect(scoutLine(state, tile.id)).toBe("Scout · here");
  });

  it("shows inbound on a province a scout is heading to", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    send(state, tile.id, state.meta.tick + 30);
    expect(scoutLine(state, tile.id)).toBe("Scout · inbound");
  });

  it("is null on a quiet province", () => {
    const state = createGameState();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    expect(scoutLine(state, tile.id)).toBeNull();
  });

  it("stays hidden on an unseen tile", () => {
    const state = createGameState();
    const far = state.board.provinces.find((p) => !isProvinceSeen(state, p.id))!;
    send(state, far.id, state.meta.tick + 30);
    expect(scoutLine(state, far.id)).toBeNull();
  });
});
