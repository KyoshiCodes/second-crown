import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { isProvinceSeen } from "./fog.js";
import { listMarches } from "./march.js";
import { tryDispatchScout } from "./scoutColumn.js";

describe("scout columns", () => {
  it("pays gold, walks, maps the tile, and returns the runner", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "40";
    s.units.push({ id: "u_player_m", typeId: "militia", realmId: "player", count: "4", armyId: null });
    const far = s.board.provinces.find((p) => Math.abs(p.x - 2) + Math.abs(p.y - 2) >= 3)!;
    expect(isProvinceSeen(s, far.id)).toBe(false);
    expect(tryDispatchScout(s, far.id)).toBe(true);
    expect(isProvinceSeen(s, far.id)).toBe(false);
    expect(listMarches(s).some((m) => m.purpose === "scout" && m.toId === far.id)).toBe(true);
    const gold = Number(s.resources.gold);
    expect(gold).toBeLessThan(40);
    const before = Number(s.units.find((u) => u.realmId === "player" && u.typeId === "militia")?.count ?? 0);
    const eta = listMarches(s)[0].arrivesTick - s.meta.tick;
    new TickEngine(s).settleTicks(eta);
    expect(isProvinceSeen(s, far.id)).toBe(true);
    expect(listMarches(s)).toEqual([]);
    expect(Number(s.units.find((u) => u.realmId === "player" && u.typeId === "militia")?.count ?? 0)).toBe(before + 1);
  });

  it("refuses a tile already seen", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "40";
    s.units.push({ id: "u_player_m", typeId: "militia", realmId: "player", count: "2", armyId: null });
    expect(tryDispatchScout(s, s.board.homeProvinceId)).toBe(false);
  });
});
