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

  it("a saved empty army stays empty", () => {
    const state = createGameState({ seed: 1 });
    state.units = [];
    const loaded = deserializeState(serializeState(state));
    expect(loaded.units).toEqual([]);
  });

  it("a saved empty worker list stays empty, even beside a finished farm", () => {
    const state = createGameState({ seed: 1, withStarterBuildings: true });
    state.citizens = [];
    const loaded = deserializeState(serializeState(state));
    expect(loaded.citizens).toEqual([]);
    expect(deserializeState(serializeState(loaded)).citizens).toEqual([]);
  });

  it("a fresh starter game gains no farm worker over repeated reloads", () => {
    const state = createGameState({ seed: 7, withStarterBuildings: true });
    let loaded = state;
    for (let i = 0; i < 3; i++) loaded = deserializeState(serializeState(loaded));
    expect(loaded.citizens).toEqual(state.citizens);
    expect(loaded.units).toEqual(state.units);
  });

  it("a save that omits units and citizens still loads and gets the old fill", () => {
    const state = createGameState({ seed: 1, withStarterBuildings: true });
    const raw = JSON.parse(serializeState(state));
    delete raw.units;
    delete raw.citizens;
    const loaded = deserializeState(JSON.stringify(raw));
    expect(loaded.units.some((u) => u.realmId === "rival")).toBe(true);
    for (const r of loaded.realms.filter((r) => r.id.startsWith("k_"))) {
      expect(loaded.units.some((u) => u.realmId === r.id)).toBe(true);
    }
    expect(loaded.citizens.map((c) => c.job)).toEqual(["farmer"]);
  });
});
