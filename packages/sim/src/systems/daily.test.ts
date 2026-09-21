import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { dailyClaimed, tryClaimDaily } from "./daily.js";
import { D } from "../core/decimal.js";

describe("daily claim", () => {
  it("pays once per UTC day", () => {
    const s = createGameState({ seed: 1 });
    const t0 = 1_700_000_000_000;
    const gold = D(s.resources.gold ?? "0").toNumber();
    expect(tryClaimDaily(s, t0)).toBe(true);
    expect(dailyClaimed(s, t0)).toBe(true);
    expect(D(s.resources.gold ?? "0").toNumber()).toBeGreaterThanOrEqual(gold);
    expect(tryClaimDaily(s, t0 + 3_600_000)).toBe(false);
    expect(tryClaimDaily(s, t0 + 86_400_000)).toBe(true);
  });
});
