import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen, neighbors } from "@second-crown/sim";
import { fogEdgeLine } from "./fogEdgeLine";

describe("fogEdgeLine", () => {
  it("shows Fog edge for a seen province with an unseen neighbour", () => {
    const state = createGameState();
    const edge = state.board.provinces.find(
      (p) => isProvinceSeen(state, p.id) && neighbors(state, p.id).some((n) => !isProvinceSeen(state, n.id))
    )!;
    expect(edge).toBeDefined();
    expect(fogEdgeLine(state, edge.id)).toBe("Fog edge");
  });

  it("is null for a seen province surrounded by seen tiles", () => {
    const state = createGameState();
    const inner = state.board.provinces.find(
      (p) => isProvinceSeen(state, p.id) && neighbors(state, p.id).every((n) => isProvinceSeen(state, n.id))
    )!;
    expect(inner).toBeDefined();
    expect(fogEdgeLine(state, inner.id)).toBeNull();
  });

  it("stays hidden on an unseen tile", () => {
    const state = createGameState();
    const far = state.board.provinces.find((p) => !isProvinceSeen(state, p.id))!;
    expect(fogEdgeLine(state, far.id)).toBeNull();
  });
});
