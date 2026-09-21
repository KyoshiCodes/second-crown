import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { seasonClaimed, tryClaimSeason } from "./seasonClaim.js";
import { D } from "../core/decimal.js";

describe("season claim", () => {
  it("pays once and refuses a second claim", () => {
    const s = createGameState({ seed: 1 });
    const food = D(s.resources.food ?? "0").toNumber();
    expect(tryClaimSeason(s)).toBe(true);
    expect(seasonClaimed(s)).toBe(true);
    expect(D(s.resources.food ?? "0").toNumber()).toBeGreaterThanOrEqual(food);
    expect(tryClaimSeason(s)).toBe(false);
    s.meta.tick = 2000;
    expect(seasonClaimed(s)).toBe(false);
    expect(tryClaimSeason(s)).toBe(true);
  });
});
