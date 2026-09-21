import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { incomingOnHome } from "./raidMarch.js";
import { canSally, trySally } from "./sally.js";

describe("sally at the gate", () => {
  it("refuses when no column is incoming", () => {
    const s = createGameState({ seed: 2 });
    s.units.push({ id: "u_m", typeId: "militia", realmId: "player", count: "10", armyId: null });
    expect(canSally(s)).toBe(false);
    expect(trySally(s)).toBe(false);
  });

  it("meets an incoming column and records a sally", () => {
    const s = createGameState({ seed: 2 });
    s.units.push({ id: "u_m", typeId: "militia", realmId: "player", count: "10", armyId: null });
    s.flags.marches_json = JSON.stringify([
      {
        id: "inc1",
        realmId: "rival",
        fromId: s.board.provinces.find((p) => p.occupantRealmId === "rival")?.id ?? s.board.homeProvinceId,
        toId: s.board.homeProvinceId,
        arrivesTick: s.meta.tick + 40,
        kind: "hold",
        levy: 4,
        force: { militia: 4 },
      },
    ]);
    expect(canSally(s)).toBe(true);
    expect(incomingOnHome(s)).toHaveLength(1);
    expect(trySally(s)).toBe(true);
    expect(s.inputLog.some((e) => e.type === "sally")).toBe(true);
  });
});
