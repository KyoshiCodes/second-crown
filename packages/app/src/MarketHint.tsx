import React from "react";
import { canTrade, countBuilding, MARKET_OFFERS, type GameState } from "@second-crown/sim";
import "./market-hint.css";

type Offer = (typeof MARKET_OFFERS)[number];

/** What a trade costs, exactly as the sim table lists its give side, e.g. "20 food". */
export function tradeCostText(offer: Offer): string {
  return Object.entries(offer.give)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");
}

/**
 * Next trade to point at: the first offer in table order that the sim says can
 * be made now (`canTrade`). If none can, the first offer, marked not ready.
 * Null when there is no Market yet. Read-only.
 */
export function nextTrade(state: GameState): { offer: Offer; ready: boolean } | null {
  if (countBuilding(state, "market") < 1) return null;
  const ready = MARKET_OFFERS.find((o) => canTrade(state, o.id));
  if (ready) return { offer: ready, ready: true };
  return MARKET_OFFERS.length ? { offer: MARKET_OFFERS[0], ready: false } : null;
}

export function MarketHint(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const next = nextTrade(state);
  if (!next) {
    return <p className="sc-market-hint is-closed">Next trade · build a Market to open trading.</p>;
  }
  const { offer, ready } = next;
  return (
    <p className={`sc-market-hint${ready ? " is-ready" : ""}`} data-offer={offer.id}>
      Next trade · <strong>{offer.label}</strong> · costs {tradeCostText(offer)}
      {ready ? "" : " · not enough in stores"}. Trade in the Market below.
    </p>
  );
}
