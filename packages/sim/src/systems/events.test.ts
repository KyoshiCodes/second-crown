import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";

describe("world events", () => {
  it("same seed + settle vs tickMany produce same last_event", () => {
    const N = 1500;
    const a = createGameState({ seed: 99, now: 1, withStarterBuildings: true });
    const b = createGameState({ seed: 99, now: 1, withStarterBuildings: true });
    new TickEngine(a).tickMany(N);
    new TickEngine(b).settleTicks(N);
    expect(a.flags.last_event).toBe(b.flags.last_event);
    expect(a.flags.last_event_tick).toBe(b.flags.last_event_tick);
    expect(a.resources).toEqual(b.resources);
  });
});
