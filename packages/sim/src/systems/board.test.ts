import { describe, it, expect } from "vitest";
import { BOARD_H, BOARD_W } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard, seedBoard } from "./board.js";

describe("W17 board size", () => {
  it("seeds a 16 by 10 table (slice 30)", () => {
    const b = seedBoard(1);
    expect(BOARD_W).toBe(16);
    expect(BOARD_H).toBe(10);
    expect(b.provinces.length).toBe(160);
    expect(b.width).toBe(16);
    expect(b.height).toBe(10);
    expect(b.homeProvinceId).toBe("p_2_2");
  });

  it("migrates an old 8 by 6 save", () => {
    const s = createGameState({ seed: 3 });
    s.board.width = 8;
    s.board.height = 6;
    s.board.provinces = s.board.provinces.filter((p) => p.x < 8 && p.y < 6);
    expect(s.board.provinces.length).toBe(48);
    ensureBoard(s);
    expect(s.board.provinces.length).toBe(160);
    expect(s.board.provinces.some((p) => p.x === 15 && p.y === 9)).toBe(true);
    expect(s.board.homeProvinceId).toBe("p_2_2");
  });
});
