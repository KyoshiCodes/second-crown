import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { giftOpinionBonus, noteGift } from "../systems/wave.js";
import { decreeActive } from "../systems/decree.js";

export function getOpinion(state: GameState, fromCharId: string, toCharId: string): number {
  return state.opinions.find((o) => o.from === fromCharId && o.to === toCharId)?.value ?? 0;
}

export function rivalOpinionOfPlayer(state: GameState): number {
  return getOpinion(state, "char_rival", "char_player");
}

export function playerOpinionOfRival(state: GameState): number {
  return getOpinion(state, "char_player", "char_rival");
}

export function opinionOfPlayerFromRealm(state: GameState, realmId: string): number {
  const ruler = state.characters.find((c) => c.realmId === realmId && c.role === "ruler");
  if (!ruler) return 0;
  return getOpinion(state, ruler.id, "char_player");
}

function bump(state: GameState, from: string, to: string, delta: number): void {
  let edge = state.opinions.find((o) => o.from === from && o.to === to);
  if (!edge) {
    edge = { from, to, value: 0, expiresTick: null };
    state.opinions.push(edge);
  }
  edge.value = Math.max(-100, Math.min(100, edge.value + delta));
}

export function tryGiftGold(state: GameState, amount = 15, realmId = "rival"): boolean {
  if (D(state.resources.gold ?? "0").lt(amount)) return false;
  const ruler = state.characters.find((c) => c.realmId === realmId && c.role === "ruler");
  if (!ruler) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(amount));
  const extra = giftOpinionBonus(state) + (state.flags.doctrine === "court" ? 5 : 0) + (decreeActive(state, "envoys") ? 6 : 0);
  bump(state, ruler.id, "char_player", 12 + extra);
  bump(state, "char_player", ruler.id, 6 + extra);
  noteGift(state);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "gift",
    payload: { amount, to: realmId },
    issuerId: "player",
  } satisfies InputRecord);
  return true;
}
