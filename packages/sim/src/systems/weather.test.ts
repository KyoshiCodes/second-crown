import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { marchSpeedFactor, weatherFor, type Weather } from "./weather.js";

function stateWith(weather: Weather) {
  for (let seed = 1; seed < 500; seed++) {
    for (const tick of [0, 2000, 4000, 6000]) {
      const s = createGameState({ seed });
      s.meta.tick = tick;
      if (weatherFor(s) === weather) return s;
    }
  }
  throw new Error(`no seed rolls ${weather}`);
}

describe("weather", () => {
  it("clear weather gives factor 1", () => {
    expect(marchSpeedFactor(weatherFor(stateWith("clear")))).toBe(1);
  });

  it("rain gives 0.8", () => {
    expect(marchSpeedFactor(weatherFor(stateWith("rain")))).toBe(0.8);
  });

  it("storm gives 0.6", () => {
    expect(marchSpeedFactor(weatherFor(stateWith("storm")))).toBe(0.6);
  });

  it("snow gives 1", () => {
    expect(marchSpeedFactor(weatherFor(stateWith("snow")))).toBe(1);
  });

  it("is deterministic for the same state seed", () => {
    for (let seed = 1; seed < 20; seed++) {
      const a = createGameState({ seed });
      const b = createGameState({ seed });
      a.meta.tick = b.meta.tick = 4123;
      expect(weatherFor(a)).toBe(weatherFor(b));
      expect(marchSpeedFactor(weatherFor(a))).toBe(marchSpeedFactor(weatherFor(b)));
    }
  });

  it("holds for the whole season", () => {
    const s = createGameState({ seed: 7 });
    s.meta.tick = 2000;
    const w = weatherFor(s);
    s.meta.tick = 3999;
    expect(weatherFor(s)).toBe(w);
  });
});
