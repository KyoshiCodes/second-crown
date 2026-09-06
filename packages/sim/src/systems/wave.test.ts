import { describe, expect, it } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryFoundGuild } from "../actions/faction.js";
import { tryBuyShield, tryCraft, tryKingdomTrade, tryRenameGuild, listAchievements, flagNum } from "./wave.js";

describe("wave 1 systems", () => {
  it("buys a shield when gold is enough", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "300";
    expect(tryBuyShield(s)).toBe(true);
    expect(flagNum(s, "shield_until")).toBeGreaterThan(s.meta.tick);
    expect(s.flags.ach_shield).toBe(1);
  });

  it("crafts harvest charm from iron spoils", () => {
    const s = createGameState({ seed: 1 });
    s.flags.spoils_iron = 10;
    expect(tryCraft(s, "harvest_charm")).toBe(true);
    expect(flagNum(s, "craft_income")).toBe(2);
    expect(flagNum(s, "spoils_iron")).toBe(2);
  });

  it("trades gold to Iron March for iron", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "40";
    expect(tryKingdomTrade(s, "rival", "rival_iron")).toBe(true);
    expect(flagNum(s, "spoils_iron")).toBe(3);
  });

  it("renames a founded guild", () => {
    const s = createGameState({ seed: 1 });
    expect(tryFoundGuild(s, "Old")).toBe(true);
    expect(tryRenameGuild(s, "Sun Host")).toBe(true);
    expect(s.factions.find((f) => f.leaderRealmId === "player")?.name).toBe("Sun Host");
    expect(listAchievements(s).find((a) => a.def.id === "ach_guild")?.done).toBe(true);
  });
});
