import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { resolveSiegeHold } from "./siege.js";
import { tryMarchWith } from "./march.js";
import { D } from "../core/decimal.js";

describe("W11 siege and composition", () => {
  it("weak attack fails at the walls", () => {
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
    const r = resolveSiegeHold(s, 10);
    expect(r.wallsDown).toBe(false);
    expect(r.scarred).toBeNull();
  });

  it("huge attack drops walls and can scar", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push({
      id: "f",
      typeId: "farm",
      realmId: "player",
      x: 2,
      y: 2,
      level: 1,
      completesAtTick: null,
    });
    const r = resolveSiegeHold(s, 400);
    expect(r.wallsDown).toBe(true);
    expect(r.scarred).toBe("farm");
  });

  it("composed march detaches archers", () => {
    const s = createGameState({ seed: 1 });
    s.units.push(
      { id: "m", typeId: "militia", realmId: "player", count: "10", armyId: null },
      { id: "a", typeId: "archer", realmId: "player", count: "4", armyId: null }
    );
    const camp = s.board.provinces.find((p) => p.node === "camp");
    expect(tryMarchWith(s, camp!.id, { militia: 2, archer: 2 })).toBe(true);
    expect(D(s.units.find((u) => u.typeId === "archer")?.count ?? "0").toNumber()).toBe(2);
  });
});
