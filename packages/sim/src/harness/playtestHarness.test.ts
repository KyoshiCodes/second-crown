import { describe, it, expect } from "vitest";
import { runPlaytest, playtestMarkdown } from "./playtestHarness.js";

describe("playtest harness", () => {
  it("plays a fresh game for many ticks without the sim throwing", () => {
    const r = runPlaytest({ ticks: 3000 });
    expect(r.ticksRun).toBe(3000);
    expect(r.errors).toEqual([]);
    expect(r.actions["build cottage"]?.ok).toBeGreaterThan(0);
    expect(r.actions["train militia x2"]?.ok).toBeGreaterThan(0);
    expect(r.actions["build quarry"]?.ok).toBeGreaterThan(0);
    expect(r.actions["build walls"]?.ok).toBeGreaterThan(0);
    expect(r.actions["march x3 militia"]?.ok).toBe(1);
    expect(r.primer.reached).toBeGreaterThanOrEqual(2);
  });

  it("same seed gives the same report and markdown", () => {
    const a = runPlaytest({ seed: 7, ticks: 1500 });
    const b = runPlaytest({ seed: 7, ticks: 1500 });
    expect(b).toEqual(a);
    expect(playtestMarkdown(b)).toBe(playtestMarkdown(a));
  });
});
