import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryFoodLevy, levyTicksLeft } from "./levy.js";
import { D } from "../core/decimal.js";

describe("food levy", () => {
  it("turns food into militia and cools down", () => {
    const s = createGameState({ seed: 2 });
    s.resources.food = "20";
    const before = D(s.units.find((u) => u.typeId === "militia" && u.realmId === "player")?.count ?? "0");
    expect(tryFoodLevy(s)).toBe(true);
    const after = D(s.units.find((u) => u.typeId === "militia" && u.realmId === "player")?.count ?? "0");
    expect(after.eq(before.add(4))).toBe(true);
    expect(tryFoodLevy(s)).toBe(false);
    expect(levyTicksLeft(s)).toBeGreaterThan(0);
  });
});
