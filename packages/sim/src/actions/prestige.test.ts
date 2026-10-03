import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryAscend, canAscend, ascendThreshold } from "./prestige.js";
import { tryFoundGuild } from "./faction.js";
import { setPlayerCulture, playerCultureId } from "../systems/culture.js";
import { unlock } from "../systems/wave.js";
import { productionBonus } from "../systems/economy.js";

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
    // (food/wood and the lone militia are the first-dawn gift)
    expect(s.resources).toEqual({ gold: "0", food: "45", wood: "45", stone: "0" });
    expect(s.buildings.map((b) => b.typeId)).toEqual(["farm", "lumber_camp"]);
    expect(s.units.filter((u) => u.realmId === "player").map((u) => [u.typeId, u.count])).toEqual([["militia", "1"]]);
    expect(s.units.some((u) => u.realmId === "rival")).toBe(true);
    expect(s.wars).toEqual([]);
    expect(s.flags.peace_rival).toBeUndefined();
    expect(s.inputLog.at(-1)?.type).toBe("ascend");

    // the second dawn raises the bar
    expect(ascendThreshold(s)).toBe(55_000);
  });
});

describe("Dawn bonus (existing: +1 production bonus per dawn)", () => {
  function ascendOnce(s: ReturnType<typeof createGameState>) {
    s.resources = { gold: String(ascendThreshold(s)), food: "0", wood: "0", stone: "0" };
    expect(tryAscend(s)).toBe(true);
  }

  it("the first dawn adds +1 to productionBonus", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    const before = productionBonus(s);
    ascendOnce(s);
    expect(productionBonus(s)).toBe(before + 1);
  });

  it("a second dawn stacks: +2 over a crown that never ascended", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    const before = productionBonus(s);
    ascendOnce(s);
    ascendOnce(s);
    expect(s.flags.prestige_level).toBe(2);
    expect(productionBonus(s)).toBe(before + 2);
  });
});

describe("First-dawn gift (+1 militia, +20 food, +10 wood, once)", () => {
  function ascendOnce(s: ReturnType<typeof createGameState>) {
    s.resources = { gold: String(ascendThreshold(s)), food: "0", wood: "0", stone: "0" };
    expect(tryAscend(s)).toBe(true);
  }
  const playerMilitia = (s: ReturnType<typeof createGameState>) =>
    s.units.filter((u) => u.realmId === "player" && u.typeId === "militia").reduce((n, u) => n + Number(u.count), 0);

  it("a first dawn has the extra food, wood, and one militia", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    ascendOnce(s);
    expect(s.resources.food).toBe("45");
    expect(s.resources.wood).toBe("45");
    expect(playerMilitia(s)).toBe(1);
    expect(s.flags.dawn_gift).toBe(1);
  });

  it("a second dawn does not add them again", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    ascendOnce(s);
    ascendOnce(s);
    expect(s.flags.prestige_level).toBe(2);
    expect(s.resources.food).toBe("25");
    expect(s.resources.wood).toBe("35");
    expect(playerMilitia(s)).toBe(0);
  });

  it("a crown that never ascended has neither gift", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    s.resources = { gold: "100", food: "100", wood: "100", stone: "100" };
    expect(tryAscend(s)).toBe(false);
    expect(s.flags.dawn_gift).toBeUndefined();
    expect(s.units.some((u) => u.id === "u_dawn_militia")).toBe(false);
    expect(s.resources).toEqual({ gold: "100", food: "100", wood: "100", stone: "100" });
  });
});
