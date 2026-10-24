import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { seasonLine } from "./seasonLine";

describe("seasonLine", () => {
  const at = (tick: number) => {
    const state = createGameState();
    state.meta.tick = tick;
    return seasonLine(state);
  };

  it("shows spring", () => {
    expect(at(0)).toBe("Season · spring");
  });

  it("shows summer", () => {
    expect(at(2000)).toBe("Season · summer");
  });

  it("shows autumn", () => {
    expect(at(4000)).toBe("Season · autumn");
  });

  it("shows winter", () => {
    expect(at(6000)).toBe("Season · winter");
  });
});
