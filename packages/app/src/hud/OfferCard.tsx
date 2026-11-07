import React from "react";
import { canTrade, countBuilding, tryTrade, type GameState } from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import "./offer-card.css";
import { flashAction } from "./ActionFlash";
import { StallStatus, stallStatusRows } from "./StallStatus";
import {
  MarketLivingGlyph,
  MarketLivingUnderlay,
  getOfferGoodsKind,
} from "./MarketLivingGlyph";

type Offer = { id: string; give: Record<string, string>; get: Record<string, string> };

/** One market stall: give / get / stock rows, living goods glyph, then Trade. Disabled when it cannot be paid. */
export function OfferCard(props: { state: GameState | undefined; offer: Offer; act: ActFn }) {
  const { state, offer, act } = props;
  const ok = !!state && canTrade(state, offer.id);
  const hasMarket = !!state && countBuilding(state, "market") > 0;
  const rows = stallStatusRows({
    give: offer.give,
    get: offer.get,
    resources: state?.resources,
    hasMarket,
  });
  const goods = getOfferGoodsKind(offer);
  const stockRow = rows.find((r) => r.kind === "stock");
  const lastLot = stockRow?.tone === "warn";

  return (
    <div className={`sc-offer-card${ok ? "" : " is-off"}`}>
      <MarketLivingUnderlay
        goods={goods}
        hasMarket={hasMarket}
        open={ok}
        lastLot={lastLot}
      />
      <StallStatus rows={rows} />
      <MarketLivingGlyph
        goods={goods}
        hasMarket={hasMarket}
        open={ok}
        lastLot={lastLot}
      />
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
