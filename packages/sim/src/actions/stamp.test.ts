import { describe, expect, it } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { listStamps, tryStamp } from "./stamp.js";

describe("stamp", () => {
  it("records a stamp at the current tick in the input log", () => {
    const state = createGameState({ seed: 1, now: 0 });
    new TickEngine(state).tickMany(3);
    expect(tryStamp(state, "guest_a")).toBe(true);
    expect(listStamps(state)).toEqual([{ tick: 3, by: "guest_a" }]);
    expect(state.inputLog.at(-1)).toMatchObject({ tick: 3, type: "stamp", issuerId: "guest_a" });
  });

  it("refuses a bad issuer and changes nothing", () => {
    const state = createGameState({ seed: 1, now: 0 });
    expect(tryStamp(state, "")).toBe(false);
    expect(tryStamp(state, "../x")).toBe(false);
    expect(state.inputLog).toEqual([]);
  });

  it("changes no resources", () => {
    const state = createGameState({ seed: 1, now: 0 });
    const before = JSON.stringify(state.resources);
    tryStamp(state, "guest_a");
    expect(JSON.stringify(state.resources)).toBe(before);
  });
});
