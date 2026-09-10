import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { resolveMarchArrival, tryMarch, tryRecallMarch, listMarches, type March } from "./march.js";
import { campThreat } from "./camp.js";

describe("camps and ruins", () => {
  it("gives camps a 4-8 threat", () => {
    const s = createGameState({ seed: 1 });
    const camp = s.board.provinces.find((p) => p.node === "camp");
    expect(camp).toBeTruthy();
    const t = campThreat(s, camp!);
    expect(t).toBeGreaterThanOrEqual(4);
    expect(t).toBeLessThanOrEqual(8);
  });

  it("can recall a column before it arrives and returns the levy", () => {
    const s = createGameState({ seed: 1 });
    s.units.push({ id: "u1", typeId: "militia", realmId: "player", count: "20", armyId: null });
    const camp = s.board.provinces.find((p) => p.node === "camp");
    expect(tryMarch(s, camp!.id)).toBe(true);
    expect(listMarches(s)).toHaveLength(1);
    expect(tryRecallMarch(s)).toBe(true);
    expect(listMarches(s)).toHaveLength(0);
    expect(s.units.find((u) => u.typeId === "militia" && u.realmId === "player")?.count).toBe("20");
  });

  it("ruins pay gold and stone on a winning raid", () => {
    const s = createGameState({ seed: 1 });
    s.board.provinces.push({ id: "p_ruins", x: 8, y: 7, terrain: "waste", node: "ruins", occupantRealmId: null });
    const march: March = {
      id: "m_r",
      realmId: "player",
      fromId: s.board.homeProvinceId,
      toId: "p_ruins",
      arrivesTick: 10,
      kind: "node",
      levy: 5,
    };
    const msg = resolveMarchArrival(s, march, createRngStreams(1));
    expect(msg.toLowerCase()).toContain("ruin");
    expect(Number(s.resources.gold)).toBeGreaterThanOrEqual(3);
    expect(Number(s.resources.stone)).toBeGreaterThanOrEqual(3);
  });
});
