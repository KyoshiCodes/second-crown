import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";

export interface TradeOffer {
  id: string;
  give: Record<string, string>;
  get: Record<string, string>;
  label: string;
}

export const MARKET_OFFERS: TradeOffer[] = [
  { id: "food_gold", give: { food: "20" }, get: { gold: "5" }, label: "20 food → 5 gold" },
  { id: "wood_gold", give: { wood: "20" }, get: { gold: "5" }, label: "20 wood → 5 gold" },
  { id: "stone_gold", give: { stone: "20" }, get: { gold: "8" }, label: "20 stone → 8 gold" },
  { id: "gold_food", give: { gold: "8" }, get: { food: "25" }, label: "8 gold → 25 food" },
];

export function canTrade(state: GameState, offerId: string): boolean {
  if (countBuilding(state, "market") < 1) return false;
  const offer = MARKET_OFFERS.find((o) => o.id === offerId);
  if (!offer) return false;
  for (const [res, amt] of Object.entries(offer.give)) {
    if (D(state.resources[res] ?? "0").lt(D(amt))) return false;
  }
  return true;
}

export function tryTrade(state: GameState, offerId: string): boolean {
  if (!canTrade(state, offerId)) return false;
  const offer = MARKET_OFFERS.find((o) => o.id === offerId)!;
  for (const [res, amt] of Object.entries(offer.give)) {
    state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").sub(D(amt)));
  }
  for (const [res, amt] of Object.entries(offer.get)) {
    state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").add(D(amt)));
  }
  state.inputLog.push({
    tick: state.meta.tick,
    type: "trade",
    payload: { offerId },
    issuerId: "player",
  } satisfies InputRecord);
  return true;
}
