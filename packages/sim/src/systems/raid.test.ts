import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryStrikeHorde } from "./raid.js";
import { tryBuyBazaar } from "./loot.js";
import { flagNum } from "./wave.js";

describe("raid and bazaar", () => {
  it("strikes the horde for spoils", () => {
    const s = createGameState({ seed: 11 });
    s.resources.food = "20";
    s.resources.gold = "10";
    expect(tryStrikeHorde(s)).toBe(true);
    expect(flagNum(s, "spoils_iron")).toBeGreaterThan(0);
    expect(tryStrikeHorde(s)).toBe(false);
  });

  it("buys iron from the bazaar", () => {
    const s = createGameState({ seed: 11 });
    s.resources.gold = "14";
    expect(tryBuyBazaar(s, "iron")).toBe(true);
    expect(flagNum(s, "spoils_iron")).toBe(2);
  });
});
