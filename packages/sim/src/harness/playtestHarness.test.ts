import { describe, it, expect } from "vitest";
import { runPlaytest, playtestMarkdown } from "./playtestHarness.js";

describe("playtest harness", () => {
  it("plays a fresh game for many ticks without the sim throwing", () => {
    // 3100: the first home raid launches at 3000 and lands at 3045.
    const r = runPlaytest({ ticks: 3100 });
    expect(r.ticksRun).toBe(3100);
    expect(r.errors).toEqual([]);
    expect(r.actions["build cottage"]?.ok).toBeGreaterThan(0);
    expect(r.actions["train militia x4"]?.ok).toBeGreaterThan(0);
    expect(r.actions["build quarry"]?.ok).toBeGreaterThan(0);
    expect(r.actions["build walls"]?.ok).toBeGreaterThan(0);
    expect(r.actions["march x3 militia"]?.ok).toBe(1);
    expect(r.primer.reached).toBeGreaterThanOrEqual(2);
    // Home defense: each raid that reached the hold is logged with militia left and the siege result.
    expect(r.raids.windows.length).toBeGreaterThan(0);
    for (const w of r.raids.windows) expect(w.result).not.toBe("unknown");
    expect(r.raids.list[0].tick).toBeGreaterThanOrEqual(3000);
    expect(r.raids.windows.some((w) => w.result === "held")).toBe(true);
  });

  it("builds a watchtower on stone, then scouts once gold exists", () => {
    const m = runPlaytest({ seed: 7, ticks: 1500 }).milestones;
    expect(m.quarryBuilt).not.toBeNull();
    expect(m.watchtowerBuilt).not.toBeNull();
    expect(m.goldReached).not.toBeNull();
    expect(m.scoutLaunched).not.toBeNull();
    expect(m.goldReached!).toBeGreaterThan(m.watchtowerBuilt!);
    expect(m.scoutLaunched!).toBeGreaterThanOrEqual(m.goldReached!);
    expect(runPlaytest({ seed: 7, ticks: 1500 }).milestones).toEqual(m);
  });

  it("same seed gives the same report and markdown", () => {
    const a = runPlaytest({ seed: 7, ticks: 1500 });
    const b = runPlaytest({ seed: 7, ticks: 1500 });
    expect(b).toEqual(a);
    expect(playtestMarkdown(b)).toBe(playtestMarkdown(a));
  });
});
