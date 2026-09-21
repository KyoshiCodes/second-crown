import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { resolveBattle } from "./combat.js";
import type { War } from "@second-crown/shared";

function war(): War {
  return {
    id: "w",
    attackerRealmId: "player",
    defenderRealmId: "rival",
    startedTick: 0,
    status: "active",
  };
}

function set(state: ReturnType<typeof createGameState>, realmId: string, typeId: string, count: number) {
  state.units = state.units.filter((u) => !(u.realmId === realmId && u.typeId === typeId));
  state.units = state.units.filter((u) => u.realmId !== realmId);
  state.units.push({ id: `${realmId}_${typeId}`, realmId, typeId, count: String(count), armyId: null });
}

describe("round resolver", () => {
  it("same seed produces the same winner and event count", () => {
    const run = (seed: number) => {
      const s = createGameState({ seed: 1 });
      set(s, "player", "militia", 20);
      set(s, "rival", "militia", 20);
      return resolveBattle(s, war(), createRngStreams(seed));
    };
    const a = run(7);
    const b = run(7);
    expect(a.winnerId).toBe(b.winnerId);
    expect(a.events?.length).toBe(b.events?.length);
  });

  it("twice the militia wins", () => {
    const s = createGameState({ seed: 1 });
    set(s, "player", "militia", 40);
    set(s, "rival", "militia", 20);
    const r = resolveBattle(s, war(), createRngStreams(3));
    expect(r.winnerId).toBe("player");
  });
});
