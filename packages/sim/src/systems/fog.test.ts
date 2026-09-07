import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { isProvinceSeen, tryScoutProvince, visionRange } from "./fog.js";

describe("W13 fog", () => {
  it("home and neighbors start seen", () => {
    const s = createGameState({ seed: 1 });
    expect(isProvinceSeen(s, s.board.homeProvinceId)).toBe(true);
    const far = s.board.provinces.find(
      (p) => Math.abs(p.x - 2) + Math.abs(p.y - 2) >= 3
    );
    expect(far).toBeTruthy();
    expect(isProvinceSeen(s, far!.id)).toBe(false);
  });

  it("scouting costs gold and reveals a tile plus neighbors", () => {
    const s = createGameState({ seed: 1 });
    const far = s.board.provinces.find(
      (p) => Math.abs(p.x - 2) + Math.abs(p.y - 2) >= 3
    )!;
    expect(tryScoutProvince(s, far.id)).toBe(false);
    s.resources.gold = "20";
    expect(tryScoutProvince(s, far.id)).toBe(true);
    expect(isProvinceSeen(s, far.id)).toBe(true);
    expect(Number(s.resources.gold)).toBe(12);
  });

  it("a watchtower extends vision to range 2", () => {
    const s = createGameState({ seed: 1 });
    expect(visionRange(s)).toBe(1);
    s.buildings.push({
      id: "t",
      typeId: "watchtower",
      realmId: "player",
      x: 3,
      y: 3,
      level: 1,
      completesAtTick: null,
    });
    expect(visionRange(s)).toBe(2);
    const mid = s.board.provinces.find(
      (p) => Math.abs(p.x - 2) + Math.abs(p.y - 2) === 2
    );
    expect(mid && isProvinceSeen(s, mid.id)).toBe(true);
  });
});
