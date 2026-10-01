import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { storageCap, addCapped, resourceLedger } from "./storage.js";
import { vaultProtects } from "./vault.js";
import { EconomySystem } from "./economy.js";

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

describe("storageCap", () => {
  it("gives a tight default warehouse with no storage buildings", () => {
    const s = createGameState({ seed: 1 });
    expect(storageCap(s, "food")).toBe(200);
    expect(storageCap(s, "wood")).toBe(150);
    expect(storageCap(s, "stone")).toBe(150);
    expect(storageCap(s, "gold")).toBe(100);
  });

  it("does not cap resources outside the warehouse set", () => {
    const s = createGameState({ seed: 1 });
    expect(storageCap(s, "mana")).toBe(Infinity);
  });

  it("raises the cap for each finished storage building, ignoring unfinished ones", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      { id: "g1", typeId: "granary", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null },
      { id: "g2", typeId: "granary", realmId: "player", x: 1, y: 0, level: 1, completesAtTick: 999 }
    );
    expect(storageCap(s, "food")).toBe(200 + 300);
  });

  it.each([
    ["food", "granary", 200, 500],
    ["wood", "sawmill", 150, 400],
    ["stone", "mason", 150, 400],
    ["gold", "mint", 100, 250],
  ] as const)("%s cap rises only once its %s is finished", (res, typeId, before, after) => {
    const s = createGameState({ seed: 1 });
    s.buildings.push({ id: "w1", typeId, realmId: "player", x: 0, y: 0, level: 1, completesAtTick: 500 });
    expect(storageCap(s, res)).toBe(before);
    s.buildings[s.buildings.length - 1].completesAtTick = null;
    expect(storageCap(s, res)).toBe(after);
  });

  it("finished Keep II lifts every cap by 20%", () => {
    const s = createGameState({ seed: 1 });
    keepAt(s, 2);
    expect(storageCap(s, "food")).toBe(240);
    expect(storageCap(s, "wood")).toBe(180);
    expect(storageCap(s, "stone")).toBe(180);
    expect(storageCap(s, "gold")).toBe(120);
  });

  it("Keep II stretches the default floor and the granary wing", () => {
    const s = createGameState({ seed: 1 });
    const base = storageCap(s, "food");
    keepAt(s, 2);
    expect(storageCap(s, "food")).toBe(Math.floor(base * 1.2));
    s.buildings.push({
      id: "g1",
      typeId: "granary",
      realmId: "player",
      x: 0,
      y: 0,
      level: 1,
      completesAtTick: null,
    });
    expect(storageCap(s, "food")).toBe(Math.floor((200 + 300) * 1.2));
  });
});

describe("addCapped", () => {
  it("clamps a gain at the cap and loses the excess", () => {
    const s = createGameState({ seed: 1 });
    s.resources.wood = "148";
    addCapped(s, "wood", 10);
    expect(s.resources.wood).toBe("150");
  });

  it("does not clamp spends (non-positive amounts)", () => {
    const s = createGameState({ seed: 1 });
    s.resources.wood = "50";
    addCapped(s, "wood", -20);
    expect(s.resources.wood).toBe("30");
  });
});

describe("production respects storage caps", () => {
  it("two farms cannot fill food past the food warehouse cap", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      { id: "f1", typeId: "farm", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null },
      { id: "f2", typeId: "farm", realmId: "player", x: 1, y: 0, level: 1, completesAtTick: null }
    );
    EconomySystem.advanceAnalytic(s, 0, 5000);
    expect(Number(s.resources.food)).toBeLessThanOrEqual(storageCap(s, "food"));
  });

  it("gives the same final food whether advanced in one jump or several smaller ones", () => {
    const a = createGameState({ seed: 7 });
    a.buildings.push({ id: "f1", typeId: "farm", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null });
    const b = createGameState({ seed: 7 });
    b.buildings.push({ id: "f1", typeId: "farm", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null });

    EconomySystem.advanceAnalytic(a, 0, 400);

    EconomySystem.advanceAnalytic(b, 0, 130);
    EconomySystem.advanceAnalytic(b, 130, 260);
    EconomySystem.advanceAnalytic(b, 260, 400);

    expect(a.resources.food).toBe(b.resources.food);
    expect(Number(a.resources.food)).toBe(storageCap(a, "food"));
  });
});

describe("resourceLedger", () => {
  it("marks a full warehouse and reports the raid-safe vault floor", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = String(storageCap(s, "gold"));
    const line = resourceLedger(s, "gold");
    expect(line.full).toBe(true);
    expect(line.cap).toBe(100);
    expect(line.vault).toBe(vaultProtects(s, "gold"));
    expect(line.exposed).toBe(Math.max(0, line.have - line.vault));
  });
});
