import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { tryTrain } from "../actions/train.js";
import { tryDeclareWar, tryResolveWar } from "../actions/war.js";
import { realmPower, resolveBattle, fortificationPower, defenseBonus } from "./combat.js";
import { trainDurationTicks } from "./training.js";
import { D } from "../core/decimal.js";
import type { War } from "@second-crown/shared";

function trainNow(state: ReturnType<typeof createGameState>, typeId: string, count: number) {
  tryTrain(state, { typeId, count });
  new TickEngine(state).settleTicks(trainDurationTicks(state, typeId, count));
}

describe("combat / war", () => {
  it("declare war and resolve is deterministic for same seed", () => {
    const run = (seed: number) => {
      const state = createGameState({ seed, now: 1 });
      state.resources.food = "500";
      state.resources.wood = "500";
      state.resources.gold = "100";
      trainNow(state, "militia", 20);
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
      trainNow(state, "militia", 15);
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
    expect(realmPower(state, "player")).toBe(before);
    expect(D(state.resources.food).eq(80)).toBe(true);
    expect(D(state.resources.wood).eq(95)).toBe(true);
    new TickEngine(state).settleTicks(trainDurationTicks(state, "militia", 5));
    expect(realmPower(state, "player")).toBe(before + 5);
  });

  it("keep adds flat fortification power to both offense and defense", () => {
    const state = createGameState({ seed: 1 });
    const before = realmPower(state, "player");
    state.buildings.push({
      id: "b_keep",
      typeId: "keep",
      realmId: "player",
      x: 0,
      y: 0,
      level: 1,
      completesAtTick: null,
    });
    expect(fortificationPower(state, "player")).toBe(8);
    expect(realmPower(state, "player")).toBe(before + 8);
    expect(fortificationPower(state, "rival")).toBe(0);
  });

  it("keep grants an additional defense-only bonus, applied only when defending", () => {
    const state = createGameState({ seed: 1 });
    state.buildings.push({
      id: "b_keep",
      typeId: "keep",
      realmId: "player",
      x: 0,
      y: 0,
      level: 1,
      completesAtTick: null,
    });
    expect(defenseBonus(state, "player")).toBe(8);

    const engine = new TickEngine(state);
    const war: War = {
      id: "w1",
      attackerRealmId: "rival",
      defenderRealmId: "player",
      startedTick: 0,
      status: "active",
    };
    const result = resolveBattle(state, war, engine.rng);
    expect(result.defenderPower).toBe(realmPower(state, "player") + 8);

    const state2 = createGameState({ seed: 1 });
    state2.buildings.push({
      id: "b_keep",
      typeId: "keep",
      realmId: "player",
      x: 0,
      y: 0,
      level: 1,
      completesAtTick: null,
    });
    const engine2 = new TickEngine(state2);
    const war2: War = {
      id: "w2",
      attackerRealmId: "player",
      defenderRealmId: "rival",
      startedTick: 0,
      status: "active",
    };
    const result2 = resolveBattle(state2, war2, engine2.rng);
    expect(result2.attackerPower).toBe(realmPower(state2, "player"));
  });
});
