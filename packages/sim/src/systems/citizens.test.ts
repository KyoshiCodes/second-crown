import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import {
  createCitizen,
  assignJob,
  assignTile,
  citizensByRealm,
  countCitizensByJob,
  jobForBuildingType,
  seedCitizensFromBuildings,
  hireCitizenForBuilding,
  walkerRoleForJob,
} from "./citizens.js";
import { EconomySystem } from "./economy.js";

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

  it("seeds one worker per finished building when the roster is empty", () => {
    const state = createGameState({ seed: 1 });
    state.buildings.push({
      id: "b1",
      typeId: "farm",
      realmId: "player",
      x: 3,
      y: 4,
      level: 1,
      completesAtTick: null,
    });
    seedCitizensFromBuildings(state);
    expect(state.citizens).toHaveLength(1);
    expect(state.citizens[0].job).toBe("farmer");
    expect(state.citizens[0].tile).toEqual({ x: 3, y: 4 });
    seedCitizensFromBuildings(state);
    expect(state.citizens).toHaveLength(1);
  });

  it("hires a worker when a building finishes", () => {
    const state = createGameState({ seed: 1 });
    state.meta.tick = 10;
    state.buildings.push({
      id: "b2",
      typeId: "keep",
      realmId: "player",
      x: 1,
      y: 1,
      level: 1,
      completesAtTick: 10,
    });
    EconomySystem.processEventsAt(state, 10);
    expect(state.buildings[0].completesAtTick).toBeNull();
    expect(state.citizens[0].job).toBe("guard");
    expect(state.citizens[0].tile).toEqual({ x: 1, y: 1 });
    expect(hireCitizenForBuilding(state, "player", "chapel", 2, 2).job).toBe("scholar");
  });

  it("maps jobs to walker roles (farmer=villager, woodcutter, miner, merchant, guard, scholar)", () => {
    expect(walkerRoleForJob("farmer")).toBe("villager");
    expect(walkerRoleForJob("woodcutter")).toBe("woodcutter");
    expect(walkerRoleForJob("miner")).toBe("miner");
    expect(walkerRoleForJob("merchant")).toBe("merchant");
    expect(walkerRoleForJob("guard")).toBe("guard");
    expect(walkerRoleForJob("scholar")).toBe("scholar");
    expect(walkerRoleForJob("unassigned")).toBe("villager");
  });
});
