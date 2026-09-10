import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { plantOutpost } from "./outpost.js";
import { garrisonAt, garrisonPower, tryGarrison, tryRecallGarrison } from "./garrison.js";

describe("garrison", () => {
  it("stations militia on a flagged tile and recalls them", () => {
    const s = createGameState({ seed: 1 });
    s.units.push({
      id: "u_m",
      typeId: "militia",
      realmId: "player",
      count: "10",
      armyId: null,
    });
    const camp = s.board.provinces.find((p) => p.node === "camp")!;
    plantOutpost(s, camp);
    const before = Number(s.units.find((u) => u.typeId === "militia" && u.realmId === "player")?.count ?? 0);
    expect(tryGarrison(s, camp.id, { militia: 3 })).toBe(true);
    expect(garrisonAt(s, camp.id)?.force.militia).toBe(3);
    expect(garrisonPower(s, camp.id)).toBeGreaterThan(0);
    expect(Number(s.units.find((u) => u.typeId === "militia" && u.realmId === "player")?.count ?? 0)).toBe(before - 3);
    expect(tryRecallGarrison(s, camp.id)).toBe(true);
    expect(garrisonAt(s, camp.id)).toBeUndefined();
    expect(Number(s.units.find((u) => u.typeId === "militia" && u.realmId === "player")?.count ?? 0)).toBe(before);
  });

  it("refuses a tile that is not a player flag", () => {
    const s = createGameState({ seed: 1 });
    s.units.push({
      id: "u_m",
      typeId: "militia",
      realmId: "player",
      count: "10",
      armyId: null,
    });
    const camp = s.board.provinces.find((p) => p.node === "camp")!;
    expect(tryGarrison(s, camp.id, { militia: 2 })).toBe(false);
  });
});
