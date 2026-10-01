import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { hallBonuses, hallRoomBuilt, YARD_HEAL_TICKS } from "./hallBonus.js";
import { HEAL_TICKS, healTicks, tryTreatWounded } from "./ward.js";
import { researchDuration } from "./research.js";

function place(s: ReturnType<typeof createGameState>, typeId: string, x: number, y: number, done = true, realmId = "player") {
  s.buildings.push({ id: `${typeId}_${x}_${y}`, typeId, realmId, x, y, level: 1, completesAtTick: done ? null : 999 });
}

function militia(s: ReturnType<typeof createGameState>): string | undefined {
  return s.units.find((u) => u.realmId === "player" && u.typeId === "militia")?.count;
}

describe("hall bonus", () => {
  it("no rooms, no bonus", () => {
    const s = createGameState({ seed: 1 });
    expect(hallBonuses(s).every((b) => !b.on)).toBe(true);
    expect(healTicks(s)).toBe(HEAL_TICKS);
  });

  it("unfinished or rival buildings do not open a room", () => {
    const s = createGameState({ seed: 1 });
    place(s, "barracks", 3, 3, false);
    place(s, "academy", 4, 3, true, "rival");
    expect(hallRoomBuilt(s, "yard")).toBe(false);
    expect(hallRoomBuilt(s, "lectern")).toBe(false);
    expect(healTicks(s)).toBe(HEAL_TICKS);
  });

  it("yard: treated wounded return sooner, no extra units", () => {
    const s = createGameState({ seed: 1 });
    place(s, "barracks", 3, 3);
    s.units = [{ id: "m", typeId: "militia", realmId: "player", count: "2", armyId: null }];
    s.flags.wounded_player = 1;
    s.resources.food = "20";
    expect(tryTreatWounded(s)).toBe(true);
    const engine = new TickEngine(s);
    engine.settleTicks(YARD_HEAL_TICKS - 1);
    expect(militia(s)).toBe("2");
    engine.settleTicks(1);
    expect(militia(s)).toBe("3");
    engine.settleTicks(HEAL_TICKS);
    expect(militia(s)).toBe("3");
  });

  it("lectern reports the existing academy study speed", () => {
    const s = createGameState({ seed: 1 });
    const before = researchDuration(s, "husbandry");
    place(s, "academy", 3, 3);
    expect(researchDuration(s, "husbandry")).toBe(Math.ceil(before * 0.8));
    expect(hallBonuses(s).find((b) => b.room === "lectern")?.on).toBe(true);
  });

  it("gate reports its existing wall soak", () => {
    const s = createGameState({ seed: 1 });
    place(s, "gate", 0, 4);
    const g = hallBonuses(s).find((b) => b.room === "gate");
    expect(g?.on).toBe(true);
    expect(g?.text).toContain("30 HP");
  });
});
