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

/** Gold a standard gift costs. */
export const GIFT_GOLD_COST = 15;
/** Opinion the receiving ruler gains from a gift before bonuses. */
export const GIFT_BASE_OPINION = 12;
const OPINION_CAP = 100;

/** Extra opinion a gift earns: Silk Seal (+4), Court doctrine (+5), Envoys decree (+6). */
export function giftBonusOpinion(state: GameState): number {
  return giftOpinionBonus(state) + (state.flags.doctrine === "court" ? 5 : 0) + (decreeActive(state, "envoys") ? 6 : 0);
}

/** Opinion the receiving ruler would gain from one gift right now. */
export function giftOpinionGain(state: GameState): number {
  return GIFT_BASE_OPINION + giftBonusOpinion(state);
}

export type GiftBlock = "no_ruler" | "at_cap" | "no_gold";

export interface GiftOffer {
  realmId: string;
  /** Gold the gift costs. */
  cost: number;
  /** Opinion the ruler would gain (before the +100 cap). */
  gain: number;
  /** Their opinion of the player now. */
  opinion: number;
  /** Gold still missing, 0 when affordable. */
  short: number;
  ok: boolean;
  /** Why the gift cannot be sent, null when ok. */
  block: GiftBlock | null;
}

/** Read-only: what a gift to this realm costs, what it earns, and whether it can be sent. */
export function giftOffer(state: GameState, realmId = "rival", amount = GIFT_GOLD_COST): GiftOffer {
  const ruler = state.characters.find((c) => c.realmId === realmId && c.role === "ruler");
  const opinion = ruler ? getOpinion(state, ruler.id, "char_player") : 0;
  const gold = D(state.resources.gold ?? "0");
  const short = gold.lt(amount) ? Math.ceil(D(amount).sub(gold).toNumber()) : 0;
  const block: GiftBlock | null = !ruler ? "no_ruler" : opinion >= OPINION_CAP ? "at_cap" : short > 0 ? "no_gold" : null;
  return { realmId, cost: amount, gain: giftOpinionGain(state), opinion, short, ok: block === null, block };
}

export function tryGiftGold(state: GameState, amount = GIFT_GOLD_COST, realmId = "rival"): boolean {
  if (!giftOffer(state, realmId, amount).ok) return false;
  const ruler = state.characters.find((c) => c.realmId === realmId && c.role === "ruler");
  if (!ruler) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(amount));
  const extra = giftBonusOpinion(state);
  bump(state, ruler.id, "char_player", GIFT_BASE_OPINION + extra);
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
