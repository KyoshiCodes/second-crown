import { describe, expect, it } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tickWorldClash, tryJoinClash, activeClash } from "./worldClash.js";

describe("world clashes", () => {
  it("starts a clash at tick 300 and accepts a levy", () => {
    const s = createGameState({ seed: 2 });
    s.meta.tick = 300;
    s.resources.gold = "50";
    tickWorldClash(s, 300);
    const c = activeClash(s);
    expect(c).not.toBeNull();
    expect(tryJoinClash(s, c!.a)).toBe(true);
    expect(s.flags.world_side).toBe(c!.a);
  });
});
