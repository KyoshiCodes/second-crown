import { describe, it, expect } from "vitest";
import { runProgression, progressionText } from "./progressionHarness.js";
import { BREACH_RESPITE_TICKS } from "../content/raids.js";

describe("progression harness", () => {
  const r = runProgression();

  it("plays a fresh realm to Keep III and times each Keep", () => {
    expect(r.reachedKeep).toBe(3);
    expect(r.keepAt[1]).not.toBeNull();
    expect(r.keepAt[2]!).toBeGreaterThan(r.keepAt[1]!);
    expect(r.keepAt[3]!).toBeGreaterThan(r.keepAt[2]!);
    // Measured 2026-11-25: Keep I ~2m, II ~20m, III ~2h06m. Loose bound so a balance pass does not break the harness.
    expect(r.keepAt[3]!).toBeLessThan(4 * 36_000);
    expect(r.ticksRun).toBe(r.keepAt[3]);
  });

  it("logs the study order with start and finish ticks", () => {
    expect(r.studies[0].id).toBe("husbandry");
    expect(r.studies.map((s) => s.id)).toContain("horse");
    for (const s of r.studies) if (s.doneTick !== null) expect(s.doneTick).toBeGreaterThan(s.startTick);
  });

  it("names bottlenecks and store shape at each Keep", () => {
    expect(r.bottlenecks.length).toBeGreaterThan(0);
    for (const b of r.bottlenecks) expect(b.ticks % r.turnEvery).toBe(0);
    // Mid-game is timer-bound, not store-bound: the longest wait is the Keep III build.
    expect(r.bottlenecks[0]).toMatchObject({ goal: "keep III", limiter: "timer" });
    expect(r.shape.map((s) => s.label)).toEqual(["start", "keep I", "keep II", "keep III", "end"]);
    for (const s of r.shape) for (const res of ["food", "wood", "stone", "gold"]) expect(s.stores[res]).toBeLessThanOrEqual(s.caps[res]);
  });

  it("is deterministic and prints a short stable report", () => {
    const again = runProgression();
    expect(again).toEqual(r);
    const text = progressionText(r);
    expect(text).toBe(progressionText(again));
    expect(text.split("\n").length).toBeLessThanOrEqual(12);
    expect(text).toMatch(/^Progression \(seed 20260930/);
    expect(text).toContain("Keep: I ");
    expect(text).toContain("Raids: ");
  });

  it("a low-touch realm (one look every 30 minutes) still reaches Keep III and is never spiralled", () => {
    const idle = runProgression({ turnEvery: 18_000 });
    expect(idle.reachedKeep).toBe(3);
    expect(idle.raids.breached).toBeGreaterThan(0);
    // Breach respite caps how often an unguarded hold is hit: after three breaches in a row,
    // at most one more per hour plus the stage gap.
    const hours = idle.ticksRun / 36_000;
    expect(idle.raids.total).toBeLessThan(6 + hours * (36_000 / BREACH_RESPITE_TICKS[3]) + 4);
    expect(idle.raids.total).toBeLessThan(runProgression({ turnEvery: 200, maxTicks: idle.ticksRun, targetKeep: 6 }).raids.total);
  });
});
