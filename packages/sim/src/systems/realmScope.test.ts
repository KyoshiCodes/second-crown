import { describe, it, expect } from "vitest";
import type { War } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { activeWarFor, tryDeclareWar, tryResolveWar, tryWhitePeace, warSummary } from "../actions/war.js";
import { tryUpgrade } from "../actions/upgrade.js";
import { tryCancelBuild, tryDemolish } from "../actions/build.js";
import { tryCancelTraining } from "./training.js";
import { createRngStreams } from "../core/rng.js";

/** Realm scope: one realm's war, buildings or orders must not be read or changed as the player's. */

function npcWar(state: ReturnType<typeof createGameState>): War {
  const war: War = {
    id: "war_npc_k_ash_k_silk_400",
    attackerRealmId: "k_ash",
    defenderRealmId: "k_silk",
    startedTick: 0,
    status: "active",
  };
  state.wars.push(war);
  return war;
}

describe("realm scope: wars", () => {
  it("a war between two other realms is not the player's war", () => {
    const state = createGameState({ seed: 1, now: 1 });
    npcWar(state);
    expect(activeWarFor(state)).toBeUndefined();
    expect(activeWarFor(state, "k_ash")?.id).toBe("war_npc_k_ash_k_silk_400");
    expect(warSummary(state).activeWar).toBeUndefined();
  });

  it("white peace and resolve leave another realm's war alone", () => {
    const state = createGameState({ seed: 1, now: 1 });
    const war = npcWar(state);
    const rng = createRngStreams(1);
    expect(tryWhitePeace(state)).toBe(false);
    expect(tryResolveWar(state, rng).ok).toBe(false);
    expect(tryResolveWar(state, rng, war.id).ok).toBe(false);
    expect(war.status).toBe("active");
    expect(state.inputLog.some((r) => r.type === "white_peace" || r.type === "resolve_war")).toBe(false);
  });

  it("the player can declare while two other realms are at war", () => {
    const state = createGameState({ seed: 1, now: 1 });
    npcWar(state);
    expect(tryDeclareWar(state, { attackerRealmId: "player", defenderRealmId: "rival" })).toBe(true);
    expect(activeWarFor(state)?.defenderRealmId).toBe("rival");
    // White peace now ends the player's war, not the NPC one listed first.
    expect(tryWhitePeace(state)).toBe(true);
    expect(state.wars.find((w) => w.attackerRealmId === "k_ash")?.status).toBe("active");
    expect(state.wars.find((w) => w.attackerRealmId === "player")?.status).toBe("white_peace");
  });

  it("the player is never in two wars at once", () => {
    const state = createGameState({ seed: 1, now: 1 });
    expect(tryDeclareWar(state, { attackerRealmId: "player", defenderRealmId: "rival" })).toBe(true);
    expect(tryDeclareWar(state, { attackerRealmId: "player", defenderRealmId: "k_ash" })).toBe(false);
    expect(tryDeclareWar(state, { attackerRealmId: "k_ash", defenderRealmId: "player" })).toBe(false);
    expect(state.wars.filter((w) => w.status === "active")).toHaveLength(1);
  });

  it("after real ticks, the player's war read only ever returns a war the player is in", () => {
    const state = createGameState({ seed: 20260930, now: 1 });
    npcWar(state);
    new TickEngine(state).settleTicks(3000);
    const mine = warSummary(state).activeWar;
    expect(mine === undefined || mine.attackerRealmId === "player" || mine.defenderRealmId === "player").toBe(true);
    // NPC wars now settle themselves at the main clash (living realm); the player never ends them.
    const npc = state.wars.find((w) => w.id === "war_npc_k_ash_k_silk_400");
    expect(npc?.status).not.toBe("active");
    expect(state.inputLog.some((r) => r.type === "white_peace" || r.type === "resolve_war")).toBe(false);
  });
});

describe("realm scope: player actions pay from and refund to the player's stores only", () => {
  function withRivalBuilding(done: boolean) {
    const state = createGameState({ seed: 1, now: 1 });
    state.buildings.push({
      id: "b_rival",
      typeId: "farm",
      realmId: "rival",
      x: 3,
      y: 3,
      level: 1,
      completesAtTick: done ? null : 500,
    });
    state.resources = { food: "9999", wood: "9999", stone: "9999", gold: "9999" };
    return state;
  }

  it("cannot upgrade another realm's building", () => {
    const state = withRivalBuilding(true);
    const before = { ...state.resources };
    expect(tryUpgrade(state, "b_rival")).toBe(false);
    expect(state.resources).toEqual(before);
  });

  it("cannot cancel another realm's scaffolding for a refund", () => {
    const state = withRivalBuilding(false);
    const before = { ...state.resources };
    expect(tryCancelBuild(state, "b_rival")).toBe(false);
    expect(state.buildings.some((b) => b.id === "b_rival")).toBe(true);
    expect(state.resources).toEqual(before);
  });

  it("cannot demolish another realm's building", () => {
    const state = withRivalBuilding(true);
    const before = { ...state.resources };
    expect(tryDemolish(state, "b_rival")).toBe(false);
    expect(state.buildings.some((b) => b.id === "b_rival")).toBe(true);
    expect(state.resources).toEqual(before);
  });

  it("cannot cancel another realm's training order for a refund", () => {
    const state = createGameState({ seed: 1, now: 1 });
    state.flags.training_json = JSON.stringify([
      { id: "tr_9", realmId: "rival", typeId: "militia", count: 5, startedTick: 0, doneTick: 500, paid: { food: "50" } },
    ]);
    const food = state.resources.food;
    expect(tryCancelTraining(state, "tr_9")).toBe(false);
    expect(state.resources.food).toBe(food);
    expect(JSON.parse(String(state.flags.training_json))).toHaveLength(1);
  });
});
