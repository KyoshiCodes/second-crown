import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import {
  applySiegeBlow,
  edgeWallCount,
  hasClosedWallRing,
  listMarches,
  siegeDefense,
  tryMarch,
  wallHp,
} from "./march.js";

describe("W2 marches and walls", () => {
  it("open field has no ring and low wall hp", () => {
    const s = createGameState({ seed: 1 });
    expect(hasClosedWallRing(s)).toBe(false);
    expect(wallHp(s)).toBe(0);
  });

  it("eight rim walls close the ring", () => {
    const s = createGameState({ seed: 1 });
    for (let i = 0; i < 8; i++) {
      s.buildings.push({
        id: `w${i}`,
        typeId: "walls",
        realmId: "player",
        x: i,
        y: 0,
        level: 1,
        completesAtTick: null,
      });
    }
    expect(edgeWallCount(s, "player")).toBe(8);
    expect(hasClosedWallRing(s)).toBe(true);
    expect(wallHp(s)).toBe(8 * 12 + 20);
    expect(siegeDefense(s, "player")).toBeGreaterThan(wallHp(s) - 1);
  });

  it("march reaches a camp and can pay wood", () => {
    const s = createGameState({ seed: 1 });
    s.units.push({ id: "u1", typeId: "militia", realmId: "player", count: "20", armyId: null });
    const camp = s.board.provinces.find((p) => p.node === "camp");
    expect(camp).toBeTruthy();
    expect(tryMarch(s, camp!.id)).toBe(true);
    expect(tryMarch(s, camp!.id)).toBe(false);
    expect(listMarches(s)).toHaveLength(1);
    const eta = listMarches(s)[0].arrivesTick;
    const eng = new TickEngine(s);
    eng.settleTicks(eta);
    expect(listMarches(s)).toHaveLength(0);
    expect(Number(s.resources.wood)).toBeGreaterThanOrEqual(0);
  });

  it("blowout siege scars a non-keep building and never the keep", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      { id: "k", typeId: "keep", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null },
      { id: "f", typeId: "farm", realmId: "player", x: 1, y: 1, level: 1, completesAtTick: null }
    );
    const hit = applySiegeBlow(s, 200, 10);
    expect(hit).toBe("farm");
    expect(s.buildings.find((b) => b.id === "f")?.completesAtTick).toBe(s.meta.tick + 40);
    expect(s.buildings.find((b) => b.id === "k")?.completesAtTick).toBeNull();
    expect(applySiegeBlow(s, 10, 200)).toBeNull();
  });
});
