import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryGiftGold, rivalOpinionOfPlayer } from "./diplomacy.js";

describe("diplomacy", () => {
  it("gift spends gold and raises rival opinion", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "40";
    const before = rivalOpinionOfPlayer(state);
    expect(tryGiftGold(state)).toBe(true);
    expect(rivalOpinionOfPlayer(state)).toBe(before + 12);
    expect(state.resources.gold).toBe("25");
  });

  it("rejects gift without gold", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "0";
    expect(tryGiftGold(state)).toBe(false);
  });
});
