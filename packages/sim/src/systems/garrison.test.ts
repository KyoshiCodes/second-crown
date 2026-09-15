import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { listOutposts, plantOutpost } from "./outpost.js";
import { createRngStreams } from "../core/rng.js";
import {
  garrisonAt,
  garrisonPower,
  mergeGarrisonForce,
  tryAbandonOutpost,
  tryGarrison,
  tryRecallGarrison,
} from "./garrison.js";
import { resolveMarchArrival } from "./march.js";

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

  it("strong garrison holds a flag against an NPC column", () => {
    const s = createGameState({ seed: 1 });
    const camp = s.board.provinces.find((p) => p.node === "camp")!;
    plantOutpost(s, camp);
    mergeGarrisonForce(s, camp.id, { militia: 20 });
    const msg = resolveMarchArrival(
      s,
      {
        id: "m_npc",
        realmId: "rival",
        fromId: s.board.provinces.find((p) => p.occupantRealmId === "rival")?.id ?? camp.id,
        toId: camp.id,
        arrivesTick: s.meta.tick,
        kind: "node",
        levy: 8,
      },
      createRngStreams(1)
    );
    expect(msg).toMatch(/Garrison holds/);
    expect(camp.occupantRealmId).toBe("player");
  });

  it("abandoning a flag sends the garrison home and drops the banner", () => {
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
    expect(tryGarrison(s, camp.id, { militia: 4 })).toBe(true);
    expect(tryAbandonOutpost(s, camp.id)).toBe(true);
    expect(listOutposts(s).some((p) => p.id === camp.id)).toBe(false);
    expect(garrisonAt(s, camp.id)).toBeUndefined();
    expect(Number(s.units.find((u) => u.typeId === "militia" && u.realmId === "player")?.count ?? 0)).toBe(10);
  });
});
