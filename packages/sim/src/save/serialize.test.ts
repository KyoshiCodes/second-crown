import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { serializeState, deserializeState, ensureWorldStubs } from "./serialize.js";

describe("serialize", () => {
  it("round-trips citizens through save/load", () => {
    const state = createGameState({ seed: 1 });
    state.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 1, y: 1 } });
    const loaded = deserializeState(serializeState(state));
    expect(loaded.citizens).toEqual([
      { id: "c1", realmId: "player", job: "farmer", tile: { x: 1, y: 1 } },
    ]);
  });

  it("migrates a pre-citizens save by defaulting citizens to an empty array", () => {
    const state = createGameState({ seed: 1 });
    const raw = JSON.parse(serializeState(state));
    delete raw.citizens;
    expect(raw.citizens).toBeUndefined();
    ensureWorldStubs(raw);
    expect(raw.citizens).toEqual([]);
  });
});
