import React from "react";
import { canTrade, tryTrade, type GameState } from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { ResourcePip, type ResourceKind } from "./ResourcePip";
import "./resource-pip.css";
import "./offer-card.css";

type Offer = { id: string; give: Record<string, string>; get: Record<string, string> };

const PIP_KINDS: readonly string[] = ["food", "wood", "stone", "gold"];

function Side(props: { amounts: Record<string, string>; state?: GameState; checkHave?: boolean }) {
  const { amounts, state, checkHave } = props;
  return (
    <span className="sc-offer-side">
      {Object.entries(amounts).map(([res, amt]) => {
        const short = checkHave && state ? Number(state.resources[res] ?? "0") < Number(amt) : false;
        return (
          <span key={res} className={`sc-offer-amt${short ? " is-short" : ""}`}>
            {PIP_KINDS.includes(res) ? <ResourcePip resource={res as ResourceKind} className="sc-offer-pip" /> : null}
            <span>
              {amt} {res}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** One market offer: what you give, what you get, Trade. Disabled when it cannot be paid. */
export function OfferCard(props: { state: GameState | undefined; offer: Offer; act: ActFn }) {
  const { state, offer, act } = props;
  const ok = !!state && canTrade(state, offer.id);
  return (
    <div className={`sc-offer-card${ok ? "" : " is-off"}`}>
      <span className="sc-offer-row">
        <span className="sc-offer-tag">Give</span>
        <Side amounts={offer.give} state={state} checkHave />
      </span>
      <span className="sc-offer-row">
        <span className="sc-offer-tag">Get</span>
        <Side amounts={offer.get} />
      </span>
      <button
        type="button"
        className="sc-offer-btn"
        disabled={!ok}
        onClick={() => act((st) => (tryTrade(st, offer.id) ? "Trade complete." : "Cannot trade."))}
      >
        Trade
      </button>
    </div>
  );
}
