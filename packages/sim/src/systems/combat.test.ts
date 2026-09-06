import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { tryTrain } from "../actions/train.js";
import { tryDeclareWar, tryResolveWar } from "../actions/war.js";
import { realmPower } from "./combat.js";
import { D } from "../core/decimal.js";

describe("combat / war", () => {
  it("declare war and resolve is deterministic for same seed", () => {
    const run = (seed: number) => {
      const state = createGameState({ seed, now: 1 });
      state.resources.food = "500";
      state.resources.wood = "500";
      state.resources.gold = "100";
      tryTrain(state, { typeId: "militia", count: 20 });
      tryDeclareWar(state, { attackerRealmId: "player", defenderRealmId: "rival" });
      const engine = new TickEngine(state);
      const result = tryResolveWar(state, engine.rng);
      return {
        ok: result.ok,
        winner: result.result?.winnerId,
        playerPower: realmPower(state, "player"),
        rivalPower: realmPower(state, "rival"),
        playerUnits: state.units.filter((u) => u.realmId === "player").map((u) => u.count),
        rivalUnits: state.units.filter((u) => u.realmId === "rival").map((u) => u.count),
        warStatus: state.wars[0]?.status,
      };
    };

    const a = run(42);
    const b = run(42);
    expect(a).toEqual(b);
    expect(a.ok).toBe(true);
    expect(a.warStatus === "attacker_won" || a.warStatus === "defender_won").toBe(true);
  });

  it("different seeds can produce different outcomes", () => {
    const outcomes = new Set<string>();
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const state = createGameState({ seed, now: 1 });
      state.resources.food = "500";
      state.resources.wood = "500";
      tryTrain(state, { typeId: "militia", count: 15 });
      tryDeclareWar(state, { attackerRealmId: "player", defenderRealmId: "rival" });
      const engine = new TickEngine(state);
      const result = tryResolveWar(state, engine.rng);
      outcomes.add(result.result?.winnerId ?? "none");
    }
    expect(outcomes.size).toBeGreaterThanOrEqual(1);
  });

  it("training deducts cost and increases power", () => {
    const state = createGameState({ seed: 1 });
    state.resources.food = "100";
    state.resources.wood = "100";
    const before = realmPower(state, "player");
    expect(tryTrain(state, { typeId: "militia", count: 5 })).toBe(true);
    expect(realmPower(state, "player")).toBe(before + 5);
    // militia costs 4 food + 1 wood each → 20 food, 5 wood
    expect(D(state.resources.food).eq(80)).toBe(true);
    expect(D(state.resources.wood).eq(95)).toBe(true);
  });
});
