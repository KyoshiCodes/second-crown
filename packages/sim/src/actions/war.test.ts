import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryDeclareWar, warSummary } from "./war.js";
import { tryFortify } from "../systems/court.js";
import { tryDecree } from "../systems/decree.js";

describe("warSummary", () => {
  it("reports no active war, no fortify, no decrees on a fresh state", () => {
    const state = createGameState({ seed: 1, now: 1 });
    const summary = warSummary(state);
    expect(summary.activeWar).toBeUndefined();
    expect(summary.fortifyTicksLeft).toBe(0);
    expect(summary.decrees.every((d) => d.ticksLeft === 0)).toBe(true);
    expect(summary.playerPower).toBe(0);
  });

  it("reflects an active war, fortify, and a sworn decree", () => {
    const state = createGameState({ seed: 1, now: 1 });
    state.resources.stone = "50";
    state.resources.gold = "100";
    tryFortify(state);
    tryDecree(state, "muster");
    tryDeclareWar(state, { attackerRealmId: "player", defenderRealmId: "rival" });

    const summary = warSummary(state);
    expect(summary.activeWar?.status).toBe("active");
    expect(summary.fortifyTicksLeft).toBeGreaterThan(0);
    expect(summary.decrees.find((d) => d.id === "muster")?.ticksLeft).toBeGreaterThan(0);
    expect(summary.playerPower).toBeGreaterThan(0);
  });
});
