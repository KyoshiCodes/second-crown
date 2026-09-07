import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { neighbors, provinceAt, seedBoard } from "./board.js";
import { serializeState, deserializeState } from "../save/serialize.js";
import { BOARD_H, BOARD_W } from "@second-crown/shared";

describe("world board (W1)", () => {
  it("same seed produces the same provinces", () => {
    expect(seedBoard(7)).toEqual(seedBoard(7));
    expect(seedBoard(7).provinces[0].terrain).not.toBe(seedBoard(99).provinces[0].terrain);
  });

  it("createGameState plants a full board with two holds", () => {
    const s = createGameState({ seed: 7 });
    expect(s.board.width).toBe(BOARD_W);
    expect(s.board.height).toBe(BOARD_H);
    expect(s.board.provinces).toHaveLength(BOARD_W * BOARD_H);
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId);
    expect(home?.occupantRealmId).toBe("player");
    expect(home?.node).toBe("hold");
    const rival = s.board.provinces.find((p) => p.occupantRealmId === "rival");
    expect(rival?.node).toBe("hold");
    expect(s.board.provinces.some((p) => p.node === "camp")).toBe(true);
  });

  it("extra crowns receive hold tokens", () => {
    const s = createGameState({ seed: 42 });
    const extras = s.realms.filter((r) => r.id !== "player" && r.id !== "rival");
    expect(extras.length).toBeGreaterThan(0);
    for (const r of extras) {
      expect(s.board.provinces.some((p) => p.occupantRealmId === r.id && p.node === "hold")).toBe(true);
    }
  });

  it("home has orthogonal neighbors", () => {
    const s = createGameState({ seed: 1 });
    const n = neighbors(s, s.board.homeProvinceId);
    expect(n.length).toBeGreaterThanOrEqual(2);
    expect(provinceAt(s, 2, 2)?.id).toBe(s.board.homeProvinceId);
  });

  it("board survives serialize", () => {
    const a = createGameState({ seed: 3 });
    const b = deserializeState(serializeState(a));
    expect(b.board.homeProvinceId).toBe(a.board.homeProvinceId);
    expect(b.board.provinces).toHaveLength(a.board.provinces.length);
  });
});
