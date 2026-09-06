import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";

export function getOpinion(state: GameState, fromCharId: string, toCharId: string): number {
  return state.opinions.find((o) => o.from === fromCharId && o.to === toCharId)?.value ?? 0;
}

export function rivalOpinionOfPlayer(state: GameState): number {
  return getOpinion(state, "char_rival", "char_player");
}

export function playerOpinionOfRival(state: GameState): number {
  return getOpinion(state, "char_player", "char_rival");
}

function bump(state: GameState, from: string, to: string, delta: number): void {
  let edge = state.opinions.find((o) => o.from === from && o.to === to);
  if (!edge) {
    edge = { from, to, value: 0, expiresTick: null };
    state.opinions.push(edge);
  }
  edge.value = Math.max(-100, Math.min(100, edge.value + delta));
}

/** Spend gold to soothe Lord Varric. */
export function tryGiftGold(state: GameState, amount = 15): boolean {
  if (D(state.resources.gold ?? "0").lt(amount)) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(amount));
  bump(state, "char_rival", "char_player", 12);
  bump(state, "char_player", "char_rival", 6);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "gift",
    payload: { amount, to: "rival" },
    issuerId: "player",
  } satisfies InputRecord);
  return true;
}
