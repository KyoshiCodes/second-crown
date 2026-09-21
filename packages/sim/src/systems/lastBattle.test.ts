import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { resolveBattle } from "./combat.js";
import { lastBattleStory } from "./lastBattle.js";

describe("last battle story", () => {
  it("stores events after a fight", () => {
    const s = createGameState({ seed: 1 });
    s.units.push({ id: "u1", typeId: "militia", realmId: "player", count: "8", armyId: null });
    s.units.push({ id: "u2", typeId: "militia", realmId: "rival", count: "2", armyId: null });
    s.wars.push({
      id: "w1",
      attackerRealmId: "player",
      defenderRealmId: "rival",
      startedTick: 0,
      status: "active",
    });
    resolveBattle(s, s.wars[0], createRngStreams(1));
    const story = lastBattleStory(s);
    expect(story).toBeTruthy();
    expect(story!.events.length).toBeGreaterThan(0);
    expect(story!.phases.length).toBeGreaterThan(0);
  });
});
