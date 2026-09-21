import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { createCitizen, assignJob, assignTile } from "./citizens.js";
import { applyLabor, laborPerTick, maxMarches } from "./labor.js";
import { tryMarch, listMarches } from "./march.js";
import { TickEngine } from "../core/tickEngine.js";
import { computeIncomePerSecond } from "./economy.js";

function keepAt(s: ReturnType<typeof createGameState>, level: number) {
  const keep = s.buildings.find((b) => b.typeId === "keep" && b.realmId === "player");
  if (keep) {
    keep.level = level;
    keep.completesAtTick = null;
  } else {
    s.buildings.push({
      id: "keep_t",
      typeId: "keep",
      realmId: "player",
      x: 3,
      y: 3,
      level,
      completesAtTick: null,
    });
  }
}

describe("W9 labor and companies", () => {
  it("posted farmers add a drip of food each tick", () => {
    const s = createGameState({ seed: 1 });
    s.resources.food = "0";
    const c = createCitizen(s, "player");
    assignJob(s, c.id, "farmer");
    expect(laborPerTick(s).food).toBe(0);
    assignTile(s, c.id, { x: 1, y: 1 });
    expect(laborPerTick(s).food).toBeCloseTo(0.1);
    applyLabor(s, 10);
    expect(Number(s.resources.food)).toBeCloseTo(1);
  });

  it("live ticks pay the posted drip and the HUD includes it", () => {
    const s = createGameState({ seed: 3 });
    s.resources.food = "0";
    const c = createCitizen(s, "player");
    assignJob(s, c.id, "farmer");
    assignTile(s, c.id, { x: 4, y: 4 });
    expect(Number(computeIncomePerSecond(s).food ?? 0)).toBeGreaterThan(0);
    new TickEngine(s).settleTicks(10);
    expect(Number(s.resources.food)).toBeGreaterThan(0);
  });

  it("a barracks opens a second march slot", () => {
    const s = createGameState({ seed: 1 });
    expect(maxMarches(s)).toBe(1);
    s.buildings.push({
      id: "br",
      typeId: "barracks",
      realmId: "player",
      x: 3,
      y: 3,
      level: 1,
      completesAtTick: null,
    });
    expect(maxMarches(s)).toBe(2);
    s.units.push({ id: "u1", typeId: "militia", realmId: "player", count: "20", armyId: null });
    const nodes = s.board.provinces.filter((p) => p.node === "camp" || p.node === "woodcut");
    expect(tryMarch(s, nodes[0].id)).toBe(true);
    expect(tryMarch(s, nodes[1].id)).toBe(true);
    expect(listMarches(s).length).toBe(2);
    expect(tryMarch(s, nodes[0].id)).toBe(false);
  });

  it("extra barracks cannot pass the Keep ceiling until Keep II", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      { id: "br1", typeId: "barracks", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null },
      { id: "br2", typeId: "barracks", realmId: "player", x: 4, y: 3, level: 1, completesAtTick: null }
    );
    expect(maxMarches(s)).toBe(2);
    keepAt(s, 2);
    expect(maxMarches(s)).toBe(3);
  });
});
