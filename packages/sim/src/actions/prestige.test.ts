import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryAscend, canAscend, ascendThreshold } from "./prestige.js";
import { tryFoundGuild } from "./faction.js";
import { setPlayerCulture, playerCultureId } from "../systems/culture.js";
import { unlock } from "../systems/wave.js";

describe("Second Dawn (tryAscend)", () => {
  it("refuses an early crown below the ascend threshold", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    s.resources = { gold: "100", food: "100", wood: "100", stone: "100" };
    const before = JSON.stringify(s);
    expect(canAscend(s)).toBe(false);
    expect(tryAscend(s)).toBe(false);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("a legal ascend keeps culture, guild, achievements, dawn count and wipes the rest", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    setPlayerCulture(s, "woodland");
    tryFoundGuild(s, "Ash Banner");
    unlock(s, "ach_farm");
    unlock(s, "ach_guild");
    s.buildings.push({ id: "b_extra", typeId: "farm", realmId: "player", x: 3, y: 3, level: 2, completesAtTick: null });
    s.units.push({ id: "u_mine", typeId: "militia", realmId: "player", count: "9", armyId: null });
    s.wars.push({ id: "w1", attackerRealmId: "rival", defenderRealmId: "player", startedTick: 0 } as never);
    s.flags.peace_rival = 1;
    s.resources = { gold: String(ascendThreshold(s)), food: "0", wood: "0", stone: "0" };

    expect(tryAscend(s)).toBe(true);

    // keeps
    expect(playerCultureId(s)).toBe("woodland");
    expect(s.factions.find((f) => f.leaderRealmId === "player")?.name).toBe("Ash Banner");
    expect(s.flags.ach_farm).toBe(1);
    expect(s.flags.ach_guild).toBe(1);
    expect(s.flags.prestige_level).toBe(1);
    expect(s.flags.prestige_total).toBe(1);

    // wipes
    expect(s.resources).toEqual({ gold: "0", food: "25", wood: "35", stone: "0" });
    expect(s.buildings.map((b) => b.typeId)).toEqual(["farm", "lumber_camp"]);
    expect(s.units.some((u) => u.realmId === "player")).toBe(false);
    expect(s.units.some((u) => u.realmId === "rival")).toBe(true);
    expect(s.wars).toEqual([]);
    expect(s.flags.peace_rival).toBeUndefined();
    expect(s.inputLog.at(-1)?.type).toBe("ascend");

    // the second dawn raises the bar
    expect(ascendThreshold(s)).toBe(55_000);
  });
});
