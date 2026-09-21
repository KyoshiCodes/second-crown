import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { maxLevelFor } from "../actions/upgrade.js";
import { KEEP_GATES, currentKeepGate, keepGateFor } from "./keepGate.js";

describe("keep gate table", () => {
  it("matches maxLevelFor at every keep level", () => {
    const s = createGameState({ seed: 1 });
    for (const row of KEEP_GATES) {
      const keep = s.buildings.find((b) => b.typeId === "keep" && b.realmId === "player");
      if (keep) {
        keep.level = Math.max(1, row.keep);
        keep.completesAtTick = row.keep === 0 ? 99 : null;
      }
      if (row.keep === 0 && keep) keep.completesAtTick = 99;
      expect(keepGateFor(row.keep).otherCap).toBe(row.otherCap);
      if (row.keep === 0) {
        expect(currentKeepGate(s).otherCap).toBe(2);
      } else if (keep) {
        keep.completesAtTick = null;
        keep.level = row.keep;
        expect(maxLevelFor(s, "farm")).toBe(row.otherCap);
        expect(currentKeepGate(s).otherCap).toBe(row.otherCap);
      }
    }
  });

  it("lists marshal, drill, stores, columns, beds, and plots from Keep II", () => {
    expect(keepGateFor(1).marshal).toMatch(/Rank 1/);
    expect(keepGateFor(1).trainCap).toBe(2);
    expect(keepGateFor(1).storeMult).toBe(1);
    expect(keepGateFor(1).marchCap).toBe(2);
    expect(keepGateFor(1).bedBase).toBe(5);
    expect(keepGateFor(1).plotBase).toBe(3);
    expect(keepGateFor(2).marshal).toMatch(/Rank 2/);
    expect(keepGateFor(2).trainCap).toBe(3);
    expect(keepGateFor(2).trainSpeed).toBeLessThan(1);
    expect(keepGateFor(2).storeMult).toBeGreaterThan(1);
    expect(keepGateFor(2).marchCap).toBe(3);
    expect(keepGateFor(2).bedBase).toBe(8);
    expect(keepGateFor(2).plotBase).toBe(4);
    expect(keepGateFor(5).bedBase).toBe(17);
    expect(keepGateFor(5).plotBase).toBe(7);
  });

  it("bed and plot bases match housing formulas without cottages", () => {
    for (const row of KEEP_GATES) {
      expect(row.bedBase).toBe(2 + row.keep * 3);
      expect(row.plotBase).toBe(2 + row.keep);
    }
  });
});
