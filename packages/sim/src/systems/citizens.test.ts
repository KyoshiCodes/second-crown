import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import {
  createCitizen,
  assignJob,
  assignTile,
  citizensByRealm,
  countCitizensByJob,
  jobForBuildingType,
} from "./citizens.js";

describe("citizens (stub)", () => {
  it("starts with no citizens", () => {
    const state = createGameState({ seed: 1 });
    expect(state.citizens).toEqual([]);
  });

  it("creates a citizen defaulting to unassigned with no tile", () => {
    const state = createGameState({ seed: 1 });
    const c = createCitizen(state, "player");
    expect(c.job).toBe("unassigned");
    expect(c.tile).toBeNull();
    expect(citizensByRealm(state, "player")).toEqual([c]);
  });

  it("assigns a job and a tile presentation can read later", () => {
    const state = createGameState({ seed: 1 });
    const c = createCitizen(state, "player");
    expect(assignJob(state, c.id, "farmer")).toBe(true);
    expect(assignTile(state, c.id, { x: 2, y: 3 })).toBe(true);
    expect(c.job).toBe("farmer");
    expect(c.tile).toEqual({ x: 2, y: 3 });
    expect(countCitizensByJob(state, "player", "farmer")).toBe(1);
  });

  it("assignment fails silently for an unknown citizen id", () => {
    const state = createGameState({ seed: 1 });
    expect(assignJob(state, "nope", "farmer")).toBe(false);
    expect(assignTile(state, "nope", { x: 0, y: 0 })).toBe(false);
  });

  it("maps building types to a suggested job, including fortifications to guard", () => {
    expect(jobForBuildingType("farm")).toBe("farmer");
    expect(jobForBuildingType("watchtower")).toBe("guard");
    expect(jobForBuildingType("walls")).toBe("guard");
    expect(jobForBuildingType("keep")).toBe("guard");
    expect(jobForBuildingType("mystery_building")).toBe("unassigned");
  });
});
