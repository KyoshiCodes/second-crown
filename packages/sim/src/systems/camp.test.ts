import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { resolveMarchArrival, tryMarch, tryRecallMarch, listMarches, type March } from "./march.js";
import { campThreat, campTierId, campTier } from "./camp.js";
import { resolveCampRaid } from "./engagement.js";
import type { GameState } from "@second-crown/shared";

describe("camps and ruins", () => {
  it("gives camps a 5-9 threat", () => {
    const s = createGameState({ seed: 1 });
    const camp = s.board.provinces.find((p) => p.node === "camp");
    expect(camp).toBeTruthy();
    const t = campThreat(s, camp!);
    expect(t).toBeGreaterThanOrEqual(5);
    expect(t).toBeLessThanOrEqual(9);
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

  describe("camp tiers", () => {
    const campOf = (s: GameState, tier: string) => s.board.provinces.find((p) => campTierId(s, p) === tier)!;
    const march = (s: GameState, toId: string, force: Record<string, number>): March => ({
      id: "m_t",
      realmId: "player",
      fromId: s.board.homeProvinceId,
      toId,
      arrivesTick: 10,
      kind: "camp",
      levy: Object.values(force).reduce((a, b) => a + b, 0),
      force,
    });
    const count = (s: GameState, type: string) =>
      Number(s.units.find((u) => u.realmId === "player" && u.typeId === type)?.count ?? 0);

    it("marks the nearest camp as a safe lean-to and the farthest as a stockade", () => {
      const s = createGameState({ seed: 1 });
      const lean = campOf(s, "lean_to");
      const stock = campOf(s, "stockade");
      expect(lean).toBeTruthy();
      expect(stock).toBeTruthy();
      expect(campTier(s, lean)!.difficulty).toBe("Safe");
      expect(campTier(s, stock)!.difficulty).toBe("Hard");
      const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
      const d = (p: { x: number; y: number }) => Math.abs(p.x - home.x) + Math.abs(p.y - home.y);
      for (const p of s.board.provinces.filter((q) => q.node === "camp")) {
        expect(d(lean)).toBeLessThanOrEqual(d(p));
        expect(d(stock)).toBeGreaterThanOrEqual(d(p));
      }
      expect(s.board.provinces.filter((p) => campTierId(s, p) === "lean_to")).toHaveLength(1);
      expect(s.board.provinces.filter((p) => campTierId(s, p) === "stockade")).toHaveLength(1);
    });

    it("is deterministic: same seed, same tiers", () => {
      const a = createGameState({ seed: 7 });
      const b = createGameState({ seed: 7 });
      const tiers = (s: GameState) => s.board.provinces.map((p) => campTierId(s, p));
      expect(tiers(a)).toEqual(tiers(b));
    });

    it("lean-to: 3 militia always clear it, all come home, +6 wood +3 food", () => {
      for (let seed = 1; seed <= 5; seed++) {
        const s = createGameState({ seed });
        const lean = campOf(s, "lean_to");
        const before = count(s, "militia");
        const wood = Number(s.resources.wood);
        const food = Number(s.resources.food);
        const msg = resolveMarchArrival(s, march(s, lean.id, { militia: 3 }), createRngStreams(seed));
        expect(msg).toContain("Lean-to broken");
        expect(count(s, "militia")).toBe(before + 3);
        expect(Number(s.resources.wood)).toBeGreaterThan(wood);
        expect(Number(s.resources.food)).toBeGreaterThan(food);
        expect(lean.occupantRealmId).toBe("player");
      }
    });

    it("lean-to: a failed raid loses no one", () => {
      const s = createGameState({ seed: 1 });
      const lean = campOf(s, "lean_to");
      const side = { realmId: "player", levy: 1, force: { militia: 1 } };
      const before = count(s, "militia");
      expect(resolveCampRaid(s, side, lean, createRngStreams(3))).toBe("lose");
      expect(count(s, "militia")).toBe(before + 1);
    });

    it("the next-nearest camp becomes the lean-to once the first is flagged", () => {
      const s = createGameState({ seed: 1 });
      const first = campOf(s, "lean_to");
      resolveMarchArrival(s, march(s, first.id, { militia: 3 }), createRngStreams(1));
      const next = campOf(s, "lean_to");
      expect(next).toBeTruthy();
      expect(next.id).not.toBe(first.id);
    });

    it("stockade: a militia blob cannot take it", () => {
      const s = createGameState({ seed: 1 });
      const stock = campOf(s, "stockade");
      let wins = 0;
      for (let i = 0; i < 20; i++) {
        const side = { realmId: "player", levy: 20, force: { militia: 20 } };
        if (resolveCampRaid(s, side, stock, createRngStreams(100 + i)) === "win") wins++;
      }
      expect(wins).toBe(0);
    });

    it("stockade: siege engines breach the palisade and win more often than the same force without them", () => {
      const s = createGameState({ seed: 1 });
      const stock = campOf(s, "stockade");
      const mixed = { spearman: 6, archer: 4, militia: 5 };
      let plain = 0;
      let sieged = 0;
      for (let i = 0; i < 30; i++) {
        if (resolveCampRaid(s, { realmId: "player", levy: 15, force: { ...mixed } }, stock, createRngStreams(200 + i)) === "win") plain++;
        if (resolveCampRaid(s, { realmId: "player", levy: 17, force: { ...mixed, siege: 2 } }, stock, createRngStreams(200 + i)) === "win") sieged++;
      }
      expect(sieged).toBe(30);
      expect(plain).toBeLessThan(sieged);
    });

    it("stockade pays gold, stone and wood, plus siege gold, and returns the survivors by type", () => {
      const s = createGameState({ seed: 1 });
      const stock = campOf(s, "stockade");
      const gold = Number(s.resources.gold);
      const stone = Number(s.resources.stone);
      const msg = resolveMarchArrival(s, march(s, stock.id, { spearman: 6, archer: 4, militia: 5, siege: 2 }), createRngStreams(5));
      expect(msg).toContain("Stockade broken");
      expect(msg).toContain("Siege broke the palisade");
      expect(Number(s.resources.gold) - gold).toBeGreaterThanOrEqual(1);
      expect(Number(s.resources.stone) - stone).toBeGreaterThanOrEqual(1);
      expect(count(s, "siege")).toBeGreaterThan(0);
      expect(count(s, "spearman")).toBeGreaterThan(0);
    });
  });
});
