import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";
import { createRngStreams } from "../core/rng.js";
import { storageCap } from "./storage.js";
import { listLedger } from "./ledger.js";
import {
  applySiegeBlow,
  edgeWallCount,
  hasClosedWallRing,
  listMarches,
  resolveMarchArrival,
  siegeDefense,
  tryMarch,
  wallHp,
  type March,
} from "./march.js";

describe("W2 marches and walls", () => {
  it("open field has no ring and low wall hp", () => {
    const s = createGameState({ seed: 1 });
    expect(hasClosedWallRing(s)).toBe(false);
    expect(wallHp(s)).toBe(0);
  });

  it("eight rim walls plus a rim gate close the ring", () => {
    const s = createGameState({ seed: 1 });
    for (let i = 0; i < 8; i++) {
      s.buildings.push({
        id: `w${i}`,
        typeId: "walls",
        realmId: "player",
        x: i,
        y: 0,
        level: 1,
        completesAtTick: null,
      });
    }
    expect(edgeWallCount(s, "player")).toBe(8);
    expect(hasClosedWallRing(s)).toBe(false);
    expect(wallHp(s)).toBe(8 * 12);
    s.buildings.push({
      id: "g1",
      typeId: "gate",
      realmId: "player",
      x: 15,
      y: 3,
      level: 1,
      completesAtTick: null,
    });
    expect(hasClosedWallRing(s)).toBe(true);
    expect(wallHp(s)).toBe(8 * 12 + 20 + 30);
    expect(siegeDefense(s, "player")).toBeGreaterThan(wallHp(s) - 1);
  });

  it("march reaches a camp and can pay wood", () => {
    const s = createGameState({ seed: 1 });
    s.units.push({ id: "u1", typeId: "militia", realmId: "player", count: "20", armyId: null });
    const camp = s.board.provinces.find((p) => p.node === "camp");
    expect(camp).toBeTruthy();
    expect(tryMarch(s, camp!.id)).toBe(true);
    const mid = D(s.units.find((u) => u.id === "u1")?.count ?? "0").toNumber();
    expect(mid).toBe(15);
    expect(tryMarch(s, camp!.id)).toBe(false);
    expect(listMarches(s)).toHaveLength(1);
    const eta = listMarches(s)[0].arrivesTick;
    const eng = new TickEngine(s);
    eng.settleTicks(eta);
    expect(listMarches(s)).toHaveLength(0);
    expect(Number(s.resources.wood)).toBeGreaterThanOrEqual(0);
  });

  it("cannot march without militia", () => {
    const s = createGameState({ seed: 1 });
    const camp = s.board.provinces.find((p) => p.node === "camp");
    expect(tryMarch(s, camp!.id)).toBe(false);
  });

  it("blowout siege scars a non-keep building and never the keep", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      { id: "k", typeId: "keep", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null },
      { id: "f", typeId: "farm", realmId: "player", x: 1, y: 1, level: 1, completesAtTick: null }
    );
    const hit = applySiegeBlow(s, 200, 10);
    expect(hit).toBe("farm");
    expect(s.buildings.find((b) => b.id === "f")?.completesAtTick).toBe(s.meta.tick + 40);
    expect(s.buildings.find((b) => b.id === "k")?.completesAtTick).toBeNull();
    expect(applySiegeBlow(s, 10, 200)).toBeNull();
  });

  it("cut raid haul: camp pays +6 wood, a gather node pays +5", () => {
    const rng = createRngStreams(1);
    const camp = createGameState({ seed: 1 });
    const campMarch: March = {
      id: "m1",
      realmId: "player",
      fromId: camp.board.homeProvinceId,
      toId: "p_9_9",
      arrivesTick: 10,
      kind: "camp",
      levy: 5,
    };
    camp.board.provinces.push({ id: "p_9_9", x: 9, y: 9, terrain: "plain", node: "camp", occupantRealmId: null });
    resolveMarchArrival(camp, campMarch, rng);
    expect(camp.resources.wood).toBe("6");
    expect(listLedger(camp).some((e) => /Camp broken/.test(e.text))).toBe(true);

    const node = createGameState({ seed: 1 });
    node.board.provinces.push({ id: "p_9_9", x: 9, y: 9, terrain: "plain", node: "woodcut", occupantRealmId: null });
    const nodeMarch: March = {
      id: "m2",
      realmId: "player",
      fromId: node.board.homeProvinceId,
      toId: "p_9_9",
      arrivesTick: 10,
      kind: "node",
      levy: 5,
    };
    resolveMarchArrival(node, nodeMarch, rng);
    expect(node.resources.wood).toBe("5");
    expect(listLedger(node).some((e) => /Woodcutting/.test(e.text))).toBe(true);
  });

  it("raid payouts are lost past the wood storage cap", () => {
    const s = createGameState({ seed: 1 });
    s.resources.wood = String(storageCap(s, "wood"));
    s.board.provinces.push({ id: "p_9_9", x: 9, y: 9, terrain: "plain", node: "camp", occupantRealmId: null });
    const march: March = {
      id: "m3",
      realmId: "player",
      fromId: s.board.homeProvinceId,
      toId: "p_9_9",
      arrivesTick: 10,
      kind: "camp",
      levy: 5,
    };
    resolveMarchArrival(s, march, createRngStreams(1));
    expect(s.resources.wood).toBe(String(storageCap(s, "wood")));
  });
});
