import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { DAY_CYCLE_TICKS, dayPhase, dayPhaseAt, nightWorkFactor, sunMoonPosition, sunMoonPositionAt } from "./dayNight.js";

describe("day and night", () => {
  it("walks dawn, day, dusk, night in one cycle", () => {
    const s = createGameState({ seed: 1 });
    const seen: string[] = [];
    for (let t = 0; t < DAY_CYCLE_TICKS; t++) {
      s.meta.tick = t;
      const p = dayPhase(s);
      if (seen.at(-1) !== p) seen.push(p);
    }
    expect(seen).toEqual(["dawn", "day", "dusk", "night"]);
  });

  it("one day lasts 3600 ticks", () => {
    expect(DAY_CYCLE_TICKS).toBe(3600);
  });

  it("phase boundaries", () => {
    expect(dayPhaseAt(0)).toBe("dawn");
    expect(dayPhaseAt(539)).toBe("dawn");
    expect(dayPhaseAt(540)).toBe("day");
    expect(dayPhaseAt(1979)).toBe("day");
    expect(dayPhaseAt(1980)).toBe("dusk");
    expect(dayPhaseAt(2519)).toBe("dusk");
    expect(dayPhaseAt(2520)).toBe("night");
    expect(dayPhaseAt(3599)).toBe("night");
    expect(dayPhaseAt(3600)).toBe("dawn");
  });

  it("repeats every cycle", () => {
    for (let t = 0; t < 500; t += 7) expect(dayPhaseAt(t + DAY_CYCLE_TICKS * 3)).toBe(dayPhaseAt(t));
  });

  it("same seed and tick always give the same phase", () => {
    for (let seed = 1; seed < 20; seed++) {
      const a = createGameState({ seed });
      const b = createGameState({ seed });
      a.meta.tick = b.meta.tick = 4123 + seed;
      expect(dayPhase(a)).toBe(dayPhase(b));
    }
  });

  it("night work factor is 0.8 at night, 1 otherwise", () => {
    expect(nightWorkFactor("night")).toBe(0.8);
    expect(nightWorkFactor("dawn")).toBe(1);
    expect(nightWorkFactor("day")).toBe(1);
    expect(nightWorkFactor("dusk")).toBe(1);
  });

  it("sun during day, moon during night", () => {
    const s = createGameState({ seed: 1 });
    for (let t = 0; t < DAY_CYCLE_TICKS * 2; t += 13) {
      s.meta.tick = t;
      const p = dayPhase(s);
      const body = sunMoonPosition(s);
      if (p === "day") expect(body.kind).toBe("sun");
      if (p === "night") expect(body.kind).toBe("moon");
      expect(body.elevation).toBeGreaterThanOrEqual(0);
      expect(body.elevation).toBeLessThanOrEqual(1);
      expect(body.y).toBeCloseTo(1 - body.elevation, 10);
    }
  });

  it("elevation is 0 at the dawn and dusk edges and peaks mid-sky", () => {
    expect(sunMoonPositionAt(0)).toMatchObject({ kind: "sun", x: 0, elevation: 0 });
    expect(sunMoonPositionAt(2520)).toMatchObject({ kind: "moon", x: 0, elevation: 0 });
    expect(sunMoonPositionAt(2519).elevation).toBeLessThan(0.01);
    expect(sunMoonPositionAt(3599).elevation).toBeLessThan(0.01);
    expect(sunMoonPositionAt(1260).elevation).toBeCloseTo(1, 10);
    expect(sunMoonPositionAt(3060).elevation).toBeCloseTo(1, 10);
  });

  it("moves smoothly from tick to tick", () => {
    for (let t = 0; t < DAY_CYCLE_TICKS - 1; t++) {
      if (t === 2519) continue; // sun sets, moon rises
      const a = sunMoonPositionAt(t);
      const b = sunMoonPositionAt(t + 1);
      expect(Math.abs(b.x - a.x)).toBeLessThan(0.01);
      expect(Math.abs(b.elevation - a.elevation)).toBeLessThan(0.01);
    }
  });

  it("same tick always gives the same sun/moon position", () => {
    for (let t = 0; t < 10_000; t += 97) expect(sunMoonPositionAt(t)).toEqual(sunMoonPositionAt(t + DAY_CYCLE_TICKS * 5));
  });
});
