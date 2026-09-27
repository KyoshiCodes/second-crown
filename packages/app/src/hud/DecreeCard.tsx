import React from "react";
import { DECREES, decreeUntil, tryDecree, type GameState } from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { ResourcePip, type ResourceKind } from "./ResourcePip";
import { WaxSealPip } from "./WaxSealPip";
import "./resource-pip.css";
import "./decree-card.css";

type Decree = (typeof DECREES)[number];

const PIP_KINDS: readonly string[] = ["food", "wood", "stone", "gold"];

/**
 * One royal decree card with a 24px wax-seal pip:
 * - Shows name, blurb, cost with ResourcePips, seconds left while active, and Issue action.
 * - Active decree has a lit, glowing molten wax seal.
 * - Art strictly has pointer-events: none so clicks are never blocked.
 * Uses tryDecree as-is from sim.
 */
export function DecreeCard(props: { state: GameState | undefined; decree: Decree; act: ActFn }) {
  const { state, decree, act } = props;
  const left = state ? decreeUntil(state, decree.id) : 0;
  const active = left > 0;
  const cost = Object.entries(decree.cost) as [string, string][];
  const affordable = !!state && cost.every(([res, amt]) => Number(state.resources[res] ?? "0") >= Number(amt));
  const tone = active ? "is-active" : affordable ? "is-ready" : "is-off";

  return (
    <div className={`sc-decree-card ${tone}`} data-decree={decree.id} data-active={active}>
      <span className="sc-decree-head">
        <span className="sc-decree-title-group">
          <WaxSealPip active={active} decreeId={decree.id} size={24} />
          <span className="sc-decree-name">{decree.name}</span>
        </span>
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
