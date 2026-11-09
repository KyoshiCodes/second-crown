import React from "react";
import { DECREES, decreeUntil, tryDecree, type GameState } from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { ResourcePip, type ResourceKind } from "./ResourcePip";
import { WaxSealPip } from "./WaxSealPip";
import { decreeLedgerRows, decreeStatus } from "./DecreeLedger";
import { DecreeLivingRows } from "./DecreeLivingRows";
import { DecreeLivingGlyph, DecreeLivingUnderlay } from "./DecreeLivingGlyph";
import "./resource-pip.css";
import "./decree-card.css";
import "./decree-living.css";
import "./decree-glyph-living.css";

type Decree = (typeof DECREES)[number];

const PIP_KINDS: readonly string[] = ["food", "wood", "stone", "gold"];

/**
 * One royal decree card with a 24px wax-seal pip:
 * - Opens with a living head (DecreeLivingRows): wax seal in a tinted chip beside stacked
 *   Name / Duration / Effect rows built by decreeLedgerRows(), then cost with ResourcePips and Issue action.
 * - Active decree has a lit, glowing molten wax seal with ambient underlay watermark and living status strip.
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
  const status = decreeStatus({ hasState: !!state, left, affordable });

  return (
    <div className={`sc-decree-card is-living sc-decree-living-card ${tone}`} data-decree={decree.id} data-active={active}>
      <DecreeLivingUnderlay decreeId={decree.id} status={status} left={left} ticks={decree.ticks} />
      <DecreeLivingRows
        decreeId={decree.id}
        status={status}
        rows={decreeLedgerRows({ name: decree.name, blurb: decree.blurb, status, left, ticks: decree.ticks }).map((r) =>
          r.kind === "name" ? { ...r, lead: <WaxSealPip active={active} decreeId={decree.id} size={24} /> } : r,
        )}
      />
      <DecreeLivingGlyph decreeId={decree.id} status={status} left={left} ticks={decree.ticks} />
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

export const DecreeLivingCard = DecreeCard;
