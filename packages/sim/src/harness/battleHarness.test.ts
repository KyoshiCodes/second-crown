import { describe, it, expect } from "vitest";
import { runHarness, runOneFight, harnessSummary } from "./battleHarness.js";

describe("battle harness", () => {
  it("same seed and composition produce the same winner", () => {
    const a = runOneFight(42, "even", { militia: 20 }, { militia: 20 });
    const b = runOneFight(42, "even", { militia: 20 }, { militia: 20 });
    expect(a.winnerId).toBe(b.winnerId);
    expect(a.atkSwing).toBe(b.atkSwing);
    expect(a.defSwing).toBe(b.defSwing);
  });

  it("runs 1000 fights and 2x militia never loses under the current resolver", () => {
    const rows = runHarness(1000);
    expect(rows).toHaveLength(1000);
    const sum = harnessSummary(rows);
    expect(sum.twoXNeverLoses).toBe(true);
    expect(sum.playerWins).toBeGreaterThan(0);
    expect(sum.playerWins).toBeLessThan(1000);
  });
});
