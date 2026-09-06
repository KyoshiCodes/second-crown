import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { extraArchetypes, playerTitle } from "./world.js";
import { tryFoundGuild, tryJoinFaction } from "../actions/faction.js";

describe("world seed", () => {
  it("same seed produces the same extra kingdoms", () => {
    const a = extraArchetypes(42);
    const b = extraArchetypes(42);
    expect(a.map((x) => x.key)).toEqual(b.map((x) => x.key));
    const c = extraArchetypes(99);
    expect(c.map((x) => x.key).join()).not.toBe(a.map((x) => x.key).join());
  });

  it("createGameState includes extra realms and a faction", () => {
    const s = createGameState({ seed: 42 });
    expect(s.realms.length).toBeGreaterThan(2);
    expect(s.factions.length).toBeGreaterThan(0);
  });

  it("founding a guild is deterministic-safe", () => {
    const s = createGameState({ seed: 1 });
    expect(tryFoundGuild(s, "Night Banner")).toBe(true);
    expect(s.factions.some((f) => f.leaderRealmId === "player")).toBe(true);
    expect(tryFoundGuild(s, "Second")).toBe(false);
  });

  it("can join a friendly NPC order", () => {
    const s = createGameState({ seed: 42 });
    const fac = s.factions[0];
    fac.stance = 10;
    expect(tryJoinFaction(s, fac.id)).toBe(true);
    expect(fac.memberRealmIds.includes("player")).toBe(true);
  });

  it("starting title is Petty Lord", () => {
    const s = createGameState({ seed: 1 });
    expect(playerTitle(s)).toBe("Petty Lord");
  });
});
