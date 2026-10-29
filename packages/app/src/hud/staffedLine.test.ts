import { describe, expect, it } from "vitest";
import { createGameState, getProvince, isProvinceSeen, neighbors, tryAssignCitizen } from "@second-crown/sim";
import { staffedLine } from "./staffedLine";

describe("staffedLine", () => {
  it("shows Staffed for a farm with a worker posted", () => {
    const state = createGameState();
    state.buildings.push({ id: "b-test", typeId: "farm", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null });
    state.citizens.push({ id: "c-test", realmId: "player", job: "unassigned", tile: null });
    expect(tryAssignCitizen(state, "c-test", "b-test")).toBe(true);
    expect(staffedLine(state, state.board.homeProvinceId)).toBe("Staffed");
  });

  it("is null for an empty farm", () => {
    const state = createGameState();
    state.buildings.push({ id: "b-test", typeId: "farm", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null });
    expect(staffedLine(state, state.board.homeProvinceId)).toBeNull();
  });

  it("is null on an empty province", () => {
    const state = createGameState();
    expect(staffedLine(state, state.board.homeProvinceId)).toBeNull();
    const tile = neighbors(state, state.board.homeProvinceId)[0];
    getProvince(state, tile.id)!.occupantRealmId = null;
    expect(staffedLine(state, tile.id)).toBeNull();
  });

  it("stays hidden on an unseen tile", () => {
    const state = createGameState();
    const far = state.board.provinces.find((p) => !isProvinceSeen(state, p.id))!;
    expect(staffedLine(state, far.id)).toBeNull();
  });
});
