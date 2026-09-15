import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { isProvinceSeen } from "./fog.js";
import { tryDispatchScout } from "./scoutColumn.js";
import { routeTiles } from "./columnVision.js";

describe("column vision", () => {
  it("lights tiles on the road before the scout arrives", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "40";
    s.resources.food = "200";
    s.units.push({ id: "u_player_m", typeId: "militia", realmId: "player", count: "4", armyId: null });
    const far = s.board.provinces.find((p) => Math.abs(p.x - 2) + Math.abs(p.y - 2) >= 4)!;
    const path = routeTiles(s, s.board.homeProvinceId, far.id);
    const hidden = path.find((id) => !isProvinceSeen(s, id));
    expect(hidden).toBeTruthy();
    expect(tryDispatchScout(s, far.id)).toBe(true);
    new TickEngine(s).settleTicks(45);
    expect(isProvinceSeen(s, hidden!)).toBe(true);
  });
});
