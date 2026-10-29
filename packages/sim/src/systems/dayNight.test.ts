import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { DAY_CYCLE_TICKS, dayPhase, dayPhaseAt, nightWorkFactor } from "./dayNight.js";

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

  it("phase boundaries", () => {
    expect(dayPhaseAt(0)).toBe("dawn");
    expect(dayPhaseAt(19)).toBe("dawn");
    expect(dayPhaseAt(20)).toBe("day");
    expect(dayPhaseAt(69)).toBe("day");
    expect(dayPhaseAt(70)).toBe("dusk");
    expect(dayPhaseAt(89)).toBe("dusk");
    expect(dayPhaseAt(90)).toBe("night");
    expect(dayPhaseAt(119)).toBe("night");
    expect(dayPhaseAt(120)).toBe("dawn");
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
});
