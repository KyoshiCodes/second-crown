import React from "react";
import { canTrade, countBuilding, tryTrade, type GameState } from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import "./offer-card.css";
import { flashAction } from "./ActionFlash";
import { StallStatus, stallStatusRows } from "./StallStatus";

type Offer = { id: string; give: Record<string, string>; get: Record<string, string> };

/** One market stall: give / get / stock rows, then Trade. Disabled when it cannot be paid. */
export function OfferCard(props: { state: GameState | undefined; offer: Offer; act: ActFn }) {
  const { state, offer, act } = props;
  const ok = !!state && canTrade(state, offer.id);
  const rows = stallStatusRows({
    give: offer.give,
    get: offer.get,
    resources: state?.resources,
    hasMarket: !!state && countBuilding(state, "market") > 0,
  });
  return (
    <div className={`sc-offer-card${ok ? "" : " is-off"}`}>
      <StallStatus rows={rows} />
      <button
        type="button"
        className="sc-offer-btn"
        disabled={!ok}
        onClick={() => act((st) => {
          if (!tryTrade(st, offer.id)) return "Cannot trade.";
          flashAction("trade");
          return "Trade complete.";
        })}
      >
        Trade
      </button>
    </div>
  );
}
