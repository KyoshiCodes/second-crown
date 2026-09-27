import React from "react";
import { DECREES, decreeUntil, tryDecree, type GameState } from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { ResourcePip, type ResourceKind } from "./ResourcePip";
import "./resource-pip.css";
import "./decree-card.css";

type Decree = (typeof DECREES)[number];

const PIP_KINDS: readonly string[] = ["food", "wood", "stone", "gold"];

/** One royal decree: name, cost, time left while active, Issue. Uses tryDecree as-is. */
export function DecreeCard(props: { state: GameState | undefined; decree: Decree; act: ActFn }) {
  const { state, decree, act } = props;
  const left = state ? decreeUntil(state, decree.id) : 0;
  const active = left > 0;
  const cost = Object.entries(decree.cost) as [string, string][];
  const affordable = !!state && cost.every(([res, amt]) => Number(state.resources[res] ?? "0") >= Number(amt));
  const tone = active ? "is-active" : affordable ? "is-ready" : "is-off";
  return (
    <div className={`sc-decree-card ${tone}`}>
      <span className="sc-decree-head">
        <span className="sc-decree-name">{decree.name}</span>
        {active ? <span className="sc-decree-left">{Math.ceil(left / 10)}s left</span> : null}
      </span>
      <span className="sc-decree-blurb">{decree.blurb}</span>
      <span className="sc-decree-cost">
        {cost.map(([res, amt]) => {
          const short = !active && !!state && Number(state.resources[res] ?? "0") < Number(amt);
          return (
            <span key={res} className={`sc-decree-amt${short ? " is-short" : ""}`}>
              {PIP_KINDS.includes(res) ? <ResourcePip resource={res as ResourceKind} className="sc-decree-pip" /> : null}
              <span>
                {amt} {res}
              </span>
            </span>
          );
        })}
      </span>
      <button
        type="button"
        className="sc-decree-btn"
        disabled={!state || active}
        onClick={() => act((st) => (tryDecree(st, decree.id) ? `${decree.name} sworn.` : "Cannot afford, or already active."))}
      >
        {active ? "Already active" : "Issue"}
      </button>
    </div>
  );
}
